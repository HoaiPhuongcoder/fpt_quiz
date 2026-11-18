# Ôn thi FPT

Web ôn trắc nghiệm nhiều môn: Tư tưởng Hồ Chí Minh (HCM202, 645 câu), Chủ nghĩa xã hội khoa học (MLN131, 445 câu) và Lịch sử Đảng Cộng sản Việt Nam (VNR202, 414 câu). Học kiểu Anki (giới hạn được theo khoảng câu), thi thử, luyện lại câu sai và câu gắn sao, XP, chuỗi ngày và huy hiệu. Chạy hoàn toàn trên trình duyệt, tiến độ lưu trên từng máy: mỗi môn có thẻ, cài đặt và lịch sử thi riêng; XP, chuỗi ngày và huy hiệu dùng chung.

## Chạy trên máy

```bash
npm install
npm run dev
```

## Lệnh khác

- `npm test`: chạy toàn bộ test
- `npm run build`: build ra `dist/`
- `npm run preview`: xem bản build
- `npm run extract`: tách lại dữ liệu câu hỏi từ `QUIZ.html` ra `src/data/hcm202.json`
- `npm run build:mln131`, `npm run build:vnr202`: sinh `src/data/<môn>.json` từ `data/<môn>.md` (đề gốc) và `data/<môn>.notes.json` (chương, giải thích, mẹo, câu dễ nhầm)

## Thêm môn mới

1. Đặt file câu hỏi JSON (cùng dạng `src/data/hcm202.json`) vào `src/data/`. Nếu đề ở dạng Markdown như `data/mln131.md`, dùng `parseQuizMd` trong `scripts/mdquiz.mjs` qua `node scripts/build-subject.mjs <môn>`.
2. Khai báo môn trong `src/data/subjects.ts`: `id` (dùng trong URL), `code`, `name`, danh sách chương và `storagePrefix` riêng (ví dụ `quiz.v1.<id>`).

## Deploy lên Vercel

1. Đẩy repo lên GitHub.
2. Vào vercel.com → Add New Project → chọn repo. Vercel tự nhận Vite (build: `npm run build`, output: `dist`).

## Chuyển tiến độ

- Giữa hai máy: Hồ sơ → ⚙ Cài đặt → Xuất tiến độ ở máy cũ, rồi dán vào ô "Dữ liệu tiến độ" → Nhập ở máy mới. Bản xuất chứa tiến độ mọi môn.
- Từ `QUIZ.html`: mở `QUIZ.html` → Cài đặt → Xuất tiến độ → sao chép, rồi nhập như trên. Dữ liệu vào môn HCM202.
