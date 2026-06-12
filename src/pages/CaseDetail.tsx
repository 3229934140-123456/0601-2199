import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  FileText,
  Clock,
  MapPin,
  CreditCard,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  Shield,
  History,
  UserPlus,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { VerifyRecord, DispositionType } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  getRiskLevelConfig,
  getStatusConfig,
  getDispositionConfig,
} from '@/utils/formatters';
import { operators } from '@/data/mockData';
import PageHeader from '@/components/common/PageHeader';
import RiskScoreBadge from '@/components/common/RiskScoreBadge';
import Select from '@/components/common/Select';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCaseById, assignAlert, addVerifyRecord, setDisposition, currentUser } = useAppStore();
  const caseData = getCaseById(id || '');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDispositionModal, setShowDispositionModal] = useState(false);

  const [verifyForm, setVerifyForm] = useState({
    contactPerson: '',
    phone: '',
    content: '',
    result: 'confirmed' as VerifyRecord['result'],
  });

  const [dispositionForm, setDispositionForm] = useState({
    type: 'approve' as DispositionType,
    remark: '',
  });

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="w-16 h-16 text-risk-critical mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">案件不存在</h2>
        <p className="text-text-secondary mb-6">未找到对应的预警案件</p>
        <button onClick={() => navigate('/alerts')} className="btn-primary">
          返回预警列表
        </button>
      </div>
    );
  }

  const riskCfg = getRiskLevelConfig(caseData.riskLevel);
  const statusCfg = getStatusConfig(caseData.status);

  const handleAssign = () => {
    if (!selectedAssignee) return;
    assignAlert(caseData.id, selectedAssignee, currentUser.name);
    setShowAssignModal(false);
    setSelectedAssignee('');
  };

  const handleVerify = () => {
    if (!verifyForm.contactPerson || !verifyForm.phone) return;
    addVerifyRecord(caseData.id, verifyForm, currentUser.name);
    setShowVerifyModal(false);
    setVerifyForm({ contactPerson: '', phone: '', content: '', result: 'confirmed' });
  };

  const handleDisposition = () => {
    if (!dispositionForm.remark) return;
    setDisposition(caseData.id, dispositionForm, currentUser.name);
    setShowDispositionModal(false);
  };

  const infoItems = [
    { icon: MapPin, label: '交易地区', value: caseData.region },
    { icon: CreditCard, label: '卡号', value: caseData.cardNo },
    { icon: Monitor, label: '设备指纹', value: caseData.deviceInfo },
    { icon: FileText, label: '交易单号', value: caseData.transactionId },
  ];

  const verifyResultConfig = {
    confirmed: { label: '已确认风险', color: 'text-risk-critical' },
    denied: { label: '否认风险', color: 'text-risk-low' },
    unreachable: { label: '无法联系', color: 'text-risk-medium' },
  };

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <button
              onClick={() => navigate('/alerts')}
              className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            案件详情
            <span className="font-mono text-sm font-normal text-text-muted">{caseData.id}</span>
          </span>
        }
        subtitle={
          <div className="flex items-center gap-3 mt-1">
            <span className={`tag ${riskCfg.bgColor} ${riskCfg.color} border ${riskCfg.borderColor}`}>
              {riskCfg.label}
            </span>
            <span className={`tag ${statusCfg.bgColor} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {caseData.assignee && (
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <User className="w-3 h-3" />
                处理人：{caseData.assignee}
              </span>
            )}
          </div>
        }
        actions={
          <>
            {!caseData.assignee && (
              <button onClick={() => setShowAssignModal(true)} className="btn-secondary flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                分派处理人
              </button>
            )}
            <button onClick={() => setShowVerifyModal(true)} className="btn-secondary flex items-center gap-2">
              <Phone className="w-4 h-4" />
              电话核实
            </button>
            {caseData.status !== 'resolved' && caseData.status !== 'false_positive' && (
              <button onClick={() => setShowDispositionModal(true)} className="btn-primary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                给出处置结论
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-risk-critical" />
              案件概览
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="text-xs text-text-muted block mb-1">商户信息</label>
                  <div className="text-sm text-text-primary font-medium">{caseData.merchantName}</div>
                  <div className="text-xs text-text-secondary font-mono">{caseData.merchantId}</div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-text-muted block mb-1">交易金额</label>
                  <div className="text-2xl font-bold font-mono text-text-primary">{formatCurrency(caseData.amount)}</div>
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">触发时间</label>
                  <div className="text-sm text-text-primary">{formatDateTime(caseData.createdAt)}</div>
                  <div className="text-xs text-text-muted">{formatRelativeTime(caseData.createdAt)}</div>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <label className="text-xs text-text-muted block mb-1">风险评估</label>
                  <RiskScoreBadge score={caseData.riskScore} size="lg" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {infoItems.map(item => (
                    <div key={item.label} className="p-2 rounded bg-bg-secondary">
                      <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                        <item.icon className="w-3 h-3" />
                        {item.label}
                      </div>
                      <div className="text-xs text-text-primary font-mono truncate">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <XCircle className="w-4 h-4 text-accent-primary" />
              命中风控规则
            </h3>
            <div className="space-y-2">
              {caseData.hitRules.map(rule => {
                const cfg = getRiskLevelConfig(rule.severity);
                return (
                  <div key={rule.ruleId} className="flex items-start gap-3 p-3 rounded-md bg-bg-secondary border border-border-primary hover:border-accent-primary/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      rule.severity === 'critical' ? 'bg-risk-critical animate-pulse' :
                      rule.severity === 'high' ? 'bg-risk-high' :
                      rule.severity === 'medium' ? 'bg-risk-medium' : 'bg-risk-low'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-primary font-medium">{rule.ruleName}</span>
                        <span className={`tag ${cfg.bgColor} ${cfg.color} text-[10px]`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{rule.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-accent-primary" />
              电话核实记录
            </h3>
            {caseData.verifyRecords.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Phone className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无核实记录</p>
                <button onClick={() => setShowVerifyModal(true)} className="text-xs text-accent-primary hover:underline mt-2">
                  + 新增核实记录
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {caseData.verifyRecords.map(record => (
                  <div key={record.id} className="p-4 rounded-md bg-bg-secondary border border-border-primary">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-primary font-medium">{record.contactPerson}</span>
                        <span className="text-xs text-text-muted font-mono">{record.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`tag text-[10px] ${
                          record.result === 'confirmed' ? 'bg-risk-critical/15 text-risk-critical' :
                          record.result === 'denied' ? 'bg-risk-low/15 text-risk-low' :
                          'bg-risk-medium/15 text-risk-medium'
                        }`}>
                          {verifyResultConfig[record.result].label}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{record.content}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {record.operator}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(record.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {caseData.disposition && (
            <div className="card p-5 border-accent-primary/30">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-risk-low" />
                处置结论
              </h3>
              <div className="p-4 rounded-md bg-bg-secondary border border-border-primary">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-sm font-semibold ${getDispositionConfig(caseData.disposition.type).color}`}>
                    {getDispositionConfig(caseData.disposition.type).label}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{caseData.disposition.remark}</p>
                <div className="flex items-center gap-3 mt-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {caseData.disposition.operator}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(caseData.disposition.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <History className="w-4 h-4 text-accent-primary" />
                操作留痕
              </h3>
              <span className="text-xs text-text-muted">
                共 {caseData.operationLogs.length} 条记录
              </span>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border-primary" />
              {[...caseData.operationLogs]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((log, idx) => {
                  const isLatest = idx === 0;
                  const isSystem = log.operator === 'SYSTEM';
                  return (
                    <div key={log.id} className="relative pb-5 last:pb-0">
                      <div
                        className={`absolute -left-[22px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isLatest
                            ? 'border-accent-primary bg-accent-primary/20 animate-pulse'
                            : isSystem
                            ? 'border-text-muted bg-bg-secondary'
                            : 'border-accent-secondary bg-bg-secondary'
                        }`}
                      >
                        {isLatest && <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isLatest ? 'text-accent-primary' : 'text-text-primary'}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-text-muted">{formatDateTime(log.createdAt)}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{log.detail}</p>
                      <span className="text-xs text-text-muted">
                        操作人:{' '}
                        <span className={isSystem ? 'text-text-muted' : 'text-text-secondary'}>
                          {log.operator}
                        </span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-accent-primary" />
              同商户关联预警
            </h3>
            {caseData.relatedAlerts.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">暂无关联预警</p>
            ) : (
              <div className="space-y-2">
                {caseData.relatedAlerts.map(alert => {
                  const cfg = getRiskLevelConfig(alert.riskLevel);
                  return (
                    <div
                      key={alert.id}
                      onClick={() => navigate(`/cases/${alert.id}`)}
                      className="p-3 rounded-md bg-bg-secondary border border-border-primary hover:border-accent-primary/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-text-secondary">{alert.id}</span>
                        <span className={`tag ${cfg.bgColor} ${cfg.color} text-[10px]`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-text-primary">{formatCurrency(alert.amount)}</span>
                        <span className="text-xs text-text-muted">{formatRelativeTime(alert.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-semibold text-text-primary mb-4">分派处理人</h3>
            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-2">选择处理人</label>
              <Select
                value={selectedAssignee}
                options={operators.map(o => ({ value: o, label: o }))}
                onChange={setSelectedAssignee}
                placeholder="请选择处理人"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowAssignModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleAssign} className="btn-primary">确认分派</button>
            </div>
          </div>
        </div>
      )}

      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="card w-full max-w-lg p-6 animate-slide-up">
            <h3 className="text-lg font-semibold text-text-primary mb-4">电话核实记录</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">联系人 *</label>
                  <input
                    type="text"
                    value={verifyForm.contactPerson}
                    onChange={e => setVerifyForm({ ...verifyForm, contactPerson: e.target.value })}
                    className="input-base"
                    placeholder="请输入联系人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">联系电话 *</label>
                  <input
                    type="text"
                    value={verifyForm.phone}
                    onChange={e => setVerifyForm({ ...verifyForm, phone: e.target.value })}
                    className="input-base"
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">核实结果</label>
                <Select
                  value={verifyForm.result}
                  options={[
                    { value: 'confirmed', label: '已确认风险' },
                    { value: 'denied', label: '商户否认' },
                    { value: 'unreachable', label: '无法联系' },
                  ]}
                  onChange={v => setVerifyForm({ ...verifyForm, result: v as VerifyRecord['result'] })}
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">核实内容</label>
                <textarea
                  value={verifyForm.content}
                  onChange={e => setVerifyForm({ ...verifyForm, content: e.target.value })}
                  rows={4}
                  className="input-base resize-none"
                  placeholder="请详细记录电话核实内容..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowVerifyModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleVerify} className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" />
                提交记录
              </button>
            </div>
          </div>
        </div>
      )}

      {showDispositionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="card w-full max-w-lg p-6 animate-slide-up">
            <h3 className="text-lg font-semibold text-text-primary mb-4">处置结论</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">处置类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['approve', 'reject', 'freeze', 'escalate'] as DispositionType[]).map(type => {
                    const cfg = getDispositionConfig(type);
                    return (
                      <button
                        key={type}
                        onClick={() => setDispositionForm({ ...dispositionForm, type })}
                        className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                          dispositionForm.type === type
                            ? `border-current ${cfg.color} bg-current/10`
                            : 'border-border-primary text-text-secondary hover:border-accent-primary/50 hover:text-text-primary'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">处置说明 *</label>
                <textarea
                  value={dispositionForm.remark}
                  onChange={e => setDispositionForm({ ...dispositionForm, remark: e.target.value })}
                  rows={4}
                  className="input-base resize-none"
                  placeholder="请详细说明处置理由和依据..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowDispositionModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleDisposition} className="btn-primary">确认处置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
