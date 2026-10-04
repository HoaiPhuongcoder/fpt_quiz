import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './index.css';
import { App } from './App';
import { createAppStore, setAppStore } from './store/appStore';
import { createLocalStorage } from './storage/local';
import { QUESTIONS } from './data/questions';

let warned = false;
const storage = createLocalStorage({
  onError: () => {
    if (warned) return;
    warned = true;
    store.getState().pushToast('Không lưu được tiến độ trên máy này', 'error');
  },
});
const store = createAppStore({ storage, questions: QUESTIONS });
setAppStore(store);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') storage.flush();
});
window.addEventListener('pagehide', () => storage.flush());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
