import { describe, it, expect } from 'vitest';
import { exportData, parseImport } from './io';
import { defaultSnapshot } from './local';
import { makeCard } from '../../test/fixtures';

const cur = defaultSnapshot(new Date(2026, 9, 4).getTime());

describe('xuất / nhập', () => {
  it('xuất rồi nhập lại cho cùng dữ liệu', () => {
    const s = { ...cur, cards: { 1: makeCard() }, game: { ...cur.game, xp: 300 } };
    expect(parseImport(exportData(s), cur)).toEqual({ ok: true, legacy: false, data: { cards: s.cards, cfg: s.cfg, game: s.game, examHistory: [] } });
  });
  it('nhập định dạng cũ {v:2, cards, cfg} của QUIZ.html; game được tạo mới', () => {
    const legacy = JSON.stringify({ v: 2, cards: { 5: makeCard({ st: 'learn' }) }, cfg: { preset: 'normal', newPerDay: 30 } });
    const r = parseImport(legacy, { ...cur, game: { ...cur.game, xp: 999 } });
    expect(r.ok && r.legacy).toBe(true);
    if (!r.ok) return;
    expect(r.data.cards[5].st).toBe('learn');
    expect(r.data.cfg).toMatchObject({ preset: 'normal', newPerDay: 30, steps: [1, 10, 60] });
    expect(r.data.game.xp).toBe(0);
  });
  it('JSON hỏng hoặc không có tiến độ thẻ hợp lệ thì báo lỗi', () => {
    expect(parseImport('{abc', cur).ok).toBe(false);
    expect(parseImport('{"v":2}', cur).ok).toBe(false);
    expect(parseImport('{"cards":{"x":{}}}', cur).ok).toBe(false);
  });
});
