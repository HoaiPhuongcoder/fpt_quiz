import { useMemo, useState, type ReactNode } from 'react';
import { CheckIcon, PlayIcon, ShuffleIcon, StarIcon, WarningCircleIcon, ListNumbersIcon, type Icon } from '@phosphor-icons/react';
import { useApp } from '../../store/appStore';
import { ConfirmDialog, Glass, NeonButton, NumberField } from '../../components/ui';
import { StarButton } from '../../components/StarButton';
import type { DrillKind } from '../../domain/practice';
import type { Question } from '../../domain/types';
import { roman } from '../../domain/subject';
import { go, href } from '../../store/nav';

export type PracticeTab = 'sai' | 'sao' | 'khoang';
export const DRILL_TAB: Record<DrillKind, PracticeTab> = { wrong: 'sai', starred: 'sao', range: 'khoang', exam: 'sai' };
const TABS: { id: PracticeTab; label: string; Icon: Icon }[] = [
  { id: 'sai', label: 'Câu sai', Icon: WarningCircleIcon },
  { id: 'sao', label: 'Gắn sao', Icon: StarIcon },
  { id: 'khoang', label: 'Khoảng câu', Icon: ListNumbersIcon },
];

function useStartDrill() {
  const startDrill = useApp((s) => s.startDrill);
  return (kind: DrillKind, ns: number[], shuffled: boolean) => {
    startDrill(kind, ns, shuffled);
    go('/luyen');
  };
}

function ShuffleToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2"><ShuffleIcon weight="duotone" size={20} className="text-new" />Trộn thứ tự câu</span>
      <input type="checkbox" className="size-5 accent-violet" checked={on} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Item({ q, badge, action }: { q: Question; badge?: ReactNode; action?: ReactNode }) {
  return (
    <Glass className="space-y-2 p-4">
      <div className="flex items-center gap-2 text-xs text-mut">
        <b className="font-num text-sm text-ink">Câu {q.n}</b>
        <span>Ch.{roman(q.c)}</span>
        {badge}
        <StarButton n={q.n} className="-my-2 ml-auto" />
      </div>
      <p className="font-semibold leading-relaxed">{q.q}</p>
      <p className="text-sm text-ok">
        <CheckIcon weight="bold" size={14} className="mr-1 inline" />
        {q.o.filter(([k]) => q.a.includes(k)).map(([k, t]) => `${k}. ${t}`).join(' | ')}
      </p>
      {action}
    </Glass>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <Glass className="p-6 text-center text-sm text-mut">{children}</Glass>;
}

function WrongTab() {
  const wrong = useApp((s) => s.wrong);
  const byId = useApp((s) => s.byId);
  const forgetWrong = useApp((s) => s.forgetWrong);
  const start = useStartDrill();
  const [shuffled, setShuffled] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const rows = useMemo(
    () => Object.entries(wrong).map(([n, c]) => ({ q: byId[Number(n)], c })).filter((r) => r.q).sort((a, b) => b.c - a.c || a.q.n - b.q.n),
    [wrong, byId],
  );

  return (
    <div className="space-y-3">
      <Glass className="space-y-3 p-4">
        <p className="text-sm text-mut">
          Mọi câu bạn làm sai khi học, thi thử hay luyện tập đều được gom vào đây. Làm đúng câu đó trong lượt <b className="text-ink">Luyện câu sai</b> thì câu tự rời danh sách.
        </p>
        <ShuffleToggle on={shuffled} onChange={setShuffled} />
        <NeonButton className="w-full" disabled={!rows.length} onClick={() => start('wrong', rows.map((r) => r.q.n), shuffled)}>
          <PlayIcon weight="fill" size={18} />Luyện {rows.length} câu sai
        </NeonButton>
      </Glass>
      {rows.length ? (
        <>
          <div className="flex items-center justify-between text-xs text-mut">
            <span>Sắp theo số lần sai</span>
            <button type="button" className="min-h-11 px-2 text-bad-soft hover:underline" onClick={() => setConfirm(true)}>Xóa hết danh sách</button>
          </div>
          {rows.map(({ q, c }) => (
            <Item
              key={q.n}
              q={q}
              badge={<span className="rounded-full bg-bad/15 px-2 py-0.5 font-semibold text-bad-soft">Sai {c} lần</span>}
              action={<NeonButton variant="ghost" className="px-3 text-xs" onClick={() => forgetWrong(q.n)}>Đã nhớ, bỏ khỏi danh sách</NeonButton>}
            />
          ))}
        </>
      ) : (
        <Empty>Chưa có câu sai nào. Học hoặc thi thử, câu nào sai sẽ hiện ở đây.</Empty>
      )}
      {confirm && (
        <ConfirmDialog
          danger
          text={`Xóa ${rows.length} câu khỏi danh sách câu sai? Tiến độ học không bị ảnh hưởng.`}
          confirmLabel="Xóa hết"
          onCancel={() => setConfirm(false)}
          onConfirm={() => { forgetWrong(); setConfirm(false); }}
        />
      )}
    </div>
  );
}

function StarredTab() {
  const starred = useApp((s) => s.starred);
  const byId = useApp((s) => s.byId);
  const start = useStartDrill();
  const [shuffled, setShuffled] = useState(true);
  const rows = useMemo(() => starred.map((n) => byId[n]).filter(Boolean).sort((a, b) => a.n - b.n), [starred, byId]);

  return (
    <div className="space-y-3">
      <Glass className="space-y-3 p-4">
        <p className="text-sm text-mut">
          Bấm <StarIcon weight="fill" size={14} className="inline text-flag" /> ở bất kỳ câu nào (khi học, xem kết quả thi, tìm kiếm) hoặc phím <b className="text-ink">S</b> lúc đang học để lưu câu vào đây.
        </p>
        <ShuffleToggle on={shuffled} onChange={setShuffled} />
        <NeonButton className="w-full" disabled={!rows.length} onClick={() => start('starred', rows.map((q) => q.n), shuffled)}>
          <PlayIcon weight="fill" size={18} />Luyện {rows.length} câu gắn sao
        </NeonButton>
      </Glass>
      {rows.length ? rows.map((q) => <Item key={q.n} q={q} />) : <Empty>Chưa gắn sao câu nào.</Empty>}
    </div>
  );
}

function RangeTab() {
  const questions = useApp((s) => s.questions);
  const start = useStartDrill();
  const lo = questions[0]?.n ?? 1;
  const hi = questions[questions.length - 1]?.n ?? 1;
  const [from, setFrom] = useState(lo);
  const [to, setTo] = useState(Math.min(hi, lo + 49));
  const [shuffled, setShuffled] = useState(false);
  const [a, b] = from <= to ? [from, to] : [to, from];
  const ns = useMemo(() => questions.filter((q) => q.n >= a && q.n <= b).map((q) => q.n), [questions, a, b]);

  return (
    <div className="space-y-3">
      <Glass className="space-y-3 p-4">
        <p className="text-sm text-mut">
          Làm lần lượt các câu trong khoảng, không giới hạn số câu mới mỗi ngày và không đổi lịch ôn. Muốn học kiểu lặp lại ngắt quãng trong một khoảng, đặt <b className="text-ink">Phạm vi câu</b> ở <a href={href('/')} className="text-violet-soft underline">Trang chủ</a>.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Từ câu" value={from} min={lo} max={hi} onChange={setFrom} />
          <NumberField label="Đến câu" value={to} min={lo} max={hi} onChange={setTo} />
        </div>
        <p className="text-xs text-mut">Ngân hàng có câu {lo}–{hi}. Khoảng đã chọn có <b className="font-num text-ink">{ns.length}</b> câu.</p>
        <ShuffleToggle on={shuffled} onChange={setShuffled} />
        <NeonButton className="w-full" disabled={!ns.length} onClick={() => start('range', ns, shuffled)}>
          <PlayIcon weight="fill" size={18} />Luyện câu {a}–{b}
        </NeonButton>
      </Glass>
    </div>
  );
}

export function Practice({ tab }: { tab?: string }) {
  const current: PracticeTab = tab === 'sao' || tab === 'khoang' ? tab : 'sai';
  const wrongCount = useApp((s) => Object.keys(s.wrong).length);
  const starCount = useApp((s) => s.starred.length);
  const count: Record<PracticeTab, number | null> = { sai: wrongCount, sao: starCount, khoang: null };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Luyện tập</h1>
      <nav aria-label="Nguồn câu luyện tập" className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map(({ id, label, Icon }) => (
          <a
            key={id}
            href={href(`/luyen-tap/${id}`)}
            aria-current={current === id ? 'page' : undefined}
            className={`flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg text-[13px] font-semibold sm:gap-1.5 sm:text-sm ${current === id ? 'bg-violet text-white' : 'text-mut hover:text-ink'}`}
          >
            <Icon weight={current === id ? 'fill' : 'regular'} size={16} />
            {label}
            {count[id] != null && <span className="font-num text-xs opacity-80">{count[id]}</span>}
          </a>
        ))}
      </nav>
      {current === 'sai' ? <WrongTab /> : current === 'sao' ? <StarredTab /> : <RangeTab />}
    </div>
  );
}
