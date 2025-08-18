/*
 * Snooker Scoreboard — Logic
 * ฟีเจอร์ใหม่:
 * 1) ประวัติระหว่างเกม (ไม่บันทึกหลังจบเกม)
 * 2) ปุ่ม "แก้สนุ๊ก +2" (อยู่กลุ่มเดียวกับฟาว)
 *
 * หมายเหตุ: ฟาว +4 และ แก้สนุ๊ก +2 ในที่นี้ จะให้แต้มกับ "ฝั่งตรงข้ามของผู้เล่นที่กำลังแทง (active)"
 * หากต้องการให้แต้มกับผู้เล่นปัจจุบัน ให้เปลี่ยน target เป็น 'self' ในส่วนที่คอมเมนต์ไว้ด้านล่าง
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  players: [
    { name: 'ผู้เล่น A', score: 0 },
    { name: 'ผู้เล่น B', score: 0 }
  ],
  current: 0, // index ของผู้เล่นที่กำลังแทงอยู่
  history: [] // { ts, playerIndex, playerName, action, points, target }
};

const IDS = {
  p0Name: '#p0Name', p1Name: '#p1Name', p0Score: '#p0Score', p1Score: '#p1Score',
  p0Badge: '#p0Badge', p1Badge: '#p1Badge',
  nameA: '#nameA', nameB: '#nameB',
  historyList: '#historyList'
};

function init() {
  bindUI();
  renderAll();
}

function bindUI() {
  $('#saveNames').addEventListener('click', () => {
    // TODO: แก้ชื่อผู้เล่นตามต้องการ
    const a = $(IDS.nameA).value.trim();
    const b = $(IDS.nameB).value.trim();
    if (a) state.players[0].name = a;
    if (b) state.players[1].name = b;
    renderNames();
  });

  $('#swapTurn').addEventListener('click', () => {
    state.current = 1 - state.current;
    renderTurnBadge();
  });

  // ปุ่มทำคะแนน (ฝั่งผู้เล่นที่กำลังแทงอยู่)
  $$('.grid-balls .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const points = Number(btn.dataset.points);
      const label = btn.dataset.label || `+${points}`;
      addPoints('self', points, label); // ให้แต้มกับผู้เล่นที่กำลังแทง
    });
  });

  // ฟาว / แก้สนุ๊ก (ให้แต้มฝั่งตรงข้าม)
  $$('.grid-foul .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const points = Number(btn.dataset.points);
      const label = btn.dataset.label || 'ฟาว';
      addPoints('opponent', points, label); // เปลี่ยนเป็น 'self' ถ้าต้องการให้ฝั่งปัจจุบัน
    });
  });

  $('#undo').addEventListener('click', undoLast);
  $('#reset').addEventListener('click', resetGame);
  $('#copyHistory').addEventListener('click', copyHistory);
  $('#clearHistory').addEventListener('click', clearHistory);
}

function renderAll() {
  renderNames();
  renderScores();
  renderTurnBadge();
  renderHistory();
}

function renderNames() {
  $(IDS.p0Name).textContent = state.players[0].name;
  $(IDS.p1Name).textContent = state.players[1].name;
}

function renderScores() {
  $(IDS.p0Score).textContent = state.players[0].score;
  $(IDS.p1Score).textContent = state.players[1].score;
}

function renderTurnBadge() {
  const b0 = $(IDS.p0Badge), b1 = $(IDS.p1Badge);
  if (state.current === 0) { b0.hidden = false; b1.hidden = true; } else { b0.hidden = true; b1.hidden = false; }
}

function addPoints(target, points, actionLabel) {
  const recipient = (target === 'self') ? state.current : (1 - state.current);
  state.players[recipient].score += points;

  const entry = {
    ts: Date.now(),
    playerIndex: recipient,
    playerName: state.players[recipient].name,
    action: actionLabel,
    points,
    target // 'self' หรือ 'opponent'
  };
  state.history.push(entry);

  renderScores();
  renderHistory();
}

function renderHistory() {
  const list = $(IDS.historyList);
  list.innerHTML = '';
  const last100 = state.history.slice(-100).reverse(); // แสดงล่าสุดขึ้นก่อน, จำกัด 100 รายการ
  for (const h of last100) {
    const li = document.createElement('li');
    li.className = 'history-item';

    const time = new Date(h.ts);
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');

    // รูปแบบ: 12:34 | เนม | สีแดง | +1
    li.innerHTML = `
      <span class="time" aria-hidden="true">${hh}:${mm}</span>
      <span class="who">${escapeHTML(h.playerName)}</span>
      <span class="act">ได้ ${escapeHTML(h.action)}</span>
      <span class="pts">+${h.points}</span>
    `;

    list.appendChild(li);
  }
}

function undoLast() {
  const last = state.history.pop();
  if (!last) return;
  // ย้อนคะแนนกลับออก
  state.players[last.playerIndex].score -= last.points;
  renderScores();
  renderHistory();
}

function resetGame() {
  if (!confirm('เริ่มเกมใหม่? คะแนนและประวัติในเกมนี้จะถูกล้าง')) return;
  state.players[0].score = 0;
  state.players[1].score = 0;
  state.history = [];
  state.current = 0;
  renderAll();
}

function clearHistory() {
  if (!state.history.length) return;
  if (!confirm('ล้างเฉพาะประวัติระหว่างเกม?')) return;
  state.history = [];
  renderHistory();
}

function copyHistory() {
  const lines = state.history.map(h => {
    const t = new Date(h.ts);
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} | ${h.playerName} | ${h.action} | +${h.points}`;
  });
  const text = lines.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    alert('คัดลอกประวัติแล้ว');
  }).catch(() => alert('เบราว์เซอร์ปฏิเสธการคัดลอก'));
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}

// เริ่มทำงาน
init();
