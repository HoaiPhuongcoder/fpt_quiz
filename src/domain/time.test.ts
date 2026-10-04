import { DAY, clock, dayKey, durTxt, endOfDay, fmt, lastNDays, parseDur, parseSteps, prevDayKey } from './time';
import { mulberry32 } from './random';

describe('khóa ngày', () => {
  it('dayKey theo giờ máy, có số 0 đầu', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
  });
  it('prevDayKey qua đầu tháng và đầu năm', () => {
    expect(prevDayKey('2026-03-01')).toBe('2026-02-28');
    expect(prevDayKey('2026-01-01')).toBe('2025-12-31');
  });
  it('lastNDays trả về n ngày, cũ trước mới sau', () => {
    expect(lastNDays('2026-10-02', 3)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });
  it('endOfDay là 23:59:59.999 cùng ngày', () => {
    const e = new Date(endOfDay(new Date(2026, 9, 4, 8).getTime()));
    expect([e.getDate(), e.getHours(), e.getMinutes(), e.getSeconds()]).toEqual([4, 23, 59, 59]);
  });
});

describe('định dạng thời lượng (giống QUIZ.html)', () => {
  it('fmt', () => {
    expect(fmt(0.5)).toBe('< 1 phút');
    expect(fmt(10)).toBe('10 phút');
    expect(fmt(90)).toBe('1.5 giờ');
    expect(fmt(DAY * 4)).toBe('4 ngày');
    expect(fmt(DAY * 60)).toBe('2 tháng');
    expect(fmt(DAY * 730)).toBe('2 năm');
  });
  it('durTxt', () => {
    expect(durTxt(10)).toBe('10m');
    expect(durTxt(60)).toBe('1h');
    expect(durTxt(DAY * 4)).toBe('4d');
  });
  it('parseDur', () => {
    expect(parseDur('10')).toBe(10);
    expect(parseDur('1h')).toBe(60);
    expect(parseDur('1,5h')).toBe(90);
    expect(parseDur('2 ngày')).toBe(2880);
    expect(parseDur('abc')).toBeNaN();
  });
  it('parseSteps', () => {
    expect(parseSteps('1m 10m 1h')).toEqual([1, 10, 60]);
    expect(parseSteps('1m x')).toBeNull();
    expect(parseSteps('')).toBeNull();
  });
  it('clock gắn hôm nay / ngày mai', () => {
    const now = new Date(2026, 9, 4, 10, 0).getTime();
    expect(clock(new Date(2026, 9, 4, 21, 40).getTime(), now)).toMatch(/21.40 hôm nay$/);
    expect(clock(new Date(2026, 9, 5, 7, 5).getTime(), now)).toMatch(/07.05 ngày mai$/);
  });
});

describe('mulberry32', () => {
  it('cùng seed cho cùng dãy số trong [0, 1)', () => {
    const a = mulberry32(42), b = mulberry32(42);
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
  });
});
