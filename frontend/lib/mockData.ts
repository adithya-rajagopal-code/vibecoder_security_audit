import { ScanResponse } from "./types";

/**
 * Standard test report matching 07_DEMO_PROJECT_SPEC.md (VibeShop demo)
 * and 05_API_CONTRACT.md
 */
export const MOCK_VIBESHOP_REPORT: ScanResponse = {
  status: "completed",
  security_score: 20,
  summary: {
    total: 3,
    critical: 2,
    high: 1,
    medium: 0,
    low: 0,
  },
  findings: [
    {
      id: "SEC-001",
      type: "hardcoded_secret",
      title: "Hardcoded Secret",
      severity: "critical",
      confidence: "high",
      file: "config.py",
      line: 4,
      evidence: "STRIPE_API_KEY = \"[REDACTED]\"",
      code_context: {
        start_line: 1,
        lines: [
          "import os",
          "",
          "APP_NAME = \"VibeShop\"",
          "STRIPE_API_KEY = \"sk_test_FAKE_VIBESHOP_123456\"",
          "DEBUG = True",
          "PORT = 8080",
        ],
      },
      description:
        "A credential or API key appears to be hardcoded directly in the source code.",
      impact:
        "Anyone who gains access to the source code repository or compiled bundle may be able to use the exposed credential to access external payment services.",
      recommendation:
        "Move the secret to a secure environment variable (e.g. via .env or secrets manager) and immediately rotate the exposed credential.",
    },
    {
      id: "SEC-002",
      type: "sql_injection",
      title: "Potential SQL Injection",
      severity: "critical",
      confidence: "medium",
      file: "users.py",
      line: 5,
      evidence: "query = f\"SELECT * FROM users WHERE name='{name}'\"",
      code_context: {
        start_line: 1,
        lines: [
          "from flask import request",
          "",
          "def get_user():",
          "    name = request.args.get('name')",
          "    query = f\"SELECT * FROM users WHERE name='{name}'\"",
          "    result = db.execute(query)",
          "    return result",
        ],
      },
      description:
        "User-controlled input appears to be interpolated directly into an SQL query string without parameterization.",
      impact:
        "An attacker may be able to manipulate query logic to bypass authentication, extract confidential database records, or modify tables.",
      recommendation:
        "Use parameterized queries or prepared statements (e.g. db.execute('SELECT * FROM users WHERE name = %s', (name,))) instead of f-strings.",
    },
    {
      id: "SEC-003",
      type: "potential_idor",
      title: "Potential Authorization Vulnerability",
      severity: "high",
      confidence: "medium",
      file: "account.py",
      line: 5,
      evidence: "account = Account.query.get(account_id)",
      code_context: {
        start_line: 1,
        lines: [
          "from flask import jsonify",
          "",
          "def get_account(account_id):",
          "    # Resource lookup using user-supplied ID",
          "    account = Account.query.get(account_id)",
          "    return jsonify(account)",
        ],
      },
      description:
        "A user-controlled resource identifier is used in a database lookup without an obvious authorization or ownership verification check.",
      impact:
        "An attacker may potentially access another user's private account details by simply changing the resource identifier in the request.",
      recommendation:
        "Verify that the authenticated user owns or is explicitly authorized to view the requested resource before returning record data.",
    },
  ],
};

export const MOCK_CLEAN_REPORT: ScanResponse = {
  status: "completed",
  security_score: 100,
  summary: {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  },
  findings: [],
};
