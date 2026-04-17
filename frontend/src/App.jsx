import { useState } from 'react';
import NavTabs from './components/NavTabs';
import RawVsNormalized from './views/RawVsNormalized';
import MonitoringMap from './views/MonitoringMap';
import OperatorDashboard from './views/OperatorDashboard';

export default function App() {
  const [tab, setTab] = useState('raw');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Groundwater Connector Framework
            </h1>
            <p className="text-xs text-slate-500">
              Puntland demo · synthetic data · UNICEF Innovation pitch
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Prototype — not production
          </span>
        </div>
      </header>
      <NavTabs active={tab} onChange={setTab} />
      <main>
        {tab === 'raw' && <RawVsNormalized />}
        {tab === 'map' && <MonitoringMap />}
        {tab === 'dashboard' && <OperatorDashboard />}
      </main>
    </div>
  );
}
