import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Transaction, Investigation, DashboardStats } from '@/types';
import { generateSeedTransactions, generateDashboardStats } from '@/lib/seedData';
import { runSimulation } from '@/lib/simulations';
import type { SimulationResult } from '@/types';

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

  runSim: (type: SimulationType) => SimulationResult;
  lastSimulation: SimulationResult | null;

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
  });

  // Generate seed data on mount
  useEffect(() => {
    const seeded = generateSeedTransactions();
    setTransactions(seeded);
    setStats(generateDashboardStats(seeded));
  }, []);

  const addTransaction = useCallback((t: Transaction) => {
    setTransactions((prev) => [t, ...prev]);
  }, []);

  const refreshStats = useCallback(() => {
    setTransactions((prev) => {
      setStats(generateDashboardStats(prev));
      return prev;
    });
  }, []);

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

  const runSim = useCallback((type: SimulationType): SimulationResult => {
    const result = runSimulation(type);
    setLastSimulation(result);
    setTransactions((prev) => {
      const updated = [result.transaction, ...prev];
      setStats(generateDashboardStats(updated));
      return updated;
    });
    return result;
  }, []);

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
