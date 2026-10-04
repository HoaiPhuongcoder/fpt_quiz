import { FireIcon, LightningIcon, TargetIcon } from '@phosphor-icons/react';
import { useApp } from '../../store/appStore';
import { useCounts } from '../../store/hooks';
import { Glass, NeonButton, ProgressBar } from '../../components/ui';
import { displayStreak } from '../../domain/gamify';
import { MIN, clock, dayKey, fmt } from '../../domain/time';

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Glass className="p-3">
      <span className="block text-xs text-mut">{label}</span>
      <b className={`font-num text-2xl ${tone}`}>{value}</b>
    </Glass>
  );
}

export function SessionSummary() {
  const study = useApp((s) => s.study);
  const game = useApp((s) => s.game);
  const now = useApp((s) => s.now);
  const hasCards = useApp((s) => Object.keys(s.cards).length > 0);
  const learnMoreNew = useApp((s) => s.learnMoreNew);
  const studyAhead = useApp((s) => s.studyAhead);
  const counts = useCounts();
  const today = dayKey(now);
  const answered = game.days[today]?.answered ?? 0;
  const minutes = Math.max(1, Math.round((now - study.startedAt) / MIN));
  const accuracy = study.answered ? Math.round((study.correctCount / study.answered) * 100) : 0;

  return (
    <div className="space-y-4 py-4 text-center">
      <LightningIcon weight="duotone" size={52} className="mx-auto text-violet-soft" />
      <h2 className="text-2xl font-bold">{study.answered ? 'Xong phiên học!' : 'Chưa có thẻ nào đến hạn'}</h2>
      <p className="text-sm text-mut">
        {counts.later < Infinity
          ? `Thẻ tiếp theo đến hạn sau ${fmt((counts.later - now) / MIN)} (lúc ${clock(counts.later, now)}). Cứ để màn hình này mở, thẻ sẽ tự hiện khi đến giờ.`
          : 'Chưa có thẻ nào được lên lịch.'}
      </p>
      {study.answered > 0 && (
        <div className="grid grid-cols-2 gap-2 text-left">
          <SummaryStat label="XP nhận" value={`+${study.xp}`} tone="text-ok" />
          <SummaryStat label="Chính xác" value={`${accuracy}%`} tone="text-new" />
          <SummaryStat label="Combo cao nhất" value={`×${study.bestCombo}`} tone="text-relearn" />
          <SummaryStat label="Thời gian" value={`${minutes}p`} tone="text-ink" />
        </div>
      )}
      <Glass className="space-y-2 p-4 text-left">
        <div className="flex justify-between text-sm font-semibold">
          <span className="inline-flex items-center gap-2"><TargetIcon weight="duotone" size={20} className="text-flag" />Mục tiêu ngày</span>
          <span><span className="font-num">{answered}</span> / <span className="font-num">{game.goalTarget}</span></span>
        </div>
        <ProgressBar value={answered} max={game.goalTarget} />
        <p className="inline-flex items-center gap-2 text-sm">
          <FireIcon weight="fill" size={18} className="text-streak" />
          Chuỗi <b className="font-num text-streak">{displayStreak(game, today)}</b> ngày
        </p>
      </Glass>
      <div className="grid gap-2">
        {counts.nw > 0 && counts.newLeft === 0 && <NeonButton onClick={learnMoreNew}>Học thêm 20 thẻ mới</NeonButton>}
        {hasCards && <NeonButton variant="ghost" onClick={studyAhead}>Học trước thẻ sắp đến hạn</NeonButton>}
        <NeonButton variant="ghost" onClick={() => location.replace('#/')}>Về trang chủ</NeonButton>
      </div>
    </div>
  );
}
