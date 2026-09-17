# VibeCoder Security Auditor AI --- Backend Developer Implementation Guide

## 1. Purpose

This document is the implementation handoff for the backend developer of
the **VibeCoder Security Auditor AI** hackathon MVP.

The backend is responsible for the complete server-side pipeline:

``` text
Frontend
   |
   | POST /api/v1/scan
   | multipart/form-data
   | file = project.zip
   v
FastAPI Backend
   |
   v
Validate ZIP
   |
   v
Safely Extract Project
   |
   v
Discover Relevant Source Files
   |
   v
Run Deterministic Security Scanners
   |
   +--> Hardcoded Secrets / Exposed .env
   +--> SQL Injection
   +--> Potential Authorization / IDOR
   |
   v
Structured Security Findings
   |
   v
Extract ONLY relevant evidence
   |
   v
Ollama
   |
   v
Gemma 3 4B
   |
   v
Explanation JSON
   |
   v
Merge scanner data + AI explanation
   |
   v
Calculate Security Score
   |
   v
Return Complete JSON Report
   |
   v
Frontend
```

The product goal is to let a founder upload an AI-generated project and
understand important security concerns before deploying it. The product
flow is explicitly upload → extract/analyze → scan → identify evidence →
AI explanation → report.

The MVP is intentionally designed to be buildable and demoable within
approximately 3 hours. Do not turn this into a production-grade security
platform.

------------------------------------------------------------------------

# 2. Source-of-Truth Documents

This implementation guide is derived from the project specification
documents:

-   `01_PROBLEM_AND_PRODUCT.md`
-   `02_MVP_PRD.md`
-   `03_SYSTEM_ARCHITECTURE.md`
-   `04_BACKEND_SPEC.md`
-   `05_API_CONTRACT.md`
-   `06_FRONTEND_SPEC.md`
-   `07_DEMO_PROJECT_SPEC.md`
-   `08_INTEGRATION_SPEC.md`

Important source decisions:

-   Backend: Python + FastAPI.
-   Security analysis: lightweight deterministic/static analysis.
-   LLM: Ollama + Gemma 3 4B.
-   No database.
-   Synchronous scan API.
-   ZIP is the only input format.
-   The LLM is an explanation layer, not the primary vulnerability
    detector.
-   The complete project must NOT be sent to Gemma.
-   Only the relevant finding evidence should be sent to Gemma.
-   Scanner-generated severity and confidence are authoritative.

------------------------------------------------------------------------

# 3. Backend Responsibilities

The backend developer owns all of the following:

## API

-   `GET /api/health`
-   `POST /api/v1/scan`

## ZIP processing

-   Receive uploaded ZIP.
-   Validate file type.
-   Enforce 10 MB compressed upload limit.
-   Validate ZIP archive.
-   Enforce maximum 5,000 extracted files.
-   Enforce maximum 50 MB extracted size.
-   Prevent ZIP Slip/path traversal.
-   Extract into a temporary directory.
-   Delete temporary project data after processing.

## File discovery

-   Recursively walk the extracted project.
-   Include supported source/configuration files.
-   Do not automatically ignore hidden files.
-   Ignore dependency/build directories where appropriate.
-   Detect language from file extension.

## Security scanners

Implement three deterministic scanners:

1.  Hardcoded secrets / exposed `.env`
2.  SQL injection
3.  Potential authorization vulnerability / IDOR

## Finding normalization

Every scanner must return the same finding structure.

## Evidence extraction

For each finding:

-   Determine exact file.
-   Determine actual line number dynamically.
-   Extract the relevant evidence.
-   Extract a small code context around the vulnerable line.
-   Redact secrets.

## LLM integration

-   Connect to local Ollama.
-   Use `gemma3:4b`.
-   Send only the relevant finding information.
-   Never send the complete ZIP/repository.
-   Never send actual secret values.
-   Validate Gemma's JSON response.
-   Use a predefined fallback if Ollama fails.

## Report generation

-   Merge scanner metadata and LLM explanation.
-   Calculate deterministic security score.
-   Calculate severity counts.
-   Return the agreed API response.

------------------------------------------------------------------------

# 4. Non-Negotiable Architecture Rules

## Rule 1 --- Scanner first

The deterministic scanner decides what was detected.

## Rule 2 --- AI explains

Gemma explains scanner findings. Gemma does not independently decide
whether a vulnerability exists.

## Rule 3 --- Small LLM context

Gemma receives only the finding type, severity, confidence, file, line,
and relevant evidence/code.

## Rule 4 --- Never send the whole project

Do not send:

-   Entire ZIP
-   Entire repository
-   Unrelated files
-   Unrelated source code
-   Full project context
-   Actual secret values

## Rule 5 --- Never execute uploaded code

The uploaded project is untrusted source-code data.

Never:

-   Run uploaded Python/JavaScript.
-   Install its dependencies.
-   Start its application.
-   Execute shell commands found in the project.
-   Import uploaded modules as part of scanning.

## Rule 6 --- No unnecessary infrastructure

Do not add:

-   Database
-   Redis
-   Celery
-   Message queues
-   Background workers
-   WebSockets
-   Authentication
-   Scan history
-   Cloud storage
-   Microservices

The MVP uses one FastAPI application.

------------------------------------------------------------------------

# 5. Recommended Backend Structure

Use this logical structure:

``` text
backend/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   └── scan.py
│   │
│   ├── scanner/
│   │   ├── engine.py
│   │   ├── secrets.py
│   │   ├── sql_injection.py
│   │   └── idor.py
│   │
│   ├── llm/
│   │   └── explainer.py
│   │
│   ├── models/
│   │   └── finding.py
│   │
│   └── utils/
│       ├── zip_handler.py
│       └── file_discovery.py
│
├── requirements.txt
└── .env
```

This is a logical organization, not a requirement to create a large
framework. If the hackathon clock becomes critical, modules can be
combined.

------------------------------------------------------------------------

# 6. Technology Stack

Use:

``` text
Python 3.12+
FastAPI
Uvicorn
Python standard library where practical
Ollama
Gemma 3 4B
```

The project does not require a database.

Temporary project data should be stored with Python's
temporary-directory functionality.

------------------------------------------------------------------------

# 7. Environment Variables

Backend `.env`:

``` env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

Do not require an OpenAI API key.

The expected architecture is:

``` text
FastAPI :8000
     |
     v
Ollama :11434
     |
     v
Gemma 3 4B
```

Ollama runs on the same PC as the backend in the primary hackathon
setup.

------------------------------------------------------------------------

# 8. API Endpoints

The MVP has exactly two important endpoints.

``` text
GET  /api/health
POST /api/v1/scan
```

There is no scan-history endpoint.

Do not implement:

``` text
GET /api/v1/scans/{scan_id}
DELETE /api/v1/scans/{scan_id}
```

------------------------------------------------------------------------

# 9. Health Endpoint

## `GET /api/health`

Purpose: allow the frontend/developer to confirm that FastAPI is
running.

Request:

``` text
GET /api/health
```

Response:

``` json
{
  "status": "ok"
}
```

HTTP status:

``` text
200 OK
```

The health endpoint only checks the backend itself. It does not need to
verify Ollama.

------------------------------------------------------------------------

# 10. Main Scan Endpoint

## `POST /api/v1/scan`

The frontend sends:

``` text
Content-Type: multipart/form-data
```

with:

``` text
file = project.zip
```

Example:

``` text
POST /api/v1/scan
```

The endpoint is synchronous.

The frontend waits for the complete response.

There is no:

-   scan ID
-   polling
-   WebSocket
-   background job
-   database

for the MVP.

------------------------------------------------------------------------

# 11. Complete Request-to-Response Pipeline

Implement this exact logical pipeline:

``` text
1. Receive ZIP
       ↓
2. Validate upload
       ↓
3. Validate ZIP archive
       ↓
4. Securely extract
       ↓
5. Discover relevant files
       ↓
6. Detect file languages
       ↓
7. Run Secrets Scanner
       ↓
8. Run SQL Injection Scanner
       ↓
9. Run Authorization/IDOR Scanner
       ↓
10. Normalize findings
       ↓
11. Calculate code context/evidence
       ↓
12. For each finding:
        ↓
      redact evidence
        ↓
      build small LLM request
        ↓
      call Gemma
        ↓
      validate JSON
        ↓
      use fallback if required
       ↓
13. Merge explanation into finding
       ↓
14. Calculate security score
       ↓
15. Calculate severity summary
       ↓
16. Build final API response
       ↓
17. Return JSON to frontend
       ↓
18. TemporaryDirectory cleanup
```

------------------------------------------------------------------------

# 12. ZIP Validation

Treat every uploaded ZIP as untrusted input.

## 12.1 ZIP-only input

Reject anything that is not a valid ZIP archive.

The backend is the authoritative validator even if the frontend also
checks the extension.

Return:

``` json
{
  "error": {
    "code": "INVALID_ZIP",
    "message": "The uploaded file is not a valid ZIP archive."
  }
}
```

HTTP:

``` text
400 Bad Request
```

------------------------------------------------------------------------

# 13. Maximum Upload Size

Maximum compressed ZIP size:

``` text
10 MB
```

If the uploaded ZIP exceeds 10 MB:

``` text
HTTP 413 Payload Too Large
```

Response:

``` json
{
  "error": {
    "code": "ZIP_TOO_LARGE",
    "message": "The uploaded ZIP exceeds the 10 MB limit."
  }
}
```

Reject before scanning.

------------------------------------------------------------------------

# 14. Maximum Extracted File Count

Maximum extracted files:

``` text
5,000
```

A ZIP may contain thousands of entries even when the compressed archive
is small.

Before/during extraction, track the number of extracted members.

If it exceeds 5,000:

``` json
{
  "error": {
    "code": "TOO_MANY_FILES",
    "message": "The extracted project exceeds the 5,000 file limit."
  }
}
```

HTTP:

``` text
400 Bad Request
```

------------------------------------------------------------------------

# 15. Maximum Extracted Size

Maximum total uncompressed size:

``` text
50 MB
```

This protects against ZIP bombs and unnecessarily large projects.

Track the total uncompressed size of archive members.

If the total exceeds 50 MB:

``` json
{
  "error": {
    "code": "EXTRACTED_SIZE_EXCEEDED",
    "message": "The extracted project exceeds the 50 MB limit."
  }
}
```

HTTP:

``` text
400 Bad Request
```

------------------------------------------------------------------------

# 16. Secure ZIP Extraction

The ZIP contents must never be allowed to write outside the temporary
extraction directory.

Protect against ZIP Slip/path traversal.

Reject entries such as:

``` text
../../../../etc/passwd
```

Also reject equivalent absolute or traversal paths.

Logical algorithm:

``` text
ZIP member
   ↓
Resolve target extraction path
   ↓
Resolve temporary directory path
   ↓
Verify target remains inside temporary directory
   ↓
Safe → extract
Unsafe → reject entire scan
```

Unsafe response:

``` json
{
  "error": {
    "code": "UNSAFE_ZIP",
    "message": "The uploaded ZIP contains an unsafe path."
  }
}
```

HTTP:

``` text
400 Bad Request
```

------------------------------------------------------------------------

# 17. Temporary Storage

Use a temporary directory for every scan.

Logical lifecycle:

``` text
Request
  ↓
Create temporary directory
  ↓
Extract project
  ↓
Scan
  ↓
Generate report
  ↓
Return response
  ↓
Delete temporary directory
```

Do not permanently store uploaded projects.

The project files must not remain on disk after the scan.

------------------------------------------------------------------------

# 18. File Discovery

Recursively walk the extracted project.

## Supported files

At minimum:

``` text
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

Ignore these where practical:

``` text
.git/
node_modules/
venv/
.venv/
__pycache__/
dist/
build/
.next/
```

The purpose is to reduce noise and avoid scanning dependencies/build
output.

Do not spend hackathon time creating a comprehensive ignore database.

------------------------------------------------------------------------

# 19. Hidden Files

Do not globally ignore hidden files.

This is important because:

``` text
.env
.env.local
.env.production
```

can contain credentials.

Therefore:

``` text
Hidden file
    ↓
Relevant supported file?
    ↓
Yes → scan it
```

------------------------------------------------------------------------

# 20. Language Detection

No external language-detection library is required.

Use file extensions:

``` text
.py  → Python
.js  → JavaScript
.jsx → JavaScript
.ts  → TypeScript
.tsx → TypeScript
```

`.env` and `.env.*` are handled by the secrets scanner.

`.json` may be inspected as configuration data where relevant.

------------------------------------------------------------------------

# 21. Scanner Engine

The scanner engine should orchestrate the three scanners.

Logical structure:

``` text
Scanner Engine
     |
     +---- Secrets Scanner
     |
     +---- SQL Injection Scanner
     |
     +---- IDOR Scanner
     |
     v
Finding[]
```

Run the scanners sequentially.

``` text
Secrets
   ↓
SQL Injection
   ↓
Authorization / IDOR
```

Do not introduce concurrency unless there is a demonstrated performance
problem.

The MVP prioritizes simplicity and predictable behavior.

------------------------------------------------------------------------

# 22. Finding IDs

Generate stable sequential finding IDs during normalization:

``` text
SEC-001
SEC-002
SEC-003
...
```

The ID belongs to the backend/scanner.

Gemma must never generate or modify the finding ID.

------------------------------------------------------------------------

# 23. Common Finding Schema

Every scanner must return a normalized finding.

Use:

``` json
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

The scanner owns:

``` text
id
type
title
severity
confidence
file
line
evidence
code_context
```

Gemma owns only:

``` text
description
impact
recommendation
```

------------------------------------------------------------------------

# 24. Finding Field Rules

## `id`

Example:

``` text
SEC-001
```

Generated by backend.

## `type`

Allowed MVP values:

``` text
hardcoded_secret
exposed_env
sql_injection
potential_idor
```

## `title`

Examples:

``` text
Hardcoded Secret
Potentially Exposed Environment File
Potential SQL Injection
Potential Authorization Vulnerability
```

## `severity`

Must come from deterministic backend rules.

Allowed values:

``` text
critical
high
medium
low
```

For the MVP:

``` text
Hardcoded Secret / exposed .env → critical
Potential SQL Injection           → critical
Potential Authorization / IDOR    → high
```

## `confidence`

Allowed values:

``` text
high
medium
low
```

Confidence describes how strongly the scanner's pattern supports the
finding.

Gemma must not change it.

## `file`

Relative path inside the uploaded project.

Example:

``` text
backend/users.py
```

## `line`

Actual line number calculated dynamically.

Never hardcode line numbers.

## `evidence`

Small relevant source fragment.

Secrets must be redacted.

## `code_context`

Small source window around the finding.

Recommended:

``` text
5 lines before
+
finding line
+
5 lines after
```

Do not send the entire source file.

------------------------------------------------------------------------

# 25. P0 Scanner 1 --- Hardcoded Secrets / Exposed `.env`

## Goal

Detect common potential credentials embedded in source/configuration.

Supported practical categories:

``` text
API keys
Passwords
Tokens
Secrets
```

Examples:

``` python
API_KEY = "sk-example-secret"
DATABASE_PASSWORD = "my-password"
AUTH_TOKEN = "example-token"
```

## Detection approach

Use:

-   Filename rules
-   Regular expressions
-   Simple assignment patterns

Examples:

``` text
API_KEY = "..."
PASSWORD = "..."
TOKEN = "..."
SECRET = "..."
```

Do not attempt to verify whether a credential is valid.

A demo credential may still be reported as a potential hardcoded secret.

------------------------------------------------------------------------

# 26. `.env` Detection

The following should be treated as potentially exposed:

``` text
.env
.env.local
.env.production
.env.*
```

An existing `.env` file itself can produce:

``` text
type:
exposed_env

title:
Potentially Exposed Environment File

severity:
critical
```

The backend does not need to prove that the file is committed to Git.

Its presence in the uploaded project is enough for this MVP finding.

------------------------------------------------------------------------

# 27. Secret Evidence Redaction

This is critical.

Input:

``` python
API_KEY = "sk-demo-123456"
```

Returned evidence:

``` text
API_KEY = "[REDACTED]"
```

Never return the raw secret to the frontend.

Never send the raw secret to Gemma.

Never place the raw secret in logs.

For `.env` content, redact values before they enter the
finding/evidence/LLM pipeline.

------------------------------------------------------------------------

# 28. Secrets Finding

Expected metadata:

``` text
type: hardcoded_secret
title: Hardcoded Secret
severity: critical
confidence: high/medium
file: <relative path>
line: <dynamic line>
evidence: <redacted>
```

For `.env`:

``` text
type: exposed_env
title: Potentially Exposed Environment File
severity: critical
confidence: high
file: .env
line: appropriate line or null
evidence: redacted
```

------------------------------------------------------------------------

# 29. P0 Scanner 2 --- SQL Injection

## Goal

Detect obvious unsafe SQL construction where user-controlled/dynamic
input is directly inserted into SQL.

Supported languages:

``` text
Python
JavaScript
TypeScript
```

The MVP is not a complete SQL data-flow analyzer.

It is a deterministic detector for obvious vulnerable patterns.

------------------------------------------------------------------------

# 30. SQL Injection Pattern 1 --- String Concatenation

Detect patterns such as:

``` python
query = "SELECT * FROM users WHERE id=" + user_id
```

Logical condition:

``` text
SQL query
+
dynamic value
+
unsafe string concatenation
=
Potential SQL Injection
```

------------------------------------------------------------------------

# 31. SQL Injection Pattern 2 --- Python f-string

Detect:

``` python
query = f"SELECT * FROM users WHERE name='{name}'"
```

The scanner should identify:

-   SQL query
-   f-string interpolation
-   dynamic variable

and create:

``` text
type: sql_injection
title: Potential SQL Injection
severity: critical
```

------------------------------------------------------------------------

# 32. SQL Injection Pattern 3 --- JavaScript/TypeScript Template Literal

Detect:

``` javascript
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

Look for:

``` text
SQL query
+
template literal
+
${...}
```

------------------------------------------------------------------------

# 33. Safe SQL Handling

Avoid obvious false positives where the query is parameterized.

Example:

``` python
cursor.execute(
    "SELECT * FROM users WHERE id = %s",
    (user_id,)
)
```

The MVP does not need to understand every database driver.

The goal is to recognize obvious safe parameterized-query patterns where
practical.

------------------------------------------------------------------------

# 34. SQL Finding

Expected:

``` text
type: sql_injection
title: Potential SQL Injection
severity: critical
confidence: medium/high
file: <relative path>
line: <dynamic line>
evidence: <small source fragment>
```

Do not include exploit payloads in the report.

------------------------------------------------------------------------

# 35. P0 Scanner 3 --- Potential Authorization / IDOR

## Goal

Detect simple patterns where a user-controlled resource identifier
reaches a resource lookup without an obvious ownership/authorization
check.

Logical pattern:

``` text
User-controlled resource ID
          +
Resource/database lookup
          +
No obvious authorization/ownership check
          ↓
Potential Authorization Vulnerability
```

Example:

``` python
@app.get("/orders/{order_id}")
def get_order(order_id):
    order = Order.query.get(order_id)
    return order
```

------------------------------------------------------------------------

# 36. Important IDOR Limitation

The scanner cannot reliably prove that an IDOR exists from simple static
analysis.

Therefore the title MUST be:

``` text
Potential Authorization Vulnerability
```

Do NOT use:

``` text
Confirmed IDOR
```

The scanner is identifying suspicious authorization patterns, not
proving exploitability.

------------------------------------------------------------------------

# 37. Authentication vs Authorization

Do not treat authentication as equivalent to authorization.

Authentication asks:

``` text
Who are you?
```

Authorization asks:

``` text
Are you allowed to access this specific resource?
```

Example:

``` python
@require_auth
@app.get("/users/{user_id}")
def get_user(user_id):
    return get_user_from_db(user_id)
```

The presence of authentication does not automatically eliminate the
potential authorization finding.

------------------------------------------------------------------------

# 38. Obvious Authorization Check

Avoid reporting an obvious ownership check such as:

``` python
order = Order.query.get(order_id)

if order.user_id != current_user.id:
    raise HTTPException(status_code=403)

return order
```

The MVP only needs lightweight structural recognition.

Do not attempt to understand every authorization framework.

------------------------------------------------------------------------

# 39. IDOR Finding

Expected:

``` text
type: potential_idor
title: Potential Authorization Vulnerability
severity: high
confidence: medium
file: <relative path>
line: <resource lookup line>
evidence: <small source fragment>
```

------------------------------------------------------------------------

# 40. Dynamic Line Numbers

Line numbers must always be calculated from the actual uploaded file.

Never implement:

``` text
config.py → line 5
users.py  → line 5
account.py → line 5
```

as fixed scanner logic.

Instead:

``` text
Read source
   ↓
splitlines()
   ↓
detect matching line
   ↓
return actual line number
```

This allows the demo source files to change without breaking the
scanner.

------------------------------------------------------------------------

# 41. Code Context

For a finding at line `N`, use approximately:

``` text
N - 5
through
N + 5
```

bounded by the beginning/end of the file.

Example:

``` python
lines = source.splitlines()

start = max(1, line_number - 5)
end = min(len(lines), line_number + 5)

code_context = {
    "start_line": start,
    "lines": lines[start - 1:end]
}
```

For secrets:

-   redact the vulnerable value in `evidence`
-   redact it in `code_context`
-   do not send it to Gemma
-   do not log it

------------------------------------------------------------------------

# 42. Scanner Output Before LLM

The scanner should produce something like:

``` json
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
  "description": "",
  "impact": "",
  "recommendation": ""
}
```

At this stage, the scanner has not asked Gemma anything.

------------------------------------------------------------------------

# 43. LLM Architecture

The LLM is:

``` text
Ollama
   ↓
Gemma 3 4B
```

Gemma is an explanation engine.

It does NOT:

-   scan the repository
-   receive the entire repository
-   decide vulnerability type
-   decide severity
-   decide confidence
-   calculate the score
-   create new findings
-   modify scanner metadata

------------------------------------------------------------------------

# 44. Exact Information Sent to Gemma

For every finding, send only:

``` json
{
  "type": "sql_injection",
  "severity": "critical",
  "confidence": "medium",
  "file": "backend/users.py",
  "line": 42,
  "code": "query = f\"SELECT ... {name}\""
}
```

Optionally include the small `code_context` if needed for explanation,
but keep it limited to the relevant source area.

Never send:

``` text
Entire ZIP
Entire repository
Entire project
Unrelated files
Unrelated code
Actual secret values
```

The backend must enforce this separation.

------------------------------------------------------------------------

# 45. LLM Prompt

The backend should construct a prompt that clearly establishes Gemma's
role.

Recommended prompt:

``` text
You are explaining a security finding detected by a static security scanner.

The scanner has already identified the finding.
Do not perform a new repository-wide security scan.
Do not invent additional vulnerabilities.
Do not change the finding severity.
Do not change the scanner confidence.
Do not claim a potential finding is confirmed.
Only explain the supplied finding and evidence.

Explain:
1. What is wrong?
2. Why is it a security concern?
3. What could an attacker potentially do?
4. What could the potential impact be?
5. How should the developer fix it?

Return valid JSON with exactly these fields:

{
  "description": "...",
  "impact": "...",
  "recommendation": "..."
}

Scanner finding:
<INSERT SMALL STRUCTURED FINDING HERE>
```

The model must stay within the supplied finding.

------------------------------------------------------------------------

# 46. LLM Output Contract

Gemma must return exactly:

``` json
{
  "description": "...",
  "impact": "...",
  "recommendation": "..."
}
```

Do not allow the LLM to return:

``` text
id
type
title
severity
confidence
file
line
evidence
code_context
security_score
```

Those fields belong to the scanner/backend.

------------------------------------------------------------------------

# 47. LLM Response Validation

Do not blindly trust the raw Ollama response.

The backend should:

``` text
Ollama response
      ↓
Extract model response
      ↓
Parse JSON
      ↓
Verify valid JSON
      ↓
Verify required fields:
  description
  impact
  recommendation
      ↓
Valid → use it
Invalid → fallback
```

If Gemma returns additional unexpected fields, the backend can ignore
them and retain only the three allowed explanation fields.

------------------------------------------------------------------------

# 48. LLM Failure Handling

Ollama failure must NOT cause the entire scan to fail.

Possible failures:

-   Ollama unavailable
-   Model unavailable
-   Network/local connection error
-   Timeout
-   Invalid JSON
-   Empty response
-   Unexpected response structure

Use a timeout of approximately:

``` text
15 seconds per finding
```

Logical flow:

``` text
Finding
   ↓
Prepare evidence
   ↓
Try Gemma
   |
   +---- Success + valid JSON → AI explanation
   |
   +---- Failure/timeout/invalid JSON → predefined fallback
   ↓
Merge explanation
```

------------------------------------------------------------------------

# 49. Predefined LLM Fallback --- SQL Injection

Use:

``` json
{
  "description": "User-controlled input appears to be inserted directly into an SQL query.",
  "impact": "An attacker may be able to manipulate the SQL query and potentially access or modify database information.",
  "recommendation": "Use parameterized queries or prepared statements instead of constructing SQL with user input."
}
```

------------------------------------------------------------------------

# 50. Predefined LLM Fallback --- Hardcoded Secret / .env

For:

``` text
hardcoded_secret
exposed_env
```

use:

``` json
{
  "description": "A credential or secret appears to be hardcoded in the source code.",
  "impact": "Anyone who gains access to the source code may be able to use the exposed credential.",
  "recommendation": "Move the secret to a secure environment-variable or secret-management system and rotate the exposed credential."
}
```

For an exposed `.env`, wording can be adjusted to explicitly mention the
environment file while preserving the same concepts.

------------------------------------------------------------------------

# 51. Predefined LLM Fallback --- Authorization

For:

``` text
potential_idor
```

use:

``` json
{
  "description": "A user-controlled resource identifier appears to reach a resource lookup without an obvious ownership check.",
  "impact": "An attacker may potentially access another user's resource by changing the identifier.",
  "recommendation": "Verify that the authenticated user is authorized to access the requested resource before returning it."
}
```

------------------------------------------------------------------------

# 52. Merge Scanner + LLM Data

The backend must merge the two sources.

## Scanner provides

``` text
id
type
title
severity
confidence
file
line
evidence
code_context
```

## Gemma provides

``` text
description
impact
recommendation
```

Final finding:

``` json
{
  "id": "SEC-002",
  "type": "sql_injection",
  "title": "Potential SQL Injection",
  "severity": "critical",
  "confidence": "medium",
  "file": "users.py",
  "line": 5,
  "evidence": "query = f\"SELECT ...\"",
  "code_context": {
    "start_line": 1,
    "lines": []
  },
  "description": "User-controlled input appears to be inserted directly into an SQL query.",
  "impact": "An attacker may be able to manipulate the SQL query.",
  "recommendation": "Use parameterized queries or prepared statements."
}
```

------------------------------------------------------------------------

# 53. Security Score

The score is deterministic.

Start at:

``` text
100
```

Deduct:

``` text
Critical finding → -30
High finding     → -20
```

Minimum:

``` text
0
```

Maximum:

``` text
100
```

Example:

``` text
2 Critical + 1 High

100
- 30
- 30
- 20
= 20
```

Gemma must never calculate or modify the score.

The frontend only displays the backend score.

The score is an MVP indicator and must not be described as a guarantee
that the application is secure.

------------------------------------------------------------------------

# 54. Severity Summary

Return:

``` json
{
  "total": 3,
  "critical": 2,
  "high": 1,
  "medium": 0,
  "low": 0
}
```

Calculate this from the normalized findings.

Do not ask Gemma to calculate it.

------------------------------------------------------------------------

# 55. Final Successful API Response

The backend must return:

``` json
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
      "description": "...",
      "impact": "...",
      "recommendation": "..."
    }
  ]
}
```

The frontend should be able to render the entire report from this
response.

------------------------------------------------------------------------

# 56. No-Finding Response

If no supported vulnerability is detected, return a completed report.

Example:

``` json
{
  "status": "completed",
  "security_score": 100,
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": []
}
```

Important:

A no-finding result means:

``` text
No supported issue was detected.
```

It does NOT mean:

``` text
The application is completely secure.
```

------------------------------------------------------------------------

# 57. API Error Format

All errors should use:

``` json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message."
  }
}
```

Supported error codes:

``` text
INVALID_FILE
INVALID_ZIP
ZIP_TOO_LARGE
TOO_MANY_FILES
EXTRACTED_SIZE_EXCEEDED
UNSAFE_ZIP
SCAN_FAILED
```

------------------------------------------------------------------------

# 58. Error Mapping

## No file

``` text
400 Bad Request
```

``` json
{
  "error": {
    "code": "INVALID_FILE",
    "message": "A ZIP project file is required."
  }
}
```

## Invalid ZIP

``` text
400 Bad Request
```

## ZIP too large

``` text
413 Payload Too Large
```

## Too many files

``` text
400 Bad Request
```

## Extracted size exceeded

``` text
400 Bad Request
```

## Unsafe ZIP

``` text
400 Bad Request
```

## Unexpected backend failure

``` text
500 Internal Server Error
```

Use:

``` text
SCAN_FAILED
```

where appropriate.

------------------------------------------------------------------------

# 59. Scanner Failure Isolation

If one individual scanner fails, do not unnecessarily discard every
other scanner result.

Example:

``` text
Secrets Scanner
     ↓
success → findings

SQL Scanner
     ↓
error

IDOR Scanner
     ↓
success → findings
```

Where practical:

``` text
keep secrets findings
keep IDOR findings
log SQL scanner error
```

The MVP should prioritize returning useful results rather than failing
because one analyzer encountered an unexpected file.

------------------------------------------------------------------------

# 60. CORS

The frontend needs access to FastAPI.

For local development allow:

``` text
http://localhost:3000
```

For LAN mode, allow the frontend machine's origin, for example:

``` text
http://192.168.1.10:3000
```

Prefer configurable CORS origins.

Do not permanently hardcode an event-specific LAN IP.

The frontend must never call Ollama directly.

------------------------------------------------------------------------

# 61. Local Architecture

Recommended hackathon configuration:

``` text
┌──────────────────────────────────────────┐
│                 ONE LAPTOP               │
│                                          │
│  Next.js                                  │
│  localhost:3000                           │
│        │                                  │
│        │ HTTP                             │
│        ▼                                  │
│  FastAPI                                  │
│  localhost:8000                           │
│        │                                  │
│        │ HTTP                             │
│        ▼                                  │
│  Ollama                                   │
│  localhost:11434                          │
│        │                                  │
│        ▼                                  │
│  Gemma 3 4B                               │
└──────────────────────────────────────────┘
```

This is the preferred setup because it minimizes moving parts.

------------------------------------------------------------------------

# 62. LAN Mode

Only use LAN mode if the frontend and backend must run on different
laptops.

Example:

``` text
Frontend Laptop
192.168.1.10:3000
       |
       | HTTP
       v
Backend Laptop
192.168.1.20:8000
       |
       v
Ollama
192.168.1.20:11434
```

FastAPI may be started with:

``` bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Do not expose Ollama directly to the frontend.

The frontend always talks to FastAPI.

------------------------------------------------------------------------

# 63. Important Data-Flow Separation

The final architecture must remain:

``` text
                 PROJECT ZIP
                      |
                      v
                 FastAPI
                      |
             ┌────────┴────────┐
             v                 v
       Scanner Engine       Temporary Files
             |
             v
      Structured Finding
             |
             v
      Redacted Evidence
             |
             v
        Ollama/Gemma
             |
             v
       Explanation JSON
             |
             v
     Backend merges data
             |
             v
       Final Report JSON
             |
             v
          Frontend
```

The frontend never needs to know how the scanner or LLM works
internally.

------------------------------------------------------------------------

# 64. What the Frontend Expects

The frontend only needs:

``` text
GET  /api/health
POST /api/v1/scan
```

For scanning:

``` text
FormData
  |
  +-- file = project.zip
  |
  v
POST /api/v1/scan
  |
  v
JSON report
```

The frontend does not:

-   scan files
-   detect vulnerabilities
-   call Ollama
-   calculate the security score
-   determine severity

All of those are backend responsibilities.

------------------------------------------------------------------------

# 65. Demo Project Validation

The demo project is `VibeShop`.

Expected files include:

``` text
vibeshop/
├── app.py
├── config.py
├── users.py
├── account.py
├── products.py
├── safe_queries.py
├── requirements.txt
└── README.md
```

It intentionally contains one main finding from each category:

``` text
config.py
    → Hardcoded fake API key

users.py
    → SQL injection

account.py
    → Potential authorization vulnerability
```

Expected main findings:

``` text
SEC-001 → Hardcoded Secret
SEC-002 → Potential SQL Injection
SEC-003 → Potential Authorization Vulnerability
```

Line numbers must be calculated dynamically.

------------------------------------------------------------------------

# 66. Demo Secret Rules

The demo secret is intentionally fake.

Example:

``` python
STRIPE_API_KEY = "sk_test_FAKE_VIBESHOP_123456"
```

It must be treated as a demo credential.

Even though it is fake:

-   scanner should detect it
-   evidence should redact it
-   LLM should not receive it
-   frontend should not display the raw value

------------------------------------------------------------------------

# 67. Demo SQL Pattern

The demo contains a pattern like:

``` python
from flask import request

def search_users(db):
    name = request.args.get("name", "")
    query = f"SELECT * FROM users WHERE name = '{name}'"
    return db.execute(query).fetchall()
```

The scanner should identify the dynamic SQL construction and return:

``` text
Potential SQL Injection
```

with:

``` text
severity = critical
confidence = medium
```

------------------------------------------------------------------------

# 68. Demo Authorization Pattern

The demo contains a pattern like:

``` python
def get_order(order_id):
    order = Order.query.get(order_id)
    return jsonify(order)
```

The scanner should identify:

``` text
user-controlled identifier
+
resource lookup
+
no obvious ownership check
```

and return:

``` text
Potential Authorization Vulnerability
```

with:

``` text
severity = high
confidence = medium
```

Do not call this a confirmed IDOR.

------------------------------------------------------------------------

# 69. Backend Testing Checklist

Before integration, test the backend independently.

## Health

``` text
GET /api/health
```

Expected:

``` json
{
  "status": "ok"
}
```

## Valid demo ZIP

Expected:

``` text
3 findings
2 critical
1 high
```

## Invalid file

Test:

``` text
.txt
.pdf
.png
```

Expected:

``` text
INVALID_ZIP
```

or appropriate invalid-file handling.

## ZIP \> 10 MB

Expected:

``` text
ZIP_TOO_LARGE
```

## \> 5,000 files

Expected:

``` text
TOO_MANY_FILES
```

## \> 50 MB extracted

Expected:

``` text
EXTRACTED_SIZE_EXCEEDED
```

## ZIP Slip

Test an archive containing:

``` text
../../evil.txt
```

Expected:

``` text
UNSAFE_ZIP
```

## Secret redaction

Verify:

``` text
raw secret ≠ API response
raw secret ≠ LLM request
raw secret ≠ logs
```

## SQL injection

Verify obvious vulnerable examples are detected.

## Safe SQL

Verify obvious parameterized queries are not unnecessarily reported.

## Authorization

Verify missing ownership checks produce a potential finding.

## Safe authorization

Verify an obvious ownership check prevents the finding where practical.

## Ollama available

Verify Gemma explanations appear.

## Ollama unavailable

Stop Ollama and verify the scan still completes with fallback
explanations.

## Invalid Gemma JSON

Mock/force invalid output and verify fallback behavior.

## Cleanup

After the request completes, verify temporary project data is removed.

------------------------------------------------------------------------

# 70. Manual End-to-End Test

The most important test is:

``` text
Open frontend
      ↓
Upload vibeshop.zip
      ↓
POST /api/v1/scan
      ↓
Backend validates ZIP
      ↓
Backend extracts project
      ↓
Backend discovers files
      ↓
Secrets scanner detects SEC-001
      ↓
SQL scanner detects SEC-002
      ↓
IDOR scanner detects SEC-003
      ↓
Evidence is created/redacted
      ↓
Gemma receives finding-by-finding evidence
      ↓
Gemma returns explanations
      ↓
Backend merges explanations
      ↓
Backend calculates score
      ↓
Backend returns JSON
      ↓
Frontend displays report
```

The entire flow must work with the real demo ZIP.

------------------------------------------------------------------------

# 71. Definition of Done

The backend is complete when all of these are true.

## ZIP

-   [ ] Accepts ZIP uploads.
-   [ ] Rejects invalid files.
-   [ ] Enforces 10 MB compressed limit.
-   [ ] Enforces 5,000 extracted-file limit.
-   [ ] Enforces 50 MB extracted-size limit.
-   [ ] Prevents ZIP Slip.
-   [ ] Extracts to temporary storage.
-   [ ] Cleans temporary storage.

## File discovery

-   [ ] Finds `.py`.
-   [ ] Finds `.js`.
-   [ ] Finds `.jsx`.
-   [ ] Finds `.ts`.
-   [ ] Finds `.tsx`.
-   [ ] Finds `.json`.
-   [ ] Finds `.env`.
-   [ ] Finds `.env.*`.
-   [ ] Ignores dependency/build directories where appropriate.
-   [ ] Does not globally ignore hidden files.

## Security scanner

-   [ ] Detects hardcoded secrets.
-   [ ] Detects exposed `.env`.
-   [ ] Detects obvious SQL injection in Python.
-   [ ] Detects obvious SQL injection in JavaScript.
-   [ ] Detects obvious SQL injection in TypeScript.
-   [ ] Detects potential authorization/IDOR patterns.
-   [ ] Avoids obvious safe SQL where practical.
-   [ ] Avoids obvious ownership-check cases where practical.
-   [ ] Generates dynamic line numbers.
-   [ ] Generates code context.
-   [ ] Redacts secrets.

## LLM

-   [ ] Connects to Ollama.
-   [ ] Uses Gemma 3 4B.
-   [ ] Sends only relevant finding information.
-   [ ] Never sends the complete repository.
-   [ ] Never sends actual secret values.
-   [ ] Requires JSON output.
-   [ ] Validates the response.
-   [ ] Uses fallback explanations.
-   [ ] Does not allow Gemma to change severity/confidence.

## Report

-   [ ] Generates normalized findings.
-   [ ] Calculates severity summary.
-   [ ] Calculates deterministic security score.
-   [ ] Returns complete JSON.
-   [ ] Returns no-findings response correctly.

## API

-   [ ] `GET /api/health` works.
-   [ ] `POST /api/v1/scan` works.
-   [ ] CORS works with frontend.
-   [ ] Error responses use agreed format.

## Demo

-   [ ] `vibeshop.zip` produces the expected three finding categories.
-   [ ] Frontend receives the real response.
-   [ ] Gemma explanations are visible through the frontend.
-   [ ] The scan completes even if Ollama fails.

------------------------------------------------------------------------

# 72. Implementation Priority --- If Time Is Running Out

Use this exact priority:

``` text
1. POST /api/v1/scan
       ↓
2. ZIP validation/extraction
       ↓
3. Secrets scanner
       ↓
4. SQL injection scanner
       ↓
5. IDOR scanner
       ↓
6. Finding schema
       ↓
7. Evidence + code context
       ↓
8. Gemma explanation
       ↓
9. Fallback explanations
       ↓
10. Security score
       ↓
11. Error handling
       ↓
12. Cleanup/polish
```

Do NOT sacrifice the three scanners for architectural polish.

------------------------------------------------------------------------

# 73. What NOT to Build

For this hackathon MVP, do not spend time on:

``` text
User authentication
Login/signup
Database
Scan history
GitHub OAuth
GitHub repository scanning
Cloud deployment
CI/CD integration
Real-time scan progress
WebSockets
Background queues
Microservices
Advanced AST frameworks
Full taint/data-flow analysis
Complete OWASP coverage
Enterprise reporting
PDF reports
Email notifications
Billing
Admin dashboards
```

These do not materially improve the core 3-hour demo.

------------------------------------------------------------------------

# 74. Backend Developer Mental Model

Think of the backend as three systems connected together:

## System 1 --- Deterministic Scanner

``` text
Code
 ↓
Rules
 ↓
Evidence
 ↓
Finding
```

This answers:

> **"What did we detect?"**

## System 2 --- Explanation Engine

``` text
Finding
 ↓
Small evidence
 ↓
Gemma
 ↓
Explanation
```

This answers:

> **"What does this mean to the developer?"**

## System 3 --- Report API

``` text
Finding metadata
+
AI explanation
+
Score
+
Summary
 ↓
Frontend JSON
```

This answers:

> **"How do we present the result to the user?"**

Keep these responsibilities separate.

------------------------------------------------------------------------

# 75. Critical Security Principle

The most important backend rule is:

> **The uploaded project is data, not executable software.**

The backend should read the project as text and configuration.

It must never trust or execute anything inside the ZIP.

The second critical rule is:

> **Gemma explains evidence produced by the scanner; it does not replace
> the scanner.**

The third critical rule is:

> **Never expose secrets discovered during scanning.**

------------------------------------------------------------------------

# 76. Final Backend Architecture

The completed MVP should effectively be:

``` text
                  ┌──────────────────┐
                  │ Next.js Frontend │
                  └────────┬─────────┘
                           │
                    POST /api/v1/scan
                           │
                           ▼
                  ┌──────────────────┐
                  │ FastAPI Backend  │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │  ZIP Processor   │
                  │ Validate/Extract │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │  File Discovery  │
                  └────────┬─────────┘
                           │
              ┌────────────▼────────────┐
              │     Scanner Engine      │
              ├──────────┬──────────────┤
              │ Secrets  │ SQLi │ IDOR │
              └──────────┴──────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Normalized       │
                  │ Findings         │
                  └────────┬─────────┘
                           │
                    Redacted evidence
                           │
                           ▼
                  ┌──────────────────┐
                  │ Ollama           │
                  │ Gemma 3 4B       │
                  └────────┬─────────┘
                           │
                    Explanation JSON
                           │
                           ▼
                  ┌──────────────────┐
                  │ Report Builder   │
                  │ + Score          │
                  │ + Summary        │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ JSON Response    │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Next.js Frontend │
                  └──────────────────┘
```

The backend's job is therefore simple:

> **Receive → validate → extract → discover → scan → produce exact
> evidence → send only that evidence to Gemma → receive explanation →
> merge → score → return.**
