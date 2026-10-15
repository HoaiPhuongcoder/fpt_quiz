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

/** Đã bấm X trong lần vào web này chưa; tải lại hay mở web lần sau thì bong bóng hiện lại. */
let dismissedThisVisit = false;

/** Bong bóng cà phê bay lơ lửng ở góc trang chủ; bấm mở hộp ủng hộ, bấm X thì ẩn tới lần vào web sau. */
export function CoffeeFloat() {
  const [hidden, setHidden] = useState(dismissedThisVisit);
  const [open, setOpen] = useState(false);
  if (hidden) return null;

  const dismiss = () => {
    dismissedThisVisit = true;
    setHidden(true);
  };

  return (
    <>
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] right-4 z-30 animate-pop-in [animation-delay:800ms] lg:bottom-8 lg:right-8">
        <div className="relative animate-bob">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Thấy web có ích? Mời mình ly cà phê"
            className="flex items-center gap-3 rounded-2xl border border-streak/50 bg-[#1f1530]/95 py-3 pl-3 pr-5 text-left shadow-[0_0_28px_rgba(255,162,92,.35)] backdrop-blur-md transition hover:scale-[1.03] hover:border-streak active:scale-95"
          >
            <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-linear-to-br from-streak to-relearn text-white shadow-[0_0_16px_rgba(255,162,92,.55)]">
              <span aria-hidden className="absolute -top-2 left-4 h-3 w-1 animate-steam rounded-full bg-white/70" />
              <span aria-hidden className="absolute -top-2 left-7 h-3 w-1 animate-steam rounded-full bg-white/70 [animation-delay:1.2s]" />
              <CoffeeIcon size={28} weight="fill" />
            </span>
            <span>
              <span className="block text-xs text-mut">Thấy web có ích?</span>
              <span className="block font-bold text-streak">Mời mình ly cà phê</span>
            </span>
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Ẩn lời mời cà phê"
            className="absolute -right-3 -top-3 grid size-9 place-items-center rounded-full border border-white/20 bg-[#2a2350] text-ink shadow-lg transition hover:bg-bad hover:text-white"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </div>
      </div>
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
