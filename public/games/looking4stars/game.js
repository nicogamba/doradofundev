(function () {
  'use strict';

  // ---- Config (constantes ajustables, ver docs/games/looking4stars.md §9) ----
  var W = 480;
  var H = 800;
  var BALL_R = 8;
  var LAUNCHER = { x: W / 2, y: 92 };
  var LAUNCH_SPEED = 560;
  var GRAVITY = 420;
  var REST_WALL = 0.8;
  var REST_OBSTACLE = 0.92;
  var POINTS_PER_DURABILITY = 10;
  var DOME_R = 24;
  var STORAGE_KEY = 'doradofundev.looking4stars';
  var MAX_BALL_TIME = 45;

  var HOLE_SPECS = [
    { mult: 1, refund: false },
    { mult: 2, refund: false },
    { mult: 1, refund: true },
    { mult: 2, refund: false },
    { mult: 1, refund: false },
  ];
  var HOLE_WIDTHS = [60, 45, 30, 45, 60];

  var LEVELS = [
    { id: 1, diff: 'easy', balls: 3, aliens: 3, count: 18, durabilities: [1, 1, 1], strategy: 'weakest' },
    { id: 2, diff: 'medium', balls: 3, aliens: 3, count: 22, durabilities: [1, 2, 2], strategy: 'random' },
    { id: 3, diff: 'hard', balls: 3, aliens: 3, count: 26, durabilities: [2, 3, 3], strategy: 'strongest' },
  ];

  var COLORS = { 1: '#5cb85c', 2: '#f0ad4e', 3: '#e0503f' };
  var ALIEN_COLOR = '#7ee787';
  var BALL_COLOR = '#f2f4f8';
  var FLOOR_COLOR = '#232836';
  var BG_COLOR = '#10131a';
  var WALL_COLOR = '#1c1f28';
  var KEY_GOLD = '#ffd166';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var hudLevel = document.getElementById('hud-level');
  var hudScore = document.getElementById('hud-score');
  var hudBalls = document.getElementById('hud-balls');
  var hudAliens = document.getElementById('hud-aliens');
  var overlay = document.getElementById('overlay');
  var ovTitle = document.getElementById('ov-title');
  var ovText = document.getElementById('ov-text');
  var ovLegend = document.getElementById('ov-legend');
  var ovBtn = document.getElementById('ov-btn');

  var lang = window.L4K.currentLang();
  var holes = buildHoles();
  var domes = buildDomes();
  var dpr = 1;
  var scale = 1;
  var offsetX = 0;
  var offsetY = 0;
  var currentOverlayKind = null;

  var state = {
    mode: 'intro',
    levelIndex: 0,
    score: 0,
    unlocked: 1,
    balls: 0,
    aliensFound: 0,
    aliensTotal: 0,
    ball: null,
    obstacles: [],
    floaters: [],
    aliensFx: [],
    flashes: [],
    lastPointer: null,
  };

  function buildHoles() {
    var totalGap = HOLE_WIDTHS.reduce(function (a, b) { return a + b; }, 0);
    var wallW = (W - totalGap) / (HOLE_SPECS.length + 1);
    var x = 0;
    var list = [];
    for (var i = 0; i < HOLE_SPECS.length; i++) {
      var start = x + wallW;
      var end = start + HOLE_WIDTHS[i];
      list.push({
        index: i,
        start: start,
        end: end,
        center: (start + end) / 2,
        mult: HOLE_SPECS[i].mult,
        refund: HOLE_SPECS[i].refund,
      });
      x = end;
    }
    return list;
  }

  function buildDomes() {
    var edges = [0];
    for (var i = 0; i < holes.length; i++) {
      edges.push(holes[i].start, holes[i].end);
    }
    edges.push(W);
    var list = [];
    for (var j = 0; j < edges.length - 1; j += 2) {
      var a = edges[j];
      var b = edges[j + 1];
      list.push({ x: (a + b) / 2, y: H - DOME_R, r: DOME_R });
    }
    return list;
  }

  // ---------- Persistence ----------

  function loadSave() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      state.score = typeof data.score === 'number' ? data.score : 0;
      state.unlocked = Math.min(LEVELS.length, Math.max(1, data.unlocked || 1));
    } catch (e) {
      // corrupción: empezar de cero
    }
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          score: state.score,
          level: state.levelIndex + 1,
          unlocked: state.unlocked,
        }),
      );
    } catch (e) {
      // almacenamiento no disponible
    }
  }

  // ---------- Level setup ----------

  function setupLevel(levelIndex) {
    var cfg = LEVELS[levelIndex];
    state.levelIndex = levelIndex;
    state.balls = cfg.balls;
    state.aliensFound = 0;
    state.aliensTotal = cfg.aliens;
    state.ball = null;
    state.flashes = [];
    spawnAsteroids(cfg);
    updateHUD();
  }

  function spawnAsteroids(cfg) {
    var list = [];
    var attempts = 0;
    while (list.length < cfg.count && attempts < 3000) {
      attempts++;
      var r = 12 + Math.random() * 7;
      var x = r + 10 + Math.random() * (W - 2 * (r + 10));
      var y = 170 + Math.random() * (H - 360);
      if (Math.abs(x - LAUNCHER.x) < 70 && y < LAUNCHER.y + 120) continue;
      var tooClose = list.some(function (o) {
        return Math.hypot(o.x - x, o.y - y) < o.r + r + 16;
      });
      if (tooClose) continue;
      var durability = cfg.durabilities[Math.floor(Math.random() * cfg.durabilities.length)];
      list.push({
        x: x,
        y: y,
        r: r,
        durability: durability,
        value: durability * POINTS_PER_DURABILITY,
        hasAlien: false,
        shape: makeShape(r),
        craters: makeCraters(r),
      });
    }

    var holders = pickHolders(list, cfg);
    for (var i = 0; i < holders.length; i++) holders[i].hasAlien = true;
    state.obstacles = list;
  }

  function makeShape(r) {
    var n = 9 + Math.floor(Math.random() * 4);
    var pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({ a: (i / n) * Math.PI * 2, r: r * (0.82 + Math.random() * 0.36) });
    }
    return pts;
  }

  function makeCraters(r) {
    var n = 1 + Math.floor(Math.random() * 3);
    var craters = [];
    for (var i = 0; i < n; i++) {
      craters.push({
        x: (Math.random() - 0.5) * r * 0.9,
        y: (Math.random() - 0.5) * r * 0.9,
        r: r * (0.12 + Math.random() * 0.14),
      });
    }
    return craters;
  }

  function pickHolders(list, cfg) {
    var n = Math.min(cfg.aliens, list.length);
    var pool = list.slice();
    if (cfg.strategy === 'weakest') {
      pool.sort(function (a, b) { return a.durability - b.durability; });
      var weakest = pool.filter(function (o) { return o.durability === pool[0].durability; });
      return pickN(weakest.length >= n ? weakest : pool, n);
    }
    if (cfg.strategy === 'strongest') {
      pool.sort(function (a, b) { return b.durability - a.durability; });
      var strongest = pool.filter(function (o) { return o.durability === pool[0].durability; });
      return pickN(strongest.length >= n ? strongest : pool, n);
    }
    return pickN(pool, n);
  }

  function pickN(arr, n) {
    var copy = arr.slice();
    var out = [];
    while (out.length < n && copy.length) {
      out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    }
    return out;
  }

  // ---------- Ball ----------

  function launch(px, py) {
    if (state.mode !== 'playing') return;
    if (state.ball) return;
    if (state.balls <= 0) return;

    var dx = px - LAUNCHER.x;
    var dy = py - LAUNCHER.y;
    var len = Math.hypot(dx, dy);
    if (len < 1) { dx = 0; dy = 1; len = 1; }

    state.balls--;
    state.ball = {
      x: LAUNCHER.x,
      y: LAUNCHER.y,
      vx: (dx / len) * LAUNCH_SPEED,
      vy: (dy / len) * LAUNCH_SPEED,
      r: BALL_R,
      flightPoints: 0,
      trail: [],
      slowTime: 0,
      time: 0,
    };
    updateHUD();
  }

  function stepBall(ball, dt) {
    ball.vy += GRAVITY * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.time += dt;

    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 18) ball.trail.shift();

    if (ball.x < ball.r && ball.vx < 0) { ball.x = ball.r; ball.vx = -ball.vx * REST_WALL; }
    if (ball.x > W - ball.r && ball.vx > 0) { ball.x = W - ball.r; ball.vx = -ball.vx * REST_WALL; }
    if (ball.y < ball.r && ball.vy < 0) { ball.y = ball.r; ball.vy = -ball.vy * REST_WALL; }

    if (ball.y + ball.r >= H) {
      var hole = holeAt(ball.x);
      if (hole) return capture(hole, ball);
      ball.y = H - ball.r;
      ball.vy = -ball.vy * REST_WALL;
      ball.vx *= 0.92;
    }

    // cúpulas (rebote sin daño, desvío impredecible)
    for (var d = 0; d < domes.length; d++) {
      var dome = domes[d];
      var ddx = ball.x - dome.x;
      var ddy = ball.y - dome.y;
      var ddist = Math.hypot(ddx, ddy);
      var dmin = ball.r + dome.r;
      if (ddist >= dmin) continue;
      var dnx = ddx / ddist;
      var dny = ddy / ddist;
      var dvn = ball.vx * dnx + ball.vy * dny;
      if (dvn < 0) {
        ball.vx -= (1 + REST_OBSTACLE) * dvn * dnx;
        ball.vy -= (1 + REST_OBSTACLE) * dvn * dny;
      }
      ball.x = dome.x + dnx * dmin;
      ball.y = dome.y + dny * dmin;
    }

    // asteroides
    for (var i = state.obstacles.length - 1; i >= 0; i--) {
      var o = state.obstacles[i];
      var dx = ball.x - o.x;
      var dy = ball.y - o.y;
      var dist = Math.hypot(dx, dy);
      var minDist = ball.r + o.r;
      if (dist >= minDist) continue;
      var nx = dx / dist;
      var ny = dy / dist;
      var vn = ball.vx * nx + ball.vy * ny;
      ball.x = o.x + nx * minDist;
      ball.y = o.y + ny * minDist;
      if (vn < 0) {
        ball.vx -= (1 + REST_OBSTACLE) * vn * nx;
        ball.vy -= (1 + REST_OBSTACLE) * vn * ny;
        o.durability--;
        if (o.durability <= 0) {
          state.obstacles.splice(i, 1);
          ball.flightPoints += o.value;
          addFloater(o.x, o.y, '+' + o.value, '#f0ad4e');
          burst(o.x, o.y, o.r);
          if (o.hasAlien) {
            state.aliensFound++;
            addAlienFx(o.x, o.y);
            addFloater(o.x, o.y - 34, t('plusAlien'), ALIEN_COLOR);
            updateHUD();
          }
        }
      }
    }

    var speed = Math.hypot(ball.vx, ball.vy);
    if (speed < 14) ball.slowTime += dt;
    else ball.slowTime = 0;
    if (ball.slowTime > 1.2 || ball.time > MAX_BALL_TIME) {
      return capture(nearestHole(ball.x), ball);
    }
    return true;
  }

  function holeAt(x) {
    for (var i = 0; i < holes.length; i++) {
      if (x > holes[i].start && x < holes[i].end) return holes[i];
    }
    return null;
  }

  function nearestHole(x) {
    var best = holes[0];
    var bestDist = Math.abs(best.center - x);
    for (var i = 1; i < holes.length; i++) {
      var d = Math.abs(holes[i].center - x);
      if (d < bestDist) { bestDist = d; best = holes[i]; }
    }
    return best;
  }

  function capture(hole, ball) {
    var gain = ball.flightPoints * hole.mult;
    state.score += gain;
    addFloater(hole.center, H - 46, '+' + gain, '#e8eaf0');
    if (hole.refund) {
      state.balls++;
      addFloater(hole.center, H - 72, t('plusBall'), KEY_GOLD);
    }
    addFlash(hole.index);
    state.ball = null;
    save();
    updateHUD();
    checkEnd();
    return false;
  }

  function checkEnd() {
    if (state.aliensFound >= state.aliensTotal) {
      var lastLevel = state.levelIndex === LEVELS.length - 1;
      if (state.levelIndex + 1 >= state.unlocked) state.unlocked = Math.min(LEVELS.length, state.levelIndex + 2);
      save();
      if (lastLevel) showOverlay('winAll');
      else showOverlay('won');
    } else if (state.balls <= 0) {
      save();
      showOverlay('lost');
    }
  }

  // ---------- Effects ----------

  function t(key) {
    return window.L4K.t(lang, key);
  }

  function addFloater(x, y, text, color) {
    state.floaters.push({ x: x, y: y, text: text, color: color, life: 1 });
  }

  function addAlienFx(x, y) {
    state.aliensFx.push({ x: x + (Math.random() * 20 - 10), y: y - 26, vy: 0, life: 1.8 });
  }

  function addFlash(index) {
    state.flashes.push({ index: index, life: 0.45 });
  }

  function burst(x, y, r) {
    var colors = ['#9aa2b1', '#5b6472', '#c9cfd8'];
    for (var i = 0; i < 10; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 60 + Math.random() * 160;
      state.floaters.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.5, particle: true, r: 2 + Math.random() * 2,
      });
    }
  }

  function stepFx(dt) {
    for (var i = state.floaters.length - 1; i >= 0; i--) {
      var f = state.floaters[i];
      if (f.particle) {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 300 * dt;
      } else {
        f.y -= 30 * dt;
      }
      f.life -= dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
    for (var j = state.aliensFx.length - 1; j >= 0; j--) {
      var k = state.aliensFx[j];
      k.vy += 200 * dt;
      k.y += k.vy * dt;
      k.life -= dt;
      if (k.life <= 0) state.aliensFx.splice(j, 1);
    }
    for (var h = state.flashes.length - 1; h >= 0; h--) {
      state.flashes[h].life -= dt;
      if (state.flashes[h].life <= 0) state.flashes.splice(h, 1);
    }
  }

  // ---------- HUD / Overlay ----------

  function updateHUD() {
    hudLevel.textContent = t('level') + ' ' + (state.levelIndex + 1);
    hudScore.textContent = t('points') + ' ' + state.score;
    hudBalls.textContent = t('balls') + ' ' + state.balls;
    hudAliens.textContent = t('aliens') + ' ' + state.aliensFound + '/' + state.aliensTotal;
  }

  function showOverlay(kind) {
    currentOverlayKind = kind;
    ovLegend.classList.add('hidden');
    if (kind === 'intro') {
      ovTitle.textContent = t('level') + ' ' + (state.levelIndex + 1);
      ovText.textContent = t('hint');
      ovLegend.textContent = t('legend');
      ovLegend.classList.remove('hidden');
      ovBtn.textContent = t('start');
      ovBtn.onclick = function () {
        state.mode = 'playing';
        hideOverlay();
      };
    } else if (kind === 'won') {
      ovTitle.textContent = t('win');
      ovText.textContent = t('found') + ' ' + state.aliensFound + '/' + state.aliensTotal;
      ovBtn.textContent = t('next');
      ovBtn.onclick = function () {
        setupLevel(state.levelIndex + 1);
        hideOverlay();
        showOverlay('intro');
      };
    } else if (kind === 'winAll') {
      ovTitle.textContent = t('winAll');
      ovText.textContent = t('found') + ' ' + state.aliensFound + '/' + state.aliensTotal + ' · ' + t('points') + ' ' + state.score;
      ovBtn.textContent = t('replay');
      ovBtn.onclick = function () {
        setupLevel(0);
        hideOverlay();
        showOverlay('intro');
      };
    } else if (kind === 'lost') {
      ovTitle.textContent = t('lose');
      ovText.textContent = t('found') + ' ' + state.aliensFound + '/' + state.aliensTotal;
      ovBtn.textContent = t('retry');
      ovBtn.onclick = function () {
        setupLevel(state.levelIndex);
        hideOverlay();
        showOverlay('intro');
      };
    }
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    currentOverlayKind = null;
  }

  function applyLang() {
    lang = window.L4K.currentLang();
    updateHUD();
    if (!overlay.classList.contains('hidden') && currentOverlayKind) {
      showOverlay(currentOverlayKind);
    }
  }

  // ---------- Rendering ----------

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

    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);

    drawStars();
    drawHoles();
    drawDomes();
    drawAsteroids();
    drawAlienFx();
    drawBall();
    drawFloaters();
    drawLauncher();
    if (state.mode === 'playing' && !state.ball && state.lastPointer) drawAim();
  }

  function drawStars() {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (var i = 0; i < 40; i++) {
      var sx = (i * 97) % W;
      var sy = (i * 53) % (H - 120);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }

  function drawHoles() {
    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      ctx.fillStyle = '#0a0c11';
      ctx.fillRect(h.start, H - 18, h.end - h.start, 18);
      var glow = 0;
      for (var j = 0; j < state.flashes.length; j++) {
        if (state.flashes[j].index === i) glow = Math.max(glow, state.flashes[j].life);
      }
      var alpha = h.refund ? 0.9 : h.mult === 2 ? 0.55 : 0.3;
      var color = h.refund ? KEY_GOLD : h.mult === 2 ? '#e0503f' : '#4c5566';
      ctx.globalAlpha = alpha + glow * 0.6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(h.center, H - 14, (h.end - h.start) * 0.35, 5, 0, Math.PI, 0);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawDomes() {
    for (var i = 0; i < domes.length; i++) {
      var d = domes[i];
      ctx.fillStyle = '#2b3242';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#3d4657';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 0.7, Math.PI, 0);
      ctx.stroke();
    }
  }

  function drawAsteroids() {
    for (var i = 0; i < state.obstacles.length; i++) {
      var o = state.obstacles[i];
      var color = COLORS[o.durability] || '#5cb85c';
      ctx.fillStyle = color;
      ctx.beginPath();
      for (var j = 0; j < o.shape.length; j++) {
        var pt = o.shape[j];
        var px = o.x + Math.cos(pt.a) * pt.r;
        var py = o.y + Math.sin(pt.a) * pt.r;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (var c = 0; c < o.craters.length; c++) {
        ctx.beginPath();
        ctx.arc(o.x + o.craters[c].x, o.y + o.craters[c].y, o.craters[c].r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawAlienFx() {
    for (var i = 0; i < state.aliensFx.length; i++) {
      var a = state.aliensFx[i];
      ctx.globalAlpha = Math.min(1, a.life * 1.2);
      drawAlien(a.x, a.y, 13);
      ctx.globalAlpha = 1;
    }
  }

  function drawAlien(x, y, s) {
    ctx.fillStyle = ALIEN_COLOR;
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.8, s * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#0f1117';
    ctx.beginPath();
    ctx.arc(x - s * 0.28, y - s * 0.15, s * 0.22, 0, Math.PI * 2);
    ctx.arc(x + s * 0.28, y - s * 0.15, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - s * 0.22, y - s * 0.25, s * 0.08, 0, Math.PI * 2);
    ctx.arc(x + s * 0.34, y - s * 0.25, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ALIEN_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.0);
    ctx.quadraticCurveTo(x + s * 0.15, y - s * 1.55, x + s * 0.45, y - s * 1.6);
    ctx.stroke();
  }

  function drawBall() {
    var b = state.ball;
    if (!b) return;
    ctx.strokeStyle = 'rgba(242,244,248,0.22)';
    ctx.lineWidth = 3;
    for (var i = 0; i < b.trail.length; i++) {
      var p = b.trail[i];
      ctx.globalAlpha = (i / b.trail.length) * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, BALL_R * (0.4 + 0.5 * (i / b.trail.length)), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = KEY_GOLD;
    ctx.beginPath();
    ctx.arc(b.x - 2.5, b.y - 2.5, b.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFloaters() {
    for (var i = 0; i < state.floaters.length; i++) {
      var f = state.floaters[i];
      ctx.globalAlpha = Math.min(1, f.life * 2);
      if (f.particle) {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r || 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.font = '700 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawLauncher() {
    ctx.fillStyle = '#2a303d';
    ctx.beginPath();
    ctx.arc(LAUNCHER.x, LAUNCHER.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a5363';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(LAUNCHER.x, LAUNCHER.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAim() {
    var p = state.lastPointer;
    var dx = p.x - LAUNCHER.x;
    var dy = p.y - LAUNCHER.y;
    var len = Math.hypot(dx, dy) || 1;
    var lx = LAUNCHER.x + (dx / len) * 240;
    var ly = LAUNCHER.y + (dy / len) * 240;
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255,209,102,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(LAUNCHER.x, LAUNCHER.y);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ---------- Loop ----------

  var lastTime = 0;

  function loop(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (state.ball && state.mode === 'playing') {
      stepBall(state.ball, dt);
    }
    stepFx(dt);
    draw();
    requestAnimationFrame(loop);
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
    if (state.mode !== 'playing') return;
    e.preventDefault();
    var p = toLogical(e);
    state.lastPointer = p;
    launch(p.x, p.y);
  }

  function onPointerMove(e) {
    if (state.mode !== 'playing') return;
    state.lastPointer = toLogical(e);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('resize', resize);
  window.addEventListener('storage', function (e) {
    if (e.key === window.L4K.LANG_KEY) applyLang();
  });

  // ---------- Boot ----------

  loadSave();
  setupLevel(Math.min(state.unlocked, LEVELS.length) - 1);
  resize();
  lastTime = performance.now();
  showOverlay('intro');
  requestAnimationFrame(loop);
})();
