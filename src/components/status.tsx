import type { Card } from '../domain/types';

export function statusName(c?: Card): string {
  return !c || c.st === 'new' ? 'Mới' : c.st === 'review' ? 'Ôn tập' : c.st === 'relearn' ? 'Học lại' : 'Đang học';
}

function statusTone(c?: Card): string {
  return !c || c.st === 'new' ? 'bg-new/15 text-new' : c.st === 'review' ? 'bg-ok/15 text-ok' : 'bg-relearn/15 text-relearn';
}

export function StatusPill({ card }: { card?: Card }) {
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(card)}`}>{statusName(card)}</span>;
}
