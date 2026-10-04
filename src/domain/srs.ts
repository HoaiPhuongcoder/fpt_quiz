import type { Card, CardInput, PresetId, Rating, SrsConfig, SrsParams } from './types';
import { DAY, MIN } from './time';

export const PRESETS: Record<PresetId, SrsParams & { name: string }> = {
  cram: { name: 'Thi gấp', steps: [1, 10, 60], relearn: [10], grad: 240, easy: DAY, cap: 2 * DAY, startEase: 2.5, easyBonus: 1.3, hardMul: 1.2, ivlMod: 1, lapsePct: 30, minLapse: 60 },
  normal: { name: 'Giống Anki mặc định', steps: [1, 10], relearn: [10], grad: DAY, easy: 4 * DAY, cap: 36500 * DAY, startEase: 2.5, easyBonus: 1.3, hardMul: 1.2, ivlMod: 1, lapsePct: 0, minLapse: DAY },
};

export function presetParams(id: PresetId): SrsParams {
  const p = PRESETS[id];
  return {
    steps: [...p.steps], relearn: [...p.relearn], grad: p.grad, easy: p.easy, cap: p.cap, startEase: p.startEase,
    easyBonus: p.easyBonus, hardMul: p.hardMul, ivlMod: p.ivlMod, lapsePct: p.lapsePct, minLapse: p.minLapse,
  };
}

export const DEFAULT_CONFIG: SrsConfig = { preset: 'cram', ...presetParams('cram'), newPerDay: 80, chs: [1, 2, 3, 4, 5, 6], order: 'random' };

/**
 * Chấm một thẻ: 1 Lại, 2 Khó, 3 Được, 4 Dễ. Trả về [thẻ mới, khoảng cách (phút)].
 * Logic giữ nguyên từng dòng so với QUIZ.html, chỉ thêm tham số `now` để test được.
 */
export function schedule(c0: CardInput, r: Rating, P: SrsParams, now: number): [Card, number] {
  const c = { ...c0 } as Card;
  now = Math.trunc(now);  // Match Date.now() behavior (always integer)
  let ivl: number;
  if (c.ease == null) c.ease = P.startEase;
  if (c.st === 'new' || c.st === 'learn' || c.st === 'relearn') {
    const relearn = c.st === 'relearn', steps = relearn ? P.relearn : P.steps;
    let step = c.st === 'new' ? 0 : Math.min(c.step || 0, steps.length - 1);
    if (r === 1) { step = 0; ivl = steps[0]; c.st = relearn ? 'relearn' : 'learn'; }
    else if (r === 2) { ivl = step === 0 ? (steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[0] * 1.5) : steps[step]; c.st = relearn ? 'relearn' : 'learn'; }
    else if (r === 3) {
      step++;
      if (step >= steps.length) { c.st = 'review'; ivl = relearn ? Math.max(P.minLapse, c.ivl || P.grad) : P.grad; c.ivl = Math.min(ivl, P.cap); ivl = c.ivl; step = 0; }
      else { ivl = steps[step]; c.st = relearn ? 'relearn' : 'learn'; }
    } else { c.st = 'review'; ivl = relearn ? Math.max(P.minLapse, (c.ivl || P.grad)) * P.easyBonus : P.easy; c.ivl = Math.min(ivl, P.cap); ivl = c.ivl; step = 0; }
    c.step = step;
  } else {
    const cur = c.ivl || P.grad;
    if (r === 1) { c.lapses = (c.lapses || 0) + 1; c.ease = Math.max(1.3, c.ease - 0.2); c.st = 'relearn'; c.step = 0; c.ivl = Math.max(P.minLapse, cur * P.lapsePct / 100); ivl = P.relearn[0]; }
    else if (r === 2) { c.ease = Math.max(1.3, c.ease - 0.15); ivl = Math.min(P.cap, Math.max(cur * P.hardMul * P.ivlMod, cur + 1)); c.ivl = ivl; }
    else if (r === 3) { ivl = Math.min(P.cap, Math.max(cur * c.ease * P.ivlMod, cur * P.hardMul + 1)); c.ivl = ivl; }
    else { c.ease += 0.15; ivl = Math.min(P.cap, cur * c.ease * P.easyBonus * P.ivlMod); c.ivl = ivl; }
  }
  c.reps = (c.reps || 0) + 1;
  c.due = now + ivl * MIN;
  c.last = now;
  c.log = [...(c.log || []).slice(-19), [now, r, Math.round(ivl)]];
  return [c, ivl];
}
