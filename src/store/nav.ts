import { navigate } from '../router';
import { getAppStore } from './appStore';

/** Đường dẫn trong app kèm mã môn đang chọn: href('/hoc') → '/mln131/hoc'. */
export function href(path: string): string {
  return `/${getAppStore().getState().subject.id}${path === '/' ? '/' : path}`;
}
export function go(path: string): void {
  navigate(href(path));
}
export function replaceTo(path: string): void {
  navigate(href(path), { replace: true });
}
