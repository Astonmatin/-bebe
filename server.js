// เซิร์ฟเวอร์ Express สำหรับรันบนเครื่อง/โฮสต์ที่ไม่ใช่ Vercel
//   npm run build && npm start  → เสิร์ฟทั้งหน้าเว็บ (dist) และ /api ในพอร์ตเดียว
//   npm run dev:api             → รันเฉพาะ API (ใช้คู่กับ npm run dev, Vite จะ proxy /api มาให้)
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import health from './api/health.js';

const app = express();
const PORT = process.env.PORT || 3001;
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');

app.use(express.json());

app.get('/api/health', health);
// เพิ่ม route อื่นได้ที่นี่ หรือสร้างไฟล์ใหม่ใน /api (เช่น api/save-message.js)
// แล้ว import มาใส่แบบเดียวกัน เพื่อให้ใช้ได้ทั้งบน Vercel และบนเครื่อง

app.use(express.static(dist));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
