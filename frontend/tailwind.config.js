export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        flag: {
          valid: '#16a34a',
          baro: '#f59e0b',
          stale: '#64748b',
          datum: '#a855f7',
          spike: '#dc2626',
          gap: '#0ea5e9',
        },
      },
    },
  },
  plugins: [],
};
