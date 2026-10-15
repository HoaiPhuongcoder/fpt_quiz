import { parseQuizMd } from '../../scripts/mdquiz.mjs';

const md = (body: string) => `# MLN131\n\nTổng số thẻ: 1\n\n${body}`;

describe('parseQuizMd', () => {
  it('đọc câu thường', () => {
    const r = parseQuizMd(md('## Câu 1\n\nHỏi gì?\n\n- A. Một\n- B. Hai\n\n**Đáp án:** B\n'));
    expect(r).toEqual([{ n: 1, q: 'Hỏi gì?', o: [['A', 'Một'], ['B', 'Hai']], a: ['B'] }]);
  });
  it('lựa chọn và đáp án chữ thường thành chữ hoa, ghi chú thành w', () => {
    const r = parseQuizMd(md('## Câu 2\n\nHỏi?\n\n- a. Một\n- b. Hai\n- c. Ba\n\n**Đáp án:** a (Nếu không có a chọn c)\n'));
    expect(r[0]).toMatchObject({ o: [['A', 'Một'], ['B', 'Hai'], ['C', 'Ba']], a: ['A'], w: 'Nếu không có a chọn c' });
  });
  it('nhiều đáp án, ghi chú dính liền không có dấu cách', () => {
    const r = parseQuizMd(md('## Câu 3\n\nHỏi?\n\n- A. x\n- B. y\n- C. z\n\n**Đáp án:** ABC\n\n## Câu 4\n\nHỏi?\n\n- A. x\n- B. y\n\n**Đáp án:** A(Câu trả lời khác: y)\n'));
    expect(r[0].a).toEqual(['A', 'B', 'C']);
    expect(r[1]).toMatchObject({ a: ['A'], w: 'Câu trả lời khác: y' });
  });
  it('bỏ số điện thoại rác trong câu hỏi, nối câu hỏi nhiều dòng', () => {
    const r = parseQuizMd(md('## Câu 5\n\nDòng một\ndòng hai?(073-356- 8678)\n\n- A. x\n\n**Đáp án:** A\n\n## Câu 6\n\nHỏi?(073- 356-8678)\n\n- A. x\n\n**Đáp án:** A\n'));
    expect(r[0].q).toBe('Dòng một dòng hai?');
    expect(r[1].q).toBe('Hỏi?');
  });
  it('đáp án không có trong lựa chọn thì báo lỗi kèm số câu', () => {
    expect(() => parseQuizMd(md('## Câu 9\n\nHỏi?\n\n- A. x\n- B. y\n\n**Đáp án:** D\n'))).toThrow('Câu 9');
  });
});
