(function () {
  'use strict';

  var W = 800;
  var H = 600;
  var TILE = 32;

  // ---- Balance (constantes ajustables, docs/games/cuadritos.md §7) ----
  var START_TIME = 30;
  var BONUS_TIME = 2;
  var BONUS_INTERVAL_MIN = 5;
  var BONUS_INTERVAL_MAX = 9;
  var BONUS_LIFE = 3;
  var PLAYER_SPEED = 220;
  var STORAGE_KEY = 'doradofundev.cuadritos.highscore';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('score');
  var recordEl = document.getElementById('record');
  var timeEl = document.getElementById('time');
  var hintEl = document.getElementById('hint');

  var lang = window.CUAD.currentLang();
  var player = { x: W / 2, y: H / 2, speed: PLAYER_SPEED };
  var keys = {};
  var coins = [];
  var floaters = [];
  var score = 0;
  var record = 0;
  var timeLeft = START_TIME;
  var running = false;
  var last = 0;
  var bonus = null;
  var nextBonusIn = 0;
  var newRecord = false;

  var dpr = 1;
  var scale = 1;
  var offsetX = 0;
  var offsetY = 0;

  function t(key) {
    return window.CUAD.t(lang, key);
  }

  // ---------- Pantalla: aspect-fit, sin barras de desplazamiento ----------

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

  function toLogical(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetX) / scale,
      y: (e.clientY - rect.top - offsetY) / scale,
    };
  }

  // ---------- Puntos ----------

  function spawnCoin() {
    coins.push({
      x: Math.random() * (W - TILE * 2) + TILE,
      y: Math.random() * (H - TILE * 2) + TILE,
      r: 7,
    });
  }

  // ---------- Reloj de bonificación ----------

  function spawnBonus() {
    bonus = {
      x: Math.random() * (W - TILE * 2) + TILE,
      y: Math.random() * (H - TILE * 2) + TILE,
      r: 16,
      life: BONUS_LIFE,
    };
  }

  function nextBonusInterval() {
    return BONUS_INTERVAL_MIN + Math.random() * (BONUS_INTERVAL_MAX - BONUS_INTERVAL_MIN);
  }

  // ---------- Récord ----------

  function loadRecord() {
    try {
      record = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
    } catch (e) {
      record = 0;
    }
  }

  function saveRecord() {
    try {
      localStorage.setItem(STORAGE_KEY, String(record));
    } catch (e) {
      // almacenamiento no disponible
    }
  }

  // ---------- HUD ----------

  function updateHUD() {
    scoreEl.textContent = t('points') + ': ' + score;
    recordEl.textContent = t('record') + ': ' + record;
    timeEl.textContent = t('time') + ': ' + Math.max(0, Math.ceil(timeLeft)) + 's';
    hintEl.textContent = t('hint');
  }

  // ---------- Reset / loop ----------

  function reset() {
    player.x = W / 2;
    player.y = H / 2;
    coins = [];
    floaters = [];
    bonus = null;
    nextBonusIn = nextBonusInterval();
    for (var i = 0; i < 8; i++) spawnCoin();
    score = 0;
    newRecord = false;
    timeLeft = START_TIME;
    updateHUD();
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    if (!running) return;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    var dx = (keys['ArrowRight'] || keys['d'] ? 1 : 0) - (keys['ArrowLeft'] || keys['a'] ? 1 : 0);
    var dy = (keys['ArrowDown'] || keys['s'] ? 1 : 0) - (keys['ArrowUp'] || keys['w'] ? 1 : 0);
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;
    player.x = Math.max(TILE / 2, Math.min(W - TILE / 2, player.x));
    player.y = Math.max(TILE / 2, Math.min(H - TILE / 2, player.y));

    // puntos
    for (var i = coins.length - 1; i >= 0; i--) {
      var c = coins[i];
      if (Math.hypot(c.x - player.x, c.y - player.y) < c.r + TILE / 2) {
        coins.splice(i, 1);
        score++;
        spawnCoin();
        scoreEl.textContent = t('points') + ': ' + score;
      }
    }

    // reloj de bonificación
    nextBonusIn -= dt;
    if (!bonus && nextBonusIn <= 0) {
      spawnBonus();
      nextBonusIn = nextBonusInterval();
    }
    if (bonus) {
      bonus.life -= dt;
      if (bonus.life <= 0) {
        bonus = null;
      } else if (Math.hypot(bonus.x - player.x, bonus.y - player.y) < bonus.r + TILE / 2) {
        timeLeft += BONUS_TIME;
        addFloater(bonus.x, bonus.y - 20, '+' + BONUS_TIME + 's', '#7ee787');
        bonus = null;
      }
    }

    // flotadores
    for (var f = floaters.length - 1; f >= 0; f--) {
      floaters[f].y -= 40 * dt;
      floaters[f].life -= dt;
      if (floaters[f].life <= 0) floaters.splice(f, 1);
    }

    timeLeft -= dt;
    timeEl.textContent = t('time') + ': ' + Math.max(0, Math.ceil(timeLeft)) + 's';
    if (timeLeft <= 0) {
      running = false;
      if (score > record) {
        record = score;
        saveRecord();
        newRecord = true;
      }
      updateHUD();
      draw();
      drawGameOver();
      return;
    }

    draw();
    requestAnimationFrame(loop);
  }

  function addFloater(x, y, text, color) {
    floaters.push({ x: x, y: y, text: text, color: color, life: 1 });
  }

  // ---------- Dibujo ----------

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#12141a';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);

    ctx.fillStyle = '#1b1e27';
    for (var y = 0; y < H; y += TILE) {
      for (var x = 0; x < W; x += TILE) {
        if ((x / TILE + y / TILE) % 2 === 0) ctx.fillRect(x, y, TILE, TILE);
      }
    }

    coins.forEach(function (c) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (bonus) {
      var blink = Math.sin(bonus.life * 8) > 0 ? 1 : 0.55;
      ctx.globalAlpha = blink;
      ctx.fillStyle = '#7ee787';
      ctx.beginPath();
      ctx.arc(bonus.x, bonus.y, bonus.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2f4a35';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f1117';
      ctx.font = '700 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+' + BONUS_TIME + 's', bonus.x, bonus.y + 5);
      ctx.globalAlpha = 1;
    }

    floaters.forEach(function (fl) {
      ctx.globalAlpha = Math.min(1, fl.life * 2);
      ctx.fillStyle = fl.color;
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fl.text, fl.x, fl.y);
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = '#e8eaf0';
    ctx.fillRect(player.x - TILE / 2, player.y - TILE / 2, TILE, TILE);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(player.x - TILE / 2 + 4, player.y - TILE / 2 + 4, TILE - 8, TILE - 8);
  }

  function drawGameOver() {
    var msg = t('gameOver') + ' ' + t('finalPoints') + ' ' + score;
    if (newRecord) msg += ' — ' + t('newRecord') + ' ' + record;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H / 2 - 50, W, 100);
    ctx.fillStyle = '#e8eaf0';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, W / 2, H / 2 - 6);
    ctx.fillStyle = '#9aa2b1';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('— ' + t('pressR') + ' —', W / 2, H / 2 + 24);
  }

  // ---------- Input ----------

  document.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if ((e.key === 'r' || e.key === 'R') && !running) reset();
    e.preventDefault();
  });

  document.addEventListener('keyup', function (e) {
    keys[e.key] = false;
  });

  window.addEventListener('resize', resize);
  window.addEventListener('storage', function (e) {
    if (e.key === window.CUAD.LANG_KEY) {
      lang = window.CUAD.currentLang();
      updateHUD();
    }
  });

  // ---------- Boot ----------

  loadRecord();
  resize();
  updateHUD();
  reset();
})();
