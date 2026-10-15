import { CheckCircleIcon } from '@phosphor-icons/react';
import { useApp } from '../store/appStore';
import { parseHash, routePath } from '../router';

/** Thanh chọn môn luôn hiện ở đầu trang: mỗi môn một ô, bấm là đổi ngay, ở lại cùng tab (trang thi/kết quả thì về Thi thử). */
export function SubjectSwitcher({ className = '' }: { className?: string }) {
  const subject = useApp((s) => s.subject);
  const subjects = useApp((s) => s.subjects);

  const pick = (id: string) => {
    if (id === subject.id) return;
    const r = parseHash(location.hash, subjects.map((s) => s.id));
    const path = r.name === 'result' || r.name === 'exam' ? '/thi' : routePath(r);
    location.hash = `#/${id}${path}`;
  };

  return (
    <section className={className}>
      <p id="subject-switcher-label" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-mut">
        Chọn môn ôn tập
      </p>
      <div
        role="radiogroup"
        aria-labelledby="subject-switcher-label"
        className="grid auto-cols-fr grid-flow-col gap-2"
      >
        {subjects.map((s) => {
          const on = s.id === subject.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${s.code} – ${s.name}`}
              onClick={() => pick(s.id)}
              className={`flex min-h-14 min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition ${
                on
                  ? 'border-violet bg-violet/20 shadow-[0_0_0_1px_var(--color-violet)]'
                  : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className={`block font-bold ${on ? 'text-ink' : 'text-mut'}`}>{s.code}</span>
                <span className="block text-xs leading-snug text-mut">{s.name}</span>
              </span>
              {on ? (
                <CheckCircleIcon size={22} weight="fill" className="shrink-0 text-violet-soft" />
              ) : (
                <span aria-hidden className="size-5 shrink-0 rounded-full border-2 border-white/20" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
