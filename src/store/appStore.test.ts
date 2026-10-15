import { createAppStore } from './appStore';
import { createMemoryStorage, makeCard, makeQ, makeSubject } from '../../test/fixtures';
import { DEFAULT_CONFIG } from '../domain/srs';
import { defaultExamConfig } from '../domain/exam';
import { MIN } from '../domain/time';
import type { Snapshot } from '../storage/local';

const T0 = new Date(2026, 9, 4, 10, 0).getTime();
const TODAY = '2026-10-04';

function setup(over: Partial<Snapshot> = {}) {
  let t = T0;
  const storage = createMemoryStorage({ cfg: { ...DEFAULT_CONFIG, order: 'seq' }, ...over }, T0);
  const questions = [makeQ(1), makeQ(2), makeQ(3, 2, { a: ['A', 'B'] })];
  const store = createAppStore({ storage, subjects: [makeSubject(questions)], now: () => t, rand: () => 0 });
  return { store, storage, advance: (ms: number) => { t += ms; }, get s() { return store.getState(); } };
}

/** Chọn đúng mọi đáp án của thẻ hiện tại. */
function answerRight(app: ReturnType<typeof setup>) {
  const q = app.s.byId[app.s.study.cur!];
  for (const k of q.a) app.s.choose(k);
}

describe('phiên học', () => {
  it('nextCard không đổi now', () => {
    const app = setup();
    app.s.startStudy();
    app.advance(5 * MIN);
    app.s.nextCard();
    expect(app.s.now).toBe(T0);
  });
  it('bắt đầu học lấy thẻ mới đầu tiên', () => {
    const app = setup();
    app.s.startStudy();
    expect(app.s.study.cur).toBe(1);
  });
  it('chọn đúng: hiện kết quả, +10 XP, combo 1', () => {
    const app = setup();
    app.s.startStudy();
    app.s.choose('A');
    expect(app.s.study).toMatchObject({ shown: true, correct: true, combo: 1, lastXp: 10, xp: 10 });
    expect(app.s.game.xp).toBe(10);
  });
  it('chọn sai: +2 XP, combo về 0', () => {
    const app = setup();
    app.s.startStudy();
    app.s.choose('B');
    expect(app.s.study).toMatchObject({ shown: true, correct: false, combo: 0 });
    expect(app.s.game.xp).toBe(2);
  });
  it('câu nhiều đáp án: chọn đúng một ý chưa hiện kết quả', () => {
    const app = setup({ cfg: { ...DEFAULT_CONFIG, order: 'seq', chs: [2] } });
    app.s.startStudy();
    expect(app.s.study.cur).toBe(3);
    app.s.choose('A');
    expect(app.s.study.shown).toBe(false);
    app.s.choose('B');
    expect(app.s.study).toMatchObject({ shown: true, correct: true });
  });
  it('chấm điểm: lưu thẻ, đếm thẻ mới trong ngày, sang thẻ kế, ghi xuống storage', () => {
    const app = setup();
    app.s.startStudy();
    app.s.choose('A');
    app.s.rate(3);
    expect(app.s.cards[1]).toMatchObject({ st: 'learn', step: 1 });
    expect(app.s.day).toMatchObject({ newSeen: 1, done: 1, ok: 1 });
    expect(app.s.study.cur).toBe(2);
    expect(app.s.game.days[TODAY].reviewed).toBe(1);
    expect(app.storage.saved.cards?.[1]).toBeDefined();
    expect(app.s.toasts.at(-1)?.text).toBe('Câu 1 · Được → gặp lại sau 10 phút');
  });
  it('chấm 10 thẻ đúng liên tiếp: chuỗi 1 ngày và mở huy hiệu combo10', () => {
    const app = setup();
    app.s.startStudy();
    for (let i = 0; i < 10; i++) {
      answerRight(app);
      app.s.rate(1);
    }
    expect(app.s.game.streak).toEqual({ count: 1, lastDay: TODAY });
    expect(app.s.game.bestCombo).toBe(10);
    expect(app.s.game.badges.combo10).toBe(T0);
  });
  it('không bỏ được chương cuối cùng', () => {
    const app = setup({ cfg: { ...DEFAULT_CONFIG, chs: [1] } });
    app.s.toggleChapter(1);
    expect(app.s.cfg.chs).toEqual([1]);
  });
  it('sang ngày mới thì đặt lại số đếm trong ngày', () => {
    const app = setup({ day: { d: TODAY, newSeen: 30, done: 40, ok: 20 } });
    app.advance(86_400_000);
    app.s.tick();
    expect(app.s.day).toEqual({ d: '2026-10-05', newSeen: 0, done: 0, ok: 0 });
  });
});

describe('thi thử', () => {
  const cfg = { ...defaultExamConfig([1, 2, 3, 4, 5, 6]), count: 3, shuffleOptions: false };
  it('nộp bài: lưu lịch sử, cộng XP, câu sai vào học lại', () => {
    const app = setup();
    app.s.startExam(cfg);
    const ex = app.s.examCurrent!;
    app.s.examGo(ex.items.findIndex((it) => it.n === 1));
    app.s.examSelect('A');
    const r = app.s.submitExam()!;
    expect(r).toMatchObject({ correct: 1, total: 3, score10: 3.3, xp: 5, answeredCount: 1 });
    expect(app.s.examHistory[0].id).toBe(r.id);
    expect(app.s.examCurrent).toBeNull();
    expect(app.s.cards[1]).toBeUndefined();
    expect(app.s.cards[2]).toMatchObject({ st: 'learn', due: T0 });
    expect(app.s.cards[3]).toMatchObject({ st: 'learn', due: T0 });
    expect(app.s.game).toMatchObject({ xp: 5, examsDone: 1 });
    expect(app.s.game.days[TODAY].answered).toBe(1);
  });
  it('không tạo đề mới khi đang có bài làm dở', () => {
    const app = setup();
    app.s.startExam(cfg);
    app.s.examSelect('A');
    const before = app.s.examCurrent;
    app.s.startExam(cfg);
    expect(app.s.examCurrent).toBe(before);
    expect(app.s.examCurrent!.id).toBe(before!.id);
  });
  it('hết giờ thì checkExamExpiry tự nộp', () => {
    const app = setup();
    app.s.startExam({ ...cfg, minutes: 5 });
    expect(app.s.checkExamExpiry()).toBeNull();
    app.advance(5 * MIN);
    expect(app.s.checkExamExpiry()?.total).toBe(3);
    expect(app.s.examCurrent).toBeNull();
  });
});

describe('cài đặt và dữ liệu', () => {
  it('nhập tiến độ từ QUIZ.html', () => {
    const app = setup();
    const r = app.s.importJson(JSON.stringify({ v: 2, cards: { 1: makeCard() } }));
    expect(r).toEqual({ ok: true, message: 'Đã nhập tiến độ từ bản cũ (QUIZ.html).' });
    expect(app.s.cards[1]).toEqual(makeCard());
  });
  it('mục tiêu ngày bị giới hạn trong 10–500', () => {
    const app = setup();
    app.s.setGoalTarget(3);
    expect(app.s.game.goalTarget).toBe(10);
    app.s.setGoalTarget(9999);
    expect(app.s.game.goalTarget).toBe(500);
  });
  it('áp dụng chế độ Anki mặc định', () => {
    const app = setup();
    app.s.applyPreset('normal');
    expect(app.s.cfg).toMatchObject({ preset: 'normal', steps: [1, 10], grad: 1440 });
  });
});

describe('nhiều môn', () => {
  const MLN = makeSubject([makeQ(1, 7, { q: 'Câu MLN 1' }), makeQ(2, 7)], {
    id: 'mln131', code: 'MLN131', storagePrefix: 'quiz.v1.mln131', chapters: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id, title: '' })),
  });
  function setup2(initialSubject?: string) {
    const storage = createMemoryStorage({}, T0, { 'hcm.v1': { cards: { 1: makeCard() } } });
    const store = createAppStore({ storage, subjects: [makeSubject([makeQ(1), makeQ(2)]), MLN], initialSubject, now: () => T0, rand: () => 0 });
    return { store, storage, get s() { return store.getState(); } };
  }

  it('bắt đầu ở môn đầu tiên, hoặc môn đã chọn lần trước', () => {
    expect(setup2().s.subject.id).toBe('hcm202');
    expect(setup2('mln131').s.subject.id).toBe('mln131');
    const storage = createMemoryStorage();
    storage.saveActive('mln131');
    expect(createAppStore({ storage, subjects: [makeSubject([]), MLN] }).getState().subject.id).toBe('mln131');
  });
  it('đổi môn: câu hỏi, thẻ, chương theo môn mới; XP giữ nguyên; nhớ môn đã chọn', () => {
    const app = setup2();
    app.s.startStudy();
    app.s.choose('A');
    const xp = app.s.game.xp;
    app.s.switchSubject('mln131');
    expect(app.s.questions[0].q).toBe('Câu MLN 1');
    expect(app.s.cards).toEqual({});
    expect(app.s.cfg.chs).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(app.s.study.cur).toBeNull();
    expect(app.s.game.xp).toBe(xp);
    expect(app.storage.active).toBe('mln131');
    expect(app.storage.savedBy['quiz.v1.mln131']).toBeUndefined();
  });
  it('chấm thẻ sau khi đổi môn ghi vào môn mới; đổi lại thấy thẻ cũ', () => {
    const app = setup2();
    app.s.switchSubject('mln131');
    app.s.startStudy();
    app.s.choose('A');
    app.s.rate(3);
    expect(Object.keys(app.storage.savedBy['quiz.v1.mln131'].cards!)).toEqual(['1']);
    expect(app.storage.savedBy['hcm.v1']?.cards).toBeUndefined();
    app.s.switchSubject('hcm202');
    expect(app.s.cards[1]).toEqual(makeCard());
  });
  it('mã môn lạ hoặc trùng môn hiện tại thì không làm gì', () => {
    const app = setup2();
    const before = app.s;
    app.s.switchSubject('xyz');
    app.s.switchSubject('hcm202');
    expect(app.s).toBe(before);
  });
  it('xóa tiến độ môn này giữ XP', () => {
    const app = setup2();
    app.s.startStudy();
    app.s.choose('A');
    app.s.resetSubject();
    expect(app.s.cards).toEqual({});
    expect(app.s.game.xp).toBeGreaterThan(0);
  });
  it('xuất gồm mọi môn; nhập v4 cập nhật môn đang mở và lưu môn khác', () => {
    const app = setup2();
    const out = JSON.parse(app.s.exportJson());
    expect(Object.keys(out.subjects)).toEqual(['hcm202', 'mln131']);
    expect(Object.keys(out.subjects.hcm202.cards)).toEqual(['1']);
    out.subjects.mln131.cards = { 2: makeCard() };
    out.subjects.hcm202.cards = {};
    out.game.xp = 77;
    expect(app.s.importJson(JSON.stringify(out)).ok).toBe(true);
    expect(app.s.cards).toEqual({});
    expect(app.s.game.xp).toBe(77);
    app.s.switchSubject('mln131');
    expect(Object.keys(app.s.cards)).toEqual(['2']);
  });
});
