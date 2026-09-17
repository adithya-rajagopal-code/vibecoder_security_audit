# VibeCoder Security Auditor AI — MVP PRD

## 1. MVP Objective

Build a working security auditor that allows a startup/non-technical founder to upload an AI-generated software project as a ZIP file and receive an understandable security report.

The MVP must be **buildable and demoable within 3 hours**.

The goal is not to build a production-grade security platform. The goal is to demonstrate the core product idea reliably:

> **Upload AI-built code → detect important security concerns → explain them clearly.**

---

## 2. Hard MVP Constraints

The following rules are fixed for the MVP:

- Input is **ZIP only**.
- Support **Python + JavaScript/TypeScript** for SQL injection detection.
- Only three security categories are supported.
- Detection is primarily **simple deterministic/static pattern analysis**.
- Ollama + **Gemma 3 4B** is used only for explaining scanner findings.
- The entire codebase must **not** be sent to Gemma.
- Only relevant finding evidence/code snippets should be sent to the LLM.
- The LLM must not be the primary vulnerability detector.
- No user accounts/login.
- No GitHub integration.
- No re-scan workflow.
- No deployment/cloud infrastructure required for the MVP.


---

# 3. MVP Features

## P0-1 — Hardcoded Secrets / Exposed `.env`

### Objective

Detect common hardcoded credentials and potentially exposed environment/credential files.

### Supported secret categories

The MVP detects a small, practical subset:

- API keys
- Passwords
- Tokens/secrets

It should also detect:

- `.env`
- `.env.local`
- `.env.production`
- Similar `.env.*` files
- Common credential files where practical

### Example

```python
API_KEY = "sk-example-secret"
DATABASE_PASSWORD = "my-password"
AUTH_TOKEN = "example-token"
```

### `.env` behavior

An existing `.env` or similar environment file is itself reported as a security concern.

Example finding:

```text
Potentially Exposed Environment File
File: .env
Severity: Critical
```

### Detection approach

Use simple file-name checks and secret-like patterns.

The scanner does **not** need to verify whether a detected credential is actually valid.

Example:

```text
API_KEY = "sk-demo-123456"
```

can be reported as a potential hardcoded secret even if it is only a fake/demo credential.

### Required output

- Finding title
- Severity: **Critical**
- File
- Line where applicable
- Evidence
- Confidence
- Explanation
- Potential impact
- Recommended fix

---

# 4. P0-2 — SQL Injection

### Objective

Detect obvious cases where user-controlled values are directly inserted into SQL queries.

### Supported languages

- Python
- JavaScript
- TypeScript

### Detection patterns

The MVP should detect:

#### String concatenation

```python
query = "SELECT * FROM users WHERE id=" + user_id
```

#### Python f-string interpolation

```python
query = f"SELECT * FROM users WHERE name='{name}'"
```

#### JavaScript/TypeScript template literals

```javascript
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

### Safe parameterized queries

The scanner should recognize obvious parameterized/safe query patterns and avoid reporting them when practical.

Example:

```python
cursor.execute(
    "SELECT * FROM users WHERE id = %s",
    (user_id,)
)
```

### Detection principle

The MVP is looking for:

```text
SQL query
   +
dynamic/user-controlled value
   +
unsafe string construction
   ↓
Potential SQL Injection
```

### Required output

- Finding title: **Potential SQL Injection**
- Severity: **Critical**
- File
- Line
- Evidence
- Confidence
- Explanation
- Potential attacker abuse
- Potential impact
- Recommended fix

### Confidence

Example:

```text
Potential SQL Injection
Confidence: Medium
```

Confidence represents how strongly the detected code pattern matches the vulnerability.

The scanner may use higher confidence for extremely obvious patterns.

---

# 5. P0-3 — Missing Authorization / Potential IDOR

## Objective

Detect simple patterns where a user-controlled resource identifier reaches a resource/database lookup without an obvious authorization or ownership check.

### MVP detection definition

The scanner looks for:

```text
User-controlled resource ID
        +
Resource/database lookup
        +
No obvious authorization/ownership check
        ↓
Potential Authorization Vulnerability
```

### Example

```python
@app.get("/orders/{order_id}")
def get_order(order_id):
    order = Order.query.get(order_id)
    return order
```

This should produce:

```text
Potential Authorization Vulnerability
Severity: High
```

### Obvious authorization check

The scanner should avoid reporting cases where an obvious ownership check is present.

Example:

```python
@app.get("/orders/{order_id}")
def get_order(order_id, current_user):
    order = Order.query.get(order_id)

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403)

    return order
```

### Important limitation

The scanner cannot reliably prove that an IDOR vulnerability exists through simple static analysis.

Therefore the MVP must report:

> **Potential Authorization Vulnerability**

and not:

> Confirmed IDOR

### Authentication vs authorization

The presence of authentication alone should not automatically prevent a finding.

For example:

```python
@require_auth
@app.get("/users/{user_id}")
def get_user(user_id):
    return get_user_from_db(user_id)
```

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to access this specific resource?

The MVP is concerned with the second question.

### Required output

- Finding title: **Potential Authorization Vulnerability**
- Severity: **High**
- File
- Line
- Evidence
- Confidence
- Explanation
- Potential attacker abuse
- Potential impact
- Recommended fix

---

# 6. Severity Rules

Severity is deterministic in the MVP.

| Finding | Severity |
|---|---|
| Hardcoded secret / exposed `.env` | Critical |
| Potential SQL Injection | Critical |
| Potential Authorization Vulnerability / IDOR | High |

Gemma 3 4B does **not** decide the severity.

The scanner provides the severity and the LLM explains the reason for the finding.

---

# 7. Confidence

Every finding should include a confidence value.

The MVP can use:

```text
High
Medium
Low
```

The confidence describes how strongly the scanner's detected pattern supports the finding.

For example:

```text
Potential SQL Injection
Severity: Critical
Confidence: Medium
```

The LLM should not arbitrarily change scanner confidence.

---

# 8. LLM Requirements

## Model

**Ollama + Gemma 3 4B**

## LLM responsibility

Gemma is an **explanation layer**, not the vulnerability scanner.

### Scanner

The deterministic scanner identifies:

```text
type
file
line
evidence
severity
confidence
```

### Gemma

Gemma receives only the relevant finding information and produces:

- What is wrong?
- Why is it a security concern?
- How could an attacker potentially abuse it?
- What could be the potential impact?
- How should it be fixed?

### The entire project must NOT be sent to Gemma.

Example LLM input:

```json
{
  "type": "sql_injection",
  "file": "backend/users.py",
  "line": 42,
  "evidence": "query = f"SELECT * FROM users WHERE name='{name}'"",
  "severity": "critical",
  "confidence": "medium"
}
```

The model explains this evidence.

---

# 9. Scan Flow

The complete MVP flow:

```text
User
 ↓
Upload project.zip
 ↓
Backend receives ZIP
 ↓
Validate ZIP
 ↓
Extract into temporary directory
 ↓
Walk project files
 ↓
Run secret scanner
 ↓
Run SQL injection scanner
 ↓
Run authorization/IDOR scanner
 ↓
Collect structured findings
 ↓
For each finding:
    select small relevant evidence
    ↓
    send evidence to Gemma 3 4B
    ↓
    receive explanation
 ↓
Build final report
 ↓
Frontend displays report
```

---

# 10. Finding Data Structure

The scanner should produce a consistent finding structure.

Example:

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

The scanner fills the technical fields.

Gemma fills the explanation-related fields.

---

# 11. Report Requirements

The frontend must show a simple security report.

## Summary

Display:

```text
Security Findings

Critical: 2
High: 1
Medium: 0
Low: 0
```

Optionally show a simple overall status such as:

```text
3 security concerns detected
```

Do not claim that the application is secure when no findings are detected.

---

## Finding Card

Each finding should display:

```text
Potential SQL Injection

Severity: Critical
Confidence: Medium

File:
backend/users.py

Line:
42

Evidence:
query = f"SELECT * FROM users WHERE name='{name}'"

What is wrong?
...

Why does it matter?
...

Potential impact:
...

How to fix:
...
```

The report should prioritize readability over visual complexity.

---

# 12. No Findings State

If no supported security concerns are detected, display:

> **No supported security concerns detected.**

Then clearly state:

> This does not mean the application is completely secure. The MVP only checks for hardcoded secrets/exposed environment files, SQL injection, and potential authorization vulnerabilities.

---

# 13. ZIP Handling Requirements

The backend must:

1. Accept a `.zip` file.
2. Validate that it is a ZIP archive.
3. Extract it into a temporary working directory.
4. Walk through relevant project files.
5. Ignore unnecessary/generated directories where practical.

For the hackathon, the scanner can focus on common source-code files:

```text
.py
.js
.jsx
.ts
.tsx
.env
.json
```

Do not spend significant time building an advanced file-type detection system.

---

# 14. Basic Safety Requirements

Because the uploaded project is untrusted input:

- Never execute the uploaded project.
- Never run uploaded scripts.
- Never install dependencies from the uploaded project.
- Treat all uploaded files as plain data.
- Extract into an isolated temporary directory.
- Limit file size where practical.
- Avoid returning raw secrets in the final report.

For example:

```text
API_KEY = "sk-123456789"
```

should become:

```text
API_KEY = [REDACTED]
```

in displayed evidence where practical.

---

# 15. Out of Scope

The following are explicitly outside the MVP:

- XSS
- SSRF
- Path traversal
- Command injection
- Insecure deserialization
- Dependency vulnerability scanning
- Advanced authentication analysis
- Advanced authorization analysis
- Runtime/DAST scanning
- Network scanning
- GitHub integration
- IDE integration
- CI/CD integration
- User accounts
- Persistent project storage
- Continuous monitoring
- Automatic code modification
- Full-codebase LLM analysis
- Complete security guarantees

---

# 16. Definition of Done

The MVP is considered complete when the following demo works end-to-end:

### Input

A ZIP containing intentionally vulnerable demo code.

### Scanner detects

```text
1. Hardcoded secret
2. SQL injection
3. Potential authorization vulnerability
```

### Report contains

For each finding:

```text
Title
Severity
Confidence
File
Line
Evidence
What is wrong?
Why it matters
Potential abuse
Potential impact
How to fix
```

### AI

Ollama successfully runs Gemma 3 4B and generates explanations from the structured finding evidence.

### Frontend

The user can:

```text
Upload ZIP
   ↓
Start scan
   ↓
Wait for result
   ↓
View findings
```

### Critical requirement

The entire flow must work reliably for the prepared hackathon demo project.

**A simple working MVP is more important than a polished or feature-rich product.**

---

# 17. 3-Hour Implementation Priority

If time becomes limited, implement in this order:

```text
P0-1 Secrets
      ↓
P0-2 SQL Injection
      ↓
P0-3 Potential IDOR
      ↓
Finding JSON structure
      ↓
Ollama + Gemma explanation
      ↓
Basic frontend report
      ↓
ZIP upload integration
```

If something must be cut, cut **polish and secondary functionality**, not the three core security detectors.

The final hackathon demo should prove one simple idea:

> **AI can help people build software quickly. VibeCoder Security Auditor AI helps them understand important security concerns hidden in that AI-generated code before deployment.**
