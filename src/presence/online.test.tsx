import { act, render, screen } from '@testing-library/react';
import { countPresence, setOnlineCount } from './online';
import { OnlineBadge } from '../components/OnlineBadge';
import { createAppStore, setAppStore } from '../store/appStore';
import { createMemoryStorage, makeQ, makeSubject } from '../../test/fixtures';

beforeEach(() => {
  setAppStore(createAppStore({ storage: createMemoryStorage(), subjects: [makeSubject([makeQ(1)])] }));
});
afterEach(() => setOnlineCount(null));

it('đếm mỗi tab một người, môn theo lần báo gần nhất', () => {
  expect(countPresence({
    a: [{ subject: 'hcm202' }],
    b: [{ subject: 'hcm202' }, { subject: 'mln131' }],
    c: [{ subject: 'mln131' }],
    d: [{}],
  })).toEqual({ total: 4, bySubject: { hcm202: 1, mln131: 2 } });
  expect(countPresence({})).toEqual({ total: 0, bySubject: {} });
});

it('chưa kết nối được thì không hiện gì', () => {
  const { container } = render(<OnlineBadge />);
  expect(container).toBeEmptyDOMElement();
});

it('hiện tổng số người đang ôn và số người ôn môn đang chọn', () => {
  render(<OnlineBadge />);
  act(() => setOnlineCount({ total: 23, bySubject: { hcm202: 8, mln131: 15 } }));
  expect(screen.getByRole('status')).toHaveTextContent('23 người đang ôn · 8 người ôn HCM202');
});

it('chỉ có mình thì động viên', () => {
  render(<OnlineBadge />);
  act(() => setOnlineCount({ total: 1, bySubject: { hcm202: 1 } }));
  expect(screen.getByRole('status')).toHaveTextContent('Lúc này chỉ có bạn đang ôn');
});
