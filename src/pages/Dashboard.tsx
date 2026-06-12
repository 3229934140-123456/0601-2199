import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Ban, DollarSign, TrendingUp, MapPin, Building2, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatNumber, getRiskLevelConfig } from '@/utils/formatters';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import TrendChart from '@/components/charts/TrendChart';
import RiskDistribution from '@/components/charts/RiskDistribution';

export default function Dashboard() {
  const { alerts, trend7d, trend30d, regions } = useAppStore();
  const [trendRange, setTrendRange] = useState<'7d' | '30d'>('7d');

  const todayAlerts = alerts.filter(a => {
    const alertDate = new Date(a.createdAt).toDateString();
    return alertDate === new Date().toDateString();
  });

  const stats = {
    today: todayAlerts.length,
    pending: alerts.filter(a => a.status === 'pending').length,
    confirmed: alerts.filter(a => a.status === 'resolved').length,
    interceptedAmount: alerts
      .filter(a => a.status === 'resolved' && a.riskLevel !== 'low')
      .reduce((sum, a) => sum + a.amount, 0),
  };

  const riskDistribution = {
    critical: alerts.filter(a => a.riskLevel === 'critical').length,
    high: alerts.filter(a => a.riskLevel === 'high').length,
    medium: alerts.filter(a => a.riskLevel === 'medium').length,
    low: alerts.filter(a => a.riskLevel === 'low').length,
  };

  const merchantAlerts = alerts.reduce<Record<string, { name: string; count: number; amount: number }>>((acc, a) => {
    if (!acc[a.merchantId]) {
      acc[a.merchantId] = { name: a.merchantName, count: 0, amount: 0 };
    }
    acc[a.merchantId].count++;
    acc[a.merchantId].amount += a.amount;
    return acc;
  }, {});

  const topMerchants = Object.values(merchantAlerts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const sortedRegions = [...regions].sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title="风险总览"
        subtitle="实时监控交易风险态势，掌握全局风控数据"
        actions={
          <button className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="今日预警"
          value={formatNumber(stats.today)}
          icon={<AlertTriangle className="w-6 h-6" />}
          trend={12.5}
          trendLabel="较昨日"
          accent="warning"
        />
        <StatCard
          title="待处理预警"
          value={formatNumber(stats.pending)}
          icon={<ShieldCheck className="w-6 h-6" />}
          trend={-8.3}
          trendLabel="较昨日"
          accent="primary"
        />
        <StatCard
          title="已确认风险"
          value={formatNumber(stats.confirmed)}
          icon={<Ban className="w-6 h-6" />}
          trend={5.2}
          trendLabel="较昨日"
          accent="danger"
        />
        <StatCard
          title="累计拦截金额"
          value={formatCurrency(stats.interceptedAmount)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={18.7}
          trendLabel="较上周"
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-primary" />
                预警趋势
              </h3>
              <p className="text-xs text-text-muted mt-1">按风险等级分布的预警数量变化</p>
            </div>
            <div className="flex items-center gap-1 bg-bg-primary rounded-md p-0.5">
              <button
                onClick={() => setTrendRange('7d')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  trendRange === '7d' ? 'bg-accent-primary text-bg-primary font-medium' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                近7天
              </button>
              <button
                onClick={() => setTrendRange('30d')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  trendRange === '30d' ? 'bg-accent-primary text-bg-primary font-medium' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                近30天
              </button>
            </div>
          </div>
          <TrendChart data={trendRange === '7d' ? trend7d : trend30d} />
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-text-primary mb-1">风险等级分布</h3>
          <p className="text-xs text-text-muted mb-2">当前预警风险等级占比</p>
          <RiskDistribution data={riskDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-accent-primary" />
            高危商户 TOP 榜
          </h3>
          <div className="space-y-3">
            {topMerchants.map((m, idx) => {
              const maxCount = topMerchants[0]?.count || 1;
              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        idx < 3 ? 'bg-risk-critical/20 text-risk-critical' : 'bg-bg-tertiary text-text-muted'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-text-primary group-hover:text-accent-primary transition-colors truncate max-w-[180px]">
                        {m.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-text-primary">{m.count} 笔</span>
                      <span className="font-mono text-xs text-text-muted">{formatCurrency(m.amount)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-secondary to-accent-primary transition-all duration-500"
                      style={{ width: `${(m.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-accent-primary" />
            地区风险分布
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sortedRegions.slice(0, 8).map((r, idx) => {
              const config = idx < 2 ? getRiskLevelConfig('high') : idx < 5 ? getRiskLevelConfig('medium') : getRiskLevelConfig('low');
              return (
                <div key={r.region} className="p-3 rounded-md bg-bg-secondary border border-border-primary hover:border-accent-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary">{r.region}</span>
                    <span className={`tag ${config.bgColor} ${config.color}`}>
                      {idx < 2 ? '高危' : idx < 5 ? '中危' : '低危'}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="font-mono text-lg font-bold text-text-primary">{r.count}</span>
                    <span className="text-xs text-text-muted mb-0.5">预警</span>
                  </div>
                  <div className="text-xs text-text-secondary font-mono mt-1">
                    涉险金额: {formatCurrency(r.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
