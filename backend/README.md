# VibeCoder Security Auditor backend

## Setup

From a fresh clone of the repository:

```bash
cd ProjectX/backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

## Run

```bash
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8012
```

## Verify

Health check:

```bash
curl http://127.0.0.1:8012/api/health
# {"status":"ok"}
```

Scan endpoint:

```text
POST /api/v1/scan
Content-Type: multipart/form-data
Field: file (ZIP archive)
```

Run tests:

```bash
PYTHONPATH=. .venv/bin/python -m unittest discover -s tests -v
```

The backend accepts any supported project ZIP at runtime. The VibeShop files under
`tests/fixtures` are test data only and are not required by the application.
