import { createStore, type StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { ChapterId, PresetId, Question, Rating, SrsConfig } from '../domain/types';
import { presetParams, schedule } from '../domain/srs';
import { pickNext, poolFor } from '../domain/queue';
import { dayKey, fmt } from '../domain/time';
import { answerXp, examXp, freshGame, recordActivity, type GameState } from '../domain/gamify';
import { badgeById, evaluateBadges, unlockBadges } from '../domain/badges';
import { applyExamToCards, createExam, goTo, gradeExam, isExpired, selectOption, toggleFlag, type ExamConfig, type ExamResult } from '../domain/exam';
import type { Rng } from '../domain/random';
import { SNAPSHOT_KEYS, type AppStorage, type Snapshot } from '../storage/local';
import { exportData, parseImport } from '../storage/io';

export const RATING_NAMES = ['', 'Lại', 'Khó', 'Được', 'Dễ'] as const;
export const EXAM_HISTORY_LIMIT = 30;

export interface StudySession {
  cur: number | null; picked: string[]; shown: boolean; correct: boolean; ahead: boolean;
  combo: number; answered: number; correctCount: number; xp: number; bestCombo: number; startedAt: number; lastXp: number | null;
}
export interface Toast { id: number; text: string; kind: 'info' | 'xp' | 'badge' | 'error' }

export interface AppState extends Snapshot {
  questions: Question[];
  byId: Record<number, Question>;
  now: number;
  study: StudySession;
  toasts: Toast[];
  tick(): void;
  toggleChapter(c: ChapterId): void;
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
  resetAll(): void;
  pushToast(text: string, kind?: Toast['kind']): void;
  dismissToast(id: number): void;
}

export interface AppDeps { storage: AppStorage; questions: Question[]; now?: () => number; rand?: Rng }

const emptySession = (now: number): StudySession => ({
  cur: null, picked: [], shown: false, correct: false, ahead: false,
  combo: 0, answered: 0, correctCount: 0, xp: 0, bestCombo: 0, startedAt: now, lastXp: null,
});

let toastSeq = 0;

export function createAppStore(deps: AppDeps): StoreApi<AppState> {
  const now = deps.now ?? Date.now;
  const rand = deps.rand ?? Math.random;
  const t0 = now();
  const snap = deps.storage.load();
  const byId = Object.fromEntries(deps.questions.map((q) => [q.n, q])) as Record<number, Question>;

  const store = createStore<AppState>()((set, get) => {
    const toast = (text: string, kind: Toast['kind'] = 'info') =>
      set((s) => ({ toasts: [...s.toasts, { id: ++toastSeq, text, kind }].slice(-4) }));

    /** Thông báo mục tiêu ngày, kiểm tra và mở huy hiệu mới. */
    const settle = (game: GameState, goalJustHit: boolean, cards: AppState['cards'], extra: { lastExamScore?: number; hour?: number }, t: number) => {
      if (goalJustHit) toast('Đạt mục tiêu hôm nay! +50 XP', 'xp');
      const ids = evaluateBadges({ cards, questions: deps.questions, game, ...extra });
      for (const id of ids) toast(`Mở khóa huy hiệu: ${badgeById(id)?.name ?? id}`, 'badge');
      return { game: unlockBadges(game, ids, t), ids };
    };

    return {
      ...snap,
      questions: deps.questions,
      byId,
      now: t0,
      study: emptySession(t0),
      toasts: [],

      tick() {
        const t = now();
        const k = dayKey(t);
        set(get().day.d !== k ? { now: t, day: { d: k, newSeen: 0, done: 0, ok: 0 } } : { now: t });
      },

      toggleChapter(c) {
        const chs = get().cfg.chs;
        const next = chs.includes(c) ? chs.filter((x) => x !== c) : [...chs, c].sort((a, b) => a - b);
        if (next.length) set({ cfg: { ...get().cfg, chs: next } });
      },

      startStudy() {
        set({ study: emptySession(now()) });
        get().nextCard();
      },

      nextCard() {
        const s = get();
        const t = now();
        const n = pickNext(poolFor(s.questions, s.cfg.chs), s.cards, t, {
          newPerDay: s.cfg.newPerDay, newSeen: s.day.newSeen, order: s.cfg.order, ahead: s.study.ahead, rand,
        });
        set({ now: t, study: { ...s.study, cur: n, picked: [], shown: false, correct: false, lastXp: null } });
      },

      choose(key) {
        const s = get();
        const st = s.study;
        if (st.cur == null || st.shown || st.picked.includes(key)) return;
        const q = s.byId[st.cur];
        const picked = [...st.picked, key];
        if (q.a.includes(key) && picked.length < q.a.length) {
          set({ study: { ...st, picked } });
          return;
        }
        const correct = picked.length === q.a.length && picked.every((k) => q.a.includes(k));
        const combo = correct ? st.combo + 1 : 0;
        const xp = answerXp(correct, combo);
        set({
          study: {
            ...st, picked, shown: true, correct, combo, answered: st.answered + 1,
            correctCount: st.correctCount + (correct ? 1 : 0), xp: st.xp + xp, bestCombo: Math.max(st.bestCombo, combo), lastXp: xp,
          },
          game: { ...s.game, xp: s.game.xp + xp, bestCombo: Math.max(s.game.bestCombo, combo) },
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
        set({ cards, game, now: t, examCurrent: null, examHistory: [result, ...s.examHistory].slice(0, EXAM_HISTORY_LIMIT) });
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
        return exportData(get());
      },

      importJson(text) {
        const r = parseImport(text, get());
        if (!r.ok) return { ok: false, message: r.error };
        set({ ...r.data });
        return { ok: true, message: r.legacy ? 'Đã nhập tiến độ từ bản cũ (QUIZ.html).' : 'Đã nhập tiến độ.' };
      },

      resetAll() {
        const t = now();
        set({ cards: {}, game: freshGame(), examCurrent: null, examHistory: [], day: { d: dayKey(t), newSeen: 0, done: 0, ok: 0 }, study: emptySession(t) });
      },

      pushToast: toast,

      dismissToast(id) {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      },
    };
  });

  // Ghi xuống storage mọi phần dữ liệu vừa đổi tham chiếu.
  store.subscribe((s, prev) => {
    const patch: Partial<Record<keyof Snapshot, unknown>> = {};
    let changed = false;
    for (const k of SNAPSHOT_KEYS) {
      if (s[k] !== prev[k]) { patch[k] = s[k]; changed = true; }
    }
    if (changed) deps.storage.save(patch as Partial<Snapshot>);
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
