# VibeCoder Security Auditor AI — System Architecture

## 1. Architecture Goal

The MVP architecture is designed around one constraint:

> **The complete system must be buildable and demoable within 3 hours.**

Therefore, the architecture intentionally avoids unnecessary infrastructure, databases, complex static-analysis frameworks, microservices, and production-grade systems.

The core architecture is:

```text
User
  |
  v
Next.js Frontend
  |
  | POST /api/v1/scan
  | ZIP file
  v
FastAPI Backend
  |
  v
ZIP Extraction
  |
  v
Scanner Engine
  |
  +--> Secrets Scanner
  |
  +--> SQL Injection Scanner
  |
  +--> IDOR Scanner
  |
  v
Structured Findings
  |
  v
Relevant Evidence / Small Code Snippet
  |
  v
Ollama
  |
  v
Gemma 3 4B
  |
  v
Finding Explanations
  |
  v
Complete Security Report
  |
  v
Next.js Frontend
```

---

# 2. Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS

The frontend should remain simple and focus on the upload and report experience.

## Backend

- Python
- FastAPI

FastAPI handles:

- ZIP upload
- ZIP extraction
- Scan orchestration
- Scanner execution
- LLM calls
- Final report generation
- API responses

## Security Scanner

Custom lightweight static analysis using:

- Regex
- File-name rules
- Simple code-context analysis
- Lightweight structural checks

No full static-analysis framework is required for the MVP.

## LLM

- Ollama
- Gemma 3 4B

Gemma is used only as an **explanation layer**.

## Storage

No database is required.

The MVP uses:

- Temporary directories for uploaded projects
- In-memory scan/report data where needed

---

# 3. Frontend Architecture

The frontend has three simple states/pages:

```text
Upload
  |
  v
Scanning
  |
  v
Results
```

## Upload

The user selects:

```text
project.zip
```

and clicks:

```text
Scan Project
```

The frontend sends the ZIP to the FastAPI backend.

## Scanning

The frontend displays a simple loading state while the backend processes the project.

No complex real-time progress system is required for the MVP.

## Results

The frontend displays:

- Number of findings
- Severity counts
- Individual findings
- File and line
- Evidence
- AI explanation
- Potential impact
- Recommended fix
- Confidence

---

# 4. Backend Architecture

The backend should use a simple layered structure.

```text
FastAPI
   |
   v
Scan Service
   |
   +--> ZIP Handler
   |
   +--> Scanner Engine
   |       |
   |       +--> Secrets Scanner
   |       +--> SQL Injection Scanner
   |       +--> IDOR Scanner
   |
   +--> LLM Explanation Service
   |
   v
Report
```

The backend does not need separate deployed services.

Everything can run as one FastAPI application.

---

# 5. ZIP Processing

The backend receives the ZIP file through the API.

Flow:

```text
ZIP Upload
    |
    v
Validate ZIP
    |
    v
Create Temporary Directory
    |
    v
Extract ZIP
    |
    v
Scan Files
```

The uploaded project must be treated as untrusted data.

The backend must **never execute the uploaded application**.

It must not:

- Run uploaded scripts
- Install uploaded dependencies
- Start the uploaded application
- Execute shell commands from the uploaded project

The files are treated as source-code data only.

---

# 6. Files to Scan

The scanner should focus on common source/configuration files:

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

Generated and dependency directories should be ignored where practical:

```text
node_modules/
.git/
__pycache__/
.next/
venv/
dist/
build/
```

This prevents unnecessary scanning and reduces noise.

---

# 7. Scanner Architecture

Each vulnerability category has its own small scanner.

```text
scanner/
├── engine.py
├── secrets.py
├── sql_injection.py
└── idor.py
```

The engine runs the scanners against the extracted project.

```text
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

All scanners must return the same Finding structure.

This keeps the rest of the system independent from the individual detection implementation.

---

# 8. Secrets Scanner

## Detection method

Use:

- File-name rules
- Regular expressions
- Simple assignment patterns

Examples of patterns:

```text
API_KEY = "..."
PASSWORD = "..."
TOKEN = "..."
SECRET = "..."
```

And files:

```text
.env
.env.local
.env.production
```

The scanner should report potential hardcoded secrets rather than attempting to verify whether credentials are valid.

## Flow

```text
File
 ↓
Check filename
 ↓
Check secret patterns
 ↓
Extract line/evidence
 ↓
Create Finding
```

---

# 9. SQL Injection Scanner

## Supported languages

- Python
- JavaScript
- TypeScript

## Detection method

Use:

- Regex
- Simple code-context rules

The scanner looks for SQL queries combined with unsafe dynamic string construction.

Examples:

### Python concatenation

```python
query = "SELECT * FROM users WHERE id=" + user_id
```

### Python f-string

```python
query = f"SELECT * FROM users WHERE name='{name}'"
```

### JavaScript/TypeScript template literal

```javascript
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

## Safe-query handling

Obvious parameterized queries should not be reported where practical.

Example:

```python
cursor.execute(
    "SELECT * FROM users WHERE id = %s",
    (user_id,)
)
```

The goal is not to build a complete SQL data-flow engine.

The goal is to reliably detect obvious vulnerable patterns for the MVP.

---

# 10. IDOR / Authorization Scanner

## Detection method

Use:

- Regex
- Lightweight structural checks

The scanner looks for this pattern:

```text
User-controlled resource identifier
          +
Resource/database lookup
          +
No obvious authorization/ownership check
          |
          v
Potential Authorization Vulnerability
```

Example:

```python
@app.get("/orders/{order_id}")
def get_order(order_id):
    order = Order.query.get(order_id)
    return order
```

The scanner should report:

```text
Potential Authorization Vulnerability
Severity: High
```

## Important limitation

Static analysis cannot reliably prove IDOR in every application.

Therefore this is a **potential vulnerability finding**, not a confirmed exploit.

The scanner should not attempt sophisticated cross-file authorization analysis in the 3-hour MVP.

---

# 11. Common Finding Object

Every scanner returns the same structure.

Example:

```json
{
  "id": "SEC-001",
  "type": "sql_injection",
  "title": "Potential SQL Injection",
  "severity": "critical",
  "confidence": "medium",
  "file": "users.py",
  "line": 42,
  "code": "query = f"SELECT ... {name}""
}
```

The scanner is responsible for the technical evidence.

---

# 12. LLM Architecture

## Model

```text
Ollama
   |
   v
Gemma 3 4B
```

Gemma is **not** the vulnerability detection engine.

## Responsibility separation

```text
Scanner:
"Here is a suspicious pattern."

Gemma:
"Explain what this pattern means."
```

The LLM receives only the relevant finding information.

It does **not** receive the entire project.

---

# 13. LLM Input

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

Only a small relevant code snippet should be included.

The backend should avoid sending:

- Entire project
- Unrelated files
- Unrelated code
- Full repository contents

This keeps the prompt small and makes the local 4B model faster and more predictable.

---

# 14. LLM Output

Gemma returns a structured explanation containing exactly these fields:

```json
{
  "description": "...",
  "impact": "...",
  "recommendation": "..."
}
```

The backend combines this explanation with the scanner's technical finding metadata and `code_context`:

Final finding:

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

### LLM Resilience & Fallback

Ollama is optional for scan completion. If Gemma times out (15 seconds per finding), fails, or returns invalid JSON, the backend automatically uses predefined fallback explanations (`description`, `impact`, `recommendation`) so the scan completes reliably.

---

# 15. API Architecture

## Recommended MVP API: Synchronous Scan

For the 3-hour MVP, use:

```text
POST /api/v1/scan
        |
        v
   Scan ZIP
        |
        v
   Run scanners
        |
        v
   Run Gemma
        |
        v
 Return complete report
```

### Why?

A separate asynchronous scan system would require additional:

- Scan IDs
- State management
- Background jobs
- Polling
- Persistence
- More frontend states

That is unnecessary for a 3-hour MVP.

The scan should be kept synchronous **as long as the prepared demo project completes quickly enough**.

---

# 16. API Endpoint

### POST `/api/v1/scan`

Request:

```text
Content-Type: multipart/form-data

file = project.zip
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

The exact API contract will be defined separately in:

```text
05_API_CONTRACT.md
```

---

# 17. Alternative Async Architecture

A two-endpoint architecture is possible:

```text
POST /api/v1/scans
        |
        v
     scan_id

GET /api/v1/scans/{scan_id}
        |
        v
status/result
```

However, this is **not the default MVP architecture**.

Use it only if the synchronous request becomes impractical because Gemma takes too long to complete the scan.

The 3-hour rule is:

> Do not build asynchronous job infrastructure unless the actual demo requires it.

---

# 18. LLM Failure Handling

The scanner must remain useful even if Ollama/Gemma fails.

Flow:

```text
Scanner Finding
      |
      v
Try Gemma
      |
   +--+--+
   |     |
Success  Failure
   |     |
   v     v
AI      Technical
explanation  finding
   |     |
   +--+--+
      |
      v
Final Report
```

If Gemma fails, the frontend should still receive the scanner's technical finding.

A generic fallback explanation can be used.

The entire scan should not fail just because the LLM is unavailable.

---

# 19. Scanner Failure Handling

If one scanner encounters an unexpected problem:

```text
Secrets Scanner ──── success
SQLi Scanner ─────── success
IDOR Scanner ─────── error
                         |
                         v
                  Continue scan
```

The other scanners should still run.

For the MVP, errors can be logged on the backend rather than building a complex error-reporting system.

---

# 20. Storage Architecture

No database is required.

Temporary project:

```text
/tmp/vibecoder/<scan-folder>/
```

The project is scanned and then the temporary data can be removed.

The report can remain in memory for the duration of the request.

This is sufficient for the hackathon demo.

---

# 21. Network Architecture

The event organizers provide shared Wi-Fi, so the two laptops may communicate over the local network.

During development:

```text
Developer 1
Backend
FastAPI
0.0.0.0:8000
       ^
       |
   Local Wi-Fi
       |
       v
Developer 2
Frontend
Next.js
localhost:3000
```

The frontend can call the backend laptop's local network IP.

Example:

```text
http://192.168.x.x:8000
```

The actual IP should be determined on the event network rather than hardcoded in the architecture.

## Important

Shared event Wi-Fi may have:

- Client isolation
- Firewall restrictions
- Changing IP addresses
- Unreliable peer-to-peer connectivity

Therefore the team should have a fallback:

> **Run frontend and backend on the same laptop for the final demo if LAN communication becomes unreliable.**

The architecture does not depend on cloud deployment.

---

# 22. CORS

FastAPI should allow the frontend origin during development.

For example:

```text
http://localhost:3000
```

If the frontend is accessed from another laptop over the LAN, configure the appropriate frontend origin or use a permissive development CORS configuration for the hackathon.

Do not spend significant time building sophisticated network security around the local development setup.

---

# 23. Developer Separation

Two developers can work independently using the following boundary:

```text
Developer 1
────────────────────
FastAPI
ZIP processing
Scanner engine
Secrets scanner
SQLi scanner
IDOR scanner
Ollama/Gemma
API
────────────────────

Developer 2
────────────────────
Next.js
Upload UI
Loading state
Results UI
Mock report data
────────────────────
```

The common interface between them is the API contract.

Therefore:

> **Freeze `05_API_CONTRACT.md` before integration.**

The frontend can use mock JSON while the backend is being developed.

---

# 24. Architecture Principles

### Principle 1 — Scanner first

Security detection is performed by deterministic code.

### Principle 2 — AI explains

Gemma 3 4B explains scanner evidence rather than scanning the entire project.

### Principle 3 — Small context

Only relevant code snippets and finding metadata are sent to Gemma.

### Principle 4 — Simple beats sophisticated

Use lightweight rules that can be implemented reliably within 3 hours.

### Principle 5 — No unnecessary infrastructure

No database, queues, microservices, cloud deployment, or authentication for the MVP.

### Principle 6 — Demo reliability over completeness

The scanner does not need to detect every possible vulnerability.

It needs to reliably demonstrate the three supported vulnerability categories.

---

# 25. Final MVP Architecture

```text
                    ┌─────────────────────┐
                    │       USER          │
                    └──────────┬──────────┘
                               │
                               │ ZIP
                               ▼
                    ┌─────────────────────┐
                    │  NEXT.JS FRONTEND   │
                    │ TypeScript/Tailwind  │
                    └──────────┬──────────┘
                               │
                               │ POST /api/v1/scan
                               ▼
                    ┌─────────────────────┐
                    │    FASTAPI BACKEND  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    ZIP HANDLER      │
                    │ Temporary extraction │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    SCANNER ENGINE   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
       │   SECRETS   │ │    SQLi     │ │    IDOR     │
       │ Regex/files │ │ Regex/context│ │ Regex/       │
       │             │ │             │ │ structural  │
       └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ STRUCTURED FINDINGS │
                    └──────────┬──────────┘
                               │
                               │ Small evidence
                               ▼
                    ┌─────────────────────┐
                    │       OLLAMA        │
                    │     Gemma 3 4B      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  AI EXPLANATIONS    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   SECURITY REPORT   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   NEXT.JS RESULTS   │
                    └─────────────────────┘
```

---

# 26. Architecture Decision Summary

| Component | Decision |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind |
| Backend | Python + FastAPI |
| Scanner | Regex + lightweight targeted rules + simple structural checks |
| Secrets | Regex + file-name rules |
| SQL Injection | Regex + simple code-context rules |
| IDOR | Regex + lightweight structural checks |
| LLM | Ollama + Gemma 3 4B |
| LLM role | Explanation only |
| LLM input | Finding metadata + small relevant code evidence |
| LLM output | Structured explanation |
| API | Synchronous `POST /api/v1/scan` |
| Database | None |
| Storage | Temporary files + memory |
| Network | Local Wi-Fi during development |
| Fallback | Same-laptop frontend/backend |
| Priority | Working demo over polish |

---

## 27. 3-Hour Architecture Rule

If an architecture decision adds significant implementation time without improving the core demonstration, **do not implement it**.

The MVP architecture should remain:

```text
Upload
  ↓
Extract
  ↓
Scan
  ↓
Explain
  ↓
Report
```

Everything else is secondary.
