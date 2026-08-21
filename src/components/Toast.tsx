import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ToastItemProps {
  toast: { id: string; type: 'success' | 'warning' | 'error' | 'info'; title: string; message: string };
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
  };

  const colors = {
    success: 'text-risk-low border-risk-low/30 bg-risk-low/5',
    warning: 'text-risk-medium border-risk-medium/30 bg-risk-medium/5',
    error: 'text-risk-critical border-risk-critical/30 bg-risk-critical/5',
    info: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl glass-strong border min-w-[280px] max-w-[400px] transition-all duration-300',
        colors[toast.type],
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{toast.title}</div>
        <div className="text-xs text-slate-400 mt-0.5 break-words">{toast.message}</div>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-navy-300 hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-20 right-4 z-[60] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}
