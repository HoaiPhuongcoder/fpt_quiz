import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLocalStorage, defaultSnapshot, META_KEY, STORAGE_KEYS } from './local';
import { makeCard } from '../../test/fixtures';

const NOW = new Date(2026, 9, 4, 10).getTime();
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createLocalStorage', () => {
  it('kho trống → dữ liệu mặc định, ngày là hôm nay', () => {
    const s = createLocalStorage({ now: () => NOW }).load();
    expect(s).toEqual(defaultSnapshot(NOW));
    expect(s.day).toEqual({ d: '2026-10-04', newSeen: 0, done: 0, ok: 0 });
    expect(s.game.goalTarget).toBe(50);
  });
  it('gom các lần ghi trong 300ms, ghi kèm phiên bản dữ liệu', () => {
    const st = createLocalStorage({ now: () => NOW });
    st.save({ cards: { 1: makeCard() } });
    st.save({ examHistory: [] });
    expect(localStorage.getItem(STORAGE_KEYS.cards)).toBeNull();
    vi.advanceTimersByTime(300);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.cards)!)).toEqual({ 1: makeCard() });
    expect(localStorage.getItem(STORAGE_KEYS.examHistory)).toBe('[]');
    expect(JSON.parse(localStorage.getItem(META_KEY)!)).toEqual({ schemaVersion: 1 });
  });
  it('flush ghi ngay', () => {
    const st = createLocalStorage({ now: () => NOW });
    st.save({ examCurrent: null });
    st.flush();
    expect(localStorage.getItem(STORAGE_KEYS.examCurrent)).toBe('null');
  });
  it('đọc lại dữ liệu đã ghi, bổ sung trường còn thiếu', () => {
    localStorage.setItem(STORAGE_KEYS.cfg, JSON.stringify({ newPerDay: 20 }));
    localStorage.setItem(STORAGE_KEYS.game, JSON.stringify({ xp: 120 }));
    const s = createLocalStorage({ now: () => NOW }).load();
    expect(s.cfg.newPerDay).toBe(20);
    expect(s.cfg.steps).toEqual([1, 10, 60]);
    expect(s.game).toMatchObject({ xp: 120, goalTarget: 50 });
  });
  it('một khóa hỏng không làm mất các khóa khác', () => {
    localStorage.setItem(STORAGE_KEYS.cards, '{hỏng');
    localStorage.setItem(STORAGE_KEYS.game, JSON.stringify({ xp: 7 }));
    const onError = vi.fn();
    const s = createLocalStorage({ now: () => NOW, onError }).load();
    expect(s.cards).toEqual({});
    expect(s.game.xp).toBe(7);
    expect(onError).toHaveBeenCalledTimes(1);
  });
  it('ghi lỗi (hết dung lượng) không ném lỗi ra ngoài', () => {
    const backend = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } } as unknown as Storage;
    const onError = vi.fn();
    const st = createLocalStorage({ now: () => NOW, onError, backend });
    st.save({ cards: {} });
    expect(() => st.flush()).not.toThrow();
    expect(onError).toHaveBeenCalled();
  });
});
