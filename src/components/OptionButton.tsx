import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';

export type OptionState = 'idle' | 'sel' | 'right' | 'wrong' | 'dim';

const STYLE: Record<OptionState, string> = {
  idle: 'border-white/10 bg-white/5 hover:border-violet/60',
  sel: 'border-violet bg-violet/20',
  right: 'border-ok bg-ok/10 shadow-[0_0_18px_rgba(163,230,53,.3)]',
  wrong: 'border-bad bg-bad/10',
  dim: 'border-white/10 bg-white/[.03] text-mut',
};

export function OptionButton({ letter, text, state, disabled = false, onClick }: {
  letter: string; text: string; state: OptionState; disabled?: boolean; onClick?: () => void;
}) {
  const Icon = state === 'right' ? CheckCircleIcon : state === 'wrong' ? XCircleIcon : null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={state === 'sel'}
      className={`flex min-h-12 w-full items-start gap-3 rounded-2xl border-[1.5px] px-3.5 py-3 text-left text-[15px] transition disabled:cursor-default ${STYLE[state]}`}
    >
      <span className={`w-5 shrink-0 font-num font-bold ${state === 'right' ? 'text-ok' : state === 'wrong' ? 'text-bad-soft' : 'text-violet-soft'}`}>
        {Icon ? <Icon weight="fill" size={20} /> : letter}
      </span>
      <span className="flex-1">{text}</span>
    </button>
  );
}
