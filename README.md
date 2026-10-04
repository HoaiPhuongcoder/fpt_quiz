# Ôn HCM202

Web ôn trắc nghiệm Tư tưởng Hồ Chí Minh (645 câu): học kiểu Anki, thi thử, XP, chuỗi ngày và huy hiệu. Chạy hoàn toàn trên trình duyệt, tiến độ lưu trên từng máy.

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

## Deploy lên Vercel

1. Đẩy repo lên GitHub.
2. Vào vercel.com → Add New Project → chọn repo. Vercel tự nhận Vite (build: `npm run build`, output: `dist`).

## Chuyển tiến độ từ QUIZ.html

Mở `QUIZ.html` → Cài đặt → Xuất tiến độ → sao chép. Mở web mới → Hồ sơ → ⚙ Cài đặt → dán vào ô "Dữ liệu tiến độ" → Nhập.
