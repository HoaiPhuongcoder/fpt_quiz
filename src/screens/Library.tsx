import { Fragment, useMemo, useState } from 'react';
import { RATING_NAMES, useApp } from '../store/appStore';
import { useCounts, usePool } from '../store/hooks';
import { Chip, Glass, NeonButton } from '../components/ui';
import { StatusPill } from '../components/status';
import { ROMAN, type Card, type Question } from '../domain/types';
import { MIN, clock, endOfDay, fmt } from '../domain/time';

type Filter = 'studied' | 'due' | 'learn' | 'review' | 'lapsed' | 'new' | 'all';
type Sort = 'n' | 'due' | 'ivl' | 'ease' | 'lapses';
interface Row { q: Question; c?: Card }

const FILTERS: [Filter, string][] = [
  ['studied', 'Đã học'], ['due', 'Đến hạn'], ['learn', 'Đang học'], ['review', 'Ôn tập'], ['lapsed', 'Từng quên'], ['new', 'Mới'], ['all', 'Tất cả'],
];
const ROW_LIMIT = 400;

function matches(f: Filter, c: Card | undefined, now: number): boolean {
  switch (f) {
    case 'all': return true;
    case 'new': return !c;
    case 'studied': return !!c;
    case 'learn': return !!c && c.st !== 'review';
    case 'review': return !!c && c.st === 'review';
    case 'due': return !!c && c.due <= now;
    case 'lapsed': return !!c && (c.lapses ?? 0) > 0;
  }
}

const SORT_KEY: Record<Sort, (r: Row) => number> = {
  n: ({ q }) => q.n,
  due: ({ c }) => (c ? c.due : Infinity),
  ivl: ({ c }) => (c && c.st === 'review' ? -(c.ivl ?? 0) : 1),
  ease: ({ c }) => (c ? c.ease : 9),
  lapses: ({ c }) => (c ? -(c.lapses ?? 0) : 1),
};

function CardsTab() {
  const pool = usePool();
  const cards = useApp((s) => s.cards);
  const now = useApp((s) => s.now);
  const resetCard = useApp((s) => s.resetCard);
  const makeDueNow = useApp((s) => s.makeDueNow);
  const [filter, setFilter] = useState<Filter>('studied');
  const [sort, setSort] = useState<Sort>('due');
  const [open, setOpen] = useState<number | null>(null);

  const rows = useMemo(() => {
    const key = SORT_KEY[sort];
    return pool
      .map((q): Row => ({ q, c: cards[q.n] }))
      .filter(({ c }) => matches(filter, c, now))
      .sort((a, b) => { const x = key(a), y = key(b); return x === y ? 0 : x < y ? -1 : 1; });
  }, [pool, cards, now, filter, sort]);

  const th = (label: string, s?: Sort) => (
    <th scope="col" className={`whitespace-nowrap px-2 py-2 text-left font-semibold text-mut ${s ? 'cursor-pointer hover:text-ink' : ''}`} onClick={s ? () => setSort(s) : undefined}>
      {label}{s === sort ? ' ▾' : ''}
    </th>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([k, l]) => <Chip key={k} on={filter === k} onClick={() => setFilter(k)}>{l}</Chip>)}
      </div>
      <p className="text-xs text-mut">{rows.length} thẻ · bấm tiêu đề cột để sắp xếp · bấm dòng để xem lịch sử chấm</p>
      <Glass className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>{th('Câu', 'n')}{th('Trạng thái')}{th('Lặp lại lúc', 'due')}{th('Khoảng cách', 'ivl')}{th('Ease', 'ease')}{th('Quên', 'lapses')}{th('')}</tr>
          </thead>
          <tbody>
            {rows.slice(0, ROW_LIMIT).map(({ q, c }) => (
              <Fragment key={q.n}>
                <tr className="cursor-pointer border-b border-white/5 align-top hover:bg-white/5" onClick={() => setOpen(open === q.n ? null : q.n)}>
                  <td className="whitespace-nowrap px-2 py-2"><b className="font-num">{q.n}</b> <span className="text-xs text-mut">Ch.{ROMAN[q.c]}</span></td>
                  <td className="px-2 py-2"><StatusPill card={c} /></td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {c ? (c.due <= now ? <b className="text-bad-soft">Đến hạn</b> : <>sau {fmt((c.due - now) / MIN)}<br /><span className="text-xs text-mut">{clock(c.due, now)}</span></>) : '–'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">{c ? (c.st === 'review' ? fmt(c.ivl ?? 0) : `bước ${(c.step ?? 0) + 1}`) : '–'}</td>
                  <td className="px-2 py-2 font-num">{c ? `${Math.round(c.ease * 100)}%` : '–'}</td>
                  <td className="px-2 py-2 font-num">{c ? c.lapses ?? 0 : '–'}</td>
                  <td className="whitespace-nowrap px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    {c && (
                      <div className="flex gap-1">
                        <NeonButton variant="ghost" className="px-2 text-xs" onClick={() => makeDueNow(q.n)}>Ôn ngay</NeonButton>
                        <NeonButton variant="ghost" className="px-2 text-xs" onClick={() => resetCard(q.n)}>Đặt lại</NeonButton>
                      </div>
                    )}
                  </td>
                </tr>
                {open === q.n && (
                  <tr className="border-b border-white/5">
                    <td colSpan={7} className="space-y-1 px-2 py-3">
                      <p>{q.q}</p>
                      <p className="text-xs text-mut">Đáp án: {q.o.filter(([k]) => q.a.includes(k)).map(([, t]) => t).join(' | ')}</p>
                      {c?.log?.length ? (
                        <p className="text-xs text-mut">
                          Lịch sử: {c.log.map(([t, r, iv]) => `${new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })} ${RATING_NAMES[r]} → ${fmt(iv)}`).join(' · ')}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Glass>
      {rows.length > ROW_LIMIT && <p className="text-xs text-mut">Đang hiện {ROW_LIMIT} thẻ đầu.</p>}
    </div>
  );
}

function ForecastTab() {
  const pool = usePool();
  const cards = useApp((s) => s.cards);
  const now = useApp((s) => s.now);
  const counts = useCounts();

  const data = useMemo(() => {
    const cs = pool.map((q) => cards[q.n]).filter((c): c is Card => !!c);
    const eod = endOfDay(now);
    const dayMs = 86_400_000;
    const within = (m: number) => cs.filter((c) => c.due <= now + m * MIN).length;
    const buckets: [string, number][] = [];
    for (let h = 0; h < 24; h++) {
      const a = now + h * 60 * MIN, b = a + 60 * MIN;
      buckets.push([`+${h}–${h + 1} giờ`, cs.filter((c) => c.due > a && c.due <= b).length]);
    }
    for (let d = 1; d <= 7; d++) {
      const s = eod + (d - 1) * dayMs + 1, e = eod + d * dayMs;
      buckets.push([new Date(s).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }), cs.filter((c) => c.due > s && c.due <= e).length]);
    }
    return {
      tiles: [
        [within(0), 'Đến hạn ngay'],
        [within(60), 'Trong 1 giờ tới'],
        [cs.filter((c) => c.due <= eod).length, 'Đến hết hôm nay'],
        [cs.filter((c) => c.due > eod && c.due <= eod + dayMs).length, 'Ngày mai'],
      ] as [number, string][],
      buckets: buckets.filter(([, v]) => v > 0),
      max: Math.max(1, ...buckets.map(([, v]) => v)),
    };
  }, [pool, cards, now]);

  const tiles: [number, string][] = [...data.tiles, [counts.mature, 'Đã thuộc (≥ 1 ngày)'], [counts.nw, 'Chưa học']];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map(([v, l]) => (
          <Glass key={l} className="p-3"><b className="block font-num text-2xl">{v}</b><span className="text-xs text-mut">{l}</span></Glass>
        ))}
      </div>
      <Glass className="p-4">
        <p className="mb-3 text-sm font-semibold">Số thẻ sẽ đến hạn theo khung giờ</p>
        {data.buckets.length ? (
          <div className="grid gap-1.5">
            {data.buckets.map(([l, v]) => (
              <div key={l} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2 text-xs">
                <span className="text-mut">{l}</span>
                <i className="block h-2.5 min-w-0.5 rounded bg-linear-to-r from-violet to-cyan" style={{ width: `${(v / data.max) * 100}%` }} />
                <span className="text-right font-num">{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-mut">Chưa có thẻ nào được lên lịch. Học vài thẻ để thấy lịch.</p>
        )}
      </Glass>
    </div>
  );
}

export function Library() {
  const [tab, setTab] = useState<'cards' | 'forecast'>('cards');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Thư viện</h1>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {([['cards', 'Danh sách thẻ'], ['forecast', 'Lịch sắp tới']] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={`min-h-11 rounded-lg text-sm font-semibold ${tab === k ? 'bg-violet text-white' : 'text-mut'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'cards' ? <CardsTab /> : <ForecastTab />}
    </div>
  );
}
