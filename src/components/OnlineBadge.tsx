import { useApp } from '../store/appStore';
import { useOnlineCount } from '../presence/online';

/** "● 23 người đang ôn · 8 người ôn HCM202"; chưa kết nối được thì không hiện gì. */
export function OnlineBadge() {
  const online = useOnlineCount();
  const subject = useApp((s) => s.subject);
  if (!online || online.total < 1) return null;
  const here = online.bySubject[subject.id] ?? 0;

  return (
    <p role="status" className="flex items-center gap-2.5 rounded-xl border border-ok/25 bg-ok/10 px-3 py-2 text-sm text-mut">
      <span aria-hidden className="relative flex size-2.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-ok" />
      </span>
      {online.total === 1 ? (
        <span>Lúc này chỉ có bạn đang ôn, cố lên nhé!</span>
      ) : (
        <span>
          <b className="font-num text-ok">{online.total}</b> người đang ôn
          {here > 0 && (
            <>
              {' · '}
              <b className="font-num text-ink">{here}</b> người ôn {subject.code}
            </>
          )}
        </span>
      )}
    </p>
  );
}
