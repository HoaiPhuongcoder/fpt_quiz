import type { Cards, ChapterId, Question } from './types';
import { CHAPTERS, ROMAN } from './types';
import { isMature } from './queue';
import type { GameState } from './gamify';

export type BadgeIcon = 'book' | 'crown' | 'fire' | 'lightning' | 'exam' | 'trophy' | 'target' | 'moon' | 'sun';
export type BadgeGroup = 'chapter' | 'streak' | 'combo' | 'exam' | 'goal' | 'fun';
export interface BadgeDef { id: string; name: string; desc: string; icon: BadgeIcon; group: BadgeGroup }
export interface BadgeContext { cards: Cards; questions: Question[]; game: GameState; lastExamScore?: number; hour?: number }
interface BadgeRule extends BadgeDef { test: (ctx: BadgeContext) => boolean }

function mastered(ctx: BadgeContext, chapter?: ChapterId): boolean {
  const qs = chapter ? ctx.questions.filter((q) => q.c === chapter) : ctx.questions;
  return qs.length > 0 && qs.every((q) => isMature(ctx.cards[q.n]));
}

const RULES: BadgeRule[] = [
  ...CHAPTERS.map((c): BadgeRule => ({
    id: `ch${c}`, name: `Thuộc Chương ${ROMAN[c]}`, desc: `Thuộc mọi câu của Chương ${ROMAN[c]} (ôn cách ≥ 1 ngày)`,
    icon: 'book', group: 'chapter', test: (ctx) => mastered(ctx, c),
  })),
  { id: 'all', name: 'Thuộc cả 645 câu', desc: 'Thuộc toàn bộ ngân hàng câu hỏi', icon: 'crown', group: 'chapter', test: (ctx) => mastered(ctx) },
  ...[3, 7, 14, 30].map((d): BadgeRule => ({
    id: `streak${d}`, name: `Chuỗi ${d} ngày`, desc: `Học ${d} ngày liên tiếp`, icon: 'fire', group: 'streak', test: (ctx) => ctx.game.streak.count >= d,
  })),
  ...[10, 25, 50].map((k): BadgeRule => ({
    id: `combo${k}`, name: `Combo ${k}`, desc: `Đúng ${k} câu liên tiếp trong một phiên học`, icon: 'lightning', group: 'combo', test: (ctx) => ctx.game.bestCombo >= k,
  })),
  { id: 'exam8', name: 'Thi từ 8 điểm', desc: 'Một bài thi thử đạt từ 8 điểm', icon: 'exam', group: 'exam', test: (ctx) => (ctx.lastExamScore ?? 0) >= 8 },
  { id: 'exam10', name: 'Điểm 10', desc: 'Một bài thi thử đạt 10 điểm', icon: 'trophy', group: 'exam', test: (ctx) => (ctx.lastExamScore ?? 0) >= 10 },
  { id: 'exam5x', name: 'Chiến binh phòng thi', desc: 'Nộp xong 5 bài thi thử', icon: 'exam', group: 'exam', test: (ctx) => ctx.game.examsDone >= 5 },
  { id: 'goal7', name: 'Kỷ luật thép', desc: 'Đạt mục tiêu ngày 7 lần', icon: 'target', group: 'goal', test: (ctx) => ctx.game.goalHits >= 7 },
  { id: 'night', name: 'Cú đêm', desc: 'Ôn bài trong khoảng 23:00–03:59', icon: 'moon', group: 'fun', test: (ctx) => ctx.hour != null && (ctx.hour >= 23 || ctx.hour <= 3) },
  { id: 'early', name: 'Chim sớm', desc: 'Ôn bài trong khoảng 04:00–05:59', icon: 'sun', group: 'fun', test: (ctx) => ctx.hour != null && ctx.hour >= 4 && ctx.hour <= 5 },
];

export const BADGES: BadgeDef[] = RULES.map((r) => ({ id: r.id, name: r.name, desc: r.desc, icon: r.icon, group: r.group }));

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

export function evaluateBadges(ctx: BadgeContext): string[] {
  return RULES.filter((r) => !(r.id in ctx.game.badges) && r.test(ctx)).map((r) => r.id);
}

export function unlockBadges(g: GameState, ids: string[], now: number): GameState {
  if (!ids.length) return g;
  const badges = { ...g.badges };
  for (const id of ids) badges[id] = now;
  return { ...g, badges };
}
