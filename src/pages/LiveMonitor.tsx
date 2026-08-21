import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import type { Transaction, RiskLevel } from '@/types';
import { formatCurrency, formatTime, riskBgColor } from '@/lib/utils';

const PAGE_SIZE = 10;

type SortKey = 'timestamp' | 'amount' | 'risk_score' | 'transaction_velocity';
type SortDir = 'asc' | 'desc';
type RiskFilter = 'ALL' | RiskLevel;

export function LiveMonitor() {
  const { transactions, setSelectedTransaction, setInvestigationPanelOpen } = useApp();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = [...transactions];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.threat_type.toLowerCase().includes(q) ||
          t.merchant?.toLowerCase().includes(q) ||
          t.user_id.toLowerCase().includes(q) ||
          t.ip_address?.toLowerCase().includes(q)
      );
    }

    // Risk filter
    if (riskFilter !== 'ALL') {
      result = result.filter((t) => t.risk_level === riskFilter);
    }

    // Sort
    result.sort((a, b) => {
      let av: number | string = a[sortKey];
      let bv: number | string = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return result;
  }, [transactions, search, riskFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleRowClick = (t: Transaction) => {
    setSelectedTransaction(t);
    setInvestigationPanelOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          Live Monitor
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Real-time transaction surveillance · {filtered.length} transactions
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input
            type="text"
            placeholder="Search by ID, location, threat, merchant, user, IP..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-navy-600/30 text-sm text-white placeholder-navy-300 focus:outline-none focus:border-cyan-400/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <Filter className="w-4 h-4 text-navy-300 flex-shrink-0" />
          {(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RiskFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => { setRiskFilter(r); setPage(0); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 whitespace-nowrap',
                riskFilter === r
                  ? r === 'ALL'
                    ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300'
                    : riskBgColor(r as RiskLevel)
                  : 'bg-navy-800/40 border-navy-600/20 text-navy-300 hover:text-slate-200'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden animate-fade-in-up animate-delay-200">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600/30 text-navy-300 text-xs">
                <th className="text-left px-4 py-3 font-medium">Transaction ID</th>
                <th className="text-left px-4 py-3 font-medium">
                  <button onClick={() => handleSort('amount')} className="flex items-center gap-1 hover:text-cyan-300 transition-colors">
                    Amount <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Device</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                  <button onClick={() => handleSort('transaction_velocity')} className="flex items-center gap-1 hover:text-cyan-300 transition-colors">
                    Velocity <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button onClick={() => handleSort('risk_score')} className="flex items-center gap-1 hover:text-cyan-300 transition-colors">
                    Risk Score <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Threat Type</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-navy-300">
                    No transactions found matching your filters
                  </td>
                </tr>
              ) : (
                pageData.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handleRowClick(t)}
                    className="border-b border-navy-600/15 hover:bg-navy-700/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-cyan-300/80 group-hover:text-cyan-300">{t.id}</td>
                    <td className="px-4 py-3 font-mono text-white">{formatCurrency(t.amount, t.currency)}</td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell text-xs">{t.location}</td>
                    <td className="px-4 py-3 text-navy-300 hidden lg:table-cell text-xs">{t.device_info?.split(' / ')[0]}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn(
                        'font-mono text-xs',
                        t.transaction_velocity >= 5 ? 'text-risk-high' : t.transaction_velocity >= 3 ? 'text-risk-medium' : 'text-slate-300'
                      )}>
                        {t.transaction_velocity}/10min
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-bold font-mono',
                          riskBgColor(t.risk_level)
                        )}>
                          {t.risk_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-300">{t.threat_type}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium border',
                        t.recommended_action === 'APPROVE' ? 'bg-risk-low/10 text-risk-low border-risk-low/30' :
                        t.recommended_action === 'REVIEW' ? 'bg-risk-medium/10 text-risk-medium border-risk-medium/30' :
                        'bg-risk-critical/10 text-risk-critical border-risk-critical/30'
                      )}>
                        {t.recommended_action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-600/20">
            <div className="text-xs text-navy-300">
              Page {page + 1} of {totalPages} · {filtered.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg glass border border-navy-600/30 text-navy-300 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg glass border border-navy-600/30 text-navy-300 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
