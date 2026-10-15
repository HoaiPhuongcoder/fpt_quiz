// Đọc ngân hàng câu hỏi dạng Markdown:
//   ## Câu 12
//   Nội dung câu hỏi (có thể nhiều dòng)
//   - A. Lựa chọn          (chấp nhận cả "- a.")
//   **Đáp án:** AB (ghi chú tùy chọn)

const SPAM = /\s*\(\d{3}-\s?\d{3}-\s?\d{4}\)/g;
const clean = (s) => s.replace(SPAM, '').replace(/\s+/g, ' ').trim();

/** Tách "AB (ghi chú)" / "A(ghi chú)" thành đáp án và ghi chú. */
function parseAnswer(raw, n) {
  const m = raw.trim().match(/^([A-Ea-e]+)\s*(?:\((.*)\))?\s*$/s);
  if (!m) throw new Error(`Câu ${n}: không đọc được đáp án "${raw}"`);
  return { a: [...new Set(m[1].toUpperCase())], w: m[2] ? clean(m[2]) : undefined };
}

export function parseQuizMd(text) {
  const out = [];
  let cur = null;
  const finish = () => {
    if (!cur) return;
    if (!cur.a) throw new Error(`Câu ${cur.n}: thiếu đáp án`);
    const keys = cur.o.map(([k]) => k);
    for (const a of cur.a) if (!keys.includes(a)) throw new Error(`Câu ${cur.n}: đáp án ${a} không có trong lựa chọn`);
    const q = { n: cur.n, q: clean(cur.q.join(' ')), o: cur.o, a: cur.a };
    if (cur.w) q.w = cur.w;
    out.push(q);
    cur = null;
  };
  for (const line of text.split(/\r?\n/)) {
    const head = line.match(/^##\s+Câu\s+(\d+)\s*$/);
    if (head) { finish(); cur = { n: Number(head[1]), q: [], o: [] }; continue; }
    if (!cur) continue;
    const opt = line.match(/^-\s+([A-Ea-e])\.\s*(.*)$/);
    if (opt) { cur.o.push([opt[1].toUpperCase(), clean(opt[2])]); continue; }
    const ans = line.match(/^\*\*Đáp án:\*\*\s*(.*)$/);
    if (ans) { Object.assign(cur, parseAnswer(ans[1], cur.n)); continue; }
    if (line.trim()) {
      if (cur.o.length) cur.o[cur.o.length - 1][1] = clean(`${cur.o[cur.o.length - 1][1]} ${line}`);
      else cur.q.push(line);
    }
  }
  finish();
  return out;
}
