import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StoreApi } from 'zustand';
import { Library } from './Library';
import { createAppStore, setAppStore, type AppState } from '../store/appStore';
import { createMemoryStorage, makeCard, makeQ } from '../../test/fixtures';

let store: StoreApi<AppState>;
beforeEach(() => {
  const t = Date.now();
  const cards = { 1: makeCard({ due: t - 1000, log: [[t - 5000, 3, 1440]] }) };
  store = createAppStore({ storage: createMemoryStorage({ cards }), questions: [makeQ(1), makeQ(2)] });
  setAppStore(store);
});

it('lọc thẻ, mở xem lịch sử, đặt lại thẻ', async () => {
  const user = userEvent.setup();
  render(<Library />);
  expect(screen.getByText(/^1 thẻ/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Tất cả' }));
  expect(screen.getByText(/^2 thẻ/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Đã học' }));
  await user.click(screen.getAllByRole('row')[1]);
  expect(screen.getByText('Câu hỏi số 1')).toBeInTheDocument();
  expect(screen.getByText(/^Lịch sử:/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Đặt lại' }));
  expect(store.getState().cards[1]).toBeUndefined();
});

it('tab lịch sắp tới', async () => {
  const user = userEvent.setup();
  render(<Library />);
  await user.click(screen.getByRole('button', { name: 'Lịch sắp tới' }));
  expect(screen.getByText('Đến hạn ngay')).toBeInTheDocument();
  expect(screen.getByText('Chưa học')).toBeInTheDocument();
});
