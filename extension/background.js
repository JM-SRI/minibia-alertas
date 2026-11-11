// Baja la última versión de las alertas de GitHub. Si GitHub falla: la última buena guardada, y si no, la que viene en la extensión.
const API = 'https://api.github.com/repos/JM-SRI/minibia-alertas/contents/alertas.js?ref=main';
const RAW = 'https://raw.githubusercontent.com/JM-SRI/minibia-alertas/main/alertas.js';
async function getCode() {
  const ok = t => t && t.length > 500 && t.includes('__jmAlertas');
  for (const [url, h] of [[API + '&t=' + Date.now(), { Accept: 'application/vnd.github.raw' }], [RAW + '?t=' + Date.now(), {}]]) {
    try { const r = await fetch(url, { headers: h, cache: 'no-store' }); if (r.ok) { const t = await r.text(); if (ok(t)) { await chrome.storage.local.set({ code: t }); return { code: t, from: 'github' }; } } } catch (e) {}
  }
  const s = await chrome.storage.local.get('code'); if (ok(s.code)) return { code: s.code, from: 'guardada' };
  return { code: await (await fetch(chrome.runtime.getURL('alertas.js'))).text(), from: 'extension' };
}
chrome.runtime.onMessage.addListener((m, _s, reply) => { if (m && m.getCode) { getCode().then(reply); return true; } });
