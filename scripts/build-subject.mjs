// Sinh src/data/<môn>.json từ data/<môn>.md (đề gốc) + data/<môn>.notes.json (chương, giải thích, mẹo).
// Dùng: node scripts/build-subject.mjs mln131
import { readFileSync, writeFileSync } from 'node:fs';
import { parseQuizMd } from './mdquiz.mjs';

const id = process.argv[2];
if (!/^[a-z0-9]+$/.test(id ?? '')) {
  console.error('Dùng: node scripts/build-subject.mjs <mã môn>, ví dụ mln131');
  process.exit(1);
}

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const questions = parseQuizMd(read(`../data/${id}.md`));
const notes = JSON.parse(read(`../data/${id}.notes.json`));

const missing = [];
const out = questions.map((q) => {
  const note = notes[q.n];
  if (!note) missing.push(q.n);
  const w = [q.w, note?.w].filter(Boolean).join(' · ');
  return { n: q.n, q: q.q, o: q.o, a: q.a, c: note?.c ?? 1, s: note?.s ?? [], y: note?.y ?? '', t: note?.t ?? '', ...(w ? { w } : {}) };
});

writeFileSync(new URL(`../src/data/${id}.json`, import.meta.url), JSON.stringify(out));
console.log(`Đã ghi ${out.length} câu vào src/data/${id}.json`);
if (missing.length) console.warn(`Còn ${missing.length} câu chưa có ghi chú (chương): ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '…' : ''}`);
