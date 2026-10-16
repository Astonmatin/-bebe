# Scratch Love Card

โปรเจกต์เดียว (Vite + Vanilla JS) รวมหน้าเว็บและ API ไว้ด้วยกัน ไม่แยกโฟลเดอร์ frontend/backend

```
index.html, src/        หน้าเว็บ (Vite)
src/assets/             รูปภาพ: beautiful.jpg, crying.jpg, cheesy.jpg, couple.jpg
api/health.js           API (เป็น Serverless Function บน Vercel อัตโนมัติ)
server.js               Express สำหรับรันบนเครื่อง/โฮสต์อื่น (ใช้ api/ ชุดเดียวกัน)
```

## รันบนเครื่อง
```
npm install
npm run dev          # หน้าเว็บ  http://localhost:5173
npm run dev:api      # (ถ้าต้องใช้ API) เปิดอีก Terminal, พอร์ต 3001
```
รันแบบ production พอร์ตเดียว: `npm run build && npm start`

## Deploy บน Vercel
Import repo แล้วกด Deploy ได้เลย **ไม่ต้องตั้ง Root Directory** (Vercel ตรวจเจอ Vite และโฟลเดอร์ `api/` เอง)
