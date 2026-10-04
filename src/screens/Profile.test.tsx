import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profile } from './Profile';
import { createAppStore, setAppStore } from '../store/appStore';
import { createMemoryStorage, makeQ } from '../../test/fixtures';
import { freshGame } from '../domain/gamify';

it('hiện cấp độ, 20 huy hiệu và huy hiệu đã mở', () => {
  const game = { ...freshGame(), xp: 120, badges: { night: 1 } };
  setAppStore(createAppStore({ storage: createMemoryStorage({ game }), questions: [makeQ(1)] }));
  render(<Profile />);
  expect(screen.getByRole('heading', { name: 'Tân binh' })).toBeInTheDocument();
  expect(screen.getAllByTestId('badge')).toHaveLength(20);
  expect(screen.getByTitle('Ôn bài trong khoảng 23:00–03:59')).toHaveAttribute('data-unlocked', 'true');
  expect(screen.getByTitle('Học 3 ngày liên tiếp')).toHaveAttribute('data-unlocked', 'false');
  expect(screen.getByRole('link', { name: 'Cài đặt' })).toHaveAttribute('href', '#/cai-dat');
});

it('bấm vào huy hiệu chưa mở thì hiện điều kiện', async () => {
  setAppStore(createAppStore({ storage: createMemoryStorage(), questions: [makeQ(1)] }));
  render(<Profile />);
  await userEvent.setup().click(screen.getByRole('button', { name: /Chuỗi 3 ngày/ }));
  expect(screen.getByRole('status')).toHaveTextContent('Học 3 ngày liên tiếp');
  expect(screen.getByRole('status')).toHaveTextContent('chưa mở');
});
