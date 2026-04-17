import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';
import { FLAGS } from '../constants';
import QualityFlag from '../components/QualityFlag';
import DataAge from '../components/DataAge';

const PUNTLAND_CENTER = [9.0, 48.5];

export default function MonitoringMap() {
  const [sites, setSites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    api.sites().then(setSites);
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.timeseries(selected.site_id).then((pts) => {
      setSeries(
        [...pts]
          .reverse()
          .map((p) => ({ ...p, t: p.timestamp_utc.slice(0, 10) })),
      );
    });
  }, [selected]);

  return (
    <div className="grid h-[calc(100vh-120px)] grid-cols-[1fr_420px]">
      <div>
        <MapContainer
          center={PUNTLAND_CENTER}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sites.map((s) => (
            <CircleMarker
              key={s.site_id}
              center={[s.lat, s.lng]}
              radius={10}
              pathOptions={{
                color: FLAGS[s.quality_flag]?.color || '#999',
                fillColor: FLAGS[s.quality_flag]?.color || '#999',
                fillOpacity: 0.75,
                weight: 2,
              }}
              eventHandlers={{ click: () => setSelected(s) }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{s.site_name}</div>
                  <div className="text-slate-500">{s.operator}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
        {!selected ? (
          <div className="text-slate-500">
            Click a site to inspect its latest reading, quality flag, and
            time-series.
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {selected.operator}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                {selected.site_name}
              </h2>
              <div className="text-xs text-slate-500">{selected.site_id}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Water level (mbgl)"
                value={selected.water_level_mbgl.toFixed(2)}
              />
              <Metric label="Data age" value={<DataAge hours={selected.data_age_hours} />} />
              <Metric label="Datum" value={selected.datum_reference_method} />
              <Metric
                label="Baro (hPa)"
                value={
                  selected.barometric_pressure_hpa?.toFixed?.(1) ?? '—'
                }
              />
            </div>

            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Quality
              </div>
              <QualityFlag flag={selected.quality_flag} />
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {FLAGS[selected.quality_flag]?.explanation}
              </p>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Time series
              </div>
              <div className="h-48">
                <ResponsiveContainer>
                  <LineChart data={series}>
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis
                      reversed
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10 }}
                      label={{
                        value: 'mbgl',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 10 },
                      }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="water_level_mbgl"
                      stroke={FLAGS[selected.quality_flag]?.color || '#0ea5e9'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Y axis reversed — deeper water levels appear lower.
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}
