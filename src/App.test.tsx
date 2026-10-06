import { render, screen } from '@testing-library/react';
import { App } from './App';
import { createAppStore, setAppStore } from './store/appStore';
import { createMemoryStorage, makeQ } from '../test/fixtures';

beforeEach(() => {
  setAppStore(createAppStore({ storage: createMemoryStorage(), questions: [makeQ(1), makeQ(2)] }));
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
