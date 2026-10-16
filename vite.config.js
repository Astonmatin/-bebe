import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // ตอน npm run dev ให้ส่งคำขอ /api ไปที่ Express (npm run dev:api)
    proxy: { '/api': 'http://localhost:3001' },
  },
});
