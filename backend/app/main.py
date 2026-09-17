from __future__ import annotations

import io
import json
import os
import re
import shutil
import tempfile
import urllib.error
import urllib.request
import zipfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_FILES = 5_000
MAX_EXTRACTED_BYTES = 50 * 1024 * 1024
SUPPORTED_SUFFIXES = {".py", ".js", ".jsx", ".ts", ".tsx", ".json"}
IGNORED_DIRECTORIES = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", ".next"}

app = FastAPI(title="VibeCoder Security Auditor AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):(?:3000|5173)",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@dataclass
class RawFinding:
    type: str
    title: str
    severity: str
    confidence: str
    file: str
    line: int
    evidence: str
    source_lines: list[str]
    redact_context: bool = False


FALLBACKS = {
    "hardcoded_secret": {
        "description": "A credential or secret appears to be hardcoded in the source code.",
        "impact": "Anyone who gains access to the source code may be able to use the exposed credential.",
        "recommendation": "Move the secret to a secure environment-variable or secret-management system and rotate the exposed credential.",
    },
    "exposed_env": {
        "description": "An environment file that may contain credentials is included in the project.",
        "impact": "Anyone who gains access to this file may be able to use credentials stored in it.",
        "recommendation": "Keep environment files out of source control, use deployment secrets, and rotate any exposed credentials.",
    },
    "sql_injection": {
        "description": "User-controlled input appears to be inserted directly into an SQL query.",
        "impact": "An attacker may be able to manipulate the SQL query and potentially access or modify database information.",
        "recommendation": "Use parameterized queries or prepared statements instead of constructing SQL with user input.",
    },
    "potential_idor": {
        "description": "A user-controlled resource identifier appears to reach a resource lookup without an obvious ownership check.",
        "impact": "An attacker may potentially access another user's resource by changing the identifier.",
        "recommendation": "Verify that the authenticated user is authorized to access the requested resource before returning it.",
    },
}

SECRET_ASSIGNMENT = re.compile(
    r"(?i)\b([A-Z][A-Z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|ACCESS[_-]?KEY)[A-Z0-9_]*)\b\s*([:=])\s*(['\"])([^'\"\r\n]+)\3"
)
ENV_VALUE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$")
SQL_WORDS = re.compile(r"\b(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|FROM|WHERE)\b", re.IGNORECASE)
ID_LOOKUP = re.compile(r"\b(?:[A-Za-z_][A-Za-z0-9_]*\.)?(?:query\.)?(?:get|find(?:_by_[a-z_]+)?|findOne|findByPk)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*(?:_id|id|uuid))\s*\)")


def api_error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return api_error(exc.status_code, exc.detail["code"], exc.detail["message"])
    return api_error(exc.status_code, "INVALID_FILE", str(exc.detail))


def fail(code: str, message: str, status: int = 400) -> None:
    raise HTTPException(status_code=status, detail={"code": code, "message": message})


async def read_upload(upload: UploadFile) -> bytes:
    chunks: list[bytes] = []
    size = 0
    while chunk := await upload.read(1024 * 1024):
        size += len(chunk)
        if size > MAX_UPLOAD_BYTES:
            fail("ZIP_TOO_LARGE", "The uploaded ZIP exceeds the 10 MB limit.", 413)
        chunks.append(chunk)
    return b"".join(chunks)


def safe_extract(data: bytes, destination: Path) -> None:
    try:
        archive = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile:
        fail("INVALID_ZIP", "The uploaded file is not a valid ZIP archive.")

    with archive:
        infos = archive.infolist()
        files = [info for info in infos if not info.is_dir()]
        if len(files) > MAX_FILES:
            fail("TOO_MANY_FILES", "The extracted project exceeds the 5,000 file limit.")
        if sum(info.file_size for info in files) > MAX_EXTRACTED_BYTES:
            fail("EXTRACTED_SIZE_EXCEEDED", "The extracted project exceeds the 50 MB expanded-size limit.")

        for info in infos:
            member = PurePosixPath(info.filename)
            # POSIX paths are mandated by the ZIP format; reject traversal, absolute paths, and links.
            is_link = (info.external_attr >> 16) & 0o170000 == 0o120000
            if member.is_absolute() or ".." in member.parts or is_link:
                fail("UNSAFE_ZIP", "Unsafe ZIP path detected.")
            target = (destination / Path(*member.parts)).resolve()
            if target != destination and destination not in target.parents:
                fail("UNSAFE_ZIP", "Unsafe ZIP path detected.")
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(info) as source, target.open("wb") as output:
                    shutil.copyfileobj(source, output)


def supported_file(path: Path) -> bool:
    name = path.name
    return name == ".env" or name.startswith(".env.") or path.suffix.lower() in SUPPORTED_SUFFIXES


def discover_files(root: Path) -> list[Path]:
    found: list[Path] = []
    for current, directories, names in os.walk(root):
        directories[:] = [d for d in directories if d not in IGNORED_DIRECTORIES]
        current_path = Path(current)
        for name in names:
            path = current_path / name
            if path.is_file() and supported_file(path):
                found.append(path)
    return sorted(found)


def redact_line(line: str) -> str:
    line = SECRET_ASSIGNMENT.sub(lambda m: line[m.start() : m.start(4)] + "[REDACTED]" + line[m.end(4) :], line)
    if "[REDACTED]" in line:
        return line
    match = ENV_VALUE.match(line)
    if match and re.search(r"(?i)(API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|ACCESS[_-]?KEY)", match.group(1)):
        return f"{match.group(1)}=[REDACTED]"
    return line


def secret_findings(file: str, lines: list[str], is_env: bool) -> list[RawFinding]:
    findings: list[RawFinding] = []
    if is_env:
        findings.append(RawFinding("exposed_env", "Potentially Exposed Environment File", "critical", "high", file, 1, f"Environment file: {file}", lines, True))
    for number, line in enumerate(lines, 1):
        match = SECRET_ASSIGNMENT.search(line)
        if match:
            evidence = line[: match.start(4)] + "[REDACTED]" + line[match.end(4) :]
            findings.append(RawFinding("hardcoded_secret", "Hardcoded Secret", "critical", "high", file, number, evidence, lines, True))
            continue
        env = ENV_VALUE.match(line) if is_env else None
        if env and re.search(r"(?i)(API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|ACCESS[_-]?KEY)", env.group(1)) and env.group(2).strip() not in {"", "${...}"}:
            findings.append(RawFinding("hardcoded_secret", "Hardcoded Secret", "critical", "high", file, number, f"{env.group(1)}=[REDACTED]", lines, True))
    return findings


def sql_findings(file: str, lines: list[str]) -> list[RawFinding]:
    if Path(file).suffix.lower() not in {".py", ".js", ".jsx", ".ts", ".tsx"}:
        return []
    findings: list[RawFinding] = []
    for number, line in enumerate(lines, 1):
        has_sql = bool(SQL_WORDS.search(line))
        python_f_string = bool(re.search(r"(?:f|F)['\"][^\n]*\{[^}]+\}[^\n]*['\"]", line))
        js_template = bool(re.search(r"`[^`]*\$\{[^}]+\}[^`]*`", line))
        concatenated = bool(re.search(r"(?:['\"][^\n]*(?:SELECT|INSERT|UPDATE|DELETE)[^\n]*['\"]\s*\+|\+\s*['\"][^\n]*(?:SELECT|INSERT|UPDATE|DELETE))", line, re.I))
        if has_sql and (python_f_string or js_template or concatenated):
            confidence = "high" if concatenated else "medium"
            findings.append(RawFinding("sql_injection", "Potential SQL Injection", "critical", confidence, file, number, line.strip(), lines))
    return findings


def idor_findings(file: str, lines: list[str]) -> list[RawFinding]:
    if Path(file).suffix.lower() not in {".py", ".js", ".jsx", ".ts", ".tsx"}:
        return []
    findings: list[RawFinding] = []
    for number, line in enumerate(lines, 1):
        if not ID_LOOKUP.search(line):
            continue
        nearby = "\n".join(lines[max(0, number - 6) : min(len(lines), number + 12)]).lower()
        has_ownership_check = ("current_user" in nearby or "req.user" in nearby or "request.user" in nearby) and any(
            marker in nearby for marker in ("owner", "user_id", "user.id", "account_id")
        ) and any(marker in nearby for marker in ("!=", "===", "==", "forbidden", "403"))
        if not has_ownership_check:
            findings.append(RawFinding("potential_idor", "Potential Authorization Vulnerability", "high", "medium", file, number, line.strip(), lines))
    return findings


def context_for(finding: RawFinding) -> dict[str, Any]:
    start = max(1, finding.line - 5)
    end = min(len(finding.source_lines), finding.line + 5)
    lines = finding.source_lines[start - 1 : end]
    if finding.redact_context:
        lines = [redact_line(line) for line in lines]
    return {"start_line": start, "lines": lines}


def explain_with_ollama(finding: dict[str, Any]) -> dict[str, str]:
    fallback = FALLBACKS[finding["type"]]
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "gemma3:4b")
    prompt = (
        "You are explaining a security finding detected by a static scanner. Do not create new vulnerabilities, "
        "change severity/confidence, or claim potential findings are confirmed. Return valid JSON with exactly "
        "description, impact, and recommendation. Explain only this sanitized finding:\n"
        + json.dumps({key: finding[key] for key in ("type", "severity", "confidence", "file", "line", "evidence")})
    )
    payload = json.dumps({"model": model, "prompt": prompt, "stream": False, "format": "json"}).encode()
    request = urllib.request.Request(f"{base_url}/api/generate", data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            generated = json.loads(json.loads(response.read().decode())["response"])
        if set(generated) == {"description", "impact", "recommendation"} and all(isinstance(v, str) and v.strip() for v in generated.values()):
            return generated
    except (OSError, ValueError, KeyError, urllib.error.URLError, urllib.error.HTTPError):
        pass
    return fallback


def scan_project(root: Path) -> list[dict[str, Any]]:
    source_files: list[tuple[str, list[str], bool]] = []
    for path in discover_files(root):
        relative = path.relative_to(root).as_posix()
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
            is_env = path.name == ".env" or path.name.startswith(".env.")
            source_files.append((relative, lines, is_env))
        except OSError:
            continue
    # Keep IDs stable and aligned with the documented scanner execution order.
    raw_findings = [finding for file, lines, is_env in source_files for finding in secret_findings(file, lines, is_env)]
    raw_findings.extend(finding for file, lines, _ in source_files for finding in sql_findings(file, lines))
    raw_findings.extend(finding for file, lines, _ in source_files for finding in idor_findings(file, lines))
    findings: list[dict[str, Any]] = []
    for index, raw in enumerate(raw_findings, 1):
        finding: dict[str, Any] = {
            "id": f"SEC-{index:03d}", "type": raw.type, "title": raw.title, "severity": raw.severity,
            "confidence": raw.confidence, "file": raw.file, "line": raw.line, "evidence": raw.evidence,
            "code_context": context_for(raw),
        }
        finding.update(explain_with_ollama(finding))
        findings.append(finding)
    return findings


def report(findings: list[dict[str, Any]]) -> dict[str, Any]:
    summary = {"total": len(findings), "critical": 0, "high": 0, "medium": 0, "low": 0}
    score = 100
    for finding in findings:
        severity = finding["severity"]
        summary[severity] += 1
        if severity == "critical":
            score -= 30
        elif severity == "high":
            score -= 20
    return {"status": "completed", "security_score": max(0, score), "summary": summary, "findings": findings}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/scan")
async def scan(file: UploadFile | None = File(default=None)) -> dict[str, Any]:
    if file is None or not file.filename:
        fail("INVALID_FILE", "A ZIP project file is required.")
    if not file.filename.lower().endswith(".zip"):
        fail("INVALID_ZIP", "The uploaded file is not a valid ZIP archive.")
    data = await read_upload(file)
    with tempfile.TemporaryDirectory(prefix="vibecoder-scan-") as directory:
        safe_extract(data, Path(directory).resolve())
        try:
            return report(scan_project(Path(directory).resolve()))
        except HTTPException:
            raise
        except Exception:
            return api_error(500, "SCAN_FAILED", "The project could not be scanned.")
