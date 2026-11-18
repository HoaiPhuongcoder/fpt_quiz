import { StarIcon } from '@phosphor-icons/react';
import { useApp } from '../store/appStore';

/** Nút gắn / bỏ sao cho một câu. */
export function StarButton({ n, className = '' }: { n: number; className?: string }) {
  const on = useApp((s) => s.starred.includes(n));
  const toggleStar = useApp((s) => s.toggleStar);
  const label = on ? `Bỏ sao câu ${n}` : `Gắn sao câu ${n}`;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); toggleStar(n); }}
      className={`grid size-11 shrink-0 place-items-center rounded-xl transition hover:bg-white/10 ${on ? 'text-flag' : 'text-dim hover:text-mut'} ${className}`}
    >
      <StarIcon weight={on ? 'fill' : 'regular'} size={22} />
    </button>
  );
}
