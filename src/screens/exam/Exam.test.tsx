import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StoreApi } from 'zustand';
import { Exam } from './Exam';
import { ExamSetup } from './ExamSetup';
import { ExamResultScreen } from './ExamResult';
import { createAppStore, setAppStore, type AppState } from '../../store/appStore';
import { createMemoryStorage, makeQ } from '../../../test/fixtures';
import { DEFAULT_EXAM_CONFIG } from '../../domain/exam';

let store: StoreApi<AppState>;
const cfg = { ...DEFAULT_EXAM_CONFIG, count: 3, shuffleOptions: false };

beforeEach(() => {
  store = createAppStore({ storage: createMemoryStorage(), questions: [makeQ(1), makeQ(2), makeQ(3)] });
  setAppStore(store);
});

it('thiết lập: bấm Bắt đầu thi thì tạo đề và chuyển sang màn làm bài', async () => {
  const user = userEvent.setup();
  render(<ExamSetup />);
  await user.click(screen.getByRole('button', { name: 'Bắt đầu thi' }));
  expect(store.getState().examCurrent?.items).toHaveLength(3);
  expect(window.location.hash).toBe('#/lam-bai');
});

it('làm bài 3 câu và nộp: chuyển sang trang kết quả', async () => {
  store.getState().startExam(cfg);
  const user = userEvent.setup();
  render(<Exam />);
  expect(screen.getByText('CÂU 1 / 3')).toBeInTheDocument();
  for (let i = 0; i < 3; i++) {
    await user.click(screen.getByRole('button', { name: /đáp án đúng/ }));
    if (i < 2) await user.click(screen.getByRole('button', { name: 'Sau' }));
  }
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  const r = store.getState().examHistory[0];
  expect(r).toMatchObject({ correct: 3, total: 3, score10: 10 });
  expect(window.location.hash).toBe(`#/ket-qua/${r.id}`);
});

it('còn câu chưa làm thì hỏi xác nhận trước khi nộp', async () => {
  store.getState().startExam(cfg);
  const user = userEvent.setup();
  render(<Exam />);
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  const dialog = screen.getByRole('alertdialog');
  expect(within(dialog).getByText(/Còn 3 câu chưa làm/)).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: 'Nộp bài' }));
  expect(store.getState().examHistory[0].correct).toBe(0);
});

it('trang kết quả: điểm, số câu sai, danh sách xem lại', () => {
  store.getState().startExam(cfg);
  const r = store.getState().submitExam()!;
  render(<ExamResultScreen id={r.id} />);
  expect(screen.getByText('0/3 đúng')).toBeInTheDocument();
  expect(screen.getByText('3 câu sai')).toBeInTheDocument();
  expect(screen.getAllByText('Bỏ trống')).toHaveLength(3);
});

it('kết quả không tồn tại', () => {
  render(<ExamResultScreen id="khong-co" />);
  expect(screen.getByText('Không tìm thấy kết quả này.')).toBeInTheDocument();
});
