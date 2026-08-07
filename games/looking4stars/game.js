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

  // Poderes
  var POWER_KEYS = ['multiball', 'explosion', 'paddle'];
  var POWER_PRICES = { multiball: 20, explosion: 30, paddle: 25 };
  var MULTIBALL_COUNT = 3;
  var MULTIBALL_SPREAD = 0.16;
  var EXPLOSION_R = 64;
  var PADDLE_W = 160;
  var PADDLE_H = 10;
  var PADDLE_Y = H - 64;
  var PADDLE_TIME = 6;
  var PADDLE_SPEED = 380;

  // Monedas
  var COINS_WIN = 10;
  var COINS_STAR = 5;

  var HOLE_SPECS = [
    { mult: 1, refund: false },
    { mult: 2, refund: false },
    { mult: 1, refund: true },
    { mult: 2, refund: false },
    { mult: 1, refund: false },
  ];
  var HOLE_WIDTHS = [60, 45, 30, 45, 60];

  var LEVELS = [
    { id: 1, diff: 'easy', balls: 3, aliens: 3, count: 18, durabilities: [1, 1, 1], strategy: 'weakest', domes: 1, holes: 1 },
    { id: 2, diff: 'easy', balls: 3, aliens: 3, count: 20, durabilities: [1, 1, 2], strategy: 'weakest', domes: 1, holes: 1 },
    { id: 3, diff: 'medium', balls: 3, aliens: 3, count: 22, durabilities: [1, 2, 2], strategy: 'random', domes: 1, holes: 1 },
    { id: 4, diff: 'medium', balls: 3, aliens: 3, count: 24, durabilities: [1, 2, 2], strategy: 'random', domes: 1.2, holes: 1 },
    { id: 5, diff: 'hard', balls: 3, aliens: 4, count: 26, durabilities: [2, 3, 3], strategy: 'strongest', domes: 1, holes: 1 },
    { id: 6, diff: 'hard', balls: 3, aliens: 4, count: 28, durabilities: [2, 3, 3], strategy: 'strongest', domes: 1.4, holes: 0.9 },
    { id: 7, diff: 'expert', balls: 3, aliens: 4, count: 30, durabilities: [2, 3, 3], strategy: 'strongest', domes: 1, holes: 0.85 },
    { id: 8, diff: 'expert', balls: 2, aliens: 5, count: 30, durabilities: [2, 3, 3], strategy: 'strongest', domes: 1.6, holes: 0.8 },
    { id: 9, diff: 'boss', balls: 3, aliens: 5, count: 32, durabilities: [3, 3, 3], strategy: 'strongest', domes: 1.4, holes: 0.85, timeLimit: 45 },
    { id: 10, diff: 'master', balls: 2, aliens: 5, count: 34, durabilities: [3, 3, 3], strategy: 'strongest', domes: 1.6, holes: 0.75 },
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
  var hud = document.getElementById('hud');
  var hudLevel = document.getElementById('hud-level');
  var hudScore = document.getElementById('hud-score');
  var hudBalls = document.getElementById('hud-balls');
  var hudAliens = document.getElementById('hud-aliens');
  var hudCoins = document.getElementById('hud-coins');
  var hudTime = document.getElementById('hud-time');
  var hudPower = document.getElementById('hud-power');
  var hudMap = document.getElementById('hud-map');
  var overlay = document.getElementById('overlay');
  var ovTitle = document.getElementById('ov-title');
  var ovText = document.getElementById('ov-text');
  var ovPowers = document.getElementById('ov-powers');
  var ovLegend = document.getElementById('ov-legend');
  var ovBtn = document.getElementById('ov-btn');
  var ovBtn2 = document.getElementById('ov-btn2');

  var lang = window.L4K.currentLang();
  var dpr = 1;
  var scale = 1;
  var offsetX = 0;
  var offsetY = 0;
  var currentOverlayKind = null;
  var steerDir = 0;
  var lastTime = 0;

  var state = {
    mode: 'map',
    levelIndex: 0,
    score: 0,
    unlocked: 1,
    coins: 0,
    stars: [],
    carried: null,
    armed: null,
    balls: 0,
    aliensFound: 0,
    aliensTotal: 0,
    timeLimit: 0,
    timeLeft: 0,
    ended: false,
    active: [],
    paddle: null,
    holes: [],
    domes: [],
    obstacles: [],
    floaters: [],
    aliensFx: [],
    flashes: [],
    shocks: [],
    lastPointer: null,
    lastOverlayData: null,
  };

  function t(key) {
    return window.L4K.t(lang, key);
  }

  function buildHoles(factor) {
    var widths = HOLE_WIDTHS.map(function (w, i) {
      if (i === 0 || i === 4) return w;
      return Math.max(14, Math.round(w * (factor || 1)));
    });
    var totalGap = widths.reduce(function (a, b) { return a + b; }, 0);
    var wallW = (W - totalGap) / (HOLE_SPECS.length + 1);
    var x = 0;
    var list = [];
    for (var i = 0; i < HOLE_SPECS.length; i++) {
      var start = x + wallW;
      var end = start + widths[i];
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

  function buildDomes(holes, scaleFactor) {
    var r = DOME_R * (scaleFactor || 1);
    var edges = [0];
    for (var i = 0; i < holes.length; i++) {
      edges.push(holes[i].start, holes[i].end);
    }
    edges.push(W);
    var list = [];
    for (var j = 0; j < edges.length - 1; j += 2) {
      var a = edges[j];
      var b = edges[j + 1];
      list.push({ x: (a + b) / 2, y: H - r, r: r });
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
      state.coins = typeof data.coins === 'number' ? data.coins : 0;
      state.unlocked = Math.min(LEVELS.length, Math.max(1, data.unlocked || 1));
      if (Array.isArray(data.stars)) state.stars = data.stars.slice(0, LEVELS.length);
      else state.stars = [];
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
          coins: state.coins,
          stars: state.stars,
        }),
      );
    } catch (e) {
      // almacenamiento no disponible
    }
  }

  function totalStars() {
    return state.stars.reduce(function (a, b) { return a + (b || 0); }, 0);
  }

  // ---------- Level setup ----------

  function setupLevel(levelIndex) {
    var cfg = LEVELS[levelIndex];
    state.levelIndex = levelIndex;
    state.holes = buildHoles(cfg.holes);
    state.domes = buildDomes(state.holes, cfg.domes);
    state.balls = cfg.balls;
    state.aliensFound = 0;
    state.aliensTotal = cfg.aliens;
    state.timeLimit = cfg.timeLimit || 0;
    state.timeLeft = cfg.timeLimit || 0;
    state.ended = false;
    state.active = [];
    state.paddle = null;
    state.armed = null;
    state.flashes = [];
    state.shocks = [];
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

  function makeBall(dx, dy) {
    var len = Math.hypot(dx, dy) || 1;
    return {
      x: LAUNCHER.x,
      y: LAUNCHER.y,
      vx: (dx / len) * LAUNCH_SPEED,
      vy: (dy / len) * LAUNCH_SPEED,
      r: BALL_R,
      flightPoints: 0,
      trail: [],
      slowTime: 0,
      time: 0,
      explosive: false,
      exploded: false,
    };
  }

  function launch(px, py) {
    if (state.mode !== 'playing') return;
    if (state.active.length) return;
    if (state.balls <= 0) return;
    if (state.paddle && state.paddle.life > 0) return;

    var dx = px - LAUNCHER.x;
    var dy = py - LAUNCHER.y;
    state.balls--;

    if (state.armed === 'multiball') {
      state.armed = null;
      state.carried = null;
      var base = Math.atan2(dy, dx);
      for (var i = 0; i < MULTIBALL_COUNT; i++) {
        var a = base + (i - (MULTIBALL_COUNT - 1) / 2) * MULTIBALL_SPREAD;
        state.active.push(makeBall(Math.cos(a), Math.sin(a)));
      }
    } else if (state.armed === 'explosion') {
      state.armed = null;
      state.carried = null;
      var eb = makeBall(dx, dy);
      eb.explosive = true;
      state.active.push(eb);
    } else {
      state.active.push(makeBall(dx, dy));
    }
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

    // tabla (rebote sin caer en agujeros)
    var pd = state.paddle;
    if (pd && pd.life > 0 && ball.vy > 0 &&
        ball.y + ball.r >= PADDLE_Y && ball.y - ball.r <= PADDLE_Y + PADDLE_H &&
        ball.x > pd.x - pd.w / 2 && ball.x < pd.x + pd.w / 2) {
      ball.y = PADDLE_Y - ball.r;
      ball.vy = -Math.abs(ball.vy) * REST_OBSTACLE;
      ball.vx *= 0.98;
    }

    if (ball.y + ball.r >= H) {
      var hole = holeAt(ball.x);
      if (hole) return capture(hole, ball);
      ball.y = H - ball.r;
      ball.vy = -ball.vy * REST_WALL;
      ball.vx *= 0.92;
    }

    // cúpulas (rebote sin daño, desvío impredecible)
    for (var d = 0; d < state.domes.length; d++) {
      var dome = state.domes[d];
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
        if (ball.explosive && !ball.exploded) {
          ball.exploded = true;
          explodeAt(ball, ball.x, ball.y);
        } else {
          hitObstacle(ball, o, i);
        }
      }
      break;
    }

    var speed = Math.hypot(ball.vx, ball.vy);
    if (speed < 14) ball.slowTime += dt;
    else ball.slowTime = 0;
    if (ball.slowTime > 1.2 || ball.time > MAX_BALL_TIME) {
      return capture(nearestHole(ball.x), ball);
    }
    return true;
  }

  function hitObstacle(ball, o, index) {
    o.durability--;
    if (o.durability <= 0) {
      state.obstacles.splice(index, 1);
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

  function explodeAt(ball, x, y) {
    addShock(x, y, EXPLOSION_R);
    addFloater(x, y, t('explosion'), '#ffb84d');
    for (var i = state.obstacles.length - 1; i >= 0; i--) {
      var o = state.obstacles[i];
      if (Math.hypot(o.x - x, o.y - y) <= EXPLOSION_R + o.r) {
        hitObstacle(ball, o, i);
      }
    }
  }

  function holeAt(x) {
    for (var i = 0; i < state.holes.length; i++) {
      if (x > state.holes[i].start && x < state.holes[i].end) return state.holes[i];
    }
    return null;
  }

  function nearestHole(x) {
    var best = state.holes[0];
    var bestDist = Math.abs(best.center - x);
    for (var i = 1; i < state.holes.length; i++) {
      var d = Math.abs(state.holes[i].center - x);
      if (d < bestDist) { bestDist = d; best = state.holes[i]; }
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
    save();
    return false;
  }

  function stepActive(dt) {
    for (var i = state.active.length - 1; i >= 0; i--) {
      if (!stepBall(state.active[i], dt)) state.active.splice(i, 1);
    }
    if (state.active.length === 0) checkEnd();
  }

  function checkEnd() {
    if (state.ended) return;
    if (state.aliensFound >= state.aliensTotal) {
      winLevel();
    } else if (state.active.length === 0 && state.balls <= 0) {
      loseLevel('balls');
    }
  }

  function winLevel() {
    state.ended = true;
    var ballsLeft = state.balls;
    var stars = ballsLeft >= 2 ? 3 : ballsLeft >= 1 ? 2 : 1;
    var prev = state.stars[state.levelIndex] || 0;
    if (stars > prev) state.stars[state.levelIndex] = stars;
    var earned = COINS_WIN + (stars - 1) * COINS_STAR;
    state.coins += earned;
    if (state.levelIndex + 1 >= state.unlocked) {
      state.unlocked = Math.min(LEVELS.length, state.levelIndex + 2);
    }
    state.carried = null;
    state.armed = null;
    state.active.length = 0;
    save();
    var last = state.levelIndex === LEVELS.length - 1;
    showOverlay(last ? 'winAll' : 'won', { stars: stars, earned: earned });
  }

  function loseLevel(reason) {
    state.ended = true;
    state.armed = null;
    state.active.length = 0;
    save();
    showOverlay('lost', { reason: reason });
  }

  // ---------- Paddle ----------

  function activatePaddle() {
    state.paddle = { x: W / 2, w: PADDLE_W, life: PADDLE_TIME };
    state.carried = null;
    state.armed = null;
    updateHUD();
  }

  function stepPaddle(dt) {
    var p = state.paddle;
    if (!p) return;
    p.life -= dt;
    if (p.life <= 0) {
      state.paddle = null;
      updateHUD();
      return;
    }
    if (steerDir) {
      p.x += steerDir * PADDLE_SPEED * dt;
      p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x));
    }
  }

  // ---------- Effects ----------

  function addFloater(x, y, text, color) {
    state.floaters.push({ x: x, y: y, text: text, color: color, life: 1 });
  }

  function addAlienFx(x, y) {
    state.aliensFx.push({ x: x + (Math.random() * 20 - 10), y: y - 26, vy: 0, life: 1.8 });
  }

  function addFlash(index) {
    state.flashes.push({ index: index, life: 0.45 });
  }

  function addShock(x, y, maxR) {
    state.shocks.push({ x: x, y: y, r: 10, maxR: maxR, life: 0.35 });
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
    for (var s = state.shocks.length - 1; s >= 0; s--) {
      state.shocks[s].life -= dt;
      state.shocks[s].r += (state.shocks[s].maxR - 10) * dt * 4;
      if (state.shocks[s].life <= 0) state.shocks.splice(s, 1);
    }
  }

  // ---------- HUD ----------

  function updateHUD() {
    if (state.mode === 'map') return;
    hudLevel.textContent = t('level') + ' ' + (state.levelIndex + 1);
    hudScore.textContent = t('points') + ' ' + state.score;
    hudBalls.textContent = t('balls') + ' ' + state.balls;
    hudAliens.textContent = t('aliens') + ' ' + state.aliensFound + '/' + state.aliensTotal;
    hudCoins.textContent = '● ' + state.coins;
    if (state.timeLimit > 0) {
      hudTime.classList.remove('hidden');
      hudTime.textContent = t('time') + ' ' + Math.ceil(Math.max(0, state.timeLeft));
      hudTime.style.color = state.timeLeft <= 10 ? '#e0503f' : '#f0ad4e';
    } else {
      hudTime.classList.add('hidden');
    }
    if (state.carried) {
      hudPower.classList.remove('hidden');
      hudPower.textContent = state.armed ? '✓ ' + t(state.carried) : t(state.carried);
      hudPower.classList.toggle('armed', !!state.armed);
    } else {
      hudPower.classList.add('hidden');
    }
  }

  // ---------- Overlay ----------

  function starsString(n) {
    return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
  }

  function showOverlay(kind, data) {
    currentOverlayKind = kind;
    state.lastOverlayData = data || null;
    ovPowers.classList.add('hidden');
    ovLegend.classList.add('hidden');
    ovBtn2.classList.add('hidden');
    if (kind === 'levelStart') {
      ovTitle.textContent = t('level') + ' ' + (state.levelIndex + 1);
      var cfg = LEVELS[state.levelIndex];
      var info = t('difficulty') + ': ' + t('diff' + cap(cfg.diff)) + ' · ' + t('aliens') + ': ' + cfg.aliens + ' · ' + t('balls') + ': ' + cfg.balls;
      if (cfg.timeLimit) info += ' · ' + t('withTime').replace('{s}', cfg.timeLimit);
      ovText.textContent = info;
      buildPowerShop();
      ovBtn.textContent = t('play');
      ovBtn.onclick = function () {
        state.mode = 'intro';
        showOverlay('intro');
      };
      ovBtn2.classList.add('hidden');
    } else if (kind === 'intro') {
      ovTitle.textContent = t('level') + ' ' + (state.levelIndex + 1);
      ovText.textContent = t('hint');
      ovLegend.textContent = t('legend');
      ovLegend.classList.remove('hidden');
      ovBtn.textContent = t('start');
      ovBtn.onclick = function () {
        state.mode = 'playing';
        updateHUD();
        hideOverlay();
      };
    } else if (kind === 'won' || kind === 'winAll') {
      ovTitle.textContent = kind === 'winAll' ? t('winAll') : t('win');
      ovText.textContent =
        t('found') + ' ' + state.aliensFound + '/' + state.aliensTotal + ' · ' +
        t('starsEarned') + ' ' + starsString(data.stars) + ' · ' +
        t('coinsEarned') + ' +' + data.earned;
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
      ovText.textContent = data && data.reason === 'time' ? t('outOfTime') : t('lose');
      ovBtn.textContent = t('retry');
      ovBtn.onclick = function () {
        setupLevel(state.levelIndex);
        state.mode = 'intro';
        showOverlay('intro');
      };
      ovBtn2.classList.remove('hidden');
      ovBtn2.textContent = t('backMap');
      ovBtn2.onclick = showMap;
    }
    overlay.classList.remove('hidden');
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function buildPowerShop() {
    ovPowers.innerHTML = '';
    ovPowers.classList.remove('hidden');
    var hint = document.createElement('div');
    hint.className = 'power-desc';
    hint.textContent = t('choosePower');
    ovPowers.appendChild(hint);
    POWER_KEYS.forEach(function (key) {
      var price = POWER_PRICES[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'power-btn';
      var name = document.createElement('span');
      name.className = 'power-name';
      name.textContent = t(key);
      var desc = document.createElement('span');
      desc.className = 'power-desc';
      desc.textContent = t(key + 'Desc');
      var priceEl = document.createElement('span');
      priceEl.className = 'power-price';
      var canAfford = state.coins >= price;
      if (state.carried === key) {
        btn.classList.add('equipped');
        priceEl.textContent = '✓ ' + t('equipped');
      } else {
        priceEl.textContent = canAfford ? price + ' ●' : t('notEnough');
      }
      btn.appendChild(name);
      btn.appendChild(desc);
      btn.appendChild(priceEl);
      if (state.carried && state.carried !== key) btn.disabled = true;
      if (state.carried !== key && !canAfford) btn.disabled = true;
      if (!btn.disabled) {
        btn.addEventListener('click', function () {
          state.coins -= price;
          state.carried = key;
          save();
          buildPowerShop();
        });
      }
      ovPowers.appendChild(btn);
    });
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    currentOverlayKind = null;
  }

  function applyLang() {
    lang = window.L4K.currentLang();
    if (state.mode === 'map') return;
    if (!overlay.classList.contains('hidden') && currentOverlayKind) {
      var d = state.lastOverlayData || {};
      if (currentOverlayKind === 'levelStart') showOverlay('levelStart');
      else if (currentOverlayKind === 'intro') showOverlay('intro');
      else if (currentOverlayKind === 'won' || currentOverlayKind === 'winAll') showOverlay(currentOverlayKind, { stars: d.stars || 1, earned: d.earned || 0 });
      else if (currentOverlayKind === 'lost') showOverlay('lost', { reason: d.reason || 'balls' });
      return;
    }
    updateHUD();
  }

  // ---------- Map ----------

  function showMap() {
    state.mode = 'map';
    state.carried = null;
    state.armed = null;
    state.active.length = 0;
    state.paddle = null;
    hud.classList.add('hidden');
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
      addFloater(pts[best].x, pts[best].y - 30, t('locked'), '#9aa2b1');
      return;
    }
    state.levelIndex = best;
    setupLevel(best);
    state.mode = 'levelStart';
    hud.classList.remove('hidden');
    showOverlay('levelStart');
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

    drawStarsBg();
    if (state.mode === 'map' || state.mode === 'levelStart') {
      drawMap();
    } else {
      drawHoles();
      drawDomes();
      drawAsteroids();
      drawAlienFx();
      drawPaddle();
      drawActive();
      drawShocks();
      drawFloaters();
      drawLauncher();
      if (state.mode === 'playing' && !state.active.length && state.lastPointer && !state.paddle) drawAim();
    }
  }

  function drawStarsBg() {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (var i = 0; i < 40; i++) {
      var sx = (i * 97) % W;
      var sy = (i * 53) % (H - 120);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }

  function drawMap() {
    var pts = mapPath();
    var now = performance.now() / 1000;

    // camino
    ctx.strokeStyle = 'rgba(255,209,102,0.18)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    // título
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eaf0';
    ctx.fillText('Looking4Stars', W / 2, 84);

    // monedas (arriba derecha)
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = KEY_GOLD;
    ctx.beginPath();
    ctx.arc(W - 74, 48, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10131a';
    ctx.beginPath();
    ctx.arc(W - 74, 48, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = KEY_GOLD;
    ctx.fillText(String(state.coins), W - 54, 54);

    // estrellas totales (arriba izquierda)
    ctx.textAlign = 'left';
    ctx.fillStyle = KEY_GOLD;
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText('★ ' + totalStars() + '/' + (LEVELS.length * 3), 20, 55);

    // nodos
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
      ctx.strokeStyle = locked ? '#4a5363' : KEY_GOLD;
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
        ctx.fillStyle = KEY_GOLD;
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('★'.repeat(state.stars[j]), p.x, p.y + 42);
      }
    }

    // hint
    ctx.fillStyle = '#9aa2b1';
    ctx.font = '500 14px system-ui, sans-serif';
    ctx.fillText(t('tapNode'), W / 2, H - 26);
  }

  function drawHoles() {
    for (var i = 0; i < state.holes.length; i++) {
      var h = state.holes[i];
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
    for (var i = 0; i < state.domes.length; i++) {
      var d = state.domes[i];
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

  function drawPaddle() {
    var p = state.paddle;
    if (!p || p.life <= 0) return;
    ctx.globalAlpha = Math.min(1, p.life * 1.5);
    ctx.fillStyle = KEY_GOLD;
    ctx.fillRect(p.x - p.w / 2, PADDLE_Y, p.w, PADDLE_H);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(p.x - p.w / 2 + 4, PADDLE_Y + 2, p.w - 8, PADDLE_H * 0.35);
    ctx.globalAlpha = 1;
  }

  function drawActive() {
    for (var i = 0; i < state.active.length; i++) {
      drawBall(state.active[i]);
    }
  }

  function drawBall(b) {
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
    if (b.explosive) {
      ctx.fillStyle = '#ffb84d';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = KEY_GOLD;
    ctx.beginPath();
    ctx.arc(b.x - 2.5, b.y - 2.5, b.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShocks() {
    for (var i = 0; i < state.shocks.length; i++) {
      var s = state.shocks[i];
      ctx.globalAlpha = Math.min(1, s.life * 3);
      ctx.strokeStyle = '#ffb84d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
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

  function loop(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (state.mode === 'playing') {
      if (state.timeLimit > 0) {
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          updateHUD();
          loseLevel('time');
        } else {
          updateHUD();
        }
      }
      stepPaddle(dt);
      if (!state.ended) stepActive(dt);
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
    if (state.mode === 'map') {
      var mp = toLogical(e);
      selectMapNode(mp.x, mp.y);
      return;
    }
    if (state.mode !== 'playing') return;
    e.preventDefault();
    var p = toLogical(e);
    state.lastPointer = p;
    if (state.paddle && state.paddle.life > 0) {
      steerDir = p.x < W * 0.35 ? -1 : p.x > W * 0.65 ? 1 : 0;
      return;
    }
    launch(p.x, p.y);
  }

  function onPointerMove(e) {
    if (state.mode !== 'playing') return;
    var p = toLogical(e);
    state.lastPointer = p;
    if (state.paddle && state.paddle.life > 0) {
      steerDir = p.x < W * 0.35 ? -1 : p.x > W * 0.65 ? 1 : 0;
    }
  }

  function clearSteer() {
    steerDir = 0;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', clearSteer);
  canvas.addEventListener('pointercancel', clearSteer);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { steerDir = -1; e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { steerDir = 1; e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
        e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (steerDir === (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? -1 : 1)) steerDir = 0;
    }
  });

  hudPower.addEventListener('click', function () {
    if (state.mode !== 'playing') return;
    if (!state.carried) return;
    if (state.paddle && state.paddle.life > 0) return;
    if (state.armed) {
      state.armed = null;
    } else if (state.carried === 'paddle') {
      activatePaddle();
    } else {
      state.armed = state.carried;
    }
    updateHUD();
  });

  hudMap.addEventListener('click', function () {
    showMap();
  });

  window.addEventListener('resize', resize);
  window.addEventListener('storage', function (e) {
    if (e.key === window.L4K.LANG_KEY) applyLang();
  });

  // ---------- Boot ----------

  loadSave();
  resize();
  lastTime = performance.now();
  hud.classList.add('hidden');
  requestAnimationFrame(loop);

  // ---------- Debug hook (solo para pruebas) ----------
  window.__L4K_T = {
    get state() { return state; },
    get LEVELS() { return LEVELS; },
    launch: launch,
    setupLevel: setupLevel,
    showOverlay: showOverlay,
    activatePaddle: activatePaddle,
    winLevel: winLevel,
    loseLevel: loseLevel,
  };
})();
