// ใช้ร่วมกัน 2 ที่:
//  - บน Vercel: ไฟล์ใน /api กลายเป็น Serverless Function อัตโนมัติ (/api/health)
//  - บนเครื่อง/เซิร์ฟเวอร์เอง: server.js เรียกใช้ฟังก์ชันเดียวกันนี้
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', message: 'Backend is running correctly!' });
}
