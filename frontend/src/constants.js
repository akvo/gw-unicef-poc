export const FLAGS = {
  VALID: {
    color: '#16a34a',
    label: 'Valid',
    explanation: 'Passed all automated QC checks.',
  },
  BARO_UNCORRECTED: {
    color: '#f59e0b',
    label: 'Baro Uncorrected',
    explanation:
      'Reading has not been compensated for atmospheric pressure. Absolute depth may drift up to ±0.3 m.',
  },
  STALE: {
    color: '#64748b',
    label: 'Stale',
    explanation:
      'No transmission in > 30 days. Value shown reflects the last successful reading, not current state.',
  },
  DATUM_UNVERIFIED: {
    color: '#a855f7',
    label: 'Datum Unverified',
    explanation:
      'Reference datum (ground level vs casing top vs geodetic) has not been confirmed against field survey.',
  },
  SPIKE_DETECTED: {
    color: '#dc2626',
    label: 'Spike Detected',
    explanation:
      'Reading differs from trend by more than 3σ. Likely sensor fault or manual reset — flagged for review.',
  },
  GAP_INTERPOLATED: {
    color: '#0ea5e9',
    label: 'Gap Interpolated',
    explanation:
      'Value synthesised from neighbouring readings to maintain time-series continuity. Do not use for compliance reporting.',
  },
};

export const OPERATORS = ['SWALIM', 'WorldVision', 'INGO_3'];

export const OPERATOR_DESCRIPTIONS = {
  SWALIM: 'FAO-SWALIM. Daily telemetry. Geodetic datum.',
  WorldVision: 'World Vision. Quarterly field visits. Casing-top reference.',
  INGO_3: 'Third INGO. Monthly reports. Datum unverified.',
};
