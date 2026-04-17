import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import { OPERATOR_DESCRIPTIONS } from '../constants';
import QualityFlag from '../components/QualityFlag';
import DataAge from '../components/DataAge';

function Sparkline({ values, color }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div className="h-16">
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const SPARK_COLOR = {
  SWALIM: '#0ea5e9',
  WorldVision: '#a855f7',
  INGO_3: '#f59e0b',
};

export default function OperatorDashboard() {
  const [ops, setOps] = useState([]);
  useEffect(() => {
    api.operators().then(setOps);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">
          Three operators. Three cadences. One picture.
        </h2>
        <p className="mt-1 max-w-3xl text-slate-600">
          The freshness and quality story across the whole Puntland network, at
          a glance. Fragmentation is the problem the connector exists to solve.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {ops.map((o) => (
          <div
            key={o.operator}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {o.operator}
                </h3>
                <p className="text-xs text-slate-500">
                  {OPERATOR_DESCRIPTIONS[o.operator]}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-slate-900">
                  {o.site_count}
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  sites
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Data freshness
                </div>
                <DataAge hours={o.avg_data_age_hours} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Dominant flag
                </div>
                <QualityFlag flag={o.dominant_quality_flag} />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Recent readings (mbgl)
              </div>
              <Sparkline
                values={o.recent_readings}
                color={SPARK_COLOR[o.operator] || '#64748b'}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
