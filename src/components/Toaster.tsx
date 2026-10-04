import { useEffect } from 'react';
import { useApp, type Toast } from '../store/appStore';

const KIND: Record<Toast['kind'], string> = {
  info: 'border-white/10 bg-[#15102b]/90 text-ink',
  xp: 'border-ok/40 bg-[#15102b]/90 text-ok',
  badge: 'border-flag/40 bg-[#15102b]/90 text-flag',
  error: 'border-bad/40 bg-[#15102b]/90 text-bad-soft',
};

export function Toaster({ raised }: { raised: boolean }) {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => dismiss(toasts[0].id), 3500);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4 ${raised ? 'bottom-[calc(env(safe-area-inset-bottom)+96px)]' : 'bottom-[calc(env(safe-area-inset-bottom)+80px)] lg:bottom-6'}`}
    >
      {toasts.map((t) => (
        <button key={t.id} type="button" onClick={() => dismiss(t.id)} className={`pointer-events-auto max-w-md rounded-xl border px-4 py-2 text-sm shadow-lg backdrop-blur-md ${KIND[t.kind]}`}>
          {t.text}
        </button>
      ))}
    </div>
  );
}
