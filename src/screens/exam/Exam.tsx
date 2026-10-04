import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretLeftIcon, CaretRightIcon, FlagIcon, XIcon } from '@phosphor-icons/react';
import { useApp } from '../../store/appStore';
import { ConfirmDialog, NeonButton } from '../../components/ui';
import { OptionButton } from '../../components/OptionButton';
import { LETTERS } from '../../domain/exam';

const pad = (n: number) => String(n).padStart(2, '0');

export function Exam() {
  const ex = useApp((s) => s.examCurrent);
  const byId = useApp((s) => s.byId);
  const examSelect = useApp((s) => s.examSelect);
  const examGo = useApp((s) => s.examGo);
  const examToggleFlag = useApp((s) => s.examToggleFlag);
  const submitExam = useApp((s) => s.submitExam);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const submitted = useRef(false);

  const doSubmit = useCallback(() => {
    submitted.current = true;
    const r = submitExam();
    location.replace(r ? `#/ket-qua/${r.id}` : '#/thi');
  }, [submitExam]);

  useEffect(() => {
    const t = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // Không có bài đang làm (và không phải vừa nộp) thì quay về màn thiết lập.
  useEffect(() => {
    if (!ex && !submitted.current) location.replace('#/thi');
  }, [ex]);
  useEffect(() => {
    if (ex && clockNow >= ex.deadline && !submitted.current) doSubmit();
  }, [ex, clockNow, doSubmit]);
  useEffect(() => {
    if (!ex) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (confirming || /TEXTAREA|INPUT|SELECT/.test((e.target as HTMLElement).tagName)) return;
      const item = ex.items[ex.current];
      const k = e.key.toUpperCase();
      const idx = LETTERS.includes(k) ? LETTERS.indexOf(k) : ['1', '2', '3', '4', '5'].indexOf(k);
      if (idx >= 0 && idx < item.order.length) { e.preventDefault(); examSelect(item.order[idx]); }
      else if (e.key === 'ArrowRight') examGo(ex.current + 1);
      else if (e.key === 'ArrowLeft') examGo(ex.current - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [ex, confirming, examSelect, examGo]);

  if (!ex) return null;
  const item = ex.items[ex.current];
  const q = byId[item.n];
  const picked = ex.answers[item.n] ?? [];
  const flagged = ex.flagged.includes(item.n);
  const remaining = Math.max(0, ex.deadline - clockNow);
  const unanswered = ex.items.filter((it) => !ex.answers[it.n]?.length).length;

  return (
    <div className="bg-app fixed inset-0 z-20 flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur-md">
        <button type="button" onClick={() => location.replace('#/thi')} aria-label="Thoát (bài vẫn được lưu)" className="grid size-11 place-items-center rounded-xl text-mut hover:bg-white/10">
          <XIcon size={22} />
        </button>
        <span className={`font-num text-xl font-bold drop-shadow-[0_0_10px_rgba(103,232,249,.6)] ${remaining < 5 * 60_000 ? 'text-bad-soft' : 'text-new'}`} aria-label="Thời gian còn lại">
          {pad(Math.floor(remaining / 60_000))}:{pad(Math.floor(remaining / 1000) % 60)}
        </span>
        <NeonButton className="px-3 text-sm" onClick={() => (unanswered ? setConfirming(true) : doSubmit())}>Nộp bài</NeonButton>
      </div>

      <div className="max-h-32 overflow-y-auto px-4 pt-2">
        <div className="grid grid-cols-10 gap-1">
          {ex.items.map((it, i) => {
            const cls = i === ex.current
              ? 'border-[1.5px] border-cyan shadow-[0_0_8px_#22d3ee]'
              : ex.flagged.includes(it.n) ? 'bg-flag text-[#1a1433]'
              : ex.answers[it.n]?.length ? 'bg-violet text-white' : 'bg-white/10 text-mut';
            return (
              <button key={it.n} type="button" aria-label={`Đến câu ${i + 1}`} onClick={() => examGo(i)} className={`h-7 rounded-md font-num text-[11px] ${cls}`}>
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
      <p className="px-4 pt-1 text-xs text-mut"><span className="font-num">{ex.items.length - unanswered}/{ex.items.length}</span> đã làm · ô vàng là câu đánh dấu</p>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[560px] space-y-3 px-4 py-4">
          <p className="text-xs tracking-widest text-new">CÂU {ex.current + 1} / {ex.items.length}</p>
          <h2 className="text-lg font-bold leading-relaxed">
            {q.q}
            {q.a.length > 1 && <span className="ml-1 text-sm font-normal text-mut">(chọn {q.a.length})</span>}
          </h2>
          <div className="grid gap-2.5">
            {item.order.map((k, i) => (
              <OptionButton key={k} letter={LETTERS[i]} text={q.o.find(([o]) => o === k)![1]} state={picked.includes(k) ? 'sel' : 'idle'} onClick={() => examSelect(k)} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-white/10 bg-white/5 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur-md">
        <NeonButton variant="ghost" disabled={ex.current === 0} onClick={() => examGo(ex.current - 1)}><CaretLeftIcon size={18} />Trước</NeonButton>
        <NeonButton variant="ghost" aria-pressed={flagged} className={flagged ? 'border-flag/60 text-flag' : ''} onClick={examToggleFlag}>
          <FlagIcon weight={flagged ? 'fill' : 'regular'} size={18} />Đánh dấu
        </NeonButton>
        <NeonButton variant="ghost" disabled={ex.current === ex.items.length - 1} onClick={() => examGo(ex.current + 1)}>Sau<CaretRightIcon size={18} /></NeonButton>
      </div>

      {confirming && (
        <ConfirmDialog
          text={`Còn ${unanswered} câu chưa làm. Câu bỏ trống sẽ tính là sai. Nộp luôn?`}
          confirmLabel="Nộp bài"
          onConfirm={doSubmit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
