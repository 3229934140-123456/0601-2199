import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  Users,
  XCircle,
  CheckSquare,
  Eye,
  Layers,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Alert, RiskLevel, AlertStatus } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  getRiskLevelConfig,
  getStatusConfig,
  getRiskScoreBarColor,
  truncateText,
} from '@/utils/formatters';
import PageHeader from '@/components/common/PageHeader';
import Select from '@/components/common/Select';
import RiskScoreBadge from '@/components/common/RiskScoreBadge';

const riskLevelOptions: { value: RiskLevel; label: string }[] = [
  { value: 'critical', label: '极高风险' },
  { value: 'high', label: '高风险' },
  { value: 'medium', label: '中风险' },
  { value: 'low', label: '低风险' },
];

const statusOptions: { value: AlertStatus; label: string }[] = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已处置' },
  { value: 'false_positive', label: '已标记误报' },
];

const regionOptions = [
  { value: '', label: '全部地区' },
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '广东', label: '广东' },
  { value: '浙江', label: '浙江' },
  { value: '江苏', label: '江苏' },
  { value: '四川', label: '四川' },
];

export default function AlertList() {
  const navigate = useNavigate();
  const { getFilteredAlerts, getGroupedAlerts, setFilters, resetFilters, filters, markFalsePositive } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showGrouped, setShowGrouped] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  const alerts = getFilteredAlerts();
  const groupedAlerts = getGroupedAlerts();

  const displayData = useMemo(() => {
    if (!showGrouped) return alerts.map(a => ({ key: a.id, alerts: [a], isGroup: false }));
    return Object.entries(groupedAlerts).map(([key, items]) => ({
      key,
      alerts: items,
      isGroup: items.length > 1,
    }));
  }, [alerts, groupedAlerts, showGrouped]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === alerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(alerts.map(a => a.id)));
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleBatchFalsePositive = () => {
    if (selectedIds.size === 0) return;
    markFalsePositive(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const AlertRow = ({ alert, isNested = false }: { alert: Alert; isNested?: boolean }) => {
    const riskCfg = getRiskLevelConfig(alert.riskLevel);
    const statusCfg = getStatusConfig(alert.status);
    const isSelected = selectedIds.has(alert.id);
    const isCritical = alert.riskLevel === 'critical';

    return (
      <tr
        className={`border-b border-border-primary hover:bg-bg-hover/50 transition-colors cursor-pointer ${
          isCritical && alert.status === 'pending' ? 'animate-pulse-glow' : ''
        } ${isNested ? 'bg-bg-secondary/30' : ''}`}
        onClick={() => navigate(`/cases/${alert.id}`)}
      >
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(alert.id)}
            className="w-4 h-4 rounded border-border-secondary bg-bg-secondary text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
          />
        </td>
        <td className="px-4 py-3">
          <span className="font-mono text-sm text-text-secondary">{alert.id}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <RiskScoreBadge score={alert.riskScore} size="sm" />
            <span className={`tag ${riskCfg.bgColor} ${riskCfg.color} border ${riskCfg.borderColor}`}>
              {riskCfg.label}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-text-primary">{alert.merchantName}</div>
          <div className="text-xs text-text-muted">{alert.merchantId}</div>
        </td>
        <td className="px-4 py-3 font-mono text-sm text-text-primary">{formatCurrency(alert.amount)}</td>
        <td className="px-4 py-3">
          <span className="text-sm text-text-primary">{alert.region}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {alert.hitRules.slice(0, 2).map(r => (
              <span key={r.ruleId} className="text-xs bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded">
                {r.ruleName}
              </span>
            ))}
            {alert.hitRules.length > 2 && (
              <span className="text-xs text-text-muted">+{alert.hitRules.length - 2}</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`tag ${statusCfg.bgColor} ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-text-secondary">{alert.assignee || '-'}</span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-text-muted">{formatDateTime(alert.createdAt)}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-accent-primary transition-colors"
              title="查看详情"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <PageHeader
        title="预警列表"
        subtitle={`共 ${alerts.length} 条预警记录，${selectedIds.size > 0 ? `已选中 ${selectedIds.size} 条` : '支持批量操作'}`}
        actions={
          <>
            <button
              onClick={() => setShowGrouped(!showGrouped)}
              className={`btn-secondary flex items-center gap-2 ${showGrouped ? 'border-accent-primary/50 text-accent-primary' : ''}`}
            >
              <Layers className="w-4 h-4" />
              {showGrouped ? '取消聚合' : '相似聚合'}
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出
            </button>
          </>
        }
      />

      <div className="card mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-primary">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            高级筛选
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {Object.keys(filters).length > 0 && (
            <button onClick={resetFilters} className="text-xs text-accent-primary hover:underline">
              重置筛选
            </button>
          )}
        </div>

        {showFilters && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">商户名称</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="输入商户名称"
                  value={filters.merchantName || ''}
                  onChange={e => setFilters({ merchantName: e.target.value || undefined })}
                  className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">交易金额范围 (元)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  value={filters.minAmount || ''}
                  onChange={e => setFilters({ minAmount: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={filters.maxAmount || ''}
                  onChange={e => setFilters({ maxAmount: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">地区</label>
              <Select
                value={filters.region || ''}
                options={regionOptions}
                onChange={v => setFilters({ region: v || undefined })}
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">风险等级</label>
              <div className="flex flex-wrap gap-1.5">
                {riskLevelOptions.map(opt => {
                  const active = filters.riskLevel?.includes(opt.value);
                  const cfg = getRiskLevelConfig(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const current = filters.riskLevel || [];
                        const next = active
                          ? current.filter(v => v !== opt.value)
                          : [...current, opt.value];
                        setFilters({ riskLevel: next.length > 0 ? next : undefined });
                      }}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        active
                          ? `${cfg.bgColor} ${cfg.color} border-current`
                          : 'bg-bg-secondary text-text-muted border-border-primary hover:border-accent-primary/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs text-text-secondary mb-1.5">预警状态</label>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map(opt => {
                  const active = filters.status?.includes(opt.value);
                  const cfg = getStatusConfig(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const current = filters.status || [];
                        const next = active
                          ? current.filter(v => v !== opt.value)
                          : [...current, opt.value];
                        setFilters({ status: next.length > 0 ? next : undefined });
                      }}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        active
                          ? `${cfg.bgColor} ${cfg.color} border-current`
                          : 'bg-bg-secondary text-text-muted border-border-primary hover:border-accent-primary/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">开始日期</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={e => setFilters({ dateFrom: e.target.value || undefined })}
                className="input-base text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">结束日期</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={e => setFilters({ dateTo: e.target.value || undefined })}
                className="input-base text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="card mb-4 p-4 flex items-center justify-between bg-accent-primary/5 border-accent-primary/30 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <CheckSquare className="w-4 h-4 text-accent-primary" />
            已选择 <span className="font-mono font-bold text-accent-primary">{selectedIds.size}</span> 条预警
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              批量分派
            </button>
            <button onClick={handleBatchFalsePositive} className="btn-secondary text-xs flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              标记误报
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-text-muted hover:text-text-primary">
              取消选择
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-bg-secondary border-b border-border-primary">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === alerts.length && alerts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border-secondary bg-bg-secondary text-accent-primary focus:ring-accent-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">预警ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">风险评分</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">商户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">交易金额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">地区</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">命中规则</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">处理人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">触发时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map(({ key, alerts: groupAlerts, isGroup }) => {
                if (!isGroup) {
                  return <AlertRow key={key} alert={groupAlerts[0]} />;
                }

                const isExpanded = expandedGroups.has(key);
                const maxScore = Math.max(...groupAlerts.map(a => a.riskScore));
                const maxLevel = groupAlerts.reduce((max, a) => {
                  const order = { critical: 4, high: 3, medium: 2, low: 1 };
                  return order[a.riskLevel] > order[max] ? a.riskLevel : max;
                }, 'low' as RiskLevel);
                const riskCfg = getRiskLevelConfig(maxLevel);

                return (
                  <>
                    <tr
                      key={key}
                      className="border-b border-border-primary bg-bg-secondary/50 hover:bg-bg-hover/50 cursor-pointer"
                      onClick={() => toggleGroup(key)}
                    >
                      <td className="px-4 py-3" colSpan={2}>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-text-muted" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          )}
                          <Layers className="w-4 h-4 text-accent-primary" />
                          <span className="text-sm text-text-primary font-medium">相似预警聚合</span>
                          <span className="tag bg-accent-primary/10 text-accent-primary">{groupAlerts.length} 条</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-mono font-bold text-xs ${getRiskScoreBarColor(maxScore)} text-bg-primary`}>
                            {maxScore}
                          </div>
                          <span className={`tag ${riskCfg.bgColor} ${riskCfg.color}`}>{riskCfg.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">{groupAlerts[0].merchantName}</td>
                      <td className="px-4 py-3 font-mono text-sm text-text-primary">
                        {formatCurrency(groupAlerts.reduce((s, a) => s + a.amount, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">{groupAlerts[0].region}</td>
                      <td className="px-4 py-3" colSpan={5}>
                        <span className="text-xs text-text-secondary">
                          点击展开查看 {groupAlerts.length} 条相似预警详情
                        </span>
                      </td>
                    </tr>
                    {isExpanded && groupAlerts.map(a => (
                      <AlertRow key={a.id} alert={a} isNested />
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {alerts.length === 0 && (
          <div className="py-16 text-center text-text-muted">
            <div className="w-16 h-16 rounded-full bg-bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-sm">暂无符合条件的预警记录</p>
            <button onClick={resetFilters} className="mt-3 text-sm text-accent-primary hover:underline">
              清除筛选条件
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-border-primary text-sm text-text-secondary">
          <span>共 {alerts.length} 条记录</span>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded bg-bg-secondary hover:bg-bg-hover border border-border-primary disabled:opacity-50" disabled>
              上一页
            </button>
            <span className="px-2.5 py-1 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/30">1</span>
            <button className="px-2.5 py-1 rounded bg-bg-secondary hover:bg-bg-hover border border-border-primary">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
