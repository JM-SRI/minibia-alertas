// Minibia Alertas JM v2.0.0 (11-11-2026) — la extensión la baja sola de GitHub (JM-SRI/minibia-alertas) y la mete en la página
// Solo MIRA lo que se ve en pantalla y PITA. No toca el juego, no pulsa nada, no contesta a nadie.
// Pita cada 2 s hasta que JM cierra el cartel rojo (abajo a la izquierda).
(() => {
  const VER = '2.0.0';
  if (window.__jmAlertas && window.__jmAlertas.stop) { try { window.__jmAlertas.stop(); } catch (e) {} }   // versión vieja fuera
  const IV = [], OBS = [];
  const every = (f, ms) => { const i = setInterval(f, ms); IV.push(i); return i; };

  /* ---------- CONFIG ---------- */
  const ME = ['Matadorr', 'Best Mage'];                                   // sus personajes
  const FRIENDS = ['Cofilord', 'Zenku', 'Noah The King', 'Krzychuj', 'Peanut'];
  const NPCS = ['Sandra', 'Chrystal', 'Frederik', 'Alesar', 'Jack Fate'];  // NPCs: nunca alerta aunque digan su nombre
  let cfg = { antibot: true, god: true, nombre: true, suelo: true, vol: 25 };
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem('__jmAlertasCfg') || '{}')); } catch (e) {}
  // ajustes y "Probar pitido" llegan desde el botón de la extensión
  const onMsg = ev => {
    const m = ev.data; if (!m || ev.source !== window) return;
    if (m.__jmAlertasCfg) { cfg = Object.assign(cfg, m.__jmAlertasCfg); try { localStorage.setItem('__jmAlertasCfg', JSON.stringify(cfg)); } catch (e) {} }
    if (m.__jmAlertasTest) fire('prueba', 'v' + VER, 0);
  };
  window.addEventListener('message', onMsg);

  const now = () => Date.now();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ME_RE = new RegExp('\\b(' + ME.map(esc).join('|') + ')\\b', 'i');
  const SELF_LINE = new RegExp('^\\s*(\\d{1,2}:\\d{2}\\s*)?(' + ME.map(esc).join('|') + ')\\b', 'i');
  const STAFF = /god\s*minibia|chancellor/i;
  const AB = /anti-?bot|verification/i;
  const AB_T = /\b(60|30)\s*(s\b|sec|seg)|\b1\s*min/i;
  const SPELL = /^(ex[a-z]*|ut[a-z]*|ad[a-z]*|exevo.*|exura.*|exori.*|utani.*|utamo.*|utana.*|adori.*|adura.*|aaaah\.*|.*\bhur\b.*|.*\bvita\b.*|.*\bgran\b.*)$/i;
  const PRES = /smell you|say something|speak|answer|you live|hear me|for prey|are you there|you there|still alive|are you alive/i;

  /* ---------- SONIDO + CARTEL ---------- */
  const FREQ = { antibot: 1200, god: 900, nombre: 1000, suelo: 700, prueba: 1000 };
  let ac = null;
  function tone(kind) {
    try {
      if (!ac) ac = new AudioContext();
      if (ac.state === 'suspended') ac.resume();
      const g0 = Math.max(0.02, Math.min(1, (cfg.vol || 25) / 100));
      [0, 0.3, 0.6].forEach(d => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = FREQ[kind] || 1000; g.gain.value = g0;
        o.connect(g); g.connect(ac.destination);
        o.start(ac.currentTime + d); o.stop(ac.currentTime + d + 0.18);
      });
    } catch (e) {}
  }
  const A = { active: null, card: null, list: [] };
  function card() {
    if (A.card && A.card.isConnected) return A.card;
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:12px;bottom:12px;max-width:360px;z-index:2147483647;background:#b00;color:#fff;font:bold 13px/1.35 system-ui,sans-serif;padding:8px 12px;border:2px solid #fff;border-radius:8px;cursor:pointer;box-shadow:0 0 14px #f00;display:none';
    d.onclick = () => silence();
    document.body.appendChild(d); A.card = d; return d;
  }
  function render() {
    const c = card();
    c.textContent = '⚠ Inmovilla · ' + A.list.slice(-3).join(' · ') + '  (clic)';
    c.style.display = 'block';
  }
  function silence() { A.active = null; A.list = []; if (A.card) A.card.style.display = 'none'; }
  const lastBy = {};
  function fire(kind, why, dedupMs = 12000) {
    if (kind !== 'prueba' && !cfg[kind]) return;
    const key = kind + '|' + why.slice(0, 80);
    if (lastBy[key] && now() - lastBy[key] < dedupMs) return; lastBy[key] = now();
    // OJO: el cartel no puede llevar palabras que el bot de caza (mv2) vigila (anti-bot, objeto, GOD, su nombre...): se paraba
    const label = { antibot: '🤖 aviso 60/30 s', god: '👑 staff', nombre: '🗣 te hablan', suelo: '📦 algo al lado ' + why.replace(/[^\d,-]/g, ''), prueba: '🔔 prueba ok' }[kind];
    A.list.push(label);
    if (!A.active || kind === 'antibot') A.active = { kind, t0: now() };
    render(); tone(A.active.kind);
  }
  every(() => { if (A.active) tone(A.active.kind); }, 2000);   // no para hasta que cierres el cartel

  /* ---------- TEXTOS (chat, consola, bocadillos, avisos del servidor) ---------- */
  let lastOwnChat = 0;
  const onKey = e => { if (e.isTrusted && e.key === 'Enter') lastOwnChat = now(); };
  document.addEventListener('keydown', onKey, true);

  function speakerOf(t) {
    const m = t.match(/^\s*(?:\d{1,2}:\d{2}\s+)?([^\[:]{2,40}?)\s*(\[\d+\])?\s*(?:says|whispers|yells|speaks)?\s*:/i);
    return m ? { name: m[1].trim(), player: !!m[2] } : null;
  }
  const inList = (n, L) => L.some(x => x.toLowerCase() === String(n || '').toLowerCase());

  function check(raw) {
    const t = String(raw || '').trim();
    if (!t || t.length > 300) return;
    if (/inmovilla|clic para quitar|posible control/i.test(t)) return;   // carteles (los míos o los del bot de caza)
    if (SELF_LINE.test(t)) {                                       // lo que dice él (o el bot por él)
      const said = (t.match(/\b(?:says|whispers|yells)\s*:\s*(.*)$/i) || [])[1];
      if (said && !SPELL.test(said.trim())) lastOwnChat = now();   // hablando con un NPC (hi, trade, travel…): su respuesta no es alerta
      return;
    }
    if (AB.test(t)) { if (AB_T.test(t)) fire('antibot', t); return; }  // solo 60 s / 1 min y 30 s
    const sp = speakerOf(t);
    if (STAFF.test(t) && (sp ? STAFF.test(sp.name) : /says|whispers|yells/i.test(t))) { fire('god', t); return; }
    if (sp && (inList(sp.name, FRIENDS) || inList(sp.name, NPCS))) return;
    if (sp && sp.player) return;                                   // jugadores normales: nada
    if (now() - lastOwnChat < 30000) return;                       // respuesta de un NPC al que acaba de hablar
    const body = sp ? t.slice(t.indexOf(':') + 1) : t;
    if (ME_RE.test(body) || PRES.test(body)) fire('nombre', t, 20000);
  }

  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') { check(m.target.textContent); continue; }
      for (const n of m.addedNodes) {
        const el = n.nodeType === 3 ? n.parentElement : n;
        if (!el || el === A.card || (A.card && A.card.contains(el))) continue;
        if (el.closest && el.closest('#mv2-panel')) continue;
        // si es la etiqueta de nombre de un bicho/jugador (sin texto dicho), no cuenta
        const t = String(n.textContent || '').trim();
        if (el.closest && el.closest('#canvas-id') && !/[:!?.]/.test(t) && t.split(/\s+/).length <= 4) {
          if (cfg.god && STAFF.test(t)) fire('god', 'en pantalla: ' + t, 300000);
          continue;
        }
        check(t);
      }
    }
  }); mo.observe(document.body, { childList: true, subtree: true, characterData: true }); OBS.push(mo);

  // aviso amarillo del servidor y GOD en la lista de Battle (por si no entra como nodo nuevo)
  every(() => {
    const e = document.getElementById('server-message');
    if (e && e.offsetParent !== null) check(e.textContent);
    if (cfg.god) for (const b of document.querySelectorAll('#battle-window .battle-window-target-title')) {
      const n = b.textContent.trim(); if (STAFF.test(n) && n.length < 40) fire('god', 'en Battle: ' + n, 300000);
    }
  }, 1000);

  /* ---------- OBJETO TIRADO AL LADO ---------- */
  // Se compara la imagen de las 5x5 casillas de alrededor (el personaje siempre está en el centro).
  // Una casilla que cambia de golpe y se queda igual 2 s, sin bicho en ella ni al lado, con el personaje quieto = algo nuevo en el suelo.
  // Si cambian muchas a la vez = te has movido (o cambia la luz): se reinicia.
  const S = { c: null, cx: null, hist: [], seen: {}, moveAt: 0, lastTile: {}, mc: null, mcx: null, mprev: null };
  // ¿se ha movido? se compara el minimapa (en el desierto o en suelo liso la pantalla casi no cambia al andar)
  function minimapMoved() {
    const mm = document.getElementById('minimap'); if (!mm || !mm.width) return true;
    if (!S.mc) { S.mc = document.createElement('canvas'); S.mc.width = mm.width; S.mc.height = mm.height; S.mcx = S.mc.getContext('2d', { willReadFrequently: true }); }
    S.mcx.drawImage(mm, 0, 0); const d = S.mcx.getImageData(0, 0, S.mc.width, S.mc.height).data;
    const p = S.mprev; S.mprev = d; if (!p || p.length !== d.length) return true;
    let ch = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 5) { n++; if (Math.abs(d[i] - p[i]) + Math.abs(d[i + 1] - p[i + 1]) + Math.abs(d[i + 2] - p[i + 2]) > 30) ch++; }
    return ch / n > 0.01;
  }
  function inGame() {
    const lw = document.getElementById('login-wrapper');
    return !(lw && lw.offsetParent) && !!document.querySelector('#health-bar');
  }
  function labelsRel() {
    const cw = document.getElementById('canvas-id'), s = document.getElementById('screen');
    if (!cw || !s) return [];
    const T = s.getBoundingClientRect().width / 15;
    const all = [...cw.querySelectorAll('div,span')].filter(e => !e.children.length && e.offsetParent && e.textContent.trim());
    const me = all.find(e => inList(e.textContent.trim(), ME)); if (!me) return [];
    const rm = me.getBoundingClientRect(), out = [];
    for (const e of all) {
      if (e === me) continue; const tx = e.textContent.trim();
      if (tx.length > 30 || /[:!?.]/.test(tx)) continue;
      const r = e.getBoundingClientRect();
      out.push({ dx: Math.round((r.x + r.width / 2 - rm.x - rm.width / 2) / T), dy: Math.round((r.y - rm.y) / T) });
    }
    return out;
  }
  // la imagen del juego (WebGL) solo se puede leer justo después de pintarse: se lee dentro de requestAnimationFrame
  every(() => { if (cfg.suelo && !document.hidden) requestAnimationFrame(sueloTick); else S.hist = []; }, 1000);
  function sueloTick() {
    try {
      if (!inGame()) { S.hist = []; return; }
      const sc = document.getElementById('screen'); if (!sc || !sc.width) return;
      if (!S.c) { S.c = document.createElement('canvas'); S.cx = S.c.getContext('2d', { willReadFrequently: true }); }
      const T = sc.width / 15, W = Math.round(T * 5);
      S.c.width = W; S.c.height = W;
      S.cx.drawImage(sc, 5 * T, 3 * T, T * 5, T * 5, 0, 0, W, W);
      const d = S.cx.getImageData(0, 0, W, W).data;
      let any = 0; for (let i = 0; i < d.length; i += 400) any |= d[i] | d[i + 1] | d[i + 2];
      if (!any) return;   // imagen en negro (no se ha podido leer este frame)
      const t = now();
      // con bichos en Battle (peleando) no se mira: cuerpos, charcos de slime, ondas de hydra… daban falsos avisos
      const mons = [...document.querySelectorAll('#battle-window .battle-window-target-wrapper')].filter(w => w.id !== 'battle-window-target' && w.offsetParent);
      if (mons.length) { S.moveAt = t; S.seen = {}; S.hist = [d]; return; }
      if (minimapMoved()) { S.moveAt = t; S.seen = {}; S.hist = [d]; return; }
      const labs = labelsRel();
      for (const l of labs) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) S.seen[(l.dx + a) + ',' + (l.dy + b)] = t;
      const tt = W / 5;
      const diff = (A1, B1, tx, ty) => {
        let ch = 0, n = 0;
        for (let y = Math.floor(ty * tt + 2); y < (ty + 1) * tt - 2; y += 3) for (let x = Math.floor(tx * tt + 2); x < (tx + 1) * tt - 2; x += 3) {
          const i = (Math.floor(y) * W + Math.floor(x)) * 4; n++;
          if (Math.abs(A1[i] - B1[i]) + Math.abs(A1[i + 1] - B1[i + 1]) + Math.abs(A1[i + 2] - B1[i + 2]) > 90) ch++;
        }
        return n ? ch / n : 0;
      };
      const H = S.hist;
      if (H.length) {
        let moved = 0; const prev = H[H.length - 1];
        for (let ty = 0; ty < 5; ty++) for (let tx = 0; tx < 5; tx++) if ((tx !== 2 || ty !== 2) && diff(d, prev, tx, ty) > 0.18) moved++;
        if (moved >= 7) { S.moveAt = t; S.seen = {}; S.hist = [d]; return; }   // se ha movido la pantalla
      }
      H.push(d); if (H.length > 4) H.shift();
      if (H.length < 4 || t - S.moveAt < 5000) return;   // 5 s quieto como mínimo
      const [f0, f1, f2, f3] = H;   // f0 antes · f1 ya cambiado · f2 y f3 iguales a f1
      let nch = 0;
      for (let ty = 0; ty < 5; ty++) for (let tx = 0; tx < 5; tx++) if ((tx !== 2 || ty !== 2) && diff(f1, f0, tx, ty) > 0.1) nch++;
      if (nch > 2) return;   // un objeto tirado cambia 1 casilla (2 como mucho); más = luz, efectos, scroll…
      for (let ty = 0; ty < 5; ty++) for (let tx = 0; tx < 5; tx++) {
        const dx = tx - 2, dy = ty - 2; if (!dx && !dy) continue;
        const k = dx + ',' + dy;
        if (S.seen[k] && t - S.seen[k] < 600000) continue;          // bicho ahí o al lado (cuerpos, veneno…)
        if (diff(f1, f0, tx, ty) > 0.25 && diff(f2, f1, tx, ty) < 0.05 && diff(f3, f2, tx, ty) < 0.05 && diff(f3, f0, tx, ty) > 0.25) {
          if (S.lastTile[k] && t - S.lastTile[k] < 60000) continue;
          S.lastTile[k] = t;
          fire('suelo', 'casilla ' + k, 60000);
        }
      }
    } catch (e) {}
  }
  window.__jmAlertas = {
    ver: VER,
    stop() { IV.forEach(clearInterval); OBS.forEach(o => o.disconnect()); window.removeEventListener('message', onMsg); document.removeEventListener('keydown', onKey, true); silence(); if (A.card) A.card.remove(); try { ac && ac.close(); } catch (e) {} }
  };
})();
