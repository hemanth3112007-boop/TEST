export type Severity = 'high' | 'medium' | 'low';

export interface CodeIssue {
  rule_id: string;
  category: string;
  entity: string;
  entity_type?: string;
  line: number;
  col?: number;
  filename?: string;
  context?: string;
  severity: Severity;
  why: string;
  fix: string;
  corrected_snippet?: string;
}

export interface ReviewResponse {
  success: boolean;
  filename: string;
  loc: number;
  score: number;
  counts: {
    high: number;
    medium: number;
    low: number;
  };
  issues: CodeIssue[];
  cliReport: string;
  fixedCode: string | null;
  hasGemini: boolean;
}

export interface SampleFile {
  name: string;
  path: string;
  description: string;
  code: string;
}
