import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync(new URL('../QUIZ.html', import.meta.url), 'utf8');
const line = html.split(/\r?\n/).find((l) => l.startsWith('const DATA='));
if (!line) throw new Error('Không tìm thấy dòng "const DATA=" trong QUIZ.html');
const data = JSON.parse(line.slice('const DATA='.length).replace(/;\s*$/, ''));
mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/data/hcm202.json', import.meta.url), JSON.stringify(data));
console.log(`Đã ghi ${data.length} câu vào src/data/hcm202.json`);
