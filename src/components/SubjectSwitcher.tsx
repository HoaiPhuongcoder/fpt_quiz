import { useEffect, useRef, useState } from 'react';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { useApp } from '../store/appStore';
import { parseHash, routePath } from '../router';

/** Nút "Ôn HCM202 ▾": mở danh sách môn, chọn môn thì ở lại cùng tab (trang kết quả thì về Thi thử). */
export function SubjectSwitcher({ className = '' }: { className?: string }) {
  const subject = useApp((s) => s.subject);
  const subjects = useApp((s) => s.subjects);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const pick = (id: string) => {
    setOpen(false);
    if (id === subject.id) return;
    const r = parseHash(location.hash, subjects.map((s) => s.id));
    const path = r.name === 'result' || r.name === 'exam' ? '/thi' : routePath(r);
    location.hash = `#/${id}${path}`;
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Đổi môn, đang học ${subject.code}`}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-lg font-bold hover:bg-white/10"
      >
        Ôn <span className="text-violet-soft">{subject.code}</span>
        <CaretDownIcon size={16} className={`text-mut transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" aria-label="Chọn môn" className="absolute left-0 top-full z-20 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#15102b]/95 p-1.5 shadow-xl backdrop-blur-md">
          {subjects.map((s) => {
            const on = s.id === subject.id;
            return (
              <button
                key={s.id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => pick(s.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/10 ${on ? 'bg-white/5' : ''}`}
              >
                <span className="flex-1">
                  <span className="block font-semibold">{s.code}</span>
                  <span className="block text-xs text-mut">{s.name} · <span className="font-num">{s.questions.length}</span> câu</span>
                </span>
                {on && <CheckIcon size={18} weight="bold" className="text-violet-soft" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
