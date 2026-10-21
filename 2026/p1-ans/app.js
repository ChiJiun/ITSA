// 叫號與候位系統：Express + SQLite（Node 22 內建 node:sqlite，同步 API 最好寫）
const express = require('express');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(__dirname + '/queue.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS counters (prefix TEXT PRIMARY KEY, n INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,      -- 越早取號 id 越小
    number TEXT NOT NULL UNIQUE,               -- A001、G012…
    service TEXT NOT NULL,                     -- G / A / C
    status TEXT NOT NULL DEFAULT 'waiting',    -- waiting → serving → completed
    created_at INTEGER NOT NULL,               -- 時間存毫秒數字，排序最準
    called_at INTEGER,
    finished_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_status ON tickets(status, created_at);
`);

// 服務白名單：代碼 → 名稱
const SERVICES = { G: '一般服務', A: '開戶/申辦', C: '諮詢' };
const sessions = new Set(); // 已登入的 session id（登出就刪掉）

const p2 = n => String(n).padStart(2, '0');
const fmt = t => {
  if (!t) return null;
  const d = new Date(t); // 格式：2026/7/7 15:10:14
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
};
const view = t => !t ? null : { // 查無資料回傳 null（JSON 才會有 current: null）
  number: t.number, service: SERVICES[t.service],
  createdAt: fmt(t.created_at), calledAt: fmt(t.called_at), finishedAt: fmt(t.finished_at),
};
const all = (sql, ...a) => db.prepare(sql).all(...a).map(view);
const current = () => view(db.prepare("SELECT * FROM tickets WHERE status='serving'").get());
const waiting = () => all("SELECT * FROM tickets WHERE status='waiting' ORDER BY created_at, id");
const history = () => all("SELECT * FROM tickets WHERE status='completed' ORDER BY finished_at DESC, id DESC");

const app = express();
app.use(express.json(), express.urlencoded({ extended: false }), express.static(__dirname + '/public'));
app.get('/', (req, res) => res.redirect('/team123.html'));

// 公開 API
app.get('/api/state', (req, res) => res.json({ current: current(), waiting: waiting(), history: history() }));

app.post('/api/tickets', (req, res) => {
  const s = req.body.service;
  // 接受代碼(G/A/C)或中文名稱；不在白名單 → 400
  const code = SERVICES[s] ? s : Object.keys(SERVICES).find(k => SERVICES[k] === s);
  if (!code) return res.status(400).json({ error: '服務類別錯誤' });
  // 計數器 +1 後取回（不存在就從 1 開始），序號存在 DB → 重開機也接續
  const { n } = db.prepare('INSERT INTO counters VALUES (?, 1) ON CONFLICT(prefix) DO UPDATE SET n = n + 1 RETURNING n').get(code);
  const number = code + String(n).padStart(3, '0'); // 1000 以上自然變 4 位數
  const now = Date.now();
  db.prepare('INSERT INTO tickets (number, service, created_at) VALUES (?, ?, ?)').run(number, code, now);
  res.status(201).json({ number, service: SERVICES[code], createdAt: fmt(now) });
});

// 登入：成功就發一個隨機 sid 放進 Cookie
app.post('/api/login', (req, res) => {
  if ((req.body.username ?? req.body.account) !== 'admin' || req.body.password !== 'password123') return res.status(401).json({ error: '帳號或密碼錯誤' });
  const sid = crypto.randomUUID();
  sessions.add(sid);
  res.cookie('sid', sid, { httpOnly: true, sameSite: 'strict' }).json({ ok: true });
});

// 管理 API 一律先檢查 session（伺服器端驗證，不是只藏按鈕）
const sidOf = req => (req.headers.cookie || '').match(/(?:^|;\s*)sid=([^;]+)/)?.[1];
const auth = (req, res, next) => sessions.has(sidOf(req)) ? next() : res.status(401).json({ error: '請先登入' });

app.post('/api/logout', auth, (req, res) => {
  sessions.delete(sidOf(req)); // 伺服器端銷毀，舊 Cookie 重放也無效
  res.clearCookie('sid').status(204).end();
});

app.post('/api/admin/next', auth, (req, res) => {
  if (current()) return res.status(409).json({ error: '請先完成目前服務' });
  const t = db.prepare("SELECT id FROM tickets WHERE status='waiting' ORDER BY created_at, id LIMIT 1").get();
  if (!t) return res.status(409).json({ error: '目前無等待中的號碼' });
  db.prepare("UPDATE tickets SET status='serving', called_at=? WHERE id=?").run(Date.now(), t.id);
  res.json({ current: current() });
});

app.post('/api/admin/complete', auth, (req, res) => {
  const r = db.prepare("UPDATE tickets SET status='completed', finished_at=? WHERE status='serving'").run(Date.now());
  if (!r.changes) return res.status(409).json({ error: '目前沒有服務中的號碼' });
  res.json({ ok: true });
});

app.get('/api/admin/history', auth, (req, res) => res.json(history()));

app.listen(3000, () => console.log('http://localhost:3000'));
