import { AppProvider, useApp } from '@/store/AppContext';
import { InitScreen } from '@/components/InitScreen';
import { Sidebar, MobileNav } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ToastContainer } from '@/components/Toast';
import { InvestigationPanel } from '@/components/InvestigationPanel';
import { AttackReplay } from '@/components/AttackReplay';
import { AskSentinel } from '@/components/AskSentinel';
import { Dashboard } from '@/pages/Dashboard';
import { LiveMonitor } from '@/pages/LiveMonitor';
import { Investigations } from '@/pages/Investigations';
import { RiskGraph } from '@/pages/RiskGraph';
import { Reports } from '@/pages/Reports';
import { SettingsPage } from '@/pages/Settings';

function AppContent() {
  const { initialized, setInitialized, currentPage, settings } = useApp();

  if (!initialized) {
    return <InitScreen onComplete={() => setInitialized(true)} animationsEnabled={settings.animations} />;
  }

  return (
    <div className="min-h-screen bg-navy-950 grid-bg">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <TopBar />
          <main className="p-4 md:p-6 pb-20 md:pb-6">
            {currentPage === 'overview' && <Dashboard />}
            {currentPage === 'live-monitor' && <LiveMonitor />}
            {currentPage === 'investigations' && <Investigations />}
            {currentPage === 'risk-graph' && <RiskGraph />}
            {currentPage === 'reports' && <Reports />}
            {currentPage === 'settings' && <SettingsPage />}
          </main>
        </div>
      </div>
      <MobileNav />
      <ToastContainer />
      <InvestigationPanel />
      <AttackReplay />
      <AskSentinel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
