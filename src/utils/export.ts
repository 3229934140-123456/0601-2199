import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Report, Alert, RiskLevel } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';

export function exportReportToExcel(report: Report) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['指标', '数值'],
    ['报告类型', report.type === 'daily' ? '日报' : '周报'],
    ['报告周期', report.period],
    ['生成时间', formatDateTime(report.generatedAt)],
    ['预警总数', report.summary.totalAlerts],
    ['确认风险数', report.summary.confirmedRisks],
    ['误报数量', report.summary.falsePositives],
    ['拦截金额 (元)', report.summary.interceptedAmount],
    ['平均响应时间 (分钟)', report.summary.averageResponseTime],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws1, '报告概览');

  const riskDistData = [
    ['风险等级', '数量', '占比'],
    ['极高风险', report.summary.riskDistribution.critical,
      `${((report.summary.riskDistribution.critical / report.summary.totalAlerts) * 100).toFixed(1)}%`],
    ['高风险', report.summary.riskDistribution.high,
      `${((report.summary.riskDistribution.high / report.summary.totalAlerts) * 100).toFixed(1)}%`],
    ['中风险', report.summary.riskDistribution.medium,
      `${((report.summary.riskDistribution.medium / report.summary.totalAlerts) * 100).toFixed(1)}%`],
    ['低风险', report.summary.riskDistribution.low,
      `${((report.summary.riskDistribution.low / report.summary.totalAlerts) * 100).toFixed(1)}%`],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(riskDistData);
  ws2['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws2, '风险分布');

  const topMerchantData = [
    ['排名', '商户名称', '预警数量', '涉险金额 (元)'],
    ...report.topMerchants.map((m, i) => [
      i + 1,
      m.name,
      m.alertCount,
      m.riskAmount,
    ]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(topMerchantData);
  ws3['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, '高危商户TOP榜');

  const fileName = `风控${report.type === 'daily' ? '日报' : '周报'}_${report.period.replace(/[\/\s]/g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportAlertsToExcel(alerts: Alert[], fileName = '预警列表') {
  const levelMap: Record<RiskLevel, string> = {
    critical: '极高风险',
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已处置',
    false_positive: '已标记误报',
  };

  const data = [
    ['预警ID', '商户名称', '商户ID', '交易金额(元)', '地区', '风险评分', '风险等级', '状态', '处理人', '命中规则', '触发时间'],
    ...alerts.map(a => [
      a.id,
      a.merchantName,
      a.merchantId,
      a.amount,
      a.region,
      a.riskScore,
      levelMap[a.riskLevel],
      statusMap[a.status],
      a.assignee || '-',
      a.hitRules.map(r => r.ruleName).join('、'),
      formatDateTime(a.createdAt),
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 8 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '预警列表');
  XLSX.writeFile(wb, `${fileName}_${formatDate(new Date().toISOString())}.xlsx`);
}

export async function exportReportToPDF(report: Report, elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    generateSimplePDF(report);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#0B1929',
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `风控${report.type === 'daily' ? '日报' : '周报'}_${report.period.replace(/[\/\s]/g, '-')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF生成失败，使用简化版:', error);
    generateSimplePDF(report);
  }
}

function generateSimplePDF(report: Report) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(18);
  pdf.text(
    `Risk Control ${report.type === 'daily' ? 'Daily' : 'Weekly'} Report`,
    pageWidth / 2,
    25,
    { align: 'center' }
  );

  pdf.setFontSize(10);
  pdf.text(`Period: ${report.period}`, pageWidth / 2, 35, { align: 'center' });
  pdf.text(`Generated: ${formatDate(report.generatedAt)}`, pageWidth / 2, 42, { align: 'center' });

  pdf.setFontSize(14);
  pdf.text('Summary', 20, 60);

  pdf.setFontSize(10);
  const summaryItems = [
    ['Total Alerts', String(report.summary.totalAlerts)],
    ['Confirmed Risks', String(report.summary.confirmedRisks)],
    ['False Positives', String(report.summary.falsePositives)],
    ['Intercepted Amount', `¥${report.summary.interceptedAmount.toLocaleString()}`],
    ['Avg Response Time', `${report.summary.averageResponseTime} min`],
  ];

  let y = 75;
  summaryItems.forEach(([label, value]) => {
    pdf.text(label, 25, y);
    pdf.text(value, 120, y);
    y += 10;
  });

  y += 10;
  pdf.setFontSize(14);
  pdf.text('Risk Distribution', 20, y);

  y += 15;
  pdf.setFontSize(10);
  const levels: [string, number][] = [
    ['Critical', report.summary.riskDistribution.critical],
    ['High', report.summary.riskDistribution.high],
    ['Medium', report.summary.riskDistribution.medium],
    ['Low', report.summary.riskDistribution.low],
  ];
  levels.forEach(([label, value]) => {
    const pct = ((value / report.summary.totalAlerts) * 100).toFixed(1);
    pdf.text(`${label}: ${value} (${pct}%)`, 25, y);
    y += 8;
  });

  y += 10;
  pdf.setFontSize(14);
  pdf.text('Top High-Risk Merchants', 20, y);

  y += 15;
  pdf.setFontSize(9);
  pdf.text('Rank', 22, y);
  pdf.text('Merchant', 35, y);
  pdf.text('Alerts', 130, y);
  pdf.text('Risk Amount', 155, y);
  y += 6;

  report.topMerchants.forEach((m, i) => {
    pdf.text(String(i + 1), 22, y);
    pdf.text(m.name.substring(0, 25), 35, y);
    pdf.text(String(m.alertCount), 130, y);
    pdf.text(`¥${m.riskAmount.toLocaleString()}`, 155, y);
    y += 8;
  });

  const fileName = `风控${report.type === 'daily' ? '日报' : '周报'}_${report.period.replace(/[\/\s]/g, '-')}.pdf`;
  pdf.save(fileName);
}
