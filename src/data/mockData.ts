import type {
  Alert,
  CaseDetail,
  RiskRule,
  BlackWhiteItem,
  Report,
  User,
  TrendDataPoint,
  RegionData,
  VerifyRecord,
  OperationLog,
} from '@/types';

export const mockUser: User = {
  id: 'u001',
  name: '张风控',
  role: 'analyst',
};

export const operators = ['张风控', '李主管', '王策略', '赵复核', '陈分析'];

const regions = ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '福建', '山东', '河南'];
const merchants = [
  { id: 'm001', name: '优品百货商城' },
  { id: 'm002', name: '乐享电子科技' },
  { id: 'm003', name: '星辰数码专营店' },
  { id: 'm004', name: '万家生活超市' },
  { id: 'm005', name: '鸿达贸易有限公司' },
  { id: 'm006', name: '锦华服饰旗舰店' },
  { id: 'm007', name: '美食汇餐饮连锁' },
  { id: 'm008', name: '畅游旅行社' },
  { id: 'm009', name: '博远教育培训' },
  { id: 'm010', name: '鑫盛珠宝行' },
];

const riskRuleTemplates = [
  { id: 'r001', name: '大额交易', desc: '单笔交易金额超过阈值', severity: 'high' as const },
  { id: 'r002', name: '异地交易', desc: '交易地区与常用地区不符', severity: 'medium' as const },
  { id: 'r003', name: '异常时段交易', desc: '凌晨时段发生交易', severity: 'medium' as const },
  { id: 'r004', name: '高频小额交易', desc: '短时间内多笔小额交易', severity: 'high' as const },
  { id: 'r005', name: '新商户首笔大额', desc: '新入驻商户首笔交易金额过高', severity: 'critical' as const },
  { id: 'r006', name: '卡号风险匹配', desc: '卡号命中风险名单', severity: 'critical' as const },
  { id: 'r007', name: '设备指纹异常', desc: '设备信息异常或更换频繁', severity: 'medium' as const },
  { id: 'r008', name: 'IP地址风险', desc: 'IP命中代理或黑名单', severity: 'high' as const },
];

function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const ruleCount = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...riskRuleTemplates].sort(() => Math.random() - 0.5).slice(0, ruleCount);
    const hitRules = shuffled.map(r => ({
      ruleId: r.id,
      ruleName: r.name,
      severity: r.severity,
      description: r.desc,
    }));

    const severities = hitRules.map(r => r.severity);
    let riskLevel: Alert['riskLevel'] = 'low';
    if (severities.includes('critical')) riskLevel = 'critical';
    else if (severities.includes('high')) riskLevel = 'high';
    else if (severities.includes('medium')) riskLevel = 'medium';

    const scoreMap = { low: [20, 40], medium: [40, 65], high: [65, 85], critical: [85, 99] };
    const [min, max] = scoreMap[riskLevel];
    const riskScore = Math.floor(Math.random() * (max - min)) + min;

    const statuses: Alert['status'][] = ['pending', 'pending', 'processing', 'resolved', 'false_positive'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const hoursAgo = Math.floor(Math.random() * 48);
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000 - Math.random() * 60 * 60 * 1000);

    alerts.push({
      id: `a${String(i + 1).padStart(4, '0')}`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      transactionId: `TXN${Date.now()}${i}`,
      amount: Math.floor(Math.random() * 500000) / 100 + 100,
      currency: 'CNY',
      region: regions[Math.floor(Math.random() * regions.length)],
      riskScore,
      riskLevel,
      hitRules,
      status,
      createdAt: createdAt.toISOString(),
      assignee: status !== 'pending' ? operators[Math.floor(Math.random() * operators.length)] : undefined,
      similarityGroup: Math.random() > 0.6 ? `sim_${merchant.id}_${Math.floor(Math.random() * 5)}` : undefined,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      cardNo: `6222****${Math.floor(1000 + Math.random() * 9000)}`,
      deviceInfo: `DEV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    });
  }

  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const mockAlerts: Alert[] = generateAlerts();

export function getCaseDetail(alertId: string): CaseDetail | undefined {
  const alert = mockAlerts.find(a => a.id === alertId);
  if (!alert) return undefined;

  const verifyRecords: VerifyRecord[] = [
    {
      id: 'v001',
      contactPerson: '王经理',
      phone: '138****5678',
      content: '联系商户核实该笔交易，商户表示该交易为正常客户采购，已提供订单凭证。',
      result: 'denied',
      operator: '张风控',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const operationLogs: OperationLog[] = [
    { id: 'op001', action: '预警创建', detail: '系统自动触发风控规则', operator: 'SYSTEM', createdAt: alert.createdAt },
    { id: 'op002', action: '分派处理人', detail: '分派给张风控处理', operator: '李主管', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'op003', action: '电话核实', detail: '完成商户电话核实记录', operator: '张风控', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ];

  if (alert.status === 'resolved') {
    operationLogs.push({
      id: 'op004',
      action: '处置完成',
      detail: '处置结论：放行 - 确认为正常交易',
      operator: '张风控',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    });
  }

  const relatedAlerts = mockAlerts
    .filter(a => a.merchantId === alert.merchantId && a.id !== alert.id)
    .slice(0, 5);

  return {
    ...alert,
    verifyRecords: alert.status === 'pending' ? [] : verifyRecords,
    disposition: alert.status === 'resolved' ? {
      type: 'approve',
      remark: '经电话核实，该笔交易为商户正常经营收款，交易背景真实，予以放行。',
      operator: '张风控',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    } : undefined,
    operationLogs,
    relatedAlerts,
  };
}

export const mockRules: RiskRule[] = [
  {
    id: 'r001', name: '单笔交易金额阈值', category: '金额规则',
    description: '单笔交易金额超过指定阈值时触发预警',
    currentThreshold: 50000, minThreshold: 1000, maxThreshold: 200000, unit: '元',
    enabled: true, hitCount: 328, falsePositiveCount: 45,
  },
  {
    id: 'r002', name: '日累计交易金额阈值', category: '金额规则',
    description: '商户单日累计交易金额超过阈值时触发',
    currentThreshold: 500000, minThreshold: 10000, maxThreshold: 5000000, unit: '元',
    enabled: true, hitCount: 156, falsePositiveCount: 28,
  },
  {
    id: 'r003', name: '短时间交易频次', category: '频率规则',
    description: '指定时间内交易笔数超过阈值触发',
    currentThreshold: 15, minThreshold: 3, maxThreshold: 100, unit: '笔/小时',
    enabled: true, hitCount: 241, falsePositiveCount: 62,
  },
  {
    id: 'r004', name: '异地交易判定', category: '地区规则',
    description: '交易地区与商户常用地区不一致',
    currentThreshold: 3, minThreshold: 1, maxThreshold: 10, unit: '个地区/日',
    enabled: true, hitCount: 189, falsePositiveCount: 35,
  },
  {
    id: 'r005', name: '夜间交易监控', category: '时间规则',
    description: '凌晨0点-6点期间的交易监控',
    currentThreshold: 3, minThreshold: 1, maxThreshold: 20, unit: '笔',
    enabled: false, hitCount: 98, falsePositiveCount: 21,
  },
  {
    id: 'r006', name: '拒付率阈值', category: '质量规则',
    description: '商户近30天拒付率超过阈值',
    currentThreshold: 1, minThreshold: 0.1, maxThreshold: 5, unit: '%',
    enabled: true, hitCount: 67, falsePositiveCount: 8,
  },
  {
    id: 'r007', name: '退款率异常', category: '质量规则',
    description: '商户退款率连续3天高于阈值',
    currentThreshold: 5, minThreshold: 1, maxThreshold: 20, unit: '%',
    enabled: true, hitCount: 134, falsePositiveCount: 42,
  },
  {
    id: 'r008', name: '新商户交易突增', category: '商户规则',
    description: '入驻30天内商户日交易增长超阈值',
    currentThreshold: 300, minThreshold: 50, maxThreshold: 1000, unit: '%',
    enabled: true, hitCount: 76, falsePositiveCount: 19,
  },
];

export const mockBlackWhiteList: BlackWhiteItem[] = [
  { id: 'bw001', type: 'black', category: 'merchant', value: 'm999_风险商户A', reason: '涉嫌欺诈交易，多次拒付', createdAt: '2026-06-01T10:00:00Z', operator: '李主管' },
  { id: 'bw002', type: 'black', category: 'ip', value: '192.168.1.100', reason: '代理IP，多次异常交易', createdAt: '2026-06-05T14:30:00Z', operator: '张风控' },
  { id: 'bw003', type: 'black', category: 'card', value: '6222****8888', reason: '挂失卡，盗刷风险', createdAt: '2026-06-08T09:15:00Z', operator: '张风控' },
  { id: 'bw004', type: 'white', category: 'merchant', value: 'm001_优品百货商城', reason: '合作3年优质商户，低风险', createdAt: '2026-01-15T00:00:00Z', operator: '李主管' },
  { id: 'bw005', type: 'white', category: 'merchant', value: 'm004_万家生活超市', reason: '大型连锁商超，白名单免检', createdAt: '2026-02-20T00:00:00Z', operator: '王策略' },
  { id: 'bw006', type: 'white', category: 'ip', value: '10.0.0.0/24', reason: '总部办公网段', createdAt: '2026-03-01T00:00:00Z', operator: '王策略' },
];

function generateTrendData(days: number): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const base = 30 + Math.floor(Math.random() * 40);
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count: base + Math.floor(Math.random() * 20),
      critical: Math.floor(base * 0.1),
      high: Math.floor(base * 0.25),
      medium: Math.floor(base * 0.35),
      low: Math.floor(base * 0.3),
    });
  }
  return data;
}

export const trendData7d = generateTrendData(7);
export const trendData30d = generateTrendData(30);

export const regionData: RegionData[] = regions.slice(0, 8).map(r => ({
  region: r,
  count: 20 + Math.floor(Math.random() * 100),
  amount: Math.floor(Math.random() * 5000000) / 100,
}));

export const mockReports: Report[] = [
  {
    id: 'rep001', type: 'daily', period: '2026-06-11',
    generatedAt: '2026-06-12T08:00:00Z',
    summary: {
      totalAlerts: 187, confirmedRisks: 42, falsePositives: 35,
      interceptedAmount: 1286500.00, averageResponseTime: 45,
      riskDistribution: { critical: 18, high: 45, medium: 72, low: 52 },
    },
    topMerchants: merchants.slice(0, 5).map((m, i) => ({
      name: m.name, alertCount: 20 - i * 3, riskAmount: 500000 - i * 80000,
    })),
  },
  {
    id: 'rep002', type: 'daily', period: '2026-06-10',
    generatedAt: '2026-06-11T08:00:00Z',
    summary: {
      totalAlerts: 165, confirmedRisks: 38, falsePositives: 29,
      interceptedAmount: 986400.00, averageResponseTime: 52,
      riskDistribution: { critical: 15, high: 38, medium: 68, low: 44 },
    },
    topMerchants: merchants.slice(0, 5).map((m, i) => ({
      name: m.name, alertCount: 18 - i * 3, riskAmount: 420000 - i * 70000,
    })),
  },
  {
    id: 'rep003', type: 'weekly', period: '2026-W23 (06/02-06/08)',
    generatedAt: '2026-06-09T09:00:00Z',
    summary: {
      totalAlerts: 1156, confirmedRisks: 268, falsePositives: 198,
      interceptedAmount: 7856200.00, averageResponseTime: 48,
      riskDistribution: { critical: 112, high: 278, medium: 445, low: 321 },
    },
    topMerchants: merchants.slice(0, 5).map((m, i) => ({
      name: m.name, alertCount: 120 - i * 18, riskAmount: 3200000 - i * 500000,
    })),
  },
  {
    id: 'rep004', type: 'weekly', period: '2026-W22 (05/26-06/01)',
    generatedAt: '2026-06-02T09:00:00Z',
    summary: {
      totalAlerts: 1089, confirmedRisks: 245, falsePositives: 187,
      interceptedAmount: 6924500.00, averageResponseTime: 51,
      riskDistribution: { critical: 98, high: 265, medium: 420, low: 306 },
    },
    topMerchants: merchants.slice(0, 5).map((m, i) => ({
      name: m.name, alertCount: 108 - i * 15, riskAmount: 2800000 - i * 450000,
    })),
  },
];
