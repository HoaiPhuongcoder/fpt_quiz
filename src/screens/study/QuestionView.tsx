import type { ReactNode } from 'react';
import { BooksIcon, LightbulbIcon, ListChecksIcon, WarningIcon } from '@phosphor-icons/react';
import { useApp } from '../../store/appStore';
import { OptionButton, type OptionState } from '../../components/OptionButton';
import { StatusPill } from '../../components/status';
import type { Card, Question } from '../../domain/types';
import { MIN, clock, fmt } from '../../domain/time';

export function optionState(k: string, q: Question, picked: string[], shown: boolean): OptionState {
  if (shown) return q.a.includes(k) ? 'right' : picked.includes(k) ? 'wrong' : 'dim';
  return picked.includes(k) ? 'sel' : 'idle';
}

const TONE = {
  violet: 'border-violet/30 bg-violet/10 [&_h3]:text-violet-soft',
  cyan: 'border-cyan/30 bg-cyan/5 [&_h3]:text-new',
  flag: 'border-flag/30 bg-flag/10 [&_h3]:text-flag',
  relearn: 'border-relearn/30 bg-relearn/5 [&_h3]:text-relearn',
} as const;

function InfoBox({ icon, title, tone, children }: { icon: ReactNode; title: string; tone: keyof typeof TONE; children: ReactNode }) {
  return (
    <section className={`rounded-2xl border p-3.5 text-[15px] leading-relaxed ${TONE[tone]}`}>
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">{icon}{title}</h3>
      <div>{children}</div>
    </section>
  );
}

export function CardInfo({ card, now }: { card?: Card; now: number }) {
  if (!card) return <p className="text-xs text-mut">Thẻ mới · chưa có lịch</p>;
  const items: [string, string][] = [
    ['Khoảng cách', card.st === 'review' ? fmt(card.ivl ?? 0) : `bước ${(card.step ?? 0) + 1}`],
    ['Đến hạn', card.due <= now ? 'Ngay bây giờ' : fmt((card.due - now) / MIN)],
    ['Ease', `${Math.round(card.ease * 100)}%`],
    ['Ôn / Quên', `${card.reps} / ${card.lapses ?? 0}`],
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([l, v]) => (
        <div key={l} className="rounded-xl bg-white/5 px-3 py-2">
          <span className="block text-[11px] text-mut">{l}</span>
          <b className="text-sm">{v}</b>
        </div>
      ))}
    </div>
  );
}

export function QuestionView({ q, card, picked, shown, correct, now, meta, onChoose }: {
  q: Question; card?: Card; picked: string[]; shown: boolean; correct: boolean; now: number; meta: string; onChoose: (key: string) => void;
}) {
  const byId = useApp((s) => s.byId);
  const similar = q.s.flatMap((m) => (byId[m] ? [byId[m]] : []));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-mut">
        <StatusPill card={card} />
        <span>{meta}</span>
        {card?.lapses ? <span>Đã quên {card.lapses} lần</span> : null}
        {card && card.due > now ? <span>(học trước, hạn {clock(card.due, now)})</span> : null}
      </div>
      <h2 className="text-lg font-bold leading-relaxed">
        {q.q}
        {q.a.length > 1 && <span className="ml-1 text-sm font-normal text-mut">(chọn {q.a.length})</span>}
      </h2>
      <div className="grid gap-2.5">
        {q.o.map(([k, t]) => (
          <OptionButton key={k} letter={k} text={t} state={optionState(k, q, picked, shown)} disabled={shown} onClick={() => onChoose(k)} />
        ))}
      </div>
      {shown && (
        <div className="space-y-3">
          <p className={`rounded-xl px-3 py-2 font-semibold ${correct ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad-soft'}`}>
            {correct ? 'Chính xác!' : `Chưa đúng. Đáp án: ${q.a.join(', ')}`}
          </p>
          <InfoBox icon={<ListChecksIcon weight="duotone" size={20} />} title="Vì sao chọn đáp án này" tone="violet">{q.y}</InfoBox>
          <InfoBox icon={<LightbulbIcon weight="duotone" size={20} />} title="Mẹo nhận biết" tone="cyan">{q.t}</InfoBox>
          {q.w && <InfoBox icon={<WarningIcon weight="duotone" size={20} />} title="Lệch giáo trình" tone="flag">{q.w}</InfoBox>}
          {similar.length > 0 && (
            <InfoBox icon={<BooksIcon weight="duotone" size={20} />} title="Câu tương tự, dễ nhầm" tone="relearn">
              <ul className="space-y-1.5">
                {similar.map((s) => (
                  <li key={s.n}>
                    <span className="text-mut">Câu {s.n}:</span> {s.q} →{' '}
                    <span className="font-semibold text-ok">{s.o.filter(([k]) => s.a.includes(k)).map(([, t]) => t).join(' | ')}</span>
                  </li>
                ))}
              </ul>
            </InfoBox>
          )}
          <CardInfo card={card} now={now} />
        </div>
      )}
    </div>
  );
}
