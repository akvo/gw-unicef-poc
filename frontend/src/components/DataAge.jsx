function humanize(hours) {
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

function colorFor(hours) {
  if (hours < 48) return 'text-emerald-600';
  if (hours < 168) return 'text-amber-600';
  if (hours < 720) return 'text-orange-600';
  return 'text-slate-500';
}

export default function DataAge({ hours }) {
  return (
    <span className={`text-sm font-medium ${colorFor(hours)}`}>
      {humanize(hours)}
    </span>
  );
}
