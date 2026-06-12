import type { RiskLevel, AlertStatus, DispositionType, AuditActionType, AuditTargetType } from '@/types';

export function formatCurrency(amount: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return formatDate(isoString);
}

export function getRiskLevelConfig(level: RiskLevel) {
  const configs: Record<RiskLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
    low: { label: '低风险', color: 'text-risk-low', bgColor: 'bg-risk-low/10', borderColor: 'border-risk-low/30' },
    medium: { label: '中风险', color: 'text-risk-medium', bgColor: 'bg-risk-medium/10', borderColor: 'border-risk-medium/30' },
    high: { label: '高风险', color: 'text-risk-high', bgColor: 'bg-risk-high/10', borderColor: 'border-risk-high/30' },
    critical: { label: '极高风险', color: 'text-risk-critical', bgColor: 'bg-risk-critical/10', borderColor: 'border-risk-critical/30' },
  };
  return configs[level];
}

export function getStatusConfig(status: AlertStatus) {
  const configs: Record<AlertStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: '待处理', color: 'text-status-pending', bgColor: 'bg-status-pending/15' },
    processing: { label: '处理中', color: 'text-status-processing', bgColor: 'bg-status-processing/15' },
    resolved: { label: '已处置', color: 'text-status-resolved', bgColor: 'bg-status-resolved/15' },
    false_positive: { label: '已标记误报', color: 'text-status-false_positive', bgColor: 'bg-status-false_positive/15' },
    reviewing: { label: '复核中', color: 'text-accent-secondary', bgColor: 'bg-accent-secondary/15' },
    reviewed: { label: '已复核', color: 'text-risk-low', bgColor: 'bg-risk-low/15' },
  };
  return configs[status];
}

export function getAuditActionLabel(action: AuditActionType): string {
  const labels: Record<AuditActionType, string> = {
    alert_created: '预警创建',
    assign: '分派处理',
    verify_call: '电话核实',
    disposition: '提交处置',
    mark_false_positive: '标记误报',
    review: '复核意见',
    rule_threshold_update: '规则调参',
    rule_toggle: '规则启停',
    list_add: '名单新增',
    list_remove: '名单删除',
    report_generate: '生成报告',
  };
  return labels[action];
}

export function getAuditTargetLabel(targetType: AuditTargetType): string {
  const labels: Record<AuditTargetType, string> = {
    alert: '预警案件',
    rule: '风控规则',
    list: '黑白名单',
    report: '分析报告',
  };
  return labels[targetType];
}

export function getDispositionConfig(type: DispositionType) {
  const configs: Record<DispositionType, { label: string; color: string }> = {
    approve: { label: '放行', color: 'text-risk-low' },
    reject: { label: '拦截', color: 'text-risk-critical' },
    freeze: { label: '冻结', color: 'text-risk-high' },
    escalate: { label: '升级', color: 'text-risk-medium' },
  };
  return configs[type];
}

export function getRiskScoreColor(score: number): string {
  if (score >= 85) return 'text-risk-critical';
  if (score >= 65) return 'text-risk-high';
  if (score >= 40) return 'text-risk-medium';
  return 'text-risk-low';
}

export function getRiskScoreBarColor(score: number): string {
  if (score >= 85) return 'bg-risk-critical';
  if (score >= 65) return 'bg-risk-high';
  if (score >= 40) return 'bg-risk-medium';
  return 'bg-risk-low';
}

export function maskCardNo(cardNo: string): string {
  if (cardNo.length <= 8) return cardNo;
  return cardNo.slice(0, 4) + ' **** **** ' + cardNo.slice(-4);
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
