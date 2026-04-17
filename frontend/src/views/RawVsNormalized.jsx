import { useEffect, useState } from 'react';
import { api } from '../api';
import { OPERATORS, OPERATOR_DESCRIPTIONS } from '../constants';
import QualityFlag from '../components/QualityFlag';

function RawCard({ operator, rawRecords }) {
  if (!rawRecords || rawRecords.length === 0) return null;
  const sample = rawRecords[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">{operator}</h3>
        <span className="text-xs text-slate-500">raw format</span>
      </div>
      <p className="mb-3 text-xs text-slate-600">{OPERATOR_DESCRIPTIONS[operator]}</p>
      <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
        {JSON.stringify(sample, null, 2)}
      </pre>
    </div>
  );
}

export default function RawVsNormalized() {
  const [raw, setRaw] = useState({});
  const [normalized, setNormalized] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const rawEntries = await Promise.all(
          OPERATORS.map(async (op) => [op, await api.rawForOperator(op)]),
        );
        setRaw(Object.fromEntries(rawEntries));
        setNormalized(await api.normalized());
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-8 p-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">
          Same measurement. Three vocabularies. One output.
        </h2>
        <p className="mt-1 max-w-3xl text-slate-600">
          Each operator sends groundwater depth under a different field name
          against a different datum. The connector translates every record into
          a common schema anchored to WaterML 2.0 conventions before anything
          reaches the dashboard.
        </p>
      </header>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Raw input — as received
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {OPERATORS.map((op) => (
            <RawCard key={op} operator={op} rawRecords={raw[op]} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Normalized output — unified schema
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Site</th>
                <th className="px-3 py-2">Operator</th>
                <th className="px-3 py-2">Raw field</th>
                <th className="px-3 py-2">Value (raw)</th>
                <th className="px-3 py-2">water_level_mbgl</th>
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {normalized.map((r) => (
                <tr key={r.site_id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-800">{r.site_name}</div>
                    <div className="text-xs text-slate-500">{r.site_id}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{r.operator}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">
                    {r.raw_field_name}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">
                    {r.water_level_raw}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-semibold text-slate-900">
                    {r.water_level_mbgl}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {r.datum_reference_method}
                  </td>
                  <td className="px-3 py-2">
                    <QualityFlag flag={r.quality_flag} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
