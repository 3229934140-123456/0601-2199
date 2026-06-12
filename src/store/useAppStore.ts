import { create } from 'zustand';
import type {
  Alert,
  CaseDetail,
  RiskRule,
  BlackWhiteItem,
  Report,
  User,
  AlertFilters,
  VerifyRecord,
  Disposition,
  TrendDataPoint,
  RegionData,
} from '@/types';
import {
  mockAlerts,
  mockRules,
  mockBlackWhiteList,
  mockReports,
  mockUser,
  getCaseDetail,
  trendData7d,
  trendData30d,
  regionData,
} from '@/data/mockData';
import { generateId } from '@/utils/formatters';

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

  setFilters: (filters: Partial<AlertFilters>) => void;
  resetFilters: () => void;
  toggleSidebar: () => void;

  getCaseById: (id: string) => CaseDetail | undefined;
  assignAlert: (alertId: string, assignee: string) => void;
  updateAlertStatus: (alertId: string, status: Alert['status']) => void;
  addVerifyRecord: (alertId: string, record: Omit<VerifyRecord, 'id' | 'createdAt'>) => void;
  setDisposition: (alertId: string, disposition: Omit<Disposition, 'createdAt'>) => void;
  markFalsePositive: (alertIds: string[]) => void;

  updateRuleThreshold: (ruleId: string, threshold: number) => void;
  toggleRuleEnabled: (ruleId: string) => void;
  addListItem: (item: Omit<BlackWhiteItem, 'id' | 'createdAt'>) => void;
  removeListItem: (id: string) => void;

  getFilteredAlerts: () => Alert[];
  getGroupedAlerts: () => Record<string, Alert[]>;
}

export const useAppStore = create<AppState>((set, get) => ({
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

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: {} }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  getCaseById: (id) => {
    return getCaseDetail(id);
  },

  assignAlert: (alertId, assignee) => set((state) => ({
    alerts: state.alerts.map(a =>
      a.id === alertId ? { ...a, assignee, status: 'processing' as const } : a
    ),
  })),

  updateAlertStatus: (alertId, status) => set((state) => ({
    alerts: state.alerts.map(a => a.id === alertId ? { ...a, status } : a),
  })),

  addVerifyRecord: (alertId, record) => {
    const now = new Date().toISOString();
    set((state) => ({
      alerts: state.alerts.map(a => {
        if (a.id !== alertId) return a;
        const existing = (a as CaseDetail).verifyRecords || [];
        return {
          ...a,
          verifyRecords: [...existing, { ...record, id: generateId(), createdAt: now }],
        } as CaseDetail;
      }),
    }));
  },

  setDisposition: (alertId, disposition) => {
    const now = new Date().toISOString();
    set((state) => ({
      alerts: state.alerts.map(a =>
        a.id === alertId
          ? { ...a, status: 'resolved' as const, disposition: { ...disposition, createdAt: now } } as CaseDetail
          : a
      ),
    }));
  },

  markFalsePositive: (alertIds) => set((state) => ({
    alerts: state.alerts.map(a =>
      alertIds.includes(a.id) ? { ...a, status: 'false_positive' as const } : a
    ),
  })),

  updateRuleThreshold: (ruleId, threshold) => set((state) => ({
    rules: state.rules.map(r => r.id === ruleId ? { ...r, currentThreshold: threshold } : r),
  })),

  toggleRuleEnabled: (ruleId) => set((state) => ({
    rules: state.rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r),
  })),

  addListItem: (item) => set((state) => ({
    lists: [...state.lists, { ...item, id: generateId(), createdAt: new Date().toISOString() }],
  })),

  removeListItem: (id) => set((state) => ({
    lists: state.lists.filter(l => l.id !== id),
  })),

  getFilteredAlerts: () => {
    const state = get();
    let result = [...state.alerts];
    const f = state.filters;

    if (f.merchantName) {
      result = result.filter(a => a.merchantName.includes(f.merchantName!));
    }
    if (f.minAmount !== undefined) {
      result = result.filter(a => a.amount >= f.minAmount!);
    }
    if (f.maxAmount !== undefined) {
      result = result.filter(a => a.amount <= f.maxAmount!);
    }
    if (f.region) {
      result = result.filter(a => a.region === f.region);
    }
    if (f.riskLevel && f.riskLevel.length > 0) {
      result = result.filter(a => f.riskLevel!.includes(a.riskLevel));
    }
    if (f.status && f.status.length > 0) {
      result = result.filter(a => f.status!.includes(a.status));
    }
    if (f.dateFrom) {
      result = result.filter(a => a.createdAt >= f.dateFrom!);
    }
    if (f.dateTo) {
      result = result.filter(a => a.createdAt <= f.dateTo! + 'T23:59:59');
    }

    return result;
  },

  getGroupedAlerts: () => {
    const alerts = get().getFilteredAlerts();
    const grouped: Record<string, Alert[]> = {};
    alerts.forEach(a => {
      if (a.similarityGroup) {
        if (!grouped[a.similarityGroup]) grouped[a.similarityGroup] = [];
        grouped[a.similarityGroup].push(a);
      } else {
        grouped[a.id] = [a];
      }
    });
    return grouped;
  },
}));
