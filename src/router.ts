import { useSyncExternalStore } from 'react';

export type RouteName = 'home' | 'exam-setup' | 'library' | 'profile' | 'settings' | 'study' | 'exam' | 'result';
export interface Route { name: RouteName; param?: string }

const PATHS: Record<string, RouteName> = {
  '': 'home', hoc: 'study', thi: 'exam-setup', 'lam-bai': 'exam', 'thu-vien': 'library', 'ho-so': 'profile', 'cai-dat': 'settings',
};

export function parseHash(hash: string): Route {
  const [first = '', second] = hash.replace(/^#\/?/, '').split('/');
  if (first === 'ket-qua') return { name: 'result', param: second };
  return { name: PATHS[first] ?? 'home' };
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useHashRoute(): Route {
  return parseHash(useSyncExternalStore(subscribe, () => window.location.hash));
}
