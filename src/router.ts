import { useMemo, useSyncExternalStore } from 'react';

export type RouteName = 'home' | 'exam-setup' | 'library' | 'search' | 'profile' | 'settings' | 'study' | 'exam' | 'result';
export interface Route { subject?: string; name: RouteName; param?: string }

const PATHS: Record<string, RouteName> = {
  '': 'home', hoc: 'study', thi: 'exam-setup', 'lam-bai': 'exam', 'thu-vien': 'library', 'tim-kiem': 'search', 'ho-so': 'profile', 'cai-dat': 'settings',
};

const SLUG: Record<RouteName, string> = Object.fromEntries(Object.entries(PATHS).map(([k, v]) => [v, k])) as Record<RouteName, string>;
SLUG.result = 'ket-qua';

/** Đoạn đầu là mã môn (có trong `subjectIds`) thì tách ra; link cũ không có mã môn vẫn đọc được. */
export function parseHash(hash: string, subjectIds: readonly string[] = []): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  const subject = subjectIds.includes(parts[0]) ? parts.shift() : undefined;
  const [first = '', second] = parts;
  const route: Route = first === 'ket-qua' ? { name: 'result', param: second } : { name: PATHS[first] ?? 'home' };
  return subject ? { subject, ...route } : route;
}

/** Đường dẫn của route, không kèm mã môn: '/', '/hoc', '/ket-qua/x'. */
export function routePath(r: Pick<Route, 'name' | 'param'>): string {
  const slug = SLUG[r.name];
  return `/${slug}${r.param ? `/${r.param}` : ''}`;
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useHashRoute(subjectIds: readonly string[] = []): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  const key = subjectIds.join(',');
  // Chỉ tính lại khi hash hoặc danh sách môn đổi, để route giữ nguyên tham chiếu giữa các lần render.
  return useMemo(() => parseHash(hash, subjectIds), [hash, key]);
}
