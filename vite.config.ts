/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const page = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Ôn HCM202',
        short_name: 'HCM202',
        description: 'Ôn trắc nghiệm Tư tưởng Hồ Chí Minh kiểu Anki, có thi thử',
        lang: 'vi',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f0c20',
        theme_color: '#0f0c20',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico}'],
        // Trang tĩnh phải tải đúng HTML của nó, không bị thay bằng app.
        navigateFallbackDenylist: [/^\/gioi-thieu/, /^\/chinh-sach-quyen-rieng-tu/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: page('./index.html'),
        about: page('./gioi-thieu/index.html'),
        privacy: page('./chinh-sach-quyen-rieng-tu/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
  },
});
