import './style.css';

/* ---------- รูปภาพ ----------
   ดึงรูปทั้งหมดใน src/assets ผ่าน Vite (ได้ URL ที่ถูกต้องทั้ง dev และ build)
   ถ้ายังไม่มีไฟล์ใด (เช่น couple.jpg) จะขึ้นภาพ placeholder แทน ไม่ error */
const assetUrls = import.meta.glob('./assets/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function assetUrl(name) {
  const key = Object.keys(assetUrls).find(
    (k) => k.split('/').pop().replace(/\.[^.]+$/, '') === name
  );
  return key ? assetUrls[key] : null;
}

function placeholder(name) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="840" viewBox="0 0 640 840">` +
    `<rect width="100%" height="100%" fill="#fde7ee"/>` +
    `<text x="50%" y="44%" text-anchor="middle" font-size="96">💑</text>` +
    `<text x="50%" y="54%" text-anchor="middle" font-size="30" fill="#e0607e" font-family="sans-serif">` +
    `วางรูป ${name}.jpg ใน src/assets</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/* ---------- ข้อมูลแต่ละโหมด ---------- */
const MOODS = {
  beautiful: {
    image: 'beautiful',
    text: 'ไม่ว่ามุมไหน เธอก็น่ารักที่สุดสำหรับเราเสมอเลยนะ รู้ตัวป่ะ?',
    cover: ['#ffd6df', '#ffa9bd'],
  },
  crying: {
    image: 'crying',
    text: 'ถึงจะแอบงอแงหรือตาบวม เราก็รักเหมือนเดิมแหละ โอ๋ๆ น้า',
    cover: ['#cfe8ff', '#9fcdfb'],
  },
  cheesy: {
    image: 'cheesy',
    text: 'เบิ้มๆ คือลือๆ มากๆคับอ้วน',
    cover: ['#fdd0ee', '#f3a6dc'],
  },
  couple: {
    image: 'couple',
    text: 'เราสองคนเนี่ย... คู่ที่ใช่ที่สุดเลยนะ 💕',
    cover: ['#f7dc8a', '#d9a53a'],
    foil: true, // ผิวฟอยล์ทองมันวาว
  },
};

/* ---------- ค่าคงที่ของการขูด ---------- */
const RADIUS = 22;        // รัศมีแปรง (px)
const CELL = 12;          // ขนาดช่องกริดนับพื้นที่ที่ขูดแล้ว (px)
const REVEAL_AT = 0.5;    // ขูดถึงกี่ % แล้วเปิดทั้งใบ

/* ---------- element ---------- */
const container = document.getElementById('scratch-container');
const canvas = document.getElementById('scratch-canvas');
const ctx = canvas.getContext('2d', { desynchronized: true });
const imgEl = document.getElementById('reveal-image');
const textEl = document.getElementById('reveal-text');
const selector = document.getElementById('mood-selector');
const bar = document.getElementById('progress-bar');

/* ---------- state ---------- */
let current = '';
let selectToken = 0;
const revealed = new Set();   // โหมดที่เปิดแล้ว (กลับมาดูใหม่จะไม่ต้องขูดซ้ำ)

let W = 0, H = 0, dpr = 1;
let cols = 0, rows = 0, grid = new Uint8Array(0), cleared = 0, lastPct = -1;
let drawing = false, last = null, rect = null;

/* ---------- วาดผิวการ์ด ---------- */
function setupCanvas() {
  W = container.clientWidth;
  H = container.clientHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2); // จำกัด 2x เพื่อไม่ให้ canvas ใหญ่เกินจำเป็น
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  cols = Math.ceil(W / CELL);
  rows = Math.ceil(H / CELL);
  grid = new Uint8Array(cols * rows);
  cleared = 0;
  lastPct = -1;
  setProgress(0);
}

function paintCover(mood) {
  const [c1, c2] = mood.cover;
  ctx.globalCompositeOperation = 'source-over';

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (mood.foil) {
    // แถบสะท้อนแสงแนวทแยง ให้ดูเป็นฟอยล์
    const s = ctx.createLinearGradient(0, 0, W, H);
    s.addColorStop(0.0, 'rgba(255,255,255,0)');
    s.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    s.addColorStop(0.5, 'rgba(255,255,255,0)');
    s.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    s.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, W, H);
  }

  // ลายหัวใจ/ประกาย กระจายแบบคงที่ (ไม่สุ่มใหม่ทุกครั้ง)
  ctx.fillStyle = mood.foil ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.35)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '16px "Prompt", sans-serif';
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    ctx.fillText(i % 3 === 0 ? '✦' : '♥', rnd() * W, rnd() * H);
  }

  ctx.font = '600 20px "Prompt", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.fillText('ใช้นิ้วถูเพื่อดูความลับ ✨', W / 2, H / 2);
  ctx.shadowBlur = 0;

  // พร้อมขูด
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = RADIUS * 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/* ---------- นับพื้นที่ที่ขูดด้วยกริด (O(1) ต่อการขยับ ไม่ต้อง getImageData) ---------- */
function markCircle(x, y) {
  const c0 = Math.max(0, Math.floor((x - RADIUS) / CELL));
  const c1 = Math.min(cols - 1, Math.floor((x + RADIUS) / CELL));
  const r0 = Math.max(0, Math.floor((y - RADIUS) / CELL));
  const r1 = Math.min(rows - 1, Math.floor((y + RADIUS) / CELL));
  const r2 = RADIUS * RADIUS;
  for (let r = r0; r <= r1; r++) {
    const dy = (r + 0.5) * CELL - y;
    for (let c = c0; c <= c1; c++) {
      const i = r * cols + c;
      if (grid[i]) continue;
      const dx = (c + 0.5) * CELL - x;
      if (dx * dx + dy * dy <= r2) {
        grid[i] = 1;
        cleared++;
      }
    }
  }
}

function markLine(a, b) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.ceil(dist / (CELL / 2)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    markCircle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}

function setProgress(ratio) {
  const pct = Math.min(100, Math.round((ratio / REVEAL_AT) * 100));
  if (pct === lastPct) return;
  lastPct = pct;
  bar.style.transform = `scaleX(${pct / 100})`;
}

/* ---------- การขูด (Pointer Events: เมาส์/ทัช/ปากกา ใช้โค้ดชุดเดียว) ---------- */
function pointFrom(e) {
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onDown(e) {
  if (revealed.has(current)) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  drawing = true;
  rect = canvas.getBoundingClientRect(); // อ่านครั้งเดียวต่อการขูด ไม่อ่านทุกการขยับ
  last = pointFrom(e);

  ctx.beginPath();
  ctx.arc(last.x, last.y, RADIUS, 0, Math.PI * 2);
  ctx.fill();
  markCircle(last.x, last.y);
  checkProgress();
}

function onMove(e) {
  if (!drawing) return;
  e.preventDefault();
  // รวมจุดที่เบราว์เซอร์ข้ามไประหว่างเฟรม แล้ว stroke ครั้งเดียว
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  for (const ev of events.length ? events : [e]) {
    const p = pointFrom(ev);
    ctx.lineTo(p.x, p.y);
    markLine(last, p);
    last = p;
  }
  ctx.stroke();
  checkProgress();
}

function onUp(e) {
  drawing = false;
  last = null;
  if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
}

function checkProgress() {
  const ratio = cleared / (cols * rows);
  setProgress(ratio);
  if (ratio >= REVEAL_AT) reveal();
}

/* ---------- เปิดภาพ ---------- */
function reveal() {
  if (revealed.has(current)) return;
  revealed.add(current);
  drawing = false;
  setProgress(REVEAL_AT);
  container.classList.add('is-revealed');
  burstHearts();
}

function burstHearts() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const symbols = ['💕', '💖', '✨'];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'heart';
    s.textContent = symbols[i % 3];
    s.style.setProperty('--x', `${(Math.random() * 2 - 1) * 110}px`);
    s.style.setProperty('--delay', `${Math.random() * 0.25}s`);
    s.style.left = `${30 + Math.random() * 40}%`;
    s.addEventListener('animationend', () => s.remove(), { once: true });
    frag.append(s);
  }
  container.append(frag);
}

/* ---------- เลือกโหมด ---------- */
async function selectMood(key) {
  const mood = MOODS[key];
  if (!mood) return;
  const token = ++selectToken;
  current = key;

  for (const b of selector.children) {
    const on = b.dataset.mood === key;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  }

  textEl.textContent = mood.text;
  const src = assetUrl(mood.image) ?? placeholder(mood.image);
  imgEl.alt = mood.text;

  if (revealed.has(key)) {
    // เคยเปิดแล้ว: โหลดรูปให้เสร็จก่อนค่อยโชว์ จะได้ไม่เห็นรูปเก่าวูบ
    if (imgEl.getAttribute('src') !== src) {
      imgEl.src = src;
      try { await imgEl.decode(); } catch { /* รูปเสีย/ยังไม่มี: ข้าม */ }
    }
    if (token === selectToken) container.classList.add('is-revealed');
    return;
  }

  // ยังไม่เคยเปิด: ปิดผิวทับก่อน แล้วค่อยเปลี่ยนรูปข้างใต้
  container.classList.remove('is-revealed');
  setupCanvas();
  paintCover(mood);
  if (imgEl.getAttribute('src') !== src) imgEl.src = src;
}

selector.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-mood]');
  if (btn && btn.dataset.mood !== current) selectMood(btn.dataset.mood);
});

/* ---------- events ---------- */
canvas.addEventListener('pointerdown', onDown);
canvas.addEventListener('pointermove', onMove);
canvas.addEventListener('pointerup', onUp);
canvas.addEventListener('pointercancel', onUp);
canvas.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    reveal();
  }
});

// ขนาดการ์ดเปลี่ยนจริงๆ (เช่น หมุนจอ) ค่อยวาดผิวใหม่ ไม่ทำทุก resize event
let ro;
function watchSize() {
  let w = container.clientWidth, h = container.clientHeight;
  ro = new ResizeObserver(() => {
    if (container.clientWidth === w && container.clientHeight === h) return;
    w = container.clientWidth;
    h = container.clientHeight;
    if (current && !revealed.has(current)) {
      setupCanvas();
      paintCover(MOODS[current]);
    }
  });
  ro.observe(container);
}

/* ---------- เริ่มต้น: รอฟอนต์ก่อนวาดข้อความลง canvas ---------- */
(async () => {
  try {
    await Promise.all([
      document.fonts.load('600 20px "Prompt"'),
      document.fonts.load('16px "Prompt"'),
    ]);
  } catch { /* ใช้ฟอนต์สำรอง */ }
  watchSize();
  selectMood('beautiful');
})();
