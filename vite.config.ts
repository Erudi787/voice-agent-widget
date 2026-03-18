/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

/** Reads public/index.html after build and writes dist/index.html with env vars injected */
function injectEnvPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'inject-env-into-html',
    closeBundle() {
      const srcPath = resolve(__dirname, 'public/index.html');
      const destPath = resolve(__dirname, 'dist/index.html');
      let html = readFileSync(srcPath, 'utf-8');
      html = html
        .replaceAll('YOUR_PUBLIC_KEY', env.VITE_PUBLIC_KEY || 'YOUR_PUBLIC_KEY')
        .replaceAll('YOUR_ASSISTANT_ID', env.VITE_ASSISTANT_ID || 'YOUR_ASSISTANT_ID');
      writeFileSync(destPath, html);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [injectEnvPlugin(env)],
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
  };
});
