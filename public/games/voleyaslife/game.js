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

  var STATS = ['S', 'A', 'R', 'B', 'D'];
  var STAT_LABEL = { S: 'saque', A: 'ataque', R: 'recepcion', B: 'bloqueo', D: 'defensa' };

  var POSITIONS = {
    punta: { S: 3, A: 5, R: 5, B: 3, D: 3 },
    armador: { S: 3, A: 3, R: 5, B: 3, D: 4 },
  };

  var TEAM_BASE = { S: 4, A: 4, R: 4, B: 4, D: 4 };
  var TEAMMATE = { S: 4, A: 4, R: 4, B: 4, D: 4 };
  var ROTATION_ORDER = [1, 6, 5, 4, 3, 2];

  var DECISIONS = {
    attack: [
      { key: 'remateFuerte', threshold: 2, directOnPerfect: true },
      { key: 'remateColocado', threshold: 1, directOnPerfect: false },
      { key: 'suelta', threshold: 3, directOnPerfect: true },
    ],
    receive: [
      { key: 'recepcionSegura', threshold: 1, directOnPerfect: false },
      { key: 'recepcionAgresiva', threshold: 2, directOnPerfect: true },
    ],
    set: [
      { key: 'paseRapido', threshold: 2, directOnPerfect: false },
      { key: 'paseOpuesto', threshold: 1, directOnPerfect: false },
      { key: 'finta', threshold: 3, directOnPerfect: true },
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
  var minigame = document.getElementById('minigame');
  var mgTitle = document.getElementById('mg-title');
  var mgBar = document.getElementById('mg-bar');
  var mgZoneOk = document.getElementById('mg-zone-ok');
  var mgZoneGood = document.getElementById('mg-zone-good');
  var mgMarker = document.getElementById('mg-marker');
  var mgTap = document.getElementById('mg-tap');

  var lang = window.VAV.currentLang();
  var dpr = 1;
  var scale = 1;
  var offsetX = 0;
  var offsetY = 0;

  var ball = { x: W / 2, y: H / 2 };
  var label = null;
  var mg = null;
  var teams = { 0: null, 1: null };
  var playerPos = { 0: [], 1: [] };
  var ballNow = { x: W / 2, y: H / 2 };

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
    return roles.map(function (role, i) {
      return { role: role, zoneIndex: i, isPlayer: isPlayerTeam && i === 0 };
    });
  }

  function initTeams() {
    teams[0] = makeLineup(true);
    teams[1] = makeLineup(false);
    for (var key = 0; key < 2; key++) {
      playerPos[key] = teams[key].map(function (p) {
        return zoneBasePos(key, ROTATION_ORDER[p.zoneIndex]);
      });
    }
    ballNow = { x: W / 2, y: COURT.netY };
  }

  function rotateTeam(team) {
    teams[team].forEach(function (p) {
      p.zoneIndex = (p.zoneIndex + 1) % 6;
    });
    playerPos[team] = teams[team].map(function (p) {
      return zoneBasePos(team, ROTATION_ORDER[p.zoneIndex]);
    });
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

    drawTeam(playerPos[1], '#4a8fe0', false);
    drawTeam(playerPos[0], '#e0c34a', true);

    ctx.fillStyle = '#f2f4f8';
    ctx.shadowColor = '#f2f4f8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (label) {
      ctx.globalAlpha = Math.min(1, label.life * 2);
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, W / 2, COURT.y - 40);
      ctx.globalAlpha = 1;
    }
  }

  function drawTeam(players, color, highlightPlayer) {
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (highlightPlayer && i === 0) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
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
    var dur = seconds * 1000;
    while (true) {
      var t = await raf();
      if (t - t0 >= dur) break;
    }
  }

  async function playSegment(from, to, seconds) {
    var t0 = await raf();
    var dur = (seconds / thisSpeed) * 1000;
    while (true) {
      var t = await raf();
      var p = Math.min(1, (t - t0) / dur);
      var arc = Math.abs(to.y - from.y) > 200 ? 110 : 30;
      ball.x = from.x + (to.x - from.x) * p;
      ball.y = from.y + (to.y - from.y) * p - Math.sin(Math.PI * p) * arc;
      draw();
      if (p >= 1) break;
    }
  }

  function setLabel(text, color) {
    label = { text: text, color: color, life: 1 };
  }

  async function showLabel(text, color, seconds) {
    setLabel(text, color);
    await sleep(seconds);
    label = null;
  }

  function courtPoint(team, index) {
    return playerPos[team][index];
  }

  function midPoint(team) {
    return team === 0 ? { x: COURT.x + COURT.w / 2, y: COURT.y + COURT.h - 40 } : { x: COURT.x + COURT.w / 2, y: COURT.y + 40 };
  }

  // ---------- Match state ----------

  var match = null;

  function newMatch(rival) {
    match = {
      rival: rival,
      scores: [0, 0],
      setsWon: [0, 0],
      setIndex: 0,
      server: Math.random() < 0.5 ? 0 : 1,
      over: false,
    };
    initTeams();
    return match;
  }

  function rivalStats(round) {
    var b = 3 + round;
    return { S: b, A: b + 1, R: b, B: b, D: b };
  }

  // ---------- Phase resolution ----------

  function autoPhase(attackerStat, defenderStat) {
    var diff = attackerStat - defenderStat;
    var p = Math.max(0.08, Math.min(0.9, 0.4 + diff * 0.08 + (Math.random() - 0.5) * 0.3));
    return Math.random() < p;
  }

  function teamPhaseStat(team, stat) {
    if (team === 0) {
      var pStat = career.suspended ? suspendedStat(stat) : career.stats[stat];
      var combined = (TEAM_BASE[stat] + pStat) / 2;
      return Math.max(1, Math.min(10, Math.round(combined)));
    }
    return match.rival.stats[stat];
  }

  function isPlayerTurn(phase) {
    if (career.suspended) return false;
    if (career.position === 'punta') return phase === 'receive' || phase === 'attack';
    return phase === 'set';
  }

  function playerTurnStat(phase) {
    if (career.position === 'punta') return phase === 'attack' ? 'A' : 'R';
    return 'R';
  }

  function suspendedStat(stat) {
    return Math.max(1, career.stats[stat] - 2);
  }

  function phaseLabel(phase) {
    var map = { serve: 'serve', receive: 'receive', set: 'setup', attack: 'attack', defend: 'block' };
    return t(map[phase]);
  }

  async function resolvePhase(phase, team, defenderTeam) {
    var stat = phase === 'serve' ? 'S' : phase === 'receive' ? 'R' : phase === 'set' ? 'R' : phase === 'attack' ? 'A' : 'D';
    var from = team === 0 ? midPoint(0) : midPoint(1);
    var to = team === 0 ? midPoint(1) : midPoint(0);

    if (team === 0 && isPlayerTurn(phase)) {
      await showLabel(t('decisionPhase'), '#ffd166', 0.7);
      var decision = await askDecision(phase);
      var statKey = playerTurnStat(phase);
      var quality = await runMinigame(career.suspended ? suspendedStat(statKey) : career.stats[statKey]);
      await showLabel(resultLabel(quality), resultColor(quality), 0.9);
      if (quality >= decision.threshold) {
        if (decision.directOnPerfect && quality === 3) {
          await showLabel(t('pointFor') + ' ' + (team === 0 ? t('yourTeam') : match.rival.club), '#7ee787', 1);
          return { success: true, direct: true };
        }
        await playSegment(from, to, 0.5);
        return { success: true, direct: false };
      }
      await playSegment(from, to, 0.5);
      return { success: false, direct: false };
    }

    await playSegment(from, to, 0.5);
    var ok;
    if (phase === 'serve') {
      var serveP = Math.max(0.5, Math.min(0.92, 0.75 + (teamPhaseStat(team, 'S') - teamPhaseStat(defenderTeam, 'R')) * 0.04));
      ok = Math.random() < serveP;
    } else if (phase === 'set') {
      ok = Math.random() < 0.85;
    } else if (phase === 'defend') {
      var bDef = teamPhaseStat(defenderTeam, 'A');
      ok = autoPhase((teamPhaseStat(team, 'B') + teamPhaseStat(team, 'D')) / 2, bDef * 0.8);
    } else {
      ok = autoPhase(teamPhaseStat(team, stat), teamPhaseStat(defenderTeam, 'R'));
    }
    if (!ok) {
      await showLabel(phase === 'serve' ? t('ace') : phase === 'defend' ? t('blockPoint') : '', '#e8eaf0', 0.8);
    }
    return { success: ok, direct: false };
  }

  function resultLabel(q) {
    return t(q === 3 ? 'perfect' : q === 2 ? 'good' : q === 1 ? 'ok' : 'miss');
  }

  function resultColor(q) {
    return q === 3 ? '#7ee787' : q === 2 ? '#7ee787' : q === 1 ? '#f0ad4e' : '#e0503f';
  }

  async function playRally(server) {
    var attacking = server;
    var defender = 1 - attacking;
    var isServe = true;
    var lastOverStat = teamPhaseStat(attacking, 'S');

    for (var guard = 0; guard < 20; guard++) {
      if (isServe) {
        var serve = await resolvePhase('serve', attacking, defender);
        if (!serve.success) {
          scorePoint(defender);
          return;
        }
        isServe = false;
      } else {
        var receive = await resolvePhase('receive', attacking, defender);
        if (!receive.success) {
          scorePoint(defender);
          return;
        }
        if (receive.direct) {
          scorePoint(attacking);
          return;
        }
        var set = await resolvePhase('set', attacking, defender);
        if (!set.success) {
          scorePoint(defender);
          return;
        }
        if (set.direct) {
          scorePoint(attacking);
          return;
        }
        var attack = await resolvePhase('attack', attacking, defender);
        if (!attack.success) {
          scorePoint(defender);
          return;
        }
        if (attack.direct) {
          scorePoint(attacking);
          return;
        }
        lastOverStat = teamPhaseStat(attacking, 'A');
      }

      var defend = await resolvePhase('defend', defender, attacking);
      if (!defend.success) {
        scorePoint(attacking);
        return;
      }
      lastOverStat = 3;
      var tmp = attacking;
      attacking = defender;
      defender = tmp;
    }
    scorePoint(defender);
  }

  function scorePoint(team) {
    if (match.server !== team) {
      rotateTeam(team);
    }
    match.scores[team]++;
    match.server = team;
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
    await afterMatch();
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
    var btns = [btn0, btn1, btn2];
    for (var i = 0; i < 3; i++) {
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
        label: t(d.key),
        desc: t(d.key + 'Desc'),
        threshold: d.threshold,
        directOnPerfect: d.directOnPerfect,
      };
    });
  }

  function askDecision(phase) {
    return new Promise(function (resolve) {
      showModal(t('choosePlay'), t('decisionPhase'));
      var opts = decisionConfig(phase);
      modalButtons([
        { label: opts[0].label + ' — ' + opts[0].desc, fn: function () { resolve(opts[0]); } },
        { label: opts[1].label + ' — ' + opts[1].desc, fn: function () { resolve(opts[1]); } },
        opts[2] ? { label: opts[2].label + ' — ' + opts[2].desc, fn: function () { resolve(opts[2]); } } : null,
      ]);
    }).then(function (d) {
      hideModal();
      return d;
    });
  }

  // ---------- Minigame ----------

  function zoneWidth(stat) {
    return 0.16 + stat * 0.012;
  }

  function markerSpeed(stat) {
    return 0.026 - stat * 0.0015;
  }

  function runMinigame(stat) {
    return new Promise(function (resolve) {
      var zw = zoneWidth(stat);
      mg = {
        pos: 0.1,
        dir: 1,
        speed: markerSpeed(stat),
        zw: zw,
        resolved: false,
        resolve: resolve,
      };
      mgTitle.textContent = t('minigamePhase');
      mgTap.textContent = t('tapNow');
      mgZoneGood.style.left = (50 - zw / 2) + '%';
      mgZoneGood.style.width = zw + '%';
      mgZoneOk.style.left = (50 - zw / 2 - 0.09) + '%';
      mgZoneOk.style.width = (zw + 0.18) + '%';
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

  function tapMinigame() {
    if (!mg || mg.resolved) return;
    mg.resolved = true;
    var delta = Math.abs(mg.pos - 0.5);
    var q;
    if (delta < mg.zw / 6) q = 3;
    else if (delta < mg.zw / 2) q = 2;
    else if (delta < mg.zw / 2 + 0.09) q = 1;
    else q = 0;
    minigame.classList.add('hidden');
    mg.resolve(q);
    mg = null;
  }

  // ---------- Career ----------

  var career = null;
  var currentScreen = 'setup';
  var setupData = { name: '', sex: 'F', number: 7, clubIdx: -1, position: null };

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

  function roundName(round) {
    return t('round' + Math.max(0, Math.min(3, round)));
  }

  function buildOpponents(playerIdx) {
    var clubs = window.VAV.clubs;
    var ids = [];
    for (var i = 0; i < 16; i++) ids.push(i);
    var round = ids.map(function (id) {
      return { id: id, stat: 3 + Math.random() * 2, isPlayer: id === playerIdx };
    });
    var opponents = [];
    for (var r = 0; r < 4; r++) {
      var winners = [];
      for (var j = 0; j < round.length; j += 2) {
        var a = round[j];
        var b = round[j + 1];
        if (a.isPlayer) {
          opponents.push(b);
          winners.push(a);
        } else if (b.isPlayer) {
          opponents.push(a);
          winners.push(b);
        } else {
          winners.push(a.stat + Math.random() * 1.5 > b.stat + Math.random() * 1.5 ? a : b);
        }
      }
      round = winners;
    }
    return opponents.map(function (o) {
      return window.VAV.clubs[o.id];
    });
  }

  // ---------- Screens ----------

  function showSetup() {
    hud.classList.add('hidden');
    var playBtn = byId('btn-play');
    if (playBtn) playBtn.onclick = null;
    currentScreen = 'setup';
    var clubsOpts = window.VAV.clubs.map(function (c, i) {
      return '<option value="' + i + '"' + (i === setupData.clubIdx ? ' selected' : '') + '>' + c + '</option>';
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
      '<div class="field"><label>' + t('clubLabel') + '</label><select id="sel-club">' + clubsOpts + '</select>' +
      '<button id="btn-random-club" class="btn ghost" type="button">' + t('clubRandom') + '</button></div>' +
      '</div>' +
      '<div class="card"><h2>' + t('positionLabel') + '</h2><p class="subtitle">' + t('choosePosition') + '</p>' +
      '<div class="field"><button id="pos-punta" class="btn ' + (setupData.position === 'punta' ? 'active' : 'ghost') + '" type="button">' + t('positionPunta') + '</button><p class="subtitle">' + t('positionPuntaDesc') + '</p></div>' +
      '<div class="field"><button id="pos-armador" class="btn ' + (setupData.position === 'armador' ? 'active' : 'ghost') + '" type="button">' + t('positionArmador') + '</button><p class="subtitle">' + t('positionArmadorDesc') + '</p></div>' +
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
      var idx = Math.floor(Math.random() * 16);
      byId('sel-club').value = String(idx);
      setupData.clubIdx = idx;
    };
    byId('pos-punta').onclick = function () {
      setupData.position = 'punta';
      byId('pos-punta').className = 'btn active';
      byId('pos-armador').className = 'btn ghost';
      checkStart();
    };
    byId('pos-armador').onclick = function () {
      setupData.position = 'armador';
      byId('pos-armador').className = 'btn active';
      byId('pos-punta').className = 'btn ghost';
      checkStart();
    };
    byId('btn-start').onclick = function () {
      setupData.name = (byId('in-name').value || '').trim();
      var num = parseInt(byId('in-number').value, 10);
      if (isNaN(num) || num < 1) num = 7;
      if (num > 99) num = 99;
      setupData.number = num;
      setupData.clubIdx = parseInt(byId('sel-club').value, 10);
      if (isNaN(setupData.clubIdx)) setupData.clubIdx = Math.floor(Math.random() * 16);
      var name = setupData.name || t('namePlaceholder');
      startCareer(setupData.position, name, setupData.sex, setupData.number, setupData.clubIdx);
    };

    function checkStart() {
      byId('btn-start').disabled = !setupData.position;
    }
    if (!setupData.position) checkStart();
  }

  function startCareer(position, name, sex, number, clubIdx) {
    career = {
      name: name,
      sex: sex,
      number: number,
      club: window.VAV.clubs[clubIdx],
      clubIdx: clubIdx,
      position: position,
      stats: defaultStats(position),
      round: 0,
      suspended: false,
      opponents: buildOpponents(clubIdx),
    };
    saveCareer();
    showBetween();
  }

  function statsHtml(stats) {
    return STATS.map(function (k) {
      return '<div class="stat-row"><span>' + t(STAT_LABEL[k]) + '</span><b>' + stats[k] + '</b></div>';
    }).join('');
  }

  function showBetween() {
    hud.classList.add('hidden');
    currentScreen = 'between';
    var rival = career.opponents[career.round];
    var content =
      '<div class="screen-scroll"><div class="screen">' +
      '<h1>' + t('title') + '</h1>' +
      '<p class="subtitle">' + t('season') + '</p>' +
      '<div class="card opponent-card"><p class="subtitle">' + roundName(career.round) + '</p>' +
      '<p class="club-name">' + t('vs') + ' ' + rival + '</p>' +
      '</div>' +
      '<div class="card"><h2>' + t('statsTitle') + '</h2>' + statsHtml(career.stats) +
      '<p class="subtitle">' + career.name + ' · #' + career.number + ' · ' + t('position' + (career.position === 'punta' ? 'Punta' : 'Armador')) + '</p></div>' +
      '<button id="btn-play" class="btn" type="button">' + t('playMatch') + '</button>' +
      '</div></div>';
    screen.innerHTML = content;
    byId('btn-play').onclick = function () {
      if (!career) return;
      currentScreen = 'match';
      screen.innerHTML = '';
      var round = career.round;
      match = newMatch({ club: career.opponents[round], stats: rivalStats(round) });
      playMatch().catch(function (e) {
        console.error('VoleyAsLife:', e);
      });
    };
  }

  // ---------- Between matches: upgrades + adversity ----------

  async function showUpgrades() {
    var options = pickRandomStats(3);
    return new Promise(function (resolve) {
      showModal(t('upgradeTitle'), t('upgradeText'));
      modalButtons(options.map(function (stat, i) {
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
    if (Math.random() < 0.5) {
      await adversityMom();
    } else {
      await adversityBracelet();
    }
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

  async function afterMatch() {
    if (match.winner === 0) {
      if (career.round === 3) {
        var clubName = career.club;
        clearCareer();
        career = null;
        await showModalPromise(t('champion'), t('championText').replace('{club}', clubName), [t('championBtn')]);
        showSetup();
      } else {
        career.round++;
        career.suspended = false;
        saveCareer();
        await showModalPromise(t('winTitle'), roundName(career.round - 1) + ' ✓', [t('continueBtn')]);
        await showUpgrades();
        await maybeAdversity();
        if (career.suspended) {
          await showSuspendedNotice();
        }
        showBetween();
      }
    } else {
      clearCareer();
      var roundTxt = roundName(career.round);
      career = null;
      await showModalPromise(t('eliminated'), t('eliminatedText').replace('{round}', roundTxt), [t('newCareer')]);
      showSetup();
    }
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
      }
    }
  });

  resize();
  ball.x = W / 2;
  ball.y = COURT.netY;
  draw();

  var loaded = loadCareer();
  if (loaded && loaded.opponents) {
    career = loaded;
    showBetween();
  } else {
    showSetup();
  }
})();
