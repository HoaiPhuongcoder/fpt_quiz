import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StoreApi } from 'zustand';
import { Settings } from './Settings';
import { createAppStore, setAppStore, type AppState } from '../../store/appStore';
import { createMemoryStorage, makeCard, makeQ } from '../../../test/fixtures';

let store: StoreApi<AppState>;
beforeEach(() => {
  store = createAppStore({ storage: createMemoryStorage(), questions: [makeQ(1)] });
  setAppStore(store);
});

it('chọn chế độ Anki mặc định cập nhật cấu hình và form', async () => {
  const user = userEvent.setup();
  render(<Settings />);
  await user.click(screen.getByRole('button', { name: 'Giống Anki mặc định' }));
  expect(store.getState().cfg.preset).toBe('normal');
  expect(screen.getByLabelText('Bước học (thẻ mới)')).toHaveValue('1m 10m');
});

it('nhập tiến độ cũ sau khi xác nhận ghi đè', async () => {
  const user = userEvent.setup();
  render(<Settings />);
  fireEvent.change(screen.getByLabelText('Dữ liệu tiến độ'), { target: { value: JSON.stringify({ v: 2, cards: { 1: makeCard() } }) } });
  await user.click(screen.getByRole('button', { name: 'Nhập' }));
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Ghi đè' }));
  expect(store.getState().cards[1]).toEqual(makeCard());
  expect(screen.getByRole('status')).toHaveTextContent('Đã nhập tiến độ từ bản cũ (QUIZ.html).');
});

it('xóa tiến độ thì ô mục tiêu quay về mặc định', async () => {
  const user = userEvent.setup();
  render(<Settings />);
  const goal = screen.getByLabelText(/Số câu mỗi ngày/);
  fireEvent.change(goal, { target: { value: '200' } });
  fireEvent.blur(goal);
  expect(store.getState().game.goalTarget).toBe(200);
  await user.click(screen.getByRole('button', { name: /Xóa toàn bộ tiến độ/ }));
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xóa hết' }));
  expect(store.getState().game.goalTarget).toBe(50);
  expect(goal).toHaveValue(50);
});
