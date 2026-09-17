# 07 — Demo Project Specification

## 1. Purpose

The demo project is the deterministic test application for VibeCoder Security Auditor AI.

It must be small, realistic, and intentionally contain the three supported vulnerability classes:

1. Hardcoded secret
2. SQL injection
3. Potential authorization vulnerability / IDOR

The demo project is not intended to be a real production application.

Its purpose is to validate the complete hackathon pipeline:

```text
Demo ZIP
   ↓
ZIP extraction
   ↓
Deterministic scanner
   ↓
Expected findings
   ↓
Evidence extraction
   ↓
Gemma explanation
   ↓
Frontend security report
```

The demo must be designed so that the scanner produces predictable findings.

---

# 2. Demo Application

## Name

**VibeShop**

## Concept

A tiny e-commerce backend containing:

- application configuration
- product search
- user account/order lookup
- a small amount of realistic supporting code

The project should look like a small AI-generated application rather than a collection of artificial vulnerability tests.

---

# 3. Main Vulnerabilities

The demo intentionally contains:

```text
config.py
    → hardcoded fake API key

users.py
    → SQL injection

account.py
    → potential IDOR / missing authorization check
```

The intended main demo has **one finding from each vulnerability category**.

Expected categories:

```text
🔑 Hardcoded Secret
💉 SQL Injection
👤 Potential Authorization Vulnerability
```

---

# 4. Demo Project Tree

Target structure:

```text
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

The project is deliberately small.

Do not add a frontend, database server, Docker configuration, authentication system, tests, CI/CD, or unrelated dependencies unless needed to make the demo code understandable.

---

# 5. Dynamic Line Number Detection

The scanner must calculate actual line numbers dynamically from source files. Fixed line numbers must not be hardcoded as acceptance assertions in test suites.

Expected demo findings summary:

| Finding | Target File | Vulnerability Category | Severity | Confidence | Line Calculation |
|---|---|---|---|---|---|
| SEC-001 | `config.py` | Hardcoded Secret | Critical | High | Calculated dynamically by scanner |
| SEC-002 | `users.py` | Potential SQL Injection | Critical | Medium | Calculated dynamically by scanner |
| SEC-003 | `account.py` | Potential Authorization Vulnerability | High | Medium | Calculated dynamically by scanner |

The static scanner is the source of truth for line numbers. If demo source files are modified, the scanner automatically identifies the correct line.

---

# 6. Vulnerability 1 — Hardcoded Secret

## File

```text
config.py
```

## Expected vulnerable line

Calculated dynamically by the scanner from `config.py`.

## Intent

A developer has accidentally placed an API key directly in source code.

The credential is intentionally fake and must never be presented as a real credential.

## Demo pattern

Target structure:

```python
import os

APP_NAME = "VibeShop"

STRIPE_API_KEY = "sk_test_FAKE_VIBESHOP_123456"
```

The exact fake value can be changed if needed, but it must clearly be a non-production/demo credential.

## Expected scanner result

```text
Type:
hardcoded_secret

Title:
Hardcoded Secret

Severity:
critical

Confidence:
high

File:
config.py

Line:
4
```

## Evidence

The scanner must redact the credential before returning evidence.

Example:

```text
STRIPE_API_KEY = "[REDACTED]"
```

Never send the raw fake credential to Gemma or display it in the frontend.

## Required explanation concepts

Gemma should explain:

### What is wrong?

A credential/API key is embedded directly in source code.

### Potential impact

If the credential were real and the source code became accessible to an attacker, the credential could potentially be abused to access the associated service.

### How to fix

Move secrets into environment variables or a dedicated secret-management system and keep them out of source control.

Gemma may phrase this differently, but it must preserve these concepts.

---

# 7. Vulnerability 2 — SQL Injection

## File

```text
users.py
```

## Expected vulnerable line

Calculated dynamically by the scanner from `users.py`.

## Intent

User-controlled input is directly inserted into an SQL query using Python f-string interpolation.

## Demo pattern

Target structure:

```python
from flask import request

def search_users(db):
    name = request.args.get("name", "")
    query = f"SELECT * FROM users WHERE name = '{name}'"
    return db.execute(query).fetchall()
```

The implementation must place the vulnerable SQL construction on the predetermined target line.

The exact surrounding code can be adjusted to guarantee the line number.

## Expected scanner result

```text
Type:
sql_injection

Title:
Potential SQL Injection

Severity:
critical

Confidence:
medium

File:
users.py

Line:
<Calculated dynamically by scanner>
```

## Expected evidence

Example:

```text
query = f"SELECT * FROM users WHERE name = '{name}'"
```

Do not include exploit payloads in the demo report.

## Required explanation concepts

Gemma should explain:

### What is wrong?

User-controlled input is directly interpolated into an SQL query.

### Potential impact

An attacker may be able to manipulate the SQL query and potentially access, modify, or delete database information, depending on the database permissions and application behavior.

### How to fix

Use parameterized queries/prepared statements instead of constructing SQL with string interpolation.

---

# 8. Vulnerability 3 — Potential IDOR / Authorization Issue

## File

```text
account.py
```

## Expected vulnerable line

Calculated dynamically by the scanner from `account.py`.

## Intent

The route accepts a user-controlled resource identifier and retrieves that resource without an identifiable ownership/authorization check.

This must be reported as a **potential authorization vulnerability**, not a confirmed IDOR.

## Demo pattern

Target structure:

```python
from flask import jsonify

def get_order(order_id):
    order = Order.query.get(order_id)
    return jsonify(order)
```

The implementation must place the resource lookup on the predetermined target line.

The important pattern is:

```text
user-controlled resource ID
        ↓
database/resource lookup
        ↓
no obvious ownership/authorization check
```

## Expected scanner result

```text
Type:
potential_idor

Title:
Potential Authorization Vulnerability

Severity:
high

Confidence:
medium

File:
account.py

Line:
8
```

## Required explanation concepts

Gemma should explain:

### What is wrong?

A resource identifier appears to be controlled by the request, and the code retrieves the resource without an obvious ownership or authorization check.

### Potential impact

A user may potentially access another user's resource by changing the identifier, depending on the application's surrounding authorization model.

### How to fix

Verify that the authenticated user is authorized to access the requested resource before returning it.

Do not state that the vulnerability is definitively exploitable.

---

# 9. Safe Code Examples

The demo must include some safe code.

This is important because the scanner should demonstrate that it is not simply flagging every SQL query or resource lookup.

## Safe SQL

Include a simple parameterized query in:

```text
safe_queries.py
```

Example:

```python
def safe_search(db, name):
    query = "SELECT * FROM users WHERE name = %s"
    return db.execute(query, (name,)).fetchall()
```

The scanner should not report this as SQL injection.

## Safe Authorization

Include a simple ownership check in `account.py` or another supporting file.

Example:

```python
def safe_get_order(order_id, current_user):
    order = Order.query.get(order_id)

    if order.user_id != current_user.id:
        raise PermissionError("Not authorized")

    return order
```

The scanner should not report this safe pattern as a potential IDOR when the authorization check is clearly associated with the lookup.

Keep the safe patterns simple enough for the lightweight MVP scanner to recognize.

---

# 10. Supporting Files

## `app.py`

Small application entry point.

Purpose:

- Make the project look realistic.
- Provide minimal application context.

No security vulnerability is required here.

## `products.py`

Simple product-related code.

Purpose:

- Provide realistic project context.
- No intentional vulnerability.

## `requirements.txt`

Keep dependencies minimal.

Example:

```text
Flask
```

Only include dependencies actually needed by the demo.

## `README.md`

Short project description.

Example topics:

```text
VibeShop
A small AI-generated e-commerce backend used for demonstration.
```

Do not document the vulnerabilities inside the README.

---

# 11. `.env` Decision

The main deterministic demo uses the **hardcoded secret in `config.py`** as the single secret finding.

Do not add a `.env` file to the primary demo fixture.

Reason:

```text
config.py → 1 secret finding
users.py   → 1 SQLi finding
account.py → 1 authorization finding
```

This keeps the main report easy to understand.

The backend still supports `.env` detection as part of the product MVP, but it does not need to be demonstrated in the primary ZIP.

---

# 12. Expected Main Demo Result

The exact final number of findings is intentionally **not hardcoded into this document as a fixed acceptance requirement**.

The implementation should first be completed and tested.

After the scanner is finalized, run the demo ZIP and record the actual deterministic result.

The intended target is:

```text
1 hardcoded secret
1 SQL injection
1 potential authorization vulnerability
```

Therefore, the expected target is approximately:

```text
3 findings
2 Critical
1 High
0 Medium
0 Low
```

If the final scanner produces a different count because of additional legitimate detections, the fixture should be adjusted rather than hiding findings in the frontend.

---

# 13. Expected Security Score

The backend currently calculates the score deterministically.

For the intended three findings:

```text
Starting score: 100

Critical: -30 each
High:     -20 each
```

Expected:

```text
100
-30  hardcoded secret
-30  SQL injection
-20  potential authorization issue
----
20 / 100
```

The frontend must receive this value from the backend.

The demo project itself must not calculate the score.

---

# 14. Expected Finding Ordering

For deterministic demonstration, findings should appear in scanner discovery order.

Target order:

```text
SEC-001 → config.py
SEC-002 → users.py
SEC-003 → account.py
```

The scanner should assign IDs sequentially after findings are collected.

Do not hardcode `SEC-001`, etc. inside the demo files.

---

# 15. Evidence and Code Viewer

The backend scanner extracts surrounding source code lines into `code_context` for every finding:

```python
lines = source.splitlines()
start = max(1, line_number - 5)
end = min(len(lines), line_number + 5)
code_context = {
    "start_line": start,
    "lines": lines[start - 1:end]
}
```

The frontend loops over `code_context.lines` and calculates displayed line numbers starting from `start_line`. The vulnerable line matching `finding.line` is visually highlighted.

---

# 16. Gemma Explanation Contract

Gemma is an explanation layer.

It does not decide:

- whether the scanner found a vulnerability
- severity
- confidence
- line number
- file
- finding type

The scanner provides those fields.

Gemma receives only the relevant finding metadata and small code evidence.

For example:

```json
{
  "type": "sql_injection",
  "severity": "critical",
  "confidence": "high",
  "file": "users.py",
  "line": 8,
  "code": "query = f\"SELECT * FROM users WHERE name = '{name}'\""
}
```

Gemma returns:

```json
{
  "description": "...",
  "impact": "...",
  "recommendation": "..."
}
```

The backend merges these fields into the final finding.

---

# 17. AI Explanation Requirements

Gemma explanations must:

1. Explain the finding in simple language.
2. Explain why the code is risky.
3. Explain realistic potential impact.
4. Provide a practical remediation.
5. Preserve the scanner's severity.
6. Preserve the scanner's confidence.
7. Treat `potential_idor` as a potential issue, not a confirmed vulnerability.
8. Avoid exploit payloads.
9. Avoid inventing code or facts not supported by the evidence.
10. Stay concise enough for a hackathon report.

If Gemma fails, the backend must use a deterministic fallback explanation.

The demo must still work without Ollama.

---

# 18. Determinism Requirements

The demo must not depend on:

- Internet access
- External APIs
- Random values
- Live databases
- Real credentials
- External authentication
- GitHub
- Cloud services

The only optional external dependency is the locally running Ollama/Gemma service for explanations.

Scanner detection itself must remain deterministic.

---

# 19. Demo Validation

Before the final hackathon demo, run:

```text
VibeShop ZIP
    ↓
POST /api/v1/scan
    ↓
Inspect response
    ↓
Verify findings
    ↓
Verify line numbers
    ↓
Verify redaction
    ↓
Verify severity
    ↓
Verify confidence
    ↓
Verify Gemma explanations
    ↓
Verify frontend rendering
```

The following must be manually checked:

### Secret

```text
config.py
correct line
credential redacted
Critical
High confidence
```

### SQL Injection

```text
users.py
correct line
SQL evidence present
Critical
High confidence
```

### Authorization

```text
account.py
correct line
resource lookup visible
High
Medium confidence
"Potential" wording preserved
```

---

# 20. Demo Success Condition

The ideal judge experience is:

```text
Upload VibeShop.zip
        ↓
Scanning
        ↓
Security Score
        ↓
3 security findings
        ↓
"Potential SQL Injection"
        ↓
users.py : line 8
        ↓
highlighted vulnerable code
        ↓
What is wrong?
        ↓
Potential impact
        ↓
How to fix
```

The same flow should be clear for the secret and authorization findings.

The judge should be able to understand **what the AI-generated code did wrong, where it happened, why it matters, and what to change** without needing cybersecurity expertise.

---

# 21. Final Fixture Rule

Do not optimize the demo project for realism at the expense of deterministic detection.

The fixture exists to prove the product works.

The priority is:

```text
Predictable detection
        >
Clear evidence
        >
Clear explanation
        >
Realistic-looking project
```

Keep the project small enough that the team can inspect every file manually during the hackathon.
