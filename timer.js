'use strict';

// ── 授業スケジュール（Python版と同じ） ──
const SCHEDULE = [
  { period: 1, start: [9,  10], end: [10, 40] },
  { period: 2, start: [10, 50], end: [12, 20] },
  { period: 3, start: [13, 10], end: [14, 40] },
  { period: 4, start: [14, 50], end: [16, 20] },
];

// ── DOM refs ──
const elClock     = document.getElementById('clock');
const elStatus    = document.getElementById('status');
const elBar       = document.getElementById('progress-bar');
const elPct       = document.getElementById('bar-pct');
const elBarLabel  = document.getElementById('bar-label');
const elElapsed   = document.getElementById('elapsed');
const elRemaining = document.getElementById('remaining');
const elList      = document.getElementById('schedule-list');

// ── Helpers ──
function toSec(h, m) { return h * 3600 + m * 60; }

function pad2(n) { return String(n).padStart(2, '0'); }

function formatTime(h, m) {
  return `${pad2(h)}:${pad2(m)}`;
}

// ── スケジュール行を一度だけ生成 ──
function buildSchedule() {
  SCHEDULE.forEach(s => {
    const row = document.createElement('div');
    row.className = 'schedule-row';
    row.id = `row-${s.period}`;

    const periodEl = document.createElement('span');
    periodEl.className = 'schedule-period';
    periodEl.textContent = `${s.period}限`;

    const timeEl = document.createElement('span');
    timeEl.className = 'schedule-time';
    timeEl.textContent =
      `${formatTime(...s.start)} – ${formatTime(...s.end)}`;

    const tagEl = document.createElement('span');
    tagEl.className = 'schedule-tag';
    tagEl.id = `tag-${s.period}`;

    row.appendChild(periodEl);
    row.appendChild(timeEl);
    row.appendChild(tagEl);
    elList.appendChild(row);
  });
}

// ── スケジュール行の状態を更新 ──
function updateScheduleRows(cur, activePeriod, nextPeriod) {
  SCHEDULE.forEach(s => {
    const row = document.getElementById(`row-${s.period}`);
    const tag = document.getElementById(`tag-${s.period}`);
    const endSec = toSec(...s.end);

    row.className = 'schedule-row';
    tag.className = 'schedule-tag';
    tag.textContent = '';

    if (activePeriod && activePeriod.period === s.period) {
      row.classList.add('is-active');
      tag.classList.add('tag-active');
      tag.textContent = '授業中';
    } else if (nextPeriod && nextPeriod.period === s.period) {
      tag.classList.add('tag-next');
      tag.textContent = '次の授業';
    } else if (cur > endSec) {
      tag.classList.add('tag-done');
      tag.textContent = '終了';
    }
  });
}

// ── メイン更新ループ ──
function update() {
  const now = new Date();
  const hh = pad2(now.getHours());
  const mm = pad2(now.getMinutes());
  const ss = pad2(now.getSeconds());
  elClock.textContent = `${hh}:${mm}:${ss}`;

  const cur = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  // 現在授業中 or 次の授業を特定（Pythonロジックをそのまま移植）
  let activePeriod = null;
  let nextPeriod   = null;

  for (let i = 0; i < SCHEDULE.length; i++) {
    const s = SCHEDULE[i];
    const st = toSec(...s.start);
    const en = toSec(...s.end);

    if (cur >= st && cur <= en) {
      activePeriod = s;
      break;
    } else if (cur < st && !nextPeriod) {
      nextPeriod = s;
      break;
    }
  }

  // ── 表示更新 ──
  if (activePeriod) {
    // --- 授業中 ---
    const st = toSec(...activePeriod.start);
    const en = toSec(...activePeriod.end);
    const total   = en - st;
    const elapsed = cur - st;
    const rem     = en - cur;
    const pct     = Math.round((elapsed / total) * 100);

    elStatus.textContent = `${activePeriod.period} 時限目`;
    elStatus.className = 'status';

    elBar.style.width = pct + '%';
    elBar.className = 'progress-bar';
    elPct.textContent = pct + '%';
    elBarLabel.textContent = '授業の進捗';

    elElapsed.textContent  = `${Math.floor(elapsed / 60)}分`;
    elRemaining.textContent = `${Math.floor(rem / 60)}分`;

  } else if (nextPeriod) {
    // --- 休み時間 ---
    const nst = toSec(...nextPeriod.start);

    // 直前の授業終了時刻（なければ 0:00）
    let prevEndSec = 0;
    for (let i = SCHEDULE.length - 1; i >= 0; i--) {
      const en = toSec(...SCHEDULE[i].end);
      if (en <= cur) { prevEndSec = en; break; }
    }

    const totalBreak   = nst - prevEndSec;
    const breakElapsed = cur - prevEndSec;
    const breakRem     = nst - cur;
    const pct = totalBreak > 0
      ? Math.round(Math.min(breakElapsed / totalBreak, 1) * 100)
      : 0;

    const remMin = Math.floor(breakRem / 60);
    const remSec = Math.floor(breakRem % 60);

    elStatus.textContent = '休み時間';
    elStatus.className = 'status is-break';

    elBar.style.width = pct + '%';
    elBar.className = 'progress-bar is-break';
    elPct.textContent = pct + '%';
    elBarLabel.textContent = '休み時間の進捗';

    elElapsed.textContent  = '—';
    elRemaining.textContent = `${remMin}分 ${pad2(remSec)}秒`;

  } else {
    // --- 全授業終了 or 授業前 ---
    const allDone = SCHEDULE.every(s => cur > toSec(...s.end));

    elStatus.textContent = allDone ? '放課後' : '授業前';
    elStatus.className   = 'status ' + (allDone ? 'is-after' : 'is-before');

    elBar.style.width = allDone ? '100%' : '0%';
    elBar.className   = 'progress-bar is-done';
    elPct.textContent = allDone ? '100%' : '—';
    elBarLabel.textContent = '進捗';

    elElapsed.textContent  = '—';
    elRemaining.textContent = '—';
  }

  updateScheduleRows(cur, activePeriod, nextPeriod);
}

// ── 初期化 ──
buildSchedule();
update();
setInterval(update, 1000);
