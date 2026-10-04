import type { ReactNode } from 'react';
import { BooksIcon, HouseIcon, TimerIcon, UserCircleIcon, type Icon } from '@phosphor-icons/react';
import type { RouteName } from '../router';

const TABS: { path: string; label: string; Icon: Icon; match: RouteName[] }[] = [
  { path: '/', label: 'Trang chủ', Icon: HouseIcon, match: ['home'] },
  { path: '/thi', label: 'Thi thử', Icon: TimerIcon, match: ['exam-setup', 'result'] },
  { path: '/thu-vien', label: 'Thư viện', Icon: BooksIcon, match: ['library'] },
  { path: '/ho-so', label: 'Hồ sơ', Icon: UserCircleIcon, match: ['profile', 'settings'] },
];

export function AppShell({ active, children }: { active: RouteName; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-white/10 bg-[#0a0816]/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:sticky lg:top-0 lg:bottom-auto lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-t-0 lg:border-r lg:p-4"
      >
        <p className="hidden px-3 pb-4 pt-2 text-lg font-bold lg:block">
          Ôn <span className="text-violet-soft">HCM202</span>
        </p>
        {TABS.map(({ path, label, Icon, match }) => {
          const on = match.includes(active);
          return (
            <a
              key={path}
              href={`#${path}`}
              aria-current={on ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] transition lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:text-sm ${on ? 'font-bold text-violet-soft lg:bg-white/10' : 'text-dim hover:text-mut'}`}
            >
              <Icon size={22} weight={on ? 'fill' : 'regular'} />
              {label}
            </a>
          );
        })}
      </nav>
      <main className="mx-auto w-full max-w-[560px] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+16px)] lg:pb-12 lg:pt-10">{children}</main>
    </div>
  );
}
