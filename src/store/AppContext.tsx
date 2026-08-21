import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Transaction, Investigation, DashboardStats, SimulationResult } from '@/types';
import { generateSeedTransactions, generateDashboardStats } from '@/lib/seedData';
import { runSimulation } from '@/lib/simulations';
import {
  fetchTransactions,
  fetchDashboardStats,
  runSimulationApi,
  createInvestigation as apiCreateInvestigation,
  fetchInvestigations,
  isApiConfigured,
  ApiError,
} from '@/services/api';

export type Page = 'overview' | 'live-monitor' | 'investigations' | 'risk-graph' | 'reports' | 'settings';
export type SimulationType = 'account-takeover' | 'velocity' | 'suspicious-device' | 'normal';

interface AppState {
  initialized: boolean;
  setInitialized: (v: boolean) => void;

  currentPage: Page;
  setCurrentPage: (p: Page) => void;

  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;

  selectedTransaction: Transaction | null;
  setSelectedTransaction: (t: Transaction | null) => void;

  investigations: Investigation[];
  addInvestigation: (inv: Investigation) => void;
  updateInvestigation: (id: string, updates: Partial<Investigation>) => void;

  stats: DashboardStats;
  refreshStats: () => void;

  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  runSim: (type: SimulationType) => Promise<SimulationResult>;
  lastSimulation: SimulationResult | null;

  simLoading: boolean;
  simError: string | null;
  retryLastSim: () => void;

  dataLoading: boolean;
  dataError: string | null;
  retryLoadData: () => void;

  aiPanelOpen: boolean;
  setAiPanelOpen: (v: boolean) => void;

  investigationPanelOpen: boolean;
  setInvestigationPanelOpen: (v: boolean) => void;

  attackReplayOpen: boolean;
  setAttackReplayOpen: (v: boolean) => void;

  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

export interface AppSettings {
  riskSensitivity: 'low' | 'medium' | 'high';
  notifications: boolean;
  demoMode: boolean;
  animations: boolean;
  apiMode: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    transactions_analyzed: 0,
    high_risk: 0,
    under_review: 0,
    fraud_prevented: 0,
    ai_confidence: 96.4,
    risk_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
    trend: [],
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastSimulation, setLastSimulation] = useState<SimulationResult | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [investigationPanelOpen, setInvestigationPanelOpen] = useState(false);
  const [attackReplayOpen, setAttackReplayOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    riskSensitivity: 'medium',
    notifications: true,
    demoMode: true,
    animations: true,
    apiMode: false,
  });

  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [lastSimType, setLastSimType] = useState<SimulationType | null>(null);

  const useApi = settings.apiMode && isApiConfigured();

  const loadData = useCallback(async (mode: boolean) => {
    if (mode) {
      setDataLoading(true);
      setDataError(null);
      try {
        const [txns, dashStats] = await Promise.all([
          fetchTransactions({ limit: 200 }),
          fetchDashboardStats(),
        ]);
        setTransactions(txns);
        setStats(dashStats);
        try {
          const invs = await fetchInvestigations();
          setInvestigations(invs);
        } catch {
          // investigations may be empty — that's fine
        }
      } catch (err) {
        const msg = err instanceof ApiError
          ? (err.isNetworkError
            ? 'Cannot connect to the backend server. Make sure it is running.'
            : err.message)
          : 'Failed to load data from the backend.';
        setDataError(msg);
        // Fall back to demo data so UI still works
        const seeded = generateSeedTransactions();
        setTransactions(seeded);
        setStats(generateDashboardStats(seeded));
      } finally {
        setDataLoading(false);
      }
    } else {
      const seeded = generateSeedTransactions();
      setTransactions(seeded);
      setStats(generateDashboardStats(seeded));
      setDataError(null);
    }
  }, []);

  // Load data on mount and when apiMode changes
  useEffect(() => {
    loadData(useApi);
  }, [useApi, loadData]);

  const addTransaction = useCallback((t: Transaction) => {
    setTransactions((prev) => [t, ...prev]);
  }, []);

  const refreshStats = useCallback(() => {
    if (useApi) {
      fetchDashboardStats()
        .then(setStats)
        .catch(() => {
          setTransactions((prev) => setStats(generateDashboardStats(prev)));
        });
    } else {
      setTransactions((prev) => {
        setStats(generateDashboardStats(prev));
        return prev;
      });
    }
  }, [useApi]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const runSim = useCallback(async (type: SimulationType): Promise<SimulationResult> => {
    setLastSimType(type);
    setSimLoading(true);
    setSimError(null);

    try {
      let result: SimulationResult;
      if (useApi) {
        result = await runSimulationApi(type);
      } else {
        result = runSimulation(type);
      }
      setLastSimulation(result);
      setTransactions((prev) => {
        const updated = [result.transaction, ...prev];
        if (!useApi) {
          setStats(generateDashboardStats(updated));
        }
        return updated;
      });
      if (useApi) {
        fetchDashboardStats().then(setStats).catch(() => {});
      }
      return result;
    } catch (err) {
      const msg = err instanceof ApiError
        ? (err.isNetworkError
          ? 'Cannot connect to the backend server. Make sure it is running.'
          : err.message)
        : 'Simulation failed.';
      setSimError(msg);
      throw err;
    } finally {
      setSimLoading(false);
    }
  }, [useApi]);

  const retryLastSim = useCallback(() => {
    if (lastSimType) {
      runSim(lastSimType).catch(() => {});
    }
  }, [lastSimType, runSim]);

  const retryLoadData = useCallback(() => {
    loadData(useApi);
  }, [useApi, loadData]);

  const addInvestigation = useCallback((inv: Investigation) => {
    setInvestigations((prev) => [inv, ...prev]);
  }, []);

  const updateInvestigation = useCallback((id: string, updates: Partial<Investigation>) => {
    setInvestigations((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        initialized,
        setInitialized,
        currentPage,
        setCurrentPage,
        transactions,
        addTransaction,
        selectedTransaction,
        setSelectedTransaction,
        investigations,
        addInvestigation,
        updateInvestigation,
        stats,
        refreshStats,
        toasts,
        addToast,
        removeToast,
        runSim,
        lastSimulation,
        simLoading,
        simError,
        retryLastSim,
        dataLoading,
        dataError,
        retryLoadData,
        aiPanelOpen,
        setAiPanelOpen,
        investigationPanelOpen,
        setInvestigationPanelOpen,
        attackReplayOpen,
        setAttackReplayOpen,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
