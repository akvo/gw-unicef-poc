const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function j(path) {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

export const api = {
  sites: () => j('/api/sites'),
  normalized: () => j('/api/normalized'),
  rawForOperator: (op) => j(`/api/raw/${op}`),
  timeseries: (siteId) => j(`/api/sites/${siteId}/timeseries`),
  operators: () => j('/api/operators'),
};
