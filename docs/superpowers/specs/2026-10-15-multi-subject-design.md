# Nhiều môn học (HCM202 + MLN131) — Thiết kế

Ngày: 2026-10-15 · Trạng thái: đã duyệt

## 1. Mục tiêu

App hiện chỉ có HCM202 (645 câu, 6 chương). Thêm khả năng có **nhiều môn**, môn đầu tiên thêm vào là **MLN131 – Chủ nghĩa xã hội khoa học** (445 câu, 7 chương theo giáo trình CNXHKH 2021).

Đã chốt với người dùng:

- **Chương MLN131:** Claude tự gán 445 câu vào 7 chương của giáo trình.
- **Giải thích MLN131:** Claude viết "Vì sao" và "Mẹo" cho từng câu dựa trên giáo trình; ghi chú trong đáp án gốc chuyển thành "Lưu ý".
- **Tiến độ:** thẻ SRS, cài đặt, bộ đếm ngày, bài thi đang làm và lịch sử thi **riêng từng môn**. XP, cấp, chuỗi ngày, mục tiêu ngày, huy hiệu **dùng chung**.
- **Chọn môn:** nút đổi môn ở header, nhớ môn đã chọn, URL có mã môn (`#/mln131/hoc`).

### Ngoài phạm vi

- Tải dữ liệu môn theo yêu cầu (lazy load). Hai môn ~600KB JSON, nhập tĩnh là đủ.
- Trang quản trị câu hỏi, thêm môn từ giao diện.

## 2. 7 chương MLN131

1. Nhập môn chủ nghĩa xã hội khoa học
2. Sứ mệnh lịch sử của giai cấp công nhân
3. Chủ nghĩa xã hội và thời kỳ quá độ lên chủ nghĩa xã hội
4. Dân chủ xã hội chủ nghĩa và Nhà nước xã hội chủ nghĩa
5. Cơ cấu xã hội – giai cấp và liên minh giai cấp, tầng lớp trong thời kỳ quá độ lên CNXH
6. Vấn đề dân tộc và tôn giáo trong thời kỳ quá độ lên CNXH
7. Vấn đề gia đình trong thời kỳ quá độ lên CNXH

## 3. Dữ liệu môn

`src/domain/subject.ts`:

```ts
export interface Chapter { id: number; title: string }
export interface Subject {
  id: string;            // 'hcm202' | 'mln131', dùng trong URL
  code: string;          // 'HCM202'
  name: string;          // 'Tư tưởng Hồ Chí Minh'
  chapters: Chapter[];
  questions: Question[];
  storagePrefix: string; // 'hcm.v1' cho HCM202 (giữ key cũ), 'quiz.v1.mln131'
}
export const roman = (n: number) => ...;
```

`src/data/subjects.ts` khai báo `SUBJECTS: Subject[]` và `subjectById(id)`. `ChapterId` đổi thành `number`; bỏ hằng `CHAPTERS`/`ROMAN` toàn cục, mọi nơi đọc chương từ môn hiện tại.

## 4. Nguồn dữ liệu MLN131

- `data/mln131.md`: bản sao file người dùng cung cấp (nguồn gốc, không sửa tay).
- `data/mln131.notes.json`: `{ [n]: { c, y, t, w?, s? } }` do Claude soạn. Người dùng có thể sửa file này.
- `scripts/mdquiz.mjs`: hàm `parseQuizMd(text)` đọc định dạng `## Câu n` / `- A. …` / `**Đáp án:** X (ghi chú)`:
  - đáp án và nhãn lựa chọn chữ thường → chữ hoa; hỗ trợ nhiều đáp án (`AB`, `ABC`, `BCD`);
  - phần trong ngoặc sau đáp án → trường `w` (Lưu ý);
  - báo lỗi kèm số câu nếu đáp án không có trong lựa chọn.
- `scripts/build-mln131.mjs` (lệnh `npm run build:mln131`): parse md, ghép notes, ghi `src/data/mln131.json`. Câu thiếu notes → `c: 1`, `y`/`t` rỗng, và script in cảnh báo.
- Màn hình ẩn dòng "Vì sao"/"Mẹo" khi chuỗi rỗng.

## 5. Lưu trữ

`AppStorage` đổi thành theo môn:

```ts
interface AppStorage {
  load(subject: Subject): Snapshot;           // game dùng chung + phần của môn
  save(subject: Subject, patch: Partial<Snapshot>): void;
  flush(): void;
  loadActive(): string | null;                // key 'quiz.subject'
  saveActive(id: string): void;
}
```

- Key của môn: `${storagePrefix}.cards|cfg|day|exam.current|exam.history`. HCM202 vẫn là `hcm.v1.*`, nên **tiến độ hiện có không đổi, không cần migrate**.
- `game` luôn ở `hcm.v1.game` (dùng chung).
- `pending` gom theo key thật, nên lưu dở của môn cũ vẫn được ghi đúng chỗ sau khi đổi môn.
- `defaultSnapshot(now, subject)`: `cfg.chs` = mọi chương của môn. `normalize` lọc `cfg.chs` chỉ giữ chương có thật, rỗng thì lấy tất cả.

## 6. Store

- State thêm `subject: Subject`, `subjects: Subject[]`, `badges: BadgeDef[]`, action `switchSubject(id)`.
- `createAppStore({ storage, subjects, initialSubject?, now, rand })`. Môn ban đầu: `initialSubject` → `storage.loadActive()` → môn đầu tiên.
- `switchSubject(id)`: nạp snapshot môn mới (giữ `game` hiện tại), đặt `questions`, `byId`, phiên học mới, `saveActive`. Không làm gì nếu trùng môn hoặc id lạ.
- Subscriber ghi storage bỏ qua lần đổi môn (chỉ ghi khi `subject` không đổi).
- `resetAll` → `resetSubject`: xóa thẻ, bài thi, lịch sử thi, bộ đếm ngày của môn hiện tại. XP, chuỗi ngày, huy hiệu giữ nguyên.
- Bài thi hết giờ của môn khác sẽ được chấm khi người dùng quay lại môn đó (tick hiện có).

## 7. Huy hiệu

`badgeDefs(subjects)` và `evaluateBadges(ctx, subjects)`, `ctx` có `subject`:

- HCM202 giữ id `ch1…ch6`, `all` (không mất huy hiệu đã mở). Môn khác dùng `${id}:ch${c}`, `${id}:all`.
- Tên có mã môn: "HCM202 · Thuộc Chương I", "MLN131 · Thuộc cả 445 câu".
- Huy hiệu chương chỉ được xét cho môn đang học (khi có thẻ của môn đó).
- Chuỗi ngày, combo, thi, mục tiêu, giờ học: dùng chung như cũ.

## 8. Router và đổi môn

- `parseHash(hash, subjectIds)` → `{ subject?: string, name, param }`. Đoạn đầu là mã môn hợp lệ thì tách ra; còn lại giữ nguyên quy tắc cũ. Link cũ `#/hoc` vẫn chạy.
- `App`: route có mã môn khác môn hiện tại → `switchSubject`. Route không có mã môn → `location.replace` sang dạng có mã môn hiện tại.
- `src/store/nav.ts`: `href(path)`, `go(path)`, `replaceTo(path)` thêm mã môn hiện tại. Thay mọi chuỗi `'#/…'` trong màn hình.
- Màn hình bọc `key={subject.id}` để state cục bộ (form Cài đặt, cấu hình Thi thử, tìm kiếm) làm mới khi đổi môn.
- `SubjectSwitcher` (header): trên laptop thay chữ "Ôn HCM202" trong thanh bên; trên điện thoại là thanh mỏng trên cùng nội dung. Bấm mở danh sách môn (mã, tên, số câu). Chọn môn → ở lại cùng tab; đang ở trang kết quả thì về Thi thử.
- `document.title` = `Ôn ${code}`.

## 9. Xuất / nhập

- Xuất v4: `{ app: 'fpt-quiz', v: 4, game, subjects: { [id]: { cards, cfg, examHistory } } }`. Môn không đang mở được đọc từ storage (sau `flush`).
- Nhập v4: đặt `game`; môn đang mở cập nhật state; môn khác `storage.save`. Mã môn lạ bị bỏ qua.
- Nhập v3 (`app: 'hcm202'`) và bản cũ QUIZ.html: vào môn HCM202 như trước.
- Tên file tải: `fpt-quiz-tien-do-YYYY-MM-DD.json`.

## 10. Giao diện khác

- Trang chủ, Thi thử, Kết quả, Thư viện, Tìm kiếm: chip/nhãn chương lấy từ môn hiện tại.
- `index.html`, manifest PWA, trang Giới thiệu, README: "Ôn thi trắc nghiệm FPT" / "FPT Quiz", liệt kê cả hai môn.

## 11. Kiểm thử

- `parseQuizMd`: chữ thường, nhiều đáp án, ghi chú → `w`, đáp án không hợp lệ báo lỗi.
- Storage: key theo môn, HCM202 dùng key cũ, `game` chung, `pending` qua lần đổi môn, `loadActive`.
- Store: `switchSubject` đổi câu hỏi/thẻ, giữ XP; ghi đúng môn; `resetSubject` giữ XP.
- Router: có và không có mã môn, mã lạ.
- Huy hiệu: id HCM202 không đổi, huy hiệu môn khác có tiền tố.
- Xuất/nhập v4, v3, bản cũ.
- Test hiện có cập nhật theo API mới và phải xanh; `npm run build` qua; kiểm tra trên trình duyệt cả hai môn.

## 12. Thứ tự làm

1. Lõi đa môn (subject, storage, store, badges, io), router, nav, switcher, màn hình — với MLN131 đã parse nhưng chương tạm.
2. Soạn `mln131.notes.json` (chương, Vì sao, Mẹo, câu dễ nhầm) theo từng đợt chương.
