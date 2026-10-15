import { badgeDefs, evaluateBadges as evalWith, unlockBadges, type BadgeContext } from './badges';
import { freshGame } from './gamify';
import { makeCard, makeQ, makeSubject } from '../../test/fixtures';

const HCM = makeSubject([makeQ(1, 1), makeQ(2, 1), makeQ(3, 2)]);
const MLN = makeSubject([makeQ(1, 1)], { id: 'mln131', code: 'MLN131', storagePrefix: 'quiz.v1.mln131', chapters: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id, title: '' })) });
const SUBJECTS = [HCM, MLN];
const BADGES = badgeDefs(SUBJECTS);
const badgeById = (id: string) => BADGES.find((b) => b.id === id);
const evaluateBadges = (c: BadgeContext) => evalWith(c, SUBJECTS);
const ctx = (over: Partial<BadgeContext> = {}): BadgeContext => ({ cards: {}, subject: HCM, game: freshGame(), ...over });

describe('huy hiệu', () => {
  it('13 huy hiệu chung + huy hiệu chương từng môn, id không trùng', () => {
    expect(BADGES).toHaveLength(13 + 7 + 8);
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    expect(badgeById('ch1')?.name).toBe('HCM202 · Thuộc Chương I');
    expect(badgeById('all')?.name).toBe('HCM202 · Thuộc cả 3 câu');
    expect(badgeById('mln131:ch7')?.name).toBe('MLN131 · Thuộc Chương VII');
    expect(badgeById('mln131:all')).toBeDefined();
  });
  it('chỉ xét huy hiệu chương của môn đang học', () => {
    const cards = { 1: makeCard({ ivl: 1440 }) };
    expect(evaluateBadges(ctx({ cards, subject: MLN }))).toEqual(expect.arrayContaining(['mln131:ch1', 'mln131:all']));
    expect(evaluateBadges(ctx({ cards, subject: MLN }))).not.toContain('ch1');
  });
  it('thuộc chương khi mọi câu của chương là review với khoảng cách ≥ 1 ngày', () => {
    const cards = { 1: makeCard({ ivl: 1440 }), 2: makeCard({ ivl: 2880 }), 3: makeCard({ ivl: 60 }) };
    const ids = evaluateBadges(ctx({ cards }));
    expect(ids).toContain('ch1');
    expect(ids).not.toContain('ch2');
    expect(ids).not.toContain('all');
    expect(evaluateBadges(ctx({ cards: { ...cards, 3: makeCard({ ivl: 1440 }) } }))).toContain('all');
  });
  it('chương không có câu nào thì không mở', () => {
    expect(evaluateBadges(ctx())).not.toContain('ch3');
  });
  it('chuỗi, combo, mục tiêu, số bài thi', () => {
    const game = { ...freshGame(), streak: { count: 7, lastDay: '2026-10-04' }, bestCombo: 25, goalHits: 7, examsDone: 5 };
    expect(evaluateBadges(ctx({ game }))).toEqual(expect.arrayContaining(['streak3', 'streak7', 'combo10', 'combo25', 'goal7', 'exam5x']));
    expect(evaluateBadges(ctx({ game }))).not.toContain('streak14');
  });
  it('điểm thi', () => {
    expect(evaluateBadges(ctx({ lastExamScore: 8 }))).toContain('exam8');
    expect(evaluateBadges(ctx({ lastExamScore: 10 }))).toEqual(expect.arrayContaining(['exam8', 'exam10']));
    expect(evaluateBadges(ctx({ lastExamScore: 7.9 }))).not.toContain('exam8');
  });
  it('cú đêm 23:00–03:59, chim sớm 04:00–05:59', () => {
    expect(evaluateBadges(ctx({ hour: 23 }))).toContain('night');
    expect(evaluateBadges(ctx({ hour: 3 }))).toContain('night');
    expect(evaluateBadges(ctx({ hour: 4 }))).toContain('early');
    expect(evaluateBadges(ctx({ hour: 12 }))).toEqual([]);
  });
  it('huy hiệu đã mở không trả lại; mở khóa ghi thời điểm', () => {
    const game = unlockBadges(freshGame(), ['night'], 123);
    expect(game.badges).toEqual({ night: 123 });
    expect(evaluateBadges(ctx({ game, hour: 23 }))).toEqual([]);
    expect(unlockBadges(game, [], 999)).toBe(game);
  });
});
