import type { Rating } from '../../domain/types';
import { fmt } from '../../domain/time';
import { RATING_NAMES } from '../../store/appStore';

export function RatingBar({ preview, correct, onRate }: { preview: number[]; correct: boolean; onRate: (r: Rating) => void }) {
  return (
    <div className="mx-auto grid max-w-[560px] grid-cols-4 gap-2">
      {([1, 2, 3, 4] as Rating[]).map((r, i) => {
        const recommended = (r === 1 && !correct) || (r === 3 && correct);
        const tone = r === 1
          ? `border-bad/70 text-bad-soft ${recommended ? 'bg-bad/15' : 'bg-white/5'}`
          : recommended ? 'border-ok bg-ok/10 text-ok' : 'border-white/15 bg-white/5';
        return (
          <button key={r} type="button" onClick={() => onRate(r)} className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-[1.5px] text-sm font-bold ${tone}`}>
            {RATING_NAMES[r]}
            <span className="text-xs font-normal text-mut">
              {fmt(preview[i])}
              <kbd className="ml-1 hidden rounded border border-white/15 px-1 font-num sm:inline">{r}</kbd>
            </span>
          </button>
        );
      })}
    </div>
  );
}
