export type Severity = "critical" | "high" | "medium" | "low";

export type Confidence = "high" | "medium" | "low";

export type FindingType =
  | "hardcoded_secret"
  | "exposed_env"
  | "sql_injection"
  | "potential_idor"
  | string;

export interface CodeContext {
  start_line: number;
  lines: string[];
}

export interface Finding {
  id: string;
  type: FindingType;
  title: string;
  severity: Severity;
  confidence: Confidence;
  file: string;
  line: number;
  evidence: string;
  code_context?: CodeContext;
  description: string;
  impact: string;
  recommendation: string;
}

export interface Summary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ScanResponse {
  status: "completed" | string;
  security_score: number;
  summary: Summary;
  findings: Finding[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type AppState = "upload" | "scanning" | "report" | "error";

export interface PassedCheckItem {
  category: "secrets" | "sql_injection" | "authorization";
  name: string;
  passed: boolean;
  message: string;
}
