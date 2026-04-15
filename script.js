
'use strict';

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const BLOCK = 30; // px

// Drop intervals per difficulty (ms)
const DROP_INTERVALS = { 1: 900, 2: 600, 3: 380, 4: 220, 5: 90 };

// Scoring multipliers per difficulty
const DIFF_MULTIPLIER = { 1: 1, 2: 1.2, 3: 1.5, 4: 2, 5: 3 };

// Base scores
const LINE_SCORES    = [0, 100, 300, 500, 800];   // 0,1,2,3,4 lines
const TSPIN_SCORES   = [0, 400, 700];              // tspin 0,1,2 lines
const PERFECT_CLEAR  = 2000;
const SOFT_DROP_PTS  = 1;
const HARD_DROP_PTS  = 2;
const BACK2BACK_MULT = 1.5;

// Tetrominoes  [shape matrices, color]
const PIECES = {
  I: { color: '#00cfcf', shapes: [
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]] ]},
  O: { color: '#f0d000', shapes: [
        [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]] ]},
  T: { color: '#a000f0', shapes: [
        [[0,1,0],[1,1,1],[0,0,0]],
        [[0,1,0],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,1],[0,1,0]],
        [[0,1,0],[1,1,0],[0,1,0]] ]},
  S: { color: '#00c000', shapes: [
        [[0,1,1],[1,1,0],[0,0,0]],
        [[0,1,0],[0,1,1],[0,0,1]],
        [[0,0,0],[0,1,1],[1,1,0]],
        [[1,0,0],[1,1,0],[0,1,0]] ]},
  Z: { color: '#c00000', shapes: [
        [[1,1,0],[0,1,1],[0,0,0]],
        [[0,0,1],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,0],[0,1,1]],
        [[0,1,0],[1,1,0],[1,0,0]] ]},
  J: { color: '#0050f0', shapes: [
        [[1,0,0],[1,1,1],[0,0,0]],
        [[0,1,1],[0,1,0],[0,1,0]],
        [[0,0,0],[1,1,1],[0,0,1]],
        [[0,1,0],[0,1,0],[1,1,0]] ]},
  L: { color: '#f0a000', shapes: [
        [[0,0,1],[1,1,1],[0,0,0]],
        [[0,1,0],[0,1,0],[0,1,1]],
        [[0,0,0],[1,1,1],[1,0,0]],
        [[1,1,0],[0,1,0],[0,1,0]] ]}
};
const PIECE_KEYS = Object.keys(PIECES);

// ── DOM ────────────────────────────────────────────────────────────────────────
const setupScreen  = document.getElementById('setup-screen');
const gameScreen   = document.getElementById('game-screen');
const boardCanvas  = document.getElementById('board');
const holdCanvas   = document.getElementById('hold-canvas');
const nextCanvas   = document.getElementById('next-canvas');
const scoreEl      = document.getElementById('score-val');
const linesEl      = document.getElementById('lines-val');
const comboEl      = document.getElementById('combo-val');
const modeBadge    = document.getElementById('mode-badge');
const overlay      = document.getElementById('overlay');
const finalScore   = document.getElementById('final-score');
const finalLines   = document.getElementById('final-lines');
const restartBtn   = document.getElementById('restart-btn');
const startBtn     = document.getElementById('start-btn');

const ctx      = boardCanvas.getContext('2d');
const holdCtx  = holdCanvas.getContext('2d');
const nextCtx  = nextCanvas.getContext('2d');

// ── SETUP UI ───────────────────────────────────────────────────────────────────
let selectedDiff = 1;
let selectedMode = 'normal';

document.querySelectorAll('.opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group;
    document.querySelectorAll(`.opt-btn[data-group="${group}"]`).forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    if (group === 'diff') selectedDiff = parseInt(btn.dataset.val);
    if (group === 'mode') selectedMode  = btn.dataset.val;
  });
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
  overlay.classList.remove('visible');
  setupScreen.style.display = 'flex';
  gameScreen.style.display  = 'none';
});

// ── GAME STATE ─────────────────────────────────────────────────────────────────
let board, current, ghost, holdPiece, nextQueue;
let score, lines, combo, backToBack;
let isPaused, isOver;
let difficulty, mode;
let lastTSpin;
let dropTimer, lockTimer;
let lastTime;
let dropInterval;

// ── START ──────────────────────────────────────────────────────────────────────
function startGame() {
  difficulty   = selectedDiff;
  mode         = selectedMode;
  dropInterval = DROP_INTERVALS[difficulty];

  board        = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  nextQueue    = [];
  holdPiece    = null;
  score        = 0;
  lines        = 0;
  combo        = -1;  // first non-clear resets to -1 → display 0
  backToBack   = false;
  isPaused     = false;
  isOver       = false;
  lastTSpin    = false;
  dropTimer    = 0;
  lastTime     = null;

  modeBadge.textContent = mode === 'inverted' ? 'Inverted ↑' : 'Normal ↓';

  // Fill next queue (bag system, 5 visible)
  fillBag();
  fillBag();
  current = spawnPiece(nextQueue.shift());
  updateGhost();

  setupScreen.style.display = 'none';
  gameScreen.style.display  = 'flex';
  overlay.classList.remove('visible');
  updateUI();

  requestAnimationFrame(gameLoop);
}

// ── BAG SYSTEM ─────────────────────────────────────────────────────────────────
let bag = [];
function fillBag() {
  if (bag.length === 0) bag = shuffle([...PIECE_KEYS]);
  while (bag.length > 0 && nextQueue.length < 6) {
    nextQueue.push(bag.shift());
    if (bag.length === 0) bag = shuffle([...PIECE_KEYS]);
  }
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── SPAWN ──────────────────────────────────────────────────────────────────────
function spawnPiece(key) {
  const def = PIECES[key];
  const shape = def.shapes[0];
  const size  = shape.length;
  const col   = Math.floor((COLS - size) / 2);

  let row;
  if (mode === 'inverted') {
    // Spawn at bottom; row = ROWS - size
    row = ROWS - size;
  } else {
    row = 0;
  }

  return { key, color: def.color, shapes: def.shapes, rot: 0, row, col };
}

// ── MATRIX HELPERS ─────────────────────────────────────────────────────────────
function matrix(piece) { return piece.shapes[piece.rot % piece.shapes.length]; }

function validPos(piece, dr, dc, rot) {
  const r = rot !== undefined ? rot : piece.rot;
  const m = piece.shapes[r % piece.shapes.length];
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      const nr = piece.row + y + dr;
      const nc = piece.col + x + dc;
      if (nc < 0 || nc >= COLS) return false;
      if (nr < 0 || nr >= ROWS) return false;
      if (board[nr][nc]) return false;
    }
  }
  return true;
}

// ── GHOST PIECE ────────────────────────────────────────────────────────────────
function updateGhost() {
  ghost = { ...current };
  const dir = mode === 'inverted' ? -1 : 1;
  while (validPos(ghost, dir, 0)) ghost = { ...ghost, row: ghost.row + dir };
}

// ── MOVEMENT ───────────────────────────────────────────────────────────────────
function move(dc) {
  if (isPaused || isOver) return;
  if (validPos(current, 0, dc)) {
    current.col += dc;
    updateGhost();
  }
}

function rotate(dir) { // dir: +1 CW, -1 CCW
  if (isPaused || isOver) return;
  const newRot = ((current.rot + dir) % current.shapes.length + current.shapes.length) % current.shapes.length;
  // Wall-kick offsets
  const kicks = [[0,0],[0,-1],[0,1],[0,-2],[0,2]];
  for (const [dr, dc] of kicks) {
    if (validPos(current, dr, dc, newRot)) {
      current.rot = newRot;
      current.row += dr;
      current.col += dc;
      updateGhost();
      return;
    }
  }
}

function softDrop() {
  if (isPaused || isOver) return;
  const dir = mode === 'inverted' ? -1 : 1;
  if (validPos(current, dir, 0)) {
    current.row += dir;
    score += SOFT_DROP_PTS;
    updateGhost();
    dropTimer = 0;
  } else {
    lockPiece();
  }
}

function hardDrop() {
  if (isPaused || isOver) return;
  const dir = mode === 'inverted' ? -1 : 1;
  let dist = 0;
  while (validPos(current, dir, 0)) {
    current.row += dir;
    dist++;
  }
  score += dist * HARD_DROP_PTS;
  lockPiece();
}

// ── HOLD ───────────────────────────────────────────────────────────────────────
let holdUsed = false;
function holdAction() {
  if (isPaused || isOver || holdUsed) return;
  const key = current.key;
  if (holdPiece) {
    current  = spawnPiece(holdPiece);
  } else {
    current  = spawnPiece(nextQueue.shift());
    fillBag();
  }
  holdPiece = key;
  holdUsed  = true;
  updateGhost();
}

// ── T-SPIN DETECTION ───────────────────────────────────────────────────────────
function detectTSpin() {
  if (current.key !== 'T') return false;
  const corners = [
    [current.row,                          current.col],
    [current.row,                          current.col + 2],
    [current.row + 2,                      current.col],
    [current.row + 2,                      current.col + 2]
  ];
  let filled = 0;
  for (const [r, c] of corners) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c]) filled++;
  }
  return filled >= 3;
}

// ── LOCK PIECE ─────────────────────────────────────────────────────────────────
function lockPiece() {
  const m = matrix(current);
  const isTSpin = detectTSpin();

  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      const r = current.row + y;
      const c = current.col + x;
      if (r < 0 || r >= ROWS) { gameOver(); return; }
      board[r][c] = current.color;
    }
  }

  holdUsed = false;
  const cleared = clearLines();
  processScore(cleared, isTSpin);

  // Next piece
  current = spawnPiece(nextQueue.shift());
  fillBag();
  updateGhost();

  // Check game-over (new piece overlaps)
  if (!validPos(current, 0, 0)) { gameOver(); return; }

  dropTimer = 0;
  updateUI();
}

// ── LINE CLEAR ─────────────────────────────────────────────────────────────────
function clearLines() {
  let cleared = 0;
  if (mode === 'inverted') {
    // Check from top row downward; complete rows disappear, remaining rows shift up (toward top)
    for (let r = 0; r < ROWS; r++) {
      if (board[r].every(c => c !== null)) {
        board.splice(r, 1);
        board.push(Array(COLS).fill(null)); // add empty row at bottom
        cleared++;
        r--; // re-check same index
      }
    }
  } else {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(c => c !== null)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
  }
  return cleared;
}

// ── SCORING ────────────────────────────────────────────────────────────────────
function processScore(cleared, isTSpin) {
  const mult = DIFF_MULTIPLIER[difficulty];

  if (cleared === 0) {
    combo = -1;
    lastTSpin = false;
    return;
  }

  combo++;
  lines += cleared;

  let base;
  const isHighValue = isTSpin || cleared === 4;

  if (isTSpin) {
    base = TSPIN_SCORES[Math.min(cleared, 2)];
  } else {
    base = LINE_SCORES[Math.min(cleared, 4)];
  }

  // Back-to-back bonus
  let b2bMult = 1;
  if (isHighValue && backToBack) {
    b2bMult = BACK2BACK_MULT;
  }
  backToBack = isHighValue;

  // Combo bonus
  const comboBonus = combo > 0 ? 50 * combo : 0;

  // Perfect clear
  const perfBonus = board.every(row => row.every(c => c === null)) ? PERFECT_CLEAR : 0;

  score += Math.round((base * b2bMult + comboBonus + perfBonus) * mult);
  lastTSpin = isTSpin;
}

// ── GAME OVER ──────────────────────────────────────────────────────────────────
function gameOver() {
  isOver = true;
  finalScore.textContent = score.toLocaleString();
  finalLines.textContent = lines;
  overlay.classList.add('visible');
}

// ── GAME LOOP ──────────────────────────────────────────────────────────────────
function gameLoop(ts) {
  if (isOver) return;

  if (!lastTime) lastTime = ts;
  const dt = ts - lastTime;
  lastTime = ts;

  if (!isPaused) {
    dropTimer += dt;
    if (dropTimer >= dropInterval) {
      dropTimer = 0;
      const dir = mode === 'inverted' ? -1 : 1;
      if (validPos(current, dir, 0)) {
        current.row += dir;
        updateGhost();
      } else {
        lockPiece();
        return;
      }
    }
    draw();
  }

  requestAnimationFrame(gameLoop);
}

// ── UPDATE UI ──────────────────────────────────────────────────────────────────
function updateUI() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  comboEl.textContent = combo > 0 ? `x${combo}` : 'x0';
  drawHold();
  drawNext();
}

// ── DRAWING ────────────────────────────────────────────────────────────────────
function drawBlock(context, x, y, color, alpha) {
  context.globalAlpha = alpha ?? 1;
  context.fillStyle   = color;
  context.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.18)';
  context.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 4);
  context.globalAlpha = 1;
}

function draw() {
  // Clear
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

  // Grid lines
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth   = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(COLS * BLOCK, r * BLOCK); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, ROWS * BLOCK); ctx.stroke();
  }

  // Board
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawBlock(ctx, c, r, board[r][c]);
    }
  }

  // Ghost
  const gm = matrix(ghost);
  for (let y = 0; y < gm.length; y++) {
    for (let x = 0; x < gm[y].length; x++) {
      if (!gm[y][x]) continue;
      ctx.globalAlpha = 0.22;
      ctx.fillStyle   = current.color;
      ctx.fillRect((ghost.col + x) * BLOCK + 1, (ghost.row + y) * BLOCK + 1, BLOCK - 2, BLOCK - 2);
      ctx.strokeStyle = current.color;
      ctx.lineWidth   = 1;
      ctx.strokeRect((ghost.col + x) * BLOCK + 1, (ghost.row + y) * BLOCK + 1, BLOCK - 2, BLOCK - 2);
      ctx.globalAlpha = 1;
    }
  }

  // Current piece
  const m = matrix(current);
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      drawBlock(ctx, current.col + x, current.row + y, current.color);
    }
  }

  // Pause overlay
  if (isPaused) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    ctx.fillStyle    = '#fff';
    ctx.font         = 'bold 28px Segoe UI';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', boardCanvas.width / 2, boardCanvas.height / 2);
  }

  updateUI();
}

function drawMiniPiece(context, key, canvasW, canvasH, yOffset) {
  if (!key) return;
  const def   = PIECES[key];
  const m     = def.shapes[0];
  const size  = m.length;
  const mini  = 20;
  const offX  = Math.floor((canvasW / mini - size) / 2);
  const offY  = yOffset ?? Math.floor((canvasH / mini - size) / 2);

  context.clearRect(0, yOffset !== undefined ? yOffset * mini : 0, canvasW, size * mini + mini);

  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      context.fillStyle = def.color;
      context.fillRect((offX + x) * mini + 1, (offY + y) * mini + 1, mini - 2, mini - 2);
      context.fillStyle = 'rgba(255,255,255,0.18)';
      context.fillRect((offX + x) * mini + 1, (offY + y) * mini + 1, mini - 2, 4);
    }
  }
}

function drawHold() {
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (holdPiece) drawMiniPiece(holdCtx, holdPiece, holdCanvas.width, holdCanvas.height);
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const show = nextQueue.slice(0, 5);
  show.forEach((key, i) => drawMiniPiece(nextCtx, key, nextCanvas.width, nextCanvas.height, i * 4.5));
}

// ── KEYBOARD ───────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (gameScreen.style.display === 'none') return;
  switch (e.code) {
    case 'ArrowLeft':  e.preventDefault(); move(-1);        break;
    case 'ArrowRight': e.preventDefault(); move(1);         break;
    case 'ArrowUp':    e.preventDefault(); rotate(1);       break;  // CW
    case 'KeyZ':       e.preventDefault(); rotate(-1);      break;  // CCW
    case 'ArrowDown':  e.preventDefault(); softDrop();      break;
    case 'Space':      e.preventDefault(); hardDrop();      break;
    case 'KeyC':       e.preventDefault(); holdAction();    break;
    case 'KeyP':
      e.preventDefault();
      isPaused = !isPaused;
      if (!isPaused) { lastTime = null; requestAnimationFrame(gameLoop); }
      break;
  }
});
