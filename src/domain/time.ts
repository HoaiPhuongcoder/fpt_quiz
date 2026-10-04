export const MIN = 60_000;
export const DAY = 1440;

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function prevDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1).getTime());
}

export function lastNDays(today: string, n: number): string[] {
  const out = [today];
  while (out.length < n) out.unshift(prevDayKey(out[0]));
  return out;
}

export function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Thời lượng (phút) → chữ, giống hàm fmt trong QUIZ.html. */
export function fmt(m: number): string {
  if (m < 1) return '< 1 phút';
  if (m < 60) return Math.round(m) + ' phút';
  if (m < DAY) {
    const h = m / 60;
    return (h < 10 ? +h.toFixed(1) : Math.round(h)) + ' giờ';
  }
  const d = m / DAY;
  if (d < 30) return (d < 10 ? +d.toFixed(1) : Math.round(d)) + ' ngày';
  if (d < 365) return +(d / 30).toFixed(1) + ' tháng';
  return +(d / 365).toFixed(1) + ' năm';
}

/** Mốc thời gian → "21:40 hôm nay" / "07:05 ngày mai" / "07:05 12/10/2026". */
export function clock(ts: number, now: number): string {
  const d = new Date(ts), n = new Date(now);
  const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const day = (a: Date) => new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const diff = Math.round((day(d) - day(n)) / 86_400_000);
  return diff === 0 ? hm + ' hôm nay' : diff === 1 ? hm + ' ngày mai' : hm + ' ' + d.toLocaleDateString('vi-VN');
}

/** Phút → "10m" / "1h" / "4d" cho ô cài đặt. */
export function durTxt(m: number): string {
  if (m < DAY) return m % 60 === 0 && m >= 60 ? m / 60 + 'h' : Math.round(m) + 'm';
  return +(m / DAY).toFixed(1) + 'd';
}

/** "10m", "1h", "1,5h", "2 ngày" → số phút; sai dạng → NaN. */
export function parseDur(s: string): number {
  const m = String(s).trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*(m|p|phút|h|g|giờ|d|n|ngày)?$/);
  if (!m) return NaN;
  const v = parseFloat(m[1].replace(',', '.'));
  const u = m[2] || 'm';
  return u === 'h' || u === 'g' || u === 'giờ' ? v * 60 : u === 'd' || u === 'n' || u === 'ngày' ? v * DAY : v;
}

export function parseSteps(s: string): number[] | null {
  const a = String(s).split(/[\s,;]+/).filter(Boolean).map(parseDur);
  return a.length && a.every((x) => x > 0) ? a : null;
}
