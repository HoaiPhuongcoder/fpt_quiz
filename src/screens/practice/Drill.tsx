import { useEffect, useRef } from 'react';
import { ArrowRightIcon, LightningIcon, TargetIcon, XIcon } from '@phosphor-icons/react';
import { useApp } from '../../store/appStore';
import { Glass, NeonButton, ProgressBar } from '../../components/ui';
import { QuestionView } from '../study/QuestionView';
import { roman } from '../../domain/subject';
import { replaceTo } from '../../store/nav';
import type { DrillSession } from '../../domain/practice';
import { DRILL_TAB } from './Practice';

const KEY_MAP: Record<string, string> = { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
const TITLE: Record<DrillSession['kind'], string> = { wrong: 'Luyện câu sai', starred: 'Luyện câu gắn sao', range: 'Luyện theo khoảng', exam: 'Luyện câu sai của đề' };

function DrillSummary({ drill, onExit }: { drill: DrillSession; onExit: () => void }) {
  const startDrill = useApp((s) => s.startDrill);
  const total = drill.queue.length;
  const pct = total ? Math.round((drill.right.length / total) * 100) : 0;
  return (
    <div className="space-y-4 py-4 text-center">
      <TargetIcon weight="duotone" size={52} className="mx-auto text-violet-soft" />
      <h2 className="text-2xl font-bold">Xong lượt luyện!</h2>
      <Glass className="space-y-2 p-4 text-left">
        <div className="flex justify-between text-sm font-semibold">
          <span>Đúng</span>
          <span><span className="font-num text-ok">{drill.right.length}</span> / <span className="font-num">{total}</span> · {pct}%</span>
        </div>
        <ProgressBar value={drill.right.length} max={total} />
        <p className="text-sm text-mut">+<span className="font-num text-ok">{drill.xp}</span> XP</p>
      </Glass>
      {drill.missed.length > 0 && (
        <p className="text-sm text-mut">
          Câu sai lượt này: <span className="font-num text-bad-soft">{[...drill.missed].sort((a, b) => a - b).join(', ')}</span>
        </p>
      )}
      <div className="grid gap-2">
        {drill.missed.length > 0 && (
          <NeonButton onClick={() => startDrill(drill.kind, drill.missed, true)}>Làm lại {drill.missed.length} câu sai</NeonButton>
        )}
        <NeonButton variant="ghost" onClick={() => startDrill(drill.kind, drill.queue, true)}>Luyện lại cả lượt</NeonButton>
        <NeonButton variant="ghost" onClick={onExit}>Về Luyện tập</NeonButton>
      </div>
    </div>
  );
}

export function Drill() {
  const drill = useApp((s) => s.drill);
  const byId = useApp((s) => s.byId);
  const cards = useApp((s) => s.cards);
  const now = useApp((s) => s.now);
  const drillChoose = useApp((s) => s.drillChoose);
  const drillNext = useApp((s) => s.drillNext);
  const endDrill = useApp((s) => s.endDrill);
  const toggleStar = useApp((s) => s.toggleStar);
  const bodyRef = useRef<HTMLDivElement>(null);

  const done = !!drill && drill.i >= drill.queue.length;
  const q = drill && !done ? byId[drill.queue[drill.i]] : null;
  const exit = () => {
    replaceTo(`/luyen-tap/${drill ? DRILL_TAB[drill.kind] : 'sai'}`);
    endDrill();
  };

  // Tải lại trang thì lượt luyện mất (không lưu), quay về trang Luyện tập.
  useEffect(() => { if (!drill) replaceTo('/luyen-tap'); }, [drill]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [drill?.i]);
  useEffect(() => {
    if (drill?.shown && !drill.correct && 'vibrate' in navigator) navigator.vibrate(60);
  }, [drill?.shown, drill?.correct]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/TEXTAREA|INPUT|SELECT/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === 'Escape') { e.preventDefault(); exit(); return; }
      if (!q || !drill) return;
      const k = e.key.toUpperCase();
      if (k === 'S') { e.preventDefault(); toggleStar(q.n); return; }
      if (!drill.shown) {
        const key = KEY_MAP[k];
        if (key && q.o.some(([o]) => o === key)) { e.preventDefault(); drillChoose(key); }
      } else if (k === ' ' || k === 'ENTER' || k === 'ARROWRIGHT') { e.preventDefault(); drillNext(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  if (!drill) return null;
  const total = drill.queue.length;
  const last = drill.i === total - 1;

  return (
    <div className="bg-app fixed inset-0 z-20 flex flex-col" role="dialog" aria-label={TITLE[drill.kind]}>
      <div className="border-b border-white/10 bg-white/5 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={exit} aria-label="Thoát" className="grid size-11 place-items-center rounded-xl text-mut hover:bg-white/10">
            <XIcon size={22} />
          </button>
          <div className="text-center">
            <p className="text-xs text-mut">{TITLE[drill.kind]}</p>
            <p className="font-num text-lg font-bold">{Math.min(drill.i + 1, total)} / {total}</p>
          </div>
          <div className="flex min-w-20 items-center justify-end gap-2 text-sm font-bold">
            {drill.combo >= 2 && (
              <span className="inline-flex items-center gap-1 text-relearn">
                <LightningIcon weight="fill" size={16} />×<span className="font-num">{drill.combo}</span>
              </span>
            )}
            <span className="font-num text-ok" title="Số câu đúng">{drill.right.length}✓</span>
          </div>
        </div>
        <ProgressBar value={drill.i + (drill.shown ? 1 : 0)} max={total} className="mt-2" />
      </div>
      <div ref={bodyRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[560px] px-4 py-4">
          {q ? (
            <QuestionView q={q} card={cards[q.n]} picked={drill.picked} shown={drill.shown} correct={drill.correct} now={now} onChoose={drillChoose} meta={`Câu ${q.n} · Ch. ${roman(q.c)}`} practice />
          ) : (
            <DrillSummary drill={drill} onExit={exit} />
          )}
        </div>
      </div>
      <div className="border-t border-white/10 bg-white/5 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur-md">
        {q && drill.shown ? (
          <div className="mx-auto max-w-[560px]">
            <NeonButton className="w-full" onClick={drillNext}>
              {last ? 'Xem kết quả' : 'Câu tiếp'}<ArrowRightIcon weight="bold" size={18} />
            </NeonButton>
          </div>
        ) : (
          <p className="py-2 text-center text-sm text-mut">{q ? 'Chọn đáp án: bấm hoặc phím A–E / 1–5 · S gắn sao · Esc để thoát' : 'Esc để thoát'}</p>
        )}
      </div>
    </div>
  );
}
