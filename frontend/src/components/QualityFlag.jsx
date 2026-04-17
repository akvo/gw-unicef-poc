import { FLAGS } from '../constants';

export default function QualityFlag({ flag, showTooltip = true }) {
  const f = FLAGS[flag] || { color: '#999', label: flag, explanation: '' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: f.color }}
      title={showTooltip ? f.explanation : undefined}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {f.label}
    </span>
  );
}
