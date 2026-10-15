import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createAppStore, setAppStore } from './store/appStore';
import { createMemoryStorage, makeQ, makeSubject } from '../test/fixtures';

const MLN = makeSubject([makeQ(1, 1, { q: 'Câu MLN' })], { id: 'mln131', code: 'MLN131', name: 'CNXHKH', storagePrefix: 'quiz.v1.mln131' });

beforeEach(() => {
  location.hash = '';
  setAppStore(createAppStore({ storage: createMemoryStorage(), subjects: [makeSubject([makeQ(1), makeQ(2)]), MLN] }));
});

it('hiện trang chủ với 5 tab điều hướng', () => {
  render(<App />);
  for (const name of ['Trang chủ', 'Thi thử', 'Thư viện', 'Tìm kiếm', 'Hồ sơ']) {
    expect(screen.getByRole('link', { name })).toBeInTheDocument();
  }
  expect(screen.getByText('Sẵn sàng')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Bắt đầu học/ })).toBeInTheDocument();
  expect(screen.getByText('Có 2 thẻ đang chờ')).toBeInTheDocument();
});

it('link cũ không có mã môn được đổi sang có mã môn; tab trỏ đúng môn', async () => {
  location.hash = '#/thu-vien';
  render(<App />);
  await act(async () => {});
  expect(location.hash).toBe('#/hcm202/thu-vien');
  expect(screen.getByRole('link', { name: 'Thi thử' })).toHaveAttribute('href', '#/hcm202/thi');
  expect(document.title).toBe('Ôn HCM202');
});

it('đổi môn bằng nút ở header: ở lại cùng tab, tiêu đề và câu hỏi theo môn mới', async () => {
  const user = userEvent.setup();
  location.hash = '#/hcm202/';
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Đổi môn, đang học HCM202/ }));
  await user.click(screen.getByRole('menuitemradio', { name: /MLN131/ }));
  expect(location.hash).toBe('#/mln131/');
  expect(await screen.findByRole('button', { name: /Đổi môn, đang học MLN131/ })).toBeInTheDocument();
  expect(document.title).toBe('Ôn MLN131');
  expect(screen.getByText('Có 1 thẻ đang chờ')).toBeInTheDocument();
});

it('mở link có mã môn khác thì chuyển sang môn đó', async () => {
  location.hash = '#/mln131/thu-vien';
  render(<App />);
  expect(await screen.findByRole('button', { name: /đang học MLN131/ })).toBeInTheDocument();
});
