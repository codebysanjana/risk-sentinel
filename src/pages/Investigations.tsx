import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { Search, FileText, ChevronRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatTimestamp, actionBgColor, riskBgColor } from '@/lib/utils';
import type { Investigation } from '@/types';

export function Investigations() {
  const { investigations, setSelectedTransaction, setInvestigationPanelOpen, transactions } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'reviewing' | 'resolved'>('all');

  const filtered = investigations.filter((inv) => {
    if (search) {
      const q = search.toLowerCase();
      if (!inv.id.toLowerCase().includes(q) && !inv.transaction_id.toLowerCase().includes(q) && !inv.threat_type.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    return true;
  });

  const handleOpen = (inv: Investigation) => {
    const txn = transactions.find((t) => t.id === inv.transaction_id);
    if (txn) {
      setSelectedTransaction(txn);
      setInvestigationPanelOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-cyan-400" />
          Investigations
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          {investigations.length} investigation{investigations.length !== 1 ? 's' : ''} · {investigations.filter((i) => i.status === 'open').length} open
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input
            type="text"
            placeholder="Search by investigation ID, transaction, or threat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-navy-600/30 text-sm text-white placeholder-navy-300 focus:outline-none focus:border-cyan-400/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'open', 'reviewing', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 capitalize',
                statusFilter === s
                  ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300'
                  : 'bg-navy-800/40 border-navy-600/20 text-navy-300 hover:text-slate-200'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in-up animate-delay-200">
          <FileText className="w-12 h-12 text-navy-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No investigations yet</h3>
          <p className="text-sm text-navy-300">
            Open a transaction from Live Monitor and save an investigation to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in-up animate-delay-200">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              onClick={() => handleOpen(inv)}
              className="glass-card glass-card-hover p-4 cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg border flex-shrink-0',
                  inv.status === 'resolved' ? 'bg-risk-low/10 border-risk-low/30 text-risk-low' :
                  inv.status === 'reviewing' ? 'bg-risk-medium/10 border-risk-medium/30 text-risk-medium' :
                  'bg-cyan-400/10 border-cyan-400/30 text-cyan-400'
                )}>
                  {inv.status === 'resolved' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{inv.id}</span>
                    <span className="text-xs text-navy-300 font-mono">{inv.transaction_id}</span>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', riskBgColor(inv.risk_level))}>
                      {inv.risk_level}
                    </span>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', actionBgColor(inv.recommended_action))}>
                      AI: {inv.recommended_action}
                    </span>
                    {inv.human_decision !== 'PENDING' && (
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', actionBgColor(inv.human_decision))}>
                        Human: {inv.human_decision}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-300 mt-1.5">{inv.threat_type}</div>
                  {inv.notes && <div className="text-xs text-navy-300 mt-1 italic">{inv.notes}</div>}
                  <div className="text-xs text-navy-400 mt-1.5 font-mono">{formatTimestamp(inv.created_at)}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={cn('text-2xl font-bold font-mono',
                    inv.risk_score > 80 ? 'text-risk-critical' :
                    inv.risk_score > 60 ? 'text-risk-high' :
                    inv.risk_score > 30 ? 'text-risk-medium' : 'text-risk-low'
                  )}>
                    {inv.risk_score}
                  </div>
                  <ChevronRight className="w-4 h-4 text-navy-400 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
