import { describe, it, expect } from 'vitest';
import { exportAll, parseImport } from './io';
import { defaultSnapshot } from './local';
import { makeCard } from '../../test/fixtures';

const cur = defaultSnapshot(new Date(2026, 9, 4).getTime(), [1, 2, 3, 4, 5, 6]);
const cfgFor = () => cur.cfg;
const KNOWN = ['hcm202', 'mln131'];

describe('xuất / nhập', () => {
  it('xuất rồi nhập lại cho cùng dữ liệu, nhiều môn', () => {
    const game = { ...cur.game, xp: 300 };
    const subjects = {
      hcm202: { cards: { 1: makeCard() }, cfg: cur.cfg, examHistory: [] },
      mln131: { cards: { 7: makeCard() }, cfg: { ...cur.cfg, newPerDay: 10 }, examHistory: [] },
    };
    expect(parseImport(exportAll(game, subjects), cfgFor, KNOWN)).toEqual({ ok: true, legacy: false, game, subjects });
  });
  it('v4: môn lạ bị bỏ qua, thẻ hỏng thì báo lỗi', () => {
    const text = JSON.stringify({ app: 'fpt-quiz', v: 4, game: {}, subjects: { abc: { cards: {} }, mln131: { cards: { 2: makeCard() } } } });
    const r = parseImport(text, cfgFor, KNOWN);
    expect(r.ok && Object.keys(r.subjects)).toEqual(['mln131']);
    const bad = JSON.stringify({ app: 'fpt-quiz', v: 4, subjects: { mln131: { cards: { x: {} } } } });
    expect(parseImport(bad, cfgFor, KNOWN).ok).toBe(false);
  });
  it('v3 của bản một môn vào HCM202, có game', () => {
    const text = JSON.stringify({ app: 'hcm202', v: 3, cards: { 1: makeCard() }, cfg: {}, game: { xp: 40 }, examHistory: [] });
    const r = parseImport(text, cfgFor, KNOWN);
    expect(r.ok && r.game?.xp).toBe(40);
    expect(r.ok && Object.keys(r.subjects)).toEqual(['hcm202']);
  });
  it('nhập định dạng cũ {v:2, cards, cfg} của QUIZ.html vào HCM202; không đụng tới XP', () => {
    const legacy = JSON.stringify({ v: 2, cards: { 5: makeCard({ st: 'learn' }) }, cfg: { preset: 'normal', newPerDay: 30 } });
    const r = parseImport(legacy, cfgFor, KNOWN);
    expect(r.ok && r.legacy).toBe(true);
    if (!r.ok) return;
    expect(r.game).toBeUndefined();
    expect(r.subjects.hcm202.cards[5].st).toBe('learn');
    expect(r.subjects.hcm202.cfg).toMatchObject({ preset: 'normal', newPerDay: 30, steps: [1, 10, 60] });
    expect(r.subjects.hcm202.examHistory).toBeUndefined();
  });
  it('JSON hỏng hoặc không có tiến độ thẻ hợp lệ thì báo lỗi', () => {
    expect(parseImport('{abc', cfgFor, KNOWN).ok).toBe(false);
    expect(parseImport('{"v":2}', cfgFor, KNOWN).ok).toBe(false);
    expect(parseImport('{"cards":{"x":{}}}', cfgFor, KNOWN).ok).toBe(false);
  });
});
