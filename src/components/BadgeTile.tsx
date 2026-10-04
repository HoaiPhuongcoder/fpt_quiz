import { BookOpenTextIcon, CrownIcon, ExamIcon, FireIcon, LightningIcon, LockSimpleIcon, MoonStarsIcon, SunHorizonIcon, TargetIcon, TrophyIcon, type Icon } from '@phosphor-icons/react';
import type { BadgeDef, BadgeGroup, BadgeIcon } from '../domain/badges';

const ICONS: Record<BadgeIcon, Icon> = {
  book: BookOpenTextIcon, crown: CrownIcon, fire: FireIcon, lightning: LightningIcon, exam: ExamIcon,
  trophy: TrophyIcon, target: TargetIcon, moon: MoonStarsIcon, sun: SunHorizonIcon,
};

const TONE: Record<BadgeGroup, string> = {
  chapter: 'border-violet/50 bg-violet/15 text-violet-soft shadow-[0_0_14px_rgba(139,92,246,.4)]',
  streak: 'border-streak/50 bg-streak/15 text-streak shadow-[0_0_14px_rgba(255,162,92,.35)]',
  combo: 'border-ok/50 bg-ok/10 text-ok shadow-[0_0_14px_rgba(163,230,53,.35)]',
  exam: 'border-new/50 bg-new/10 text-new shadow-[0_0_14px_rgba(103,232,249,.35)]',
  goal: 'border-flag/50 bg-flag/10 text-flag shadow-[0_0_14px_rgba(251,191,36,.35)]',
  fun: 'border-relearn/50 bg-relearn/10 text-relearn shadow-[0_0_14px_rgba(244,114,182,.35)]',
};

export function BadgeTile({ badge, unlockedAt }: { badge: BadgeDef; unlockedAt?: number }) {
  const on = unlockedAt != null;
  const I = ICONS[badge.icon];
  return (
    <div data-testid="badge" data-unlocked={on} title={badge.desc} className="text-center text-[10.5px] leading-tight">
      <div className={`mb-1 grid h-14 place-items-center rounded-2xl border ${on ? TONE[badge.group] : 'border-white/10 bg-white/5 text-dim'}`}>
        {on ? <I weight="duotone" size={30} /> : <LockSimpleIcon weight="duotone" size={24} />}
      </div>
      <span className={on ? '' : 'text-dim'}>{badge.name}</span>
    </div>
  );
}
