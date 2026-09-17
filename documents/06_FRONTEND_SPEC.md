# 06 — Frontend Specification

## 1. Purpose

VibeCoder Security Auditor AI is a security analysis tool for AI-generated codebases.

The frontend has one primary job:

> Let the user upload a ZIP project, show that the project is being analyzed, and present a clear security report with actionable findings.

This specification is intentionally limited to the **3-hour hackathon MVP**. Do not add unnecessary product features or UI complexity.

---

# 2. Technology

- Next.js
- TypeScript
- Tailwind CSS
- Backend: FastAPI
- Backend API base URL:
  - Local: `http://localhost:8000`
  - LAN: `http://192.168.x.x:8000`
- API version: `/api/v1`

Frontend endpoint:

```text
POST /api/v1/scan
```

Upload field:

```text
file
```

The frontend must never communicate directly with Ollama.

---

# 3. Application Flow

```text
Landing
   ↓
Upload ZIP
   ↓
Scanning
   ↓
Security Report
   ↓
Scan Another Project
   ↓
Landing
```

There are three primary UI states/screens:

1. Landing / Upload
2. Scanning
3. Security Report

No authentication, database, scan history, settings page, or user accounts are required.

---

# 4. Screen 1 — Landing / Upload

## 4.1 Goal

Immediately communicate what the product does and allow the user to upload an AI-generated project ZIP.

## 4.2 Visual direction

Use a **dark + modern SaaS** style.

Characteristics:

- Dark background
- Clean modern cards
- Minimal cybersecurity visual language
- Strong typography
- Red/orange/green indicators for security status
- Avoid excessive terminal/hacker styling
- Avoid unnecessary animations

## 4.3 Main content

Suggested structure:

```text
VibeCoder Security Auditor AI

Find security risks hiding in AI-generated code.

Upload your project and get an AI-assisted security report.

┌─────────────────────────────────────────────┐
│                                             │
│              Upload your ZIP                │
│                                             │
│       Drag & drop your project here         │
│                 or                          │
│             [ Choose ZIP ]                  │
│                                             │
└─────────────────────────────────────────────┘

ZIP only • Maximum 10 MB
Python • JavaScript • TypeScript
```

The exact copy can be adjusted during implementation, but the information above should remain.

## 4.4 Drag and drop

Support:

- Drag ZIP onto upload area
- Click upload area/button to open file picker

The file picker should accept ZIP files.

Example:

```html
accept=".zip,application/zip"
```

## 4.5 Upload validation

Frontend should perform basic validation before sending:

- File exists
- File extension is `.zip`
- File size ≤ 10 MB

The backend remains the authoritative validator.

If validation fails, show a clear inline error.

Example:

```text
Invalid file

Please upload a ZIP file smaller than 10 MB.
```

Do not implement complex client-side ZIP inspection. ZIP safety and extracted-size/file-count validation belong to the backend.

---

# 5. Screen 2 — Scanning

## 5.1 Goal

Give the user immediate feedback while the synchronous backend scan is running.

The frontend must not pretend to know the actual scan percentage.

## 5.2 UI

Use an indeterminate loading state.

Suggested:

```text
Analyzing your project

Your code is being checked for common security risks.

🔑 Checking exposed secrets
💉 Checking SQL injection
👤 Checking authorization issues

[ animated loading indicator ]
```

## 5.3 Progress behavior

Do NOT display fake percentages such as:

```text
73%
```

because the backend does not provide real-time progress.

Use:

- Spinner
- Pulsing/animated indicator
- Indeterminate progress bar

The animation should communicate that work is happening without claiming an exact completion percentage.

## 5.4 Request lifecycle

Frontend sends:

```text
POST /api/v1/scan
```

with:

```text
multipart/form-data
file=<project.zip>
```

While waiting:

```text
Landing → Scanning
```

On success:

```text
Scanning → Security Report
```

On error:

```text
Scanning → Error state
```

---

# 6. Screen 3 — Security Report

## 6.1 Goal

Turn scanner output into an easy-to-understand security report.

The report should make the result understandable to a non-security-focused developer.

## 6.2 Report structure

```text
Security Report

Security Score
     20
   / 100

[ Critical ] [ High ] [ Medium ] [ Low ]

Passed Checks

Findings
  ↓
Finding 1
Finding 2
Finding 3

[ Scan Another Project ]
```

---

# 7. Security Score

Display the deterministic backend score prominently.

Example:

```text
        20
   SECURITY SCORE
      / 100
```

Use a circular score visualization.

The frontend does **not calculate or modify the score**.

It simply renders:

```json
security_score
```

from the backend response.

Score calculation belongs to the backend.

---

# 8. Finding Summary

Display:

- Total findings
- Critical
- High
- Medium
- Low

Example:

```text
3 Findings

┌────────────┐ ┌────────────┐
│     2      │ │     1      │
│  Critical  │ │    High    │
└────────────┘ └────────────┘

┌────────────┐ ┌────────────┐
│     0      │ │     0      │
│   Medium   │ │    Low     │
└────────────┘ └────────────┘
```

These values come from:

```json
summary
```

Do not independently recalculate them in the frontend unless necessary for rendering.

---

# 9. Passed Checks

Always show all three supported security categories.

Example:

```text
Passed Checks

✓ No exposed secrets detected
✗ Potential SQL injection detected
✗ Potential authorization issue detected
```

The frontend should derive the displayed status from the findings returned by the backend.

Supported checks:

1. Exposed secrets
2. SQL injection
3. Authorization / potential IDOR

A passed check means that the scanner did not return a finding for that category.

Important:

> A passed check means no supported issue was detected. It does NOT mean the application is completely secure.

This disclaimer should be visible somewhere in the report.

---

# 10. Finding Cards

Each finding is displayed as a card.

Example:

```text
┌──────────────────────────────────────────────┐
│ 🔴 Potential SQL Injection                   │
│                                              │
│ CRITICAL       Medium Confidence             │
│ backend/users.py : 42                        │
│                                              │
│ What is wrong?                               │
│ User-controlled input appears to be inserted│
│ directly into an SQL query.                  │
│                                              │
│ Potential impact                             │
│ An attacker may be able to manipulate the   │
│ SQL query and potentially access, modify,    │
│ or delete database information.              │
│                                              │
│ How to fix                                   │
│ Use parameterized queries or prepared       │
│ statements instead of string interpolation. │
│                                              │
│ Code                                          │
│ ┌──────────────────────────────────────────┐ │
│ │ 38 | name = request.args["name"]         │ │
│ │ 39 |                                     │ │
│ │ 40 | query = f"SELECT..."                │ │
│ │ 41 | ...                                 │ │
│ │ 42 | db.execute(query)      ← vulnerable │ │
│ │ 43 | ...                                 │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

All findings should be shown vertically on one report page.

Do not build a sidebar/finding-navigation system for the MVP.

---

# 11. Finding Information

Every finding card must display:

- Title
- Severity
- Confidence
- File
- Line
- Evidence
- What is wrong?
- Potential impact
- How to fix

Backend structure:

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
  "description": "...",
  "impact": "...",
  "recommendation": "..."
}
```

Frontend mapping:

| Backend field | Frontend display |
|---|---|
| `title` | Finding title |
| `severity` | Severity badge |
| `confidence` | Confidence badge/text |
| `file` | File path |
| `line` | Line number |
| `evidence` | Evidence/code line |
| `code_context` | Surrounding code snippet lines |
| `description` | What is wrong? |
| `impact` | Potential impact |
| `recommendation` | How to fix |

---

# 12. Severity Indicators

Use clear visual indicators.

Suggested:

```text
CRITICAL → red
HIGH     → orange
MEDIUM   → yellow
LOW      → green/neutral
```

The frontend must render the backend-provided severity.

It must never change severity based on its own interpretation.

For MVP:

- Secrets → Critical
- SQL injection → Critical
- Potential authorization/IDOR → High

---

# 13. Confidence

Display:

```text
High Confidence
Medium Confidence
Low Confidence
```

Confidence comes from the scanner.

Gemma must not override it.

The frontend only displays the value.

---

# 14. Code Viewer

## 14.1 Requirement

Yes. Include a code snippet around the vulnerable line.

This is important for the hackathon demonstration because it makes the finding concrete.

## 14.2 Display & ZIP Rules

The frontend **must not extract the uploaded ZIP file again**.

The backend sends the necessary surrounding source code lines inside `finding.code_context`.

The frontend simply loops over `finding.code_context.lines` and calculates displayed line numbers dynamically:

$$\text{Displayed Line Number} = \text{start\_line} + \text{index}$$

Example:

```text
Code Context Display

┌──────────────────────────────────────────────┐
│  1 | from flask import request               │
│  2 |                                         │
│  3 | def get_user():                         │
│  4 |     name = request.args.get('name')     │
│  5 |     query = f"SELECT..."    ⚠ (line 5) │
│  6 |     result = db.execute(query)          │
│  7 |     return result                       │
└──────────────────────────────────────────────┘
```

## 14.3 Highlight vulnerable line

The line matching `finding.line` must be visually highlighted in the code viewer.

The frontend receives the target line number from:

```text
finding.line
```

## 14.4 Copy button

Do not implement a copy-code button for the MVP.

---

# 15. Evidence Display

Evidence should be shown separately from the explanatory sections.

Example:

```text
Evidence

query = f"SELECT * FROM users WHERE name='{name}'"
```

For secret findings:

> Never display the actual secret value if the backend has redacted it.

The frontend must render the redacted evidence returned by the backend.

---

# 16. No Findings State

If:

```json
"total": 0
```

show:

```text
No supported security concerns detected.

The scanner did not identify any of the supported
security issues in this project.

✓ No exposed secrets detected
✓ No SQL injection detected
✓ No authorization issues detected

Note:
This does not guarantee that the application is completely secure.
```

Do not claim:

```text
Your application is 100% secure.
```

---

# 17. Error States

The frontend should handle the backend error format:

```json
{
  "error": {
    "code": "INVALID_ZIP",
    "message": "The uploaded file is not a valid ZIP archive."
  }
}
```

Display the backend message to the user.

Known error codes:

```text
INVALID_FILE
INVALID_ZIP
ZIP_TOO_LARGE
TOO_MANY_FILES
EXTRACTED_SIZE_EXCEEDED
UNSAFE_ZIP
SCAN_FAILED
```

Example:

```text
Scan failed

The uploaded file is not a valid ZIP archive.

[ Try Again ]
```

A reusable error component is sufficient; separate custom designs for every error code are unnecessary.

---

# 18. Scan Another Project

At the bottom of the report:

```text
[ Scan Another Project ]
```

Clicking it:

```text
Security Report → Landing
```

Reset:

- selected file
- loading state
- error state
- previous report

No scan history is stored.

---

# 19. API Configuration

The frontend should not hardcode the backend address throughout the application.

Use:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For LAN development:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.25:8000
```

API request:

```text
${NEXT_PUBLIC_API_URL}/api/v1/scan
```

This allows the team to switch between localhost and LAN without changing application code.

---

# 20. Frontend State Model

Keep the application state extremely simple.

Suggested:

```typescript
type AppState =
  | "upload"
  | "scanning"
  | "report";
```

Additional state:

```text
selectedFile
report
error
```

Flow:

```text
upload
  ↓
file selected
  ↓
POST /scan
  ↓
scanning
  ↓
success → report
error   → error state
```

No global state library is necessary.

React state is sufficient.

---

# 21. Components

Keep component architecture small.

Suggested:

```text
app/
  page.tsx

components/
  UploadScreen.tsx
  ScanningScreen.tsx
  SecurityReport.tsx
  ScoreCard.tsx
  SummaryCards.tsx
  PassedChecks.tsx
  FindingCard.tsx
  CodeViewer.tsx
  ErrorMessage.tsx
```

Do not create components for every small text element.

The goal is fast implementation, not enterprise-level frontend architecture.

---

# 22. Responsive Behavior

The primary hackathon demo is desktop.

Implement basic responsive behavior so the interface does not break on smaller screens.

Do not spend significant development time on:

- mobile-specific layouts
- tablet-specific layouts
- advanced accessibility systems
- complex animations

---

# 23. Loading and Interaction Rules

While scanning:

- Disable upload controls
- Show scanning state
- Prevent duplicate scan requests

After report:

- Keep report visible
- Allow "Scan Another Project"

During errors:

- Show clear error
- Allow retry/upload again

---

# 24. Frontend Security Rules

The frontend must follow these rules:

1. Never communicate directly with Ollama.
2. Never expose raw secret values.
3. Never determine vulnerability severity.
4. Never claim a finding is confirmed if the backend calls it potential.
5. Never claim that a clean scan means the application is completely secure.
6. Do not execute uploaded project code in the browser.
7. Treat uploaded ZIP contents as untrusted data.

---

# 25. What Is Explicitly Out of Scope

For the 3-hour hackathon MVP, do NOT build:

- Authentication
- User accounts
- Database
- Scan history
- Dashboard analytics
- Scheduled scans
- Re-scanning
- GitHub integration
- GitLab integration
- URL scanning
- Docker/container scanning
- Dependency vulnerability database
- Full SAST engine
- Full AST analysis
- Advanced code navigation
- Export to PDF
- Email reports
- Notifications
- Team collaboration
- Payment system
- Admin panel
- Dark/light theme switcher
- Settings page
- Code copy button
- Finding filters/search
- Pagination
- Real-time scan progress API

---

# 26. 3-Hour Implementation Priority

Implement in this order:

### Priority 1 — Upload

- Landing screen
- Drag & drop
- File picker
- ZIP/10 MB validation
- API request

### Priority 2 — Scanning

- Loading state
- Indeterminate animation
- Prevent duplicate requests

### Priority 3 — Report

- Security score
- Finding summary
- Passed checks
- Finding cards
- Severity/confidence
- File + line
- Evidence

### Priority 4 — Code viewer

- Surrounding lines
- Vulnerable line highlight

### Priority 5 — Error handling

- Backend error message
- Retry

### Priority 6 — Demo usability

- Scan Another Project
- Basic responsive behavior
- Final spacing/typography adjustments

If time runs short, stop polishing and make the complete upload → scan → report flow work.

---

# 27. Definition of Done

The frontend is complete when a judge can:

1. Open the application.
2. Understand what VibeCoder Security Auditor AI does.
3. Drag a ZIP project into the upload area.
4. Start a scan.
5. See the scanning state.
6. Receive the security report.
7. See the security score.
8. See total/Critical/High/Medium/Low counts.
9. See passed checks.
10. Read every finding.
11. See the vulnerable file and line.
12. See redacted evidence where applicable.
13. See what is wrong.
14. See potential impact.
15. See how to fix it.
16. See the vulnerable code in context.
17. See the vulnerable line highlighted.
18. Scan another project.

The core demo should feel like:

```text
ZIP
 ↓
Upload
 ↓
Scanning
 ↓
Security Score
 ↓
Findings
 ↓
Code Evidence
 ↓
Explanation
 ↓
Fix
```

---

# 28. Core Frontend Principle

> Make the security result immediately understandable.

The frontend should not try to look like a complicated enterprise security platform.

The strongest hackathon demo is a simple flow:

**Upload → Analyze → Understand the Risk → See the Evidence → Fix It**
