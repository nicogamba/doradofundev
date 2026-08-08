(function () {
  'use strict';

  // ---- Config (constantes ajustables, ver docs/games/cuatrolocks.md §10) ----
  var COLS = 10;
  var ROWS = 20;
  var W = 480;
  var H = 800;
  var STORAGE_KEY = 'doradofundev.cuatrolocks';
  var CELL = 30;
  var BX = 90;
  var BY = 60;
  var LOCK_DELAY = 500; // ms
  var KEY_POINTS = 500;
  var DAS_DELAY = 180;
  var DAS_REPEAT = 45;
  var CLEAR_FLASH = 0.32;
  var PIECE_SMOOTH = 22;
  var CONSTRUCTION_COLOR = '#39404f';
  var KEY_COLOR = '#ffd166';
  var GOLD = '#ffd166';
  var BG_COLOR = '#10131a';

  var POINTS = [0, 100, 300, 500, 800];
  var LINE_MSG = { 2: 'doubleLine', 3: 'tripleLine', 4: 'tetris' };

  var LEVELS = [
    { diff: 'easy', speed: 900, heights: [0, 1, 2, 2, 2, 2, 2, 2, 1, 0], keys: [[2, 2], [7, 2]] },
    { diff: 'easy', speed: 850, heights: [0, 0, 3, 3, 0, 0, 3, 3, 0, 0], keys: [[2, 3], [6, 3]] },
    { diff: 'medium', speed: 800, heights: [1, 2, 3, 4, 1, 2, 3, 4, 0, 0], keys: [[1, 2], [5, 2], [6, 3]] },
    { diff: 'medium', speed: 750, heights: [4, 4, 1, 4, 4, 1, 4, 4, 1, 0], keys: [[2, 2], [5, 2], [8, 2]] },
    { diff: 'medium', speed: 700, heights: [5, 5, 5, 4, 5, 5, 5, 4, 5, 0], keys: [[1, 5], [4, 5], [8, 5]] },
    { diff: 'hard', speed: 600, heights: [0, 6, 6, 6, 0, 0, 6, 6, 6, 0], keys: [[1, 6], [2, 6], [6, 6], [7, 6]] },
    { diff: 'hard', speed: 500, heights: [2, 3, 4, 5, 1, 2, 3, 4, 0, 0], keys: [[2, 3], [4, 2], [6, 3], [7, 4]] },
    { diff: 'hard', speed: 420, heights: [3, 4, 5, 6, 6, 6, 5, 4, 3, 0], keys: [[1, 4], [4, 6], [6, 5], [8, 3]] },
    { diff: 'expert', speed: 360, heights: [5, 6, 7, 8, 8, 8, 7, 6, 5, 0], keys: [[1, 6], [3, 7], [4, 8], [6, 7], [8, 5]] },
    { diff: 'boss', speed: 300, hidden: true, heights: [6, 7, 8, 9, 9, 9, 8, 7, 6, 0], keys: [[1, 6], [2, 8], [4, 9], [7, 7], [8, 6]] },
  ];

  var SHAPES = {
    I: { c: '#3cc5ff', m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
    O: { c: '#ffd166', m: [[1, 1], [1, 1]] },
    T: { c: '#b388ff', m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
    S: { c: '#5cb85c', m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
    Z: { c: '#e0503f', m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
    J: { c: '#4a8fe0', m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
    L: { c: '#f0ad4e', m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] },
  };
  var BAG = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  var BOOM_COLORS = { v: '#b388ff', '3': '#ffb74d', '5': '#ff5252' };

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var hud = document.getElementById('hud');
  var hudLevel = document.getElementById('hud-level');
  var hudScore = document.getElementById('hud-score');
  var hudLines = document.getElementById('hud-lines');
  var hudKeys = document.getElementById('hud-keys');
  var hudPause = document.getElementById('hud-pause');
  var touchEl = document.getElementById('touch');
  var overlay = document.getElementById('overlay');
  var ovTitle = document.getElementById('ov-title');
  var ovText = document.getElementById('ov-text');
  var ovLegend = document.getElementById('ov-legend');
  var ovBtn = document.getElementById('ov-btn');
  var ovBtn2 = document.getElementById('ov-btn2');

  var lang = window.CLK.currentLang();
  var dpr = 1;
  var scale = 1;
  var offsetX = 0;
  var offsetY = 0;
  var currentOverlayKind = null;
  var lastTime = 0;
  var heldDir = 0;
  var heldDown = false;
  var repeatAccum = 0;

  var board = [];

  var state = {
    mode: 'map',
    levelIndex: 0,
    unlocked: 1,
    stars: [],
    best: [],
    level: null,
    keysTotal: 0,
    keysFound: 0,
    lines: 0,
    score: 0,
    ended: false,
    didTetris: false,
    stackTop: 19,
    current: null,
    next: null,
    hold: null,
    holdUsed: false,
    queue: [],
    dropTimer: 0,
    grounded: false,
    lockTimer: 0,
    msgs: [],
    fx: [],
    particles: [],
    pendingClear: null,
    shake: 0,
    lastPointer: null,
    lastOverlayData: null,
  };

  function t(key) {
    return window.CLK.t(lang, key);
  }

  function emptyRow() {
    var r = [];
    for (var x = 0; x < COLS; x++) r.push(null);
    return r;
  }

  // ---------- Persistence ----------

  function loadSave() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      state.unlocked = Math.min(LEVELS.length, Math.max(1, data.unlocked || 1));
      if (Array.isArray(data.stars)) state.stars = data.stars.slice(0, LEVELS.length);
      if (Array.isArray(data.best)) state.best = data.best.slice(0, LEVELS.length);
    } catch (e) {
      // corrupción: empezar de cero
    }
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level: state.levelIndex + 1,
          unlocked: state.unlocked,
          stars: state.stars,
          best: state.best,
        }),
      );
    } catch (e) {
      // almacenamiento no disponible
    }
  }

  function totalStars() {
    return state.stars.reduce(function (a, b) { return a + (b || 0); }, 0);
  }

  // ---------- Board / nivel ----------

  function setupLevel(levelIndex) {
    var cfg = LEVELS[levelIndex];
    state.levelIndex = levelIndex;
    state.level = cfg;
    board = buildBoard(cfg);
    state.keysTotal = cfg.keys.length;
    state.keysFound = 0;
    state.lines = 0;
    state.score = 0;
    state.ended = false;
    state.didTetris = false;
    state.hold = null;
    state.holdUsed = false;
    state.msgs = [];
    state.fx = [];
    state.queue = shuffle(BAG.slice());
    state.stackTop = currentStackTop();
    spawnCurrent();
    updateHUD();
  }

  function buildBoard(cfg) {
    var b = [];
    for (var y = 0; y < ROWS; y++) b.push(emptyRow());
    for (var c = 0; c < COLS; c++) {
      var h = cfg.heights[c] || 0;
      for (var r = 0; r < h && r < ROWS; r++) {
        b[ROWS - 1 - r][c] = { t: 'b', c: CONSTRUCTION_COLOR };
      }
    }
    for (var k = 0; k < cfg.keys.length; k++) {
      var col = cfg.keys[k][0];
      var hk = cfg.keys[k][1];
      var row = ROWS - hk;
      if (row >= 0 && row < ROWS) b[row][col] = { t: 'key' };
    }
    return b;
  }

  function currentStackTop() {
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        if (board[y][x]) return y;
      }
    }
    return 19;
  }

  function updateStackTop() {
    var top = currentStackTop();
    if (top < state.stackTop) state.stackTop = top;
  }

  // ---------- Piezas ----------

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function refillQueue() {
    while (state.queue.length < 2) {
      state.queue = state.queue.concat(shuffle(BAG.slice()));
    }
  }

  function spawnCurrent() {
    refillQueue();
    var type = state.queue.shift();
    spawnType(type);
    state.dropTimer = 0;
    state.grounded = false;
    state.lockTimer = 0;
  }

  function spawnType(type) {
    var def = SHAPES[type];
    var m = def.m.map(function (row) { return row.slice(); });
    var x = Math.floor((COLS - m[0].length) / 2);
    state.current = { type: type, m: m, x: x, y: 0, color: def.c, rx: BX + x * CELL, ry: BY };
    refillQueue();
    state.next = state.queue[0];
  }

  function cellsOf(m, x, y) {
    var out = [];
    for (var r = 0; r < m.length; r++) {
      for (var c = 0; c < m[r].length; c++) {
        if (m[r][c]) out.push({ x: x + c, y: y + r });
      }
    }
    return out;
  }

  function collides(m, x, y) {
    var cs = cellsOf(m, x, y);
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (c.x < 0 || c.x >= COLS || c.y >= ROWS) return true;
      if (c.y >= 0 && board[c.y][c.x]) return true;
    }
    return false;
  }

  function tryMove(dir) {
    var p = state.current;
    if (!p) return;
    if (!collides(p.m, p.x + dir, p.y)) {
      p.x += dir;
      onPieceMoved();
    }
  }

  function rotateCW(m) {
    var rows = m.length;
    var cols = m[0].length;
    var out = [];
    for (var c = 0; c < cols; c++) {
      var row = [];
      for (var r = rows - 1; r >= 0; r--) row.push(m[r][c]);
      out.push(row);
    }
    return out;
  }

  function tryRotate(dir) {
    var p = state.current;
    if (!p) return;
    var m = p.m;
    for (var k = 0; k < (dir > 0 ? 1 : 3); k++) m = rotateCW(m);
    var kicks = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [0, -2], [0, 2], [-1, 1], [1, 1], [-1, -1], [1, -1]];
    for (var i = 0; i < kicks.length; i++) {
      var nx = p.x + kicks[i][0];
      var ny = p.y + kicks[i][1];
      if (!collides(m, nx, ny)) {
        p.m = m;
        p.x = nx;
        p.y = ny;
        onPieceMoved();
        return;
      }
    }
  }

  function onPieceMoved() {
    var p = state.current;
    if (!p) return;
    state.grounded = collides(p.m, p.x, p.y + 1);
    if (!state.grounded) state.lockTimer = 0;
  }

  function holdPiece() {
    if (state.holdUsed || !state.current) return;
    var prev = state.hold;
    state.hold = state.current.type;
    state.holdUsed = true;
    if (prev) spawnType(prev);
    else spawnCurrent();
    if (collides(state.current.m, state.current.x, state.current.y)) lose();
  }

  function softDrop() {
    var p = state.current;
    if (!p) return;
    if (!collides(p.m, p.x, p.y + 1)) {
      p.y++;
      state.dropTimer = 0;
      onPieceMoved();
    }
  }

  function hardDrop() {
    var p = state.current;
    if (!p) return;
    while (!collides(p.m, p.x, p.y + 1)) p.y++;
    p.rx = BX + p.x * CELL;
    p.ry = BY + p.y * CELL;
    lockPiece();
  }

  // ---------- Líneas, llaves y explosiones ----------

  function lockPiece() {
    var p = state.current;
    if (!p) return;
    var cs = cellsOf(p.m, p.x, p.y);
    var pieceCol = p.x + Math.floor(p.m[0].length / 2);
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (c.y >= 0 && c.y < ROWS) board[c.y][c.x] = { t: 'b', c: p.color };
    }
    state.current = null;
    updateStackTop();
    lockDust(p, cs);
    var full = findFullRows();
    if (full.length) {
      state.pendingClear = { full: full, pieceCol: pieceCol, timer: CLEAR_FLASH };
      addShake(full.length >= 4 ? 0.55 : 0.28);
    } else {
      afterClear();
    }
  }

  function findFullRows() {
    var full = [];
    for (var y = 0; y < ROWS; y++) {
      var ok = true;
      for (var x = 0; x < COLS; x++) {
        if (!board[y][x]) { ok = false; break; }
      }
      if (ok) full.push(y);
    }
    return full;
  }

  function afterClear() {
    if (state.ended) return;
    spawnCurrent();
    if (collides(state.current.m, state.current.x, state.current.y)) {
      lose();
      return;
    }
    state.holdUsed = false;
    updateHUD();
  }

  function doClear(pieceCol, full) {
    var n = full.length;
    if (!n) return n;
    var freeKeys = [];
    var boomQ = [];
    for (var i = 0; i < full.length; i++) {
      var yy = full[i];
      for (var xx = 0; xx < COLS; xx++) {
        var c = board[yy][xx];
        if (c.t === 'boom') {
          boomQ.push({ x: xx, y: yy, s: c.s });
          board[yy][xx] = null;
        } else if (c.t === 'key') {
          freeKeys.push({ x: xx, y: yy });
          board[yy][xx] = null;
        } else {
          board[yy][xx] = null;
        }
      }
    }
    for (var fi = 0; fi < full.length; fi++) clearFlash(full[fi]);

    var newRows = [];
    for (var r = 0; r < ROWS; r++) {
      if (full.indexOf(r) >= 0) continue;
      newRows.push(board[r].slice());
    }
    while (newRows.length < ROWS) newRows.unshift(emptyRow());
    board = newRows;

    freeKeys.sort(function (a, b) { return b.y - a.y; });
    for (var k = 0; k < freeKeys.length; k++) dropKey(freeKeys[k].x);

    state.lines += n;
    state.score += POINTS[n];
    if (n === 4) state.didTetris = true;
    if (LINE_MSG[n]) state.msgs.push({ text: t(LINE_MSG[n]), life: 1.1 });

    while (boomQ.length) {
      var b = boomQ.shift();
      explode(b.x, b.y, b.s, boomQ);
    }
    applyExplosionGravity();
    releaseFloorKeys();

    var size = n === 4 ? '5' : n === 3 ? '3' : n === 2 ? 'v' : null;
    if (size) spawnBoom(pieceCol, size);
    releaseFloorKeys();
    updateStackTop();
    checkWin();
    return n;
  }

  function clearLines(pieceCol) {
    var full = findFullRows();
    var n = doClear(pieceCol, full);
    afterClear();
    updateHUD();
    return n;
  }

  function dropKey(x) {
    for (var y = ROWS - 1; y >= 0; y--) {
      if (!board[y][x]) {
        board[y][x] = { t: 'key' };
        return;
      }
    }
  }

  function spawnBoom(col, size) {
    for (var y = ROWS - 1; y >= 0; y--) {
      if (!board[y][col]) {
        board[y][col] = { t: 'boom', s: size };
        return;
      }
    }
  }

  function explode(cx, cy, s, queue) {
    var cells = [];
    if (s === 'v') {
      for (var r = 0; r < ROWS; r++) cells.push({ x: cx, y: r });
    } else {
      var rad = s === '3' ? 1 : 2;
      for (var dy = -rad; dy <= rad; dy++) {
        for (var dx = -rad; dx <= rad; dx++) {
          var xx = cx + dx;
          var yy = cy + dy;
          if (xx >= 0 && xx < COLS && yy >= 0 && yy < ROWS) cells.push({ x: xx, y: yy });
        }
      }
    }
    for (var i = 0; i < cells.length; i++) {
      var cell = board[cells[i].y][cells[i].x];
      if (!cell) continue;
      if (cell.t === 'boom') {
        board[cells[i].y][cells[i].x] = null;
        queue.push({ x: cells[i].x, y: cells[i].y, s: cell.s });
      } else if (cell.t === 'key') {
        board[cells[i].y][cells[i].x] = null;
        state.keysFound++;
        state.score += KEY_POINTS;
        state.msgs.push({ text: '+1 ' + t('keyFound'), life: 1.1 });
      } else {
        board[cells[i].y][cells[i].x] = null;
      }
    }
    var fxR = s === 'v' ? COLS * CELL * 0.7 : (s === '3' ? 1.6 : 2.6) * CELL;
    state.fx.push({ x: BX + cx * CELL + CELL / 2, y: BY + cy * CELL + CELL / 2, r0: CELL, r1: fxR, life: 0.4, t: 0 });
    addShake(s === '5' ? 0.5 : 0.3);
    for (var pz = 0; pz < 16; pz++) {
      var pa = Math.random() * Math.PI * 2;
      var psp = 120 + Math.random() * 260;
      state.particles.push({ x: BX + cx * CELL + CELL / 2, y: BY + cy * CELL + CELL / 2, vx: Math.cos(pa) * psp, vy: Math.sin(pa) * psp, life: 0.5, r: 2 + Math.random() * 2, color: Math.random() < 0.5 ? '#ffb74d' : '#e8eaf0', grav: 500 });
    }
    checkWin();
  }

  function applyExplosionGravity() {
    for (var x = 0; x < COLS; x++) {
      var write = ROWS - 1;
      for (var y = ROWS - 1; y >= 0; y--) {
        if (board[y][x]) {
          board[write][x] = board[y][x];
          if (write !== y) board[y][x] = null;
          write--;
        }
      }
      for (; write >= 0; write--) board[write][x] = null;
    }
    updateStackTop();
  }

  function releaseFloorKeys() {
    var released = 0;
    var releasedAt = [];
    for (var x = 0; x < COLS; x++) {
      if (board[ROWS - 1][x] && board[ROWS - 1][x].t === 'key') {
        board[ROWS - 1][x] = null;
        releasedAt.push(x);
        released++;
      }
    }
    if (released) {
      state.keysFound += released;
      state.score += released * KEY_POINTS;
      state.msgs.push({ text: '+' + released + ' ' + t('keyFound'), life: 1.1 });
      for (var i = 0; i < releasedAt.length; i++) {
        var gx = BX + releasedAt[i] * CELL + CELL / 2;
        var gy = BY + (ROWS - 1) * CELL + CELL / 2;
        for (var j = 0; j < 10; j++) {
          var ga = Math.random() * Math.PI * 2;
          var gsp = 90 + Math.random() * 200;
          state.particles.push({ x: gx, y: gy, vx: Math.cos(ga) * gsp, vy: Math.sin(ga) * gsp - 80, life: 0.65, r: 2 + Math.random() * 2.5, color: '#ffd166', grav: 350 });
        }
      }
      updateHUD();
      checkWin();
    }
  }

  function checkWin() {
    if (!state.ended && state.keysFound >= state.keysTotal) win();
  }

  // ---------- Fin de nivel ----------

  function win() {
    state.ended = true;
    state.score += 1000;
    var stars = 1 + (state.stackTop >= 5 ? 1 : 0) + (state.didTetris ? 1 : 0);
    var prev = state.stars[state.levelIndex] || 0;
    if (stars > prev) state.stars[state.levelIndex] = stars;
    var best = state.best[state.levelIndex] || 0;
    if (state.score > best) state.best[state.levelIndex] = state.score;
    if (state.levelIndex + 1 >= state.unlocked) {
      state.unlocked = Math.min(LEVELS.length, state.levelIndex + 2);
    }
    save();
    var last = state.levelIndex === LEVELS.length - 1;
    showOverlay(last ? 'winAll' : 'won', { stars: stars });
  }

  function lose() {
    if (state.ended) return;
    state.ended = true;
    save();
    showOverlay('lost');
  }

  // ---------- HUD ----------

  function updateHUD() {
    hudLevel.textContent = t('level') + ' ' + (state.levelIndex + 1);
    hudScore.textContent = t('score') + ' ' + state.score;
    hudLines.textContent = t('lines') + ' ' + state.lines;
    if (state.level && state.level.hidden) {
      hudKeys.textContent = t('keys') + ' ?';
    } else {
      hudKeys.textContent = t('keys') + ' ' + state.keysFound + '/' + state.keysTotal;
    }
  }

  // ---------- Overlay ----------

  function starsString(n) {
    return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function showOverlay(kind, data) {
    currentOverlayKind = kind;
    state.lastOverlayData = data || null;
    ovLegend.classList.add('hidden');
    ovBtn2.classList.add('hidden');
    if (kind === 'intro') {
      ovTitle.textContent = t('level') + ' ' + (state.levelIndex + 1);
      var cfg = LEVELS[state.levelIndex];
      var info = t('difficulty') + ': ' + t('diff' + cap(cfg.diff)) + ' · ' + t('keys') + ': ' + (cfg.hidden ? '?' : cfg.keys.length);
      ovText.textContent = cfg.hidden ? info + ' · ' + t('bossHint') : info;
      ovLegend.textContent = t('legend');
      ovLegend.classList.remove('hidden');
      ovBtn.textContent = t('start');
      ovBtn.onclick = function () {
        state.mode = 'playing';
        hideOverlay();
      };
    } else if (kind === 'won' || kind === 'winAll') {
      ovTitle.textContent = kind === 'winAll' ? t('winAll') : t('win');
      ovText.textContent =
        t('starsEarned') + ' ' + starsString(data.stars) + ' · ' +
        t('score') + ' ' + state.score + ' · ' +
        t('best') + ' ' + (state.best[state.levelIndex] || 0);
      if (kind === 'winAll') {
        ovBtn.textContent = t('backMap');
        ovBtn.onclick = showMap;
      } else {
        ovBtn.textContent = t('next');
        ovBtn.onclick = function () {
          state.levelIndex = Math.min(LEVELS.length - 1, state.levelIndex + 1);
          setupLevel(state.levelIndex);
          state.mode = 'intro';
          showOverlay('intro');
        };
        ovBtn2.classList.remove('hidden');
        ovBtn2.textContent = t('backMap');
        ovBtn2.onclick = showMap;
      }
    } else if (kind === 'lost') {
      ovTitle.textContent = t('lose');
      ovText.textContent = t('score') + ' ' + state.score + ' · ' + t('lines') + ' ' + state.lines + ' · ' + t('keys') + ' ' + state.keysFound + '/' + state.keysTotal;
      ovBtn.textContent = t('retry');
      ovBtn.onclick = function () {
        setupLevel(state.levelIndex);
        state.mode = 'intro';
        showOverlay('intro');
      };
      ovBtn2.classList.remove('hidden');
      ovBtn2.textContent = t('backMap');
      ovBtn2.onclick = showMap;
    } else if (kind === 'paused') {
      ovTitle.textContent = t('pause');
      ovText.textContent = t('score') + ' ' + state.score + ' · ' + t('keys') + ' ' + state.keysFound + '/' + state.keysTotal;
      ovBtn.textContent = t('resume');
      ovBtn.onclick = function () {
        state.mode = 'playing';
        hideOverlay();
      };
      ovBtn2.classList.remove('hidden');
      ovBtn2.textContent = t('backMap');
      ovBtn2.onclick = showMap;
    }
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    currentOverlayKind = null;
  }

  function applyLang() {
    lang = window.CLK.currentLang();
    if (state.mode === 'map') return;
    if (!overlay.classList.contains('hidden') && currentOverlayKind) {
      var d = state.lastOverlayData || {};
      if (currentOverlayKind === 'intro') showOverlay('intro');
      else if (currentOverlayKind === 'won' || currentOverlayKind === 'winAll') showOverlay(currentOverlayKind, { stars: d.stars || 1 });
      else if (currentOverlayKind === 'lost') showOverlay('lost');
      else if (currentOverlayKind === 'paused') showOverlay('paused');
      return;
    }
    updateHUD();
  }

  // ---------- Mapa ----------

  function showMap() {
    state.mode = 'map';
    state.current = null;
    hud.classList.add('hidden');
    touchEl.classList.add('hidden');
    hideOverlay();
  }

  function mapPath() {
    var n = LEVELS.length;
    var pts = [];
    for (var i = 0; i < n; i++) {
      var tt = i / (n - 1);
      pts.push({
        x: W / 2 + Math.sin(tt * Math.PI * 2.6) * (W * 0.27),
        y: 168 + tt * (H - 300),
      });
    }
    return pts;
  }

  function selectMapNode(x, y) {
    var pts = mapPath();
    var best = -1;
    var bestD = 46;
    for (var i = 0; i < pts.length; i++) {
      var d = Math.hypot(pts[i].x - x, pts[i].y - y);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) return;
    if (best >= state.unlocked) {
      addMsg(t('locked'));
      return;
    }
    setupLevel(best);
    state.mode = 'intro';
    hud.classList.remove('hidden');
    touchEl.classList.remove('hidden');
    showOverlay('intro');
  }

  function addMsg(text) {
    state.msgs.push({ text: text, life: 1.1 });
  }

  // ---------- Bucle ----------

  function step(dt) {
    if (state.pendingClear) {
      state.pendingClear.timer -= dt / 1000;
      if (state.pendingClear.timer <= 0) {
        var pc = state.pendingClear;
        state.pendingClear = null;
        doClear(pc.pieceCol, pc.full);
        afterClear();
      }
      return;
    }
    if (heldDir && state.current) {
      repeatAccum += dt;
      if (repeatAccum >= DAS_DELAY) {
        tryMove(heldDir);
        repeatAccum = DAS_DELAY - DAS_REPEAT;
      }
    }
    var p = state.current;
    if (p) {
      var k = Math.min(1, (dt / 1000) * PIECE_SMOOTH);
      p.rx += (BX + p.x * CELL - p.rx) * k;
      p.ry += (BY + p.y * CELL - p.ry) * k;
    }
    if (!p) return;
    var interval = state.level.speed;
    if (state.heldDown) interval = Math.max(30, interval / 18);
    state.dropTimer += dt;
    while (state.dropTimer >= interval) {
      state.dropTimer -= interval;
      if (!collides(p.m, p.x, p.y + 1)) {
        p.y++;
        state.grounded = false;
        state.lockTimer = 0;
      } else {
        state.grounded = true;
        break;
      }
    }
    if (state.grounded) {
      state.lockTimer += dt;
      if (state.lockTimer >= LOCK_DELAY) lockPiece();
    }
  }

  function stepFx(dt) {
    for (var i = state.msgs.length - 1; i >= 0; i--) {
      state.msgs[i].life -= dt;
      if (state.msgs[i].life <= 0) state.msgs.splice(i, 1);
    }
    for (var j = state.fx.length - 1; j >= 0; j--) {
      var f = state.fx[j];
      f.t += dt;
      if (f.t >= f.life) state.fx.splice(j, 1);
    }
  }

  function stepParticles(dt) {
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }

  function addShake(v) {
    state.shake = Math.max(state.shake, v);
  }

  function lockDust(p, cs) {
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (c.y < 0 || c.y >= ROWS) continue;
      for (var j = 0; j < 4; j++) {
        var a = Math.random() * Math.PI * 2;
        state.particles.push({ x: BX + c.x * CELL + CELL / 2, y: BY + c.y * CELL + CELL / 2, vx: Math.cos(a) * 50, vy: Math.sin(a) * 40 - 30, life: 0.4, r: 1.5 + Math.random() * 1.5, color: 'rgba(255,255,255,0.6)', grav: 300 });
      }
    }
  }

  function clearFlash(row) {
    for (var x = 0; x < COLS; x++) {
      state.particles.push({ x: BX + x * CELL + CELL / 2, y: BY + row * CELL + CELL / 2, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, life: 0.5, r: 2 + Math.random() * 2, color: '#ffffff', grav: 200 });
    }
  }

  function loop(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (state.mode === 'playing' && !state.ended) {
      step(dt * 1000);
    }
    stepFx(dt);
    stepParticles(dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2);
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- Render ----------

  function resize() {
    dpr = window.devicePixelRatio || 1;
    var cw = canvas.clientWidth;
    var ch = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
    scale = Math.min(cw / W, ch / H);
    offsetX = (cw - W * scale) / 2;
    offsetY = (ch - H * scale) / 2;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    var sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 9 : 0;
    var sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 9 : 0;
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, (offsetX + sx) * dpr, (offsetY + sy) * dpr);

    if (state.mode === 'map') {
      drawStarsBg();
      drawMap();
      return;
    }

    drawBoard();
    if (state.current) drawPiece(state.current, 0.85);
    drawPendingClear();
    drawPreview(t('nextLabel'), state.next, 402, 60);
    drawPreview(t('hold'), state.hold, 26, 60);
    drawFx();
    drawParticles();
    drawMsgs();
  }

  function drawStarsBg() {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (var i = 0; i < 40; i++) {
      var sx2 = (i * 97) % W;
      var sy2 = (i * 53) % (H - 120);
      ctx.fillRect(sx2, sy2, 1.5, 1.5);
    }
  }

  function drawPendingClear() {
    var pc = state.pendingClear;
    if (!pc) return;
    var flash = 0.55 + 0.45 * Math.sin(pc.timer * 26);
    ctx.globalAlpha = Math.max(0.15, Math.min(0.85, flash));
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < pc.full.length; i++) {
      ctx.fillRect(BX, BY + pc.full[i] * CELL, COLS * CELL, CELL);
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      ctx.globalAlpha = Math.min(1, p.life * 2.2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function cellRect(cx, cy) {
    return { x: BX + cx * CELL, y: BY + cy * CELL };
  }

  function drawBlock(x, y, color, alpha) {
    var s = 2;
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x + s, y + s, CELL - 2 * s, CELL - 2 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + s, y + s, CELL - 2 * s, CELL * 0.18);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x + s, y + CELL - s - CELL * 0.12, CELL - 2 * s, CELL * 0.12);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + s + 0.5, y + s + 0.5, CELL - 2 * s - 1, CELL - 2 * s - 1);
    ctx.globalAlpha = 1;
  }

  function drawLock(x, y, size) {
    var cx = x + CELL / 2;
    var cy = y + CELL / 2;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.35, size * 0.3, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - size * 0.28, cy - size * 0.28, size * 0.56, size * 0.5);
    ctx.fillStyle = KEY_COLOR;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBoard() {
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(BX, BY, COLS * CELL, ROWS * CELL);
    ctx.strokeStyle = '#1c1f28';
    ctx.lineWidth = 2;
    ctx.strokeRect(BX, BY, COLS * CELL, ROWS * CELL);

    var hidden = state.level && state.level.hidden;
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var c = board[y][x];
        if (!c) continue;
        var pos = cellRect(x, y);
        if (c.t === 'b') {
          drawBlock(pos.x, pos.y, c.c);
        } else if (c.t === 'key') {
          if (hidden) {
            drawBlock(pos.x, pos.y, CONSTRUCTION_COLOR);
          } else {
            drawBlock(pos.x, pos.y, KEY_COLOR);
            drawLock(pos.x, pos.y, 11);
          }
        } else if (c.t === 'boom') {
          drawBlock(pos.x, pos.y, BOOM_COLORS[c.s] || '#ff5252');
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = '700 ' + (CELL * 0.5) + 'px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✸', pos.x + CELL / 2, pos.y + CELL / 2 + 1);
          ctx.textBaseline = 'alphabetic';
        }
      }
    }
  }

  function drawPiece(p, alpha) {
    var cs = cellsOf(p.m, p.x, p.y);
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (c.y < 0 || c.y >= ROWS) continue;
      var px = p.rx + (c.x - p.x) * CELL;
      var py = p.ry + (c.y - p.y) * CELL;
      drawBlock(px, py, p.color, alpha);
    }
  }

  function drawPreview(label, type, px, py) {
    ctx.strokeStyle = '#2a303d';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, 52, 56);
    ctx.fillStyle = '#1c1f28';
    ctx.fillRect(px + 1, py + 1, 50, 54);
    ctx.fillStyle = '#9aa2b1';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t(label), px + 26, py + 12);
    if (!type) return;
    var def = SHAPES[type];
    var m = def.m;
    var cells = cellsOf(m, 0, 0);
    var minC = 9, maxC = 0, minR = 9, maxR = 0;
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].x < minC) minC = cells[i].x;
      if (cells[i].x > maxC) maxC = cells[i].x;
      if (cells[i].y < minR) minR = cells[i].y;
      if (cells[i].y > maxR) maxR = cells[i].y;
    }
    var w = maxC - minC + 1;
    var h = maxR - minR + 1;
    var cs = 13;
    var ox = px + 26 - (w * cs) / 2;
    var oy = py + 34 - (h * cs) / 2;
    for (var j = 0; j < cells.length; j++) {
      ctx.fillStyle = def.c;
      ctx.fillRect(ox + (cells[j].x - minC) * cs + 1, oy + (cells[j].y - minR) * cs + 1, cs - 2, cs - 2);
    }
  }

  function drawFx() {
    for (var i = 0; i < state.fx.length; i++) {
      var f = state.fx[i];
      var p = f.t / f.life;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#ffb74d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r0 + (f.r1 - f.r0) * p, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawMsgs() {
    var y = BY + 40;
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (var i = 0; i < state.msgs.length; i++) {
      var m = state.msgs[i];
      ctx.globalAlpha = Math.min(1, m.life * 2);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(m.text, W / 2, y);
      y += 28;
    }
    ctx.globalAlpha = 1;
  }

  function drawMap() {
    var pts = mapPath();
    var now = performance.now() / 1000;

    ctx.strokeStyle = 'rgba(255,209,102,0.18)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    ctx.font = '700 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eaf0';
    ctx.fillText('cuatrolocks', W / 2, 84);

    ctx.textAlign = 'left';
    ctx.fillStyle = GOLD;
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText('★ ' + totalStars() + '/' + (LEVELS.length * 3), 20, 55);

    for (var j = 0; j < pts.length; j++) {
      var p = pts[j];
      var locked = j >= state.unlocked;
      var done = (state.stars[j] || 0) > 0;
      var isNext = j === state.unlocked - 1;

      if (isNext && !locked) {
        ctx.strokeStyle = 'rgba(255,209,102,' + (0.5 + 0.4 * Math.sin(now * 4)) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = locked ? '#2a303d' : done ? '#3a4a5e' : '#39404f';
      ctx.strokeStyle = locked ? '#4a5363' : GOLD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = locked ? '#9aa2b1' : '#e8eaf0';
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(j + 1), p.x, p.y + 6);

      if (locked) {
        ctx.strokeStyle = '#9aa2b1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y + 6, 5, 0, Math.PI);
        ctx.stroke();
      } else if (done) {
        ctx.fillStyle = GOLD;
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('★'.repeat(state.stars[j]), p.x, p.y + 42);
      }
    }

    ctx.fillStyle = '#9aa2b1';
    ctx.font = '500 14px system-ui, sans-serif';
    ctx.fillText(t('tapNode'), W / 2, H - 26);
  }

  // ---------- Input ----------

  function toLogical(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetX) / scale,
      y: (e.clientY - rect.top - offsetY) / scale,
    };
  }

  function onPointerDown(e) {
    if (state.mode === 'map') {
      var mp = toLogical(e);
      selectMapNode(mp.x, mp.y);
      return;
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function keyRepeat(dir) {
    heldDir = dir;
    repeatAccum = 0;
    if (state.mode === 'playing' && !state.ended) tryMove(dir);
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); keyRepeat(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); keyRepeat(1); }
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); heldDown = true; if (state.mode === 'playing' && !state.ended) softDrop(); }
    else if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') { e.preventDefault(); if (state.mode === 'playing' && !state.ended) tryRotate(1); }
    else if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); if (state.mode === 'playing' && !state.ended) tryRotate(-1); }
    else if (e.key === ' ') { e.preventDefault(); if (state.mode === 'playing' && !state.ended) hardDrop(); }
    else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') { if (state.mode === 'playing' && !state.ended) holdPiece(); }
    else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { togglePause(); }
  });

  window.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
        e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (heldDir === (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? -1 : 1)) heldDir = 0;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      heldDown = false;
    }
  });

  function togglePause() {
    if (state.mode === 'playing') {
      state.mode = 'paused';
      showOverlay('paused');
    } else if (state.mode === 'paused') {
      state.mode = 'playing';
      hideOverlay();
    }
  }

  function bindBtn(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', function (e) { e.preventDefault(); fn(); });
  }

  bindBtn('tb-left', function () { if (state.mode === 'playing' && !state.ended) tryMove(-1); });
  bindBtn('tb-right', function () { if (state.mode === 'playing' && !state.ended) tryMove(1); });
  bindBtn('tb-rot', function () { if (state.mode === 'playing' && !state.ended) tryRotate(1); });
  bindBtn('tb-down', function () { if (state.mode === 'playing' && !state.ended) softDrop(); });
  bindBtn('tb-drop', function () { if (state.mode === 'playing' && !state.ended) hardDrop(); });
  bindBtn('tb-hold', function () { if (state.mode === 'playing' && !state.ended) holdPiece(); });
  bindBtn('hud-pause', togglePause);

  var tbHold = document.getElementById('tb-hold');
  if (tbHold) tbHold.textContent = t('hold');

  window.addEventListener('resize', resize);
  window.addEventListener('storage', function (e) {
    if (e.key === window.CLK.LANG_KEY) applyLang();
  });

  // ---------- Boot ----------

  loadSave();
  resize();
  lastTime = performance.now();
  hud.classList.add('hidden');
  touchEl.classList.add('hidden');
  requestAnimationFrame(loop);

  // ---------- Debug hook (solo para pruebas) ----------
  window.__CLK_T = {
    get state() { return state; },
    get board() { return board; },
    get LEVELS() { return LEVELS; },
    setupLevel: setupLevel,
    lockPiece: lockPiece,
    hardDrop: hardDrop,
    tryMove: tryMove,
    tryRotate: tryRotate,
    holdPiece: holdPiece,
    clearLines: clearLines,
    selectMapNode: selectMapNode,
    mapPath: mapPath,
    win: win,
    lose: lose,
    showOverlay: showOverlay,
    showMap: showMap,
  };
})();
