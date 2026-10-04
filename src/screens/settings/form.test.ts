import { fromForm, toForm } from './form';
import { DEFAULT_CONFIG, presetParams } from '../../domain/srs';

describe('form cài đặt', () => {
  it('chuyển cấu hình sang chữ', () => {
    expect(toForm(DEFAULT_CONFIG)).toMatchObject({ steps: '1m 10m 1h', relearn: '10m', grad: '4h', easy: '1d', cap: '2d', minLapse: '1h', startEase: '250', lapsePct: '30', newPerDay: '80' });
  });
  it('đọc lại form cho đúng thông số, đánh dấu là tùy chỉnh', () => {
    const r = fromForm(toForm(DEFAULT_CONFIG));
    expect(r).toEqual({ ok: true, patch: { preset: 'custom', ...presetParams('cram'), newPerDay: 80 } });
  });
  it('ô thời gian sai dạng thì báo lỗi', () => {
    expect(fromForm({ ...toForm(DEFAULT_CONFIG), steps: '1m abc' }).ok).toBe(false);
    expect(fromForm({ ...toForm(DEFAULT_CONFIG), grad: '0' }).ok).toBe(false);
  });
});
