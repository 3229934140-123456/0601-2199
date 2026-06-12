import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  Sliders,
  List,
  BarChart3,
  ChevronRight,
  X,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { AuditActionType, AuditTargetType } from '@/types';
import {
  formatDateTime,
  formatRelativeTime,
  getAuditActionLabel,
  getAuditTargetLabel,
} from '@/utils/formatters';
import { operators } from '@/data/mockData';
import PageHeader from '@/components/common/PageHeader';
import Select from '@/components/common/Select';

const actionTypeOptions: { value: AuditActionType; label: string }[] = [
  { value: 'alert_created', label: '预警创建' },
  { value: 'assign', label: '分派处理' },
  { value: 'verify_call', label: '电话核实' },
  { value: 'disposition', label: '提交处置' },
  { value: 'mark_false_positive', label: '标记误报' },
  { value: 'review', label: '复核意见' },
  { value: 'rule_threshold_update', label: '规则调参' },
  { value: 'rule_toggle', label: '规则启停' },
  { value: 'list_add', label: '名单新增' },
  { value: 'list_remove', label: '名单删除' },
  { value: 'report_generate', label: '生成报告' },
];

const targetTypeOptions: { value: AuditTargetType; label: string }[] = [
  { value: 'alert', label: '预警案件' },
  { value: 'rule', label: '风控规则' },
  { value: 'list', label: '黑白名单' },
  { value: 'report', label: '分析报告' },
];

const getTargetIcon = (targetType: AuditTargetType) => {
  const icons = {
    alert: AlertTriangle,
    rule: Sliders,
    list: List,
    report: BarChart3,
  };
  return icons[targetType];
};

const getActionColor = (action: AuditActionType): string => {
  const colors: Record<AuditActionType, string> = {
    alert_created: 'text-status-pending',
    assign: 'text-accent-primary',
    verify_call: 'text-accent-secondary',
    disposition: 'text-risk-medium',
    mark_false_positive: 'text-risk-low',
    review: 'text-risk-high',
    rule_threshold_update: 'text-accent-secondary',
    rule_toggle: 'text-accent-primary',
    list_add: 'text-risk-low',
    list_remove: 'text-risk-critical',
    report_generate: 'text-accent-primary',
  };
  return colors[action];
};

export default function AuditCenter() {
  const navigate = useNavigate();
  const {
    auditLogs,
    auditFilters,
    setAuditFilters,
    resetAuditFilters,
    getFilteredAuditLogs,
  } = useAppStore();

  const [selectedAction, setSelectedAction] = useState<AuditActionType[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  const filteredLogs = getFilteredAuditLogs();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = auditLogs.filter((log) => log.createdAt.startsWith(today));
    return {
      total: auditLogs.length,
      today: todayLogs.length,
      alerts: auditLogs.filter((l) => l.targetType === 'alert').length,
      rules: auditLogs.filter((l) => l.targetType === 'rule').length,
      lists: auditLogs.filter((l) => l.targetType === 'list').length,
    };
  }, [auditLogs]);

  const handleActionToggle = (action: AuditActionType) => {
    setSelectedAction((prev) => {
      const next = prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action];
      setAuditFilters({ action: next.length > 0 ? next : undefined });
      return next;
    });
  };

  const handleNavigate = (log: { targetType: AuditTargetType; targetId: string }) => {
    switch (log.targetType) {
      case 'alert':
        if (log.targetId.includes(',')) {
          navigate('/alerts');
        } else {
          navigate(`/cases/${log.targetId}`);
        }
        break;
      case 'rule':
        navigate('/strategy');
        break;
      case 'list':
        navigate('/strategy');
        break;
      case 'report':
        navigate('/reports');
        break;
    }
  };

  const canNavigate = (log: { targetType: AuditTargetType }) => {
    return ['alert', 'rule', 'list', 'report'].includes(log.targetType);
  };

  const hasActiveFilters = Object.values(auditFilters).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== '';
  });

  return (
    <div>
      <PageHeader
        title="全局审计中心"
        subtitle="所有操作留痕记录，支持按操作人、动作类型、时间范围筛选和追溯"
        actions={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'border-accent-primary/50 text-accent-primary' : ''}`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-accent-primary text-bg-primary text-[10px] flex items-center justify-center">
                !
              </span>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-text-primary">{stats.total}</div>
              <div className="text-xs text-text-muted">总操作记录</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-risk-critical/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-risk-critical" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-text-primary">{stats.today}</div>
              <div className="text-xs text-text-muted">今日操作</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-risk-high/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-risk-high" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-text-primary">{stats.alerts}</div>
              <div className="text-xs text-text-muted">案件相关</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-secondary/15 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-accent-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-text-primary">{stats.rules}</div>
              <div className="text-xs text-text-muted">策略调整</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-risk-low/15 flex items-center justify-center">
              <List className="w-5 h-5 text-risk-low" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-text-primary">{stats.lists}</div>
              <div className="text-xs text-text-muted">名单变更</div>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="card p-5 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Filter className="w-4 h-4 text-accent-primary" />
              筛选条件
            </h3>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  resetAuditFilters();
                  setSelectedAction([]);
                }}
                className="text-xs text-text-secondary hover:text-accent-primary flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                重置筛选
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">操作人</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={auditFilters.operator || ''}
                  onChange={(e) => setAuditFilters({ operator: e.target.value || undefined })}
                  placeholder="搜索操作人姓名"
                  className="input-base pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">目标类型</label>
              <Select
                value={auditFilters.targetType || ''}
                options={[{ value: '', label: '全部类型' }, ...targetTypeOptions]}
                onChange={(v) => setAuditFilters({ targetType: (v as AuditTargetType) || undefined })}
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">开始日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="date"
                  value={auditFilters.dateFrom || ''}
                  onChange={(e) => setAuditFilters({ dateFrom: e.target.value || undefined })}
                  className="input-base pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">结束日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="date"
                  value={auditFilters.dateTo || ''}
                  onChange={(e) => setAuditFilters({ dateTo: e.target.value || undefined })}
                  className="input-base pl-9"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs text-text-muted mb-2">动作类型（可多选）</label>
            <div className="flex flex-wrap gap-2">
              {actionTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleActionToggle(opt.value)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedAction.includes(opt.value)
                      ? 'bg-accent-primary/15 border-accent-primary/50 text-accent-primary'
                      : 'bg-bg-secondary border-border-primary text-text-secondary hover:border-accent-primary/30 hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-primary">审计日志列表</span>
            <span className="text-xs text-text-muted">
              共 {filteredLogs.length} 条记录
            </span>
          </div>
        </div>

        <div className="divide-y divide-border-primary">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">暂无符合条件的审计记录</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const TargetIcon = getTargetIcon(log.targetType);
              return (
                <div
                  key={log.id}
                  className={`p-4 hover:bg-bg-secondary/50 transition-colors ${
                    canNavigate(log) ? 'cursor-pointer group' : ''
                  }`}
                  onClick={() => canNavigate(log) && handleNavigate(log)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        log.targetType === 'alert'
                          ? 'bg-risk-high/15'
                          : log.targetType === 'rule'
                          ? 'bg-accent-secondary/15'
                          : log.targetType === 'list'
                          ? 'bg-risk-low/15'
                          : 'bg-accent-primary/15'
                      }`}
                    >
                      <TargetIcon
                        className={`w-5 h-5 ${
                          log.targetType === 'alert'
                            ? 'text-risk-high'
                            : log.targetType === 'rule'
                            ? 'text-accent-secondary'
                            : log.targetType === 'list'
                            ? 'text-risk-low'
                            : 'text-accent-primary'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {getAuditActionLabel(log.action)}
                        </span>
                        <span className="text-xs text-text-muted">
                          {getAuditTargetLabel(log.targetType)}
                        </span>
                        {log.metadata?.oldThreshold !== undefined && log.metadata?.newThreshold !== undefined && (
                          <span className="text-xs text-accent-secondary bg-accent-secondary/10 px-2 py-0.5 rounded">
                            阈值: {String(log.metadata.oldThreshold)} → {String(log.metadata.newThreshold)} {log.metadata.unit ? String(log.metadata.unit) : ''}
                          </span>
                        )}
                        {canNavigate(log) && (
                          <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            点击跳转 <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary mb-1">{log.detail}</p>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        {log.targetName && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {log.targetName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.operator}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(log.createdAt)}
                        </span>
                        <span className="font-mono">{formatDateTime(log.createdAt)}</span>
                      </div>
                    </div>
                    {canNavigate(log) && (
                      <ChevronRight className="w-5 h-5 text-text-muted opacity-0 group-hover:opacity-100 group-hover:text-accent-primary transition-all shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
