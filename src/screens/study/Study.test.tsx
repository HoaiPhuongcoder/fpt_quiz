import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StoreApi } from 'zustand';
import { Study } from './Study';
import { createAppStore, setAppStore, type AppState } from '../../store/appStore';
import { createMemoryStorage, makeQ } from '../../../test/fixtures';
import { DEFAULT_CONFIG } from '../../domain/srs';
import type { Question } from '../../domain/types';

let store: StoreApi<AppState>;
function mount(questions: Question[]) {
  store = createAppStore({ storage: createMemoryStorage({ cfg: { ...DEFAULT_CONFIG, order: 'seq' } }), questions });
  setAppStore(store);
  render(<Study />);
}

it('học một thẻ: chọn đáp án → giải thích → chấm → sang thẻ kế', async () => {
  const user = userEvent.setup();
  mount([makeQ(1), makeQ(2, 1, { s: [1] })]);
  expect(screen.getByText('Câu hỏi số 1')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /đáp án đúng 1/ }));
  expect(screen.getByText('Chính xác!')).toBeInTheDocument();
  expect(screen.getByText('Vì sao 1')).toBeInTheDocument();
  expect(screen.getByText('Mẹo 1')).toBeInTheDocument();
  expect(screen.getByText('+10 XP')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /^Được/ }));
  expect(screen.getByText('Câu hỏi số 2')).toBeInTheDocument();
  expect(store.getState().cards[1]).toMatchObject({ st: 'learn' });
});

it('phím tắt: B để chọn, 1 để chấm Lại', async () => {
  const user = userEvent.setup();
  mount([makeQ(1), makeQ(2)]);
  await user.keyboard('b');
  expect(screen.getByText('Chưa đúng. Đáp án: A')).toBeInTheDocument();
  await user.keyboard('1');
  expect(store.getState().cards[1]).toMatchObject({ st: 'learn', step: 0 });
});

it('hết thẻ thì hiện tổng kết phiên', async () => {
  const user = userEvent.setup();
  mount([makeQ(1)]);
  await user.click(screen.getByRole('button', { name: /đáp án đúng 1/ }));
  await user.click(screen.getByRole('button', { name: /^Dễ/ }));
  expect(screen.getByText('Xong phiên học!')).toBeInTheDocument();
  expect(screen.getByText('+10')).toBeInTheDocument();
  expect(screen.getByText('100%')).toBeInTheDocument();
});
