import vue from '@vitejs/plugin-vue'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    dts({
      outDir: 'dist',
      // Keep declarations per source file. API Extractor currently cannot
      // follow Vue's generated component instance `$nextTick` symbol.
      rollupTypes: false,
      entryRoot: 'src',
      tsconfigPath: resolve(__dirname, 'tsconfig.json'),
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        vitepress: resolve(__dirname, 'src/vitepress.ts'),
        'vitepress-plugin': resolve(__dirname, 'src/vitepress-plugin.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        /^node:/,
        'vue',
        '@opentiny/tiny-robot',
        '@opentiny/tiny-robot-chat',
        '@opentiny/tiny-robot-kit',
        '@opentiny/tiny-robot-svgs',
        'vitepress',
        'vite',
      ],
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
})
