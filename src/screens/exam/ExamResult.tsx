import { useState } from 'react';
import { MedalIcon } from '@phosphor-icons/react';
import { useApp } from '../../store/appStore';
import { Chip, Glass, NeonButton, ProgressBar } from '../../components/ui';
import { OptionButton, type OptionState } from '../../components/OptionButton';
import { LETTERS, type ExamItem } from '../../domain/exam';
import { badgeById } from '../../domain/badges';
import { CHAPTERS, ROMAN, type Question } from '../../domain/types';

function ReviewItem({ index, item, q, picked }: { index: number; item: ExamItem; q: Question; picked: string[] }) {
  return (
    <Glass className="space-y-2 p-4">
      <p className="text-xs text-mut">Câu {index + 1} · số {q.n} · Ch. {ROMAN[q.c]}</p>
      <p className="font-semibold">{q.q}</p>
      <div className="grid gap-2">
        {item.order.map((k, i) => {
          const state: OptionState = q.a.includes(k) ? 'right' : picked.includes(k) ? 'wrong' : 'dim';
          return <OptionButton key={k} letter={LETTERS[i]} text={q.o.find(([o]) => o === k)![1]} state={state} disabled />;
        })}
      </div>
      {!picked.length && <p className="text-xs font-semibold text-flag">Bỏ trống</p>}
      <p className="text-sm text-mut"><b className="text-violet-soft">Vì sao:</b> {q.y}</p>
      <p className="text-sm text-mut"><b className="text-new">Mẹo:</b> {q.t}</p>
    </Glass>
  );
}

export function ExamResultScreen({ id }: { id?: string }) {
  const result = useApp((s) => s.examHistory.find((r) => r.id === id));
  const byId = useApp((s) => s.byId);
  const [filter, setFilter] = useState<'wrong' | 'all'>('wrong');

  if (!result) {
    return (
      <Glass className="p-6 text-center">
        <p>Không tìm thấy kết quả này.</p>
        <a className="mt-3 inline-block text-violet-soft underline" href="#/thi">Về Thi thử</a>
      </Glass>
    );
  }

  const pct = result.total ? (result.correct / result.total) * 100 : 0;
  const ring = result.score10 >= 8 ? 'var(--color-ok)' : result.score10 >= 5 ? 'var(--color-flag)' : 'var(--color-bad)';
  const shown = result.items.map((it, i) => ({ it, i })).filter(({ it }) => filter === 'all' || result.wrong.includes(it.n));

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-mut">Kết quả thi thử</p>
        <div className="mx-auto my-3 grid size-32 place-items-center rounded-full" style={{ background: `conic-gradient(${ring} 0 ${pct}%, #2a2350 0)` }}>
          <div className="grid size-26 place-items-center rounded-full bg-[#15102b]">
            <div>
              <p className="font-num text-4xl font-bold leading-none">{result.score10}</p>
              <p className="text-xs text-mut">{result.correct}/{result.total} đúng</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs font-bold">
          <span className="rounded-lg bg-ok/15 px-2.5 py-1 text-ok">+<span className="font-num">{result.xp}</span> XP</span>
          {result.newBadges.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 rounded-lg bg-flag/15 px-2.5 py-1 text-flag">
              <MedalIcon weight="fill" size={14} />{badgeById(b)?.name}
            </span>
          ))}
        </div>
      </div>

      <Glass className="p-4">
        <p className="mb-2 text-sm font-semibold">Theo chương</p>
        <div className="grid gap-2">
          {CHAPTERS.filter((c) => result.byChapter[c]).map((c) => {
            const s = result.byChapter[c]!;
            return (
              <div key={c} className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-2 text-xs">
                <span className="text-mut">Ch. {ROMAN[c]}</span>
                <ProgressBar value={s.correct} max={s.total} />
                <span className="text-right font-num">{s.correct}/{s.total}</span>
              </div>
            );
          })}
        </div>
      </Glass>

      {result.wrong.length > 0 && (
        <p className="rounded-2xl border border-relearn/30 bg-relearn/10 p-3 text-sm">
          <b className="text-relearn">{result.wrong.length} câu sai</b> đã được đưa vào hàng <b>Học lại</b>, sẽ hiện ngay ở phiên học tiếp theo.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Chip on={filter === 'wrong'} onClick={() => setFilter('wrong')}>Câu sai ({result.wrong.length})</Chip>
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>Toàn bộ đề ({result.total})</Chip>
      </div>
      <div className="space-y-3">
        {shown.map(({ it, i }) => <ReviewItem key={it.n} index={i} item={it} q={byId[it.n]} picked={result.answers[it.n] ?? []} />)}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NeonButton disabled={!result.wrong.length} onClick={() => { location.hash = '#/hoc'; }}>Ôn câu sai ngay</NeonButton>
        <NeonButton variant="ghost" onClick={() => { location.hash = '#/thi'; }}>Thi lại</NeonButton>
      </div>
    </div>
  );
}
