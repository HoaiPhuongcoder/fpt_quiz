import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StoreApi } from 'zustand';
import { Search } from './Search';
import { createAppStore, setAppStore, type AppState } from '../store/appStore';
import { createMemoryStorage, makeCard, makeQ } from '../../test/fixtures';

let store: StoreApi<AppState>;
beforeEach(() => {
  store = createAppStore({
    storage: createMemoryStorage({ cards: { 1: makeCard({ due: Date.now() + 9e6 }) } }),
    questions: [
      makeQ(1, 1, { q: 'Đại đoàn kết toàn dân tộc', y: 'Giải thích một', s: [2] }),
      makeQ(2, 3, { q: 'Độc lập dân tộc', y: 'Có nhắc đoàn kết' }),
    ],
  });
  setAppStore(store);
});

it('tìm không dấu, hiện đáp án đúng, mở giải thích, nhảy sang câu dễ nhầm', async () => {
  const user = userEvent.setup();
  render(<Search />);
  await user.type(screen.getByLabelText('Từ khóa tìm kiếm'), 'doan ket');
  expect(await screen.findByText('1 câu khớp')).toBeInTheDocument();
  expect(screen.getByText('đoàn kết', { selector: 'mark' })).toBeInTheDocument();
  expect(screen.getByLabelText('Đáp án đúng')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Xem giải thích' }));
  expect(screen.getByText('Giải thích một')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '2' }));
  expect(await screen.findByText('Độc lập dân tộc')).toBeInTheDocument();
});

it('bật tìm trong giải thích và lọc chương', async () => {
  const user = userEvent.setup();
  render(<Search />);
  const input = screen.getByLabelText('Từ khóa tìm kiếm');
  await user.clear(input);
  await user.type(input, 'đoàn kết');
  await user.click(screen.getByLabelText('Tìm cả trong giải thích và mẹo'));
  expect(await screen.findByText('2 câu khớp')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Ch.III' }));
  expect(await screen.findByText('1 câu khớp')).toBeInTheDocument();
});

it('ôn ngay thẻ đã học', async () => {
  const user = userEvent.setup();
  render(<Search />);
  const input = screen.getByLabelText('Từ khóa tìm kiếm');
  await user.clear(input);
  await user.type(input, '#1');
  await user.click(await screen.findByRole('button', { name: 'Ôn ngay' }));
  expect(store.getState().cards[1].due).toBeLessThanOrEqual(Date.now());
});
