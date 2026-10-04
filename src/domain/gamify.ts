import { prevDayKey } from './time';

export interface DayActivity { reviewed: number; answered: number; examsDone: number; goalHit: boolean }
export interface GameState {
  xp: number;
  bestCombo: number;
  streak: { count: number; lastDay: string | null };
  days: Record<string, DayActivity>;
  goalTarget: number;
  goalHits: number;
  examsDone: number;
  badges: Record<string, number>;
}

export const XP = { correct: 10, wrong: 2, examCorrect: 5, exam8: 100, exam10: 250, goal: 50 } as const;
export const KEEP_DAYS = 60;
export const STUDY_DAY_MIN_REVIEWS = 10;

export function freshGame(): GameState {
  return { xp: 0, bestCombo: 0, streak: { count: 0, lastDay: null }, days: {}, goalTarget: 50, goalHits: 0, examsDone: 0, badges: {} };
}

export function comboMultiplier(combo: number): number {
  return combo >= 10 ? 2 : combo >= 5 ? 1.5 : 1;
}

export function answerXp(correct: boolean, comboAfter: number): number {
  return correct ? Math.floor(XP.correct * comboMultiplier(comboAfter)) : XP.wrong;
}

export function examXp(correct: number, score10: number): number {
  return correct * XP.examCorrect + (score10 >= 10 ? XP.exam10 : score10 >= 8 ? XP.exam8 : 0);
}

export function xpToNext(level: number): number {
  return 100 + 50 * (level - 1);
}

export function titleFor(level: number): string {
  return level >= 20 ? 'Đại sứ tư tưởng' : level >= 15 ? 'Chuyên gia' : level >= 10 ? 'Học giả' : level >= 5 ? 'Học viên' : 'Tân binh';
}

export interface LevelInfo { level: number; into: number; need: number; title: string }
export function levelInfo(xp: number): LevelInfo {
  let level = 1, rest = xp;
  while (rest >= xpToNext(level)) { rest -= xpToNext(level); level++; }
  return { level, into: rest, need: xpToNext(level), title: titleFor(level) };
}

export function isStudyDay(d: DayActivity | undefined): boolean {
  return !!d && (d.reviewed >= STUDY_DAY_MIN_REVIEWS || d.examsDone >= 1);
}

export function displayStreak(g: GameState, today: string): number {
  const last = g.streak.lastDay;
  return last && (last === today || last === prevDayKey(today)) ? g.streak.count : 0;
}

export interface ActivityDelta { reviewed?: number; examQuestions?: number; examsDone?: number }
export interface ActivityResult { game: GameState; goalJustHit: boolean; streakExtended: boolean }

export function recordActivity(g: GameState, today: string, delta: ActivityDelta): ActivityResult {
  const prev = g.days[today] ?? { reviewed: 0, answered: 0, examsDone: 0, goalHit: false };
  const reviewed = delta.reviewed ?? 0, examsDone = delta.examsDone ?? 0;
  const day: DayActivity = {
    reviewed: prev.reviewed + reviewed,
    answered: prev.answered + reviewed + (delta.examQuestions ?? 0),
    examsDone: prev.examsDone + examsDone,
    goalHit: prev.goalHit,
  };
  let streak = g.streak, streakExtended = false;
  if (!isStudyDay(prev) && isStudyDay(day) && streak.lastDay !== today) {
    streak = { count: streak.lastDay === prevDayKey(today) ? streak.count + 1 : 1, lastDay: today };
    streakExtended = true;
  }
  let xp = g.xp, goalHits = g.goalHits, goalJustHit = false;
  if (!day.goalHit && day.answered >= g.goalTarget) {
    day.goalHit = true;
    goalJustHit = true;
    goalHits++;
    xp += XP.goal;
  }
  return { game: { ...g, xp, goalHits, streak, days: pruneDays({ ...g.days, [today]: day }), examsDone: g.examsDone + examsDone }, goalJustHit, streakExtended };
}

function pruneDays(days: Record<string, DayActivity>): Record<string, DayActivity> {
  const keys = Object.keys(days).sort().reverse();
  return keys.length <= KEEP_DAYS ? days : Object.fromEntries(keys.slice(0, KEEP_DAYS).map((k) => [k, days[k]]));
}
