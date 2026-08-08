(function () {
  'use strict';

  // ============ entorno ============
  var HAS_DOM = typeof document !== 'undefined' && !!document.getElementById;
  var LANG = (window.STG && STG.currentLang()) || 'es';
  function T(k) { return (window.STG && STG.t(LANG, k)) || k; }
  function TF(k) {
    var s = T(k);
    for (var i = 1; i < arguments.length; i++) s = s.replace('%s', String(arguments[i]));
    return s;
  }

  // ============ constantes ============
  var TILE = 24;
  var COLS = 19, ROWS = 19;
  var VIEW = 7;
  var FLOORS = 4;
  var WALL = 0, FLOOR = 1, STAIRS = 2;
  var SLOTS = ['weapon', 'helm', 'armor', 'boots', 'ring', 'amulet'];
  var SAVE_KEY = 'doradofundev.estigia.save';
  var META_KEY = 'doradofundev.estigia.meta';

  // animación (segundos)
  var MOVE_DUR = 0.13;
  var LUNGE_DUR = 0.11;
  var NUM_DUR = 0.7;
  var FLASH_DUR = 0.28;
  var POP_DUR = 0.45;

  // paleta por piso (pétreo, espectral, tártaro, fuego)
  var PALETTES = [
    { floor: '#332a3f', floorDark: '#241d2e', wall: '#1d1526', wallDark: '#130d1c', wallTop: '#2c2140', grime: '#0d0a14', speck: 'rgba(255,255,255,0.05)', stair: '#7fc9a6' },
    { floor: '#22303f', floorDark: '#18232f', wall: '#16202b', wallDark: '#0e1520', wallTop: '#274052', grime: '#0a0f16', speck: 'rgba(150,200,255,0.06)', stair: '#7fd0c9' },
    { floor: '#3b2420', floorDark: '#2a1917', wall: '#251210', wallDark: '#170a09', wallTop: '#47211c', grime: '#0d0605', speck: 'rgba(255,120,90,0.06)', stair: '#ff9a6b' },
    { floor: '#3d2a18', floorDark: '#2b1d10', wall: '#29170d', wallDark: '#170c06', wallTop: '#4a2c18', grime: '#0c0603', speck: 'rgba(255,170,80,0.07)', stair: '#ffb36b' },
  ];

  var STATUS_TURNS = { poison: 3, burn: 3, stun: 2 };
  var STATUS_DMG = { poison: 2, burn: 1 };

  // ============ utilidades ============
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function cheb(x0, y0, x1, y1) { return Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); }
  var uidc = 1;
  function uid() { return uidc++; }

  // ============ datos estáticos ============
  var CLASSES = {
    spartan: {
      nameKey: 'cls_spartan', descKey: 'cls_spartanDesc',
      base: { str: 8, des: 4, vit: 7, ene: 3 },
      gain: { str: 2, des: 1, vit: 2, ene: 1 },
      atkStat: 'str',
      color: '#ff6b4a',
      weapons: ['base_sword', 'base_axe', 'base_mace'],
      branches: ['power', 'phalanx', 'fury'],
    },
    mage: {
      nameKey: 'cls_mage', descKey: 'cls_mageDesc',
      base: { str: 3, des: 4, vit: 5, ene: 8 },
      gain: { str: 1, des: 1, vit: 1, ene: 2 },
      atkStat: 'ene',
      color: '#9a6bff',
      weapons: ['base_staff'],
      branches: ['fire', 'bolt', 'control'],
    },
    rogue: {
      nameKey: 'cls_rogue', descKey: 'cls_rogueDesc',
      base: { str: 4, des: 8, vit: 6, ene: 4 },
      gain: { str: 1, des: 2, vit: 1, ene: 1 },
      atkStat: 'des',
      color: '#4ae08a',
      weapons: ['base_dagger', 'base_bow'],
      branches: ['blades', 'bow', 'speed'],
    },
  };

  var BRANCHES = {
    power: { nameKey: 'br_power', order: ['slam', 'cleave', 'power'] },
    phalanx: { nameKey: 'br_phalanx', order: ['shield', 'shieldwall', 'taunt'] },
    fury: { nameKey: 'br_fury', order: ['berserk', 'warcry', 'bloodlust'] },
    fire: { nameKey: 'br_fire', order: ['firebolt', 'fireball', 'burn'] },
    bolt: { nameKey: 'br_bolt', order: ['zap', 'chain', 'storm'] },
    control: { nameKey: 'br_control', order: ['freeze', 'teleport', 'mana_well'] },
    blades: { nameKey: 'br_blades', order: ['stab', 'backstab', 'fan'] },
    bow: { nameKey: 'br_bow', order: ['arrow', 'pierce', 'multishot'] },
    speed: { nameKey: 'br_speed', order: ['dodge', 'haste', 'shadow'] },
  };

  // tipos: attack (melee), area_melee, ranged, aoe, aoe_all, buff, target, passive
  var SKILLS = {
    slam: { branch: 'power', type: 'attack', range: 1, cost: 0, mul: 1.6, crit: 0 },
    cleave: { branch: 'power', type: 'area_melee', range: 1, cost: 2, mul: 0.8 },
    power: { branch: 'power', type: 'passive', pass: 'dmg', per: 0.05 },
    shield: { branch: 'phalanx', type: 'passive', pass: 'armor', per: 1 },
    shieldwall: { branch: 'phalanx', type: 'buff', buff: 'shield', turns: 4, cost: 2 },
    taunt: { branch: 'phalanx', type: 'target', range: 4, cost: 1, effect: 'taunt', turns: 3 },
    berserk: { branch: 'fury', type: 'buff', buff: 'berserk', turns: 4, cost: 3 },
    warcry: { branch: 'fury', type: 'buff', buff: 'warcry', turns: 5, cost: 2 },
    bloodlust: { branch: 'fury', type: 'passive', pass: 'lifesteal', per: 0.04 },
    firebolt: { branch: 'fire', type: 'ranged', range: 6, cost: 2, mul: 1.3, elem: 'fire' },
    fireball: { branch: 'fire', type: 'aoe', range: 6, cost: 4, mul: 1.1, elem: 'fire', aoe: 1 },
    burn: { branch: 'fire', type: 'passive', pass: 'fire', per: 2 },
    zap: { branch: 'bolt', type: 'ranged', range: 6, cost: 2, mul: 1.2, elem: 'bolt', pierce: true },
    chain: { branch: 'bolt', type: 'ranged', range: 6, cost: 3, mul: 1.2, elem: 'bolt', chain: 3 },
    storm: { branch: 'bolt', type: 'aoe_all', range: 7, cost: 5, mul: 1.0, elem: 'bolt' },
    freeze: { branch: 'control', type: 'target', range: 4, cost: 3, effect: 'freeze' },
    teleport: { branch: 'control', type: 'target', range: 5, cost: 2, effect: 'teleport' },
    mana_well: { branch: 'control', type: 'passive', pass: 'mana', per: 2 },
    stab: { branch: 'blades', type: 'attack', range: 1, cost: 0, mul: 1.4, crit: 0.2 },
    backstab: { branch: 'blades', type: 'passive', pass: 'crit', per: 0.06 },
    fan: { branch: 'blades', type: 'aoe', range: 2, cost: 2, mul: 0.6 },
    arrow: { branch: 'bow', type: 'ranged', range: 5, cost: 0, mul: 0.9 },
    pierce: { branch: 'bow', type: 'passive', pass: 'pierce', per: 1 },
    multishot: { branch: 'bow', type: 'ranged', range: 5, cost: 3, mul: 0.6, shots: 3 },
    dodge: { branch: 'speed', type: 'passive', pass: 'dodge', per: 0.04 },
    haste: { branch: 'speed', type: 'buff', buff: 'haste', turns: 4, cost: 2 },
    shadow: { branch: 'speed', type: 'buff', buff: 'shadow', turns: 4, cost: 3 },
  };

  var UNIQUES = {
    weapon: { es: 'Espada de Aquiles', en: 'Sword of Achilles', affixes: [{ k: 'dmg', v: 0.4 }, { k: 'str', v: 6 }, { k: 'lifesteal', v: 0.06 }], base: 14 },
    armor: { es: 'Piel del León de Nemea', en: 'Pelt of the Nemean Lion', affixes: [{ k: 'hp', v: 25 }, { k: 'armor', v: 5 }, { k: 'res', v: 0.1 }] },
    boots: { es: 'Botas de Hermes', en: 'Boots of Hermes', affixes: [{ k: 'des', v: 5 }, { k: 'evasion', v: 0.08 }] },
    helm: { es: 'Yelmo de Hades', en: 'Helm of Hades', affixes: [{ k: 'vit', v: 5 }, { k: 'mana', v: 12 }] },
    ring: { es: 'Anillo de Perséfone', en: 'Ring of Persephone', affixes: [{ k: 'hp', v: 15 }, { k: 'str', v: 3 }] },
    amulet: { es: 'Amuleto de Atenea', en: 'Amulet of Athena', affixes: [{ k: 'mana', v: 15 }, { k: 'res', v: 0.12 }, { k: 'ene', v: 4 }] },
  };

  var ENEMY_TYPES = {
    shadow: { hp: 6, atk: 3, def: 0, xp: 5 },
    rat: { hp: 5, atk: 3, def: 0, xp: 4 },
    spectre: { hp: 10, atk: 4, def: 1, xp: 8 },
    harpy: { hp: 7, atk: 5, def: 0, xp: 7 },
    gorgon: { hp: 14, atk: 6, def: 2, xp: 12 },
    fury: { hp: 11, atk: 7, def: 1, xp: 11 },
    minion: { hp: 20, atk: 8, def: 3, xp: 20 },
    cerberus: { hp: 60, atk: 9, def: 4, xp: 0, boss: true },
  };

  var FLOOR_ENEMIES = [
    { types: ['shadow', 'rat'], count: 3 },
    { types: ['spectre', 'harpy'], count: 4 },
    { types: ['gorgon', 'fury'], count: 5 },
    { types: ['minion'], count: 2, boss: true },
  ];

  var AFFIXES = [
    { k: 'str', min: 1, max: 4, perFloor: 0.4, w: 10 },
    { k: 'des', min: 1, max: 4, perFloor: 0.4, w: 10 },
    { k: 'vit', min: 1, max: 4, perFloor: 0.4, w: 10 },
    { k: 'ene', min: 1, max: 4, perFloor: 0.4, w: 8 },
    { k: 'dmg', min: 5, max: 15, perFloor: 2, w: 10, frac: true },
    { k: 'fire', min: 1, max: 3, perFloor: 0.8, w: 7 },
    { k: 'ice', min: 1, max: 3, perFloor: 0.8, w: 7 },
    { k: 'bolt', min: 1, max: 3, perFloor: 0.8, w: 7 },
    { k: 'poison', min: 2, max: 4, perFloor: 0, w: 5 },
    { k: 'hp', min: 5, max: 12, perFloor: 3, w: 10 },
    { k: 'mana', min: 4, max: 10, perFloor: 2, w: 8 },
    { k: 'armor', min: 1, max: 3, perFloor: 0.5, w: 8 },
    { k: 'evasion', min: 2, max: 6, perFloor: 0, w: 5, frac: true },
    { k: 'lifesteal', min: 2, max: 6, perFloor: 0, w: 4, frac: true },
    { k: 'res', min: 3, max: 8, perFloor: 1, w: 4, frac: true },
  ];

  var BASE_NAMES = {
    base_sword: { es: 'Espada', en: 'Sword' },
    base_axe: { es: 'Hacha', en: 'Axe' },
    base_mace: { es: 'Maza', en: 'Mace' },
    base_staff: { es: 'Báculo', en: 'Staff' },
    base_dagger: { es: 'Daga', en: 'Dagger' },
    base_bow: { es: 'Arco', en: 'Bow' },
    base_helm: { es: 'Casco', en: 'Helm' },
    base_armor: { es: 'Coraza', en: 'Cuirass' },
    base_boots: { es: 'Botas', en: 'Boots' },
    base_ring: { es: 'Anillo', en: 'Ring' },
    base_amulet: { es: 'Amuleto', en: 'Amulet' },
  };

  var QUALITIES = ['q_mighty', 'q_old', 'q_sharp', 'q_ancient', 'q_blessed', 'q_twisted', 'q_glimmering', 'q_hollow', 'q_dread'];

  // ============ estado ============
  var S = null;
  var META = loadMeta();

  function freshMeta() {
    return { records: {}, collection: { uniques: [], enemies: [] }, fallen: 0 };
  }
  function loadMeta() {
    try {
      var raw = localStorage.getItem(META_KEY);
      if (raw) { var m = JSON.parse(raw); if (m && m.records) return m; }
    } catch (e) {}
    return freshMeta();
  }
  function saveMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(META)); } catch (e) {}
  }

  function logMsg(text, isNew) {
    if (!S) return;
    S.messages.push({ t: text, n: !!isNew });
    if (S.messages.length > 6) S.messages.shift();
  }

  // ============ mensajería con i18n ============
  function mKey(k) {
    var args = [k];
    for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
    logMsg(TF.apply(null, args), true);
  }

  // ============ stats derivados ============
  function skillLvl(id) { var p = S && S.player; return p && p.skills ? (p.skills[id] || 0) : 0; }

  function calcDerived(p) {
    var c = CLASSES[p.cls];
    var stats = { str: c.base.str, des: c.base.des, vit: c.base.vit, ene: c.base.ene };
    var keys = ['str', 'des', 'vit', 'ene'];
    for (var i = 0; i < keys.length; i++) {
      stats[keys[i]] += c.gain[keys[i]] * (p.level - 1) + (p.stats[keys[i]] || 0);
    }
    var dmgPct = 0, fire = 0, ice = 0, bolt = 0, hpAdd = 0, manaAdd = 0;
    var armor = 0, evasion = 0, lifesteal = 0, res = 0, crit = 0.05, pierce = 0, poison = 0;
    var eq = p.eq, inv = p.inv || [];
    var all = [];
    for (var k in eq) if (eq[k]) all.push(eq[k]);
    for (var j = 0; j < all.length; j++) {
      var it = all[j];
      if (it.base) dmgPct += 0;
      for (var a = 0; a < (it.affixes || []).length; a++) {
        var af = it.affixes[a];
        if (af.k === 'str' || af.k === 'des' || af.k === 'vit' || af.k === 'ene') stats[af.k] += af.v;
        else if (af.k === 'dmg') dmgPct += af.v;
        else if (af.k === 'fire') fire += af.v;
        else if (af.k === 'ice') ice += af.v;
        else if (af.k === 'bolt') bolt += af.v;
        else if (af.k === 'poison') poison += af.v;
        else if (af.k === 'hp') hpAdd += af.v;
        else if (af.k === 'mana') manaAdd += af.v;
        else if (af.k === 'armor') armor += af.v;
        else if (af.k === 'evasion') evasion += af.v / 100;
        else if (af.k === 'lifesteal') lifesteal += af.v / 100;
        else if (af.k === 'res') res += af.v / 100;
      }
    }
    var ps = S ? skillLvl : function () { return 0; };
    if (S && S.player && S.player.cls === p.cls) {
      dmgPct += 0.05 * ps('power');
      armor += ps('shield');
      lifesteal += 0.04 * ps('bloodlust');
      fire += 2 * ps('burn');
      manaAdd += 2 * ps('mana_well');
      crit += 0.06 * ps('backstab');
      pierce = ps('pierce');
      evasion += 0.04 * ps('dodge');
    }
    var maxHp = Math.floor(20 + stats.vit * 2) + hpAdd;
    var maxMana = Math.floor(10 + stats.ene * 2) + manaAdd;
    var atkBonus = Math.floor(stats[c.atkStat] / 2);
    var weaponDmg = 2;
    if (eq.weapon) weaponDmg = eq.weapon.base;
    var manaRegen = 1 + ps('mana_well');
    crit += stats.des * 0.004;
    evasion += 0.03 + stats.des * 0.003;
    return {
      stats: stats, maxHp: maxHp, maxMana: maxMana, atkBonus: atkBonus,
      weaponDmg: weaponDmg, dmgPct: dmgPct, fire: fire, ice: ice, bolt: bolt,
      armor: armor, evasion: evasion, lifesteal: lifesteal, res: res,
      crit: crit, pierce: pierce, manaRegen: manaRegen, poison: poison,
    };
  }

  function pMaxHp() { return calcDerived(S.player).maxHp; }
  function pMaxMana() { return calcDerived(S.player).maxMana; }

  // ============ generación de pisos ============
  function genFloor(f) {
    var map = [];
    for (var y = 0; y < ROWS; y++) { map[y] = []; for (var x = 0; x < COLS; x++) map[y][x] = WALL; }
    var rooms = [];
    var tries = 0;
    while (rooms.length < 9 && tries < 400) {
      tries++;
      var w = 3 + randInt(0, 5), h = 3 + randInt(0, 4);
      var x = randInt(1, COLS - w - 2), y = randInt(1, ROWS - h - 2);
      if (roomsOk(rooms, x, y, w, h)) rooms.push({ x: x, y: y, w: w, h: h });
    }
    if (!rooms.length) rooms.push({ x: 3, y: 3, w: 13, h: 13 });
    rooms.forEach(function (r) { carve(map, r); });
    for (var i = 1; i < rooms.length; i++) carveCor(map, roomC(rooms[i - 1]), roomC(rooms[i]));
    var start = roomC(rooms[0]);
    var stairs = roomC(rooms[rooms.length - 1]);
    if (f < 3) map[stairs.y][stairs.x] = STAIRS;
    return { map: map, start: start, stairs: stairs, rooms: rooms };
  }

  function roomsOk(rooms, x, y, w, h) {
    for (var i = 0; i < rooms.length; i++) {
      var r = rooms[i];
      if (x - 1 < r.x + r.w + 1 && x + w + 1 > r.x - 1 && y - 1 < r.y + r.h + 1 && y + h + 1 > r.y - 1) return false;
    }
    return true;
  }
  function carve(map, r) {
    for (var y = r.y; y < r.y + r.h; y++) for (var x = r.x; x < r.x + r.w; x++) map[y][x] = FLOOR;
  }
  function roomC(r) { return { x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) }; }
  function carveCor(map, a, b) {
    var x = a.x, y = a.y;
    while (x !== b.x) { map[y][x] = FLOOR; x += x < b.x ? 1 : -1; }
    while (y !== b.y) { map[y][x] = FLOOR; y += y < b.y ? 1 : -1; }
  }

  function tileAt(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return WALL;
    return S.map[y][x];
  }

  // ============ FOV / LOS ============
  function lineBlocked(x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    var err = dx + dy;
    while (true) {
      if (x0 === x1 && y0 === y1) return false;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
      if (tileAt(x0, y0) === WALL) return true;
    }
  }

  function computeVisible() {
    if (!S) return;
    var vis = {};
    var p = S.player;
    S.explored = S.explored || [];
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
      var d = Math.max(Math.abs(x - p.x), Math.abs(y - p.y));
      if (d > VIEW) continue;
      if (lineBlocked(p.x, p.y, x, y)) continue;
      vis[y * COLS + x] = 1;
      S.explored[y * COLS + x] = 1;
    }
    S.visible = vis;
  }

  // ============ ítems ============
  function randSlot() { return pick(SLOTS); }
  function rollRarity(floor) {
    var r = Math.random() * 100;
    var rare = 14 + floor * 4, magic = 30;
    if (r < 3 + floor) return 'unique';
    if (r < 3 + floor + rare) return 'rare';
    if (r < 3 + floor + rare + magic) return 'magic';
    return 'common';
  }
  function baseNameForSlot(slot) {
    var c = CLASSES[S.player.cls];
    if (slot === 'weapon') return T(pick(c.weapons));
    return T('base_' + slot);
  }
  function itemName(it) {
    if (it.uniqueName) return it.uniqueName;
    var base = baseNameForSlot(it.slot);
    if (it.rarity === 'common') return base;
    return T(pick(QUALITIES)) + ' ' + base;
  }
  function genItem(floor, slot) {
    slot = slot || randSlot();
    var r = rollRarity(floor);
    var it = { id: uid(), slot: slot, rarity: r, affixes: [], base: 3 + floor * 2 };
    if (r === 'unique') {
      var u = UNIQUES[slot];
      it.uniqueName = LANG === 'en' ? u.en : u.es;
      it.affixes = u.affixes.map(function (a) { return { k: a.k, v: a.v }; });
      if (u.base) it.base = u.base;
      if (META.collection.uniques.indexOf(slot) < 0) {
        META.collection.uniques.push(slot);
        saveMeta();
        mKey('uniqueFound', it.uniqueName);
      }
    } else {
      var n = r === 'magic' ? randInt(1, 2) : r === 'rare' ? randInt(2, 3) : 0;
      for (var i = 0; i < n; i++) it.affixes.push(genAffix(floor));
      var mul = r === 'magic' ? 1.3 : r === 'rare' ? 1.6 : 1;
      it.base = Math.max(2, Math.round(it.base * mul));
    }
    return it;
  }
  function genAffix(floor) {
    var pool = [];
    for (var i = 0; i < AFFIXES.length; i++) for (var w = 0; w < AFFIXES[i].w; w++) pool.push(AFFIXES[i]);
    var def = pick(pool);
    var v = randInt(def.min, def.max) + Math.round(floor * def.perFloor);
    if (def.frac) v = Math.max(def.min, v);
    return { k: def.k, v: v };
  }
  function affixDesc(af) {
    var v = af.k === 'dmg' || af.k === 'evasion' || af.k === 'lifesteal' || af.k === 'res' ? af.v : af.v;
    return TF('af_' + af.k, v);
  }
  function itemDesc(it) {
    var parts = [];
    if (it.slot === 'weapon') parts.push(TF('s_weaponDmg', it.base));
    for (var i = 0; i < it.affixes.length; i++) parts.push(affixDesc(it.affixes[i]));
    return parts.join(' · ');
  }

  // ============ jugador ============
  function newPlayer(cls, runMode) {
    var p = {
      cls: cls, level: 1, xp: 0,
      stats: { str: 0, des: 0, vit: 0, ene: 0 },
      statPoints: 0, skillPoints: 0,
      skills: {}, eq: {}, inv: [],
      gold: 0, hp: 0, mana: 0,
      x: 0, y: 0, buffs: {}, lastDir: { dx: 1, dy: 0 },
      kills: 0, runMode: runMode,
      poison: 0, burn: 0, frozen: 0,
    };
    p.hp = calcDerived(p).maxHp;
    p.mana = calcDerived(p).maxMana;
    var w = { id: uid(), slot: 'weapon', rarity: 'common', affixes: [], base: CLASSES[cls].atkStat === 'str' ? 4 : 3 };
    p.eq.weapon = w;
    return p;
  }

  // ============ enemigos ============
  function spawnEnemies(f) {
    var conf = FLOOR_ENEMIES[f];
    var es = [];
    var rooms = S.gen.rooms;
    var startRoom = rooms[0];
    var cand = [];
    for (var r = 0; r < rooms.length; r++) {
      if (conf.boss && r === rooms.length - 1) continue;
      var room = rooms[r];
      for (var y = room.y; y < room.y + room.h; y++) for (var x = room.x; x < room.x + room.w; x++) {
        if (S.map[y][x] === FLOOR && !(room === startRoom && x === S.gen.start.x && y === S.gen.start.y)) {
          cand.push({ x: x, y: y });
        }
      }
    }
    for (var i = cand.length - 1; i > 0; i--) { var j = randInt(0, i); var t2 = cand[i]; cand[i] = cand[j]; cand[j] = t2; }
    var ci = 0;
    function nextTile() { return ci < cand.length ? cand[ci++] : null; }
    function make(kind, x, y) {
      var t = ENEMY_TYPES[kind];
      var mult = 1 + f * 0.3;
      return {
        id: uid(), kind: kind, name: T('en_' + kind),
        x: x, y: y, hp: Math.round(t.hp * mult), maxHp: Math.round(t.hp * mult),
        atk: t.atk + f, def: t.def, xp: t.xp, boss: !!t.boss,
        frozen: 0, taunted: 0, dead: false, seen: 0,
        poison: 0, burn: 0,
      };
    }
    if (conf.boss) {
      var arena = rooms[rooms.length - 1];
      var bx = arena.x + Math.floor(arena.w / 2);
      var by = arena.y + Math.floor(arena.h / 2);
      es.push(make('cerberus', bx, by));
      for (var k = 0; k < conf.count; k++) {
        var t1 = nextTile();
        if (t1) es.push(make('minion', t1.x, t1.y));
      }
    } else {
      for (var m = 0; m < conf.count; m++) {
        var kind = pick(conf.types);
        var t3 = nextTile();
        if (t3) es.push(make(kind, t3.x, t3.y));
      }
    }
    return es;
  }

  function spawnBoss(f, arenaRoom, used) {
    var t = ENEMY_TYPES.cerberus;
    var cx = arenaRoom.x + Math.floor(arenaRoom.w / 2);
    var cy = arenaRoom.y + Math.floor(arenaRoom.h / 2);
    return {
      id: uid(), kind: 'cerberus', name: T('en_cerberus'),
      x: cx, y: cy, hp: Math.round(t.hp * (1 + f * 0.3)), maxHp: Math.round(t.hp * (1 + f * 0.3)),
      atk: t.atk + f, def: t.def, xp: t.xp, boss: true,
      frozen: 0, taunted: 0, dead: false, seen: 0, enraged: false,
    };
  }

  // ============ combate ============
  function enemyAt(x, y) {
    for (var i = 0; i < S.enemies.length; i++) {
      var e = S.enemies[i];
      if (!e.dead && e.x === x && e.y === y) return e;
    }
    return null;
  }
  function itemAt(x, y) {
    for (var i = 0; i < S.floorItems.length; i++) if (S.floorItems[i].x === x && S.floorItems[i].y === y) return S.floorItems[i];
    return null;
  }

  function pDamage(p, e, mult, extraCrit) {
    var der = calcDerived(p);
    var dmg = (der.weaponDmg + der.atkBonus) * (1 + der.dmgPct) * (mult || 1) + der.fire + der.ice + der.bolt;
    if (p.buffs.berserk > 0) dmg *= 1.4;
    if (p.buffs.warcry > 0) dmg *= 1.2;
    var crit = Math.random() < (der.crit + (extraCrit || 0));
    if (crit) dmg *= 1.5;
    dmg = Math.round(dmg);
    dmg = Math.max(1, dmg - e.def - (e.taunted > 0 ? 1 : 0));
    if (e.boss && e.enraged) dmg = Math.round(dmg * 0.8);
    if (der.fire > 0 && Math.random() < 0.4) applyStatus(e, 'burn', STATUS_TURNS.burn);
    if (der.ice > 0 && Math.random() < 0.3) applyStatus(e, 'stun', 1);
    if (der.poison > 0 && Math.random() < 0.4) applyStatus(e, 'poison', STATUS_TURNS.poison);
    return { dmg: dmg, crit: crit };
  }

  function applyStatus(target, kind, turns) {
    if (kind === 'poison') target.poison = Math.max(target.poison || 0, turns);
    else if (kind === 'burn') target.burn = Math.max(target.burn || 0, turns);
    else if (kind === 'stun') target.frozen = Math.max(target.frozen || 0, turns);
  }

  function enemyDotTick(e) {
    if (e.dead) return;
    if (e.poison > 0) { e.hp -= STATUS_DMG.poison; e.poison--; if (e.hp <= 0) { e.hp = 0; killEnemy(e); } }
    if (e.burn > 0) { e.hp -= STATUS_DMG.burn; e.burn--; if (e.hp <= 0) { e.hp = 0; killEnemy(e); } }
  }

  function playerDotTick() {
    var p = S.player;
    if (p.poison > 0) { p.hp -= STATUS_DMG.poison; p.poison--; }
    if (p.burn > 0) { p.hp -= STATUS_DMG.burn; p.burn--; }
    if (p.hp <= 0) { p.hp = 0; handleDeath(); }
  }

  function hurtEnemy(e, res) {
    if (e.dead) return;
    e.hp -= res.dmg;
    e.flash = FLASH_DUR;
    fxNumber(e.x, e.y, res.dmg, res.crit ? '#ffd24d' : '#ffe9c0', !!res.crit);
    if (res.crit) mKey('crit');
    var lif = calcDerived(S.player).lifesteal;
    if (lif > 0) S.player.hp = Math.min(pMaxHp(), S.player.hp + Math.max(1, Math.round(res.dmg * lif)));
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.dead = true;
    e.hp = 0;
    S.player.kills++;
    if (e.boss) {
      mKey('bossDead');
      handleVictory();
      return;
    }
    mKey('kill', e.name, e.xp);
    addXp(e.xp);
    var dropRoll = Math.random();
    if (dropRoll < 0.55) {
      var g = randInt(1, 3) + S.floor;
      S.player.gold += g;
    } else if (dropRoll < 0.7) {
      var it = genItem(S.floor);
      S.floorItems.push({ x: e.x, y: e.y, item: it });
    }
  }

  function addXp(a) {
    var p = S.player;
    p.xp += a;
    var need = xpNeed(p.level);
    while (p.xp >= need) {
      p.xp -= need;
      levelUp();
      need = xpNeed(p.level);
    }
  }
  function xpNeed(l) { return 12 + l * 10; }

  function levelUp() {
    var p = S.player;
    p.level++;
    p.statPoints += 5;
    p.skillPoints++;
    var c = CLASSES[p.cls];
    p.stats[c.atkStat] += 3;
    p.stats.vit += 2;
    p.hp = pMaxHp();
    p.mana = pMaxMana();
    mKey('levelUp', p.level);
    if (HAS_DOM) renderAll();
  }

  // ataque enemigo al jugador
  function enemyAttack(e) {
    var p = S.player;
    var der = calcDerived(p);
    if (Math.random() < der.evasion) { mKey('evade'); return; }
    var dmg = e.atk;
    if (p.buffs.shield > 0) dmg *= 0.5;
    if (p.buffs.berserk > 0) dmg *= 1.3;
    dmg = Math.round(dmg);
    dmg = Math.max(1, dmg - der.armor);
    if (e.kind === 'cerberus') {
      var head = randInt(0, 2);
      if (head === 0) applyStatus(p, 'poison', STATUS_TURNS.poison);
      else if (head === 1) applyStatus(p, 'burn', STATUS_TURNS.burn);
      else applyStatus(p, 'stun', STATUS_TURNS.stun);
      mKey('c_fire');
    } else {
      mKey('e_attack', e.name);
    }
    p.hp -= dmg;
    p.flash = FLASH_DUR;
    e.lunge = { tx: p.x, ty: p.y, t: 0, dur: LUNGE_DUR };
    fxNumber(p.x, p.y, dmg, '#ff7b7b', false);
    if (p.hp <= 0) { p.hp = 0; handleDeath(); }
  }

  // ============ IA de enemigos ============
  function enemySeesPlayer(e) {
    var p = S.player;
    if (p.buffs.shadow > 0) return false;
    if (cheb(e.x, e.y, p.x, p.y) > 6) return false;
    return !lineBlocked(e.x, e.y, p.x, p.y);
  }

  function enemyAct(e) {
    var p = S.player;
    if (e.dead || S.dead) return;
    if (e.frozen > 0) { e.frozen--; return; }
    if (e.taunted > 0) e.taunted--;
    if (e.kind === 'cerberus') { cerberusAct(e); return; }
    if (!enemySeesPlayer(e)) {
      if (Math.random() < 0.35) {
        var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
        var d = pick(dirs);
        var nx = e.x + d[0], ny = e.y + d[1];
        if (tileAt(nx, ny) === FLOOR && !enemyAt(nx, ny) && !(nx === p.x && ny === p.y)) { e.x = nx; e.y = ny; }
      }
      return;
    }
    var d = cheb(e.x, e.y, p.x, p.y);
    if (d === 1) { enemyAttack(e); return; }
    var best = null, bd = Infinity;
    for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      var nx = e.x + i, ny = e.y + j;
      if (tileAt(nx, ny) !== FLOOR) continue;
      if (nx === p.x && ny === p.y) { best = { x: nx, y: ny }; bd = -1; break; }
      if (enemyAt(nx, ny)) continue;
      var nd = cheb(nx, ny, p.x, p.y);
      if (nd < bd) { bd = nd; best = { x: nx, y: ny }; }
    }
    if (best) { e.x = best.x; e.y = best.y; }
  }

  function cerberusAct(e) {
    var p = S.player;
    if (e.frozen > 0) { e.frozen--; return; }
    if (e.taunted > 0) e.taunted--;
    if (cheb(e.x, e.y, p.x, p.y) > 3) {
      var nx = e.x + (p.x > e.x ? 1 : p.x < e.x ? -1 : 0);
      var ny = e.y + (p.y > e.y ? 1 : p.y < e.y ? -1 : 0);
      if (tileAt(nx, ny) === FLOOR && !enemyAt(nx, ny) && !(nx === p.x && ny === p.y)) { e.x = nx; e.y = ny; return; }
    }
    enemyAttack(e);
    if (e.hp < e.maxHp / 2 && !e.enraged) {
      e.enraged = true;
      mKey('c_enrage');
      enemyAttack(e);
    }
  }

  // ============ habilidades ============
  function learnSkill(id) {
    var p = S.player;
    var sk = SKILLS[id];
    var cur = p.skills[id] || 0;
    if (!canLearn(id)) return;
    p.skillPoints--;
    p.skills[id] = cur + 1;
    if (cur === 0) mKey('newSkill', T('sk_' + id));
    else mKey('skillUp', T('sk_' + id));
    if (sk.type === 'passive') p.hp = Math.min(pMaxHp(), p.hp);
    renderAll();
  }
  function canLearn(id) {
    var p = S.player;
    var sk = SKILLS[id];
    var order = BRANCHES[sk.branch].order;
    var idx = order.indexOf(id);
    var prev = order[idx - 1];
    var cur = p.skills[id] || 0;
    if (cur >= 3) return false;
    if (idx > 0 && !(p.skills[prev] >= 1)) return false;
    var needLevel = 1 + idx;
    if (p.level < needLevel) return false;
    return p.skillPoints > 0;
  }

  function activateSkill(id, tx, ty) {
    var p = S.player;
    var lvl = p.skills[id];
    if (!lvl) { mKey('notLearned', T('sk_' + id)); return; }
    var sk = SKILLS[id];
    if (sk.cost > 0 && p.mana < sk.cost) { mKey('notEnoughMana'); return; }
    snapshotPositions();
    var ok = false;
    if (sk.type === 'attack') {
      var e = enemyAt(tx, ty);
      if (e) { p.lunge = { tx: e.x, ty: e.y, t: 0, dur: LUNGE_DUR }; hurtEnemy(e, pDamage(p, e, sk.mul, sk.crit)); ok = true; }
      else mKey('noTarget');
    } else if (sk.type === 'area_melee') {
      var hit = false;
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        var e2 = enemyAt(p.x + i, p.y + j);
        if (e2) { p.lunge = { tx: e2.x, ty: e2.y, t: 0, dur: LUNGE_DUR }; hurtEnemy(e2, pDamage(p, e2, sk.mul, 0)); hit = true; }
      }
      if (hit) ok = true; else mKey('noTarget');
    } else if (sk.type === 'ranged') {
      if (tx === undefined) { var tg = autoTarget(sk.range); if (!tg) { mKey('noTarget'); return; } tx = tg.x; ty = tg.y; }
      if (cheb(p.x, p.y, tx, ty) > sk.range) { mKey('tooFar'); return; }
      if (lineBlocked(p.x, p.y, tx, ty)) { mKey('blocked'); return; }
      rangedHit(sk, tx, ty, p);
      ok = true;
    } else if (sk.type === 'aoe') {
      if (tx === undefined) { var tg2 = autoTarget(sk.range); if (!tg2) { mKey('noTarget'); return; } tx = tg2.x; ty = tg2.y; }
      if (cheb(p.x, p.y, tx, ty) > sk.range) { mKey('tooFar'); return; }
      if (lineBlocked(p.x, p.y, tx, ty)) { mKey('blocked'); return; }
      for (var m = 0; m < S.enemies.length; m++) {
        var e3 = S.enemies[m];
        if (!e3.dead && cheb(tx, ty, e3.x, e3.y) <= (sk.aoe || 0)) hurtEnemy(e3, pDamage(p, e3, sk.mul, 0));
      }
      ok = true;
    } else if (sk.type === 'aoe_all') {
      for (var n = 0; n < S.enemies.length; n++) {
        var e4 = S.enemies[n];
        if (!e4.dead && enemySeesPlayer(e4)) hurtEnemy(e4, pDamage(p, e4, sk.mul, 0));
      }
      ok = true;
    } else if (sk.type === 'buff') {
      p.buffs[sk.buff] = sk.turns;
      ok = true;
    } else if (sk.type === 'target') {
      if (sk.effect === 'freeze') {
        var e5 = enemyAt(tx, ty);
        if (!e5) { var tg = autoTarget(sk.range); if (tg) e5 = tg; }
        if (e5) { e5.frozen = 2; ok = true; } else mKey('noTarget');
      } else if (sk.effect === 'teleport') {
        if (tx === undefined) { mKey('sk_point'); return; }
        if (cheb(p.x, p.y, tx, ty) > sk.range) { mKey('tooFar'); return; }
        if (tileAt(tx, ty) !== FLOOR) { mKey('cantMove'); return; }
        p.x = tx; p.y = ty;
        computeVisible();
        ok = true;
      } else if (sk.effect === 'taunt') {
        var e6 = enemyAt(tx, ty);
        if (!e6) { mKey('noTarget'); return; }
        e6.taunted = sk.turns;
        ok = true;
      }
    }
    if (ok) {
      if (sk.cost > 0) p.mana -= sk.cost;
      if (sk.type === 'ranged' && sk.shots) { p.mana += 0; }
      endAction();
    }
  }

  function rangedHit(sk, tx, ty, p) {
    var targets = [];
    var pierceLvl = skillLvl('pierce');
    if (sk.pierce || pierceLvl > 0) {
      var dx = Math.sign(tx - p.x), dy = Math.sign(ty - p.y);
      var x = p.x + dx, y = p.y + dy;
      while (x >= 0 && y >= 0 && x < COLS && y < ROWS && tileAt(x, y) !== WALL) {
        var e = enemyAt(x, y);
        if (e) targets.push(e);
        x += dx; y += dy;
      }
    } else {
      var e0 = enemyAt(tx, ty);
      if (e0) targets.push(e0);
      else if (sk.elem) { hurtEnemyAtTile(tx, ty, p, sk); return; }
    }
    for (var i = 0; i < targets.length; i++) hurtEnemy(targets[i], pDamage(p, targets[i], sk.mul, 0));
    if (sk.chain) {
      var first = targets[0];
      if (first) {
        var second = nearestEnemyTo(first, sk.chain);
        if (second) hurtEnemy(second, pDamage(p, second, sk.mul * 0.7, 0));
      }
    }
    if (sk.shots && sk.shots > 1) {
      var t = targets[0];
      if (t) { for (var s2 = 1; s2 < sk.shots; s2++) hurtEnemy(t, pDamage(p, t, sk.mul, 0)); }
    }
  }

  function hurtEnemyAtTile(tx, ty, p, sk) {
    var e = enemyAt(tx, ty);
    if (e) hurtEnemy(e, pDamage(p, e, sk.mul, 0));
  }

  function nearestEnemyTo(e, range) {
    var best = null, bd = range + 1;
    for (var i = 0; i < S.enemies.length; i++) {
      var o = S.enemies[i];
      if (o === e || o.dead) continue;
      var d = cheb(o.x, o.y, e.x, e.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  function autoTarget(range) {
    var p = S.player;
    var best = null, bd = range + 1;
    for (var i = 0; i < S.enemies.length; i++) {
      var e = S.enemies[i];
      if (e.dead) continue;
      var d = cheb(p.x, p.y, e.x, e.y);
      if (d <= range && d < bd && !lineBlocked(p.x, p.y, e.x, e.y)) { bd = d; best = e; }
    }
    return best;
  }

  // ============ turnos ============
  function tryMove(dx, dy) {
    var p = S.player;
    if (S.dead || S.mode !== 'playing') return;
    snapshotPositions();
    p.lastDir = { dx: dx, dy: dy };
    var nx = p.x + dx, ny = p.y + dy;
    if (tileAt(nx, ny) === WALL) { mKey('cantMove'); return; }
    var e = enemyAt(nx, ny);
    if (e) { p.lunge = { tx: e.x, ty: e.y, t: 0, dur: LUNGE_DUR }; hurtEnemy(e, pDamage(p, e, 1, 0)); endAction(); return; }
    p.x = nx; p.y = ny;
    computeVisible();
    var it = itemAt(nx, ny);
    if (it) pickup(it);
    if (tileAt(nx, ny) === STAIRS) { handleStairs(); return; }
    endAction();
  }

  function doWait() { snapshotPositions(); endAction(); }

  function endAction() {
    if (S.dead) return;
    var p = S.player;
    S.actionsLeft--;
    if (S.actionsLeft <= 0) { enemyPhase(); S.actionsLeft = p.buffs.haste > 0 ? 2 : 1; }
    setupTweens();
    if (HAS_DOM) renderAll();
  }

  function enemyPhase() {
    var p = S.player;
    for (var i = 0; i < S.enemies.length; i++) {
      var e = S.enemies[i];
      if (e.dead) continue;
      enemyDotTick(e);
      if (e.dead) continue;
      enemyAct(e);
      if (S.dead) return;
    }
    for (var k in p.buffs) if (p.buffs[k] > 0) p.buffs[k]--;
    if (S.dead) return;
    playerDotTick();
    if (S.dead) return;
    var der = calcDerived(p);
    p.mana = Math.min(pMaxMana(), p.mana + der.manaRegen);
  }

  function pickup(it) {
    var p = S.player;
    if (p.inv.length >= 24) { mKey('invFull'); return; }
    var idx = S.floorItems.indexOf(it);
    if (idx >= 0) S.floorItems.splice(idx, 1);
    p.inv.push(it.item);
    fxSpark(it.x, it.y, rarityColor(it.item.rarity));
    mKey('picked', itemName(it.item));
  }

  // ============ pisos ============
  function newFloor(f, keepPlayer) {
    S.floor = f;
    S.gen = genFloor(f);
    S.map = S.gen.map;
    S.explored = [];
    S.enemies = spawnEnemies(f);
    S.floorItems = [];
    S.stairsActive = false;
    S.stairs = S.gen.stairs;
    var p = S.player;
    if (!keepPlayer) {
      p.x = S.gen.start.x;
      p.y = S.gen.start.y;
    }
    var itemCount = f === 3 ? 0 : 2 + randInt(0, 2);
    for (var i = 0; i < itemCount; i++) {
      var room = pick(S.gen.rooms);
      for (var t = 0; t < 40; t++) {
        var x = randInt(room.x + 1, room.x + room.w - 2);
        var y = randInt(room.y + 1, room.y + room.h - 2);
        if (S.map[y][x] === FLOOR && !(x === p.x && y === p.y)) {
          S.floorItems.push({ x: x, y: y, item: genItem(f) });
          break;
        }
      }
    }
    S.actionsLeft = 1;
    S.dead = false;
    S.aiming = null;
    S.playerTween = null;
    S.pv = null;
    S.fx = [];
    for (var vi = 0; vi < S.enemies.length; vi++) { S.enemies[vi].tween = null; S.enemies[vi].lunge = null; S.enemies[vi].flash = 0; }
    buildDecor();
    computeVisible();
    if (f > 0) mKey('foundStairs', f + 1);
    if (f === 3) mKey('bossArena');
    saveToLS();
  }

  function handleStairs() {
    if (S.floor >= FLOORS - 1) return;
    newFloor(S.floor + 1);
  }

  // ============ muerte y victoria ============
  function handleDeath() {
    var p = S.player;
    S.dead = true;
    var rec = getRecord();
    rec.bestFloor = Math.max(rec.bestFloor || 0, S.floor);
    rec.kills = (rec.kills || 0) + p.kills;
    if (p.runMode === 'hero') {
      var lost = Math.floor(p.gold / 2);
      p.gold -= lost;
      S.mode = 'dead';
      showDeathOverlay(true);
      mKey('lostHalfGold');
    } else {
      META.fallen++;
      saveMeta();
      saveRun(null);
      S.mode = 'dead';
      showDeathOverlay(false);
    }
    saveMeta();
  }

  function respawnHero() {
    var p = S.player;
    p.hp = pMaxHp();
    p.mana = pMaxMana();
    newFloor(S.floor, false);
    S.mode = 'playing';
    hideOverlay();
    renderAll();
  }

  function handleVictory() {
    var p = S.player;
    var rec = getRecord();
    rec.bestFloor = Math.max(rec.bestFloor || 0, FLOORS - 1);
    rec.kills = (rec.kills || 0) + p.kills;
    rec.wins = (rec.wins || 0) + 1;
    saveMeta();
    saveRun(null);
    S.mode = 'win';
    showVictoryOverlay();
  }

  function getRecord() {
    var p = S.player;
    if (!META.records[p.cls]) META.records[p.cls] = { bestFloor: 0, kills: 0, wins: 0 };
    return META.records[p.cls];
  }

  // ============ persistencia ============
  function saveRun(payload) {
    try {
      if (payload === null) { localStorage.removeItem(SAVE_KEY); return; }
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function snapshot() {
    var es = [];
    for (var i = 0; i < S.enemies.length; i++) {
      var e = S.enemies[i];
      var c = {};
      for (var k in e) if (k !== 'tween' && k !== 'lunge' && k !== 'flash') c[k] = e[k];
      es.push(c);
    }
    return {
      v: 1, mode: 'playing', runMode: S.player.runMode, floor: S.floor,
      player: S.player, map: S.map, explored: S.explored,
      enemies: es, floorItems: S.floorItems,
      stairsActive: S.stairsActive, actionsLeft: S.actionsLeft,
    };
  }

  function saveToLS() {
    if (!S || S.mode !== 'playing') return;
    saveRun(snapshot());
  }

  function loadFromLS() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || !d.player) return false;
      S = { mode: 'playing', messages: [], visible: {}, aiming: null, fx: [], playerTween: null, pv: null };
      S.player = d.player;
      if (S.player.poison === undefined) S.player.poison = 0;
      if (S.player.burn === undefined) S.player.burn = 0;
      if (S.player.frozen === undefined) S.player.frozen = 0;
      S.floor = d.floor;
      S.map = d.map;
      S.explored = d.explored || [];
      S.enemies = d.enemies || [];
      S.floorItems = d.floorItems || [];
      S.stairsActive = d.stairsActive || false;
      S.actionsLeft = d.actionsLeft || 1;
      S.dead = false;
      S.gen = { rooms: [{ x: 0, y: 0, w: COLS, h: ROWS }], start: { x: d.player.x, y: d.player.y }, stairs: { x: -1, y: -1 } };
      S.stairs = S.gen.stairs;
      buildDecor();
      computeVisible();
      return true;
    } catch (e) { return false; }
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  // ============ DOM helpers ============
  function $(id) { return HAS_DOM ? document.getElementById(id) : null; }
  function on(id, ev, fn) { if (HAS_DOM) $(id).addEventListener(ev, fn); }

  var canvas, ctx, hud, overlay, ovTitle, ovText, ovOptions, ovBtn, ovBtn2, logEl, skillsEl, invBtn, invOverlay;

  function setupDOM() {
    if (!HAS_DOM) return;
    canvas = $('game');
    ctx = canvas.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = COLS * TILE * dpr;
    canvas.height = ROWS * TILE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hud = $('hud');
    overlay = $('overlay');
    ovTitle = $('ov-title');
    ovText = $('ov-text');
    ovOptions = $('ov-options');
    ovBtn = $('ov-btn');
    ovBtn2 = $('ov-btn2');
    logEl = $('log');
    skillsEl = $('skills');
    invBtn = $('hud-inv');
    on('hud-inv', 'click', function () { toggleInventory(); });
    on('ov-btn', 'click', ovAction);
    on('ov-btn2', 'click', ovAction2);
    bindInput();
    requestAnimationFrame(loop);
  }

  // ============ fx (animaciones) ============
  function fxAdd(f) { if (!S.fx) S.fx = []; S.fx.push(f); }
  function fxNumber(tx, ty, n, color, big) { if (!HAS_DOM) return; fxAdd({ type: 'num', x: tx, y: ty, n: n, color: color, big: !!big, t: 0, dur: NUM_DUR }); }
  function fxSpark(tx, ty, color) { if (!HAS_DOM) return; fxAdd({ type: 'spark', x: tx, y: ty, color: color, t: 0, dur: POP_DUR }); }

  function snapshotPositions() {
    if (!S) return;
    S.pv = { p: { x: S.player.x, y: S.player.y }, e: {} };
    for (var i = 0; i < S.enemies.length; i++) {
      var e = S.enemies[i];
      if (!e.dead) S.pv.e[e.id] = { x: e.x, y: e.y };
    }
  }

  function setupTweens() {
    if (!S || !S.pv) return;
    var p = S.player;
    if (S.pv.p.x !== p.x || S.pv.p.y !== p.y) {
      S.playerTween = { fx: S.pv.p.x, fy: S.pv.p.y, tx: p.x, ty: p.y, t: 0, dur: MOVE_DUR };
    } else {
      S.playerTween = null;
    }
    for (var i = 0; i < S.enemies.length; i++) {
      var e = S.enemies[i];
      var prev = S.pv.e[e.id];
      if (prev && (prev.x !== e.x || prev.y !== e.y)) e.tween = { fx: prev.x, fy: prev.y, tx: e.x, ty: e.y, t: 0, dur: MOVE_DUR };
      else e.tween = null;
    }
    S.pv = null;
  }

  function advanceFx(dt) {
    if (!S) return;
    if (S.playerTween) { S.playerTween.t += dt; if (S.playerTween.t >= S.playerTween.dur) S.playerTween = null; }
    var p = S.player;
    if (p.lunge) { p.lunge.t += dt; if (p.lunge.t >= p.lunge.dur) p.lunge = null; }
    if (p.flash > 0) p.flash -= dt;
    for (var i = S.enemies.length - 1; i >= 0; i--) {
      var e = S.enemies[i];
      if (e.tween) { e.tween.t += dt; if (e.tween.t >= e.tween.dur) e.tween = null; }
      if (e.lunge) { e.lunge.t += dt; if (e.lunge.t >= e.lunge.dur) e.lunge = null; }
      if (e.flash > 0) e.flash -= dt;
    }
    for (var j = S.fx.length - 1; j >= 0; j--) {
      S.fx[j].t += dt;
      if (S.fx[j].t >= S.fx[j].dur) S.fx.splice(j, 1);
    }
  }

  function tweenPos(o) {
    if (!o.tween) return { x: o.x, y: o.y };
    var tw = o.tween, k = Math.min(1, tw.t / tw.dur);
    k = k * k * (3 - 2 * k);
    return { x: tw.fx + (tw.tx - tw.fx) * k, y: tw.fy + (tw.ty - tw.fy) * k };
  }

  function lungeOffset(o) {
    if (!o || !o.lunge) return { x: 0, y: 0 };
    var k = Math.sin(Math.PI * Math.min(1, o.lunge.t / o.lunge.dur));
    return { x: (o.lunge.tx - o.x) * k * 0.7, y: (o.lunge.ty - o.y) * k * 0.7 };
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ============ render ============
  function tileVisible(x, y) { return !!(S && S.visible && S.visible[y * COLS + x]); }
  function tileExplored(x, y) { return !!(S && S.explored && S.explored[y * COLS + x]); }

  function buildDecor() {
    S.decor = [];
    for (var i = 0; i < ROWS * COLS; i++) S.decor[i] = { v: randInt(0, 3), w: randInt(0, 3) };
  }

  function pal() { return PALETTES[S.floor] || PALETTES[0]; }

  function drawTiles() {
    var P = pal();
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var vis = tileVisible(x, y);
        if (!tileExplored(x, y)) continue;
        var t = S.map[y][x];
        var fx = x * TILE, fy = y * TILE;
        var dec = S.decor[y * COLS + x] || { v: 0, w: 0 };
        if (t === WALL) drawWall(fx, fy, P, vis, dec);
        else drawFloor(fx, fy, P, vis, dec);
        if (t === STAIRS && vis) drawStairs(fx, fy, P);
      }
    }
  }

  function drawFloor(fx, fy, P, vis, dec) {
    ctx.fillStyle = vis ? P.floor : P.floorDark;
    ctx.fillRect(fx, fy, TILE, TILE);
    if (vis) {
      ctx.fillStyle = P.speck;
      ctx.fillRect(fx + 4 + dec.v * 3, fy + 6 + dec.v * 2, 2, 2);
      ctx.fillRect(fx + 14 - dec.v * 2, fy + 14 + dec.v, 2, 2);
      if (dec.w === 0) {
        ctx.strokeStyle = P.grime;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx + 6, fy + 17);
        ctx.lineTo(fx + 11, fy + 11);
        ctx.lineTo(fx + 10, fy + 5);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(fx + TILE - 2, fy, 2, TILE);
      ctx.fillRect(fx, fy + TILE - 2, TILE, 2);
    }
  }

  function drawWall(fx, fy, P, vis, dec) {
    ctx.fillStyle = vis ? P.wall : P.wallDark;
    ctx.fillRect(fx, fy, TILE, TILE);
    if (vis) {
      ctx.fillStyle = P.wallTop;
      ctx.fillRect(fx, fy, TILE, 3);
      ctx.strokeStyle = P.grime;
      ctx.lineWidth = 1;
      var off = dec.w * 3;
      var gy = 10 + (off % 5);
      ctx.beginPath();
      ctx.moveTo(fx + 2, fy + gy); ctx.lineTo(fx + TILE - 2, fy + gy);
      ctx.moveTo(fx + 2, fy + gy + 6); ctx.lineTo(fx + TILE - 2, fy + gy + 6);
      ctx.moveTo(fx + (TILE / 2 + off * 2) % TILE, fy + 2); ctx.lineTo(fx + (TILE / 2 + off * 2) % TILE, fy + gy);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(fx, fy + TILE - 2, TILE, 2);
    }
  }

  function drawStairs(fx, fy, P) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(fx + 3, fy + 3, TILE - 6, TILE - 6, 2);
    ctx.fill();
    ctx.strokeStyle = P.stair;
    ctx.lineWidth = 2;
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(fx + 6 + i * 3, fy + TILE - 5 - i * 4);
      ctx.lineTo(fx + TILE - 6, fy + TILE - 5 - i * 4);
      ctx.stroke();
    }
  }

  function rarityColor(r) {
    return r === 'unique' ? '#ff8c42' : r === 'rare' ? '#ffd24d' : r === 'magic' ? '#6bb5ff' : '#cfc8da';
  }

  function drawItem(fi) {
    var cx = fi.x * TILE + TILE / 2, cy = fi.y * TILE + TILE / 2;
    var c = rarityColor(fi.item.rarity);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0a080d';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx, cy + 6); ctx.lineTo(cx - 5, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + 3, cy); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx - 3, cy);
    ctx.closePath();
    ctx.fill();
  }

  function drawStatusIcons(o, cx, cy) {
    if (o.poison > 0) {
      ctx.fillStyle = '#8ae86a';
      ctx.fillRect(cx - 11, cy - 12, 4, 4);
    }
    if (o.burn > 0) {
      ctx.fillStyle = '#ff9a3a';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 15); ctx.lineTo(cx + 3, cy - 10); ctx.lineTo(cx - 3, cy - 10);
      ctx.closePath();
      ctx.fill();
    }
    if (o.frozen > 0) {
      ctx.fillStyle = '#9ad8ff';
      ctx.fillRect(cx + 7, cy - 12, 4, 4);
    }
  }

  function drawHealthBar(o, cx, cy, w, hp, maxHp, col) {
    var hpP = clamp(hp / maxHp, 0, 1);
    ctx.fillStyle = 'rgba(10,8,13,0.9)';
    ctx.fillRect(cx - w / 2, cy - TILE / 2 - 5, w, 3);
    ctx.fillStyle = col;
    ctx.fillRect(cx - w / 2, cy - TILE / 2 - 5, w * hpP, 3);
  }

  function eyesAt(cx, cy, dx, dy) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + dx * 3 - 3, cy + dy * 3 - 1, 3, 3);
    ctx.fillRect(cx + dx * 3 + 1, cy + dy * 3 - 1, 3, 3);
    ctx.fillStyle = '#12100f';
    ctx.fillRect(cx + dx * 3 - 2, cy + dy * 3, 2, 2);
    ctx.fillRect(cx + dx * 3 + 2, cy + dy * 3, 2, 2);
  }

  function drawPlayerSprite(x, y) {
    var p = S.player;
    var cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2;
    var d = p.lastDir;
    var c = CLASSES[p.cls].color;
    var cl = p.cls;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 7.5, 6, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (cl === 'spartan') drawSpartan(cx, cy, d, c);
    else if (cl === 'mage') drawMage(cx, cy, d, c);
    else drawRogue(cx, cy, d, c);
    if (p.flash > 0) {
      ctx.globalAlpha = Math.min(1, p.flash / 0.08);
      ctx.fillStyle = 'rgba(255,70,70,0.5)';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    drawStatusIcons(p, cx, cy);
    drawHealthBar(p, cx, cy, TILE - 6, p.hp, pMaxHp(), '#ff4a52');
  }

  function drawSpartan(cx, cy, d, c) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(cx - 5, cy + 4, 4, 4);
    ctx.fillRect(cx + 1, cy + 4, 4, 4);
    ctx.fillStyle = c;
    roundRect(cx - 6, cy - 3, 12, 9, 3);
    ctx.fill();
    ctx.fillStyle = '#e8c9a0';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9b9a0';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 4.4, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d13b3b';
    ctx.fillRect(cx - 1.5, cy - 11, 3, 3);
    eyesAt(cx, cy - 5, d.dx, d.dy);
    ctx.fillStyle = '#8a8a94';
    roundRect(cx + (d.dx >= 0 ? 4 : -8), cy - 3, 4, 8, 1);
    ctx.fill();
  }

  function drawMage(cx, cy, d, c) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(cx - 5, cy + 4, 4, 4);
    ctx.fillRect(cx + 1, cy + 4, 4, 4);
    ctx.fillStyle = c;
    roundRect(cx - 6, cy - 2, 12, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#6b4a8f';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + 5); ctx.lineTo(cx + 6, cy + 5); ctx.lineTo(cx, cy + 11); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8c9a0';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2b4f';
    ctx.beginPath();
    ctx.moveTo(cx - 4.5, cy - 7); ctx.lineTo(cx + 4.5, cy - 7); ctx.lineTo(cx, cy - 13); ctx.closePath();
    ctx.fill();
    eyesAt(cx, cy - 5, d.dx, d.dy);
    ctx.strokeStyle = '#7a5b9f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy - 8);
    ctx.lineTo(cx + 7, cy + 5);
    ctx.stroke();
    ctx.fillStyle = '#ffd24d';
    ctx.beginPath();
    ctx.arc(cx + 7, cy - 9, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRogue(cx, cy, d, c) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(cx - 5, cy + 4, 4, 4);
    ctx.fillRect(cx + 1, cy + 4, 4, 4);
    ctx.fillStyle = c;
    roundRect(cx - 6, cy - 2, 12, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#2e8f5a';
    roundRect(cx - 6, cy - 8, 12, 7, 3);
    ctx.fill();
    ctx.fillStyle = '#e8c9a0';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 4.2, 0, Math.PI * 2);
    ctx.fill();
    eyesAt(cx, cy - 5, d.dx, d.dy);
    ctx.strokeStyle = '#d0d0da';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 1); ctx.lineTo(cx - 9, cy + 6);
    ctx.moveTo(cx + 7, cy - 1); ctx.lineTo(cx + 9, cy + 6);
    ctx.stroke();
  }

  function drawEnemySprite(e, x, y) {
    var cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 7.5, 6, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (e.kind === 'cerberus') drawCerberus(cx, cy);
    else if (e.kind === 'shadow') drawShadow(cx, cy);
    else if (e.kind === 'rat') drawRat(cx, cy);
    else if (e.kind === 'spectre') drawSpectre(cx, cy);
    else if (e.kind === 'harpy') drawHarpy(cx, cy);
    else if (e.kind === 'gorgon') drawGorgon(cx, cy);
    else if (e.kind === 'fury') drawFury(cx, cy);
    else drawMinion(cx, cy);
    if (e.flash > 0) {
      ctx.globalAlpha = Math.min(1, e.flash / 0.08);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    drawStatusIcons(e, cx, cy);
    drawHealthBar(e, cx, cy, TILE - 6, e.hp, e.maxHp, e.boss ? '#ff9a3a' : '#e04a6b');
  }

  function drawShadow(cx, cy) {
    ctx.fillStyle = '#241a2e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e04a6b';
    ctx.fillRect(cx - 5, cy - 4, 3, 3);
    ctx.fillRect(cx + 2, cy - 4, 3, 3);
  }

  function drawRat(cx, cy) {
    ctx.fillStyle = '#8f7a6b';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b5847';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 4, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.arc(cx - 2, cy - 4, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e04a6b';
    ctx.fillRect(cx - 5, cy - 3, 2, 2);
    ctx.strokeStyle = '#8f7a6b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy + 1);
    ctx.quadraticCurveTo(cx + 9, cy - 2, cx + 8, cy + 3);
    ctx.stroke();
  }

  function drawSpectre(cx, cy) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#6fa8e0';
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 6, Math.PI, 0);
    ctx.lineTo(cx + 6, cy + 8);
    ctx.lineTo(cx + 3, cy + 5);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 3, cy + 5);
    ctx.lineTo(cx - 6, cy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e8f4ff';
    ctx.fillRect(cx - 4, cy - 5, 3, 3);
    ctx.fillRect(cx + 1, cy - 5, 3, 3);
  }

  function drawHarpy(cx, cy) {
    ctx.fillStyle = '#5a6a8a';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7c90b8';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 3); ctx.quadraticCurveTo(cx - 12, cy - 1, cx - 8, cy + 4); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 3); ctx.quadraticCurveTo(cx + 12, cy - 1, cx + 8, cy + 4); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd24d';
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy + 2); ctx.lineTo(cx + 5, cy + 3); ctx.lineTo(cx + 2, cy + 5); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e04a6b';
    ctx.fillRect(cx - 4, cy - 4, 2, 2);
    ctx.fillRect(cx + 1, cy - 4, 2, 2);
  }

  function drawGorgon(cx, cy) {
    ctx.fillStyle = '#3e8f5a';
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c6b42';
    ctx.lineWidth = 1.2;
    for (var i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 3, cy - 6);
      ctx.quadraticCurveTo(cx + i * 3 + 2, cy - 10, cx + i * 3 + 1, cy - 12);
      ctx.stroke();
    }
    ctx.fillStyle = '#e0e0e8';
    ctx.fillRect(cx - 4, cy - 3, 3, 3);
    ctx.fillRect(cx + 1, cy - 3, 3, 3);
  }

  function drawFury(cx, cy) {
    ctx.fillStyle = '#b8393f';
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a2426';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + 3); ctx.quadraticCurveTo(cx - 11, cy + 7, cx - 7, cy + 8); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy + 3); ctx.quadraticCurveTo(cx + 11, cy + 7, cx + 7, cy + 8); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a1a1c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 6); ctx.quadraticCurveTo(cx + 12, cy - 4, cx + 9, cy + 1);
    ctx.stroke();
    ctx.fillStyle = '#ffe18a';
    ctx.fillRect(cx - 4, cy - 3, 2, 2);
    ctx.fillRect(cx + 1, cy - 3, 2, 2);
  }

  function drawMinion(cx, cy) {
    ctx.fillStyle = '#4a3a5a';
    roundRect(cx - 6, cy - 6, 12, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#2c2438';
    roundRect(cx - 6, cy - 1, 12, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#e04a6b';
    ctx.fillRect(cx - 4, cy - 4, 3, 3);
    ctx.fillRect(cx + 1, cy - 4, 3, 3);
  }

  function drawCerberus(cx, cy) {
    ctx.fillStyle = '#7a2f12';
    roundRect(cx - 10, cy, 20, 9, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    var heads = [
      { hx: cx - 8, hy: cy - 5, c: '#ff9a3a', e: '#5a1a0a' },
      { hx: cx, hy: cy - 9, c: '#9ad8ff', e: '#1a3a5a' },
      { hx: cx + 8, hy: cy - 5, c: '#8ae86a', e: '#1a4a2a' },
    ];
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i];
      ctx.fillStyle = h.c;
      ctx.beginPath();
      ctx.arc(h.hx, h.hy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = h.e;
      ctx.beginPath();
      ctx.arc(h.hx - 2, h.hy - 1, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.arc(h.hx + 2, h.hy - 1, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(h.hx - 1, h.hy + 3, 2, 2);
    }
  }

  function drawFx() {
    if (!S.fx) return;
    for (var i = 0; i < S.fx.length; i++) {
      var f = S.fx[i];
      var k = Math.min(1, f.t / f.dur);
      if (f.type === 'num') {
        ctx.globalAlpha = 1 - k * k;
        ctx.font = (f.big ? 'bold 12px' : 'bold 10px') + ' sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 2;
        var tx = f.x * TILE + TILE / 2, ty = f.y * TILE + TILE / 2 - 6 - k * 10;
        ctx.strokeText(String(f.n), tx, ty);
        ctx.fillStyle = f.color;
        ctx.fillText(String(f.n), tx, ty);
        ctx.globalAlpha = 1;
      } else if (f.type === 'spark') {
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x * TILE + TILE / 2, f.y * TILE + TILE / 2, 2 + k * 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  function draw() {
    if (!HAS_DOM || !ctx) return;
    if (!S || S.mode !== 'playing') {
      ctx.fillStyle = '#16121f';
      ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
      return;
    }
    drawTiles();
    for (var i = 0; i < S.floorItems.length; i++) {
      var fi = S.floorItems[i];
      if (tileVisible(fi.x, fi.y)) drawItem(fi);
    }
    for (var j = 0; j < S.enemies.length; j++) {
      var e = S.enemies[j];
      if (e.dead || !tileVisible(e.x, e.y)) continue;
      var tp = tweenPos(e);
      var lf = lungeOffset(e);
      drawEnemySprite(e, tp.x + lf.x, tp.y + lf.y);
    }
    var ptp = tweenPos(S.player);
    var plf = lungeOffset(S.player);
    drawPlayerSprite(ptp.x + plf.x, ptp.y + plf.y);
    drawFx();
    if (S.aiming) {
      var ax = S.aiming.cx * TILE, ay = S.aiming.cy * TILE;
      ctx.strokeStyle = '#ffe18a';
      ctx.lineWidth = 2;
      ctx.strokeRect(ax + 2, ay + 2, TILE - 4, TILE - 4);
    }
  }

  function renderHud() {
    if (!HAS_DOM) return;
    if (!S || S.mode !== 'playing') { hud.classList.add('hidden'); return; }
    hud.classList.remove('hidden');
    var p = S.player, der = calcDerived(p);
    $('hp-fill').style.width = (clamp(p.hp / pMaxHp(), 0, 1) * 100) + '%';
    $('hp-text').textContent = Math.max(0, Math.round(p.hp)) + ' / ' + pMaxHp();
    $('mp-fill').style.width = (clamp(p.mana / pMaxMana(), 0, 1) * 100) + '%';
    $('mp-text').textContent = Math.round(p.mana) + ' / ' + pMaxMana();
    $('xp-fill').style.width = (clamp(p.xp / xpNeed(p.level), 0, 1) * 100) + '%';
    $('xp-text').textContent = T('level') + ' ' + p.level;
    $('hud-floor').textContent = T('floor') + ' ' + (S.floor + 1) + '/' + FLOORS;
    $('hud-class').textContent = T(CLASSES[p.cls].nameKey);
    $('hud-gold').textContent = '⛁ ' + p.gold;
    invBtn.textContent = T('inventory') + ' (I)';
  }

  function renderLog() {
    if (!HAS_DOM || !S) return;
    if (S.mode !== 'playing') { logEl.classList.add('hidden'); return; }
    logEl.classList.remove('hidden');
    logEl.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < S.messages.length; i++) {
      var m = S.messages[i];
      var pe = document.createElement('p');
      pe.textContent = m.t;
      if (m.n) pe.className = 'new';
      frag.appendChild(pe);
    }
    logEl.appendChild(frag);
  }

  function buildSkills() {
    if (!HAS_DOM) return;
    if (!S || S.mode !== 'playing') { skillsEl.classList.add('hidden'); return; }
    skillsEl.classList.remove('hidden');
    skillsEl.innerHTML = '';
    var c = CLASSES[S.player.cls];
    var num = 1;
    c.branches.forEach(function (b) {
      BRANCHES[b].order.forEach(function (id) {
        var sk = SKILLS[id];
        if (sk.type === 'passive') return;
        var lvl = S.player.skills[id] || 0;
        var btn = document.createElement('button');
        btn.className = 'skill-btn';
        btn.innerHTML = '<b>' + T('sk_' + id) + '</b><span class="lvl">' + (lvl ? 'lvl ' + lvl : '—') + ' · ' + sk.cost + ' ' + T('s_mana') + '</span>';
        if (!lvl) btn.classList.add('off');
        if (S.player.skillPoints > 0 && canLearn(id)) btn.classList.add('learnable');
        btn.dataset.skill = id;
        if (lvl) {
          btn.addEventListener('click', function () {
            S.aiming = null;
            beginSkill(id);
          });
        }
        skillsEl.appendChild(btn);
        num++;
      });
    });
    var wait = document.createElement('button');
    wait.className = 'skill-btn';
    wait.innerHTML = '<b>' + T('wait') + '</b>';
    wait.addEventListener('click', function () { if (S && S.mode === 'playing') { S.aiming = null; doWait(); } });
    skillsEl.appendChild(wait);
  }

  function beginSkill(id) {
    var sk = SKILLS[id];
    var p = S.player;
    if (p.mana < sk.cost) { mKey('notEnoughMana'); return; }
    if (sk.type === 'attack' || sk.type === 'area_melee') {
      activateSkill(id);
      return;
    }
    if (sk.type === 'buff') { activateSkill(id); return; }
    if (sk.type === 'ranged' || sk.type === 'aoe') {
      var tg = autoTarget(sk.range);
      if (tg && !lineBlocked(p.x, p.y, tg.x, tg.y)) { activateSkill(id, tg.x, tg.y); return; }
    }
    if (sk.type === 'aoe_all') { activateSkill(id); return; }
    S.aiming = { skill: id, cx: p.x, cy: p.y };
    if (sk.effect === 'freeze' || sk.effect === 'teleport') {
      // apuntar con el cursor
    }
    mKey('sk_point');
  }

  // ============ overlays ============
  function showOverlay(title, text, options, btn1, btn2) {
    if (!HAS_DOM) return;
    ovTitle.innerHTML = title;
    ovText.textContent = text || '';
    ovOptions.innerHTML = '';
    if (options) ovOptions.appendChild(options);
    ovBtn.textContent = btn1 || '';
    ovBtn.classList.remove('hidden');
    if (btn2) { ovBtn2.textContent = btn2; ovBtn2.classList.remove('hidden'); }
    else ovBtn2.classList.add('hidden');
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { if (HAS_DOM) overlay.classList.add('hidden'); }

  var ovAction, ovAction2;
  var selCls = null, selMode = null;

  function showMenu() {
    S = null;
    renderClear();
    var opts = document.createElement('div');
    opts.className = 'ov-options';
    var optNew = document.createElement('button');
    optNew.className = 'ov-option';
    optNew.innerHTML = '<div class="opt-title">' + T('newGame') + '</div><div class="opt-desc">' + T('classSelect') + '</div>';
    optNew.addEventListener('click', function () { showClassSelect(); });
    opts.appendChild(optNew);
    if (hasSave()) {
      var optCont = document.createElement('button');
      optCont.className = 'ov-option';
      optCont.innerHTML = '<div class="opt-title">' + T('continueGame') + '</div>';
      optCont.addEventListener('click', function () {
        if (loadFromLS()) { S.mode = 'playing'; hideOverlay(); renderAll(); }
      });
      opts.appendChild(optCont);
    }
    var optRec = document.createElement('button');
    optRec.className = 'ov-option';
    optRec.innerHTML = '<div class="opt-title">' + T('records') + ' / ' + T('collection') + '</div>';
    optRec.addEventListener('click', function () { showRecords(); });
    opts.appendChild(optRec);
    ovAction = function () {};
    ovAction2 = function () {};
    showOverlay('<span class="sub">' + T('subtitle') + '</span>' + T('title'), '', opts);
    ovBtn.classList.add('hidden');
  }

  function showClassSelect() {
    var opts = document.createElement('div');
    opts.className = 'ov-options';
    selCls = null;
    var names = ['spartan', 'mage', 'rogue'];
    names.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'ov-option';
      b.innerHTML = '<div class="opt-title" style="color:' + CLASSES[c].color + '">' + T(CLASSES[c].nameKey) + '</div><div class="opt-desc">' + T(CLASSES[c].descKey) + '</div>';
      b.addEventListener('click', function () { selCls = c; showModeSelect(); });
      opts.appendChild(b);
    });
    ovAction = function () { showMenu(); };
    ovAction2 = function () {};
    showOverlay(T('classSelect'), '', opts, T('back'));
  }

  function showModeSelect() {
    var opts = document.createElement('div');
    opts.className = 'ov-options';
    var b1 = document.createElement('button');
    b1.className = 'ov-option';
    b1.innerHTML = '<div class="opt-title">' + T('hero') + '</div><div class="opt-desc">' + T('heroDesc') + '</div>';
    b1.addEventListener('click', function () { selMode = 'hero'; startGame(); });
    var b2 = document.createElement('button');
    b2.className = 'ov-option';
    b2.innerHTML = '<div class="opt-title">' + T('mortal') + '</div><div class="opt-desc">' + T('mortalDesc') + '</div>';
    b2.addEventListener('click', function () { selMode = 'mortal'; startGame(); });
    opts.appendChild(b1);
    opts.appendChild(b2);
    ovAction = function () { showClassSelect(); };
    ovAction2 = function () {};
    showOverlay(T('modeSelect'), '', opts, T('back'));
  }

  function startGame() {
    S = { mode: 'playing', messages: [], visible: {}, aiming: null };
    S.player = newPlayer(selCls, selMode);
    newFloor(0, false);
    S.mode = 'playing';
    saveToLS();
    hideOverlay();
    renderAll();
  }

  function showDeathOverlay(isHero) {
    var p = S.player;
    var text = isHero ? TF('deathDescHero', T('floor') + ' ' + (S.floor + 1)) : T('deathDescMortal');
    ovAction = function () {
      if (isHero) respawnHero();
      else showMenu();
    };
    ovAction2 = function () {};
    showOverlay(T('death'), text, null, isHero ? T('respawn') : T('back'));
  }

  function showVictoryOverlay() {
    var text = TF('victoryDesc', T(CLASSES[S.player.cls].nameKey));
    ovAction = function () { showMenu(); };
    ovAction2 = function () {};
    showOverlay(T('victory'), text, null, T('back'));
  }

  function showRecords() {
    var div = document.createElement('div');
    div.className = 'inv-scroll';
    div.style.maxHeight = '50vh';
    var h = document.createElement('div');
    h.style.fontWeight = 'bold';
    h.textContent = T('records');
    div.appendChild(h);
    Object.keys(CLASSES).forEach(function (c) {
      var r = META.records[c];
      if (!r) return;
      var p = document.createElement('p');
      p.textContent = T(CLASSES[c].nameKey) + ': ' + T('bestFloor') + ' ' + (r.bestFloor + 1) + '/' + FLOORS + ' · ' + T('kills') + ' ' + r.kills + ' · ' + T('wins') + ' ' + r.wins;
      div.appendChild(p);
    });
    var h2 = document.createElement('div');
    h2.style.fontWeight = 'bold';
    h2.style.marginTop = '10px';
    h2.textContent = T('collection') + ' (' + T('discovered') + ' ' + META.collection.uniques.length + '/' + SLOTS.length + ')';
    div.appendChild(h2);
    var p2 = document.createElement('p');
    p2.textContent = T('fallen') + ' ' + META.fallen;
    div.appendChild(p2);
    ovAction = function () { showMenu(); };
    ovAction2 = function () {};
    showOverlay(T('records'), '', div, T('back'));
  }

  // ============ inventario ============
  var invOpen = false;

  function toggleInventory() {
    if (!S || S.mode !== 'playing') return;
    invOpen = !invOpen;
    if (invOpen) renderInventory(); else hideInventory();
  }

  function hideInventory() {
    invOpen = false;
    if (overlay.dataset.panel === 'inv') hideOverlay();
  }

  function renderInventory() {
    overlay.dataset.panel = 'inv';
    var div = document.createElement('div');
    div.className = 'inv-scroll';
    var grid = document.createElement('div');
    grid.className = 'slot-grid';
    SLOTS.forEach(function (s) {
      var it = S.player.eq[s];
      var cell = document.createElement('div');
      cell.className = 'slot';
      var nm = document.createElement('div');
      nm.className = 'slot-name';
      nm.textContent = T('sl_' + s);
      cell.appendChild(nm);
      if (it) {
        var nm2 = document.createElement('div');
        nm2.className = 'r-' + it.rarity;
        nm2.style.fontWeight = '600';
        nm2.textContent = itemName(it);
        cell.appendChild(nm2);
        var d2 = document.createElement('div');
        d2.className = 'it-af';
        d2.textContent = itemDesc(it);
        cell.appendChild(d2);
      }
      grid.appendChild(cell);
    });
    div.appendChild(grid);
    var invTitle = document.createElement('div');
    invTitle.style.fontWeight = 'bold';
    invTitle.style.margin = '10px 0 4px';
    invTitle.textContent = T('inventory') + ' (' + S.player.inv.length + ')';
    div.appendChild(invTitle);
    if (!S.player.inv.length) {
      var e = document.createElement('p');
      e.textContent = T('empty');
      div.appendChild(e);
    }
    S.player.inv.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'inv-item';
      var nm3 = document.createElement('div');
      nm3.className = 'it-name r-' + it.rarity;
      nm3.textContent = itemName(it);
      row.appendChild(nm3);
      var dd = document.createElement('div');
      dd.className = 'it-af';
      dd.textContent = itemDesc(it);
      row.appendChild(dd);
      var act = document.createElement('div');
      act.className = 'it-act';
      var eqBtn = document.createElement('button');
      eqBtn.textContent = it.slot in S.player.eq ? T('unequip') : T('equip');
      eqBtn.addEventListener('click', function () { toggleEquip(it); });
      var drBtn = document.createElement('button');
      drBtn.textContent = T('drop');
      drBtn.addEventListener('click', function () { dropItem(it); });
      act.appendChild(eqBtn);
      act.appendChild(drBtn);
      row.appendChild(act);
      div.appendChild(row);
    });
    ovAction = function () { hideInventory(); };
    ovAction2 = function () {};
    showOverlay(T('inventory'), '', div, T('close'));
  }

  function toggleEquip(it) {
    var p = S.player;
    var cur = p.eq[it.slot];
    if (cur && cur.id === it.id) {
      p.eq[it.slot] = null;
      p.inv.push(it);
      mKey('unequipped', itemName(it));
    } else {
      var idx = p.inv.indexOf(it);
      if (idx >= 0) p.inv.splice(idx, 1);
      if (cur) p.inv.push(cur);
      p.eq[it.slot] = it;
      mKey('equipped', itemName(it));
    }
    renderInventory();
  }

  function dropItem(it) {
    var idx = S.player.inv.indexOf(it);
    if (idx >= 0) S.player.inv.splice(idx, 1);
    S.floorItems.push({ x: S.player.x, y: S.player.y, item: it });
    mKey('dropped', itemName(it));
    renderInventory();
  }

  // ============ skills panel ============
  function showSkillsPanel() {
    overlay.dataset.panel = 'skills';
    var div = document.createElement('div');
    div.className = 'inv-scroll';
    var h = document.createElement('div');
    h.style.fontWeight = 'bold';
    h.textContent = T('skills');
    div.appendChild(h);
    var pt = document.createElement('div');
    pt.textContent = T('skillPoints') + ': ' + S.player.skillPoints;
    div.appendChild(pt);
    var c = CLASSES[S.player.cls];
    c.branches.forEach(function (b) {
      var bh = document.createElement('div');
      bh.style.fontWeight = 'bold';
      bh.style.marginTop = '8px';
      bh.style.color = '#ffe18a';
      bh.textContent = T(BRANCHES[b].nameKey);
      div.appendChild(bh);
      BRANCHES[b].order.forEach(function (id) {
        var sk = SKILLS[id];
        var lvl = S.player.skills[id] || 0;
        var row = document.createElement('div');
        row.className = 'inv-item';
        var nm = document.createElement('div');
        nm.className = 'it-name';
        nm.textContent = T('sk_' + id) + (lvl ? ' · ' + T('level') + ' ' + lvl : '');
        row.appendChild(nm);
        var dd = document.createElement('div');
        dd.className = 'it-af';
        dd.textContent = T('sk_' + id + 'Desc') + (sk.type === 'passive' ? ' [' + T('passive') + ']' : ' · ' + sk.cost + ' ' + T('s_mana'));
        row.appendChild(dd);
        var act = document.createElement('div');
        act.className = 'it-act';
        var lb = document.createElement('button');
        if (lvl >= 3) { lb.textContent = 'MAX'; lb.disabled = true; }
        else if (canLearn(id)) { lb.textContent = lvl ? T('upgrade') : T('learn'); }
        else { lb.textContent = lvl ? T('upgrade') : T('lock'); lb.disabled = true; }
        lb.addEventListener('click', function () { learnSkill(id); showSkillsPanel(); });
        act.appendChild(lb);
        row.appendChild(act);
        div.appendChild(row);
      });
    });
    ovAction = function () { hideOverlay(); };
    ovAction2 = function () {};
    showOverlay(T('skills'), '', div, T('close'));
  }

  // ============ input ============
  function bindInput() {
    window.addEventListener('keydown', function (ev) {
      var k = ev.key;
      if (!S) { if (k === 'Enter' || k === ' ') ovBtn.click(); return; }
      if (S.mode === 'dead' || S.mode === 'win') { if (k === 'Enter' || k === ' ') ovBtn.click(); return; }
      if (S.mode !== 'playing') return;
      var dx = 0, dy = 0;
      if (k === 'ArrowUp' || k === 'w') { dx = 0; dy = -1; }
      else if (k === 'ArrowDown' || k === 's') { dx = 0; dy = 1; }
      else if (k === 'ArrowLeft' || k === 'a') { dx = -1; dy = 0; }
      else if (k === 'ArrowRight' || k === 'd') { dx = 1; dy = 0; }
      if (dx !== 0 || dy !== 0) {
        ev.preventDefault();
        if (S.aiming) {
          S.aiming.cx = clamp(S.aiming.cx + dx, 0, COLS - 1);
          S.aiming.cy = clamp(S.aiming.cy + dy, 0, ROWS - 1);
          return;
        }
        tryMove(dx, dy);
        return;
      }
      if (k === 'x' || k === 'X' || k === '.') { doWait(); return; }
      if (k === 'i' || k === 'I') { toggleInventory(); return; }
      if (k === 'h' || k === 'H') { showSkillsPanel(); return; }
      if (k === 'Enter' || k === ' ') {
        if (S.aiming) { activateSkill(S.aiming.skill, S.aiming.cx, S.aiming.cy); S.aiming = null; }
        return;
      }
      if (k === 'Escape') { S.aiming = null; togglePause(); return; }
      var n = parseInt(k, 10);
      if (n >= 1 && n <= 9) {
        var actives = [];
        var c = CLASSES[S.player.cls];
        c.branches.forEach(function (b) {
          BRANCHES[b].order.forEach(function (id) { if (SKILLS[id].type !== 'passive') actives.push(id); });
        });
        var id = actives[n - 1];
        if (id) { beginSkill(id); }
      }
    });
    if (canvas) {
      canvas.addEventListener('pointerdown', function (ev) {
        if (!S || S.mode !== 'playing') return;
        var r = canvas.getBoundingClientRect();
        var tx = Math.floor((ev.clientX - r.left) / r.width * COLS);
        var ty = Math.floor((ev.clientY - r.top) / r.height * ROWS);
        if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
        ev.preventDefault();
        if (S.aiming) {
          activateSkill(S.aiming.skill, tx, ty);
          S.aiming = null;
          return;
        }
        var p = S.player;
        if (p.x === tx && p.y === ty) { doWait(); return; }
        var dx = Math.sign(tx - p.x), dy = Math.sign(ty - p.y);
        if (cheb(tx, ty, p.x, p.y) === 1) { tryMove(dx, dy); return; }
        // caminar en línea recta
        var nx = p.x + dx, ny = p.y + dy;
        if (tileAt(nx, ny) !== WALL) tryMove(dx, dy);
        else mKey('cantMove');
      });
    }
  }

  function togglePause() {
    if (!S || S.mode !== 'playing') return;
    overlay.dataset.panel = 'pause';
    var div = document.createElement('div');
    div.className = 'ov-options';
    var r = document.createElement('button');
    r.className = 'ov-option';
    r.innerHTML = '<div class="opt-title">' + T('resume') + '</div>';
    r.addEventListener('click', function () { hideOverlay(); renderAll(); });
    var q = document.createElement('button');
    q.className = 'ov-option';
    q.innerHTML = '<div class="opt-title">' + T('quit') + '</div>';
    q.addEventListener('click', function () { saveToLS(); showMenu(); });
    div.appendChild(r);
    div.appendChild(q);
    ovAction = function () { hideOverlay(); renderAll(); };
    ovAction2 = function () {};
    showOverlay(T('inventory'), '', div, T('resume'));
  }

  // ============ loop ============
  var lastFrame = 0;
  function loop(ts) {
    if (lastFrame) advanceFx(Math.min(0.05, (ts - lastFrame) / 1000));
    lastFrame = ts;
    draw();
    if (HAS_DOM) requestAnimationFrame(loop);
  }

  function renderClear() {
    if (!HAS_DOM) return;
    hud.classList.add('hidden');
    logEl.classList.add('hidden');
    skillsEl.classList.add('hidden');
  }

  function renderAll() {
    draw();
    renderHud();
    renderLog();
    buildSkills();
    if (invOpen && overlay.dataset.panel === 'inv') renderInventory();
  }

  // ============ boot ============
  if (HAS_DOM) {
    setupDOM();
    showMenu();
  }

  // ============ hooks de prueba ============
  window.__STG_T = {
    HAS_DOM: HAS_DOM,
    T: function () { return T; },
    TF: function () { return TF; },
    newChar: function (cls, mode) {
      S = { mode: 'playing', messages: [], visible: {}, aiming: null };
      S.player = newPlayer(cls, mode);
      newFloor(0, false);
      S.mode = 'playing';
      return true;
    },
    get: function () { return S; },
    move: function (dx, dy) { tryMove(dx, dy); },
    wait: function () { doWait(); },
    skill: function (id, tx, ty) { activateSkill(id, tx, ty); },
    learn: function (id) { learnSkill(id); },
    canLearn: function (id) { return canLearn(id); },
    tileAt: function (x, y) { return tileAt(x, y); },
    visibleAt: function (x, y) { return tileVisible(x, y); },
    calcDerived: function () { return calcDerived(S.player); },
    enemyAt: function (x, y) { return enemyAt(x, y); },
    enemyPhase: function () { enemyPhase(); },
    newFloor: function (f) { newFloor(f, false); },
    setFloor: function (f) { S.floor = f; },
    setPlayerPos: function (x, y) { S.player.x = x; S.player.y = y; computeVisible(); },
    setEnemyHp: function (idx, hp) { S.enemies[idx].hp = hp; },
    clearEnemies: function () { S.enemies = []; },
    spawnEnemyAt: function (kind, x, y) {
      var t = ENEMY_TYPES[kind];
      var e = { id: uid(), kind: kind, name: T('en_' + kind), x: x, y: y, hp: t.hp, maxHp: t.hp, atk: t.atk, def: t.def, xp: t.xp, boss: !!t.boss, frozen: 0, taunted: 0, dead: false, seen: 0, poison: 0, burn: 0 };
      S.enemies.push(e);
      return e;
    },
    giveItem: function (slot, rarity) { var it = genItem(S.floor, slot); it.rarity = rarity; S.player.inv.push(it); return it; },
    equipItem: function (it) { S.player.eq[it.slot] = it; },
    setMode: function (m) { S.mode = m; },
    setRunMode: function (m) { S.player.runMode = m; },
    setMortalDeath: function () { handleDeath(); },
    setHeroDeath: function () { handleDeath(); },
    respawnHero: function () { respawnHero(); },
    showVictory: function () { handleVictory(); },
    hasSave: function () { return hasSave(); },
    save: function () { saveToLS(); },
    load: function () { return loadFromLS(); },
    resetSave: function () { saveRun(null); },
    genItem: function (floor, slot) { return genItem(floor, slot); },
    pMaxHp: function () { return pMaxHp(); },
    pMaxMana: function () { return pMaxMana(); },
    xpNeed: function (l) { return xpNeed(l); },
  };
})();
