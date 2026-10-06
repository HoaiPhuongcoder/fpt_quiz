import { Fragment, useDeferredValue, useMemo, useState } from 'react';
import { CheckCircleIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useApp } from '../store/appStore';
import { Chip, Glass, INPUT_CLASS, NeonButton } from '../components/ui';
import { StatusPill } from '../components/status';
import { CHAPTERS, ROMAN, type ChapterId, type Question } from '../domain/types';
import { highlight, parseQuery, searchQuestions } from '../domain/search';

const PAGE = 30;
const EXAMPLES = ['đoàn kết', 'cần kiệm liêm chính', '"đảng cầm quyền"', '577'];

// Giữ lại từ khóa khi chuyển tab rồi quay lại trong cùng phiên.
let lastQuery = '';

function Marked({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlight(text, terms).map((p, i) =>
        p.hit ? <mark key={i} className="rounded bg-flag/30 px-0.5 text-white">{p.text}</mark> : <Fragment key={i}>{p.text}</Fragment>,
      )}
    </>
  );
}

function ResultCard({ q, terms, explain, onJump }: { q: Question; terms: string[]; explain: boolean; onJump: (n: number) => void }) {
  const card = useApp((s) => s.cards[q.n]);
  const makeDueNow = useApp((s) => s.makeDueNow);
  const [open, setOpen] = useState(false);
  const showExplain = open || explain;
  return (
    <Glass className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-mut">
        <b className="font-num text-sm text-ink">Câu {q.n}</b>
        <span>Ch.{ROMAN[q.c]}</span>
        <StatusPill card={card} />
        {q.a.length > 1 && <span>nhiều đáp án (chọn {q.a.length})</span>}
      </div>
      <p className="font-semibold leading-relaxed"><Marked text={q.q} terms={terms} /></p>
      <ul className="grid gap-1.5" aria-label={`Phương án câu ${q.n}`}>
        {q.o.map(([k, t]) => {
          const right = q.a.includes(k);
          return (
            <li
              key={k}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-[15px] ${right ? 'border-ok/70 bg-ok/10' : 'border-white/10 bg-white/[.03] text-mut'}`}
            >
              <span className={`w-5 shrink-0 font-num font-bold ${right ? 'text-ok' : 'text-violet-soft'}`}>
                {right ? <CheckCircleIcon weight="fill" size={20} aria-label="Đáp án đúng" /> : k}
              </span>
              <span className="flex-1"><Marked text={t} terms={terms} /></span>
            </li>
          );
        })}
      </ul>
      {showExplain ? (
        <div className="space-y-2 rounded-xl bg-white/5 p-3 text-sm leading-relaxed">
          <p><span className="font-semibold text-violet-soft">Vì sao: </span><Marked text={q.y} terms={terms} /></p>
          <p><span className="font-semibold text-new">Mẹo: </span><Marked text={q.t} terms={terms} /></p>
          {q.w && <p><span className="font-semibold text-flag">Lưu ý: </span><Marked text={q.w} terms={terms} /></p>}
          {q.s.length > 0 && (
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-relearn">Câu dễ nhầm:</span>
              {q.s.map((m) => (
                <button key={m} type="button" onClick={() => onJump(m)} className="rounded-full border border-white/10 px-2 py-0.5 font-num text-xs hover:border-violet">
                  {m}
                </button>
              ))}
            </p>
          )}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {!explain && (
          <NeonButton variant="ghost" className="px-3 text-xs" onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? 'Ẩn giải thích' : 'Xem giải thích'}
          </NeonButton>
        )}
        {card && (
          <NeonButton variant="ghost" className="px-3 text-xs" onClick={() => makeDueNow(q.n)}>Ôn ngay</NeonButton>
        )}
      </div>
    </Glass>
  );
}

export function Search() {
  const questions = useApp((s) => s.questions);
  const [query, setQueryState] = useState(lastQuery);
  const [chs, setChs] = useState<ChapterId[]>([]);
  const [explain, setExplain] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const deferred = useDeferredValue(query);

  const setQuery = (v: string) => {
    lastQuery = v;
    setQueryState(v);
    setLimit(PAGE);
  };
  const toggleCh = (c: ChapterId) => {
    setChs((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c].sort()));
    setLimit(PAGE);
  };

  const terms = useMemo(() => parseQuery(deferred).terms, [deferred]);
  const hits = useMemo(() => searchQuestions(questions, deferred, { chapters: chs, explain }), [questions, deferred, chs, explain]);
  const empty = !deferred.trim();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tìm câu hỏi</h1>
      <div className="relative">
        <MagnifyingGlassIcon size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Gõ từ khóa, có dấu hay không dấu đều được"
          aria-label="Từ khóa tìm kiếm"
          className={`${INPUT_CLASS} pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden`}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Xóa từ khóa" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-mut hover:text-ink">
            <XIcon size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo chương">
        <Chip on={chs.length === 0} onClick={() => { setChs([]); setLimit(PAGE); }}>Mọi chương</Chip>
        {CHAPTERS.map((c) => <Chip key={c} on={chs.includes(c)} onClick={() => toggleCh(c)}>Ch.{ROMAN[c]}</Chip>)}
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-mut">
        <input type="checkbox" checked={explain} onChange={(e) => setExplain(e.target.checked)} className="size-4 accent-violet" />
        Tìm cả trong giải thích và mẹo
      </label>

      {empty ? (
        <Glass className="space-y-3 p-4 text-sm text-mut">
          <p>Tìm trong đề và các phương án của {questions.length} câu. Gõ nhiều từ thì câu phải chứa đủ các từ đó, đặt trong "ngoặc kép" để tìm nguyên cụm. Gõ một con số để mở thẳng câu đó.</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button key={e} type="button" onClick={() => setQuery(e)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-ink hover:border-violet">
                {e}
              </button>
            ))}
          </div>
        </Glass>
      ) : (
        <>
          <p className="text-xs text-mut" aria-live="polite">
            {hits.length ? `${hits.length} câu khớp` : 'Không tìm thấy câu nào. Thử bớt từ, bỏ lọc chương, hoặc bật tìm trong giải thích.'}
          </p>
          <div className="space-y-3">
            {hits.slice(0, limit).map(({ q }) => (
              <ResultCard key={q.n} q={q} terms={terms} explain={explain} onJump={(n) => { setChs([]); setQuery(String(n)); }} />
            ))}
          </div>
          {hits.length > limit && (
            <NeonButton variant="ghost" className="w-full" onClick={() => setLimit(limit + PAGE)}>
              Xem thêm ({hits.length - limit} câu nữa)
            </NeonButton>
          )}
        </>
      )}
    </div>
  );
}
