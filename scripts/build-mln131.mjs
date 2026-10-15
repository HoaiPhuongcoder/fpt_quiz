// Sinh src/data/mln131.json từ data/mln131.md (đề gốc) + data/mln131.notes.json (chương, giải thích, mẹo).
import { readFileSync, writeFileSync } from 'node:fs';
import { parseQuizMd } from './mdquiz.mjs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const questions = parseQuizMd(read('../data/mln131.md'));
const notes = JSON.parse(read('../data/mln131.notes.json'));

const missing = [];
const out = questions.map((q) => {
  const note = notes[q.n];
  if (!note) missing.push(q.n);
  const w = [q.w, note?.w].filter(Boolean).join(' · ');
  return { n: q.n, q: q.q, o: q.o, a: q.a, c: note?.c ?? 1, s: note?.s ?? [], y: note?.y ?? '', t: note?.t ?? '', ...(w ? { w } : {}) };
});

writeFileSync(new URL('../src/data/mln131.json', import.meta.url), JSON.stringify(out));
console.log(`Đã ghi ${out.length} câu vào src/data/mln131.json`);
if (missing.length) console.warn(`Còn ${missing.length} câu chưa có ghi chú (chương, giải thích): ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '…' : ''}`);
