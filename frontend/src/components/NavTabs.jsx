const TABS = [
  { id: 'raw', label: '1. Raw vs Normalized' },
  { id: 'map', label: '2. Monitoring Map' },
  { id: 'dashboard', label: '3. Operator Dashboard' },
];

export default function NavTabs({ active, onChange }) {
  return (
    <nav className="flex gap-1 border-b border-slate-200 bg-white px-6">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
            active === t.id
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
