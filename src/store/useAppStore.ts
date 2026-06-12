import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Alert,
  RiskRule,
  BlackWhiteItem,
  Report,
  User,
  AlertFilters,
  VerifyRecord,
  Disposition,
  TrendDataPoint,
  RegionData,
  OperationLog,
  AuditLog,
  AuditFilters,
  ReviewRecord,
  CustomReportConfig,
  RiskLevel,
} from '@/types';
import {
  mockAlerts,
  mockRules,
  mockBlackWhiteList,
  mockReports,
  mockUser,
  mockAuditLogs,
  trendData7d,
  trendData30d,
  regionData,
  operators,
} from '@/data/mockData';
import { generateId, getDispositionConfig, formatDate } from '@/utils/formatters';

interface AppState {
  alerts: Alert[];
  rules: RiskRule[];
  lists: BlackWhiteItem[];
  reports: Report[];
  auditLogs: AuditLog[];
  currentUser: User;
  filters: AlertFilters;
  auditFilters: AuditFilters;
  trend7d: TrendDataPoint[];
  trend30d: TrendDataPoint[];
  regions: RegionData[];
  sidebarCollapsed: boolean;
  lastHydration: number;

  setFilters: (filters: Partial<AlertFilters>) => void;
  resetFilters: () => void;
  setAuditFilters: (filters: Partial<AuditFilters>) => void;
  resetAuditFilters: () => void;
  toggleSidebar: () => void;

  getCaseById: (id: string) => (Alert & { relatedAlerts: Alert[] }) | undefined;
  assignAlert: (alertId: string, assignee: string, operator: string) => void;
  batchAssignAlerts: (alertIds: string[], assignee: string, operator: string) => void;
  addVerifyRecord: (alertId: string, record: Omit<VerifyRecord, 'id' | 'createdAt' | 'operator'>, operator: string) => void;
  setDisposition: (alertId: string, disposition: Omit<Disposition, 'createdAt' | 'operator'>, operator: string) => void;
  markFalsePositive: (alertIds: string[], operator: string, reason?: string) => void;
  submitReview: (
    alertId: string,
    opinion: ReviewRecord['opinion'],
    comment: string,
    operator: string
  ) => void;

  updateRuleThreshold: (ruleId: string, threshold: number, operator: string) => void;
  toggleRuleEnabled: (ruleId: string, operator: string) => void;
  addListItem: (item: Omit<BlackWhiteItem, 'id' | 'createdAt' | 'operator'>, operator: string) => void;
  removeListItem: (id: string, operator: string) => void;

  addOperationLog: (alertId: string, log: Omit<OperationLog, 'id' | 'createdAt'>) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'createdAt'>) => void;

  getFilteredAlerts: () => Alert[];
  getGroupedAlerts: () => Record<string, Alert[]>;
  getFilteredAuditLogs: () => AuditLog[];
  generateCustomReport: (config: CustomReportConfig, operator: string) => Report;

  resetAllData: () => void;
}

const initialState = {
  alerts: mockAlerts,
  rules: mockRules,
  lists: mockBlackWhiteList,
  reports: mockReports,
  auditLogs: mockAuditLogs,
  currentUser: mockUser,
  filters: {},
  auditFilters: {},
  trend7d: trendData7d,
  trend30d: trendData30d,
  regions: regionData,
  sidebarCollapsed: false,
  lastHydration: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
      resetFilters: () => set({ filters: {} }),
      setAuditFilters: (filters) => set((state) => ({ auditFilters: { ...state.auditFilters, ...filters } })),
      resetAuditFilters: () => set({ auditFilters: {} }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addOperationLog: (alertId, log) => {
        const now = new Date().toISOString();
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? {
                  ...a,
                  operationLogs: [
                    ...a.operationLogs,
                    { ...log, id: generateId(), createdAt: now },
                  ],
                }
              : a
          ),
        }));
      },

      addAuditLog: (log) => {
        const now = new Date().toISOString();
        set((state) => ({
          auditLogs: [{ ...log, id: generateId(), createdAt: now }, ...state.auditLogs],
        }));
      },

      getCaseById: (id) => {
        const alert = get().alerts.find((a) => a.id === id);
        if (!alert) return undefined;
        const relatedAlerts = get().alerts
          .filter((a) => a.merchantId === alert.merchantId && a.id !== alert.id)
          .slice(0, 5);
        return { ...alert, relatedAlerts };
      },

      assignAlert: (alertId, assignee, operator) => {
        const now = new Date().toISOString();
        const alert = get().alerts.find((a) => a.id === alertId);
        set((state) => ({
          alerts: state.alerts.map((a) => {
            if (a.id !== alertId) return a;
            const newLog: OperationLog = {
              id: generateId(),
              action: '分派处理人',
              detail: `将预警分派给 ${assignee} 处理`,
              operator,
              createdAt: now,
            };
            return {
              ...a,
              assignee,
              status: 'processing' as const,
              operationLogs: [...a.operationLogs, newLog],
            };
          }),
        }));
        get().addAuditLog({
          action: 'assign',
          targetType: 'alert',
          targetId: alertId,
          targetName: alert?.merchantName,
          detail: `将预警分派给 ${assignee} 处理`,
          operator,
          metadata: { assignee },
        });
      },

      batchAssignAlerts: (alertIds, assignee, operator) => {
        const now = new Date().toISOString();
        const affectedAlerts = get().alerts.filter((a) => alertIds.includes(a.id));
        set((state) => ({
          alerts: state.alerts.map((a) => {
            if (!alertIds.includes(a.id)) return a;
            const newLog: OperationLog = {
              id: generateId(),
              action: '批量分派',
              detail: `批量分派给 ${assignee} 处理`,
              operator,
              createdAt: now,
            };
            return {
              ...a,
              assignee,
              status: 'processing' as const,
              operationLogs: [...a.operationLogs, newLog],
            };
          }),
        }));
        get().addAuditLog({
          action: 'assign',
          targetType: 'alert',
          targetId: alertIds.join(','),
          targetName: `${affectedAlerts.length} 条预警`,
          detail: `批量分派 ${alertIds.length} 条预警给 ${assignee} 处理`,
          operator,
          metadata: { assignee, alertIds, count: alertIds.length },
        });
      },

      addVerifyRecord: (alertId, record, operator) => {
        const now = new Date().toISOString();
        const resultMap = {
          confirmed: '已确认风险',
          denied: '商户否认',
          unreachable: '无法联系',
        };
        const alert = get().alerts.find((a) => a.id === alertId);
        set((state) => ({
          alerts: state.alerts.map((a) => {
            if (a.id !== alertId) return a;
            const verifyRecord: VerifyRecord = {
              ...record,
              id: generateId(),
              createdAt: now,
              operator,
            };
            const opLog: OperationLog = {
              id: generateId(),
              action: '电话核实',
              detail: `联系 ${record.contactPerson} (${record.phone})，结果：${resultMap[record.result]} - ${record.content.slice(0, 50)}${record.content.length > 50 ? '...' : ''}`,
              operator,
              createdAt: now,
            };
            return {
              ...a,
              verifyRecords: [...a.verifyRecords, verifyRecord],
              operationLogs: [...a.operationLogs, opLog],
            };
          }),
        }));
        get().addAuditLog({
          action: 'verify_call',
          targetType: 'alert',
          targetId: alertId,
          targetName: alert?.merchantName,
          detail: `电话核实：联系 ${record.contactPerson}，结果：${resultMap[record.result]}`,
          operator,
          metadata: { result: record.result, contactPerson: record.contactPerson },
        });
      },

      setDisposition: (alertId, disposition, operator) => {
        const now = new Date().toISOString();
        const dispLabel = getDispositionConfig(disposition.type).label;
        const alert = get().alerts.find((a) => a.id === alertId);
        set((state) => ({
          alerts: state.alerts.map((a) => {
            if (a.id !== alertId) return a;
            const newDisposition: Disposition = {
              ...disposition,
              createdAt: now,
              operator,
            };
            const opLog: OperationLog = {
              id: generateId(),
              action: '处置结论',
              detail: `处置类型：${dispLabel} - ${disposition.remark.slice(0, 60)}${disposition.remark.length > 60 ? '...' : ''}`,
              operator,
              createdAt: now,
            };
            return {
              ...a,
              status: 'reviewing' as const,
              disposition: newDisposition,
              operationLogs: [...a.operationLogs, opLog],
            };
          }),
        }));
        get().addAuditLog({
          action: 'disposition',
          targetType: 'alert',
          targetId: alertId,
          targetName: alert?.merchantName,
          detail: `提交处置结论：${dispLabel} - ${disposition.remark.slice(0, 50)}${disposition.remark.length > 50 ? '...' : ''}`,
          operator,
          metadata: { dispositionType: disposition.type },
        });
      },

      markFalsePositive: (alertIds, operator, reason = '核实为正常交易') => {
        const now = new Date().toISOString();
        const affectedAlerts = get().alerts.filter((a) => alertIds.includes(a.id));
        set((state) => ({
          alerts: state.alerts.map((a) => {
            if (!alertIds.includes(a.id)) return a;
            const opLog: OperationLog = {
              id: generateId(),
              action: '标记误报',
              detail: `标记为误报，原因：${reason}`,
              operator,
              createdAt: now,
            };
            return {
              ...a,
              status: 'false_positive' as const,
              operationLogs: [...a.operationLogs, opLog],
            };
          }),
        }));
        get().addAuditLog({
          action: 'mark_false_positive',
          targetType: 'alert',
          targetId: alertIds.join(','),
          targetName: `${affectedAlerts.length} 条预警`,
          detail: `标记 ${alertIds.length} 条预警为误报，原因：${reason}`,
          operator,
          metadata: { reason, alertIds, count: alertIds.length },
        });
      },

      submitReview: (alertId, opinion, comment, operator) => {
        const now = new Date().toISOString();
        const alert = get().alerts.find((a) => a.id === alertId);
        if (!alert) return;

        const opinionLabel = {
          approve: '复核通过',
          reject: '复核驳回',
          escalate: '需进一步核查',
        }[opinion];

        const ruleChanges = get().auditLogs.filter(
          (log) =>
            log.targetType === 'rule' &&
            log.action === 'rule_threshold_update' &&
            new Date(log.createdAt) >= new Date(alert.createdAt)
        );

        const reviewRecord: ReviewRecord = {
          id: generateId(),
          reviewer: operator,
          opinion,
          comment,
          reviewedAt: now,
          dispositionSnapshot: alert.disposition,
          verifyRecordsSnapshot: alert.verifyRecords,
          ruleChangesSnapshot: ruleChanges.map((log) => ({
            ruleId: log.targetId,
            ruleName: log.targetName || '',
            oldThreshold: (log.metadata?.oldThreshold as number) || 0,
            newThreshold: (log.metadata?.newThreshold as number) || 0,
          })),
        };

        set((state) => ({
          alerts: state.alerts.map((a) => {
            if (a.id !== alertId) return a;
            const opLog: OperationLog = {
              id: generateId(),
              action: '复核意见',
              detail: `${opinionLabel} - ${comment.slice(0, 50)}${comment.length > 50 ? '...' : ''}`,
              operator,
              createdAt: now,
            };
            return {
              ...a,
              status: opinion === 'approve' ? 'reviewed' as const : 'processing' as const,
              reviewRecords: [...a.reviewRecords, reviewRecord],
              operationLogs: [...a.operationLogs, opLog],
            };
          }),
        }));

        get().addAuditLog({
          action: 'review',
          targetType: 'alert',
          targetId: alertId,
          targetName: alert.merchantName,
          detail: `${opinionLabel} - ${comment.slice(0, 50)}${comment.length > 50 ? '...' : ''}`,
          operator,
          metadata: { opinion, comment },
        });
      },

      updateRuleThreshold: (ruleId, threshold, operator) => {
        const rule = get().rules.find((r) => r.id === ruleId);
        if (!rule) return;
        const oldThreshold = rule.currentThreshold;
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, currentThreshold: threshold } : r
          ),
        }));
        get().addAuditLog({
          action: 'rule_threshold_update',
          targetType: 'rule',
          targetId: ruleId,
          targetName: rule.name,
          detail: `规则「${rule.name}」阈值从 ${oldThreshold} ${rule.unit} 调整为 ${threshold} ${rule.unit}`,
          operator,
          metadata: { oldThreshold, newThreshold: threshold, unit: rule.unit },
        });
      },

      toggleRuleEnabled: (ruleId, operator) => {
        const rule = get().rules.find((r) => r.id === ruleId);
        if (!rule) return;
        const newEnabled = !rule.enabled;
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, enabled: newEnabled } : r
          ),
        }));
        get().addAuditLog({
          action: 'rule_toggle',
          targetType: 'rule',
          targetId: ruleId,
          targetName: rule.name,
          detail: `规则「${rule.name}」已${newEnabled ? '启用' : '停用'}`,
          operator,
          metadata: { enabled: newEnabled },
        });
      },

      addListItem: (item, operator) => {
        const now = new Date().toISOString();
        const newItem = { ...item, id: generateId(), createdAt: now, operator };
        set((state) => ({
          lists: [...state.lists, newItem],
        }));
        get().addAuditLog({
          action: 'list_add',
          targetType: 'list',
          targetId: newItem.id,
          targetName: item.value,
          detail: `新增${item.type === 'black' ? '黑名单' : '白名单'}：${item.value}（${item.category}），原因：${item.reason}`,
          operator,
          metadata: { type: item.type, category: item.category, value: item.value },
        });
      },

      removeListItem: (id, operator) => {
        const item = get().lists.find((l) => l.id === id);
        if (!item) return;
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== id),
        }));
        get().addAuditLog({
          action: 'list_remove',
          targetType: 'list',
          targetId: id,
          targetName: item.value,
          detail: `删除${item.type === 'black' ? '黑名单' : '白名单'}：${item.value}（${item.category}）`,
          operator,
          metadata: { type: item.type, category: item.category, value: item.value },
        });
      },

      getFilteredAlerts: () => {
        const state = get();
        let result = [...state.alerts];
        const f = state.filters;

        if (f.merchantName) {
          result = result.filter((a) => a.merchantName.includes(f.merchantName!));
        }
        if (f.minAmount !== undefined) {
          result = result.filter((a) => a.amount >= f.minAmount!);
        }
        if (f.maxAmount !== undefined) {
          result = result.filter((a) => a.amount <= f.maxAmount!);
        }
        if (f.region) {
          result = result.filter((a) => a.region === f.region);
        }
        if (f.riskLevel && f.riskLevel.length > 0) {
          result = result.filter((a) => f.riskLevel!.includes(a.riskLevel));
        }
        if (f.status && f.status.length > 0) {
          result = result.filter((a) => f.status!.includes(a.status));
        }
        if (f.dateFrom) {
          result = result.filter((a) => a.createdAt >= f.dateFrom!);
        }
        if (f.dateTo) {
          result = result.filter((a) => a.createdAt <= f.dateTo! + 'T23:59:59');
        }

        return result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      getGroupedAlerts: () => {
        const alerts = get().getFilteredAlerts();
        const grouped: Record<string, Alert[]> = {};
        alerts.forEach((a) => {
          if (a.similarityGroup) {
            if (!grouped[a.similarityGroup]) grouped[a.similarityGroup] = [];
            grouped[a.similarityGroup].push(a);
          } else {
            grouped[a.id] = [a];
          }
        });
        return grouped;
      },

      getFilteredAuditLogs: () => {
        const state = get();
        let result = [...state.auditLogs];
        const f = state.auditFilters;

        if (f.operator) {
          result = result.filter((log) => log.operator.includes(f.operator!));
        }
        if (f.action && f.action.length > 0) {
          result = result.filter((log) => f.action!.includes(log.action));
        }
        if (f.targetType) {
          result = result.filter((log) => log.targetType === f.targetType);
        }
        if (f.dateFrom) {
          result = result.filter((log) => log.createdAt >= f.dateFrom!);
        }
        if (f.dateTo) {
          result = result.filter((log) => log.createdAt <= f.dateTo! + 'T23:59:59');
        }

        return result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      generateCustomReport: (config, operator) => {
        const { dateFrom, dateTo, riskLevels, regions } = config;
        const allAlerts = get().alerts;

        let filtered = allAlerts.filter((a) => {
          if (a.createdAt < dateFrom) return false;
          if (a.createdAt > dateTo + 'T23:59:59') return false;
          if (riskLevels && riskLevels.length > 0 && !riskLevels.includes(a.riskLevel)) return false;
          if (regions && regions.length > 0 && !regions.includes(a.region)) return false;
          return true;
        });

        const totalAlerts = filtered.length;
        const confirmedRisks = filtered.filter((a) => a.status === 'resolved' || a.status === 'reviewed').length;
        const falsePositives = filtered.filter((a) => a.status === 'false_positive').length;
        const interceptedAmount = filtered
          .filter((a) => a.status === 'resolved' || a.status === 'reviewed')
          .reduce((sum, a) => sum + a.amount, 0);

        const riskDistribution = filtered.reduce(
          (acc, a) => {
            acc[a.riskLevel]++;
            return acc;
          },
          { critical: 0, high: 0, medium: 0, low: 0 } as Record<RiskLevel, number>
        );

        const merchantStats: Record<string, { alertCount: number; riskAmount: number }> = {};
        filtered.forEach((a) => {
          if (!merchantStats[a.merchantName]) {
            merchantStats[a.merchantName] = { alertCount: 0, riskAmount: 0 };
          }
          merchantStats[a.merchantName].alertCount++;
          if (a.status === 'resolved' || a.status === 'reviewed') {
            merchantStats[a.merchantName].riskAmount += a.amount;
          }
        });

        const topMerchants = Object.entries(merchantStats)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.alertCount - a.alertCount)
          .slice(0, 5);

        const avgResponseTime = filtered.length > 0 ? Math.floor(Math.random() * 30) + 30 : 0;

        const report: Report = {
          id: `custom_${generateId()}`,
          type: 'custom',
          period: `${formatDate(dateFrom)} ~ ${formatDate(dateTo)}`,
          generatedAt: new Date().toISOString(),
          config,
          summary: {
            totalAlerts,
            confirmedRisks,
            falsePositives,
            interceptedAmount,
            averageResponseTime: avgResponseTime,
            riskDistribution,
          },
          topMerchants,
        };

        set((state) => ({
          reports: [report, ...state.reports],
        }));

        get().addAuditLog({
          action: 'report_generate',
          targetType: 'report',
          targetId: report.id,
          targetName: '自定义报告',
          detail: `生成自定义报告：${report.period}，共 ${totalAlerts} 条预警`,
          operator,
          metadata: { config, totalAlerts },
        });

        return report;
      },

      resetAllData: () => {
        set(initialState);
        localStorage.removeItem('risk-control-store');
        window.location.reload();
      },
    }),
    {
      name: 'risk-control-store',
      version: 1,
      partialize: (state) => ({
        alerts: state.alerts,
        rules: state.rules,
        lists: state.lists,
        reports: state.reports,
        auditLogs: state.auditLogs,
        sidebarCollapsed: state.sidebarCollapsed,
        filters: state.filters,
        auditFilters: state.auditFilters,
        lastHydration: Date.now(),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.lastHydration = Date.now();
        }
      },
    }
  )
);

export { operators };
