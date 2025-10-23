import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  minify: false,
  bundle: true,
  noExternal: [/\.*/],
  platform: 'node',
  skipNodeModulesBundle: false,
})
