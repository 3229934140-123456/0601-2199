import { useState } from 'react';
import {
  FileBarChart,
  Calendar,
  Download,
  Eye,
  FileText,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  Clock,
  X,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import type { Report, RiskLevel } from '@/types';
import { formatCurrency, formatNumber, formatDate, formatDateTime, getRiskLevelConfig } from '@/utils/formatters';
import PageHeader from '@/components/common/PageHeader';

const COLORS: Record<RiskLevel, string> = {
  critical: '#FF4D4F',
  high: '#FA8C16',
  medium: '#FAAD14',
  low: '#52C41A',
};

const LABELS: Record<RiskLevel, string> = {
  critical: '极高风险',
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

export default function Reports() {
  const { reports } = useAppStore();
  const [reportFilter, setReportFilter] = useState<'all' | 'daily' | 'weekly'>('all');
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  const filteredReports = reportFilter === 'all' ? reports : reports.filter(r => r.type === reportFilter);

  const handleExport = (report: Report, format: 'pdf' | 'excel') => {
    alert(`正在导出 ${report.period} ${report.type === 'daily' ? '日' : '周'}报 (${format.toUpperCase()})...`);
  };

  if (previewReport) {
    const riskDistData = (Object.keys(previewReport.summary.riskDistribution) as RiskLevel[]).map(key => ({
      name: LABELS[key],
      value: previewReport.summary.riskDistribution[key],
    }));

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewReport(null)}
              className="p-2 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <FileBarChart className="w-6 h-6 text-accent-primary" />
                {previewReport.type === 'daily' ? '日报' : '周报'}详情
              </h1>
              <p className="text-sm text-text-secondary mt-1">报告周期: {previewReport.period}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport(previewReport, 'pdf')} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出 PDF
            </button>
            <button onClick={() => handleExport(previewReport, 'excel')} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出 Excel
            </button>
          </div>
        </div>

        <div className="card p-8 mb-4">
          <div className="text-center border-b border-border-primary pb-6 mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              支付机构风险控制{previewReport.type === 'daily' ? '日' : '周'}报告
            </h2>
            <p className="text-text-secondary">报告期：{previewReport.period}</p>
            <p className="text-xs text-text-muted mt-1">生成时间：{formatDateTime(previewReport.generatedAt)}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-bg-secondary text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-accent-primary" />
              <div className="text-2xl font-bold font-mono text-text-primary">{formatNumber(previewReport.summary.totalAlerts)}</div>
              <div className="text-xs text-text-muted mt-1">预警总数</div>
            </div>
            <div className="p-4 rounded-lg bg-bg-secondary text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-risk-critical" />
              <div className="text-2xl font-bold font-mono text-text-primary">{formatNumber(previewReport.summary.confirmedRisks)}</div>
              <div className="text-xs text-text-muted mt-1">确认风险</div>
            </div>
            <div className="p-4 rounded-lg bg-bg-secondary text-center">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-risk-medium" />
              <div className="text-2xl font-bold font-mono text-text-primary">{formatNumber(previewReport.summary.falsePositives)}</div>
              <div className="text-xs text-text-muted mt-1">误报数量</div>
            </div>
            <div className="p-4 rounded-lg bg-bg-secondary text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-risk-low" />
              <div className="text-xl font-bold font-mono text-text-primary">{formatCurrency(previewReport.summary.interceptedAmount)}</div>
              <div className="text-xs text-text-muted mt-1">拦截金额</div>
            </div>
            <div className="p-4 rounded-lg bg-bg-secondary text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-accent-secondary" />
              <div className="text-2xl font-bold font-mono text-text-primary">{previewReport.summary.averageResponseTime}<span className="text-sm font-normal text-text-muted"> 分</span></div>
              <div className="text-xs text-text-muted mt-1">平均响应时间</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="p-5 rounded-lg bg-bg-secondary">
              <h4 className="text-sm font-semibold text-text-primary mb-4">风险等级分布</h4>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {riskDistData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[(Object.keys(previewReport.summary.riskDistribution) as RiskLevel[])[idx]]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#112240',
                        border: '1px solid #1E3A5F',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#E6F1FF',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-5 rounded-lg bg-bg-secondary">
              <h4 className="text-sm font-semibold text-text-primary mb-4">高危商户预警 TOP5</h4>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={previewReport.topMerchants} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                    <XAxis type="number" stroke="#5C7A99" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#5C7A99"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                      tick={{ fill: '#8FA3BF' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#112240',
                        border: '1px solid #1E3A5F',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#E6F1FF',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'alertCount' ? `${value} 笔` : formatCurrency(value),
                        name === 'alertCount' ? '预警数' : '涉险金额',
                      ]}
                    />
                    <Bar dataKey="alertCount" name="预警数" fill="#00D4FF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">各风险等级明细</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(previewReport.summary.riskDistribution) as RiskLevel[]).map(level => {
                const cfg = getRiskLevelConfig(level);
                return (
                  <div key={level} className={`p-4 rounded-lg border ${cfg.borderColor} ${cfg.bgColor}`}>
                    <div className={`text-sm font-medium ${cfg.color} mb-1`}>{cfg.label}</div>
                    <div className={`text-3xl font-bold font-mono ${cfg.color}`}>
                      {formatNumber(previewReport.summary.riskDistribution[level])}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      占比 {((previewReport.summary.riskDistribution[level] / previewReport.summary.totalAlerts) * 100).toFixed(1)}%
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

  return (
    <div>
      <PageHeader
        title="报表中心"
        subtitle="查看和导出日、周风险分析报告，辅助策略决策"
      />

      <div className="card mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                reportFilter === 'all' ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setReportFilter('daily')}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ${
                reportFilter === 'daily' ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Calendar className="w-4 h-4" /> 日报
            </button>
            <button
              onClick={() => setReportFilter('weekly')}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ${
                reportFilter === 'weekly' ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> 周报
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredReports.map(report => (
            <div
              key={report.id}
              className="group relative p-5 rounded-lg bg-bg-secondary border border-border-primary hover:border-accent-primary/50 transition-all hover:shadow-glow cursor-pointer"
              onClick={() => setPreviewReport(report)}
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); setPreviewReport(report); }}
                  className="p-1.5 rounded bg-bg-hover text-text-secondary hover:text-accent-primary transition-colors"
                  title="查看"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleExport(report, 'pdf'); }}
                  className="p-1.5 rounded bg-bg-hover text-text-secondary hover:text-accent-primary transition-colors"
                  title="导出PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-primary/30 to-accent-secondary/20 flex items-center justify-center mb-4">
                <FileBarChart className="w-6 h-6 text-accent-primary" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className={`tag text-[10px] ${
                  report.type === 'daily' ? 'bg-accent-primary/15 text-accent-primary' : 'bg-risk-low/15 text-risk-low'
                }`}>
                  {report.type === 'daily' ? '日报' : '周报'}
                </span>
                <span className="text-xs text-text-muted">{report.period}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border-primary">
                <div>
                  <div className="text-xs text-text-muted">预警数</div>
                  <div className="font-mono text-lg font-bold text-text-primary">{formatNumber(report.summary.totalAlerts)}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">确认风险</div>
                  <div className="font-mono text-lg font-bold text-risk-critical">{formatNumber(report.summary.confirmedRisks)}</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-text-muted">
                生成时间: {formatDate(report.generatedAt)}
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="py-16 text-center text-text-muted">
            <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">暂无符合条件的报告</p>
          </div>
        )}
      </div>
    </div>
  );
}
