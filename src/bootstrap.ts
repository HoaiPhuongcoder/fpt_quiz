import type { StoreApi } from 'zustand';
import { createAppStore, setAppStore, type AppState } from './store/appStore';
import { createLocalStorage, type AppStorage } from './storage/local';
import { QUESTIONS } from './data/questions';

export function bootstrapApp(opts: { backend?: Storage } = {}): { store: StoreApi<AppState>; storage: AppStorage } {
  let ready = false;
  let loadFailed = false;
  let saveWarned = false;
  let store: StoreApi<AppState> | null = null;

  const storage = createLocalStorage({
    backend: opts.backend,
    onError: () => {
      if (!ready) {
        loadFailed = true;
        return;
      }
      if (saveWarned) return;
      saveWarned = true;
      store?.getState().pushToast('Không lưu được tiến độ trên máy này', 'error');
    },
  });
  store = createAppStore({ storage, questions: QUESTIONS });
  setAppStore(store);
  ready = true;
  if (loadFailed) store.getState().pushToast('Không đọc được một phần tiến độ đã lưu trên máy này', 'error');

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') storage.flush();
  });
  window.addEventListener('pagehide', () => storage.flush());

  return { store, storage };
}
