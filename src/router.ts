import { useMemo, useSyncExternalStore } from 'react';

export type RouteName = 'home' | 'exam-setup' | 'library' | 'search' | 'profile' | 'settings' | 'study' | 'exam' | 'result';
export interface Route { subject?: string; name: RouteName; param?: string }

const PATHS: Record<string, RouteName> = {
  '': 'home', hoc: 'study', thi: 'exam-setup', 'lam-bai': 'exam', 'thu-vien': 'library', 'tim-kiem': 'search', 'ho-so': 'profile', 'cai-dat': 'settings',
};

const SLUG: Record<RouteName, string> = Object.fromEntries(Object.entries(PATHS).map(([k, v]) => [v, k])) as Record<RouteName, string>;
SLUG.result = 'ket-qua';

/** Đọc '/mln131/hoc'. Đoạn đầu là mã môn (có trong `subjectIds`) thì tách ra; link cũ không có mã môn vẫn đọc được. */
export function parsePath(path: string, subjectIds: readonly string[] = []): Route {
  const parts = path.replace(/^#/, '').replace(/^\/+/, '').split('/');
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

const NAVIGATE = 'app:navigate';

/** Đổi URL không tải lại trang rồi báo cho `useRoute`. */
export function navigate(url: string, { replace = false }: { replace?: boolean } = {}): void {
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  window.dispatchEvent(new Event(NAVIGATE));
}

/** Link cũ dạng '/#/mln131/hoc' (trước khi bỏ dấu #) đổi sang '/mln131/hoc'. */
export function migrateHashUrl(): void {
  if (location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1));
}

/** Bấm thẻ <a> trỏ vào trang của app (đoạn đầu là mã môn) thì đổi route tại chỗ thay vì tải lại cả trang. */
export function interceptAppLinks(subjectIds: readonly string[]): () => void {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a');
    if (!a || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !subjectIds.includes(url.pathname.split('/')[1])) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb);
  window.addEventListener(NAVIGATE, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(NAVIGATE, cb);
  };
};

export function useRoute(subjectIds: readonly string[] = []): Route {
  const path = useSyncExternalStore(subscribe, () => window.location.pathname);
  const key = subjectIds.join(',');
  // Chỉ tính lại khi đường dẫn hoặc danh sách môn đổi, để route giữ nguyên tham chiếu giữa các lần render.
  return useMemo(() => parsePath(path, subjectIds), [path, key]);
}
