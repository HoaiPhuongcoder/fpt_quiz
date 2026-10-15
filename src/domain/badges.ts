import type { Cards, ChapterId } from './types';
import { isMature } from './queue';
import { roman, type Subject } from './subject';
import type { GameState } from './gamify';

export type BadgeIcon = 'book' | 'crown' | 'fire' | 'lightning' | 'exam' | 'trophy' | 'target' | 'moon' | 'sun';
export type BadgeGroup = 'chapter' | 'streak' | 'combo' | 'exam' | 'goal' | 'fun';
export interface BadgeDef { id: string; name: string; desc: string; icon: BadgeIcon; group: BadgeGroup }
/** `subject` là môn đang học: chỉ huy hiệu chương của môn này được xét. */
export interface BadgeContext { cards: Cards; subject: Subject; game: GameState; lastExamScore?: number; hour?: number }
interface BadgeRule extends BadgeDef { test: (ctx: BadgeContext) => boolean }

function mastered(ctx: BadgeContext, chapter?: ChapterId): boolean {
  const qs = chapter ? ctx.subject.questions.filter((q) => q.c === chapter) : ctx.subject.questions;
  return qs.length > 0 && qs.every((q) => isMature(ctx.cards[q.n]));
}

/** HCM202 giữ id cũ (`ch1`, `all`) để không mất huy hiệu đã mở; môn khác thêm tiền tố `${id}:`. */
const badgeId = (s: Subject, id: string) => (s.id === 'hcm202' ? id : `${s.id}:${id}`);

function subjectRules(s: Subject): BadgeRule[] {
  const mine = (ctx: BadgeContext) => ctx.subject.id === s.id;
  return [
    ...s.chapters.map(({ id: c }): BadgeRule => ({
      id: badgeId(s, `ch${c}`), name: `${s.code} · Thuộc Chương ${roman(c)}`, desc: `Thuộc mọi câu Chương ${roman(c)} môn ${s.code} (ôn cách ≥ 1 ngày)`,
      icon: 'book', group: 'chapter', test: (ctx) => mine(ctx) && mastered(ctx, c),
    })),
    {
      id: badgeId(s, 'all'), name: `${s.code} · Thuộc cả ${s.questions.length} câu`, desc: `Thuộc toàn bộ ngân hàng câu hỏi môn ${s.code}`,
      icon: 'crown', group: 'chapter', test: (ctx) => mine(ctx) && mastered(ctx),
    },
  ];
}

const COMMON: BadgeRule[] = [
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

const rules = (subjects: Subject[]): BadgeRule[] => [...subjects.flatMap(subjectRules), ...COMMON];

export function badgeDefs(subjects: Subject[]): BadgeDef[] {
  return rules(subjects).map((r) => ({ id: r.id, name: r.name, desc: r.desc, icon: r.icon, group: r.group }));
}

export function evaluateBadges(ctx: BadgeContext, subjects: Subject[]): string[] {
  return rules(subjects).filter((r) => !(r.id in ctx.game.badges) && r.test(ctx)).map((r) => r.id);
}

export function unlockBadges(g: GameState, ids: string[], now: number): GameState {
  if (!ids.length) return g;
  const badges = { ...g.badges };
  for (const id of ids) badges[id] = now;
  return { ...g, badges };
}
