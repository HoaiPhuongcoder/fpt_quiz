import { fold, highlight, parseQuery, searchQuestions } from './search';
import { QUESTIONS } from '../data/questions';
import { makeQ } from '../../test/fixtures';

describe('fold', () => {
  it('bỏ dấu, đ → d, chữ thường', () => {
    expect(fold('Đoàn Kết TOÀN DÂN')).toBe('doan ket toan dan');
    expect(fold('Cần, kiệm, liêm, chính')).toBe('can, kiem, liem, chinh');
  });
});

describe('parseQuery', () => {
  it('tách từ, giữ nguyên cụm trong ngoặc kép', () => {
    expect(parseQuery('  đảng  "cầm   quyền" ')).toEqual({ terms: ['dang', 'cam quyen'], exact: ['đảng', 'cầm quyền'] });
  });
  it('nhận số câu, có hoặc không có #', () => {
    expect(parseQuery('577').number).toBe(577);
    expect(parseQuery('#42').number).toBe(42);
    expect(parseQuery('577 abc').number).toBeUndefined();
  });
});

describe('searchQuestions', () => {
  const qs = [
    makeQ(1, 1, { q: 'Đại đoàn kết toàn dân tộc là gì?' }),
    makeQ(2, 2, { q: 'Câu khác', o: [['A', 'đoàn kết quốc tế'], ['B', 'x']], a: ['A'] }),
    makeQ(3, 3, { q: 'Không liên quan', y: 'giải thích có đoàn kết' }),
    makeQ(10, 1, { q: 'Câu mười' }),
  ];

  it('không dấu vẫn khớp, ưu tiên khớp trong đề hơn trong phương án', () => {
    expect(searchQuestions(qs, 'doan ket').map((h) => h.q.n)).toEqual([1, 2]);
  });
  it('chỉ tìm trong giải thích khi bật', () => {
    expect(searchQuestions(qs, 'doan ket', { explain: true }).map((h) => h.q.n)).toEqual([1, 2, 3]);
  });
  it('mọi từ phải có mặt', () => {
    expect(searchQuestions(qs, 'đoàn kết quốc tế').map((h) => h.q.n)).toEqual([2]);
  });
  it('lọc theo chương', () => {
    expect(searchQuestions(qs, 'đoàn kết', { chapters: [2] }).map((h) => h.q.n)).toEqual([2]);
  });
  it('gõ số thì câu đó lên đầu', () => {
    expect(searchQuestions(qs, '10')[0].q.n).toBe(10);
  });
  it('truy vấn rỗng trả về rỗng', () => {
    expect(searchQuestions(qs, '   ')).toEqual([]);
  });
  it('chạy trên dữ liệu thật', () => {
    const hits = searchQuestions(QUESTIONS, 'chế độ dân chủ mới', { explain: true });
    expect(hits.some((h) => h.q.n === 264)).toBe(true);
    expect(searchQuestions(QUESTIONS, '577')[0].q.n).toBe(577);
  });
  it('khớp nguyên từ và nguyên cụm được xếp trên khớp một phần chữ', () => {
    expect(searchQuestions(QUESTIONS, 'dan chu moi')[0].q.n).toBe(264);
    expect(searchQuestions(QUESTIONS, 'dan chu moi', { explain: true })[0].q.n).toBe(264);
  });
});

describe('highlight', () => {
  it('đánh dấu đúng đoạn trong chuỗi gốc có dấu', () => {
    expect(highlight('Đại đoàn kết', ['doan ket'])).toEqual([
      { text: 'Đại ', hit: false },
      { text: 'đoàn kết', hit: true },
    ]);
  });
  it('giữ nguyên dấu rời ở dạng NFD', () => {
    const s = 'Đoàn'.normalize('NFD');
    expect(highlight(s, ['doan'])).toEqual([{ text: s, hit: true }]);
  });
  it('ưu tiên tô nguyên từ, không tô vào giữa chữ khác', () => {
    expect(highlight('Đảng dân chủ', ['dan']).filter((p) => p.hit).map((p) => p.text)).toEqual(['dân']);
    expect(highlight('chuyên chính', ['chu']).filter((p) => p.hit).map((p) => p.text)).toEqual(['chu']);
  });
  it('không có từ khóa thì trả nguyên chuỗi', () => {
    expect(highlight('abc', [])).toEqual([{ text: 'abc', hit: false }]);
  });
});
