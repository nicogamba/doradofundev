(function () {
  'use strict';

  // ---------- Config ----------

  var W = 480;
  var H = 800;
  var SET_TARGET = 15;
  var SETS_TO_WIN = 2;
  var STORAGE_KEY = 'doradofundev.voleyaslife.career';
  var ADVERSITY_CHANCE = 0.3;
  var thisSpeed = 1;
  var SPEED_BASE = 1.35;
  var LEAGUE_SIZE = 8;
  var SEASON_MATCHES = (LEAGUE_SIZE - 1) * 2;
  var PLAYER_MOVE_SPEED = 200;

  var STATS = ['S', 'A', 'R', 'B', 'D'];
  var STAT_LABEL = { S: 'saque', A: 'ataque', R: 'recepcion', B: 'bloqueo', D: 'defensa' };

  var POSITIONS = {
    punta: { S: 3, A: 5, R: 5, B: 3, D: 3 },
    armador: { S: 3, A: 3, R: 5, B: 3, D: 4 },
    opuesto: { S: 3, A: 5, R: 3, B: 4, D: 3 },
    central: { S: 2, A: 4, R: 3, B: 5, D: 4 },
    libero: { S: 1, A: 1, R: 6, B: 1, D: 6 },
  };

  var TEAM_BASE = { S: 4, A: 4, R: 4, B: 4, D: 4 };
  var TEAMMATE = { S: 4, A: 4, R: 4, B: 4, D: 4 };
  var ROTATION_ORDER = [1, 6, 5, 4, 3, 2];

  var DECISIONS = {
    attack: [
      { key: 'remateZona5', threshold: 2, directOnPerfect: false, zone: 5, diff: 0.09, defMod: -1 },
      { key: 'remateZona1', threshold: 2, directOnPerfect: false, zone: 1, diff: 0.09, defMod: -1 },
      { key: 'remateZona6', threshold: 1, directOnPerfect: false, zone: 6, diff: -0.07, defMod: 0 },
      { key: 'suelta', threshold: 3, directOnPerfect: true, zone: 6, diff: 0.05, defMod: -0.5 },
    ],
    receive: [
      { key: 'recepcionSegura', threshold: 1, directOnPerfect: false, diff: -0.06 },
      { key: 'recepcionAgresiva', threshold: 2, directOnPerfect: true, diff: 0.08 },
    ],
    set: [
      { key: 'armarA2', threshold: 2, directOnPerfect: false, zone: 2, diff: 0.05, setBoost: 1 },
      { key: 'armarA4', threshold: 2, directOnPerfect: false, zone: 4, diff: 0.05, setBoost: 1 },
      { key: 'armarA6', threshold: 2, directOnPerfect: false, zone: 6, diff: 0.1, setBoost: 2 },
      { key: 'pasarla', threshold: 3, directOnPerfect: true, zone: 3, diff: 0.05, setBoost: 0 },
    ],
    block: [
      { key: 'bloqueoSeguro', threshold: 1, directOnPerfect: false, diff: -0.05 },
      { key: 'bloqueoAgresivo', threshold: 2, directOnPerfect: false, diff: 0.06 },
    ],
  };

  // ---------- DOM ----------

  var court = document.getElementById('court');
  var ctx = court.getContext('2d');
  var hud = document.getElementById('hud');
  var hudSet = document.getElementById('hud-set');
  var hudScore = document.getElementById('hud-score');
  var speedBtn = document.getElementById('speed-btn');
  var screen = document.getElementById('screen');
  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modal-title');
  var modalText = document.getElementById('modal-text');
  var btn0 = document.getElementById('btn0');
  var btn1 = document.getElementById('btn1');
  var btn2 = document.getElementById('btn2');
  var btn3 = document.getElementById('btn3');
  var minigame = document.getElementById('minigame');
  var mgTitle = document.getElementById('mg-title');
  var mgBar = document.getElementById('mg-bar');
  var mgZoneOk = document.getElementById('mg-zone-ok');
  var mgZoneGood = document.getElementById('mg-zone-good');
  var mgZonePerfect = document.getElementById('mg-zone-perfect');
  var lgPerfect = document.getElementById('lg-perfect');
  var lgGood = document.getElementById('lg-good');
  var lgOk = document.getElementById('lg-ok');
  var mgMarker = document.getElementById('mg-marker');
  var mgTap = document.getElementById('mg-tap');
  var commentLines = [0, 1, 2, 3].map(function (i) {
    return document.getElementById('c' + i);
  });

  var lang = window.VAV.currentLang();
  var dpr = 1;
  var scale = 1;
  var offsetX = 0;
  var offsetY = 0;

  var ball = { x: W / 2, y: H / 2, h: 0, maxH: 1, rot: 0 };
  var ballTrail = [];
  var label = null;
  var mg = null;
  var impacts = [];
  var simTime = 0;
  var teams = { 0: null, 1: null };
  var playerPos = { 0: [], 1: [] };
  var playerTarget = { 0: [], 1: [] };
  var playerPhase = { 0: [], 1: [] };
  var playerJump = { 0: [], 1: [] };
  var ballNow = { x: W / 2, y: H / 2 };
  var pointBanner = null;
  var screenFlash = null;
  var serveRing = null;

  function t(key) {
    return window.VAV.t(lang, key);
  }

  function escHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function comment(text) {
    for (var i = 3; i > 0; i--) {
      commentLines[i].textContent = commentLines[i - 1].textContent;
    }
    commentLines[0].textContent = text;
  }

  function clearCommentary() {
    commentLines.forEach(function (el) {
      el.textContent = '';
    });
  }

  function pName(team, player) {
    return player.isPlayer ? career.name : '#' + player.number;
  }

  function teamName(team) {
    return team === 0 ? t('yourTeam') : match.rival.club;
  }

  function positionNameKey() {
    return 'position' + career.position.charAt(0).toUpperCase() + career.position.slice(1);
  }

  // ---------- Court ----------

  var COURT = { x: 110, y: 160, w: 260, h: 560, netY: 440 };

  function zoneBasePos(team, zone) {
    var front = zone === 2 || zone === 3 || zone === 4;
    var col = zone === 1 || zone === 2 ? 2 : zone === 4 || zone === 5 ? 0 : 1;
    var xs0 = [COURT.x + 45, COURT.x + COURT.w / 2, COURT.x + COURT.w - 45];
    var xs1 = [COURT.x + COURT.w - 45, COURT.x + COURT.w / 2, COURT.x + 45];
    var x = team === 0 ? xs0[col] : xs1[col];
    var y = team === 0
      ? (front ? COURT.netY + 65 : COURT.netY + 150)
      : (front ? COURT.netY - 65 : COURT.netY - 150);
    return { x: x, y: y };
  }

  function makeLineup(isPlayerTeam) {
    var roles = isPlayerTeam
      ? (career.position === 'punta'
          ? ['outside', 'setter', 'middle', 'opposite', 'middle', 'libero']
          : ['setter', 'outside', 'middle', 'opposite', 'middle', 'libero'])
      : ['setter', 'outside', 'middle', 'opposite', 'middle', 'libero'];
    var pool = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12].filter(function (n) {
      return !isPlayerTeam || n !== career.number;
    });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    var numbers = pool.slice(0, 6);
    if (isPlayerTeam) numbers[0] = career.number;
    return roles.map(function (role, i) {
      return { role: role, zoneIndex: i, isPlayer: isPlayerTeam && i === 0, number: numbers[i] };
    });
  }

  function initTeams() {
    teams[0] = makeLineup(true);
    teams[1] = makeLineup(false);
    for (var key = 0; key < 2; key++) {
      playerPos[key] = teams[key].map(function (p) {
        return zoneBasePos(key, ROTATION_ORDER[p.zoneIndex]);
      });
      playerTarget[key] = playerPos[key].map(function (p) {
        return { x: p.x, y: p.y };
      });
      playerPhase[key] = playerPos[key].map(function () {
        return Math.random() * Math.PI * 2;
      });
      playerJump[key] = playerPos[key].map(function () {
        return 0;
      });
    }
    ballNow = { x: W / 2, y: COURT.netY };
  }

  function rotateTeam(team) {
    teams[team].forEach(function (p) {
      p.zoneIndex = (p.zoneIndex + 1) % 6;
    });
    playerTarget[team] = teams[team].map(function (p) {
      return zoneBasePos(team, ROTATION_ORDER[p.zoneIndex]);
    });
  }

  function setFormationTargets() {
    for (var key = 0; key < 2; key++) {
      playerTarget[key] = teams[key].map(function (p) {
        return zoneBasePos(key, ROTATION_ORDER[p.zoneIndex]);
      });
    }
  }

  function moveTo(team, index, pos) {
    playerTarget[team][index] = { x: pos.x, y: pos.y };
  }

  async function approach(team, index, target, maxTime) {
    moveTo(team, index, target);
    var t0 = await raf();
    var dur = (maxTime || 1.2) * 1000 * SPEED_BASE;
    while (true) {
      var t = await raf();
      draw();
      var p = playerPos[team][index];
      if (Math.abs(p.x - target.x) < 5 && Math.abs(p.y - target.y) < 5) break;
      if (t - t0 >= dur) break;
    }
  }

  function setReceiveFormation(team) {
    for (var i = 0; i < teams[team].length; i++) {
      var p = teams[team][i];
      var zone = ROTATION_ORDER[p.zoneIndex];
      var base = zoneBasePos(team, zone);
      var t = { x: base.x, y: base.y };
      if (p.role === 'setter') {
        t.y = base.y + (team === 0 ? 52 : -52);
      } else if (zone === 5) {
        t.x = base.x - 26;
        t.y = base.y + (team === 0 ? 22 : -22);
      } else if (zone === 1) {
        t.x = base.x + 26;
        t.y = base.y + (team === 0 ? 22 : -22);
      } else if (zone === 6) {
        t.y = base.y + (team === 0 ? 34 : -34);
      } else if (zone === 4) {
        t.x = base.x - 12;
        t.y = base.y + (team === 0 ? 14 : -14);
      } else if (zone === 2) {
        t.x = base.x + 12;
        t.y = base.y + (team === 0 ? 14 : -14);
      }
      playerTarget[team][i] = t;
    }
  }

  function setDefenseReady(team) {
    for (var i = 0; i < teams[team].length; i++) {
      var p = teams[team][i];
      moveTo(team, i, roleSpot(team, p.role, 'defense'));
    }
  }

  function roleSpot(team, role, state) {
    var base;
    var x, y;
    if (role === 'setter') {
      x = team === 0 ? COURT.x + COURT.w - 95 : COURT.x + 95;
      y = COURT.netY + (team === 0 ? 34 : -34);
    } else if (role === 'outside') {
      x = team === 0 ? COURT.x + 45 : COURT.x + COURT.w - 45;
      y = state === 'defense' ? COURT.netY + (team === 0 ? 130 : -130) : COURT.netY + (team === 0 ? 60 : -60);
    } else if (role === 'opposite') {
      x = team === 0 ? COURT.x + COURT.w - 45 : COURT.x + 45;
      y = state === 'defense' ? COURT.netY + (team === 0 ? 130 : -130) : COURT.netY + (team === 0 ? 60 : -60);
    } else if (role === 'middle') {
      x = COURT.x + COURT.w / 2;
      y = state === 'defense' ? COURT.netY + (team === 0 ? 40 : -40) : COURT.netY + (team === 0 ? 52 : -52);
    } else {
      x = COURT.x + COURT.w / 2;
      y = COURT.netY + (team === 0 ? 140 : -140);
    }
    base = { x: x, y: y };
    return base;
  }

  function setOffenseFormation(team, setZone) {
    var roles = ['setter', 'outside', 'middle', 'opposite', 'middle', 'libero'];
    for (var i = 0; i < teams[team].length; i++) {
      var p = teams[team][i];
      var spot = roleSpot(team, p.role, 'offense');
      moveTo(team, i, spot);
    }
    var attacker = playerByRole(team, roleForZone(setZone));
    moveTo(team, playerIndex(team, attacker), attackSpot(team, setZone));
  }

  function setDefenseFormation(team, hitZone) {
    for (var i = 0; i < teams[team].length; i++) {
      var p = teams[team][i];
      var spot = roleSpot(team, p.role, 'defense');
      moveTo(team, i, spot);
      if (p.role === 'middle') setJump(team, i);
    }
    var libero = playerByRole(team, 'libero');
    moveTo(team, playerIndex(team, libero), zoneBasePos(team, hitZone));
    setJump(team, playerIndex(team, libero));
  }

  function playerInZone(team, zone) {
    for (var i = 0; i < teams[team].length; i++) {
      if (ROTATION_ORDER[teams[team][i].zoneIndex] === zone) return teams[team][i];
    }
    return null;
  }

  function setterPlayer(team) {
    for (var i = 0; i < teams[team].length; i++) {
      if (teams[team][i].role === 'setter') return teams[team][i];
    }
    return teams[team][0];
  }

  function playerByRole(team, role) {
    for (var i = 0; i < teams[team].length; i++) {
      if (teams[team][i].role === role) return teams[team][i];
    }
    return teams[team][0];
  }

  function playerRole() {
    if (career.position === 'punta') return 'outside';
    if (career.position === 'opuesto') return 'opposite';
    if (career.position === 'central') return 'middle';
    if (career.position === 'libero') return 'libero';
    return 'setter';
  }

  function roleForZone(zone) {
    return zone === 4 ? 'outside' : 'opposite';
  }

  function isMyAttack(attacking, setZone) {
    if (attacking !== 0 || career.suspended || career.benched) return false;
    if (career.position === 'punta' || career.position === 'opuesto') {
      return roleForZone(setZone) === playerRole();
    }
    return false;
  }

  function attackSpot(team, zone) {
    if (zone === 6) {
      return { x: zoneBasePos(team, 6).x, y: team === 0 ? COURT.netY + 130 : COURT.netY - 130 };
    }
    return { x: zoneBasePos(team, zone).x, y: zoneBasePos(team, zone).y + (team === 0 ? -34 : 34) };
  }

  function serverPlayer(team) {
    return playerInZone(team, 1);
  }

  function playerIndex(team, player) {
    return teams[team].indexOf(player);
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    var cw = court.clientWidth;
    var ch = court.clientHeight;
    court.width = Math.max(1, Math.round(cw * dpr));
    court.height = Math.max(1, Math.round(ch * dpr));
    scale = Math.min(cw / W, ch / H);
    offsetX = (cw - W * scale) / 2;
    offsetY = (ch - H * scale) / 2;
  }

  function draw() {
    stepPlayerMovement();
    stepImpacts();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0f1218';
    ctx.fillRect(0, 0, court.clientWidth, court.clientHeight);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);

    ctx.fillStyle = '#17202e';
    ctx.fillRect(COURT.x, COURT.y, COURT.w, COURT.h);
    ctx.strokeStyle = '#3d4657';
    ctx.lineWidth = 2;
    ctx.strokeRect(COURT.x, COURT.y, COURT.w, COURT.h);
    ctx.beginPath();
    ctx.moveTo(COURT.x, COURT.netY);
    ctx.lineTo(COURT.x + COURT.w, COURT.netY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(COURT.x + COURT.w / 2, COURT.y);
    ctx.lineTo(COURT.x + COURT.w / 2, COURT.netY);
    ctx.moveTo(COURT.x + COURT.w / 2, COURT.netY);
    ctx.lineTo(COURT.x + COURT.w / 2, COURT.y + COURT.h);
    ctx.stroke();

    drawTeam(1, '#4a8fe0', false);
    drawTeam(0, '#e0c34a', true);

    var ballScale = 1 + 0.4 * ((ball.h || 0) / (ball.maxH || 1));

    // sombra en el suelo (se achica con la altura)
    var shadowScale = 1 - 0.6 * ((ball.h || 0) / (ball.maxH || 1));
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + (ball.h || 0), 10 * shadowScale, 4.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // estela
    for (var tr = 0; tr < ballTrail.length; tr++) {
      var tp = ballTrail[tr];
      var f = tr / ballTrail.length;
      ctx.globalAlpha = f * 0.35;
      ctx.fillStyle = '#f2f4f8';
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 6 * f, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    var br = Math.max(5, 9 * ballScale);
    ctx.fillStyle = '#f2f4f8';
    ctx.shadowColor = '#f2f4f8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // giro: una marca que rota
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rot);
    ctx.fillStyle = 'rgba(255,209,102,0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, br * 0.42, 0.6, 2.2);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();

    drawImpacts();
    drawFeedback();

    if (label) {
      ctx.globalAlpha = Math.min(1, label.life * 2);
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, W / 2, COURT.y - 40);
      ctx.globalAlpha = 1;
    }
  }

  function stepPlayerMovement() {
    simTime++;
    var step = PLAYER_MOVE_SPEED / 60;
    for (var key = 0; key < 2; key++) {
      for (var i = 0; i < playerPos[key].length; i++) {
        var cur = playerPos[key][i];
        var tgt = playerTarget[key][i];
        var dx = tgt.x - cur.x;
        var dy = tgt.y - cur.y;
        var dist = Math.hypot(dx, dy);
        if (dist > 2) {
          cur.x += (dx / dist) * Math.min(step, dist);
          cur.y += (dy / dist) * Math.min(step, dist);
        }
        if (playerJump[key][i] > 0) playerJump[key][i] = Math.max(0, playerJump[key][i] - 0.07);
      }
    }
  }

  function ballReact(team, index) {
    if (!match || !ball || !teams[team]) return { x: 0, y: 0 };
    var p = playerPos[team][index];
    var z = ROTATION_ORDER[teams[team][index].zoneIndex];
    var xl = (z === 5 || z === 6 || z === 1) ? 16 : 11;
    var yl = (z === 5 || z === 6 || z === 1) ? 10 : 6;
    var bx = Math.max(-xl, Math.min(xl, (ball.x - p.x) * 0.05));
    var by = Math.max(-yl, Math.min(yl, (ball.y - p.y) * 0.02));
    return { x: bx, y: by };
  }

  function setJump(team, index) {
    if (playerJump[team]) playerJump[team][index] = 1;
  }

  function addImpact(x, y) {
    impacts.push({ x: x, y: y, life: 1 });
  }

  function stepImpacts() {
    for (var i = impacts.length - 1; i >= 0; i--) {
      impacts[i].life -= 0.025;
      if (impacts[i].life <= 0) impacts.splice(i, 1);
    }
    if (pointBanner) {
      pointBanner.life -= 0.02;
      if (pointBanner.life <= 0) pointBanner = null;
    }
    if (screenFlash) {
      screenFlash.life -= 0.05;
      if (screenFlash.life <= 0) screenFlash = null;
    }
    if (serveRing) {
      serveRing.life -= 0.03;
      if (serveRing.life <= 0) serveRing = null;
    }
  }

  function drawFeedback() {
    if (screenFlash) {
      ctx.globalAlpha = screenFlash.life * 0.22;
      ctx.fillStyle = screenFlash.color;
      ctx.fillRect(COURT.x, COURT.y, COURT.w, COURT.h);
      ctx.globalAlpha = 1;
    }
    if (serveRing) {
      var sp = playerPos[serveRing.team][serveRing.index];
      ctx.globalAlpha = serveRing.life;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y - 10, 18 + (1 - serveRing.life) * 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (pointBanner) {
      ctx.globalAlpha = Math.min(1, pointBanner.life * 1.6);
      ctx.font = '800 38px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = pointBanner.color;
      ctx.fillText(pointBanner.text, W / 2, COURT.y + COURT.h / 2);
      ctx.globalAlpha = 1;
    }
  }

  function drawImpacts() {
    for (var i = 0; i < impacts.length; i++) {
      var imp = impacts[i];
      ctx.globalAlpha = imp.life;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      var s = 16;
      ctx.beginPath();
      ctx.moveTo(imp.x - s, imp.y - s);
      ctx.lineTo(imp.x + s, imp.y + s);
      ctx.moveTo(imp.x + s, imp.y - s);
      ctx.lineTo(imp.x - s, imp.y + s);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(imp.x, imp.y, 6 + (1 - imp.life) * 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawTeam(team, color, highlightPlayer) {
    var players = playerPos[team];
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      var jump = playerJump[team][i] || 0;
      var ph = playerPhase[team][i];
      var swayX = Math.sin(simTime * 0.05 + ph) * 1.2;
      var swayY = Math.cos(simTime * 0.04 + ph * 1.3) * 1.2;
      var react = ballReact(team, i);
      var drawX = p.x + swayX + react.x;
      var drawY = p.y + swayY - jump * 22 + react.y;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(drawX, drawY, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (jump > 0.1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(drawX, p.y + swayY, 13, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(teams[team][i].number), drawX, drawY + 1);
      ctx.textBaseline = 'alphabetic';
      if (highlightPlayer && i === 0) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 17, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // ---------- rAF helpers ----------

  function raf() {
    return new Promise(function (resolve) {
      requestAnimationFrame(resolve);
    });
  }

  async function sleep(seconds) {
    var t0 = await raf();
    var dur = (seconds * SPEED_BASE) * 1000;
    while (true) {
      var t = await raf();
      draw();
      if (t - t0 >= dur) break;
    }
  }

  async function playSegment(script) {
    var from = script.from;
    var to = script.to;
    var seconds = script.seconds || 0.5;
    var overNet = script.overNet;
    var arc = overNet ? 130 : Math.abs(to.y - from.y) > 120 ? 90 : 30;
    var t0 = await raf();
    var dur = ((seconds * SPEED_BASE) / thisSpeed) * 1000;
    while (true) {
      var t = await raf();
      var p = Math.min(1, (t - t0) / dur);
      var arcOffset = Math.sin(Math.PI * p) * arc;
      ball.x = from.x + (to.x - from.x) * p;
      ball.y = from.y + (to.y - from.y) * p - arcOffset;
      ball.h = arcOffset;
      ball.maxH = arc;
      ball.rot += 0.12 + Math.hypot(to.x - from.x, to.y - from.y) / 5000;
      ballTrail.push({ x: ball.x, y: ball.y, a: 1 });
      if (ballTrail.length > 8) ballTrail.shift();
      draw();
      if (p >= 1) break;
    }
    ball.h = 0;
    ballTrail.length = 0;
    ballNow = { x: to.x, y: to.y };
  }

  function resetPlayerPositions() {
    setFormationTargets();
  }

  function zoneSpot(team) {
    return {
      x: COURT.x + 50 + Math.random() * (COURT.w - 100),
      y: team === 0 ? COURT.netY + 70 + Math.random() * 150 : COURT.netY - 70 - Math.random() * 150,
    };
  }

  function playerStat(team, player, stat) {
    if (team === 0) {
      if (player.isPlayer) {
        return career.suspended ? suspendedStat(stat) : career.stats[stat];
      }
      return TEAMMATE[stat];
    }
    return match.rival.stats[stat];
  }

  function thePlayer() {
    return teams[0][0];
  }

  function defZoneMod(zone) {
    return zone === 1 || zone === 5 ? -1 : zone === 3 ? -0.5 : 0;
  }

  function setLabel(text, color) {
    label = { text: text, color: color, life: 1 };
  }

  async function showLabel(text, color, seconds) {
    setLabel(text, color);
    await sleep(seconds);
    label = null;
  }

  // ---------- Match state ----------

  var match = null;

  function newMatch(rival) {
    match = {
      rival: rival,
      scores: [0, 0],
      totalPoints: [0, 0],
      setsWon: [0, 0],
      setIndex: 0,
      server: Math.random() < 0.5 ? 0 : 1,
      over: false,
      rallyTouches: [0, 0],
    };
    initTeams();
    return match;
  }

  // ---------- League ----------

  function leagueClubs() {
    return window.VAV.clubs.slice(LEAGUE_SIZE, LEAGUE_SIZE * 2);
  }

  function myDivision() {
    return career.clubs[career.clubIdx].division;
  }

  function countryLevel(c) {
    return c === 'espana' ? 2 : c === 'italia' ? 3 : 1;
  }

  function nextCountry(c) {
    return c === 'argentina' ? 'espana' : c === 'espana' ? 'italia' : null;
  }

  function initClubs() {
    var lvl = countryLevel(career.country);
    career.clubs = window.VAV.clubs.map(function (name, i) {
      var a = i < LEAGUE_SIZE;
      return {
        name: name,
        power: (a ? 4 + Math.random() * 3 : 2.5 + Math.random() * 2.5) + (lvl - 1) * 1.5,
        division: a ? 'A' : 'B',
      };
    });
  }

  function moveToCountry(next) {
    career.country = next;
    initClubs();
    career.clubs[career.clubIdx].division = 'B';
    var aCount = 0;
    for (var i = 0; i < career.clubs.length; i++) {
      if (career.clubs[i].division === 'A') aCount++;
    }
    if (aCount > LEAGUE_SIZE) {
      var weakest = -1;
      for (var j = 0; j < career.clubs.length; j++) {
        if (career.clubs[j].division !== 'A') continue;
        if (weakest === -1 || career.clubs[j].power < career.clubs[weakest].power) weakest = j;
      }
      career.clubs[weakest].division = 'B';
    } else if (aCount < LEAGUE_SIZE) {
      var strongest = -1;
      for (var k = 0; k < career.clubs.length; k++) {
        if (career.clubs[k].division !== 'B') continue;
        if (strongest === -1 || career.clubs[k].power > career.clubs[strongest].power) strongest = k;
      }
      career.clubs[strongest].division = 'A';
    }
  }

  function myLocalIdx() {
    if (!career.divisionIndices) return 0;
    var idx = career.divisionIndices.indexOf(career.clubIdx);
    return idx === -1 ? 0 : idx;
  }

  function initClubs() {
    career.clubs = window.VAV.clubs.map(function (name, i) {
      var a = i < LEAGUE_SIZE;
      return {
        name: name,
        power: a ? 4 + Math.random() * 3 : 2.5 + Math.random() * 2.5,
        division: a ? 'A' : 'B',
      };
    });
  }

  function clubStats(power) {
    return { S: power, A: power + 1, R: power, B: power, D: power };
  }

  function powerWinP(a, b) {
    return Math.max(0.12, Math.min(0.88, 0.5 + (a - b) * 0.09));
  }

  function simulateMatchScore(powerA, powerB) {
    var setsA = 0;
    var setsB = 0;
    while (setsA < 2 && setsB < 2) {
      if (Math.random() < powerWinP(powerA, powerB)) setsA++;
      else setsB++;
    }
    return { setsA: setsA, setsB: setsB, win: setsA > setsB };
  }

  function teamPower(team) {
    if (team === 0) {
      var sum = 0;
      for (var i = 0; i < STATS.length; i++) {
        var v = career.benched ? TEAM_BASE[STATS[i]] : teamPhaseStat(0, STATS[i]);
        sum += v;
      }
      return sum / STATS.length;
    }
    return 5;
  }

  function dtBenched() {
    var chance = 0.4 - career.form * 0.04;
    if (career.age >= 30) chance += 0.12;
    if (career.age <= 23) chance -= 0.05;
    return Math.random() < Math.max(0.05, Math.min(0.6, chance));
  }

  function buildSchedule() {
    var n = LEAGUE_SIZE;
    var arr = [];
    for (var i = 0; i < n - 1; i++) arr.push(i);
    var fixed = n - 1;
    var rounds = [];
    for (var r = 0; r < n - 1; r++) {
      var pairs = [[arr[0], fixed]];
      for (var j = 1; j < arr.length / 2; j++) {
        pairs.push([arr[j], arr[arr.length - j]]);
      }
      rounds.push(pairs);
      arr = [arr[arr.length - 1]].concat(arr.slice(0, arr.length - 1));
    }
    var returnLeg = rounds.map(function (rd) {
      return rd.map(function (p) { return [p[1], p[0]]; });
    });
    return rounds.concat(returnLeg);
  }

  function initLeague() {
    if (!career.clubs) initClubs();
    var myDiv = myDivision();
    var indices = [];
    for (var i = 0; i < career.clubs.length; i++) {
      if (career.clubs[i].division === myDiv) indices.push(i);
    }
    career.divisionIndices = indices;
    career.schedule = buildSchedule();
    career.standings = indices.map(function (gi) {
      return { name: career.clubs[gi].name, power: career.clubs[gi].power, played: 0, won: 0, lost: 0, sw: 0, sl: 0, pts: 0 };
    });
    career.week = 0;
    career.seasonStats = { points: 0 };
  }

  function applyStandings(clubIdx, sw, sl) {
    var local = career.divisionIndices.indexOf(clubIdx);
    if (local === -1) return;
    var s = career.standings[local];
    s.played++;
    s.sw += sw;
    s.sl += sl;
    var won = sw > sl;
    if (won) s.won++;
    else s.lost++;
    s.pts += won ? 3 : 0;
  }

  function currentOpponent() {
    var me = myLocalIdx();
    var pairs = career.schedule && career.schedule[career.week];
    if (!pairs) return career.clubs[career.divisionIndices[(me + 1) % LEAGUE_SIZE]];
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i][0] === me) return career.clubs[career.divisionIndices[pairs[i][1]]];
      if (pairs[i][1] === me) return career.clubs[career.divisionIndices[pairs[i][0]]];
    }
    return career.clubs[career.divisionIndices[(me + 1) % LEAGUE_SIZE]];
  }

  function resolveOtherMatches() {
    var me = myLocalIdx();
    var pairs = career.schedule[career.week];
    for (var i = 0; i < pairs.length; i++) {
      var a = pairs[i][0];
      var b = pairs[i][1];
      if (a === me || b === me) continue;
      var ca = career.clubs[career.divisionIndices[a]];
      var cb = career.clubs[career.divisionIndices[b]];
      var r = simulateMatchScore(ca.power, cb.power);
      applyStandings(career.divisionIndices[a], r.setsA, r.setsB);
      applyStandings(career.divisionIndices[b], r.setsB, r.setsA);
    }
  }

  function promoteClub() {
    var weakest = -1;
    for (var i = 0; i < career.clubs.length; i++) {
      if (career.clubs[i].division !== 'A') continue;
      if (weakest === -1 || career.clubs[i].power < career.clubs[weakest].power) weakest = i;
    }
    career.clubs[career.clubIdx].division = 'A';
    career.clubs[weakest].division = 'B';
  }

  function relegateClub() {
    var strongest = -1;
    for (var i = 0; i < career.clubs.length; i++) {
      if (career.clubs[i].division !== 'B') continue;
      if (strongest === -1 || career.clubs[i].power > career.clubs[strongest].power) strongest = i;
    }
    career.clubs[career.clubIdx].division = 'B';
    career.clubs[strongest].division = 'A';
  }

  // ---------- Phase resolution ----------

  function autoPhase(attackerStat, defenderStat) {
    var diff = attackerStat - defenderStat;
    var p = Math.max(0.08, Math.min(0.9, 0.4 + diff * 0.08 + (Math.random() - 0.5) * 0.3));
    return Math.random() < p;
  }

  function teamPhaseStat(team, stat) {
    if (team === 0) {
      var pStat = career.suspended || career.injured ? suspendedStat(stat) : career.stats[stat];
      var combined = (TEAM_BASE[stat] + pStat) / 2;
      return Math.max(1, Math.min(10, Math.round(combined)));
    }
    return match.rival.stats[stat];
  }

  function isPlayerTurn(phase) {
    if (career.suspended || career.benched) return false;
    if (career.position === 'punta') return phase === 'receive' || phase === 'attack';
    if (career.position === 'armador') return phase === 'set';
    if (career.position === 'opuesto') return phase === 'attack';
    if (career.position === 'central') return phase === 'defend';
    return phase === 'receive';
  }

  function suspendedStat(stat) {
    return Math.max(1, career.stats[stat] - 2);
  }

  function isMyTurn(team, phase) {
    return team === 0 && isPlayerTurn(phase);
  }

  function pickReason(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function reasonKey(reason) {
    return 'reason' + reason.charAt(0).toUpperCase() + reason.slice(1);
  }

  function reasonBannerText(reason) {
    var txt = t(reasonKey(reason));
    return '¡' + txt.charAt(0).toUpperCase() + txt.slice(1) + '!';
  }

  async function doServe(attacking, defender) {
    match.rallyTouches[attacking]++;
    var server = serverPlayer(attacking);
    var sidx = playerIndex(attacking, server);
    var base = zoneBasePos(attacking, ROTATION_ORDER[server.zoneIndex]);
    var from = { x: base.x, y: attacking === 0 ? COURT.y + COURT.h + 26 : COURT.y - 26 };
    moveTo(attacking, sidx, from);
    pointBanner = { text: t('serveBy').replace('{name}', pName(attacking, server)), color: '#ffd166', life: 1 };
    serveRing = { team: attacking, index: sidx, life: 1 };
    await sleep(1.5);
    serveRing = null;
    var sStat = playerStat(attacking, server, 'S');
    var ok = Math.random() < Math.max(0.5, Math.min(0.92, 0.75 + (sStat - teamPhaseStat(defender, 'R')) * 0.04));
    var reason = null;
    var to;
    if (ok) {
      to = zoneSpot(defender);
    } else {
      reason = pickReason(['net', 'out', 'foot']);
      if (reason === 'net') {
        to = { x: from.x + (Math.random() * 60 - 30), y: COURT.netY + 6 };
      } else if (reason === 'out') {
        to = { x: COURT.x + 60 + Math.random() * (COURT.w - 120), y: attacking === 0 ? COURT.y - 30 : COURT.y + COURT.h + 30 };
      } else {
        to = { x: from.x, y: from.y + (attacking === 0 ? 20 : -20) };
      }
    }
    await playSegment({ from: from, to: to, seconds: reason === 'foot' ? 0.3 : 0.7, overNet: !reason || reason === 'out' });
    comment(t('serveBy').replace('{name}', pName(attacking, server)));
    if (!ok) {
      comment(t('serveError').replace('{name}', pName(attacking, server)).replace('{reason}', t(reasonKey(reason))));
      pointBanner = { text: reasonBannerText(reason), color: '#e0503f', life: 1 };
      await sleep(1.0);
    }
    return { ok: ok, quality: sStat };
  }

  async function doReceive(attacking, defender, incoming) {
    match.rallyTouches[attacking]++;
    var isMy = isMyTurn(attacking, 'receive');
    var receiver = playerInZone(attacking, 6);
    var ridx = playerIndex(attacking, receiver);
    var setter = setterPlayer(attacking);
    var sidx = playerIndex(attacking, setter);
    var from = ballNow;
    var to = playerPos[attacking][sidx];
    setReceiveFormation(attacking);
    moveTo(attacking, isMy ? 0 : ridx, { x: from.x, y: from.y });
    var decision = null;
    var quality = 0;
    if (isMy) {
      await approach(attacking, isMy ? 0 : ridx, from, 2);
      await showLabel(t('decisionPhase'), '#ffd166', 0.6);
      decision = await askDecision('receive');
      quality = await runMinigame(playerStat(attacking, thePlayer(), 'R') + (decision.diff || 0));
      await showLabel(resultLabel(quality), resultColor(quality), 0.8);
    }
    await playSegment({
      from: from,
      to: to,
      seconds: 0.5,
    });
    var ok;
    var direct = false;
    if (isMy) {
      ok = quality >= decision.threshold;
      direct = decision.directOnPerfect && quality === 3;
      comment(t('receivePlayer').replace('{result}', resultLabel(quality)));
    } else {
      ok = autoPhase(playerStat(attacking, receiver, 'R'), incoming);
      if (ok) {
        comment(t('receiveOk').replace('{name}', pName(attacking, receiver)));
      } else {
        var rReason = pickReason(['out', 'floor', 'net']);
        comment(t('receiveFail').replace('{name}', pName(attacking, receiver)).replace('{reason}', t(reasonKey(rReason))).replace('{team}', teamName(defender)));
        pointBanner = { text: reasonBannerText(rReason), color: '#e0503f', life: 1 };
        await sleep(1.0);
      }
    }
    return { ok: ok, direct: direct, quality: quality };
  }

  async function doSet(attacking, defender, receiveQuality) {
    match.rallyTouches[attacking]++;
    var isMy = isMyTurn(attacking, 'set');
    var setter = setterPlayer(attacking);
    var sidx = playerIndex(attacking, setter);
    var decision = null;
    var quality = 0;
    var setZone = 4;
    if (isMy) {
      await approach(attacking, isMy ? 0 : sidx, ballNow, 2);
      await showLabel(t('decisionPhase'), '#ffd166', 0.6);
      decision = await askDecision('set');
      quality = await runMinigame(playerStat(attacking, thePlayer(), 'R') + (decision.diff || 0));
      setZone = decision.zone;
      await showLabel(resultLabel(quality), resultColor(quality), 0.8);
    } else {
      var zones = [2, 4, 6];
      setZone = zones[Math.floor(Math.random() * 3)];
      quality = Math.random() < 0.85 ? 2 : 1;
    }
    var attacker = playerByRole(attacking, roleForZone(setZone));
    var aidx = playerIndex(attacking, attacker);
    var target = attackSpot(attacking, setZone);
    setOffenseFormation(attacking, setZone);
    setDefenseReady(defending);
    moveTo(attacking, isMy ? 0 : sidx, { x: ballNow.x, y: ballNow.y });
    moveTo(attacking, aidx, target);
    await playSegment({
      from: ballNow,
      to: target,
      seconds: 0.45,
    });
    var ok = isMy ? quality >= decision.threshold : true;
    var direct = isMy && decision.directOnPerfect && quality === 3;
    var setterName = isMy ? pName(attacking, thePlayer()) : pName(attacking, setter);
    if (ok) {
      comment(t('setTo').replace('{name}', setterName).replace('{zone}', setZone));
    } else {
      var sReason = pickReason(['net', 'double']);
      comment(t('setFail').replace('{name}', setterName).replace('{reason}', t(reasonKey(sReason))).replace('{team}', teamName(defender)));
      pointBanner = { text: reasonBannerText(sReason), color: '#e0503f', life: 1 };
      await sleep(1.0);
    }
    return { ok: ok, direct: direct, quality: quality, zone: setZone, attacker: attacker };
  }

  async function doAttack(attacking, defender, setQuality, setZone) {
    match.rallyTouches[attacking]++;
    var isMy = isMyAttack(attacking, setZone);
    var attacker = playerByRole(attacking, roleForZone(setZone));
    var aidx = playerIndex(attacking, attacker);
    var decision = null;
    var quality = 0;
    var hitZone = setZone === 2 ? 1 : setZone === 6 ? 6 : 5;
    if (isMy) {
      await approach(attacking, 0, attackSpot(attacking, setZone), 2);
      await showLabel(t('decisionPhase'), '#ffd166', 0.6);
      decision = await askDecision('attack');
      quality = await runMinigame(playerStat(attacking, thePlayer(), 'A') + (decision.diff || 0));
      hitZone = decision.zone;
      await showLabel(resultLabel(quality), resultColor(quality), 0.8);
    } else {
      var zones = [1, 5, 6];
      hitZone = zones[Math.floor(Math.random() * 3)];
      quality = autoPhase(playerStat(attacking, attacker, 'A') + setQuality, teamPhaseStat(defender, 'B')) ? 2 : 0;
    }
    var ok = isMy ? quality >= decision.threshold : quality > 0;
    var direct = isMy && decision.directOnPerfect && quality === 3;
    var aReason = null;
    if (!ok) aReason = pickReason(['out', 'net', 'blocked', 'invade']);
    var target;
    if (!ok && aReason === 'out') {
      target = { x: zoneBasePos(defender, hitZone).x, y: defender === 0 ? COURT.y + COURT.h + 30 : COURT.y - 30 };
    } else if (!ok && aReason === 'net') {
      target = { x: ballNow.x, y: COURT.netY + 6 };
    } else if (!ok && aReason === 'blocked') {
      target = { x: ballNow.x, y: ballNow.y + (attacking === 0 ? 50 : -50) };
    } else {
      target = { x: zoneBasePos(defender, hitZone).x, y: COURT.netY + (defender === 0 ? 24 : -24) };
    }
    setOffenseFormation(attacking, setZone);
    setDefenseReady(defending);
    moveTo(attacking, isMy ? 0 : aidx, { x: ballNow.x, y: ballNow.y });
    setJump(attacking, isMy ? 0 : aidx);
    await playSegment({
      from: ballNow,
      to: target,
      seconds: 0.5,
      overNet: !aReason || aReason === 'invade',
    });
    var attackerName = isMy ? pName(attacking, thePlayer()) : pName(attacking, attacker);
    var attackerStat = isMy ? playerStat(attacking, thePlayer(), 'A') : playerStat(attacking, attacker, 'A');
    if (!ok) {
      comment(t('attackFail').replace('{name}', attackerName).replace('{reason}', t(reasonKey(aReason))).replace('{team}', teamName(defender)));
      pointBanner = { text: reasonBannerText(aReason), color: '#e0503f', life: 1 };
      await sleep(1.0);
    } else if (isMy && decision.key === 'suelta') {
      comment(t('tipBy').replace('{name}', attackerName));
    } else {
      comment(t('attackTo').replace('{name}', attackerName).replace('{zone}', hitZone));
    }
    return { ok: ok, direct: direct, quality: quality, zone: hitZone, attackerStat: attackerStat };
  }

  function blockPower(team, bq) {
    var sum = 0;
    var hasPlayer = false;
    for (var i = 2; i <= 4; i++) {
      var p = playerInZone(team, i);
      if (!p) continue;
      if (p.isPlayer) {
        sum += career.stats.B + (bq || 0);
        hasPlayer = true;
      } else {
        sum += playerStat(team, p, 'B');
      }
    }
    if (!hasPlayer && bq !== undefined) sum += career.stats.B + bq;
    return sum;
  }

  async function doDefend(defending, attacking, hitZone, attackQuality, attackerStat) {
    match.rallyTouches[defending]++;
    var dig = playerInZone(defending, 6);
    var didx = playerIndex(defending, dig);
    var setter = setterPlayer(defending);
    var sidx = playerIndex(defending, setter);
    var from = ballNow;
    var atkPower = (attackerStat || playerStat(attacking, playerInZone(attacking, hitZone === 6 ? 3 : 4), 'A')) + attackQuality + defZoneMod(hitZone);
    var ok;
    if (isMyTurn(defending, 'defend')) {
      await approach(defending, 0, { x: zoneBasePos(defending, hitZone).x, y: COURT.netY + (defending === 0 ? 16 : -16) }, 2);
      await showLabel(t('decisionPhase'), '#ffd166', 0.6);
      var decision = await askDecision('block');
      var bq = await runMinigame(playerStat(defending, thePlayer(), 'B') + (decision.diff || 0));
      await showLabel(resultLabel(bq), resultColor(bq), 0.8);
      ok = autoPhase(blockPower(defending, bq), atkPower);
    } else {
      ok = autoPhase(blockPower(defending), atkPower);
    }
    if (ok) {
      comment(t('defendOk').replace('{name}', pName(defending, dig)));
      setDefenseFormation(defending, hitZone);
      await playSegment({
        from: from,
        to: playerPos[defending][sidx],
        seconds: 0.5,
      });
    } else {
      var dReason = pickReason(['out', 'floor', 'three']);
      comment(t('defendFail').replace('{name}', pName(defending, dig)).replace('{reason}', t(reasonKey(dReason))).replace('{team}', teamName(attacking)));
      pointBanner = { text: reasonBannerText(dReason), color: '#e0503f', life: 1 };
      await sleep(1.0);
      setDefenseFormation(defending, hitZone);
      await playSegment({
        from: from,
        to: zoneBasePos(defending, hitZone),
        seconds: 0.4,
      });
    }
    return { ok: ok };
  }

  function resultLabel(q) {
    return t(q === 3 ? 'perfect' : q === 2 ? 'good' : q === 1 ? 'ok' : 'miss');
  }

  function resultColor(q) {
    return q === 3 ? '#7ee787' : q === 2 ? '#7ee787' : q === 1 ? '#f0ad4e' : '#e0503f';
  }

  async function threeTouches(winnerTeam) {
    pointBanner = { text: reasonBannerText('three'), color: '#e0503f', life: 1 };
    await sleep(1.0);
    await scorePoint(winnerTeam);
  }

  function touchFault(team) {
    return match.rallyTouches[team] > 3;
  }

  async function playRally(server) {
    resetPlayerPositions();
    match.rallyTouches = [0, 0];
    var receiveTeam = 1 - server;
    setReceiveFormation(receiveTeam);
    setDefenseReady(server);
    var serve = await doServe(server, receiveTeam);
    if (!serve.ok) {
      await scorePoint(receiveTeam);
      return;
    }
    match.rallyTouches = [0, 0];
    var attacking = receiveTeam;
    var defending = server;
    var incoming = serve.quality;
    var firstOffense = true;
    for (var guard = 0; guard < 20; guard++) {
      if (firstOffense) {
        var receive = await doReceive(attacking, defending, incoming);
        if (touchFault(attacking)) { await threeTouches(defending); return; }
        if (!receive.ok) {
          await scorePoint(defending);
          return;
        }
        if (receive.direct) {
          await showDirectPoint();
          await scorePoint(attacking);
          return;
        }
        firstOffense = false;
      }
      var set = await doSet(attacking, defending, receive ? receive.quality : 0);
      if (touchFault(attacking)) { await threeTouches(defending); return; }
      if (!set.ok) {
        await scorePoint(defending);
        return;
      }
      if (set.direct) {
        await showDirectPoint();
        await scorePoint(attacking);
        return;
      }
      var attack = await doAttack(attacking, defending, set.quality, set.zone);
      if (touchFault(attacking)) { await threeTouches(defending); return; }
      if (!attack.ok) {
        await scorePoint(defending);
        return;
      }
      if (attack.direct) {
        await showDirectPoint();
        await scorePoint(attacking);
        return;
      }
      match.rallyTouches = [0, 0];
      var def = await doDefend(defending, attacking, attack.zone, attack.quality, attack.attackerStat);
      if (touchFault(defending)) { await threeTouches(attacking); return; }
      if (!def.ok) {
        await scorePoint(attacking);
        return;
      }
      incoming = 3;
      var tmp = attacking;
      attacking = defending;
      defending = tmp;
    }
    await scorePoint(defending);
  }
  async function showDirectPoint() {
    pointBanner = { text: t('directPoint'), color: '#ffd166', life: 1 };
    await sleep(1.0);
  }

  async function scorePoint(team) {
    if (match.server !== team) {
      rotateTeam(team);
    }
    match.scores[team]++;
    match.totalPoints[team]++;
    match.server = team;
    var who = team === 0 ? t('yourTeam') : match.rival.club;
    var color = team === 0 ? '#7ee787' : '#4a8fe0';
    comment(t('cPoint').replace('{team}', who).replace('{score}', match.scores[0] + ' - ' + match.scores[1]));
    addImpact(ballNow.x, ballNow.y);
    pointBanner = { text: t('pointFor') + ' ' + who, color: color, life: 1 };
    screenFlash = { color: color, life: 1 };
    for (var i = 0; i < 6; i++) setJump(team, i);
    hudScore.classList.remove('hud-score-pulse');
    void hudScore.offsetWidth;
    hudScore.classList.add('hud-score-pulse');
    setLabel(t('pointFor') + ' ' + who, color);
    await sleep(1.4);
    label = null;
    updateHud();
    if (match.scores[team] >= SET_TARGET && match.scores[team] - match.scores[1 - team] >= 2) {
      match.setsWon[team]++;
      match.scores = [0, 0];
      match.setIndex++;
      updateHud();
      if (match.setsWon[team] >= SETS_TO_WIN) {
        match.over = true;
        match.winner = team;
      }
    }
  }

  function updateHud() {
    hudSet.textContent = t('set') + ' ' + (match.setIndex + 1) + ' · ' + t('sets') + ' ' + match.setsWon[0] + '-' + match.setsWon[1];
    hudScore.textContent = match.scores[0] + ' - ' + match.scores[1];
  }

  function setOver() {
    var a = match.scores[0];
    var b = match.scores[1];
    return (a >= SET_TARGET || b >= SET_TARGET) && Math.abs(a - b) >= 2;
  }

  async function playSet() {
    while (!match.over && !setOver()) {
      await playRally(match.server);
    }
  }

  async function playMatch() {
    clearCommentary();
    hud.classList.remove('hidden');
    updateHud();
    while (!match.over) {
      var prevSets = match.setsWon[0];
      await playSet();
      if (match.over) break;
      if (match.setsWon[0] > prevSets) {
        await showLabel(t('youWonSet'), '#7ee787', 1);
      } else {
        await showLabel(t('youLostSet'), '#e0503f', 1);
      }
    }
    if (match.winner === 0) {
      await showLabel(t('youWonMatch'), '#7ee787', 1.4);
    } else {
      await showLabel(t('youLostMatch'), '#e0503f', 1.4);
    }
    hud.classList.add('hidden');
    await postMatch(match.winner === 0, match.setsWon[0], match.setsWon[1], match.totalPoints[0]);
  }

  // ---------- Modals ----------

  function showModal(titleText, text) {
    modalTitle.textContent = titleText;
    modalText.textContent = text || '';
    btn0.classList.remove('hidden');
    btn1.classList.remove('hidden');
    btn2.classList.remove('hidden');
    modal.classList.remove('hidden');
  }

  function hideModal() {
    modal.classList.add('hidden');
  }

  function modalButtons(config) {
    var btns = [btn0, btn1, btn2, btn3];
    for (var i = 0; i < 4; i++) {
      if (config[i]) {
        btns[i].classList.remove('hidden');
        btns[i].textContent = config[i].label;
        btns[i].className = 'btn' + (config[i].cls ? ' ' + config[i].cls : '');
        btns[i].onclick = config[i].fn;
      } else {
        btns[i].classList.add('hidden');
        btns[i].onclick = null;
      }
    }
  }

  // ---------- Decision ----------

  function decisionConfig(phase) {
    var list = DECISIONS[phase];
    return list.map(function (d) {
      return {
        key: d.key,
        label: t(d.key),
        desc: t(d.key + 'Desc'),
        threshold: d.threshold,
        directOnPerfect: d.directOnPerfect,
        zone: d.zone,
        diff: d.diff,
        setBoost: d.setBoost || 0,
        defMod: d.defMod || 0,
      };
    });
  }

  function askDecision(phase) {
    return new Promise(function (resolve) {
      showModal(t('choosePlay'), t('decisionPhase'));
      var opts = decisionConfig(phase);
      var config = opts.slice(0, 4).map(function (o) {
        return { label: o.label + ' — ' + o.desc, fn: function () { resolve(o); } };
      });
      modalButtons(config);
    }).then(function (d) {
      hideModal();
      return d;
    });
  }

  // ---------- Minigame ----------

  function zoneWidth(stat, diff) {
    return Math.max(0.08, 0.16 + stat * 0.012 + (diff || 0));
  }

  function markerSpeed(stat, diff) {
    return Math.max(0.008, 0.026 - stat * 0.0015 + (diff || 0) * 0.06);
  }

  function runMinigame(stat, diff) {
    return new Promise(function (resolve) {
      var zw = zoneWidth(stat, diff);
      mg = {
        pos: 0.1,
        dir: 1,
        speed: markerSpeed(stat, diff),
        zw: zw,
        resolved: false,
        resolve: resolve,
      };
      mgTitle.textContent = t('minigamePhase');
      mgTap.textContent = t('tapNow');
      var okW = zw + 0.18;
      var perfW = zw / 3;
      mgZoneOk.style.left = (50 - okW / 2) + '%';
      mgZoneOk.style.width = okW + '%';
      mgZoneGood.style.left = (50 - zw / 2) + '%';
      mgZoneGood.style.width = zw + '%';
      mgZonePerfect.style.left = (50 - perfW / 2) + '%';
      mgZonePerfect.style.width = perfW + '%';
      lgPerfect.textContent = t('perfect');
      lgGood.textContent = t('good');
      lgOk.textContent = t('ok');
      mgMarker.style.left = '50%';
      minigame.classList.remove('hidden');
      mgTap.onclick = function () {
        tapMinigame();
      };
      requestAnimationFrame(mgFrame);
    });
  }

  function mgFrame() {
    if (!mg || mg.resolved) return;
    mg.pos += mg.dir * mg.speed;
    if (mg.pos < 0.02 || mg.pos > 0.98) mg.dir *= -1;
    mg.pos = Math.max(0.02, Math.min(0.98, mg.pos));
    mgMarker.style.left = mg.pos * 100 + '%';
    requestAnimationFrame(mgFrame);
  }

  async function tapMinigame() {
    if (!mg || mg.resolved) return;
    mg.resolved = true;
    var delta = Math.abs(mg.pos - 0.5);
    var q;
    if (delta < mg.zw / 6) q = 3;
    else if (delta < mg.zw / 2) q = 2;
    else if (delta < mg.zw / 2 + 0.09) q = 1;
    else q = 0;
    mgTitle.textContent = resultLabel(q);
    mgTitle.style.color = resultColor(q);
    mgMarker.style.background = resultColor(q);
    mgBar.style.borderColor = resultColor(q);
    await sleep(0.8);
    minigame.classList.add('hidden');
    mgTitle.style.color = '';
    mgMarker.style.background = '#fff';
    mgBar.style.borderColor = '';
    mg.resolve(q);
    mg = null;
  }

  // ---------- Career ----------

  var career = null;
  var currentScreen = 'setup';
  var setupData = { name: '', sex: 'F', number: 7, age: 20, country: 'argentina', clubIdx: -1, position: null };

  function defaultStats(position) {
    return Object.assign({}, POSITIONS[position]);
  }

  function loadCareer() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveCareer() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(career));
    } catch (e) {
      // almacenamiento no disponible
    }
  }

  function clearCareer() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignorar
    }
  }

  function weekName(week) {
    return t('week') + ' ' + (week + 1) + '/' + SEASON_MATCHES;
  }

  // ---------- Screens ----------

  function showSetup() {
    hud.classList.add('hidden');
    var playBtn = byId('btn-play');
    if (playBtn) playBtn.onclick = null;
    currentScreen = 'setup';
    var clubsOpts = leagueClubs().map(function (c, i) {
      var global = LEAGUE_SIZE + i;
      return '<option value="' + global + '"' + (global === setupData.clubIdx ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
    var ageOpts = [18, 19, 20, 21, 22, 23].map(function (a) {
      return '<option value="' + a + '"' + (a === setupData.age ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    var countryOpts = ['argentina', 'espana', 'italia'].map(function (c) {
      return '<option value="' + c + '"' + (c === setupData.country ? ' selected' : '') + '>' + t(c) + '</option>';
    }).join('');

    screen.innerHTML =
      '<div class="screen-scroll"><div class="screen">' +
      '<h1>' + t('title') + '</h1>' +
      '<p class="subtitle">' + t('subtitle') + '</p>' +
      '<div class="card">' +
      '<div class="field"><label>' + t('nameLabel') + '</label><input type="text" id="in-name" value="' + escHtml(setupData.name) + '" placeholder="' + t('namePlaceholder') + '"/></div>' +
      '<div class="field"><label>' + t('sexLabel') + '</label><div class="choice-row">' +
      '<button id="sex-f" class="btn ' + (setupData.sex === 'F' ? 'active' : 'ghost') + '" type="button">' + t('female') + '</button>' +
      '<button id="sex-m" class="btn ' + (setupData.sex === 'M' ? 'active' : 'ghost') + '" type="button">' + t('male') + '</button>' +
      '</div></div>' +
      '<div class="field"><label>' + t('numberLabel') + '</label><input type="number" id="in-number" value="' + setupData.number + '" min="1" max="99"/></div>' +
      '<div class="field"><label>' + t('ageLabel') + '</label><select id="sel-age">' + ageOpts + '</select></div>' +
      '<div class="field"><label>' + t('countryLabel') + '</label><select id="sel-country">' + countryOpts + '</select></div>' +
      '<div class="field"><label>' + t('clubLabel') + '</label><select id="sel-club">' + clubsOpts + '</select>' +
      '<button id="btn-random-club" class="btn ghost" type="button">' + t('clubRandom') + '</button></div>' +
      '</div>' +
      '<div class="card"><h2>' + t('positionLabel') + '</h2><p class="subtitle">' + t('choosePosition') + '</p>' +
      '<div class="field"><button id="pos-punta" class="btn ' + (setupData.position === 'punta' ? 'active' : 'ghost') + '" type="button">' + t('positionPunta') + '</button><p class="subtitle">' + t('positionPuntaDesc') + '</p></div>' +
      '<div class="field"><button id="pos-armador" class="btn ' + (setupData.position === 'armador' ? 'active' : 'ghost') + '" type="button">' + t('positionArmador') + '</button><p class="subtitle">' + t('positionArmadorDesc') + '</p></div>' +
      '<div class="field"><button id="pos-opuesto" class="btn ' + (setupData.position === 'opuesto' ? 'active' : 'ghost') + '" type="button">' + t('positionOpuesto') + '</button><p class="subtitle">' + t('positionOpuestoDesc') + '</p></div>' +
      '<div class="field"><button id="pos-central" class="btn ' + (setupData.position === 'central' ? 'active' : 'ghost') + '" type="button">' + t('positionCentral') + '</button><p class="subtitle">' + t('positionCentralDesc') + '</p></div>' +
      '<div class="field"><button id="pos-libero" class="btn ' + (setupData.position === 'libero' ? 'active' : 'ghost') + '" type="button">' + t('positionLibero') + '</button><p class="subtitle">' + t('positionLiberoDesc') + '</p></div>' +
      '</div>' +
      '<button id="btn-start" class="btn" type="button" disabled>' + t('start') + '</button>' +
      '</div></div>';

    byId('sex-f').onclick = function () {
      setupData.sex = 'F';
      byId('sex-f').className = 'btn active';
      byId('sex-m').className = 'btn ghost';
    };
    byId('sex-m').onclick = function () {
      setupData.sex = 'M';
      byId('sex-m').className = 'btn active';
      byId('sex-f').className = 'btn ghost';
    };
    byId('btn-random-club').onclick = function () {
      var idx = LEAGUE_SIZE + Math.floor(Math.random() * LEAGUE_SIZE);
      byId('sel-club').value = String(idx);
      setupData.clubIdx = idx;
    };
    byId('pos-punta').onclick = function () {
      setupData.position = 'punta';
      setActivePos('punta');
      checkStart();
    };
    byId('pos-armador').onclick = function () {
      setupData.position = 'armador';
      setActivePos('armador');
      checkStart();
    };
    byId('pos-opuesto').onclick = function () {
      setupData.position = 'opuesto';
      setActivePos('opuesto');
      checkStart();
    };
    byId('pos-central').onclick = function () {
      setupData.position = 'central';
      setActivePos('central');
      checkStart();
    };
    byId('pos-libero').onclick = function () {
      setupData.position = 'libero';
      setActivePos('libero');
      checkStart();
    };

    function setActivePos(pos) {
      ['punta', 'armador', 'opuesto', 'central', 'libero'].forEach(function (p) {
        byId('pos-' + p).className = p === pos ? 'btn active' : 'btn ghost';
      });
    }
    byId('btn-start').onclick = function () {
      setupData.name = (byId('in-name').value || '').trim();
      var num = parseInt(byId('in-number').value, 10);
      if (isNaN(num) || num < 1) num = 7;
      if (num > 99) num = 99;
      setupData.number = num;
      setupData.clubIdx = parseInt(byId('sel-club').value, 10);
      if (isNaN(setupData.clubIdx)) setupData.clubIdx = LEAGUE_SIZE + Math.floor(Math.random() * LEAGUE_SIZE);
      setupData.age = parseInt(byId('sel-age').value, 10) || 20;
      setupData.country = byId('sel-country').value || 'argentina';
      var name = setupData.name || t('namePlaceholder');
      startCareer(setupData.position, name, setupData.sex, setupData.number, setupData.clubIdx, setupData.age, setupData.country);
    };

    function checkStart() {
      byId('btn-start').disabled = !setupData.position;
    }
    if (!setupData.position) checkStart();
  }

  function startCareer(position, name, sex, number, clubIdx, age, country) {
    career = {
      name: name,
      sex: sex,
      number: number,
      clubIdx: clubIdx,
      club: window.VAV.clubs[clubIdx],
      position: position,
      stats: defaultStats(position),
      age: age || 20,
      country: country || 'argentina',
      salary: 1000,
      money: 1000,
      form: 5,
      suspended: false,
      benched: false,
      benchedWeek: -1,
      injured: false,
      careerStats: { matches: 0, setsWon: 0, points: 0, titles: 0 },
      palmares: [],
      seasonPos: 0,
    };
    initClubs();
    initLeague();
    saveCareer();
    showBetween();
  }

  function statsHtml(stats) {
    return STATS.map(function (k) {
      return '<div class="stat-row"><span>' + t(STAT_LABEL[k]) + '</span><b>' + stats[k] + '</b></div>';
    }).join('');
  }

  function standingsHtml() {
    var rows = career.standings.slice().sort(function (a, b) {
      return b.pts - a.pts || (b.sw - b.sl) - (a.sw - a.sl);
    });
    return rows.map(function (s) {
      var isMe = s.name === career.club;
      return '<div class="stat-row' + (isMe ? ' is-me' : '') + '"><span>' + s.name + '</span><b>' + s.played + ' · ' + s.won + '-' + s.lost + ' · ' + s.pts + 'p</b></div>';
    }).join('');
  }

  function showBetween() {
    hud.classList.add('hidden');
    currentScreen = 'between';
    if (career.week >= SEASON_MATCHES) { seasonEnd(); return; }
    var opp = currentOpponent();
    if (career.benchedWeek !== career.week) {
      career.benched = career.suspended ? false : dtBenched();
      career.benchedWeek = career.week;
    }
    var benchNote = career.benched ? '<p class="subtitle bench-note">' + t('benched') + '</p>' : '';
    var injNote = career.injured ? '<p class="subtitle bench-note">' + t('injuredNote') + '</p>' : '';
    var content =
      '<div class="screen-scroll"><div class="screen">' +
      '<h1>' + t('title') + '</h1>' +
      '<p class="subtitle">' + t('season') + ' · ' + t(career.country) + ' · ' + t('division' + myDivision()) + ' · ' + weekName(career.week) + '</p>' +
      '<div class="card opponent-card"><p class="subtitle">' + t('nextMatch') + '</p>' +
      '<p class="club-name">' + t('vs') + ' ' + opp.name + '</p>' +
      '</div>' +
      '<div class="card"><h2>' + t('standings') + '</h2>' + standingsHtml() + '</div>' +
      '<div class="card"><h2>' + t('statsTitle') + '</h2>' + statsHtml(career.stats) +
      '<p class="subtitle">' + career.name + ' · #' + career.number + ' · ' + t(positionNameKey()) + ' · ' + career.age + ' ' + t('years') + ' · ' + t('salary') + ' ' + career.salary + '</p></div>' +
      benchNote + injNote +
      (career.benched ? '' :       '<button id="btn-play" class="btn" type="button">' + t('playMatch') + '</button>') +
      '<button id="btn-sim" class="btn ' + (career.benched ? '' : 'ghost') + '" type="button">' + t('simulate') + '</button>' +
      '<button id="btn-train" class="btn ghost" type="button">' + t('train') + ' · ' + t('money') + ' ' + career.money + '</button>' +
      '<button id="btn-career" class="btn ghost" type="button">' + t('career') + '</button>' +
      '</div></div>';
    screen.innerHTML = content;
    byId('btn-play').onclick = function () {
      if (!career) return;
      currentScreen = 'match';
      screen.innerHTML = '';
      var opp2 = currentOpponent();
      match = newMatch({ club: opp2.name, stats: clubStats(opp2.power) });
      playMatch().catch(function (e) {
        console.error('VoleyAsLife:', e);
      });
    };
    byId('btn-sim').onclick = function () {
      if (!career) return;
      simulateLeagueMatch();
    };
    byId('btn-train').onclick = function () {
      showTraining();
    };
    byId('btn-career').onclick = function () {
      showCareer();
    };
  }

  function computeSalary() {
    var sum = 0;
    for (var i = 0; i < STATS.length; i++) sum += career.stats[STATS[i]];
    var clubPower = career.clubs[career.clubIdx].power;
    var lvl = countryLevel(career.country);
    return Math.round((1000 + sum * 200) * (clubPower / 4) * (1 + (lvl - 1) * 0.6));
  }

  function trainCost(stat) {
    return 150 * (career.stats[stat] + 1);
  }

  function showTraining() {
    hud.classList.add('hidden');
    currentScreen = 'training';
    var rows = STATS.map(function (stat) {
      return '<div class="stat-row"><span>' + t(STAT_LABEL[stat]) + ' (' + career.stats[stat] + ')</span>' +
        '<button id="train-' + stat + '" class="btn ghost train-btn" type="button">' + t('trainCost') + ' ' + trainCost(stat) + '</button></div>';
    }).join('');
    screen.innerHTML =
      '<div class="screen-scroll"><div class="screen">' +
      '<h1>' + t('train') + '</h1>' +
      '<p class="subtitle">' + t('trainText') + '</p>' +
      '<p class="subtitle">' + t('money') + ': ' + career.money + '</p>' +
      '<div class="card">' + rows + '</div>' +
      '<button id="btn-train-back" class="btn" type="button">' + t('back') + '</button>' +
      '</div></div>';
    STATS.forEach(function (stat) {
      byId('train-' + stat).onclick = function () {
        var cost = trainCost(stat);
        if (career.money >= cost) {
          career.money -= cost;
          career.stats[stat] = Math.min(10, career.stats[stat] + 1);
          saveCareer();
          showTraining();
        }
      };
    });
    byId('btn-train-back').onclick = function () {
      showBetween();
    };
  }

  function showCareer() {
    hud.classList.add('hidden');
    currentScreen = 'career';
    var palmares = career.palmares.map(function (p) {
      var label = p.title === 'champion' ? t('champion') : p.title === 'subchampion' ? t('subchampion') : t('position') + ' ' + p.pos;
      var extras = (p.awards || []).map(function (a) { return t(a); }).join(' · ');
      if (extras) label += ' · ' + extras;
      return '<div class="stat-row"><span>' + t('season') + ' ' + p.season + '</span><b>' + label + '</b></div>';
    }).join('') || '<p class="subtitle">' + t('noPalmares') + '</p>';
    screen.innerHTML =
      '<div class="screen-scroll"><div class="screen">' +
      '<h1>' + t('career') + '</h1>' +
      '<div class="card"><h2>' + t('playerInfo') + '</h2>' +
      '<p class="subtitle">' + career.name + ' · #' + career.number + ' · ' + t(positionNameKey()) + '</p>' +
      '<p class="subtitle">' + t('ageLabel') + ' ' + career.age + ' · ' + t('salary') + ' ' + career.salary + ' · ' + t('money') + ' ' + career.money + '</p>' +
      '<p class="subtitle">' + career.club + ' · ' + t(career.country) + ' · ' + t('division' + myDivision()) + ' · ' + t('seasonPos') + ' ' + career.seasonPos + '</p>' +
      '</div>' +
      '<div class="card"><h2>' + t('careerStats') + '</h2>' +
      '<div class="stat-row"><span>' + t('matchesPlayed') + '</span><b>' + career.careerStats.matches + '</b></div>' +
      '<div class="stat-row"><span>' + t('setsWon') + '</span><b>' + career.careerStats.setsWon + '</b></div>' +
      '<div class="stat-row"><span>' + t('points') + '</span><b>' + career.careerStats.points + '</b></div>' +
      '<div class="stat-row"><span>' + t('titles') + '</span><b>' + career.careerStats.titles + '</b></div>' +
      '</div>' +
      '<div class="card"><h2>' + t('palmares') + '</h2>' + palmares + '</div>' +
      '<button id="btn-back" class="btn" type="button">' + t('back') + '</button>' +
      '</div></div>';
    byId('btn-back').onclick = function () {
      showBetween();
    };
  }

  // ---------- Between matches: upgrades + adversity ----------

  async function showUpgrades() {
    var options = pickRandomStats(3);
    var value = career.age <= 23 ? 2 : 1;
    return new Promise(function (resolve) {
      showModal(t('upgradeTitle'), t('upgradeText'));
      modalButtons(options.map(function (stat, i) {
        return {
          label: t(STAT_LABEL[stat]) + ' +' + value,
          fn: function () {
            career.stats[stat] = Math.min(10, career.stats[stat] + value);
            saveCareer();
            resolve();
          },
        };
      }));
    }).then(function () {
      hideModal();
    });
  }

  function pickRandomStats(n) {
    var pool = STATS.slice();
    var out = [];
    while (out.length < n && pool.length) {
      var i = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }

  async function maybeAdversity() {
    if (Math.random() >= ADVERSITY_CHANCE) return;
    var pick = Math.floor(Math.random() * 4);
    if (pick === 0) {
      await adversityMom();
    } else if (pick === 1) {
      await adversityBracelet();
    } else if (pick === 2) {
      await adversityInjury();
    } else {
      await adversityRumor();
    }
  }

  async function adversityInjury() {
    return new Promise(function (resolve) {
      showModal(t('adversityTitle'), t('injuryTitle') + ' ' + t('injuryText'));
      modalButtons([
        { label: t('injuryPlay'), fn: function () { career.injured = true; saveCareer(); resolve(); } },
        { label: t('injuryRest'), fn: function () { career.suspended = true; saveCareer(); resolve(); } },
        null,
        null,
      ]);
    }).then(function () {
      hideModal();
    });
  }

  async function adversityRumor() {
    return new Promise(function (resolve) {
      showModal(t('adversityTitle'), t('rumorTitle') + ' ' + t('rumorText'));
      modalButtons([
        { label: t('rumorDeny'), fn: function () { resolve(); } },
        { label: t('rumorUse'), fn: function () {
          var stat = STATS[Math.floor(Math.random() * STATS.length)];
          career.stats[stat] = Math.min(10, career.stats[stat] + 1);
          career.form = Math.max(0, career.form - 1);
          saveCareer();
          resolve();
        } },
        null,
        null,
      ]);
    }).then(function () {
      hideModal();
    });
  }

  async function adversityMom() {
    return new Promise(function (resolve) {
      showModal(t('adversityTitle'), t('momTitle') + ' ' + t('momText'));
      modalButtons([
        { label: t('momSupport') + ' — ' + t('momSupportDesc'), fn: function () {
          var stat = STATS[Math.floor(Math.random() * STATS.length)];
          career.stats[stat] = Math.max(1, career.stats[stat] - 2);
          saveCareer();
          resolve();
        } },
        { label: t('momDefend') + ' — ' + t('momDefendDesc'), fn: function () {
          career.suspended = true;
          saveCareer();
          resolve();
        } },
        null,
      ]);
    }).then(function () {
      hideModal();
    });
  }

  async function adversityBracelet() {
    return new Promise(function (resolve) {
      showModal(t('adversityTitle'), t('braceletTitle') + ' ' + t('braceletText'));
      modalButtons(STATS.map(function (stat, i) {
        return {
          label: t(STAT_LABEL[stat]) + ' +1',
          fn: function () {
            career.stats[stat]++;
            saveCareer();
            resolve();
          },
        };
      }));
    }).then(function () {
      hideModal();
    });
  }

  async function showSuspendedNotice() {
    await showModalPromise(t('suspended'), t('suspendedText'), [t('continueBtn')]);
  }

  function showModalPromise(titleText, text, buttonLabels) {
    return new Promise(function (resolve) {
      showModal(titleText, text);
      modalButtons(buttonLabels.map(function (label, i) {
        return { label: label, fn: function () { resolve(); } };
      }));
    }).then(function () {
      hideModal();
    });
  }

  // ---------- After match ----------

  async function simulateLeagueMatch() {
    var opp = currentOpponent();
    var result = simulateMatchScore(teamPower(0), opp.power);
    var win = result.setsA > result.setsB;
    await showModalPromise(
      t('matchResult') + ' ' + (win ? '✓' : '✗'),
      career.club + ' ' + result.setsA + '-' + result.setsB + ' ' + opp.name,
      [t('continueBtn')]
    );
    await postMatch(win, result.setsA, result.setsB, 0);
  }

  async function postMatch(win, setsWon, setsLost, points) {
    career.careerStats.matches++;
    career.careerStats.setsWon += setsWon;
    career.careerStats.points += points || 0;
    career.seasonStats.points += points || 0;
    career.form = win ? Math.min(10, career.form + 1) : Math.max(0, career.form - 1);
    career.benched = false;
    career.injured = false;
    applyStandings(career.clubIdx, setsWon, setsLost);
    saveCareer();
    if (win) {
      await showUpgrades();
    }
    await maybeAdversity();
    if (career.suspended) {
      await showSuspendedNotice();
      career.suspended = false;
    }
    resolveOtherMatches();
    career.week++;
    saveCareer();
    if (career.week >= SEASON_MATCHES) {
      await seasonEnd();
    } else {
      showBetween();
    }
  }

  function marketValue() {
    var sum = 0;
    for (var i = 0; i < STATS.length; i++) sum += career.stats[STATS[i]];
    var avg = sum / STATS.length;
    var ageFactor = career.age <= 25 ? 1.3 : career.age <= 29 ? 1 : 0.7;
    var perfFactor = 1 + Math.max(0, 3 - career.seasonPos) * 0.15;
    return avg * ageFactor * perfFactor;
  }

  function buildOffers(value) {
    var others = [];
    var myDiv = myDivision();
    for (var i = 0; i < career.clubs.length; i++) {
      if (i === career.clubIdx || career.clubs[i].division !== myDiv) continue;
      others.push(i);
    }
    for (var j = others.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = others[j];
      others[j] = others[k];
      others[k] = tmp;
    }
    var count = 2 + (Math.random() < 0.5 ? 1 : 0);
    var offers = [];
    for (var m = 0; m < count && m < others.length; m++) {
      var idx = others[m];
      var club = career.clubs[idx];
      var salary = Math.round(value * 600 * (club.power / 4) * (0.9 + Math.random() * 0.3));
      offers.push({ clubIdx: idx, name: club.name, power: club.power, salary: salary });
    }
    offers.sort(function (a, b) { return b.salary - a.salary; });
    return offers;
  }

  async function showTransfers(value) {
    var offers = buildOffers(value);
    return new Promise(function (resolve) {
      showModal(t('transfersTitle'), t('transfersText'));
      var config = offers.map(function (o) {
        return { label: o.name + ' — ' + t('salary') + ' ' + o.salary, fn: function () { resolve(o); } };
      });
      config.push({ label: t('stayAt').replace('{club}', career.club), fn: function () { resolve(null); } });
      modalButtons(config);
    }).then(function (choice) {
      hideModal();
      if (choice) {
        career.clubIdx = choice.clubIdx;
        career.club = choice.name;
        career.salary = choice.salary;
      } else {
        career.salary = computeSalary();
      }
    });
  }

  async function seasonEnd() {
    var sorted = career.standings.slice().sort(function (a, b) {
      return b.pts - a.pts || (b.sw - b.sl) - (a.sw - a.sl);
    });
    var pos = 1;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].name === career.club) { pos = i + 1; break; }
    }
    career.seasonPos = pos;
    var title = pos === 1 ? 'champion' : pos === 2 ? 'subchampion' : null;
    var awards = [];
    if (pos === 1 && Math.random() < 0.7) awards.push('mvp');
    if (career.seasonStats.points >= 12) awards.push('topScorer');
    career.palmares.push({ season: career.palmares.length + 1, pos: pos, title: title, awards: awards });
    if (title === 'champion') career.careerStats.titles++;
    var divisionMove = '';
    if (myDivision() === 'B' && pos === 1) {
      promoteClub();
      divisionMove = ' · ' + t('promoted');
    } else if (myDivision() === 'A' && pos === LEAGUE_SIZE) {
      relegateClub();
      divisionMove = ' · ' + t('relegated');
    }
    career.age++;
    if (career.age >= 30) {
      var stat = STATS[Math.floor(Math.random() * STATS.length)];
      career.stats[stat] = Math.max(1, career.stats[stat] - 1);
    }
    career.salary = computeSalary();
    career.money = (career.money || 0) + career.salary;
    saveCareer();
    await showTransfers(marketValue());
    saveCareer();
    var canMove = pos === 1 && countryLevel(career.country) < 3;
    await new Promise(function (resolve) {
      var seasonConfig = [{ label: t('nextSeason'), fn: function () { initLeague(); hideModal(); resolve(); } }];
      if (canMove) {
        seasonConfig.push({
          label: t('moveCountry').replace('{country}', t(nextCountry(career.country))),
          fn: function () {
            moveToCountry(nextCountry(career.country));
            initLeague();
            hideModal();
            resolve();
          },
        });
      }
      seasonConfig.push({ label: t('newCareer'), fn: function () { clearCareer(); career = null; hideModal(); resolve(); } });
      showModal(t('seasonEnd'), t('seasonPos').replace('{pos}', pos) + divisionMove);
      modalButtons(seasonConfig);
    }).then(function () {
      if (career) showBetween();
      else showSetup();
    });
  }

  // ---------- Boot ----------

  speedBtn.onclick = function () {
    thisSpeed = thisSpeed === 1 ? 2 : 1;
    speedBtn.textContent = '×' + thisSpeed;
  };

  window.addEventListener('resize', resize);
  window.addEventListener('storage', function (e) {
    if (e.key === window.VAV.LANG_KEY) {
      lang = window.VAV.currentLang();
      if (currentScreen === 'setup') {
        showSetup();
      } else if (currentScreen === 'between') {
        showBetween();
      } else if (currentScreen === 'career') {
        showCareer();
      } else if (currentScreen === 'training') {
        showTraining();
      }
    }
  });

  resize();
  ball.x = W / 2;
  ball.y = COURT.netY;
  draw();

  var loaded = loadCareer();
  if (loaded && loaded.schedule && loaded.divisionIndices && loaded.clubs && loaded.clubs.length === 16) {
    career = loaded;
    if (!career.careerStats) career.careerStats = { matches: 0, setsWon: 0, points: 0, titles: 0 };
    career.palmares = career.palmares || [];
    if (typeof career.form !== 'number') career.form = 5;
    if (typeof career.salary !== 'number') career.salary = 1000;
    if (typeof career.money !== 'number') career.money = 1000;
    if (!career.country) career.country = 'argentina';
    if (typeof career.seasonPos !== 'number') career.seasonPos = 0;
    if (!career.seasonStats) career.seasonStats = { points: 0 };
    if (!career.benched) career.benched = false;
    if (typeof career.benchedWeek !== 'number') career.benchedWeek = -1;
    if (!career.injured) career.injured = false;
    showBetween();
  } else {
    // carreras en formato viejo (liga única) no son compatibles: se descartan
    clearCareer();
    showSetup();
  }
})();
