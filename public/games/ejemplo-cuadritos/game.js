(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('score');
  var timeEl = document.getElementById('time');

  var W = 800;
  var H = 600;
  var TILE = 32;

  var player = { x: W / 2, y: H / 2, speed: 220 };
  var keys = {};
  var coins = [];
  var score = 0;
  var timeLeft = 30;
  var running = false;
  var last = 0;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnCoin() {
    coins.push({
      x: Math.random() * (W - TILE * 2) + TILE,
      y: Math.random() * (H - TILE * 2) + TILE,
      r: 7,
    });
  }

  function reset() {
    player.x = W / 2;
    player.y = H / 2;
    coins = [];
    for (var i = 0; i < 8; i++) spawnCoin();
    score = 0;
    timeLeft = 30;
    scoreEl.textContent = 'Puntos: 0';
    timeEl.textContent = 'Tiempo: 30s';
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    if (!running) return;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    var dx = (keys['ArrowRight'] ? 1 : 0) - (keys['ArrowLeft'] ? 1 : 0);
    var dy = (keys['ArrowDown'] ? 1 : 0) - (keys['ArrowUp'] ? 1 : 0);
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;
    player.x = Math.max(TILE / 2, Math.min(W - TILE / 2, player.x));
    player.y = Math.max(TILE / 2, Math.min(H - TILE / 2, player.y));

    for (var i = coins.length - 1; i >= 0; i--) {
      var c = coins[i];
      var d = Math.hypot(c.x - player.x, c.y - player.y);
      if (d < c.r + TILE / 2) {
        coins.splice(i, 1);
        score++;
        scoreEl.textContent = 'Puntos: ' + score;
        spawnCoin();
      }
    }

    timeLeft -= dt;
    timeEl.textContent = 'Tiempo: ' + Math.max(0, Math.ceil(timeLeft)) + 's';
    if (timeLeft <= 0) {
      running = false;
      draw();
      drawMessage('¡Se acabó el tiempo! Puntos: ' + score + ' — pulsa R para repetir');
      return;
    }

    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

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

    ctx.fillStyle = '#e8eaf0';
    ctx.fillRect(player.x - TILE / 2, player.y - TILE / 2, TILE, TILE);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(player.x - TILE / 2 + 4, player.y - TILE / 2 + 4, TILE - 8, TILE - 8);
  }

  function drawMessage(text) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H / 2 - 40, W, 80);
    ctx.fillStyle = '#e8eaf0';
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, H / 2 + 7);
  }

  document.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if ((e.key === 'r' || e.key === 'R') && !running) reset();
    e.preventDefault();
  });

  document.addEventListener('keyup', function (e) {
    keys[e.key] = false;
  });

  window.addEventListener('resize', resize);
  resize();
  reset();
})();
