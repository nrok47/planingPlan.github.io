import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Use VITE_DEPLOY_URL at build time to set the base path for assets and fetches
      base: env.VITE_DEPLOY_URL || '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            // ปิดการสร้างชื่อไฟล์แบบสุ่ม ใช้ชื่อธรรมดาแทน
            entryFileNames: 'assets/[name].js',
            chunkFileNames: 'assets/[name].js',
            assetFileNames: (assetInfo) => {
              // ให้ไฟล์รูปภาพและ asset อื่นๆ ใช้ชื่อธรรมดา ไม่มี hash
              return 'assets/[name][extname]';
            }
          }
        }
      }
    };
});
