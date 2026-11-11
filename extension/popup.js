const DEF = { antibot: true, god: true, nombre: true, suelo: true, vol: 25 };
let cfg = DEF;
const tab = () => chrome.tabs.query({ active: true, currentWindow: true }).then(t => t[0]);
const send = async m => { const t = await tab(); if (!t) return null; try { return await chrome.tabs.sendMessage(t.id, m); } catch (e) { return null; } };
chrome.storage.local.get({ cfg: DEF }, s => {
  cfg = Object.assign({}, DEF, s.cfg);
  const save = () => { chrome.storage.local.set({ cfg }); send({ cfg }); };
  for (const k of ['antibot', 'god', 'nombre', 'suelo']) { const e = document.getElementById(k); e.checked = cfg[k]; e.onchange = () => { cfg[k] = e.checked; save(); }; }
  const v = document.getElementById('vol'); v.value = cfg.vol; v.onchange = () => { cfg.vol = +v.value; save(); };
});
send({}).then(r => { document.getElementById('ver').textContent = r ? 'v' + r.ver : '(abre esto con el juego delante)'; });
document.getElementById('test').onclick = async () => { await send({ test: true }); window.close(); };
document.getElementById('upd').onclick = async () => { await send({ update: true }); setTimeout(() => send({}).then(r => { document.getElementById('ver').textContent = r ? 'v' + r.ver : ''; }), 2500); };
