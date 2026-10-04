import { answerXp, comboMultiplier, displayStreak, examXp, freshGame, KEEP_DAYS, levelInfo, recordActivity, titleFor, type GameState } from './gamify';
import { lastNDays } from './time';

const review = (g: GameState, day: string, n: number) => {
  let x = g;
  for (let i = 0; i < n; i++) x = recordActivity(x, day, { reviewed: 1 }).game;
  return x;
};

describe('XP và combo', () => {
  it('hệ số combo', () => {
    expect([1, 4, 5, 9, 10, 30].map(comboMultiplier)).toEqual([1, 1, 1.5, 1.5, 2, 2]);
  });
  it('XP mỗi câu trong phiên học', () => {
    expect(answerXp(true, 1)).toBe(10);
    expect(answerXp(true, 5)).toBe(15);
    expect(answerXp(true, 10)).toBe(20);
    expect(answerXp(false, 0)).toBe(2);
  });
  it('XP thi thử: 5/câu đúng, +100 nếu ≥ 8, +250 nếu 10 (không cộng dồn)', () => {
    expect(examXp(42, 8.4)).toBe(310);
    expect(examXp(50, 10)).toBe(500);
    expect(examXp(30, 6)).toBe(150);
  });
});

describe('cấp độ', () => {
  it('ngưỡng lên cấp = 100 + 50 × (cấp − 1)', () => {
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, need: 100, title: 'Tân binh' });
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100)).toMatchObject({ level: 2, into: 0, need: 150 });
    expect(levelInfo(250)).toMatchObject({ level: 3, into: 0, need: 200 });
  });
  it('danh hiệu', () => {
    expect([1, 4, 5, 9, 10, 14, 15, 19, 20].map(titleFor)).toEqual([
      'Tân binh', 'Tân binh', 'Học viên', 'Học viên', 'Học giả', 'Học giả', 'Chuyên gia', 'Chuyên gia', 'Đại sứ tư tưởng',
    ]);
  });
});

describe('chuỗi ngày', () => {
  it('cần 10 thẻ mới tính là ngày học', () => {
    const g9 = review(freshGame(), '2026-10-01', 9);
    expect(g9.streak.count).toBe(0);
    expect(review(g9, '2026-10-01', 1).streak).toEqual({ count: 1, lastDay: '2026-10-01' });
  });
  it('ngày liên tiếp tăng chuỗi, cùng ngày không tăng thêm, bỏ một ngày thì về 1', () => {
    let g = review(freshGame(), '2026-10-01', 20);
    expect(g.streak.count).toBe(1);
    g = review(g, '2026-10-02', 10);
    expect(g.streak.count).toBe(2);
    g = review(g, '2026-10-04', 10);
    expect(g.streak).toEqual({ count: 1, lastDay: '2026-10-04' });
  });
  it('nộp một bài thi cũng tính là ngày học', () => {
    expect(recordActivity(freshGame(), '2026-10-01', { examsDone: 1, examQuestions: 50 }).game.streak.count).toBe(1);
  });
  it('hiển thị 0 khi đã bỏ lỡ hôm qua', () => {
    const g = review(freshGame(), '2026-10-01', 10);
    expect(displayStreak(g, '2026-10-02')).toBe(1);
    expect(displayStreak(g, '2026-10-03')).toBe(0);
  });
});

describe('mục tiêu ngày', () => {
  it('đạt mục tiêu được +50 XP, mỗi ngày một lần', () => {
    let g: GameState = { ...freshGame(), goalTarget: 10 };
    g = review(g, '2026-10-01', 9);
    expect(g.goalHits).toBe(0);
    const hit = recordActivity(g, '2026-10-01', { reviewed: 1 });
    expect(hit.goalJustHit).toBe(true);
    expect(hit.game).toMatchObject({ xp: 50, goalHits: 1 });
    const again = recordActivity(hit.game, '2026-10-01', { reviewed: 1 });
    expect(again.goalJustHit).toBe(false);
    expect(again.game.xp).toBe(50);
  });
  it('câu làm trong bài thi được tính vào mục tiêu', () => {
    const r = recordActivity(freshGame(), '2026-10-01', { examsDone: 1, examQuestions: 50 });
    expect(r.goalJustHit).toBe(true);
    expect(r.game.days['2026-10-01']).toEqual({ reviewed: 0, answered: 50, examsDone: 1, goalHit: true });
    expect(r.game.examsDone).toBe(1);
  });
  it(`chỉ giữ ${KEEP_DAYS} ngày gần nhất`, () => {
    let g = freshGame();
    for (const d of lastNDays('2026-10-04', 70)) g = recordActivity(g, d, { reviewed: 1 }).game;
    expect(Object.keys(g.days)).toHaveLength(KEEP_DAYS);
    expect(g.days['2026-10-04']).toBeDefined();
  });
});
