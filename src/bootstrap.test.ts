import { bootstrapApp } from './bootstrap';

beforeEach(() => localStorage.clear());

describe('bootstrapApp', () => {
  it('dữ liệu hỏng không làm app dừng, hiện thông báo đọc lỗi', () => {
    localStorage.setItem('hcm.v1.cards', '{hỏng');
    localStorage.setItem('hcm.v1.game', '{"xp":7}');
    const { store } = bootstrapApp();
    expect(store.getState().game.xp).toBe(7);
    const toasts = store.getState().toasts;
    expect(toasts.at(-1)).toMatchObject({ text: 'Không đọc được một phần tiến độ đã lưu trên máy này', kind: 'error' });
  });

  it('lỗi ghi chỉ báo một lần dù flush lỗi nhiều lần', () => {
    const backend = {
      getItem: () => null,
      setItem: () => { throw new Error('đầy'); },
    } as unknown as Storage;
    const { store, storage } = bootstrapApp({ backend });
    store.getState().toggleChapter(1);
    storage.flush();
    store.getState().toggleChapter(1);
    storage.flush();
    const errs = store.getState().toasts.filter((t) => t.text === 'Không lưu được tiến độ trên máy này');
    expect(errs).toHaveLength(1);
  });
});
