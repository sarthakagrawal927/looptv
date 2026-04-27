import path from 'path';

import react from '@vitejs/plugin-react';
import { defineVitestConfig } from '@saas-maker/test-config/vitest';

export default defineVitestConfig({
  extend: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },
});
