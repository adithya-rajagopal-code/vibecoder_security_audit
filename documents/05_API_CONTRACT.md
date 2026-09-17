# VibeCoder Security Auditor AI — API Contract

## 1. Purpose

This document is the communication contract between the frontend and backend.

Both developers must implement against this contract so the frontend and backend can be developed independently and integrated quickly.

The MVP uses a simple synchronous API because the entire project must be buildable within 3 hours.

---

# 2. Base URLs

## Backend

```text
http://localhost:8000
```

When running across two laptops on the same Wi-Fi, replace `localhost` with the backend laptop's LAN IP.

Example:

```text
http://192.168.1.25:8000
```


## Frontend

```text
http://localhost:3000
```

The frontend must use a configurable backend base URL rather than hardcoding the backend IP throughout the application.

Example:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For the final demo, this can be changed to the backend laptop's LAN IP if required.

---

# 3. API Endpoints

The MVP has only two endpoints.

```text
GET  /api/health
POST /api/v1/scan
```

There is no scan database and therefore no scan retrieval or delete endpoint.

Not included:

```text
GET /api/v1/scans/{scan_id}
DELETE /api/v1/scans/{scan_id}
```

---

# 4. Health Endpoint

## GET `/api/health`

Used by the frontend/developers to verify that the FastAPI backend is running.

### Request

No request body.

### Success

HTTP `200 OK`

```json
{
  "status": "ok"
}
```

The health endpoint checks the backend itself.

It does not need to verify Ollama.

---

# 5. Scan Endpoint

## POST `/api/v1/scan`

Uploads and scans a project ZIP.

The endpoint is synchronous.

```text
POST /api/v1/scan
        |
        v
Validate ZIP
        |
        v
Extract
        |
        v
Discover files
        |
        v
Run security scanners
        |
        v
Normalize findings
        |
        v
Generate Gemma explanations
        |
        v
Calculate security score
        |
        v
Return complete report
```

The frontend waits for the complete response.

---

# 6. Upload Request

### Content-Type

```text
multipart/form-data
```

### Field

```text
file
```

### Example

```text
POST /api/v1/scan

file = project.zip
```

Only ZIP files are accepted.

---

# 7. Successful Response

HTTP:

```text
200 OK
```

Response:

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

# 8. Finding Object

The finding object is the central data structure shared between the scanner, LLM layer, backend, and frontend.

Important distinction:

> This is the **VibeCoder backend API finding/report structure**. It is not the raw API response format of Ollama.

Ollama/Gemma receives a smaller explanation request and returns explanation content. The backend then merges that explanation into this finding structure.

## Finding schema

```json
{
  "id": "SEC-001",
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
}
```

---

# 9. Finding Fields

## `id`

Unique identifier for the finding within the scan.

Format:

```text
SEC-001
SEC-002
SEC-003
```

---

## `type`

Machine-readable finding category.

Allowed MVP values:

```text
hardcoded_secret
exposed_env
sql_injection
potential_idor
```

---

## `title`

Human-readable name.

Examples:

```text
Hardcoded API Secret
Potentially Exposed Environment File
Potential SQL Injection
Potential Authorization Vulnerability
```

---

## `severity`

Fixed by the scanner.

Allowed values:

```text
critical
high
medium
low
```

MVP severity mapping:

```text
hardcoded_secret → critical
exposed_env      → critical
sql_injection    → critical
potential_idor   → high
```

Gemma must not change this value.

---

## `confidence`

Confidence of the scanner's detection.

Allowed values:

```text
high
medium
low
```

Example:

```text
Potential SQL Injection
Confidence: medium
```

Gemma must not change this value.

---

## `file`

Relative path of the affected file from the project root.

Example:

```text
backend/users.py
```

Do not return absolute server filesystem paths.

---

## `line`

The primary affected line.

Example:

```json
"line": 42
```

The MVP uses a single line number rather than line ranges.

---

## `evidence`

Small relevant code snippet showing why the scanner created the finding.

Examples:

```text
query = f"SELECT * FROM users WHERE name='{name}'"
```

or:

```text
order = Order.query.get(order_id)
```

Secrets must be redacted:

```text
API_KEY = [REDACTED]
```

Actual credentials must never be returned to the frontend or sent to Gemma.

---

## `code_context`

An object providing surrounding source code lines for frontend display.

Schema:

```json
{
  "start_line": 1,
  "lines": [
    "from flask import request",
    "def get_user():",
    "    ..."
  ]
}
```

The backend extracts line numbers `[max(1, line_number - 5) .. min(len(source_lines), line_number + 5)]` from the source file and provides them in `lines`. The frontend uses `start_line` to calculate line numbers without re-extracting the ZIP archive.

---

## `description`

A detailed, understandable explanation of what is wrong.

This field is generated by Gemma from the scanner's evidence.

It should answer:

> What is happening in this code that creates the security concern?

The explanation should be understandable to a startup/non-security-focused founder.

---

## `impact`

Detailed explanation of potential consequences.

It should answer:

> If this weakness is exploitable, what could an attacker potentially do?

The explanation should distinguish potential impact from confirmed exploitation.

---

## `recommendation`

Practical remediation guidance.

It should answer:

> What should the developer change to reduce or remove the security concern?

The MVP does not require Gemma to generate an entire replacement file.

---

# 10. LLM Contract

The backend communicates with Ollama separately from the frontend API.

The frontend does not communicate directly with Ollama.

```text
Frontend
   |
   v
FastAPI
   |
   v
Scanner
   |
   v
Finding evidence
   |
   v
Ollama / Gemma 3 4B
```

---

# 11. Data Sent to Gemma

Gemma receives only the information needed to explain a finding.

Example:

```json
{
  "type": "sql_injection",
  "severity": "critical",
  "confidence": "medium",
  "file": "backend/users.py",
  "line": 42,
  "code": "query = f"SELECT ... {name}""
}
```

The backend must not send:

- Entire ZIP
- Entire repository
- Entire project
- Unrelated files
- Unrelated code
- Actual secret values

---

# 12. Expected Gemma Output

Gemma should return structured explanation data.

```json
{
  "description": "User-controlled input appears to be inserted directly into an SQL query.",
  "impact": "An attacker may be able to manipulate the SQL query and potentially access or modify database information.",
  "recommendation": "Use parameterized queries or prepared statements instead of string interpolation."
}
```

The backend combines this with the scanner-generated metadata.

For example:

```text
Scanner provides:
- id
- type
- title
- severity
- confidence
- file
- line
- evidence

Gemma provides:
- description
- impact
- recommendation
```

---

# 13. No-Finding Response

If no supported security concerns are detected:

HTTP:

```text
200 OK
```

Response:

```json
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

The frontend should display:

> No supported security concerns detected.

It must also display:

> This does not mean the application is completely secure. The MVP only checks for hardcoded secrets/exposed environment files, SQL injection, and potential authorization vulnerabilities.

---

# 14. Security Score

The backend calculates the score.

Starting score:

```text
100
```

Deductions:

```text
Critical → -30
High     → -20
```

Minimum:

```text
0
```

Example:

```text
2 Critical + 1 High

100 - 30 - 30 - 20
= 20
```

The score is an MVP indicator and must not be presented as a guarantee of application security.

---

# 15. Error Response

All API errors should use:

```json
{
  "error": {
    "code": "INVALID_ZIP",
    "message": "The uploaded file is not a valid ZIP archive."
  }
}
```

---

# 16. Error Codes

## `INVALID_FILE`

No file was supplied.

Example:

```json
{
  "error": {
    "code": "INVALID_FILE",
    "message": "A ZIP project file is required."
  }
}
```

HTTP:

```text
400 Bad Request
```

---

## `INVALID_ZIP`

The uploaded file is not a valid ZIP archive.

HTTP:

```text
400 Bad Request
```

---

## `ZIP_TOO_LARGE`

The uploaded ZIP exceeds:

```text
10 MB
```

HTTP:

```text
413 Payload Too Large
```

---

## `TOO_MANY_FILES`

The extracted project exceeds:

```text
5,000 files
```

HTTP:

```text
400 Bad Request
```

---

## `EXTRACTED_SIZE_EXCEEDED`

The extracted project exceeds:

```text
50 MB
```

HTTP:

```text
400 Bad Request
```

---

## `UNSAFE_ZIP`

A ZIP member attempts path traversal/ZIP Slip.

HTTP:

```text
400 Bad Request
```

---

## `SCAN_FAILED`

Unexpected backend/scanner failure.

HTTP:

```text
500 Internal Server Error
```

Where possible, the backend should continue if only one individual scanner fails.

---

# 17. Ollama Failure

Ollama failure should not cause the entire scan to fail.

If Gemma cannot generate an explanation:

```text
Scanner finding
      ↓
Gemma failed
      ↓
Fallback explanation
      ↓
Return finding
```

The response should still contain the technical finding.

For example:

```json
{
  "id": "SEC-001",
  "type": "sql_injection",
  "title": "Potential SQL Injection",
  "severity": "critical",
  "confidence": "medium",
  "file": "backend/users.py",
  "line": 42,
  "evidence": "query = f"SELECT ... {name}"",
  "description": "The scanner detected a SQL query constructed using dynamic user-controlled input.",
  "impact": "This pattern may allow an attacker to manipulate the SQL query.",
  "recommendation": "Use parameterized queries."
}
```

The frontend does not need to know that Gemma failed unless the team chooses to expose an optional warning.

---

# 18. CORS

The backend should allow the frontend during local development.

Primary origin:

```text
http://localhost:3000
```

When the two laptops are connected through local Wi-Fi, allow the frontend's LAN origin as required.

Example:

```text
http://192.168.1.x:3000
```

The exact LAN IP must be determined at the event.

---

# 19. Frontend Integration

The frontend should only need to know:

```text
API_BASE_URL
```

Example:

```text
http://localhost:8000
```

Then:

```text
GET  ${API_BASE_URL}/api/health
POST ${API_BASE_URL}/api/v1/scan
```

The frontend must not contain scanner logic.

The frontend must not call Ollama directly.

---

# 20. Frontend Scan Request

Pseudo-code:

```text
Create FormData
    |
    +-- file = project.zip
    |
    v
POST /api/v1/scan
    |
    v
Receive JSON
    |
    v
Render report
```

No scan ID or polling is required.

---

# 21. API Contract Between Developers

Developer 1 (backend) must guarantee:

```text
POST /api/v1/scan
```

returns the agreed JSON structure.

Developer 2 (frontend) can build against mock data using the exact same structure.

Example mock:

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

# 22. Synchronous API Decision

The MVP intentionally does not use:

```text
POST /scans
    ↓
scan_id
    ↓
GET /scans/{scan_id}
```

The reason is implementation time.

The simpler contract is:

```text
POST /api/v1/scan
    ↓
Process
    ↓
Complete report
```

If the prepared demo project takes an acceptable amount of time to scan, this architecture should remain unchanged.

Only introduce asynchronous processing if the actual implementation proves that the synchronous request is impractical.

---

# 23. API Definition of Done

The API is complete when:

### Health

```text
GET /api/health
```

returns:

```json
{
  "status": "ok"
}
```

### Scan

```text
POST /api/v1/scan
```

accepts:

```text
multipart/form-data
file=<project.zip>
```

and returns the complete report.

### Response

The response contains:

```text
status
security_score
summary
findings
```

### Findings

Every finding contains:

```text
id
type
title
severity
confidence
file
line
evidence
code_context
description
impact
recommendation
```

### Errors

Errors use the standard:

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

structure.

### Integration

The frontend can communicate with the backend through:

```text
localhost
```

or the backend laptop's LAN IP.

---

# 24. 3-Hour Rule

Do not add API endpoints unless they are required for the core demo.

The complete MVP API is intentionally:

```text
GET  /api/health
POST /api/v1/scan
```

That's it.
