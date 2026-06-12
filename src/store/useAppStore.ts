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
} from '@/types';
import {
  mockAlerts,
  mockRules,
  mockBlackWhiteList,
  mockReports,
  mockUser,
  trendData7d,
  trendData30d,
  regionData,
} from '@/data/mockData';
import { generateId, getDispositionConfig } from '@/utils/formatters';

interface AppState {
  alerts: Alert[];
  rules: RiskRule[];
  lists: BlackWhiteItem[];
  reports: Report[];
  currentUser: User;
  filters: AlertFilters;
  trend7d: TrendDataPoint[];
  trend30d: TrendDataPoint[];
  regions: RegionData[];
  sidebarCollapsed: boolean;
  lastHydration: number;

  setFilters: (filters: Partial<AlertFilters>) => void;
  resetFilters: () => void;
  toggleSidebar: () => void;

  getCaseById: (id: string) => (Alert & { relatedAlerts: Alert[] }) | undefined;
  assignAlert: (alertId: string, assignee: string, operator: string) => void;
  batchAssignAlerts: (alertIds: string[], assignee: string, operator: string) => void;
  addVerifyRecord: (alertId: string, record: Omit<VerifyRecord, 'id' | 'createdAt' | 'operator'>, operator: string) => void;
  setDisposition: (alertId: string, disposition: Omit<Disposition, 'createdAt' | 'operator'>, operator: string) => void;
  markFalsePositive: (alertIds: string[], operator: string, reason?: string) => void;

  updateRuleThreshold: (ruleId: string, threshold: number, operator: string) => void;
  toggleRuleEnabled: (ruleId: string, operator: string) => void;
  addListItem: (item: Omit<BlackWhiteItem, 'id' | 'createdAt' | 'operator'>, operator: string) => void;
  removeListItem: (id: string, operator: string) => void;

  addOperationLog: (alertId: string, log: Omit<OperationLog, 'id' | 'createdAt'>) => void;

  getFilteredAlerts: () => Alert[];
  getGroupedAlerts: () => Record<string, Alert[]>;
  resetAllData: () => void;
}

const initialState = {
  alerts: mockAlerts,
  rules: mockRules,
  lists: mockBlackWhiteList,
  reports: mockReports,
  currentUser: mockUser,
  filters: {},
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
      },

      batchAssignAlerts: (alertIds, assignee, operator) => {
        const now = new Date().toISOString();
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
      },

      addVerifyRecord: (alertId, record, operator) => {
        const now = new Date().toISOString();
        const resultMap = {
          confirmed: '已确认风险',
          denied: '商户否认',
          unreachable: '无法联系',
        };
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
      },

      setDisposition: (alertId, disposition, operator) => {
        const now = new Date().toISOString();
        const dispLabel = getDispositionConfig(disposition.type).label;
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
              status: 'resolved' as const,
              disposition: newDisposition,
              operationLogs: [...a.operationLogs, opLog],
            };
          }),
        }));
      },

      markFalsePositive: (alertIds, operator, reason = '核实为正常交易') => {
        const now = new Date().toISOString();
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
      },

      toggleRuleEnabled: (ruleId, operator) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      addListItem: (item, operator) => {
        const now = new Date().toISOString();
        set((state) => ({
          lists: [...state.lists, { ...item, id: generateId(), createdAt: now, operator }],
        }));
      },

      removeListItem: (id, operator) => {
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== id),
        }));
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
        sidebarCollapsed: state.sidebarCollapsed,
        filters: state.filters,
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
