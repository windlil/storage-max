import { defineConfig } from "tsup"

export default defineConfig({
  entry: ['core/index.ts'],
  outDir: 'dist',
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: true,
  minify: 'terser',
  format: ['cjs', 'esm']
})