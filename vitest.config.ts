import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
  },
coverage: {
    provider: 'v8',
    reporter: ['json', 'text-summary'],
    exclude: ['node_modules', 'dist', '.next', 'coverage', '**/*.d.ts', '**/*.config.*', '**/test/**'],
  },,
});
