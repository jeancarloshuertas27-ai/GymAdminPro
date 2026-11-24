import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const PORTAL_DEFAULTS = {
  admin: {
    VITE_PORTAL_MODE: 'admin',
    VITE_APP_TITLE: 'GymAdminPro | Administrador',
    VITE_API_URL: 'https://gymcore-api.j34n.workers.dev',
  },
  recepcion: {
    VITE_PORTAL_MODE: 'recepcion',
    VITE_APP_TITLE: 'GymAdminPro | Recepción',
    VITE_API_URL: 'https://gymcore-api.j34n.workers.dev',
  },
  miembro: {
    VITE_PORTAL_MODE: 'miembro',
    VITE_APP_TITLE: 'GymAdminPro | Miembro',
    VITE_API_URL: 'https://gymcore-api.j34n.workers.dev',
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const defaults = PORTAL_DEFAULTS[mode];
  const define = defaults
    ? {
        'import.meta.env.VITE_PORTAL_MODE': JSON.stringify(env.VITE_PORTAL_MODE || defaults.VITE_PORTAL_MODE),
        'import.meta.env.VITE_APP_TITLE': JSON.stringify(env.VITE_APP_TITLE || defaults.VITE_APP_TITLE),
        'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || defaults.VITE_API_URL),
      }
    : undefined;

  return {
    plugins: [react()],
    ...(define ? { define } : {}),
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    test: {
      server: {
        deps: {
          external: ['node:sqlite', /^node:/],
        },
      },
    },
  };
});
