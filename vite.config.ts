/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';

/** Replaces placeholder strings in public/index.html with env vars at build time */
function injectEnvPlugin(): Plugin {
  return {
    name: 'inject-env-into-html',
    transformIndexHtml(html) {
      return html
        .replace(/YOUR_PUBLIC_KEY/g, process.env.VITE_PUBLIC_KEY || 'YOUR_PUBLIC_KEY')
        .replace(/YOUR_ASSISTANT_ID/g, process.env.VITE_ASSISTANT_ID || 'YOUR_ASSISTANT_ID');
    },
  };
}

export default defineConfig({
  plugins: [injectEnvPlugin()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/loader/index.ts'),
      name: 'VoiceAgentWidget',
      fileName: () => 'voice-widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    sourcemap: true,
  },
  server: {
    open: '/demo.html',
    watch: {
      ignored: ['!**/src/**'],
    },
  },
});
