# 08 — Integration & Setup Specification

## 1. Purpose

This document defines how to run and connect the VibeCoder Security Auditor AI frontend, backend, scanner, and local Ollama/Gemma service.

The setup is designed for the **3-hour hackathon MVP**.

Primary architecture:

```text
Frontend
Next.js
localhost:3000
       │
       │ HTTP
       ▼
Backend
FastAPI
localhost:8000
       │
       │ HTTP
       ▼
Ollama
localhost:11434
Gemma 3 4B
```

Ollama runs on the **same PC as the backend**.

The frontend can run on that same PC or on another laptop on the same LAN.

---

# 2. Repository Structure

Expected repository:

```text
vibecoder-security-auditor/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── ...
├── demo/
│   └── vibeshop.zip
└── README.md
```

The exact directory contents may evolve during implementation, but `backend/` and `frontend/` are the primary application directories.

---

# 3. Prerequisites

Install:

- Python 3.12+
- Node.js 20+
- npm
- Ollama

No cloud API is required.

The application uses:

```text
Ollama + Gemma 3 4B
```

for local AI explanations.

---

# 4. Backend Setup

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

On Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend locally:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Health endpoint:

```text
GET http://localhost:8000/api/health
```

API endpoint:

```text
POST http://localhost:8000/api/v1/scan
```

---

# 5. Ollama + Gemma Setup

Ollama runs on the **same PC as the backend**.

Install Ollama if it is not already installed.

Pull the required model:

```bash
ollama pull gemma3:4b
```

The backend communicates with the local Ollama service.

Default Ollama address:

```text
http://localhost:11434
```

The README does not require `ollama run` as part of the normal API setup if the Ollama service is already running.

The important architecture is:

```text
Backend PC
├── FastAPI :8000
└── Ollama :11434
       └── Gemma 3 4B
```

If the Ollama service is not running, start the Ollama application/service according to the operating system.

---

# 6. Backend Environment Variables

Create:

```text
backend/.env
```

Recommended values:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

These values configure the backend's local LLM connection.

No `OPENAI_API_KEY` is required.

The project does not use OpenAI's API for the MVP.

---

# 7. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create:

```text
frontend/.env.local
```

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

The browser communicates with FastAPI through:

```text
http://localhost:8000/api/v1/scan
```

The frontend never communicates directly with Ollama.

---

# 8. Local Single-Laptop Setup

This is the **primary/recommended hackathon setup** because it has the fewest moving parts.

```text
┌─────────────────────────────────────┐
│             ONE LAPTOP              │
│                                     │
│  Next.js                            │
│  localhost:3000                     │
│       │                             │
│       │ HTTP                        │
│       ▼                             │
│  FastAPI                            │
│  localhost:8000                     │
│       │                             │
│       │ HTTP                        │
│       ▼                             │
│  Ollama                             │
│  localhost:11434                    │
│       │                             │
│       ▼                             │
│  Gemma 3 4B                         │
└─────────────────────────────────────┘
```

Start:

### Terminal 1 — Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ollama

Make sure Ollama is running and Gemma 3 4B has been pulled:

```bash
ollama pull gemma3:4b
```

Then open:

```text
http://localhost:3000
```

---

# 9. Local Network Setup

LAN mode is available when the frontend and backend need to run on separate laptops.

Example:

```text
Frontend Laptop
192.168.1.10:3000
       │
       │ HTTP
       ▼
Backend Laptop
192.168.1.20:8000
       │
       │ HTTP
       ▼
Ollama
192.168.1.20:11434
```

Ollama remains on the backend laptop.

The frontend laptop does **not** need Ollama installed.

---

# 10. Backend LAN Startup

On the backend laptop, determine its LAN IP.

Example:

```text
192.168.1.20
```

Start FastAPI using:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

This makes FastAPI listen for connections on the LAN.

The backend is then reachable from the frontend laptop at:

```text
http://192.168.1.20:8000
```

Do not use:

```text
http://192.168.1.20:3000
```

for the backend.

Port responsibilities:

```text
3000 → Next.js
8000 → FastAPI
11434 → Ollama
```

---

# 11. Frontend LAN Configuration

On the frontend laptop, create/update:

```text
frontend/.env.local
```

Set:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.20:8000
```

Then:

```bash
npm run dev
```

The frontend can remain available locally at:

```text
http://localhost:3000
```

Its API requests go to:

```text
http://192.168.1.20:8000
```

Example:

```text
Frontend Laptop
localhost:3000
      │
      ▼
192.168.1.20:8000/api/v1/scan
      │
      ▼
Backend Laptop
      │
      ▼
localhost:11434
Ollama + Gemma 3 4B
```

---

# 12. CORS Configuration

FastAPI must allow the frontend origin.

For local development, allow:

```text
http://localhost:3000
```

For LAN development, also allow the frontend laptop's origin, for example:

```text
http://192.168.1.10:3000
```

The exact LAN IP depends on the frontend laptop.

Do not use a permanently hardcoded example IP if the implementation can read the allowed origins from configuration.

For the hackathon, a simple configurable CORS list is sufficient.

---

# 13. LAN Security Warning

LAN mode exposes the FastAPI server to other devices on the same network if network and firewall rules permit it.

For example:

```text
0.0.0.0:8000
```

means the backend is listening on network interfaces, not only localhost.

Therefore:

> Use LAN mode only when the second laptop actually needs to connect to the backend.

The hackathon's primary setup should remain the single-laptop configuration whenever practical.

No internet-facing deployment is required for the MVP.

---

# 14. API Integration

The frontend sends:

```text
POST /api/v1/scan
```

as:

```text
multipart/form-data
```

with:

```text
file=<project.zip>
```

Example logical request:

```text
Frontend
    ↓
POST http://localhost:8000/api/v1/scan
    ↓
FastAPI
    ↓
ZIP extraction
    ↓
Security scanners
    ↓
Gemma explanation
    ↓
JSON response
    ↓
Frontend report
```

The frontend waits for the synchronous response.

There is:

- no scan ID
- no polling
- no WebSocket
- no background job
- no database

for the MVP.

---

# 15. API Success Response

The frontend expects:

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

The actual `findings` array contains the detailed findings.

The frontend should render the backend response rather than recreating scanner logic.

---

# 16. API Error Response

Backend errors use:

```json
{
  "error": {
    "code": "INVALID_ZIP",
    "message": "The uploaded file is not a valid ZIP archive."
  }
}
```

The frontend should display the supplied message.

Supported error codes:

```text
INVALID_FILE
INVALID_ZIP
ZIP_TOO_LARGE
TOO_MANY_FILES
EXTRACTED_SIZE_EXCEEDED
UNSAFE_ZIP
SCAN_FAILED
```

---

# 17. Complete Startup Checklist

Before the demo:

### Backend PC

```text
[ ] Python 3.12+
[ ] Backend virtual environment created
[ ] pip install -r requirements.txt completed
[ ] Ollama installed
[ ] Gemma 3 4B pulled
[ ] Ollama service running
[ ] backend/.env configured
[ ] FastAPI starts on port 8000
[ ] /api/health works
```

### Frontend

```text
[ ] Node.js installed
[ ] npm install completed
[ ] NEXT_PUBLIC_API_URL configured
[ ] npm run dev works
[ ] Frontend opens on port 3000
```

### Integration

```text
[ ] Frontend can reach backend
[ ] CORS allows frontend origin
[ ] ZIP upload works
[ ] Scan completes
[ ] Findings appear
[ ] Gemma explanations appear
[ ] Scanner still works if Gemma is unavailable
```

---

# 18. Recommended Hackathon Startup

For the final demo, use the simplest possible architecture.

## Preferred

```text
ONE LAPTOP

Browser
  ↓
Next.js :3000
  ↓
FastAPI :8000
  ↓
Ollama :11434
  ↓
Gemma 3 4B
```

Open:

```text
http://localhost:3000
```

## Only use LAN mode if necessary

```text
Laptop A
Frontend :3000
     ↓
Laptop B
Backend :8000
     ↓
Ollama :11434
```

This keeps the LLM local to the backend machine.

---

# 19. Troubleshooting

## Frontend cannot connect to backend

Check:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

or, in LAN mode:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.20:8000
```

Confirm FastAPI is running.

---

## LAN frontend cannot reach backend

Check:

1. Both laptops are on the same Wi-Fi/LAN.
2. Backend uses:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. Backend laptop firewall allows TCP port `8000`.
4. The frontend is using the correct backend LAN IP.
5. FastAPI CORS allows the frontend origin.

---

## Gemma explanation fails

Check:

```text
Ollama service
Gemma 3 4B model
OLLAMA_BASE_URL
OLLAMA_MODEL
```

The backend sets a 15-second timeout per finding when calling Ollama. If Ollama times out, returns invalid JSON, or fails, the scan uses predefined fallback explanations (`description`, `impact`, `recommendation`).

Gemma is an explanation layer, not the vulnerability detector. The scan must complete even if Ollama is offline.

---

## Port already in use

If port `8000` is occupied, stop the process using it before starting FastAPI.

Do not change the application architecture simply because another process is occupying the port.

The expected MVP ports are:

```text
Frontend → 3000
Backend  → 8000
Ollama   → 11434
```

---

# 20. Security Notes

Do not commit real credentials.

The `.env` files used for local configuration should be excluded from Git.

Example `.gitignore` entries:

```text
.env
.env.local
.venv/
__pycache__/
node_modules/
.next/
```

The demo's fake secret belongs inside the deliberate demo fixture only.

Never use a real API key as the hardcoded-secret demonstration.

---

# 21. Final Integration Principle

Keep the integration boring and reliable.

```text
Frontend
   ↓
HTTP
   ↓
FastAPI
   ↓
Deterministic Scanner
   ↓
Small Evidence
   ↓
Ollama / Gemma
   ↓
Report JSON
   ↓
Frontend
```

The **single-laptop setup is the default**.

The **LAN setup is an optional development configuration** for when the frontend and backend are running on different laptops.

Ollama always runs on the **same PC as the backend**.
