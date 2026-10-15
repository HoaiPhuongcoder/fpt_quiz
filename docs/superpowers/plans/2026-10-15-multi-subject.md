# Nhiều môn học Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App hỗ trợ nhiều môn (HCM202, MLN131), mỗi môn có thẻ/cài đặt/thi riêng, XP và huy hiệu dùng chung, đổi môn ở header.

**Architecture:** Sổ đăng ký môn (`Subject`) đặt chương, câu hỏi và tiền tố key lưu trữ. Storage đọc/ghi theo môn, `game` dùng chung. Store giữ một môn tại một thời điểm và `switchSubject` nạp môn khác. Router tách mã môn ở đầu hash.

**Tech Stack:** React 19, Zustand 5, Vite 8, Vitest 5, TypeScript, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-10-15-multi-subject-design.md`

## Global Constraints

- HCM202 giữ nguyên key `hcm.v1.*` và id huy hiệu `ch1…ch6`, `all`. Không migrate dữ liệu.
- `game` luôn ở key `hcm.v1.game`.
- Môn mới dùng tiền tố `quiz.v1.<id>`; môn đang chọn lưu ở `quiz.subject`.
- Chữ trên giao diện bằng tiếng Việt, giữ giọng văn hiện có.
- Không đổi thuật toán SRS.
- Mốc test: 133/134 xanh; `Search.test.tsx` timeout 5s trên máy chậm là lỗi có từ trước.

## File Structure

- Create `src/domain/subject.ts`: kiểu `Subject`, `Chapter`, `roman()`, `chapterIds()`.
- Create `src/data/subjects.ts`: `SUBJECTS`, `subjectById()`, dữ liệu chương hai môn.
- Create `src/data/mln131.json` (sinh ra bởi script).
- Create `data/mln131.md`, `data/mln131.notes.json`.
- Create `scripts/mdquiz.mjs` (+ `scripts/mdquiz.d.mts`), `scripts/build-mln131.mjs`, `src/data/mdquiz.test.ts`.
- Create `src/store/nav.ts`: `href`, `go`, `replaceTo`.
- Create `src/components/SubjectSwitcher.tsx`.
- Modify: `domain/types.ts`, `domain/badges.ts`, `domain/exam.ts`, `domain/srs.ts`, `storage/local.ts`, `storage/io.ts`, `store/appStore.ts`, `bootstrap.ts`, `router.ts`, `App.tsx`, `components/AppShell.tsx`, mọi màn hình dùng `CHAPTERS`/`ROMAN`/`'#/…'`, `data/questions.ts` (xóa, thay bằng subjects), `test/fixtures.ts`, các test liên quan, `index.html`, `vite.config.ts`, `gioi-thieu/index.html`, `README.md`, `package.json`.

---

### Task 1: Subject model + parser MLN131

**Files:** Create `src/domain/subject.ts`, `scripts/mdquiz.mjs`, `scripts/mdquiz.d.mts`, `scripts/build-mln131.mjs`, `data/mln131.md`, `data/mln131.notes.json` (`{}`), `src/data/mln131.json`, `src/data/subjects.ts`, `src/data/mdquiz.test.ts`. Modify `package.json` (`"build:mln131": "node scripts/build-mln131.mjs"`), `src/domain/types.ts` (`ChapterId = number`, bỏ `CHAPTERS`/`ROMAN`).

**Interfaces — Produces:**
```ts
export interface Chapter { id: number; title: string }
export interface Subject { id: string; code: string; name: string; chapters: Chapter[]; questions: Question[]; storagePrefix: string }
export function roman(n: number): string;          // 1→'I', 7→'VII'
export function chapterIds(s: Subject): number[];
// scripts/mdquiz.mjs
export function parseQuizMd(text: string): { n: number; q: string; o: [string, string][]; a: string[]; w?: string }[];
// src/data/subjects.ts
export const SUBJECTS: Subject[]; export function subjectById(id: string): Subject | undefined;
```

- [ ] Test `parseQuizMd`: câu thường; lựa chọn `- a.` → `A`; `**Đáp án:** ABC`; `**Đáp án:** a (Nếu không có a chọn c)` → `a: ['A'], w: 'Nếu không có a chọn c'`; `**Đáp án:** A(Câu trả lời khác: …)` (không có dấu cách); đáp án ngoài lựa chọn → throw có số câu.
- [ ] Viết parser theo dòng: `## Câu n` mở câu; dòng `- X. text` thêm lựa chọn; `**Đáp án:**` đọc chuỗi chữ cái đầu và phần ngoặc ngoài cùng; dòng khác nối vào nội dung câu hỏi.
- [ ] `build-mln131.mjs`: đọc `data/mln131.md` + notes, ghép `c` (mặc định 1), `y`, `t` (mặc định ''), `w` (ghi chú gốc + notes.w nối bằng ' · '), `s` (mặc định []), ghi `src/data/mln131.json`, in số câu thiếu notes.
- [ ] `subjects.ts` khai báo HCM202 (6 chương, tiêu đề lấy từ `gioi-thieu/index.html`, `storagePrefix: 'hcm.v1'`) và MLN131 (7 chương, `storagePrefix: 'quiz.v1.mln131'`). Test: 445 câu, mọi `a` nằm trong `o`, `c` thuộc chương của môn.
- [ ] Commit.

### Task 2: Storage theo môn

**Files:** Modify `src/storage/local.ts`, `src/storage/local.test.ts`, `test/fixtures.ts`.

**Interfaces — Produces:**
```ts
export function keyFor(subject: Pick<Subject,'storagePrefix'>, k: SnapshotKey): string; // game → 'hcm.v1.game'
export const ACTIVE_KEY = 'quiz.subject';
export function defaultSnapshot(now: number, chapters: number[]): Snapshot;
export interface AppStorage { load(s: Subject): Snapshot; save(s: Subject, patch: Partial<Snapshot>): void; flush(): void; loadActive(): string | null; saveActive(id: string): void }
// test/fixtures.ts
export function makeSubject(questions: Question[], over?: Partial<Subject>): Subject; // id 'hcm202', chương 1..6
export function createMemoryStorage(initial?: Partial<Snapshot>, now?: number): AppStorage & { saved: Partial<Snapshot>; savedBy: Record<string, Partial<Snapshot>> };
```

- [ ] Test: HCM202 đọc/ghi đúng `hcm.v1.cards`; MLN131 ghi `quiz.v1.mln131.cards`; `game` của cả hai đều là `hcm.v1.game`; lưu dở của môn A rồi lưu môn B → flush ghi đủ cả hai; `cfg.chs` lạ bị lọc, rỗng → mọi chương; `loadActive/saveActive`.
- [ ] Cài đặt: `pending: Record<string, unknown>` theo key thật.
- [ ] Sửa test hiện có theo API mới; commit.

### Task 3: Huy hiệu, thi, cấu hình mặc định theo môn

**Files:** Modify `src/domain/badges.ts`, `src/domain/badges.test.ts`, `src/domain/exam.ts`, `src/domain/exam.test.ts`, `src/domain/srs.ts`.

**Interfaces — Produces:**
```ts
export interface BadgeContext { cards: Cards; subject: Subject; game: GameState; lastExamScore?: number; hour?: number }
export function badgeDefs(subjects: Subject[]): BadgeDef[];
export function evaluateBadges(ctx: BadgeContext, subjects: Subject[]): string[];
export function defaultExamConfig(chapters: number[]): ExamConfig;
// DEFAULT_CONFIG.chs = [] (storage điền theo môn)
```

- [ ] Test: id HCM202 `ch1…ch6`, `all`; MLN131 `mln131:ch1…ch7`, `mln131:all`; tên "HCM202 · Thuộc Chương I"; huy hiệu chương của môn khác không mở khi ctx là HCM202; tổng = 14 chung + (6+1) + (7+1).
- [ ] Cài đặt, sửa test, commit.

### Task 4: Store đa môn + xuất/nhập v4

**Files:** Modify `src/store/appStore.ts`, `src/store/appStore.test.ts`, `src/storage/io.ts`, `src/storage/io.test.ts`, `src/bootstrap.ts`, `src/bootstrap.test.ts`, các test màn hình gọi `createAppStore`.

**Interfaces — Produces:**
```ts
export interface AppDeps { storage: AppStorage; subjects: Subject[]; initialSubject?: string; now?: () => number; rand?: Rng }
// AppState thêm: subject: Subject; subjects: Subject[]; badges: BadgeDef[]; switchSubject(id: string): void; resetSubject(): void (thay resetAll)
// io.ts
export interface SubjectData { cards: Cards; cfg: SrsConfig; examHistory: ExamResult[] }
export function exportAll(game: GameState, subjects: Record<string, SubjectData>): string; // {app:'fpt-quiz', v:4, ...}
export type ImportResult = { ok: true; game?: GameState; subjects: Record<string, Partial<SubjectData>>; legacy: boolean } | { ok: false; error: string };
export function parseImport(text: string, current: { game: GameState; cfgFor(id: string): SrsConfig }): ImportResult;
```

- [ ] Test store: `switchSubject('mln131')` đổi `questions`, `cards`, giữ `game.xp`, gọi `saveActive`; không ghi dữ liệu môn mới khi vừa đổi; chấm thẻ sau khi đổi ghi vào môn mới; id lạ bỏ qua; `resetSubject` giữ XP.
- [ ] Test io: v4 khứ hồi; v3 → `subjects.hcm202`; bản cũ → `subjects.hcm202`, không có `game`; mã môn lạ bị bỏ.
- [ ] Cài đặt; bootstrap dùng `SUBJECTS`; cập nhật test màn hình sang `subjects: [makeSubject(...)]`; commit.

### Task 5: Router, nav, switcher, màn hình

**Files:** Modify `src/router.ts`, `src/router.test.ts`, `src/App.tsx`, `src/App.test.tsx`, `src/components/AppShell.tsx`, các màn hình. Create `src/store/nav.ts`, `src/components/SubjectSwitcher.tsx`.

**Interfaces — Produces:**
```ts
export interface Route { subject?: string; name: RouteName; param?: string }
export function parseHash(hash: string, subjectIds?: readonly string[]): Route;
export function routePath(r: Route): string; // ngược của parseHash, không có mã môn: '/hoc', '/ket-qua/x', '/'
// nav.ts
export function href(path: string): string;   // '#/<subject><path>'
export function go(path: string): void; export function replaceTo(path: string): void;
```

- [ ] Test router: `#/mln131/hoc` → `{subject:'mln131', name:'study'}`; `#/hoc` không có subject; `#/mln131` → home; `#/xyz/hoc` → home (không coi `xyz` là môn).
- [ ] Thay mọi `'#/…'` bằng `href/go/replaceTo`; chip chương đọc `subject.chapters`; `roman()` thay `ROMAN`; `BADGES` → `useApp(s => s.badges)`; Vì sao/Mẹo ẩn khi rỗng.
- [ ] `App`: đồng bộ route ↔ môn; `key={subject.id}`; `document.title`.
- [ ] `SubjectSwitcher` + test App: bấm đổi sang MLN131 → hash `#/mln131/`, tiêu đề đổi.
- [ ] Settings: nút "Xóa tiến độ môn này", tên file tải mới; commit.

### Task 6: Nội dung MLN131 (chương, Vì sao, Mẹo, Câu dễ nhầm)

**Files:** Modify `data/mln131.notes.json`, `src/data/mln131.json` (chạy lại script).

- [ ] Soạn theo đợt ~60–90 câu, mỗi câu `{c, y, t}` (+ `s` cho câu gần trùng, + `w` nếu cần), đối chiếu giáo trình CNXHKH 2021.
- [ ] `npm run build:mln131` → 0 câu thiếu notes; test dữ liệu xanh; commit mỗi đợt.

### Task 7: Văn bản tĩnh + kiểm tra cuối

**Files:** Modify `index.html`, `vite.config.ts` (manifest), `gioi-thieu/index.html`, `README.md`.

- [ ] Đổi tên chung "Ôn thi trắc nghiệm FPT", liệt kê hai môn và chương MLN131.
- [ ] `npm test`, `npm run build`, chạy dev server, kiểm tra hai môn (học, thi, tìm kiếm, đổi môn, giữ tiến độ HCM202 cũ). Commit.
