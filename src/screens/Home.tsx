import { useState } from 'react';
import {
  ArrowCounterClockwiseIcon, CalendarCheckIcon, ExamIcon, FireIcon, MedalIcon, PlayIcon, SparkleIcon, StarIcon, TargetIcon, WarningCircleIcon,
} from '@phosphor-icons/react';
import { useApp } from '../store/appStore';
import { useChapterIds, useCounts, usePool } from '../store/hooks';
import { Chip, Glass, INPUT_CLASS, NeonButton, ProgressBar, Stat, XpRing } from '../components/ui';
import { OnlineBadge } from '../components/OnlineBadge';
import { displayStreak, levelInfo } from '../domain/gamify';
import { clock, dayKey } from '../domain/time';

import { go, href } from '../store/nav';
import { roman } from '../domain/subject';

/** Chọn khoảng câu cho phiên học (lặp lại ngắt quãng). Áp dụng khi bấm nút hoặc Enter. */
function RangePicker() {
  const questions = useApp((s) => s.questions);
  const range = useApp((s) => s.cfg.range);
  const setRange = useApp((s) => s.setRange);
  const poolSize = usePool().length;
  const lo = questions[0]?.n ?? 1;
  const hi = questions[questions.length - 1]?.n ?? 1;
  const key = range ? range.join('-') : 'all';
  const [draft, setDraft] = useState({ key, from: String(range?.[0] ?? lo), to: String(range?.[1] ?? hi) });
  // Khoảng đã lưu đổi (đổi môn, nhập dữ liệu…) thì ô nhập theo lại.
  const d = draft.key === key ? draft : { key, from: String(range?.[0] ?? lo), to: String(range?.[1] ?? hi) };
  const apply = () => setRange([Number(d.from) || lo, Number(d.to) || hi]);
  const field = (k: 'from' | 'to', label: string) => (
    <label className="grid flex-1 gap-1 text-xs text-mut">
      {label}
      <input
        type="number" inputMode="numeric" min={lo} max={hi} value={d[k]}
        onChange={(e) => setDraft({ ...d, [k]: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        className={`${INPUT_CLASS} font-num`}
      />
    </label>
  );

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">Phạm vi câu</h2>
      <Glass className="space-y-2 p-3">
        <div className="flex items-end gap-2">
          {field('from', 'Từ câu')}
          {field('to', 'Đến câu')}
          <NeonButton variant="ghost" className="px-3" onClick={apply}>Áp dụng</NeonButton>
        </div>
        <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-mut">
          <span>
            {range ? <>Đang học câu <b className="font-num text-ink">{range[0]}–{range[1]}</b></> : <>Đang học <b className="text-ink">mọi câu</b> ({lo}–{hi})</>}
            {' · '}<span className="font-num">{poolSize}</span> câu trong các chương đã chọn
          </span>
          {range && <button type="button" className="min-h-8 text-violet-soft hover:underline" onClick={() => setRange(null)}>Học mọi câu</button>}
        </p>
      </Glass>
    </section>
  );
}

export function Home() {
  const game = useApp((s) => s.game);
  const badgeCount = useApp((s) => s.badges.length);
  const chapters = useChapterIds();
  const chs = useApp((s) => s.cfg.chs);
  const now = useApp((s) => s.now);
  const last = useApp((s) => s.examHistory[0]);
  const toggleChapter = useApp((s) => s.toggleChapter);
  const wrongCount = useApp((s) => Object.keys(s.wrong).length);
  const starCount = useApp((s) => s.starred.length);
  const counts = useCounts();
  const lv = levelInfo(game.xp);
  const today = dayKey(now);
  const streak = displayStreak(game, today);
  const answered = game.days[today]?.answered ?? 0;
  const total = counts.newLeft + counts.lrDue + counts.due;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <XpRing level={lv.level} pct={(lv.into / lv.need) * 100} />
        <div className="flex-1">
          <p className="text-xs text-mut">Cấp <span className="font-num">{lv.level}</span> · {lv.title}</p>
          <p className="text-lg font-bold"><span className="font-num">{lv.into}</span> / <span className="font-num">{lv.need}</span> XP</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-streak/15 px-2.5 py-1.5 font-bold text-streak" title="Chuỗi ngày học">
          <FireIcon weight="fill" size={18} />
          <span className="font-num">{streak}</span>
        </div>
      </header>

      <OnlineBadge />

      <Glass className="bg-linear-to-br from-violet/30 to-cyan/10 p-4">
        <p className="text-xs uppercase tracking-widest text-violet-soft">Sẵn sàng</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Stat icon={<SparkleIcon weight="duotone" size={24} />} value={counts.newLeft} label="Mới" tone="text-new" />
          <Stat icon={<ArrowCounterClockwiseIcon weight="duotone" size={24} />} value={counts.lrDue} label="Học lại" tone="text-relearn" />
          <Stat icon={<CalendarCheckIcon weight="duotone" size={24} />} value={counts.due} label="Đến hạn" tone="text-ok" />
        </div>
        <NeonButton className="mt-4 w-full" onClick={() => { go('/hoc'); }}>
          <PlayIcon weight="fill" size={18} />
          {total ? 'Bắt đầu học' : 'Mở màn hình học'}
        </NeonButton>
        <p className="mt-2 text-center text-xs text-mut">
          {total ? `Có ${total} thẻ đang chờ` : counts.later < Infinity ? `Thẻ tiếp theo đến hạn lúc ${clock(counts.later, now)}` : 'Chưa có thẻ nào trong các chương đã chọn'}
        </p>
      </Glass>

      <Glass className="p-4">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="inline-flex items-center gap-2"><TargetIcon weight="duotone" size={20} className="text-flag" />Mục tiêu hôm nay</span>
          <span><span className="font-num">{answered}</span> / <span className="font-num">{game.goalTarget}</span></span>
        </div>
        <ProgressBar value={answered} max={game.goalTarget} className="mt-2" />
      </Glass>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Chương đang học</h2>
        <div className="flex flex-wrap gap-2">
          {chapters.map((c) => (
            <Chip key={c} on={chs.includes(c)} onClick={() => toggleChapter(c)}>Chương {roman(c)}</Chip>
          ))}
        </div>
      </section>

      <RangePicker />

      <div className="grid grid-cols-2 gap-3">
        <a href={href('/luyen-tap/sai')}>
          <Glass className="h-full p-3 hover:bg-white/10">
            <WarningCircleIcon weight="duotone" size={28} className="text-bad-soft" />
            <p className="mt-1 font-semibold">Câu sai</p>
            <p className="text-xs text-mut">{wrongCount ? `${wrongCount} câu cần ôn lại` : 'Chưa có câu sai'}</p>
          </Glass>
        </a>
        <a href={href('/luyen-tap/sao')}>
          <Glass className="h-full p-3 hover:bg-white/10">
            <StarIcon weight="duotone" size={28} className="text-flag" />
            <p className="mt-1 font-semibold">Gắn sao</p>
            <p className="text-xs text-mut">{starCount ? `${starCount} câu đã lưu` : 'Chưa gắn sao câu nào'}</p>
          </Glass>
        </a>
        <a href={href('/thi')}>
          <Glass className="h-full p-3 hover:bg-white/10">
            <ExamIcon weight="duotone" size={28} className="text-new" />
            <p className="mt-1 font-semibold">Thi thử</p>
            <p className="text-xs text-mut">{last ? `Lần trước: ${last.score10} điểm` : '50 câu · 60 phút'}</p>
          </Glass>
        </a>
        <a href={href('/ho-so')}>
          <Glass className="h-full p-3 hover:bg-white/10">
            <MedalIcon weight="duotone" size={28} className="text-flag" />
            <p className="mt-1 font-semibold">Huy hiệu</p>
            <p className="text-xs text-mut">{Object.keys(game.badges).length} / {badgeCount} đã mở</p>
          </Glass>
        </a>
      </div>
    </div>
  );
}
