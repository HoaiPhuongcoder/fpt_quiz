import { useMemo } from 'react';
import { FireIcon, GearSixIcon } from '@phosphor-icons/react';
import { useApp } from '../store/appStore';
import { Glass, ProgressBar, XpRing } from '../components/ui';
import { BadgeTile } from '../components/BadgeTile';
import { BADGES } from '../domain/badges';
import { displayStreak, isStudyDay, levelInfo } from '../domain/gamify';
import { isMature } from '../domain/queue';
import { dayKey, lastNDays } from '../domain/time';

function weekday(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('vi-VN', { weekday: 'short' });
}

export function Profile() {
  const game = useApp((s) => s.game);
  const cards = useApp((s) => s.cards);
  const questions = useApp((s) => s.questions);
  const now = useApp((s) => s.now);
  const last = useApp((s) => s.examHistory[0]);
  const lv = levelInfo(game.xp);
  const today = dayKey(now);
  const mature = useMemo(() => questions.filter((q) => isMature(cards[q.n])).length, [questions, cards]);
  const reps = useMemo(() => Object.values(cards).reduce((s, c) => s + (c.reps ?? 0), 0), [cards]);
  const stats: [string, string][] = [
    ['Đã thuộc', `${mature}/${questions.length}`],
    ['Tổng lượt ôn', String(reps)],
    ['Bài thi đã nộp', String(game.examsDone)],
    ['Lần thi gần nhất', last ? `${last.score10} điểm` : '–'],
    ['Combo cao nhất', `×${game.bestCombo}`],
    ['Đạt mục tiêu', `${game.goalHits} lần`],
  ];

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <XpRing level={lv.level} pct={(lv.into / lv.need) * 100} size={68} />
        <div className="flex-1">
          <h1 className="text-xl font-bold">{lv.title}</h1>
          <p className="text-sm text-mut"><span className="font-num">{lv.into}</span> / <span className="font-num">{lv.need}</span> XP · tới Cấp {lv.level + 1}</p>
        </div>
        <a href="#/cai-dat" aria-label="Cài đặt" className="grid size-11 place-items-center rounded-xl text-mut hover:bg-white/10">
          <GearSixIcon size={24} />
        </a>
      </header>
      <ProgressBar value={lv.into} max={lv.need} />

      <Glass className="p-4">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span className="inline-flex items-center gap-2"><FireIcon weight="duotone" size={20} className="text-streak" />Chuỗi ngày học</span>
          <span className="text-streak"><span className="font-num">{displayStreak(game, today)}</span> ngày</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
          {lastNDays(today, 7).map((k) => {
            const on = isStudyDay(game.days[k]);
            const isToday = k === today;
            return (
              <div key={k}>
                <div className={`grid h-8 place-items-center rounded-lg ${on ? 'bg-streak/25 text-streak' : isToday ? 'border border-dashed border-white/25' : 'bg-white/5'}`}>
                  {on && <FireIcon weight="fill" size={16} />}
                </div>
                <span className={isToday ? 'text-violet-soft' : 'text-mut'}>{weekday(k)}</span>
              </div>
            );
          })}
        </div>
      </Glass>

      <section>
        <div className="mb-2 flex justify-between text-sm font-semibold">
          <h2>Huy hiệu</h2>
          <span className="text-mut"><span className="font-num">{Object.keys(game.badges).length}</span> / <span className="font-num">{BADGES.length}</span></span>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {BADGES.map((b) => <BadgeTile key={b.id} badge={b} unlockedAt={game.badges[b.id]} />)}
        </div>
      </section>

      <Glass className="grid grid-cols-2 gap-3 p-4 text-sm">
        {stats.map(([l, v]) => (
          <div key={l}>
            <span className="block text-xs text-mut">{l}</span>
            <b className="font-num">{v}</b>
          </div>
        ))}
      </Glass>
    </div>
  );
}
