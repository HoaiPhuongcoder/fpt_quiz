import { getAppStore } from './appStore';

/** Đường dẫn trong app kèm mã môn đang chọn: href('/hoc') → '#/mln131/hoc'. */
export function href(path: string): string {
  return `#/${getAppStore().getState().subject.id}${path === '/' ? '/' : path}`;
}
export function go(path: string): void {
  location.hash = href(path);
}
export function replaceTo(path: string): void {
  location.replace(href(path));
}
