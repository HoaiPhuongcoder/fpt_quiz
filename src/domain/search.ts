import type { ChapterId, Question } from './types';

/** Bỏ dấu tiếng Việt + chữ thường, để gõ "doan ket" vẫn khớp "Đoàn kết". */
const lower = (s: string) => s.normalize('NFC').toLowerCase();

export function fold(s: string): string {
  return foldMap(s).text;
}

/** Như fold nhưng kèm bảng ánh xạ: map[i] = vị trí trong chuỗi gốc của ký tự thứ i sau khi fold. */
function foldMap(s: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const f = s[i].normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
    for (const ch of f) {
      text += ch;
      map.push(i);
    }
  }
  return { text, map };
}

export interface ParsedQuery {
  /** Các cụm cần có (đã fold). Cụm trong "ngoặc kép" được giữ nguyên cả cụm. */
  terms: string[];
  /** Cùng các cụm đó nhưng giữ nguyên dấu (chữ thường), để ưu tiên câu khớp đúng dấu. */
  exact: string[];
  /** Nếu gõ toàn số (vd "577" hoặc "#577") thì tìm theo số câu. */
  number?: number;
}

export function parseQuery(raw: string): ParsedQuery {
  const q = raw.trim();
  const num = /^#?(\d{1,4})$/.exec(q);
  const terms: string[] = [];
  const exact: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q))) {
    const raw = (m[1] ?? m[2]).trim().replace(/\s+/g, ' ');
    const t = fold(raw);
    if (t && t !== '#') { terms.push(t); exact.push(lower(raw)); }
  }
  return num ? { terms, exact, number: Number(num[1]) } : { terms, exact };
}

export interface SearchOptions {
  /** Chỉ tìm trong các chương này (rỗng / không truyền = tất cả). */
  chapters?: ChapterId[];
  /** Tìm cả trong phần giải thích, mẹo, ghi chú lệch giáo trình. */
  explain?: boolean;
}

export interface SearchHit {
  q: Question;
  score: number;
}

interface Indexed {
  q: Question;
  question: string;
  right: string;
  wrong: string;
  explain: string;
  /** Toàn bộ chữ của câu, giữ dấu, chữ thường. */
  raw: string;
}

const cache = new WeakMap<Question[], Indexed[]>();

function indexOf(questions: Question[]): Indexed[] {
  let idx = cache.get(questions);
  if (!idx) {
    idx = questions.map((q) => ({
      q,
      question: fold(q.q),
      right: fold(q.o.filter(([k]) => q.a.includes(k)).map(([, t]) => t).join(' | ')),
      wrong: fold(q.o.filter(([k]) => !q.a.includes(k)).map(([, t]) => t).join(' | ')),
      explain: fold([q.y, q.t, q.w ?? ''].join(' | ')),
      raw: lower([q.q, ...q.o.map(([, t]) => t), q.y, q.t, q.w ?? ''].join(' | ')),
    }));
    cache.set(questions, idx);
  }
  return idx;
}

const isWordChar = (c: string | undefined) => !!c && /[a-z0-9]/.test(c);

/** 2 nếu khớp nguyên từ, 1 nếu chỉ khớp một phần chữ (vd "chu" trong "chuyen"), 0 nếu không khớp. */
function matchWeight(text: string, term: string): number {
  let best = 0;
  for (let i = text.indexOf(term); i !== -1; i = text.indexOf(term, i + 1)) {
    if (!isWordChar(text[i - 1]) && !isWordChar(text[i + term.length])) return 2;
    best = 1;
  }
  return best;
}

/**
 * Tìm câu hỏi: mọi cụm từ đều phải xuất hiện (trong đề, các phương án, hoặc giải thích nếu bật).
 * Xếp hạng: khớp số câu > khớp trong đề > khớp đáp án đúng > khớp phương án sai > khớp giải thích.
 */
export function searchQuestions(questions: Question[], raw: string, opts: SearchOptions = {}): SearchHit[] {
  const { terms, exact, number } = parseQuery(raw);
  // Từ khóa nào gõ có dấu thì ưu tiên câu khớp đúng dấu (vd "mới" không lẫn với "mọi").
  const accented = exact.filter((e, i) => e !== terms[i]);
  if (!terms.length) return [];
  const chs = opts.chapters?.length ? new Set(opts.chapters) : null;
  const hits: SearchHit[] = [];
  for (const it of indexOf(questions)) {
    if (chs && !chs.has(it.q.c)) continue;
    if (number !== undefined && it.q.n === number) {
      hits.push({ q: it.q, score: 1e6 });
      continue;
    }
    const fields: [string, number][] = [[it.question, 8], [it.right, 4], [it.wrong, 2]];
    if (opts.explain) fields.push([it.explain, 1]);
    let score = 0;
    let ok = true;
    for (const t of terms) {
      let s = 0;
      for (const [text, w] of fields) s += w * matchWeight(text, t);
      if (!s) { ok = false; break; }
      score += s;
    }
    if (!ok) continue;
    // Cả cụm truy vấn nằm liền nhau trong một phần nào đó → ưu tiên mạnh.
    if (terms.length > 1) {
      const whole = terms.join(' ');
      for (const [text, w] of fields) score += 10 * w * matchWeight(text, whole);
    }
    for (const e of accented) if (it.raw.includes(e)) score += 6;
    hits.push({ q: it.q, score });
  }
  return hits.sort((a, b) => b.score - a.score || a.q.n - b.q.n);
}

/** Cắt chuỗi gốc thành các đoạn, đánh dấu đoạn khớp với cụm tìm kiếm (so khớp không dấu). */
export function highlight(text: string, terms: string[]): { text: string; hit: boolean }[] {
  if (!terms.length) return [{ text, hit: false }];
  const { text: f, map } = foldMap(text);
  const mark = new Uint8Array(text.length);
  for (const t of terms) {
    const found: number[] = [];
    for (let i = f.indexOf(t); i !== -1; i = f.indexOf(t, i + t.length)) found.push(i);
    // Có chỗ khớp nguyên từ thì chỉ tô những chỗ đó ("dan" không tô vào giữa "Đảng").
    const whole = found.filter((i) => !isWordChar(f[i - 1]) && !isWordChar(f[i + t.length]));
    for (const i of whole.length ? whole : found) {
      const a = map[i];
      let b = map[i + t.length - 1];
      // Văn bản dạng tổ hợp (NFD): kéo theo các dấu rời phía sau để không cắt đôi một chữ.
      while (b + 1 < text.length && /[̀-ͯ]/.test(text[b + 1])) b++;
      for (let k = a; k <= b; k++) mark[k] = 1;
    }
  }
  // Nối các đoạn khớp chỉ cách nhau khoảng trắng ("đoàn" + " " + "kết" → "đoàn kết").
  for (let i = 1; i < text.length; i++) {
    if (mark[i] || !mark[i - 1]) continue;
    let j = i;
    while (j < text.length && !mark[j] && /\s/.test(text[j])) j++;
    if (j < text.length && mark[j] && j > i) mark.fill(1, i, j);
  }
  const out: { text: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; ) {
    const hit = mark[i] === 1;
    let j = i;
    while (j < text.length && (mark[j] === 1) === hit) j++;
    out.push({ text: text.slice(i, j), hit });
    i = j;
  }
  return out;
}
