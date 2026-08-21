import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { analyzeRisk } from '@/lib/riskEngine';
import { FileText, Download, Eye, X, Printer, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency, formatTimestamp, riskBgColor, actionBgColor } from '@/lib/utils';
import type { Transaction } from '@/types';

export function Reports() {
  const { transactions, investigations, selectedTransaction } = useApp();
  const [reportTxn, setReportTxn] = useState<Transaction | null>(selectedTransaction);
  const [showPreview, setShowPreview] = useState(false);

  const reportData = useMemo(() => {
    if (!reportTxn) return null;
    const result = analyzeRisk({
      amount: reportTxn.amount,
      currency: reportTxn.currency,
      account_age_days: reportTxn.account_age_days,
      is_new_device: reportTxn.is_new_device,
      is_new_location: reportTxn.is_new_location,
      failed_attempts: reportTxn.failed_attempts,
      transaction_velocity: reportTxn.transaction_velocity,
      historical_average: reportTxn.historical_average,
      transaction_id: reportTxn.id,
      timestamp: reportTxn.timestamp,
      location: reportTxn.location,
      device_info: reportTxn.device_info,
    });
    const inv = investigations.find((i) => i.transaction_id === reportTxn.id);
    return { analysis: { transaction_id: reportTxn.id, ...result }, investigation: inv };
  }, [reportTxn, investigations]);

  const handleGenerate = (txn: Transaction) => {
    setReportTxn(txn);
    setShowPreview(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!reportData || !reportTxn) return;
    const report = buildReportText(reportTxn, reportData.analysis, reportData.investigation);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-sentinel-report-${reportTxn.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-cyan-400" />
          Investigation Reports
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Generate professional investigation reports from analyzed transactions
        </p>
      </div>

      {/* Report generation */}
      <div className="glass-card p-5 animate-fade-in-up animate-delay-100">
        <h2 className="text-sm font-semibold text-white mb-3">Generate New Report</h2>
        <p className="text-xs text-navy-300 mb-4">Select a transaction to generate an investigation report</p>
        <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
          {transactions.slice(0, 30).map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-navy-800/40 hover:bg-navy-700/40 transition-colors group">
              <span className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-bold font-mono',
                riskBgColor(t.risk_level)
              )}>
                {t.risk_score}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-mono">{t.id}</div>
                <div className="text-xs text-navy-300 truncate">{formatCurrency(t.amount, t.currency)} · {t.location} · {t.threat_type}</div>
              </div>
              <button
                onClick={() => handleGenerate(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 text-xs font-medium transition-all duration-200"
              >
                <FileText className="w-3.5 h-3.5" />
                Generate
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Existing reports from investigations */}
      {investigations.length > 0 && (
        <div className="glass-card p-5 animate-fade-in-up animate-delay-200">
          <h2 className="text-sm font-semibold text-white mb-3">Saved Reports ({investigations.length})</h2>
          <div className="space-y-2">
            {investigations.map((inv) => {
              const txn = transactions.find((t) => t.id === inv.transaction_id);
              if (!txn) return null;
              return (
                <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-navy-800/40 hover:bg-navy-700/40 transition-colors">
                  <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-mono">{inv.id}</div>
                    <div className="text-xs text-navy-300">{inv.transaction_id} · {inv.threat_type}</div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', actionBgColor(inv.recommended_action))}>
                    {inv.recommended_action}
                  </span>
                  <button
                    onClick={() => handleGenerate(txn)}
                    className="p-1.5 rounded text-navy-300 hover:text-cyan-300 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report preview modal */}
      {showPreview && reportTxn && reportData && (
        <>
          <div className="fixed inset-0 z-[55] bg-navy-950/80 backdrop-blur-md animate-fade-in no-print" onClick={() => setShowPreview(false)} />
          <div className="fixed inset-0 z-[56] flex items-center justify-center p-4 pointer-events-none no-print">
            <div className="glass-strong border border-navy-600/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin pointer-events-auto animate-scale-in">
              {/* Header */}
              <div className="sticky top-0 z-10 glass-strong border-b border-navy-600/30 px-5 py-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white">Investigation Report Preview</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-700/40 border border-navy-600/30 text-slate-300 hover:text-cyan-300 text-xs font-medium transition-all">
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 text-xs font-medium transition-all">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button onClick={() => setShowPreview(false)} className="p-1.5 rounded text-navy-300 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Report content */}
              <div className="p-6 space-y-5">
                {/* Report header */}
                <div className="text-center pb-4 border-b border-navy-600/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
                      <FileText className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-wide">RISK SENTINEL</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Investigation Report</h2>
                  <p className="text-xs text-navy-300 mt-1">AI-Powered Payment Risk Intelligence</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/5 border border-amber-400/20 text-[10px] font-mono text-amber-400/70">
                    <AlertTriangle className="w-3 h-3" />
                    DEMO ENVIRONMENT — SYNTHETIC DATA
                  </div>
                </div>

                {/* Transaction info */}
                <ReportSection title="Transaction Information">
                  <ReportRow label="Transaction ID" value={reportTxn.id} />
                  <ReportRow label="Amount" value={formatCurrency(reportTxn.amount, reportTxn.currency)} />
                  <ReportRow label="Timestamp" value={formatTimestamp(reportTxn.timestamp)} />
                  <ReportRow label="Location" value={reportTxn.location} />
                  <ReportRow label="Merchant" value={reportTxn.merchant || 'Unknown'} />
                  <ReportRow label="Device" value={reportTxn.device_info || 'Unknown'} />
                  <ReportRow label="IP Address" value={reportTxn.ip_address || 'Unknown'} />
                </ReportSection>

                {/* Risk assessment */}
                <ReportSection title="Risk Assessment">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex items-center justify-center w-16 h-16 rounded-xl border text-xl font-bold font-mono',
                      riskBgColor(reportData.analysis.risk_level)
                    )}>
                      {reportData.analysis.risk_score}
                    </div>
                    <div>
                      <div className="text-sm text-white font-semibold">{reportData.analysis.risk_level}</div>
                      <div className="text-xs text-navy-300">Risk Score: {reportData.analysis.risk_score}/100</div>
                      <div className={cn('mt-1 px-2 py-0.5 rounded text-xs font-medium border inline-block', actionBgColor(reportData.analysis.recommended_action))}>
                        AI: {reportData.analysis.recommended_action}
                      </div>
                    </div>
                  </div>
                </ReportSection>

                {/* Detected signals */}
                <ReportSection title="Detected Risk Signals">
                  <div className="space-y-1.5">
                    {reportData.analysis.risk_factors.filter((f) => f.triggered).map((f) => (
                      <div key={f.key} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-risk-critical flex-shrink-0" />
                        <span className="text-slate-300">{f.label}</span>
                        <span className="text-navy-300 text-xs ml-auto">{f.deviation}% deviation</span>
                      </div>
                    ))}
                    {reportData.analysis.risk_factors.filter((f) => f.triggered).length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-risk-low">
                        <CheckCircle className="w-3.5 h-3.5" />
                        No risk signals triggered — transaction appears normal
                      </div>
                    )}
                  </div>
                </ReportSection>

                {/* Threat type */}
                <ReportSection title="Threat Classification">
                  <p className="text-sm text-white font-medium">{reportData.analysis.threat_type}</p>
                </ReportSection>

                {/* AI attack story */}
                <ReportSection title="AI Attack Story">
                  <p className="text-sm text-slate-300 leading-relaxed">{reportData.analysis.attack_story}</p>
                  <div className="mt-2 text-xs text-amber-400/60 italic">
                    AI analysis is advisory only. Human review required for final decisions.
                  </div>
                </ReportSection>

                {/* Risk timeline */}
                <ReportSection title="Risk Timeline">
                  <div className="space-y-1.5">
                    {reportData.analysis.timeline.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-navy-300 font-mono w-20 flex-shrink-0">{e.time}</span>
                        <span className="text-slate-300">{e.label}</span>
                        <span className="text-navy-400 ml-auto font-mono">{e.risk_score}/100</span>
                      </div>
                    ))}
                  </div>
                </ReportSection>

                {/* Behavioral fingerprint */}
                <ReportSection title="Behavioral Fingerprint">
                  <div className="space-y-1">
                    {reportData.analysis.behavioral_fingerprint.map((fp) => (
                      <div key={fp.signal} className="grid grid-cols-3 gap-2 text-xs py-1 border-b border-navy-600/10">
                        <span className="text-slate-300">{fp.signal}</span>
                        <span className="text-navy-300">{fp.normal_behavior}</span>
                        <span className={cn(
                          'text-right font-medium',
                          fp.status === 'critical' ? 'text-risk-critical' :
                          fp.status === 'high' ? 'text-risk-high' :
                          fp.status === 'elevated' ? 'text-risk-medium' : 'text-risk-low'
                        )}>
                          {fp.current_behavior} ({fp.deviation}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </ReportSection>

                {/* AI recommendation */}
                <ReportSection title="AI Recommendation">
                  <p className="text-sm text-slate-300">
                    The AI investigation agent recommends <span className={cn('font-medium',
                      reportData.analysis.recommended_action === 'APPROVE' ? 'text-risk-low' :
                      reportData.analysis.recommended_action === 'REVIEW' ? 'text-risk-medium' : 'text-risk-critical'
                    )}>{reportData.analysis.recommended_action}</span> based on the composite risk score of {reportData.analysis.risk_score}/100.
                  </p>
                </ReportSection>

                {/* Human decision */}
                <ReportSection title="Human Decision">
                  {reportData.investigation ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-navy-300">Decision:</span>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium border',
                          reportData.investigation.human_decision === 'PENDING'
                            ? 'bg-navy-700/40 text-navy-300 border-navy-600/30'
                            : actionBgColor(reportData.investigation.human_decision)
                        )}>
                          {reportData.investigation.human_decision}
                        </span>
                      </div>
                      {reportData.investigation.notes && (
                        <p className="text-xs text-slate-300 mt-2">{reportData.investigation.notes}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-navy-300 italic">No human decision recorded yet. Open investigation to add.</p>
                  )}
                </ReportSection>

                {/* Footer */}
                <div className="pt-4 border-t border-navy-600/20 text-center">
                  <p className="text-xs text-navy-300">
                    Report generated: {formatTimestamp(new Date().toISOString())}
                  </p>
                  <p className="text-[10px] text-navy-400 mt-1">
                    RISK SENTINEL — Synthetic data for demonstration purposes only. Not affiliated with any payment processor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs text-navy-300 uppercase tracking-wider mb-2 font-semibold">{title}</h3>
      <div className="glass-card p-3">{children}</div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-navy-600/10 last:border-0">
      <span className="text-navy-300">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function buildReportText(txn: Transaction, analysis: any, investigation: any): string {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  RISK SENTINEL — Investigation Report');
  lines.push('  AI-Powered Payment Risk Intelligence');
  lines.push('  DEMO ENVIRONMENT — SYNTHETIC DATA');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push('TRANSACTION INFORMATION');
  lines.push(`  Transaction ID: ${txn.id}`);
  lines.push(`  Amount:         ${formatCurrency(txn.amount, txn.currency)}`);
  lines.push(`  Timestamp:      ${formatTimestamp(txn.timestamp)}`);
  lines.push(`  Location:       ${txn.location}`);
  lines.push(`  Merchant:       ${txn.merchant || 'Unknown'}`);
  lines.push(`  Device:         ${txn.device_info || 'Unknown'}`);
  lines.push(`  IP Address:     ${txn.ip_address || 'Unknown'}`);
  lines.push('');
  lines.push('RISK ASSESSMENT');
  lines.push(`  Risk Score:     ${analysis.risk_score}/100`);
  lines.push(`  Risk Level:     ${analysis.risk_level}`);
  lines.push(`  AI Action:       ${analysis.recommended_action}`);
  lines.push('');
  lines.push('DETECTED RISK SIGNALS');
  analysis.risk_factors.filter((f: any) => f.triggered).forEach((f: any) => {
    lines.push(`  ⚠ ${f.label} (${f.deviation}% deviation)`);
  });
  if (analysis.risk_factors.filter((f: any) => f.triggered).length === 0) {
    lines.push('  ✓ No risk signals triggered');
  }
  lines.push('');
  lines.push('THREAT CLASSIFICATION');
  lines.push(`  ${analysis.threat_type}`);
  lines.push('');
  lines.push('AI ATTACK STORY');
  lines.push(`  ${analysis.attack_story}`);
  lines.push('');
  lines.push('RISK TIMELINE');
  analysis.timeline.forEach((e: any) => {
    lines.push(`  ${e.time} — ${e.label} (Score: ${e.risk_score}/100)`);
  });
  lines.push('');
  lines.push('BEHAVIORAL FINGERPRINT');
  analysis.behavioral_fingerprint.forEach((fp: any) => {
    lines.push(`  ${fp.signal}: ${fp.normal_behavior} → ${fp.current_behavior} (${fp.deviation}% deviation)`);
  });
  lines.push('');
  lines.push('AI RECOMMENDATION');
  lines.push(`  ${analysis.recommended_action}`);
  lines.push('');
  lines.push('HUMAN DECISION');
  if (investigation) {
    lines.push(`  Decision: ${investigation.human_decision}`);
    if (investigation.notes) lines.push(`  Notes:   ${investigation.notes}`);
  } else {
    lines.push('  No human decision recorded.');
  }
  lines.push('');
  lines.push(`Report generated: ${formatTimestamp(new Date().toISOString())}`);
  lines.push('RISK SENTINEL — Synthetic data for demonstration purposes only.');
  return lines.join('\n');
}
