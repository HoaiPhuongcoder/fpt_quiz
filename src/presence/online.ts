import { useSyncExternalStore } from 'react';
import type { StoreApi } from 'zustand';
import type { AppState } from '../store/appStore';

const SUPABASE_URL = 'https://dkyrovftyeewennuwboo.supabase.co';
/** Khóa publishable của Supabase: là khóa công khai, nhúng vào web được (không phải secret key). */
const SUPABASE_KEY = 'sb_publishable_A32OcGkyXdddnKF5v93vNQ_ERZP4qWE';
const CHANNEL = 'dang-hoc';

export interface OnlineCount { total: number; bySubject: Record<string, number> }
type Meta = { subject?: string };

/** Mỗi tab đang mở là một key; môn của tab lấy theo lần báo gần nhất. */
export function countPresence(state: Record<string, Meta[]>): OnlineCount {
  const bySubject: Record<string, number> = {};
  const keys = Object.keys(state);
  for (const k of keys) {
    const subject = state[k].at(-1)?.subject;
    if (subject) bySubject[subject] = (bySubject[subject] ?? 0) + 1;
  }
  return { total: keys.length, bySubject };
}

let current: OnlineCount | null = null;
const listeners = new Set<() => void>();

/** null = chưa kết nối được (mất mạng, lỗi dịch vụ): giao diện ẩn con số. */
export function setOnlineCount(c: OnlineCount | null): void {
  current = c;
  listeners.forEach((l) => l());
}

export function useOnlineCount(): OnlineCount | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}

/**
 * Báo cho Supabase Realtime là tab này đang mở web, kèm mã môn đang chọn, và theo dõi số người online.
 * Chỉ gửi một mã ngẫu nhiên mới cho mỗi tab, không gửi tiến độ hay thông tin cá nhân. Lỗi thì bỏ qua.
 */
export async function startPresence(store: StoreApi<AppState>): Promise<void> {
  try {
    const { RealtimeClient } = await import('@supabase/realtime-js');
    const client = new RealtimeClient(`${SUPABASE_URL}/realtime/v1`, { params: { apikey: SUPABASE_KEY } });
    const key = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const channel = client.channel(CHANNEL, { config: { presence: { key } } });
    const track = () => channel.track({ subject: store.getState().subject.id }).catch(() => {});

    channel.on('presence', { event: 'sync' }, () => setOnlineCount(countPresence(channel.presenceState<Meta>())));
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') void track();
      else setOnlineCount(null);
    });

    let subject = store.getState().subject.id;
    store.subscribe((s) => {
      if (s.subject.id === subject) return;
      subject = s.subject.id;
      void track();
    });
  } catch {
    setOnlineCount(null);
  }
}
