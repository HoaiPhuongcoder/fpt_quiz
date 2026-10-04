# Web ôn trắc nghiệm HCM202 — Thiết kế

Ngày: 2026-10-04 · Trạng thái: chờ duyệt

## 1. Mục tiêu

Chuyển `QUIZ.html` (một file 357KB, React qua CDN, 645 câu HCM202 nhúng sẵn, lưu `localStorage`) thành một web app có cấu trúc, dùng tốt trên điện thoại và laptop, cài được như app (PWA), thêm **Thi thử** và **game hóa**, giao diện mới theo phong cách **tối, neon, kính mờ**.

**Chế độ học chính vẫn là lặp lại ngắt quãng kiểu Anki, giữ nguyên 100% như QUIZ.html:**
- thuật toán, hàng đợi thẻ, 4 nút chấm Lại/Khó/Được/Dễ;
- 2 chế độ có sẵn (Thi gấp, Giống Anki mặc định) và các ô tùy chỉnh.

Thi thử và game hóa chỉ là phần thêm, không thay đổi cách tính lịch ôn (xem mục 6.1).

### Phạm vi

- Chỉ môn HCM202. Không có nhiều môn.
- Không có backend. Tiến độ lưu trên từng máy. Chuyển máy bằng Xuất/Nhập JSON.
- Chỉ có giao diện tối.

### Ngoài phạm vi (để sau)

- Đăng nhập và đồng bộ nhiều thiết bị (Supabase). Ngay từ bây giờ, lớp `storage/` được tách riêng để sau này thêm vào không phải sửa giao diện.
- Nhiều môn học, trang quản trị câu hỏi, bảng xếp hạng.
- Vật phẩm giữ chuỗi, mạng ❤️, rương thưởng.
- Giao diện sáng.

## 2. Công nghệ

| Hạng mục | Lựa chọn |
|---|---|
| Build | Vite + React 18 + TypeScript |
| Style | Tailwind CSS (token màu neon khai báo trong config) |
| State | Zustand |
| Icon | `@phosphor-icons/react`: kiểu duotone cho thẻ thống kê và huy hiệu, kiểu fill cho tab đang chọn và trạng thái đúng/sai, kiểu regular cho phần còn lại. Không dùng emoji hệ thống trong giao diện. |
| Font | Be Vietnam Pro cho mọi chữ tiếng Việt. Space Grotesk chỉ dùng cho số (XP, điểm, đồng hồ) vì font này thiếu dấu tiếng Việt. Hai font tự host qua `@fontsource` để chạy được khi offline. |
| PWA | `vite-plugin-pwa`: cài lên màn hình chính, học offline |
| Test | Vitest + Testing Library |
| Deploy | Vercel (web tĩnh) |

## 3. Cấu trúc thư mục

```
scripts/extract-data.mjs     đọc QUIZ.html → src/data/hcm202.json (chạy một lần)
src/
  data/hcm202.json           645 câu
  domain/                    hàm thuần, không phụ thuộc React
    types.ts
    srs.ts                   thuật toán Anki (chuyển từ hàm `schedule` gốc)
    queue.ts                 chọn thẻ tiếp theo, đếm Mới/Học lại/Đến hạn
    exam.ts                  tạo đề, trộn đáp án, chấm điểm, đẩy câu sai vào ôn tập
    gamify.ts                XP, combo, cấp độ, chuỗi ngày, mục tiêu ngày, huy hiệu
    badges.ts                danh sách huy hiệu và điều kiện mở khóa
    time.ts                  khóa ngày theo giờ máy, định dạng khoảng thời gian (fmt, clock)
  storage/
    local.ts                 load/save localStorage, gom ghi (300ms), đánh số phiên bản dữ liệu
    io.ts                    xuất/nhập JSON (đọc được cả định dạng cũ)
  store/                     Zustand store gọi domain + storage
  screens/                   Home, Study, SessionSummary, ExamSetup, Exam, ExamResult,
                             Library (Cards, Forecast), Profile, Settings
  components/                GlassCard, NeonButton, XpRing, ProgressBar, OptionButton,
                             RatingBar, BadgeTile, NavBar, Toast, ...
```

Nguyên tắc: mọi logic tính toán nằm trong `domain/` và có test. Giao diện chỉ hiển thị và gọi các action của store.

## 4. Dữ liệu

### 4.1 Câu hỏi (giữ nguyên cấu trúc của QUIZ.html)

```ts
type Question = {
  n: number;                 // số câu, 1..645, duy nhất
  q: string;                 // đề
  o: [string, string][];     // [chữ cái, nội dung], ví dụ ["A", "..."]
  a: string[];               // chữ cái đáp án đúng (có thể nhiều)
  c: 1|2|3|4|5|6;            // chương
  y: string;                 // vì sao chọn đáp án này
  t: string;                 // mẹo nhận biết
  w?: string;                // lệch giáo trình
  s: number[];               // số các câu tương tự, dễ nhầm
};
```

Script `extract-data.mjs` cắt mảng `const DATA=[...]` ở dòng 130 của QUIZ.html, parse JSON rồi ghi ra file. Test kiểm tra dữ liệu: đủ 645 câu, `n` không trùng, mỗi đáp án trong `a` có trong `o`, mỗi số trong `s` trỏ tới câu có thật, `c` nằm trong 1..6.

### 4.2 Trạng thái thẻ (tương thích với bản cũ)

```ts
type CardState = {
  st: 'learn'|'relearn'|'review';  // thẻ chưa có bản ghi = mới
  step: number; ivl?: number;       // ivl tính bằng phút
  ease: number; due: number; last: number;  // due, last tính bằng ms
  reps: number; lapses?: number;
  log: [ts: number, rating: 1|2|3|4, ivlMin: number][];  // tối đa 20 dòng
};
type Cards = Record<number, CardState>;
```

Cài đặt Anki giữ nguyên: 2 chế độ có sẵn "Thi gấp" (mặc định) và "Giống Anki mặc định", cộng các ô tùy chỉnh và giới hạn thẻ mới mỗi ngày (mặc định 80), lọc theo chương, thứ tự thẻ mới.

### 4.3 Game hóa

```ts
type GameState = {
  xp: number;
  bestCombo: number;
  streak: { count: number; lastDay: string | null };   // ngày dạng YYYY-MM-DD theo giờ máy
  days: Record<string, { reviewed: number; examsDone: number; goalHit: boolean }>; // giữ 60 ngày gần nhất
  goalTarget: number;              // mặc định 50
  goalHits: number;
  examsDone: number;
  badges: Record<string, number>;  // id → thời điểm mở khóa (ms)
};
```

### 4.4 Thi thử

```ts
type ExamConfig = { count: number; minutes: number; chapters: number[]; shuffleOptions: boolean };
type ExamSession = {
  id: string; config: ExamConfig; startedAt: number; deadline: number;
  items: { n: number; order: string[] }[];   // thứ tự lựa chọn sau khi trộn
  answers: Record<number, string[]>; flagged: number[]; current: number;
};
type ExamResult = {
  id: string; finishedAt: number; score10: number; correct: number; total: number;
  byChapter: Record<number, { correct: number; total: number }>;
  items: ExamSession['items']; answers: ExamSession['answers'];
};
```

## 5. Màn hình và điều hướng

- **Điện thoại:** thanh tab dưới gồm Trang chủ · Thi thử · Thư viện · Hồ sơ.
- **Laptop (từ 1024px):** thanh tab chuyển thành cột trái, nội dung ở giữa rộng tối đa 560px.
- **Toàn màn hình:** màn Học và màn Làm bài thi ẩn thanh điều hướng. Nút Back của trình duyệt hoặc phím Esc để thoát (giữ cách dùng `#hoc` như bản cũ).

| Màn | Nội dung |
|---|---|
| Trang chủ | Vòng cấp độ + XP, chuỗi 🔥, thẻ "Sẵn sàng" (Mới / Học lại / Đến hạn) và nút Bắt đầu, thanh mục tiêu ngày, chip lọc chương, lối tắt Thi thử và Huy hiệu |
| Học | Giữ nguyên luồng cũ: chọn đáp án → hiện đúng/sai, "Vì sao", "Mẹo", "Lệch giáo trình", "Câu tương tự", thông tin thẻ → chấm Lại/Khó/Được/Dễ, mỗi nút hiện khoảng thời gian sẽ gặp lại. Phím tắt: A–E hoặc 1–5 để chọn, 1–4 để chấm, Enter để chấm theo kết quả, Esc để thoát. Thêm: số combo, chữ "+XP" bay lên khi đúng, rung nhẹ khi sai (`navigator.vibrate`, nếu máy hỗ trợ). |
| Tổng kết phiên | Hiện khi hết thẻ đến hạn (thay cho "Xong phần hiện tại"): XP nhận, % chính xác, combo cao nhất, thời gian, mục tiêu ngày, chuỗi ngày, giờ thẻ tiếp theo đến hạn, nút "Học thêm 20 thẻ mới" / "Học trước thẻ sắp đến hạn" / "Về trang chủ" |
| Thiết lập thi | Số câu (mặc định 50), số phút (mặc định 60), chọn chương, bật/tắt trộn đáp án (mặc định bật), lịch sử các lần thi |
| Làm bài thi | Đồng hồ đếm ngược, lưới câu (đã làm / đang làm / đánh dấu), Trước / Đánh dấu / Sau, nút Nộp bài (hỏi xác nhận nếu còn câu chưa làm). Không hiện đúng/sai. Tự nộp khi hết giờ. |
| Kết quả thi | Điểm /10 trên vòng tròn, số câu đúng, kết quả theo chương, XP và huy hiệu mới, thông báo "N câu sai đã vào hàng Học lại", xem lại câu sai hoặc toàn bộ đề kèm giải thích |
| Thư viện | Tab "Thẻ" và tab "Lịch sắp tới", giữ đủ chức năng bản cũ (lọc, sắp xếp, Ôn ngay, Đặt lại, lịch sử chấm, biểu đồ theo giờ/ngày) |
| Hồ sơ | Cấp độ và danh hiệu, chuỗi 7 ngày, bảng huy hiệu (đã mở / khóa, kèm điều kiện), thống kê (đã thuộc x/645, tổng số lần ôn, lần thi gần nhất). Nút ⚙ mở Cài đặt. |
| Cài đặt | Thông số Anki (như bản cũ), mục tiêu ngày, Xuất/Nhập JSON, đặt lại toàn bộ (có xác nhận) |

**Phong cách:**
- Nền gradient tím than (`#1a1433` → `#0f0c20`), thẻ kính mờ (`rgba(255,255,255,.05)` có viền mảnh), nút chính gradient tím `#8b5cf6` sang cyan `#22d3ee` có quầng sáng.
- Màu ngữ nghĩa: đúng `#a3e635`, sai `#f43f5e`, mới `#67e8f9`, học lại `#f472b6`, chuỗi ngày `#ffa25c`, đánh dấu `#fbbf24`.
- Hiệu ứng chỉ dùng CSS. Tắt hiệu ứng khi máy bật `prefers-reduced-motion`.
- Vùng bấm tối thiểu 44px. Có `env(safe-area-inset-*)` cho iPhone.

## 6. Luật

### 6.1 Ôn tập (SRS)

`srs.schedule(card, rating, cfg, now)` phải cho kết quả giống hệt hàm `schedule` gốc với cùng đầu vào (thêm tham số `now` để test được). Thứ tự chọn thẻ giữ như cũ: thẻ học lại đã đến hạn → thẻ ôn đã đến hạn → thẻ mới (nếu chưa vượt giới hạn thẻ mới trong ngày) → thẻ học lại sẽ đến hạn trong 20 phút tới → (khi bật "học trước") thẻ có hạn gần nhất.

### 6.2 Thi thử

- Lấy ngẫu nhiên `count` câu trong các chương đã chọn. Nếu số câu có sẵn ít hơn `count` thì lấy hết.
- Khi trộn đáp án: các lựa chọn có nội dung bắt đầu bằng "Tất cả" hoặc "Cả " (không phân biệt hoa/thường) giữ nguyên thứ tự và luôn nằm cuối. Chữ cái A, B, C… được gán lại theo vị trí mới khi hiển thị, còn khi chấm thì so sánh theo chữ cái gốc.
- Một câu được tính đúng khi tập lựa chọn của người làm **trùng khớp** với `a`. Câu bỏ trống tính là sai.
- `score10 = round(correct / total × 10, 1 chữ số thập phân)`.
- Câu sai và câu bỏ trống: thẻ được chấm như bấm "Lại" (`schedule(card, 1)`), sau đó đặt `due = now` để hiện ngay ở phiên học tiếp theo. Câu đúng không làm thay đổi trạng thái thẻ.
- Bài thi đang làm được lưu sau mỗi thao tác. Mở lại web khi còn hạn thì làm tiếp. Mở lại khi đã quá hạn thì tự nộp. Mỗi lúc chỉ có một bài thi đang làm.
- Lịch sử: giữ 30 kết quả gần nhất.

### 6.3 XP và combo

- Phiên học, ở lần chọn đáp án đầu tiên của mỗi thẻ:
  - đúng: +10 × hệ số combo;
  - sai: +2, combo về 0.
- Hệ số combo theo số câu đúng liên tiếp:

| Số câu đúng liên tiếp | Hệ số |
|---|---|
| 1 – 4 | ×1 |
| 5 – 9 | ×1,5 |
| từ 10 | ×2 |

  XP được làm tròn xuống. Combo được tính lại từ đầu ở mỗi phiên học.
- Thi thử: +5 cho mỗi câu đúng. Thưởng +100 nếu đạt 8 điểm trở lên, hoặc +250 nếu đạt 10 điểm (không cộng dồn hai mức).
- Đạt mục tiêu ngày lần đầu trong ngày: +50.
- XP không ảnh hưởng đến lịch ôn.

### 6.4 Cấp độ

- XP để đi từ cấp L lên cấp L+1 là `100 + 50 × (L − 1)`. Cấp được suy ra từ tổng XP, không lưu riêng.
- Danh hiệu: 1–4 Tân binh · 5–9 Học viên · 10–14 Học giả · 15–19 Chuyên gia · từ 20 Đại sứ tư tưởng.

### 6.5 Chuỗi ngày và mục tiêu ngày

- "Ngày học" = ngày có `reviewed ≥ 10` hoặc `examsDone ≥ 1`. Khóa ngày là `YYYY-MM-DD` theo giờ máy.
- Khi một ngày vừa trở thành ngày học:
  - nếu `lastDay` là hôm qua thì `count + 1`;
  - nếu `lastDay` là hôm nay thì giữ nguyên;
  - các trường hợp khác thì `count = 1`.
- Khi hiển thị, nếu `lastDay` cũ hơn hôm qua thì chuỗi hiện là 0.
- Mục tiêu ngày đếm số thẻ đã chấm trong phiên học cộng số câu đã làm trong bài thi đã nộp. Mặc định 50, chỉnh được trong khoảng 10–500.

### 6.6 Huy hiệu (20 cái)

| id | Điều kiện |
|---|---|
| `ch1` … `ch6` | Thuộc hết chương: mọi câu trong chương ở trạng thái `review` với `ivl ≥ 1 ngày` |
| `all` | Thuộc cả 645 câu theo cùng định nghĩa trên |
| `streak3` / `7` / `14` / `30` | Chuỗi ngày đạt mức tương ứng |
| `combo10` / `25` / `50` | Combo trong một phiên học đạt mức tương ứng |
| `exam8` | Một bài thi đạt từ 8 điểm |
| `exam10` | Một bài thi đạt 10 điểm |
| `exam5x` | Nộp xong 5 bài thi |
| `goal7` | Đạt mục tiêu ngày 7 lần |
| `night` | Chấm một thẻ trong khoảng 23:00–03:59 |
| `early` | Chấm một thẻ trong khoảng 04:00–05:59 |

Kiểm tra huy hiệu sau mỗi lần chấm thẻ và sau mỗi lần nộp bài thi. Huy hiệu mới mở hiện thông báo kèm icon Phosphor duotone. Huy hiệu đã mở thì không bao giờ bị thu lại.

## 7. Lưu trữ

- Khóa localStorage:

| Khóa | Nội dung |
|---|---|
| `hcm.v1.cards` | Trạng thái các thẻ |
| `hcm.v1.cfg` | Cài đặt Anki |
| `hcm.v1.day` | Số thẻ mới đã học trong ngày (như `hcm_srs_day` cũ) |
| `hcm.v1.game` | Trạng thái game hóa |
| `hcm.v1.exam.current` | Bài thi đang làm |
| `hcm.v1.exam.history` | Lịch sử thi |
| `hcm.meta` | `{ schemaVersion: 1 }` |

- Mọi lần đọc/ghi đều bọc `try/catch`. Nếu không ghi được thì app vẫn chạy với dữ liệu trong bộ nhớ và hiện thông báo "Không lưu được tiến độ".
- Ghi được gom lại 300ms một lần. Ghi ngay khi trang chuyển sang `visibilitychange: hidden`.
- **Xuất:**
  - định dạng `{ app: 'hcm202', v: 3, cards, cfg, game, examHistory }`;
  - sao chép vào clipboard và có nút tải file `.json`.
- **Nhập:**
  - đọc được định dạng mới (v3) và định dạng cũ `{ v: 2, cards, cfg }` của QUIZ.html; với định dạng cũ, `game` được tạo mới;
  - trước khi ghi đè phải hỏi xác nhận.
- Lý do không tự đọc được các khóa cũ `hcm_srs_*`: web mới chạy trên tên miền khác, nên không thấy localStorage của QUIZ.html. Người dùng chuyển tiến độ cũ bằng Xuất ở QUIZ.html rồi Nhập ở web mới.
- Store chỉ gọi `storage` qua một interface (`load(): Snapshot`, `save(patch)`). Thêm Supabase sau này chỉ cần viết một bản cài đặt mới của interface đó.

## 8. Xử lý lỗi và trường hợp biên

| Trường hợp | Cách xử lý |
|---|---|
| JSON nhập vào sai | Báo lỗi, không ghi gì |
| Bộ chọn chương bị bỏ hết | Không cho bỏ chương cuối cùng (như bản cũ) |
| Đóng tab giữa bài thi | Mở lại thì làm tiếp hoặc tự nộp (xem 6.2) |
| Máy đổi ngày lúc đang mở web | Đồng hồ 10 giây phát hiện, đặt lại số đếm trong ngày (như bản cũ) |
| Thẻ trong `s` không tồn tại | Bỏ qua khi hiển thị (đã có test dữ liệu chặn từ đầu) |

## 9. Test

- `srs.test.ts`: so sánh với hàm `schedule` gốc (chép nguyên văn vào `test/legacy.ts`) trên các chuỗi chấm ngẫu nhiên, với cả 2 chế độ có sẵn, cố định `now`.
- `queue.test.ts`: thứ tự ưu tiên, giới hạn thẻ mới, "học trước", lọc chương.
- `exam.test.ts`:
  - đề lấy đúng chương và đúng số câu;
  - các lựa chọn "Tất cả…" và "Cả …" luôn ở cuối;
  - chấm đúng câu nhiều đáp án;
  - tính `score10` và kết quả theo chương;
  - câu sai được đưa vào hàng học lại với `due = now`;
  - tự nộp khi quá hạn.
- `gamify.test.ts`: XP và hệ số combo, chuyển cấp ở biên, chuỗi qua nửa đêm và khi bỏ một ngày, thưởng mục tiêu chỉ một lần mỗi ngày, mở khóa từng huy hiệu.
- `io.test.ts`: nhập v2 cũ, nhập v3, xuất rồi nhập lại cho ra cùng dữ liệu.
- `data.test.ts`: kiểm tra dữ liệu như mục 4.1.
- Test giao diện (Testing Library):
  - học một thẻ từ chọn đáp án đến chấm điểm, XP tăng;
  - thi 3 câu, nộp bài, xem kết quả.
- Kiểm tra thủ công trên trình duyệt ở 375px và 1280px:
  - học bằng phím tắt;
  - thi thử, F5 giữa chừng;
  - xuất/nhập;
  - cài PWA, tắt mạng rồi vẫn học được.

## 10. Tiêu chí hoàn thành

1. Đủ 645 câu, mọi tính năng của QUIZ.html vẫn dùng được (học, thư viện, lịch, cài đặt, xuất/nhập).
2. Nhập được file xuất từ QUIZ.html, và lịch ôn sau khi nhập giữ đúng như cũ.
3. Thi thử, XP/cấp/combo, chuỗi ngày, mục tiêu ngày và 20 huy hiệu chạy đúng luật mục 6.
4. Toàn bộ test Vitest đều qua. Lệnh `npm run build` chạy không lỗi.
5. Dùng tốt ở 375px và 1280px. Cài được PWA và học được khi offline.
