import { useEffect, useRef, useState } from 'react';
import { CoffeeIcon, CopyIcon, DownloadSimpleIcon, HeartIcon, XIcon } from '@phosphor-icons/react';
import { useApp } from '../store/appStore';

const QR_SRC = '/ung-ho-momo.webp';
const RECEIVER = 'NGUYEN HOAI PHUONG';
const WALLET = 'MoMo';
const ACCOUNT = 'PSP2604916200000220';

/** Nút "Mời mình ly cà phê" ở chân trang, bấm mở hộp có mã QR MoMo/VietQR để ai muốn thì ủng hộ. */
export function SupportCoffee() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-streak/40 bg-streak/10 px-4 text-sm font-semibold text-streak transition hover:bg-streak/20"
      >
        <CoffeeIcon size={20} weight="fill" />
        Mời mình ly cà phê
      </button>
      {open && <SupportDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SupportDialog({ onClose }: { onClose: () => void }) {
  const pushToast = useApp((s) => s.pushToast);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT);
      pushToast('Đã chép số tài khoản');
    } catch {
      pushToast('Không chép được, bạn chép tay giúp mình nhé', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
        className="relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-[#15102b] p-5 shadow-xl"
      >
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-2 top-2 grid size-11 place-items-center rounded-xl text-mut hover:bg-white/10 hover:text-ink"
        >
          <XIcon size={20} />
        </button>

        <h2 id="support-title" className="flex items-center gap-2 pr-10 text-lg font-bold">
          <CoffeeIcon size={24} weight="fill" className="text-streak" />
          Mời mình một ly cà phê
        </h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-mut">
          <p>
            Chào bạn! Mình là sinh viên FPT và tự làm <b className="text-ink">Ôn thi FPT</b> trong những đêm ôn thi. Web miễn phí và sẽ luôn miễn phí.
          </p>
          <p>
            Nếu web giúp bạn qua môn nhẹ nhàng hơn, một ly cà phê nhỏ sẽ giúp mình tỉnh táo để thêm môn mới và viết giải thích cho từng câu. Không ủng hộ cũng không sao, bạn học tốt là mình vui rồi!
          </p>
        </div>

        <figure className="mx-auto mt-4 w-full max-w-[240px] overflow-hidden rounded-2xl bg-white p-1">
          <img src={QR_SRC} alt={`Mã QR chuyển khoản ${WALLET} cho ${RECEIVER}`} width={516} height={576} className="h-auto w-full" />
        </figure>
        <p className="mt-2 text-center text-xs text-mut">Quét bằng MoMo hoặc app ngân hàng bất kỳ</p>

        <dl className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-mut">Người nhận</dt>
            <dd className="font-semibold">{RECEIVER}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-mut">Ngân hàng</dt>
            <dd className="font-semibold">{WALLET}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-mut">Số tài khoản</dt>
            <dd>
              <button type="button" onClick={copyAccount} aria-label={`Chép số tài khoản ${ACCOUNT}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1.5 font-num font-semibold hover:bg-white/10">
                {ACCOUNT}
                <CopyIcon size={16} className="text-violet-soft" />
              </button>
            </dd>
          </div>
        </dl>

        <a
          href={QR_SRC}
          download="ung-ho-on-thi-fpt.webp"
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 font-semibold hover:bg-white/10"
        >
          <DownloadSimpleIcon size={18} />
          Tải mã QR
        </a>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-sm text-mut">
          Cảm ơn bạn rất nhiều
          <HeartIcon size={16} weight="fill" className="text-relearn" />
        </p>
      </div>
    </div>
  );
}
