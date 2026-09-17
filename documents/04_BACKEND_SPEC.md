# VibeCoder Security Auditor AI — Backend Specification

## 1. Purpose

This document defines the backend implementation for the 3-hour MVP.

The backend receives a project ZIP, safely extracts it, discovers relevant files, runs the three security analyzers, normalizes findings, sends only relevant finding evidence to Ollama/Gemma 3 4B for explanation, calculates the MVP security score, and returns the final report.

The implementation should prioritize **speed, reliability, and demoability over sophistication**.

---

# 2. Backend Stack

- **Python**
- **FastAPI**
- Python standard library where possible
- Custom lightweight scanner rules
- **Ollama**
- **Gemma 3 4B**
- No database

---

# 3. Backend Pipeline

```text
ZIP Upload
    ↓
Validation
    ↓
Secure Extraction
    ↓
File Discovery
    ↓
Language Detection
    ↓
Security Analyzers
    ↓
Finding Normalization
    ↓
LLM Explanation
    ↓
Security Score
    ↓
API Response
    ↓
Cleanup
```

---

# 4. API Endpoint

## POST `/api/v1/scan`

The MVP uses a **synchronous scan request**.

```text
POST /api/v1/scan
        ↓
Receive ZIP
        ↓
Scan project
        ↓
Run Gemma explanations
        ↓
Calculate score
        ↓
Return complete report
```

Request:

```text
Content-Type: multipart/form-data

file = project.zip
```

The backend should not require authentication.

---

# 5. ZIP Validation

## 5.1 Maximum ZIP Size

Maximum uploaded ZIP size:

```text
10 MB
```

If the uploaded ZIP exceeds this limit, reject it before scanning.

Error example:

```json
{
  "error": "ZIP file exceeds the 10 MB limit."
}
```

---

## 5.2 Maximum Extracted File Count

Maximum extracted files:

```text
5,000 files
```

If extraction would result in more than 5,000 files, stop and return an error.

This prevents unnecessarily large projects from consuming the scanner's limited resources.

---

## 5.3 Maximum Extracted Size

Maximum total extracted size:

```text
50 MB
```

A ZIP can be small while expanding into a much larger directory.

The backend should track the total uncompressed size and reject the archive if it exceeds 50 MB.

---

# 6. Secure ZIP Extraction

The uploaded ZIP must be treated as untrusted input.

## ZIP Slip Protection

Before extracting each member, verify that its final extraction path remains inside the temporary extraction directory.

Reject paths such as:

```text
../../../../etc/passwd
```

or equivalent absolute/path traversal attempts.

The backend must never allow an archive member to write outside the temporary directory.

If a malicious path is detected:

```text
Reject scan
```

Example:

```json
{
  "error": "Unsafe ZIP path detected."
}
```

---

# 7. Temporary Storage

Use Python:

```python
tempfile.TemporaryDirectory()
```

Example flow:

```text
Request
  ↓
TemporaryDirectory()
  ↓
Extract ZIP
  ↓
Scan
  ↓
Generate report
  ↓
Temporary directory automatically cleaned
```

No permanent project storage is required.

---

# 8. File Discovery

After extraction, recursively walk the project directory.

## Files to analyze

```text
.py
.js
.jsx
.ts
.tsx
.json
.env
.env.*
```

## Ignored directories

```text
.git/
node_modules/
venv/
.venv/
__pycache__/
dist/
build/
.next/
```

The ignore list should be implemented simply.

Do not spend significant hackathon time creating a comprehensive ignore database.

---

# 9. Hidden Files

Hidden files must not automatically be ignored.

This is important because files such as:

```text
.env
.env.local
.env.production
```

may contain credentials.

Therefore:

```text
Hidden file
    ↓
Is it a relevant supported file?
    ↓
Yes → Scan
```

---

# 10. Language Detection

No external language-detection library is required.

Use file extensions.

```text
.py        → Python
.js        → JavaScript
.jsx       → JavaScript
.ts        → TypeScript
.tsx       → TypeScript
```

Configuration files such as `.env` and `.json` can be handled directly by the relevant scanner.

This keeps language detection trivial and fast.

---

# 11. Scanner Engine

Recommended structure:

```text
backend/
├── main.py
├── api/
│   └── scan.py
├── scanner/
│   ├── engine.py
│   ├── secrets.py
│   ├── sql_injection.py
│   └── idor.py
├── llm/
│   └── explainer.py
├── models/
│   └── finding.py
└── utils/
    ├── zip_handler.py
    └── file_discovery.py
```

This is a logical organization, not a requirement to build a large framework.

If time is extremely limited, some modules can be combined.

---

# 12. Scanner Execution

Run scanners sequentially.

```text
Secrets Scanner
      ↓
SQL Injection Scanner
      ↓
IDOR Scanner
```

This is simpler than introducing concurrency.

Each relevant file is analyzed independently where practical.

The scanner should not load the entire project into memory.

---

# 13. P0-1 Secrets Scanner

## Detection

Use:

- Filename rules
- Regular expressions
- Simple assignment patterns

Examples:

```text
API_KEY = "..."
PASSWORD = "..."
TOKEN = "..."
SECRET = "..."
```

Relevant environment files:

```text
.env
.env.local
.env.production
.env.*
```

## Finding behavior

A `.env` file itself can produce a finding:

```text
Potentially Exposed Environment File
```

Secret-looking values produce:

```text
Hardcoded Secret
```

## Severity

```text
Critical
```

## Evidence

Secret values must be redacted.

Example source:

```python
API_KEY = "sk-demo-123456"
```

Finding evidence:

```text
API_KEY = [REDACTED]
```

The actual secret should not be sent to the LLM.

---

# 14. P0-2 SQL Injection Scanner

## Supported languages

- Python
- JavaScript
- TypeScript

## Detection

Use:

- Regular expressions
- Simple code-context rules

Detect obvious unsafe SQL construction.

Examples:

```python
query = "SELECT * FROM users WHERE id=" + user_id
```

```python
query = f"SELECT * FROM users WHERE name='{name}'"
```

```javascript
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

## Safe query handling

Obvious parameterized queries should be ignored where practical.

Example:

```python
cursor.execute(
    "SELECT * FROM users WHERE id = %s",
    (user_id,)
)
```

The scanner does not need to implement complete SQL data-flow analysis.

## Finding

```text
Title: Potential SQL Injection
Severity: Critical
```

Confidence can be:

```text
High
Medium
Low
```

depending on how clearly the pattern matches.

---

# 15. P0-3 IDOR / Authorization Scanner

## Detection

Use:

- Regex
- Lightweight structural checks

Look for:

```text
User-controlled resource identifier
       ↓
Resource/database lookup
       ↓
No obvious authorization/ownership check
```

Example:

```python
@app.get("/orders/{order_id}")
def get_order(order_id):
    order = Order.query.get(order_id)
    return order
```

Report:

```text
Title: Potential Authorization Vulnerability
Severity: High
```

## Authorization detection

The MVP uses a simple absence-of-check heuristic.

It does not attempt to understand every authorization framework.

Obvious ownership checks such as:

```python
if order.user_id != current_user.id:
    raise HTTPException(status_code=403)
```

can prevent the finding.

## Important limitation

The result is:

> **Potential Authorization Vulnerability**

not:

> Confirmed IDOR

because static analysis cannot reliably prove IDOR in every application.

---

# 16. Finding Normalization

All scanners must produce a common Finding structure.

## Final Finding Schema

```json
{
  "id": "SEC-001",
  "type": "hardcoded_secret",
  "title": "Hardcoded Secret",
  "severity": "critical",
  "confidence": "high",
  "file": "config.py",
  "line": 5,
  "evidence": "API_KEY = \"REDACTED\"",
  "code_context": {
    "start_line": 1,
    "lines": [
      "import os",
      "",
      "DEBUG = True",
      "",
      "API_KEY = \"REDACTED\""
    ]
  },
  "description": "",
  "impact": "",
  "recommendation": ""
}
```

### `code_context` calculation

When the scanner detects a finding at line $N$ in a source file:

```python
lines = source.splitlines()
start = max(1, line_number - 5)
end = min(len(lines), line_number + 5)
code_context = {
    "start_line": start,
    "lines": lines[start - 1:end]
}
```

## Field definitions

### `id`

Sequential ID for the current scan:

```text
SEC-001
SEC-002
SEC-003
```

### `type`

Machine-readable vulnerability category:

```text
hardcoded_secret
exposed_env
sql_injection
potential_idor
```

### `title`

Human-readable finding name.

Examples:

```text
Hardcoded API Secret
Potentially Exposed Environment File
Potential SQL Injection
Potential Authorization Vulnerability
```

### `severity`

Fixed MVP value:

```text
critical
high
```

### `confidence`

One of:

```text
high
medium
low
```

### `file`

Relative path from the extracted project root.

### `line`

Single line number.

The MVP does not require line ranges.

### `evidence`

Small relevant code snippet.

Secrets must be redacted.

### `description`

AI-generated explanation of what is wrong.

### `impact`

AI-generated potential impact.

### `recommendation`

AI-generated recommended fix.

---

# 17. Severity Rules

Severity is determined by the scanner.

```text
Hardcoded secret / exposed .env → Critical
SQL injection                  → Critical
Potential IDOR                 → High
```

Gemma must not override these values.

---

# 18. LLM Explanation Service

## Model

```text
Ollama
  ↓
Gemma 3 4B
```

## Role

Gemma is only an **explanation engine**.

It does not scan the project.

It does not receive the entire project.

It does not decide whether the scanner found a vulnerability.

It does not determine severity.

---

# 19. LLM Input

For every finding, send only the necessary information.

Example:

```json
{
  "type": "sql_injection",
  "severity": "critical",
  "confidence": "medium",
  "file": "users.py",
  "line": 42,
  "code": "query = f"SELECT ... {name}""
}
```

The LLM should not receive:

```text
Entire ZIP
Entire repository
Unrelated files
Unrelated source code
Actual secret values
```

---

# 20. LLM Output

Gemma must return valid JSON with exactly these fields:

```json
{
  "description": "...",
  "impact": "...",
  "recommendation": "..."
}
```

Gemma is strictly responsible for explanations (`description`, `impact`, `recommendation`). It must not generate or mutate `id`, `type`, `severity`, `confidence`, `file`, `line`, `evidence`, `code_context`, or the security score.

---

# 21. LLM Prompt Principle

The backend constructs a prompt providing only the detected finding details and requires valid JSON output.

Prompt format:

```text
You are explaining a security finding detected by a static scanner.
Do not create new vulnerabilities.
Do not change severity.
Do not change confidence.
Do not claim potential findings are confirmed.
Only explain the supplied finding and evidence.
Return valid JSON with exactly these fields:
{
  "description": "...",
  "impact": "...",
  "recommendation": "..."
}
```

This keeps the small local model focused on explanation.

---

# 22. LLM Processing

For each finding:

```text
Finding
   ↓
Prepare small evidence
   ↓
Call Ollama
   ↓
Gemma 3 4B
   ↓
Parse JSON
   ↓
Merge explanation into Finding
```

For the prepared hackathon demo project, explain every finding.

There is no need to implement sophisticated batching or queue infrastructure.

---

# 23. LLM Failure Handling & Predefined Fallbacks

Ollama is optional for scan completion. If Ollama fails, times out (15 seconds per finding), returns invalid JSON, or is unavailable, the scanner must use a predefined fallback explanation.

```text
Scanner Finding
      ↓
Try Gemma (15s timeout)
      |
   +--+--+
   |     |
Success Failure / Timeout / Invalid JSON
   |     |
   v     v
AI      Predefined Fallback
text    Explanation
```

### Timeout & Backend Flow

```python
finding = scanner_result
fallback = get_fallback_explanation(finding["type"])
try:
    llm_result = generate_with_gemma(finding, timeout=15)
    if valid_llm_result(llm_result):
        explanation = llm_result
    else:
        explanation = fallback
except Exception:
    explanation = fallback

finding["description"] = explanation["description"]
finding["impact"] = explanation["impact"]
finding["recommendation"] = explanation["recommendation"]
```

### Predefined Fallbacks

#### 1. SQL Injection (`sql_injection`)

```json
{
  "description": "User-controlled input appears to be inserted directly into an SQL query.",
  "impact": "An attacker may be able to manipulate the SQL query and potentially access or modify database information.",
  "recommendation": "Use parameterized queries or prepared statements instead of constructing SQL with user input."
}
```

#### 2. Hardcoded Secret (`hardcoded_secret` / `exposed_env`)

```json
{
  "description": "A credential or secret appears to be hardcoded in the source code.",
  "impact": "Anyone who gains access to the source code may be able to use the exposed credential.",
  "recommendation": "Move the secret to a secure environment-variable or secret-management system and rotate the exposed credential."
}
```

#### 3. Potential Authorization Vulnerability (`potential_idor`)

```json
{
  "description": "A user-controlled resource identifier appears to reach a resource lookup without an obvious ownership check.",
  "impact": "An attacker may potentially access another user's resource by changing the identifier.",
  "recommendation": "Verify that the authenticated user is authorized to access the requested resource before returning it."
}
```

---

# 24. Security Score

For the MVP, use a simple deterministic score.

Starting score:

```text
100
```

Deductions:

```text
Critical finding → -30
High finding     → -20
```

Minimum:

```text
0
```

Maximum:

```text
100
```

Example:

```text
2 Critical + 1 High

100 - 30 - 30 - 20 = 20
```

The score is calculated by the backend.

Gemma does not calculate the score.

The score should be presented as a simple MVP indicator, not as a guarantee of application security.

---

# 25. API Response

Example:

```json
{
  "status": "completed",
  "security_score": 20,
  "summary": {
    "total": 3,
    "critical": 2,
    "high": 1,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "id": "SEC-001",
      "type": "hardcoded_secret",
      "title": "Hardcoded Secret",
      "severity": "critical",
      "confidence": "high",
      "file": "config.py",
      "line": 5,
      "evidence": "API_KEY = \"REDACTED\"",
      "code_context": {
        "start_line": 1,
        "lines": [
          "import os",
          "",
          "DEBUG = True",
          "",
          "API_KEY = \"REDACTED\""
        ]
      },
      "description": "A credential or secret appears to be hardcoded in the source code.",
      "impact": "Anyone who gains access to the source code may be able to use the exposed credential.",
      "recommendation": "Move the secret to a secure environment-variable or secret-management system and rotate the exposed credential."
    },
    {
      "id": "SEC-002",
      "type": "sql_injection",
      "title": "Potential SQL Injection",
      "severity": "critical",
      "confidence": "medium",
      "file": "users.py",
      "line": 5,
      "evidence": "query = f\"SELECT * FROM users WHERE name='{name}'\"",
      "code_context": {
        "start_line": 1,
        "lines": [
          "from flask import request",
          "",
          "def get_user():",
          "    name = request.args.get('name')",
          "    query = f\"SELECT * FROM users WHERE name='{name}'\"",
          "    result = db.execute(query)",
          "    return result"
        ]
      },
      "description": "User-controlled input appears to be inserted directly into an SQL query.",
      "impact": "An attacker may be able to manipulate the SQL query and potentially access or modify database information.",
      "recommendation": "Use parameterized queries or prepared statements instead of constructing SQL with user input."
    },
    {
      "id": "SEC-003",
      "type": "potential_idor",
      "title": "Potential Authorization Vulnerability",
      "severity": "high",
      "confidence": "medium",
      "file": "account.py",
      "line": 5,
      "evidence": "account = Account.query.get(account_id)",
      "code_context": {
        "start_line": 1,
        "lines": [
          "from flask import jsonify",
          "",
          "def get_account(account_id):",
          "    account = Account.query.get(account_id)",
          "    return jsonify(account)"
        ]
      },
      "description": "A user-controlled resource identifier appears to reach a resource lookup without an obvious ownership check.",
      "impact": "An attacker may potentially access another user's resource by changing the identifier.",
      "recommendation": "Verify that the authenticated user is authorized to access the requested resource before returning it."
    }
  ]
}
```

---

# 26. Error Handling

Basic errors should return clear HTTP responses.

Examples:

### No file

```text
400 Bad Request
```

### Not a ZIP

```text
400 Bad Request
```

### ZIP too large

```text
413 Payload Too Large
```

### Too many files

```text
400 Bad Request
```

### Extracted size exceeded

```text
400 Bad Request
```

### Unsafe ZIP path

```text
400 Bad Request
```

### Unexpected scanner error

The backend should continue with other scanners where possible and log the error.

---

# 27. Cleanup

After the report has been generated:

```text
Return API response
      ↓
TemporaryDirectory cleanup
```

No uploaded project should be permanently stored.

---

# 28. Backend Definition of Done

The backend is complete when:

### ZIP

- Accepts a ZIP file
- Rejects oversized ZIPs
- Rejects unsafe ZIP paths
- Limits extracted file count
- Limits extracted size
- Extracts into a temporary directory

### File discovery

- Finds supported files
- Ignores unnecessary directories
- Detects language from extensions

### Scanner

- Detects hardcoded secrets/exposed `.env`
- Detects obvious SQL injection in Python/JS/TS
- Detects potential IDOR/authorization issues
- Produces normalized findings

### LLM

- Connects to Ollama
- Uses Gemma 3 4B
- Sends only finding evidence
- Returns structured explanations
- Does not scan the whole project
- Has fallback behavior

### Report

- Calculates deterministic score
- Counts findings by severity
- Returns complete JSON response

### Cleanup

- Removes temporary project data

---

# 29. Implementation Priority

If time is running out:

```text
1. POST /api/v1/scan
        ↓
2. ZIP extraction
        ↓
3. Secrets scanner
        ↓
4. SQLi scanner
        ↓
5. IDOR scanner
        ↓
6. Finding schema
        ↓
7. Gemma explanation
        ↓
8. Security score
        ↓
9. Error handling
        ↓
10. Extra cleanup/polish
```

Do not sacrifice the three core scanners for architectural polish.

---

# 30. Backend Principle

The backend should remain simple:

```text
Receive
  ↓
Extract
  ↓
Discover
  ↓
Detect
  ↓
Normalize
  ↓
Explain
  ↓
Score
  ↓
Return
  ↓
Cleanup
```

The purpose of the backend is to make this pipeline work reliably within the hackathon's 3-hour constraint.
