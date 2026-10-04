import {
  ArrowCounterClockwiseIcon, CalendarCheckIcon, ExamIcon, FireIcon, MedalIcon, PlayIcon, SparkleIcon, TargetIcon,
} from '@phosphor-icons/react';
import { useApp } from '../store/appStore';
import { useCounts } from '../store/hooks';
import { Chip, Glass, NeonButton, ProgressBar, Stat, XpRing } from '../components/ui';
import { displayStreak, levelInfo } from '../domain/gamify';
import { BADGES } from '../domain/badges';
import { clock, dayKey } from '../domain/time';
import { CHAPTERS, ROMAN } from '../domain/types';

export function Home() {
  const game = useApp((s) => s.game);
  const chs = useApp((s) => s.cfg.chs);
  const now = useApp((s) => s.now);
  const last = useApp((s) => s.examHistory[0]);
  const toggleChapter = useApp((s) => s.toggleChapter);
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

      <Glass className="bg-linear-to-br from-violet/30 to-cyan/10 p-4">
        <p className="text-xs uppercase tracking-widest text-violet-soft">Sẵn sàng</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Stat icon={<SparkleIcon weight="duotone" size={24} />} value={counts.newLeft} label="Mới" tone="text-new" />
          <Stat icon={<ArrowCounterClockwiseIcon weight="duotone" size={24} />} value={counts.lrDue} label="Học lại" tone="text-relearn" />
          <Stat icon={<CalendarCheckIcon weight="duotone" size={24} />} value={counts.due} label="Đến hạn" tone="text-ok" />
        </div>
        <NeonButton className="mt-4 w-full" onClick={() => { location.hash = '#/hoc'; }}>
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
          {CHAPTERS.map((c) => (
            <Chip key={c} on={chs.includes(c)} onClick={() => toggleChapter(c)}>Chương {ROMAN[c]}</Chip>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <a href="#/thi">
          <Glass className="h-full p-3 hover:bg-white/10">
            <ExamIcon weight="duotone" size={28} className="text-new" />
            <p className="mt-1 font-semibold">Thi thử</p>
            <p className="text-xs text-mut">{last ? `Lần trước: ${last.score10} điểm` : '50 câu · 60 phút'}</p>
          </Glass>
        </a>
        <a href="#/ho-so">
          <Glass className="h-full p-3 hover:bg-white/10">
            <MedalIcon weight="duotone" size={28} className="text-flag" />
            <p className="mt-1 font-semibold">Huy hiệu</p>
            <p className="text-xs text-mut">{Object.keys(game.badges).length} / {BADGES.length} đã mở</p>
          </Glass>
        </a>
      </div>
    </div>
  );
}
