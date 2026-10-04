import type { SrsConfig } from '../../domain/types';
import { durTxt, parseDur, parseSteps } from '../../domain/time';

export interface SettingsForm {
  steps: string; relearn: string; grad: string; easy: string; cap: string; minLapse: string;
  startEase: string; easyBonus: string; hardMul: string; ivlMod: string; lapsePct: string; newPerDay: string;
}

export function toForm(c: SrsConfig): SettingsForm {
  const pct = (x: number) => String(Math.round(x * 100));
  return {
    steps: c.steps.map(durTxt).join(' '), relearn: c.relearn.map(durTxt).join(' '), grad: durTxt(c.grad), easy: durTxt(c.easy),
    cap: durTxt(c.cap), minLapse: durTxt(c.minLapse), startEase: pct(c.startEase), easyBonus: pct(c.easyBonus), hardMul: pct(c.hardMul),
    ivlMod: pct(c.ivlMod), lapsePct: String(c.lapsePct), newPerDay: String(c.newPerDay),
  };
}

export type FormResult = { ok: true; patch: Partial<SrsConfig> } | { ok: false; error: string };

const fromPct = (v: string, min: number) => {
  const x = Number(v) / 100;
  return Number.isFinite(x) ? Math.max(min, x) : min;
};

export function fromForm(f: SettingsForm): FormResult {
  const steps = parseSteps(f.steps), relearn = parseSteps(f.relearn);
  const grad = parseDur(f.grad), easy = parseDur(f.easy), cap = parseDur(f.cap), minLapse = parseDur(f.minLapse);
  if (!steps || !relearn || [grad, easy, cap, minLapse].some((x) => !(x > 0))) {
    return { ok: false, error: 'Có ô thời gian chưa đúng dạng. Dùng số kèm m (phút), h (giờ) hoặc d (ngày), ví dụ: 1m 10m 1h.' };
  }
  const lapse = Number(f.lapsePct);
  return {
    ok: true,
    patch: {
      preset: 'custom', steps, relearn, grad, easy, cap, minLapse,
      startEase: fromPct(f.startEase, 1.3), easyBonus: fromPct(f.easyBonus, 1), hardMul: fromPct(f.hardMul, 1), ivlMod: fromPct(f.ivlMod, 0.1),
      lapsePct: Number.isFinite(lapse) ? Math.max(0, Math.min(100, lapse)) : 0,
      newPerDay: Math.max(1, Math.round(Number(f.newPerDay)) || 1),
    },
  };
}
