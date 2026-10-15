import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ACTIVE_KEY, createLocalStorage, defaultSnapshot, keyFor, META_KEY } from './local';
import { makeCard, makeSubject } from '../../test/fixtures';

const HCM = makeSubject();
const MLN = makeSubject([], { id: 'mln131', storagePrefix: 'quiz.v1.mln131', chapters: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id, title: '' })) });
const STORAGE_KEYS = {
  cards: 'hcm.v1.cards', cfg: 'hcm.v1.cfg', game: 'hcm.v1.game', examCurrent: 'hcm.v1.exam.current', examHistory: 'hcm.v1.exam.history',
};

const NOW = new Date(2026, 9, 4, 10).getTime();
beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
afterEach(() => vi.useRealTimers());

describe('createLocalStorage', () => {
  it('kho trống → dữ liệu mặc định, ngày là hôm nay', () => {
    const s = createLocalStorage({ now: () => NOW }).load(HCM);
    expect(s).toEqual(defaultSnapshot(NOW, [1, 2, 3, 4, 5, 6]));
    expect(s.day).toEqual({ d: '2026-10-04', newSeen: 0, done: 0, ok: 0 });
    expect(s.game.goalTarget).toBe(50);
  });
  it('gom các lần ghi trong 300ms, ghi kèm phiên bản dữ liệu', () => {
    const st = createLocalStorage({ now: () => NOW });
    st.save(HCM, { cards: { 1: makeCard() } });
    st.save(HCM, { examHistory: [] });
    expect(localStorage.getItem(STORAGE_KEYS.cards)).toBeNull();
    vi.advanceTimersByTime(300);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.cards)!)).toEqual({ 1: makeCard() });
    expect(localStorage.getItem(STORAGE_KEYS.examHistory)).toBe('[]');
    expect(JSON.parse(localStorage.getItem(META_KEY)!)).toEqual({ schemaVersion: 1 });
  });
  it('flush ghi ngay', () => {
    const st = createLocalStorage({ now: () => NOW });
    st.save(HCM, { examCurrent: null });
    st.flush();
    expect(localStorage.getItem(STORAGE_KEYS.examCurrent)).toBe('null');
  });
  it('đọc lại dữ liệu đã ghi, bổ sung trường còn thiếu', () => {
    localStorage.setItem(STORAGE_KEYS.cfg, JSON.stringify({ newPerDay: 20 }));
    localStorage.setItem(STORAGE_KEYS.game, JSON.stringify({ xp: 120 }));
    const s = createLocalStorage({ now: () => NOW }).load(HCM);
    expect(s.cfg.newPerDay).toBe(20);
    expect(s.cfg.steps).toEqual([1, 10, 60]);
    expect(s.game).toMatchObject({ xp: 120, goalTarget: 50 });
  });
  it('một khóa hỏng không làm mất các khóa khác', () => {
    localStorage.setItem(STORAGE_KEYS.cards, '{hỏng');
    localStorage.setItem(STORAGE_KEYS.game, JSON.stringify({ xp: 7 }));
    const onError = vi.fn();
    const s = createLocalStorage({ now: () => NOW, onError }).load(HCM);
    expect(s.cards).toEqual({});
    expect(s.game.xp).toBe(7);
    expect(onError).toHaveBeenCalledTimes(1);
  });
  it('ghi lỗi (hết dung lượng) không ném lỗi ra ngoài', () => {
    const backend = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } } as unknown as Storage;
    const onError = vi.fn();
    const st = createLocalStorage({ now: () => NOW, onError, backend });
    st.save(HCM, { cards: {} });
    expect(() => st.flush()).not.toThrow();
    expect(onError).toHaveBeenCalled();
  });
});

describe('lưu theo môn', () => {
  it('HCM202 giữ key cũ, môn khác dùng tiền tố riêng, game dùng chung', () => {
    expect(keyFor(HCM, 'cards')).toBe('hcm.v1.cards');
    expect(keyFor(HCM, 'examCurrent')).toBe('hcm.v1.exam.current');
    expect(keyFor(MLN, 'cards')).toBe('quiz.v1.mln131.cards');
    expect(keyFor(MLN, 'examHistory')).toBe('quiz.v1.mln131.exam.history');
    expect(keyFor(MLN, 'game')).toBe('hcm.v1.game');
  });
  it('ghi dở của môn cũ vẫn vào đúng chỗ sau khi ghi môn mới', () => {
    const st = createLocalStorage({ now: () => NOW });
    st.save(HCM, { cards: { 1: makeCard() } });
    st.save(MLN, { cards: { 2: makeCard() }, game: { ...defaultSnapshot(NOW, []).game, xp: 5 } });
    st.flush();
    expect(Object.keys(JSON.parse(localStorage.getItem('hcm.v1.cards')!))).toEqual(['1']);
    expect(Object.keys(JSON.parse(localStorage.getItem('quiz.v1.mln131.cards')!))).toEqual(['2']);
    expect(st.load(HCM).game.xp).toBe(5);
  });
  it('đọc được phần chưa kịp ghi xuống', () => {
    const st = createLocalStorage({ now: () => NOW });
    st.save(MLN, { cards: { 3: makeCard() } });
    expect(st.load(MLN).cards[3]).toBeDefined();
    expect(st.load(HCM).cards[3]).toBeUndefined();
  });
  it('chương mặc định theo môn; chương lạ bị bỏ, rỗng thì lấy hết', () => {
    const st = createLocalStorage({ now: () => NOW });
    expect(st.load(MLN).cfg.chs).toEqual([1, 2, 3, 4, 5, 6, 7]);
    localStorage.setItem('quiz.v1.mln131.cfg', JSON.stringify({ chs: [7, 9] }));
    expect(st.load(MLN).cfg.chs).toEqual([7]);
    localStorage.setItem('quiz.v1.mln131.cfg', JSON.stringify({ chs: [9] }));
    expect(st.load(MLN).cfg.chs).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('nhớ môn đang chọn', () => {
    const st = createLocalStorage({ now: () => NOW });
    expect(st.loadActive()).toBeNull();
    st.saveActive('mln131');
    expect(localStorage.getItem(ACTIVE_KEY)).toBe('mln131');
    expect(st.loadActive()).toBe('mln131');
  });
});
