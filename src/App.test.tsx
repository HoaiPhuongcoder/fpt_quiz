import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createAppStore, setAppStore } from './store/appStore';
import { createMemoryStorage, makeQ, makeSubject } from '../test/fixtures';

const MLN = makeSubject([makeQ(1, 1, { q: 'Câu MLN' })], { id: 'mln131', code: 'MLN131', name: 'CNXHKH', storagePrefix: 'quiz.v1.mln131' });

const go = (path: string) => history.replaceState(null, '', path);

beforeEach(() => {
  go('/');
  localStorage.setItem('onthi.aboutSeen.v1', '1');
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
  go('/thu-vien');
  render(<App />);
  await act(async () => {});
  expect(location.pathname).toBe('/hcm202/thu-vien');
  expect(screen.getByRole('link', { name: 'Thi thử' })).toHaveAttribute('href', '/hcm202/thi');
  expect(document.title).toBe('Ôn HCM202');
});

it('đổi môn bằng thanh chọn môn ở đầu trang: ở lại cùng tab, tiêu đề và câu hỏi theo môn mới', async () => {
  const user = userEvent.setup();
  go('/hcm202/');
  render(<App />);
  expect(screen.getByRole('radio', { name: /HCM202/ })).toBeChecked();
  await user.click(screen.getByRole('radio', { name: /MLN131/ }));
  expect(location.pathname).toBe('/mln131/');
  expect(await screen.findByRole('radio', { name: /MLN131/, checked: true })).toBeInTheDocument();
  expect(document.title).toBe('Ôn MLN131');
  expect(screen.getByText('Có 1 thẻ đang chờ')).toBeInTheDocument();
});

it('mở link có mã môn khác thì chuyển sang môn đó', async () => {
  go('/mln131/thu-vien');
  render(<App />);
  expect(await screen.findByRole('radio', { name: /MLN131/, checked: true })).toBeInTheDocument();
});

it('nút mời cà phê ở chân trang mở hộp có mã QR, Esc để đóng', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Mời mình ly cà phê' }));
  const dialog = screen.getByRole('dialog', { name: /Mời mình một ly cà phê/ });
  expect(dialog).toContainElement(screen.getByRole('img', { name: /Mã QR chuyển khoản/ }));
  expect(screen.getByRole('button', { name: 'Đóng' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('trang chủ có bong bóng cà phê bay, bấm mở hộp ủng hộ; bấm X thì ẩn trong lần vào web này', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  await user.click(screen.getByRole('button', { name: /Thấy web có ích\? Mời mình ly cà phê/ }));
  expect(screen.getByRole('dialog', { name: /Mời mình một ly cà phê/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Đóng' }));
  await user.click(screen.getByRole('button', { name: 'Ẩn lời mời cà phê' }));
  expect(screen.queryByRole('button', { name: /Thấy web có ích/ })).not.toBeInTheDocument();
  unmount();
  render(<App />);
  expect(screen.queryByRole('button', { name: /Thấy web có ích/ })).not.toBeInTheDocument();
});

it('bong bóng cà phê chỉ hiện ở trang chủ', async () => {
  go('/hcm202/thu-vien');
  render(<App />);
  await act(async () => {});
  expect(screen.queryByRole('button', { name: /Thấy web có ích/ })).not.toBeInTheDocument();
});

it('bấm tab chuyển trang tại chỗ, không tải lại; nút quay lại của trình duyệt vẫn chạy', async () => {
  const user = userEvent.setup();
  go('/hcm202/');
  render(<App />);
  await user.click(screen.getByRole('link', { name: 'Thư viện' }));
  expect(location.pathname).toBe('/hcm202/thu-vien');
  expect(screen.getByRole('link', { name: 'Thư viện' })).toHaveAttribute('aria-current', 'page');
  await act(async () => {
    history.back();
    await new Promise((r) => window.addEventListener('popstate', r, { once: true }));
  });
  expect(location.pathname).toBe('/hcm202/');
  expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('aria-current', 'page');
});

it('lần đầu vào web tự mở hộp giới thiệu có miễn trừ trách nhiệm; đóng rồi thì lần sau không tự mở', async () => {
  const user = userEvent.setup();
  localStorage.removeItem('onthi.aboutSeen.v1');
  const { unmount } = render(<App />);
  const dialog = screen.getByRole('dialog', { name: /Chào mừng đến Ôn thi FPT/ });
  expect(dialog).toHaveTextContent('Miễn trừ trách nhiệm');
  expect(dialog).toHaveTextContent('không phải sản phẩm chính thức');
  await user.click(screen.getByRole('button', { name: 'Mình đã hiểu, vào ôn thôi' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  unmount();
  render(<App />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Giới thiệu' }));
  expect(screen.getByRole('dialog', { name: /Chào mừng/ })).toBeInTheDocument();
});
