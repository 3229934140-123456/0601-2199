import { useState, useMemo } from 'react';
import {
  Sliders,
  ListChecks,
  ShieldBan,
  ShieldCheck,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Activity,
  AlertCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import type { ListType, ListCategory, BlackWhiteItem } from '@/types';
import { formatNumber, formatDateTime, formatDate } from '@/utils/formatters';
import PageHeader from '@/components/common/PageHeader';
import Select from '@/components/common/Select';

type TabType = 'rules' | 'blacklist' | 'falsepositive';

export default function Strategy() {
  const { rules, lists, alerts, updateRuleThreshold, toggleRuleEnabled, addListItem, removeListItem, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('rules');
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [tempThresholds, setTempThresholds] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [listFilter, setListFilter] = useState<'all' | ListType>('all');
  const [newItem, setNewItem] = useState<Omit<BlackWhiteItem, 'id' | 'createdAt' | 'operator'>>({
    type: 'black',
    category: 'merchant',
    value: '',
    reason: '',
  });

  const tabs: { key: TabType; label: string; icon: typeof Sliders }[] = [
    { key: 'rules', label: '规则配置', icon: Sliders },
    { key: 'blacklist', label: '黑白名单', icon: ListChecks },
    { key: 'falsepositive', label: '误报分析', icon: AlertCircle },
  ];

  const handleThresholdChange = (ruleId: string, value: number) => {
    setTempThresholds(prev => ({ ...prev, [ruleId]: value }));
  };

  const handleSaveThreshold = (ruleId: string) => {
    if (tempThresholds[ruleId] !== undefined) {
      updateRuleThreshold(ruleId, tempThresholds[ruleId]);
    }
    setEditingRule(null);
  };

  const getSimulatedData = (ruleId: string, threshold: number) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return [];
    const range = rule.maxThreshold - rule.minThreshold;
    const points = [
      rule.minThreshold + range * 0.25,
      rule.currentThreshold,
      threshold,
      rule.minThreshold + range * 0.75,
    ];
    return points.map((p, i) => {
      const baseHit = Math.floor(rule.hitCount * (1 - (p - rule.minThreshold) / range * 0.7));
      return {
        name: i === 1 ? '当前' : i === 2 ? '模拟' : `阈值${i + 1}`,
        hitCount: Math.max(10, baseHit),
        fpCount: Math.floor(baseHit * (rule.falsePositiveCount / rule.hitCount)),
        isCurrent: i === 1,
        isSimulated: i === 2,
      };
    });
  };

  const handleAddItem = () => {
    if (!newItem.value || !newItem.reason) return;
    addListItem({ ...newItem, operator: currentUser.name });
    setNewItem({ type: 'black', category: 'merchant', value: '', reason: '' });
    setShowAddModal(false);
  };

  const filteredLists = useMemo(() => {
    if (listFilter === 'all') return lists;
    return lists.filter(l => l.type === listFilter);
  }, [lists, listFilter]);

  const falsePositiveAlerts = alerts.filter(a => a.status === 'false_positive');
  const ruleFpStats = useMemo(() => {
    const stats: Record<string, { name: string; hitCount: number; fpCount: number }> = {};
    alerts.forEach(a => {
      a.hitRules.forEach(r => {
        if (!stats[r.ruleId]) stats[r.ruleId] = { name: r.ruleName, hitCount: 0, fpCount: 0 };
        stats[r.ruleId].hitCount++;
        if (a.status === 'false_positive') stats[r.ruleId].fpCount++;
      });
    });
    return Object.values(stats).sort((a, b) => b.fpCount - a.fpCount);
  }, [alerts]);

  const categoryLabels: Record<ListCategory, string> = {
    merchant: '商户',
    ip: 'IP地址',
    card: '卡号',
  };

  return (
    <div>
      <PageHeader
        title="策略调参"
        subtitle="配置风控规则阈值，维护黑白名单，分析误报优化策略"
      />

      <div className="card mb-4">
        <div className="flex items-center border-b border-border-primary">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-accent-primary border-accent-primary'
                  : 'text-text-secondary border-transparent hover:text-text-primary hover:border-border-secondary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.map(rule => {
            const isEditing = editingRule === rule.id;
            const displayThreshold = tempThresholds[rule.id] !== undefined ? tempThresholds[rule.id] : rule.currentThreshold;
            const fpRate = ((rule.falsePositiveCount / rule.hitCount) * 100).toFixed(1);
            const simulatedData = isEditing ? getSimulatedData(rule.id, displayThreshold) : null;

            return (
              <div key={rule.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-semibold text-text-primary">{rule.name}</h4>
                      <span className="tag bg-bg-tertiary text-text-muted text-[10px]">{rule.category}</span>
                      {rule.enabled ? (
                        <span className="tag bg-risk-low/15 text-risk-low text-[10px] flex items-center gap-1">
                          <Activity className="w-3 h-3" /> 已启用
                        </span>
                      ) : (
                        <span className="tag bg-text-muted/20 text-text-muted text-[10px]">已停用</span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{rule.description}</p>
                  </div>
                  <button
                    onClick={() => toggleRuleEnabled(rule.id)}
                    className="text-text-muted hover:text-accent-primary transition-colors"
                  >
                    {rule.enabled ? <ToggleRight className="w-8 h-8 text-risk-low" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 rounded-md bg-bg-secondary">
                    <div className="text-xs text-text-muted mb-1">累计命中</div>
                    <div className="font-mono text-lg font-bold text-text-primary">{formatNumber(rule.hitCount)}</div>
                  </div>
                  <div className="p-3 rounded-md bg-bg-secondary">
                    <div className="text-xs text-text-muted mb-1">误报数量</div>
                    <div className="font-mono text-lg font-bold text-risk-medium">{formatNumber(rule.falsePositiveCount)}</div>
                  </div>
                  <div className="p-3 rounded-md bg-bg-secondary">
                    <div className="text-xs text-text-muted mb-1">误报率</div>
                    <div className="font-mono text-lg font-bold text-risk-high">{fpRate}%</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">
                      当前阈值: <span className="font-mono font-bold text-text-primary">{rule.currentThreshold}</span> {rule.unit}
                    </span>
                    {isEditing && (
                      <span className="text-sm text-accent-primary flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        模拟值: <span className="font-mono font-bold">{displayThreshold}</span> {rule.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-muted font-mono w-12">{rule.minThreshold}</span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min={rule.minThreshold}
                        max={rule.maxThreshold}
                        step={(rule.maxThreshold - rule.minThreshold) / 100}
                        value={displayThreshold}
                        onChange={e => {
                          if (!isEditing) setEditingRule(rule.id);
                          handleThresholdChange(rule.id, Number(e.target.value));
                        }}
                        className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                      />
                    </div>
                    <span className="text-xs text-text-muted font-mono w-12 text-right">{rule.maxThreshold}</span>
                  </div>
                </div>

                {isEditing && simulatedData && (
                  <div className="p-4 rounded-md bg-bg-secondary border border-accent-primary/30 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-accent-primary flex items-center gap-2">
                        <Activity className="w-4 h-4" /> 阈值模拟影响分析
                      </span>
                      <span className="text-xs text-text-muted">对比不同阈值下的命中与误报情况</span>
                    </div>
                    <div style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={simulatedData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
                          <XAxis dataKey="name" stroke="#5C7A99" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#5C7A99" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#112240',
                              border: '1px solid #1E3A5F',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#E6F1FF',
                            }}
                          />
                          <Bar dataKey="hitCount" name="命中数" radius={[4, 4, 0, 0]}>
                            {simulatedData.map((entry, idx) => (
                              <Cell
                                key={idx}
                                fill={entry.isSimulated ? '#00D4FF' : entry.isCurrent ? '#FA8C16' : '#3A5A7F'}
                              />
                            ))}
                          </Bar>
                          <Bar dataKey="fpCount" name="误报数" radius={[4, 4, 0, 0]}>
                            {simulatedData.map((entry, idx) => (
                              <Cell
                                key={idx}
                                fill={entry.isSimulated ? '#FF6B9D' : entry.isCurrent ? '#FAAD14' : '#5C7A99'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#FA8C16]" /> 当前阈值</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#00D4FF]" /> 模拟阈值</span>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => { setEditingRule(null); setTempThresholds(prev => { const n = { ...prev }; delete n[rule.id]; return n; }); }} className="btn-secondary text-sm">
                      取消
                    </button>
                    <button onClick={() => handleSaveThreshold(rule.id)} className="btn-primary text-sm">
                      保存阈值
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'blacklist' && (
        <div>
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setListFilter('all')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    listFilter === 'all' ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setListFilter('black')}
                  className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1 transition-colors ${
                    listFilter === 'black' ? 'bg-risk-critical/15 text-risk-critical' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ShieldBan className="w-3 h-3" /> 黑名单
                </button>
                <button
                  onClick={() => setListFilter('white')}
                  className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1 transition-colors ${
                    listFilter === 'white' ? 'bg-risk-low/15 text-risk-low' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" /> 白名单
                </button>
              </div>
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新增条目
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary border-b border-border-primary">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary w-20">类型</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary w-24">分类</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary">值</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary">原因</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary">操作人</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary">添加时间</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary w-16">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLists.map(item => (
                    <tr key={item.id} className="border-b border-border-primary hover:bg-bg-hover/50 transition-colors">
                      <td className="px-5 py-3">
                        {item.type === 'black' ? (
                          <span className="tag bg-risk-critical/15 text-risk-critical flex items-center gap-1 w-fit">
                            <ShieldBan className="w-3 h-3" /> 黑名单
                          </span>
                        ) : (
                          <span className="tag bg-risk-low/15 text-risk-low flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" /> 白名单
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-text-primary">{categoryLabels[item.category]}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-sm text-text-primary">{item.value}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-text-secondary">{item.reason}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-text-secondary">{item.operator}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-text-muted">{formatDate(item.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => removeListItem(item.id)}
                          className="p-1.5 rounded hover:bg-risk-critical/10 text-text-muted hover:text-risk-critical transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'falsepositive' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-risk-medium" />
              规则误报率统计
            </h3>
            <div className="space-y-3">
              {ruleFpStats.map(stat => {
                const fpRate = stat.hitCount > 0 ? (stat.fpCount / stat.hitCount) * 100 : 0;
                return (
                  <div key={stat.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-primary">{stat.name}</span>
                      <span className="font-mono text-text-secondary">
                        {stat.fpCount}/{stat.hitCount} ({fpRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fpRate > 30 ? 'bg-risk-critical' : fpRate > 15 ? 'bg-risk-medium' : 'bg-risk-low'
                        }`}
                        style={{ width: `${Math.min(fpRate * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-accent-primary" />
              近期误报记录
            </h3>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {falsePositiveAlerts.slice(0, 15).map(alert => (
                <div key={alert.id} className="p-3 rounded-md bg-bg-secondary border border-border-primary hover:border-accent-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-accent-primary">{alert.id}</span>
                    <span className="text-xs text-text-muted">{formatDateTime(alert.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-primary">{alert.merchantName}</span>
                    <span className="font-mono text-sm text-text-secondary">{formatNumber(alert.amount)} 元</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {alert.hitRules.map(r => (
                      <span key={r.ruleId} className="text-[10px] bg-bg-tertiary text-text-muted px-1.5 py-0.5 rounded">
                        {r.ruleName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-semibold text-text-primary mb-4">新增黑白名单</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">名单类型</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewItem({ ...newItem, type: 'black' })}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      newItem.type === 'black'
                        ? 'border-risk-critical text-risk-critical bg-risk-critical/10'
                        : 'border-border-primary text-text-secondary hover:border-risk-critical/50'
                    }`}
                  >
                    <ShieldBan className="w-4 h-4" /> 黑名单
                  </button>
                  <button
                    onClick={() => setNewItem({ ...newItem, type: 'white' })}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      newItem.type === 'white'
                        ? 'border-risk-low text-risk-low bg-risk-low/10'
                        : 'border-border-primary text-text-secondary hover:border-risk-low/50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> 白名单
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">分类</label>
                <Select
                  value={newItem.category}
                  options={[
                    { value: 'merchant', label: '商户' },
                    { value: 'ip', label: 'IP地址' },
                    { value: 'card', label: '卡号' },
                  ]}
                  onChange={v => setNewItem({ ...newItem, category: v as ListCategory })}
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">值</label>
                <input
                  type="text"
                  value={newItem.value}
                  onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                  className="input-base"
                  placeholder={newItem.category === 'merchant' ? '商户ID_商户名称' : newItem.category === 'ip' ? 'IP地址或网段' : '卡号'}
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">添加原因</label>
                <textarea
                  value={newItem.reason}
                  onChange={e => setNewItem({ ...newItem, reason: e.target.value })}
                  rows={3}
                  className="input-base resize-none"
                  placeholder="请说明添加该名单的原因和依据"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleAddItem} className="btn-primary">确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
