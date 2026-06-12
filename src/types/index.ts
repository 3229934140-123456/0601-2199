export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'false_positive' | 'reviewing' | 'reviewed';

export type DispositionType = 'approve' | 'reject' | 'freeze' | 'escalate';

export interface HitRule {
  ruleId: string;
  ruleName: string;
  severity: RiskLevel;
  description: string;
}

export interface Alert {
  id: string;
  merchantId: string;
  merchantName: string;
  transactionId: string;
  amount: number;
  currency: string;
  region: string;
  riskScore: number;
  riskLevel: RiskLevel;
  hitRules: HitRule[];
  status: AlertStatus;
  createdAt: string;
  assignee?: string;
  similarityGroup?: string;
  ip?: string;
  cardNo?: string;
  deviceInfo?: string;
  verifyRecords: VerifyRecord[];
  disposition?: Disposition;
  operationLogs: OperationLog[];
  reviewRecords: ReviewRecord[];
}

export interface VerifyRecord {
  id: string;
  contactPerson: string;
  phone: string;
  content: string;
  result: 'confirmed' | 'denied' | 'unreachable';
  operator: string;
  createdAt: string;
}

export interface Disposition {
  type: DispositionType;
  remark: string;
  operator: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  action: string;
  detail: string;
  operator: string;
  createdAt: string;
}

export interface CaseDetail extends Alert {
  relatedAlerts: Alert[];
}

export type OperationAction =
  | 'alert_created'
  | 'assign'
  | 'verify_call'
  | 'disposition'
  | 'mark_false_positive'
  | 'rule_threshold_update'
  | 'rule_toggle'
  | 'list_add'
  | 'list_remove'
  | 'note_add';

export interface SystemOperationLog {
  id: string;
  action: OperationAction;
  targetType: 'alert' | 'rule' | 'list';
  targetId: string;
  targetName?: string;
  detail: string;
  operator: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface RiskRule {
  id: string;
  name: string;
  description: string;
  currentThreshold: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  enabled: boolean;
  hitCount: number;
  falsePositiveCount: number;
  category: string;
}

export type ListCategory = 'merchant' | 'ip' | 'card';
export type ListType = 'black' | 'white';

export interface BlackWhiteItem {
  id: string;
  type: ListType;
  category: ListCategory;
  value: string;
  reason: string;
  createdAt: string;
  operator: string;
}

export interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'custom';
  period: string;
  generatedAt: string;
  summary: ReportSummary;
  topMerchants: { name: string; alertCount: number; riskAmount: number }[];
  config?: CustomReportConfig;
}

export interface ReportSummary {
  totalAlerts: number;
  confirmedRisks: number;
  falsePositives: number;
  interceptedAmount: number;
  averageResponseTime: number;
  riskDistribution: Record<RiskLevel, number>;
}

export interface User {
  id: string;
  name: string;
  role: 'analyst' | 'supervisor' | 'strategist';
  avatar?: string;
}

export interface AlertFilters {
  merchantName?: string;
  minAmount?: number;
  maxAmount?: number;
  region?: string;
  riskLevel?: RiskLevel[];
  status?: AlertStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export interface TrendDataPoint {
  date: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RegionData {
  region: string;
  count: number;
  amount: number;
}

export interface ReviewRecord {
  id: string;
  reviewer: string;
  opinion: 'approve' | 'reject' | 'escalate';
  comment: string;
  reviewedAt: string;
  dispositionSnapshot?: Disposition;
  verifyRecordsSnapshot?: VerifyRecord[];
  ruleChangesSnapshot?: { ruleId: string; ruleName: string; oldThreshold: number; newThreshold: number }[];
}

export type AuditActionType =
  | 'alert_created'
  | 'assign'
  | 'verify_call'
  | 'disposition'
  | 'mark_false_positive'
  | 'review'
  | 'rule_threshold_update'
  | 'rule_toggle'
  | 'list_add'
  | 'list_remove'
  | 'report_generate';

export type AuditTargetType = 'alert' | 'rule' | 'list' | 'report';

export interface AuditLog {
  id: string;
  action: AuditActionType;
  targetType: AuditTargetType;
  targetId: string;
  targetName?: string;
  detail: string;
  operator: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AuditFilters {
  operator?: string;
  action?: AuditActionType[];
  dateFrom?: string;
  dateTo?: string;
  targetType?: AuditTargetType;
}

export interface CustomReportConfig {
  dateFrom: string;
  dateTo: string;
  riskLevels?: RiskLevel[];
  regions?: string[];
}
