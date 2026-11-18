import { createStore, type StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { ChapterId, PresetId, QRange, Question, Rating, SrsConfig } from '../domain/types';
import { presetParams, schedule } from '../domain/srs';
import { pickNext, poolFor } from '../domain/queue';
import { dayKey, fmt } from '../domain/time';
import { answerXp, examXp, recordActivity, type GameState } from '../domain/gamify';
import { badgeDefs, evaluateBadges, unlockBadges, type BadgeDef } from '../domain/badges';
import { applyExamToCards, createExam, goTo, gradeExam, isExpired, selectOption, shuffle, toggleFlag, type ExamConfig, type ExamResult } from '../domain/exam';
import { addWrong, newDrill, normalizeRange, pickOption, removeWrong, type DrillKind, type DrillSession } from '../domain/practice';
import type { Rng } from '../domain/random';
import { SNAPSHOT_KEYS, type AppStorage, type Snapshot } from '../storage/local';
import { exportAll, parseImport, type SubjectData } from '../storage/io';
import type { Subject } from '../domain/subject';

export const RATING_NAMES = ['', 'Lại', 'Khó', 'Được', 'Dễ'] as const;
export const EXAM_HISTORY_LIMIT = 30;

export interface StudySession {
  cur: number | null; picked: string[]; shown: boolean; correct: boolean; ahead: boolean;
  combo: number; answered: number; correctCount: number; xp: number; bestCombo: number; startedAt: number; lastXp: number | null;
}
export interface Toast { id: number; text: string; kind: 'info' | 'xp' | 'badge' | 'error' }

export interface AppState extends Snapshot {
  subject: Subject;
  subjects: Subject[];
  badges: BadgeDef[];
  questions: Question[];
  byId: Record<number, Question>;
  now: number;
  study: StudySession;
  drill: DrillSession | null;
  toasts: Toast[];
  tick(): void;
  switchSubject(id: string): void;
  toggleChapter(c: ChapterId): void;
  /** Đặt khoảng câu cho phiên học; null = mọi câu. */
  setRange(r: QRange | null): void;
  toggleStar(n: number): void;
  /** Bỏ một câu (hoặc tất cả) khỏi danh sách câu sai. */
  forgetWrong(n?: number): void;
  /** Bắt đầu lượt luyện với các câu `ns`; trộn hoặc theo số câu tăng dần. */
  startDrill(kind: DrillKind, ns: number[], shuffled: boolean): void;
  drillChoose(key: string): void;
  drillNext(): void;
  endDrill(): void;
  startStudy(): void;
  nextCard(): void;
  choose(key: string): void;
  rate(r: Rating): void;
  learnMoreNew(): void;
  studyAhead(): void;
  startExam(cfg: ExamConfig): void;
  examSelect(key: string): void;
  examGo(index: number): void;
  examToggleFlag(): void;
  submitExam(): ExamResult | null;
  checkExamExpiry(): ExamResult | null;
  abandonExam(): void;
  resetCard(n: number): void;
  makeDueNow(n: number): void;
  updateCfg(patch: Partial<SrsConfig>): void;
  applyPreset(id: PresetId): void;
  setGoalTarget(n: number): void;
  exportJson(): string;
  importJson(text: string): { ok: boolean; message: string };
  resetSubject(): void;
  pushToast(text: string, kind?: Toast['kind']): void;
  dismissToast(id: number): void;
}

/** Môn ban đầu: `initialSubject` → môn đã chọn lần trước → môn đầu tiên. */
export interface AppDeps { storage: AppStorage; subjects: Subject[]; initialSubject?: string; now?: () => number; rand?: Rng }

const emptySession = (now: number): StudySession => ({
  cur: null, picked: [], shown: false, correct: false, ahead: false,
  combo: 0, answered: 0, correctCount: 0, xp: 0, bestCombo: 0, startedAt: now, lastXp: null,
});

let toastSeq = 0;

export function createAppStore(deps: AppDeps): StoreApi<AppState> {
  const now = deps.now ?? Date.now;
  const rand = deps.rand ?? Math.random;
  const t0 = now();
  const { subjects, storage } = deps;
  const find = (id: string | null | undefined) => subjects.find((x) => x.id === id);
  const first = find(deps.initialSubject) ?? find(storage.loadActive()) ?? subjects[0];
  const snap = storage.load(first);
  const badges = badgeDefs(subjects);
  const byIdOf = (sub: Subject) => Object.fromEntries(sub.questions.map((q) => [q.n, q])) as Record<number, Question>;
  const dataOf = (st: Pick<AppState, 'cards' | 'cfg' | 'examHistory' | 'starred' | 'wrong'>): SubjectData =>
    ({ cards: st.cards, cfg: st.cfg, examHistory: st.examHistory, starred: st.starred, wrong: st.wrong });
  const rangeBounds = (qs: Question[]): [number, number] => [Math.min(...qs.map((q) => q.n)), Math.max(...qs.map((q) => q.n))];

  const store = createStore<AppState>()((set, get) => {
    const toast = (text: string, kind: Toast['kind'] = 'info') =>
      set((s) => ({ toasts: [...s.toasts, { id: ++toastSeq, text, kind }].slice(-4) }));

    /** Thông báo mục tiêu ngày, kiểm tra và mở huy hiệu mới. */
    const settle = (game: GameState, goalJustHit: boolean, cards: AppState['cards'], extra: { lastExamScore?: number; hour?: number }, t: number) => {
      if (goalJustHit) toast('Đạt mục tiêu hôm nay! +50 XP', 'xp');
      const ids = evaluateBadges({ cards, subject: get().subject, game, ...extra }, subjects);
      for (const id of ids) toast(`Mở khóa huy hiệu: ${badges.find((b) => b.id === id)?.name ?? id}`, 'badge');
      return { game: unlockBadges(game, ids, t), ids };
    };

    return {
      ...snap,
      subject: first,
      subjects,
      badges,
      questions: first.questions,
      byId: byIdOf(first),
      now: t0,
      study: emptySession(t0),
      drill: null,
      toasts: [],

      tick() {
        const t = now();
        const k = dayKey(t);
        set(get().day.d !== k ? { now: t, day: { d: k, newSeen: 0, done: 0, ok: 0 } } : { now: t });
      },

      switchSubject(id) {
        const next = find(id);
        if (!next || next.id === get().subject.id) return;
        const { cards, cfg, day, examCurrent, examHistory, starred, wrong } = storage.load(next);
        const t = now();
        set({ subject: next, questions: next.questions, byId: byIdOf(next), cards, cfg, day, examCurrent, examHistory, starred, wrong, now: t, study: emptySession(t), drill: null });
        storage.saveActive(next.id);
      },

      toggleChapter(c) {
        const chs = get().cfg.chs;
        const next = chs.includes(c) ? chs.filter((x) => x !== c) : [...chs, c].sort((a, b) => a - b);
        if (next.length) set({ cfg: { ...get().cfg, chs: next } });
      },

      setRange(r) {
        const [lo, hi] = rangeBounds(get().questions);
        set({ cfg: { ...get().cfg, range: r && normalizeRange(r, lo, hi) } });
      },

      toggleStar(n) {
        const st = get().starred;
        set({ starred: st.includes(n) ? st.filter((x) => x !== n) : [...st, n] });
      },

      forgetWrong(n) {
        set({ wrong: n == null ? {} : removeWrong(get().wrong, n) });
      },

      startDrill(kind, ns, shuffled) {
        const ids = [...new Set(ns)].filter((n) => get().byId[n]);
        if (!ids.length) return;
        set({ drill: newDrill(kind, shuffled ? shuffle(ids, rand) : ids.sort((a, b) => a - b)) });
      },

      drillChoose(key) {
        const s = get();
        const d = s.drill;
        if (!d || d.shown || d.i >= d.queue.length || d.picked.includes(key)) return;
        const n = d.queue[d.i];
        const r = pickOption(s.byId[n], d.picked, key);
        if (!r.done) { set({ drill: { ...d, picked: r.picked } }); return; }
        const t = now();
        const combo = r.correct ? d.combo + 1 : 0;
        const xp = answerXp(r.correct, combo);
        // Làm đúng khi luyện câu sai thì gỡ khỏi danh sách; làm sai ở đâu cũng ghi vào.
        const wrong = !r.correct ? addWrong(s.wrong, [n]) : d.kind === 'wrong' ? removeWrong(s.wrong, n) : s.wrong;
        const act = recordActivity({ ...s.game, xp: s.game.xp + xp, bestCombo: Math.max(s.game.bestCombo, combo) }, dayKey(t), { reviewed: 1 });
        const { game } = settle(act.game, act.goalJustHit, s.cards, { hour: new Date(t).getHours() }, t);
        set({
          wrong, game, now: t,
          drill: {
            ...d, picked: r.picked, shown: true, correct: r.correct, combo, xp: d.xp + xp,
            right: r.correct ? [...d.right, n] : d.right, missed: r.correct ? d.missed : [...d.missed, n],
          },
        });
      },

      drillNext() {
        const d = get().drill;
        if (d && d.shown) set({ drill: { ...d, i: d.i + 1, picked: [], shown: false, correct: false } });
      },

      endDrill() {
        set({ drill: null });
      },

      startStudy() {
        set({ study: emptySession(now()) });
        get().nextCard();
      },

      nextCard() {
        const s = get();
        const t = now();
        const n = pickNext(poolFor(s.questions, s.cfg.chs, s.cfg.range), s.cards, t, {
          newPerDay: s.cfg.newPerDay, newSeen: s.day.newSeen, order: s.cfg.order, ahead: s.study.ahead, rand,
        });
        set({ study: { ...s.study, cur: n, picked: [], shown: false, correct: false, lastXp: null } });
      },

      choose(key) {
        const s = get();
        const st = s.study;
        if (st.cur == null || st.shown || st.picked.includes(key)) return;
        const { picked, done, correct } = pickOption(s.byId[st.cur], st.picked, key);
        if (!done) {
          set({ study: { ...st, picked } });
          return;
        }
        const combo = correct ? st.combo + 1 : 0;
        const xp = answerXp(correct, combo);
        set({
          study: {
            ...st, picked, shown: true, correct, combo, answered: st.answered + 1,
            correctCount: st.correctCount + (correct ? 1 : 0), xp: st.xp + xp, bestCombo: Math.max(st.bestCombo, combo), lastXp: xp,
          },
          game: { ...s.game, xp: s.game.xp + xp, bestCombo: Math.max(s.game.bestCombo, combo) },
          ...(correct ? {} : { wrong: addWrong(s.wrong, [st.cur]) }),
        });
      },

      rate(r) {
        const s = get();
        const st = s.study;
        if (st.cur == null || !st.shown) return;
        const t = now();
        const n = st.cur;
        const card = s.cards[n] ?? { st: 'new' as const };
        const [nc, ivl] = schedule(card, r, s.cfg, t);
        const cards = { ...s.cards, [n]: nc };
        const day = { ...s.day, newSeen: s.day.newSeen + (card.st === 'new' ? 1 : 0), done: s.day.done + 1, ok: s.day.ok + (st.correct ? 1 : 0) };
        const act = recordActivity(s.game, dayKey(t), { reviewed: 1 });
        const { game } = settle(act.game, act.goalJustHit, cards, { hour: new Date(t).getHours() }, t);
        set({ cards, day, game, now: t, study: { ...st, cur: null, picked: [], shown: false, correct: false, lastXp: null } });
        toast(`Câu ${n} · ${RATING_NAMES[r]} → gặp lại sau ${fmt(ivl)}`);
        get().nextCard();
      },

      learnMoreNew() {
        set({ day: { ...get().day, newSeen: Math.max(0, get().day.newSeen - 20) } });
        get().nextCard();
      },

      studyAhead() {
        set({ study: { ...get().study, ahead: true } });
        get().nextCard();
      },

      startExam(cfg) {
        if (get().examCurrent) return;
        const t = now();
        set({ now: t, examCurrent: createExam(get().questions, cfg, t, rand) });
      },

      examSelect(key) {
        const s = get();
        const ex = s.examCurrent;
        if (ex) set({ examCurrent: selectOption(ex, s.byId[ex.items[ex.current].n], key) });
      },

      examGo(index) {
        const ex = get().examCurrent;
        if (ex) set({ examCurrent: goTo(ex, index) });
      },

      examToggleFlag() {
        const ex = get().examCurrent;
        if (ex) set({ examCurrent: toggleFlag(ex) });
      },

      submitExam() {
        const s = get();
        const ex = s.examCurrent;
        if (!ex) return null;
        const t = now();
        const graded = gradeExam(ex, s.byId, t);
        const cards = applyExamToCards(s.cards, graded.wrong, s.cfg, t);
        const xp = examXp(graded.correct, graded.score10);
        const act = recordActivity({ ...s.game, xp: s.game.xp + xp }, dayKey(t), { examsDone: 1, examQuestions: graded.answeredCount });
        const { game, ids } = settle(act.game, act.goalJustHit, cards, { lastExamScore: graded.score10 }, t);
        const result: ExamResult = { ...graded, xp, newBadges: ids };
        set({ cards, game, now: t, examCurrent: null, examHistory: [result, ...s.examHistory].slice(0, EXAM_HISTORY_LIMIT), wrong: addWrong(s.wrong, graded.wrong) });
        toast(`Nộp bài: ${result.score10} điểm · +${xp} XP`, 'xp');
        return result;
      },

      checkExamExpiry() {
        const ex = get().examCurrent;
        return ex && isExpired(ex, now()) ? get().submitExam() : null;
      },

      abandonExam() {
        set({ examCurrent: null });
      },

      resetCard(n) {
        const cards = { ...get().cards };
        delete cards[n];
        set({ cards });
        toast(`Câu ${n} trở về thẻ mới`);
      },

      makeDueNow(n) {
        const c = get().cards[n];
        if (!c) return;
        set({ cards: { ...get().cards, [n]: { ...c, due: now() } } });
        toast(`Câu ${n} đã đặt đến hạn ngay`);
      },

      updateCfg(patch) {
        set({ cfg: { ...get().cfg, ...patch } });
      },

      applyPreset(id) {
        set({ cfg: { ...get().cfg, ...presetParams(id), preset: id } });
      },

      setGoalTarget(n) {
        const v = Math.max(10, Math.min(500, Math.round(Number.isFinite(n) ? n : 50)));
        set({ game: { ...get().game, goalTarget: v } });
      },

      exportJson() {
        const s = get();
        const all = Object.fromEntries(subjects.map((sub) => [sub.id, dataOf(sub.id === s.subject.id ? s : storage.load(sub))]));
        return exportAll(s.game, all);
      },

      importJson(text) {
        const s = get();
        const r = parseImport(text, (id) => (id === s.subject.id ? s.cfg : storage.load(find(id)!).cfg), subjects.map((x) => x.id));
        if (!r.ok) return { ok: false, message: r.error };
        for (const [id, data] of Object.entries(r.subjects)) {
          if (id !== s.subject.id) storage.save(find(id)!, data);
        }
        const mine = r.subjects[s.subject.id];
        set({ ...(r.game ? { game: r.game } : {}), ...(mine ?? {}) });
        return { ok: true, message: r.legacy ? 'Đã nhập tiến độ từ bản cũ (QUIZ.html).' : 'Đã nhập tiến độ.' };
      },

      resetSubject() {
        const t = now();
        set({ cards: {}, examCurrent: null, examHistory: [], starred: [], wrong: {}, day: { d: dayKey(t), newSeen: 0, done: 0, ok: 0 }, study: emptySession(t), drill: null });
      },

      pushToast: toast,

      dismissToast(id) {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      },
    };
  });

  // Ghi xuống storage mọi phần dữ liệu vừa đổi tham chiếu.
  // Lần đổi môn chỉ nạp dữ liệu, không ghi lại.
  store.subscribe((s, prev) => {
    if (s.subject !== prev.subject) return;
    const patch: Partial<Record<keyof Snapshot, unknown>> = {};
    let changed = false;
    for (const k of SNAPSHOT_KEYS) {
      if (s[k] !== prev[k]) { patch[k] = s[k]; changed = true; }
    }
    if (changed) storage.save(s.subject, patch as Partial<Snapshot>);
  });

  return store;
}

let current: StoreApi<AppState> | null = null;
export function setAppStore(store: StoreApi<AppState>) { current = store; }
export function getAppStore(): StoreApi<AppState> {
  if (!current) throw new Error('App store chưa được khởi tạo');
  return current;
}
export function useApp<T>(selector: (s: AppState) => T): T {
  return useStore(getAppStore(), selector);
}
