import { useState, type ReactNode } from 'react';
import { WarningIcon } from '@phosphor-icons/react';
import { useApp } from '../store/appStore';
import { Modal, NeonButton } from './ui';

const SEEN_KEY = 'onthi.aboutSeen.v1';

function seenBefore(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* không lưu được thì lần sau hiện lại, không sao */
  }
}

/** Nút "Giới thiệu" ở chân trang; lần đầu vào web thì tự mở hộp giới thiệu. */
export function AboutLink() {
  const [open, setOpen] = useState(() => !seenBefore());
  const close = () => {
    markSeen();
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="hover:text-mut">
        Giới thiệu
      </button>
      {open && <AboutDialog onClose={close} />}
    </>
  );
}

function AboutDialog({ onClose }: { onClose: () => void }) {
  const subjects = useApp((s) => s.subjects);
  return (
    <Modal labelledBy="about-title" onClose={onClose} className="max-w-lg">
      <h2 id="about-title" className="pr-10 text-xl font-bold">
        Chào mừng đến Ôn thi <span className="text-violet-soft">FPT</span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-mut">
        Web ôn trắc nghiệm miễn phí cho các môn lý luận chính trị. Không cần tài khoản, mở ra là học.
      </p>

      <Section title="Có những gì?">
        <ul className="grid gap-1.5">
          {subjects.map((s) => (
            <li key={s.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <b className="text-ink">{s.code}</b> · {s.name}
              <span className="block text-xs">
                <span className="font-num">{s.questions.length}</span> câu, <span className="font-num">{s.chapters.length}</span> chương
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs">Đổi môn bằng thanh chọn môn ở đầu trang, tiến độ mỗi môn lưu riêng.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li><b className="text-ink">Học kiểu Anki:</b> câu hay sai quay lại sớm, câu đã thuộc giãn ra vài ngày mới hỏi lại.</li>
          <li><b className="text-ink">Thi thử có tính giờ:</b> mặc định 50 câu trong 60 phút như đề thật.</li>
          <li><b className="text-ink">Thư viện và tìm kiếm</b> để xem lại mọi câu, kèm giải thích đáp án.</li>
          <li>Cài lên màn hình chính như một app, ôn được cả khi không có mạng.</li>
        </ul>
      </Section>

      <Section title="Tiến độ lưu ở đâu?">
        <p>
          Ngay trên trình duyệt của bạn, không gửi lên máy chủ nào. Web chỉ gửi một mã ngẫu nhiên kèm môn đang chọn để đếm số người đang học cùng lúc. Xóa dữ liệu trình duyệt là mất tiến độ, nên thỉnh thoảng vào <b className="text-ink">Hồ sơ → Cài đặt</b> để xuất bản sao lưu. Xem thêm <a href="/chinh-sach-quyen-rieng-tu/" className="text-violet-soft underline">Chính sách quyền riêng tư</a>.
        </p>
      </Section>

      <section className="mt-5 rounded-2xl border border-flag/40 bg-flag/10 p-4 text-sm leading-relaxed text-mut">
        <h3 className="mb-2 flex items-center gap-2 font-bold text-flag">
          <WarningIcon size={20} weight="fill" />
          Miễn trừ trách nhiệm
        </h3>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Đây là dự án cá nhân của sinh viên, <b className="text-ink">không phải sản phẩm chính thức</b> và không liên kết với Trường Đại học FPT hay Bộ Giáo dục và Đào tạo. Chữ "FPT" chỉ để cho biết web dành cho sinh viên FPT.
          </li>
          <li>
            Câu hỏi và đáp án được tổng hợp, kiểm tra cẩn thận nhưng <b className="text-ink">vẫn có thể sai sót</b> và không đảm bảo giống đề thi thật. Đáp án đối chiếu theo giáo trình HCM202 bản 2019 và MLN131 bản 2021. Hãy luôn lấy giáo trình và hướng dẫn của giảng viên làm chuẩn.
          </li>
          <li>Tác giả không chịu trách nhiệm về kết quả thi hay bất kỳ quyết định nào dựa trên nội dung của web.</li>
          <li>Web chỉ dùng để ôn tập. Đừng dùng trong lúc thi và hãy tuân thủ quy chế thi của trường.</li>
          <li>Nếu bạn là chủ sở hữu một nội dung trên web và muốn gỡ xuống, hãy liên hệ qua GitHub, mình sẽ xử lý sớm.</li>
          <li>Web có quảng cáo để duy trì và luôn miễn phí cho mọi người.</li>
        </ul>
      </section>

      <Section title="Tác giả và góp ý">
        <p>
          Web do Nguyễn Hoài Phương làm. Thấy câu sai đáp án, lỗi hiển thị hay muốn góp ý? Gửi tại{' '}
          <a href="https://github.com/HoaiPhuongcoder/fpt_quiz/issues" target="_blank" rel="noopener" className="text-violet-soft underline">trang GitHub của dự án</a>.
        </p>
      </Section>

      <NeonButton className="mt-6 w-full" onClick={onClose}>
        Mình đã hiểu, vào ôn thôi
      </NeonButton>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 text-sm leading-relaxed text-mut">
      <h3 className="mb-2 font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}
