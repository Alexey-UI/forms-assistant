import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'prisma/seed.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  noExternal: ['@forms-assistant/shared'],
});
