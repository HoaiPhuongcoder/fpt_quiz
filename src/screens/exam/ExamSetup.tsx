import { useMemo, useState } from 'react';
import { ShuffleIcon } from '@phosphor-icons/react';
import { useApp } from '../../store/appStore';
import { Chip, Glass, NeonButton, NumberField } from '../../components/ui';
import { DEFAULT_EXAM_CONFIG, clampExamConfig, type ExamConfig } from '../../domain/exam';
import { CHAPTERS, ROMAN, type ChapterId } from '../../domain/types';

export function ExamSetup() {
  const questions = useApp((s) => s.questions);
  const current = useApp((s) => s.examCurrent);
  const history = useApp((s) => s.examHistory);
  const startExam = useApp((s) => s.startExam);
  const abandonExam = useApp((s) => s.abandonExam);
  const [cfg, setCfg] = useState<ExamConfig>(DEFAULT_EXAM_CONFIG);
  const available = useMemo(() => questions.filter((q) => cfg.chapters.includes(q.c)).length, [questions, cfg.chapters]);

  const toggle = (c: ChapterId) => setCfg((s) => {
    const chapters = s.chapters.includes(c) ? s.chapters.filter((x) => x !== c) : [...s.chapters, c].sort((a, b) => a - b);
    return chapters.length ? { ...s, chapters } : s;
  });
  const start = () => {
    startExam(clampExamConfig(cfg));
    location.hash = '#/lam-bai';
  };
  const done = current ? Object.values(current.answers).filter((a) => a.length).length : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Thi thử</h1>
      {current && (
        <Glass className="border-flag/40 p-4">
          <p className="font-semibold">Bạn đang có một bài thi làm dở</p>
          <p className="text-sm text-mut">Đã làm <span className="font-num">{done}</span>/<span className="font-num">{current.items.length}</span> câu</p>
          <div className="mt-3 flex gap-2">
            <NeonButton onClick={() => { location.hash = '#/lam-bai'; }}>Làm tiếp</NeonButton>
            <NeonButton variant="danger" onClick={abandonExam}>Bỏ bài này</NeonButton>
          </div>
        </Glass>
      )}
      <Glass className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Số câu" value={cfg.count} min={5} max={200} onChange={(v) => setCfg((s) => ({ ...s, count: v }))} hint={`Có ${available} câu trong các chương đã chọn`} />
          <NumberField label="Thời gian (phút)" value={cfg.minutes} min={5} max={180} onChange={(v) => setCfg((s) => ({ ...s, minutes: v }))} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Chương</p>
          <div className="flex flex-wrap gap-2">
            {CHAPTERS.map((c) => <Chip key={c} on={cfg.chapters.includes(c)} onClick={() => toggle(c)}>Chương {ROMAN[c]}</Chip>)}
          </div>
        </div>
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-2">
            <ShuffleIcon weight="duotone" size={20} className="text-new" />
            <span>Trộn thứ tự đáp án <span className="text-mut">(“Tất cả…”, “Cả…” luôn ở cuối)</span></span>
          </span>
          <input type="checkbox" className="size-5 accent-violet" checked={cfg.shuffleOptions} onChange={(e) => setCfg((s) => ({ ...s, shuffleOptions: e.target.checked }))} />
        </label>
        <NeonButton className="w-full" disabled={!!current} onClick={start}>Bắt đầu thi</NeonButton>
      </Glass>
      {history.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Lịch sử</h2>
          <div className="grid gap-2">
            {history.map((r) => (
              <a key={r.id} href={`#/ket-qua/${r.id}`}>
                <Glass className="flex items-center justify-between p-3 text-sm hover:bg-white/10">
                  <span>{new Date(r.finishedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                  <span className="font-bold"><span className="font-num">{r.score10}</span> điểm · <span className="font-num">{r.correct}/{r.total}</span></span>
                </Glass>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
