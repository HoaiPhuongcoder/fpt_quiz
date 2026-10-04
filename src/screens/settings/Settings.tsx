import { useState } from 'react';
import { ArrowLeftIcon, CopyIcon, DownloadSimpleIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { getAppStore, useApp } from '../../store/appStore';
import { ConfirmDialog, Glass, INPUT_CLASS, NeonButton, NumberField } from '../../components/ui';
import { PRESETS, presetParams } from '../../domain/srs';
import { dayKey } from '../../domain/time';
import type { PresetId } from '../../domain/types';
import { fromForm, toForm, type SettingsForm } from './form';

const FIELDS: [keyof SettingsForm, string, string][] = [
  ['steps', 'Bước học (thẻ mới)', 'vd: 1m 10m 1h'],
  ['relearn', 'Bước học lại (khi quên)', 'vd: 10m'],
  ['grad', 'Khoảng cách khi thuộc (Được ở bước cuối)', 'vd: 1d'],
  ['easy', 'Khoảng cách khi bấm Dễ lần đầu', 'vd: 4d'],
  ['cap', 'Khoảng cách tối đa', 'vd: 36500d'],
  ['minLapse', 'Khoảng cách tối thiểu sau khi quên', 'vd: 1d'],
  ['lapsePct', 'Khoảng cách mới sau khi quên (% cũ)', 'Anki mặc định 0%'],
  ['startEase', 'Ease ban đầu (%)', 'Anki mặc định 250'],
  ['easyBonus', 'Thưởng khi Dễ (%)', '130'],
  ['hardMul', 'Hệ số Khó (%)', '120'],
  ['ivlMod', 'Hệ số khoảng cách (%)', '100'],
  ['newPerDay', 'Thẻ mới mỗi ngày', 'Mặc định 80'],
];

export function Settings() {
  const cfg = useApp((s) => s.cfg);
  const goalTarget = useApp((s) => s.game.goalTarget);
  const updateCfg = useApp((s) => s.updateCfg);
  const applyPreset = useApp((s) => s.applyPreset);
  const setGoalTarget = useApp((s) => s.setGoalTarget);
  const exportJson = useApp((s) => s.exportJson);
  const importJson = useApp((s) => s.importJson);
  const resetAll = useApp((s) => s.resetAll);
  const [form, setForm] = useState(() => toForm(cfg));
  const [goal, setGoal] = useState(goalTarget);
  const [io, setIo] = useState('');
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState<'import' | 'reset' | null>(null);

  const pick = (id: PresetId) => {
    applyPreset(id);
    setForm(toForm({ ...cfg, ...presetParams(id) }));
    setMsg(`Đã áp dụng chế độ ${PRESETS[id].name}.`);
  };
  const save = () => {
    const r = fromForm(form);
    if (!r.ok) { setMsg(r.error); return; }
    updateCfg(r.patch);
    setMsg('Đã lưu cài đặt. Lịch mới áp dụng từ lần chấm tiếp theo.');
  };
  const commitGoal = () => {
    setGoalTarget(goal);
    setGoal(getAppStore().getState().game.goalTarget);
  };
  const copyExport = async () => {
    const s = exportJson();
    setIo(s);
    try {
      await navigator.clipboard.writeText(s);
      setMsg('Đã sao chép tiến độ vào bộ nhớ tạm.');
    } catch {
      setMsg('Hãy tự sao chép đoạn bên dưới.');
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `hcm202-tien-do-${dayKey(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = () => {
    const r = importJson(io);
    setMsg(r.message);
    if (r.ok) {
      setForm(toForm(getAppStore().getState().cfg));
      setGoal(getAppStore().getState().game.goalTarget);
    }
    setConfirm(null);
  };
  const doReset = () => {
    resetAll();
    setForm(toForm(getAppStore().getState().cfg));
    setGoal(getAppStore().getState().game.goalTarget);
    setIo('');
    setConfirm(null);
    setMsg('Đã xóa toàn bộ tiến độ.');
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <a href="#/ho-so" aria-label="Quay lại Hồ sơ" className="grid size-11 place-items-center rounded-xl text-mut hover:bg-white/10"><ArrowLeftIcon size={22} /></a>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
      </header>
      {msg && <p role="status" className="rounded-xl border border-violet/40 bg-violet/10 px-3 py-2 text-sm">{msg}</p>}

      <Glass className="space-y-3 p-4">
        <h2 className="font-semibold">Chế độ học</h2>
        <div className="grid grid-cols-2 gap-2">
          <NeonButton variant={cfg.preset === 'cram' ? 'primary' : 'ghost'} onClick={() => pick('cram')}>Thi gấp (mai thi)</NeonButton>
          <NeonButton variant={cfg.preset === 'normal' ? 'primary' : 'ghost'} onClick={() => pick('normal')}>Giống Anki mặc định</NeonButton>
        </div>
        <p className="text-xs leading-relaxed text-mut">
          Thi gấp: câu sai gặp lại sau 1m → 10m → 1h, thuộc rồi cách 4 giờ, tối đa 2 ngày. Anki mặc định: 1m → 10m, thuộc rồi cách 1 ngày, bấm Dễ cách 4 ngày, sau đó nhân với ease (250%).
        </p>
      </Glass>

      <Glass className="space-y-3 p-4">
        <h2 className="font-semibold">Tùy chỉnh như Anki <span className="text-xs font-normal text-mut">(m = phút, h = giờ, d = ngày)</span></h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([k, label, hint]) => (
            <label key={k} className="grid gap-1 text-sm">
              <span>{label}</span>
              <input aria-label={label} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className={INPUT_CLASS} />
              <span className="text-xs text-mut">{hint}</span>
            </label>
          ))}
        </div>
        <fieldset className="flex flex-wrap items-center gap-4 text-sm">
          <legend className="mb-1 font-semibold">Thứ tự thẻ mới</legend>
          {(['random', 'seq'] as const).map((o) => (
            <label key={o} className="inline-flex min-h-11 items-center gap-2">
              <input type="radio" name="order" className="size-4 accent-violet" checked={cfg.order === o} onChange={() => updateCfg({ order: o })} />
              {o === 'random' ? 'Ngẫu nhiên' : 'Theo số câu'}
            </label>
          ))}
        </fieldset>
        <NeonButton onClick={save}>Lưu cài đặt</NeonButton>
      </Glass>

      <Glass className="space-y-3 p-4">
        <h2 className="font-semibold">Mục tiêu ngày</h2>
        <NumberField label="Số câu mỗi ngày (10–500)" value={goal} min={10} max={500} onChange={setGoal} onBlur={commitGoal} hint="Tính cả thẻ đã chấm và câu đã làm trong bài thi." />
      </Glass>

      <Glass className="space-y-3 p-4">
        <h2 className="font-semibold">Sao lưu / chuyển máy</h2>
        <div className="flex flex-wrap gap-2">
          <NeonButton variant="ghost" onClick={copyExport}><CopyIcon size={18} />Xuất và sao chép</NeonButton>
          <NeonButton variant="ghost" onClick={download}><DownloadSimpleIcon size={18} />Tải file .json</NeonButton>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 font-semibold hover:bg-white/10">
            <UploadSimpleIcon size={18} />Chọn file
            <input type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setIo(await f.text()); }} />
          </label>
        </div>
        <textarea
          aria-label="Dữ liệu tiến độ"
          value={io}
          onChange={(e) => setIo(e.target.value)}
          placeholder="Dán dữ liệu tiến độ vào đây (từ web này hoặc từ QUIZ.html) rồi bấm Nhập"
          className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-ink outline-none focus:border-violet"
        />
        <NeonButton disabled={!io.trim()} onClick={() => setConfirm('import')}>Nhập</NeonButton>
      </Glass>

      <Glass className="space-y-3 p-4">
        <h2 className="font-semibold">Xóa tiến độ</h2>
        <NeonButton variant="danger" onClick={() => setConfirm('reset')}><TrashIcon size={18} />Xóa toàn bộ tiến độ…</NeonButton>
      </Glass>

      {confirm === 'import' && (
        <ConfirmDialog text="Tiến độ hiện tại trên máy này sẽ bị thay bằng dữ liệu vừa dán. Tiếp tục?" confirmLabel="Ghi đè" onConfirm={doImport} onCancel={() => setConfirm(null)} />
      )}
      {confirm === 'reset' && (
        <ConfirmDialog text="Xóa toàn bộ lịch ôn, XP, huy hiệu và lịch sử thi? Không thể hoàn tác." confirmLabel="Xóa hết" danger onConfirm={doReset} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}
