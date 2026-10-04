import { useEffect, useMemo, useRef } from 'react';
import { LightningIcon, XIcon } from '@phosphor-icons/react';
import { getAppStore, useApp } from '../../store/appStore';
import { useCounts } from '../../store/hooks';
import { schedule } from '../../domain/srs';
import { ROMAN, type Rating } from '../../domain/types';
import { QuestionView } from './QuestionView';
import { RatingBar } from './RatingBar';
import { SessionSummary } from './SessionSummary';

const KEY_MAP: Record<string, string> = { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };

export function Study() {
  const study = useApp((s) => s.study);
  const byId = useApp((s) => s.byId);
  const cards = useApp((s) => s.cards);
  const cfg = useApp((s) => s.cfg);
  const now = useApp((s) => s.now);
  const startStudy = useApp((s) => s.startStudy);
  const nextCard = useApp((s) => s.nextCard);
  const choose = useApp((s) => s.choose);
  const rate = useApp((s) => s.rate);
  const counts = useCounts();
  const bodyRef = useRef<HTMLDivElement>(null);

  const q = study.cur != null ? byId[study.cur] : null;
  const card = q ? cards[q.n] : undefined;
  const exit = () => location.replace('#/');

  useEffect(() => { startStudy(); }, [startStudy]);
  // Khi đang chờ, mỗi lần đồng hồ `now` nhích thì thử lấy thẻ mới đến hạn.
  // `nextCard` tự ghi `now`; ghi nhớ giá trị đó để không tự kích hoạt lại vòng lặp vô hạn.
  const ownNow = useRef<number | null>(null);
  useEffect(() => {
    if (now === ownNow.current) return;
    if (getAppStore().getState().study.cur == null) {
      nextCard();
      ownNow.current = getAppStore().getState().now;
    }
  }, [now, nextCard]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [study.cur]);
  useEffect(() => {
    if (study.shown && !study.correct && 'vibrate' in navigator) navigator.vibrate(60);
  }, [study.shown, study.correct]);

  const preview = useMemo(
    () => (q ? ([1, 2, 3, 4] as Rating[]).map((r) => schedule(card ?? { st: 'new' }, r, cfg, now)[1]) : []),
    [q, card, cfg, now],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/TEXTAREA|INPUT|SELECT/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === 'Escape') { e.preventDefault(); exit(); return; }
      if (!q) return;
      const k = e.key.toUpperCase();
      if (!study.shown) {
        const key = KEY_MAP[k];
        if (key && q.o.some(([o]) => o === key)) { e.preventDefault(); choose(key); }
      } else if (['1', '2', '3', '4'].includes(k)) { e.preventDefault(); rate(Number(k) as Rating); }
      else if (k === ' ' || k === 'ENTER') { e.preventDefault(); rate(study.correct ? 3 : 1); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <div className="bg-app fixed inset-0 z-20 flex flex-col" role="dialog" aria-label="Màn hình học">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur-md">
        <button type="button" onClick={exit} aria-label="Thoát" className="grid size-11 place-items-center rounded-xl text-mut hover:bg-white/10">
          <XIcon size={22} />
        </button>
        <div className="flex gap-3 font-num text-lg font-bold" title="Mới · Học lại · Đến hạn">
          <span className="text-new">{counts.newLeft}</span>
          <span className="text-relearn">{counts.lrDue}</span>
          <span className="text-ok">{counts.due}</span>
        </div>
        <div className="flex min-w-20 items-center justify-end gap-2 text-sm font-bold">
          {study.combo >= 2 && (
            <span className="inline-flex items-center gap-1 text-relearn">
              <LightningIcon weight="fill" size={16} />×<span className="font-num">{study.combo}</span>
            </span>
          )}
          {study.lastXp != null && <span key={study.answered} className="animate-xp text-ok">+{study.lastXp} XP</span>}
        </div>
      </div>
      <div ref={bodyRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[560px] px-4 py-4">
          {q ? (
            <QuestionView q={q} card={card} picked={study.picked} shown={study.shown} correct={study.correct} now={now} onChoose={choose} meta={`Câu ${q.n} · Ch. ${ROMAN[q.c]}`} />
          ) : (
            <SessionSummary />
          )}
        </div>
      </div>
      <div className="border-t border-white/10 bg-white/5 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur-md">
        {q && study.shown ? (
          <RatingBar preview={preview} correct={study.correct} onRate={rate} />
        ) : (
          <p className="py-2 text-center text-sm text-mut">{q ? 'Chọn đáp án: bấm hoặc phím A–E / 1–5 · Esc để thoát' : 'Esc để thoát'}</p>
        )}
      </div>
    </div>
  );
}
