import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const INPUT_CLASS = 'min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-ink outline-none focus:border-violet';

export function Glass({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md ${className}`}>{children}</div>;
}

type Variant = 'primary' | 'ghost' | 'danger';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-linear-to-r from-violet to-cyan text-white shadow-[0_0_22px_rgba(139,92,246,.55)]',
  ghost: 'border border-white/10 bg-white/5 text-ink hover:bg-white/10',
  danger: 'border border-bad/60 bg-bad/10 text-bad-soft hover:bg-bad/20',
};

export function NeonButton({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-40 ${VARIANT[variant]} ${className}`}
      {...rest}
    />
  );
}

export function ProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-2 rounded-full bg-white/10 ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full bg-linear-to-r from-ok to-cyan shadow-[0_0_10px_rgba(163,230,53,.5)]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function XpRing({ level, pct, size = 56 }: { level: number; pct: number; size?: number }) {
  return (
    <div className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(var(--color-violet) 0 ${pct}%, #2a2350 0)` }}>
      <div className="grid place-items-center rounded-full bg-[#15102b] font-num text-lg font-bold" style={{ width: size - 10, height: size - 10 }} aria-label={`Cấp ${level}`}>
        {level}
      </div>
    </div>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-4 text-sm font-medium transition ${on ? 'border-violet bg-violet/25 text-white shadow-[0_0_12px_rgba(139,92,246,.45)]' : 'border-white/10 bg-white/5 text-mut hover:text-ink'}`}
    >
      {children}
    </button>
  );
}

export function Stat({ icon, value, label, tone }: { icon: ReactNode; value: ReactNode; label: string; tone: string }) {
  return (
    <div className="grid justify-items-center gap-0.5 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-center">
      <span className={tone}>{icon}</span>
      <b className="font-num text-2xl leading-tight">{value}</b>
      <span className="text-[11px] uppercase tracking-wider text-mut">{label}</span>
    </div>
  );
}

export function NumberField({ label, value, min, max, onChange, onBlur, hint }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; onBlur?: () => void; hint?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      <input type="number" inputMode="numeric" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} onBlur={onBlur} className={`${INPUT_CLASS} font-num`} />
      {hint && <span className="text-xs text-mut">{hint}</span>}
    </label>
  );
}

export function ConfirmDialog({ text, confirmLabel, onConfirm, onCancel, danger = false }: {
  text: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4" role="alertdialog" aria-modal="true" aria-label={confirmLabel}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1433] p-5 shadow-2xl">
        <p className="text-sm leading-relaxed">{text}</p>
        <div className="mt-4 flex justify-end gap-2">
          <NeonButton variant="ghost" onClick={onCancel}>Hủy</NeonButton>
          <NeonButton variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</NeonButton>
        </div>
      </div>
    </div>
  );
}
