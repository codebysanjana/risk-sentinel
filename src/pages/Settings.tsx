import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { Settings, Gauge, Bell, Beaker, Sparkles } from 'lucide-react';

export function SettingsPage() {
  const { settings, updateSettings, addToast } = useApp();

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value });
    addToast({ type: 'info', title: 'Settings Updated', message: `${key} set to ${value}` });
  };

  const handleSensitivity = (value: 'low' | 'medium' | 'high') => {
    updateSettings({ riskSensitivity: value });
    addToast({ type: 'info', title: 'Risk Sensitivity', message: `Set to ${value}` });
  };

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Configure risk engine sensitivity, notifications, and demo preferences
        </p>
      </div>

      {/* Risk Sensitivity */}
      <div className="glass-card p-5 animate-fade-in-up animate-delay-100">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Risk Sensitivity</h2>
        </div>
        <p className="text-xs text-navy-300 mb-4">Adjust the threshold at which transactions are flagged for review</p>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleSensitivity(level)}
              className={cn(
                'px-4 py-3 rounded-lg border text-sm font-medium capitalize transition-all duration-200',
                settings.riskSensitivity === level
                  ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300'
                  : 'bg-navy-800/40 border-navy-600/20 text-navy-300 hover:text-slate-200'
              )}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs text-navy-300 mt-3">
          {settings.riskSensitivity === 'low' && 'Fewer transactions flagged — only critical threats trigger alerts'}
          {settings.riskSensitivity === 'medium' && 'Balanced detection — recommended for most use cases'}
          {settings.riskSensitivity === 'high' && 'Aggressive detection — more transactions flagged for review'}
        </p>
      </div>

      {/* Notifications */}
      <div className="glass-card p-5 animate-fade-in-up animate-delay-200">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Notifications</h2>
        </div>
        <p className="text-xs text-navy-300 mb-4">Receive alerts for high-risk transactions and investigation updates</p>
        <Toggle
          label="Enable notifications"
          description="Show toast alerts for high-risk events"
          value={settings.notifications}
          onChange={(v) => handleToggle('notifications', v)}
        />
      </div>

      {/* Demo Mode */}
      <div className="glass-card p-5 animate-fade-in-up animate-delay-300">
        <div className="flex items-center gap-2 mb-1">
          <Beaker className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Demo Mode</h2>
        </div>
        <p className="text-xs text-navy-300 mb-4">Display demo indicators and use synthetic data throughout the application</p>
        <Toggle
          label="Show DEMO indicator"
          description="Display 'DEMO ENVIRONMENT — SYNTHETIC DATA' badges"
          value={settings.demoMode}
          onChange={(v) => handleToggle('demoMode', v)}
        />
      </div>

      {/* Animations */}
      <div className="glass-card p-5 animate-fade-in-up animate-delay-400">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Animation Preferences</h2>
        </div>
        <p className="text-xs text-navy-300 mb-4">Control motion and transitions (respects prefers-reduced-motion)</p>
        <Toggle
          label="Enable animations"
          description="Animated counters, transitions, and cinematic effects"
          value={settings.animations}
          onChange={(v) => handleToggle('animations', v)}
        />
      </div>

      {/* About */}
      <div className="glass-card p-5 animate-fade-in-up animate-delay-500">
        <h2 className="text-sm font-semibold text-white mb-2">About RISK SENTINEL</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          RISK SENTINEL is an AI-powered payment risk intelligence prototype designed around
          payment-risk use cases. It uses synthetic transaction data for demonstration purposes
          and is not affiliated with or connected to any payment processor's production systems.
          All AI analysis is advisory — human approval is required for any final action.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/5 border border-amber-400/20 text-[10px] font-mono text-amber-400/70">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          DEMO ENVIRONMENT — SYNTHETIC DATA
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-white font-medium">{label}</div>
        <div className="text-xs text-navy-300">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-12 h-6 rounded-full border transition-all duration-200',
          value ? 'bg-cyan-400/20 border-cyan-400/40' : 'bg-navy-800/40 border-navy-600/30'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
            value ? 'left-7 bg-cyan-400' : 'left-0.5 bg-navy-400'
          )}
        />
      </button>
    </div>
  );
}
