// Mete las alertas en la página del juego y cada 3 min mira si hay versión nueva: si la hay, la cambia sola (sin F5).
(() => {
  let last = '';
  function inject(code) {
    const s = document.createElement('script'); s.textContent = code + '\n//# sourceURL=minibia-alertas.js';
    (document.head || document.documentElement).appendChild(s); s.remove();
  }
  function check() {
    try {
      chrome.runtime.sendMessage({ getCode: true }, r => {
        if (!r || !r.code || r.code === last) return;
        last = r.code; inject(r.code);
        chrome.storage.local.get('cfg', c => { if (c.cfg) window.postMessage({ __jmAlertasCfg: c.cfg }, '*'); });
      });
    } catch (e) {}
  }
  check(); setInterval(check, 180000);
  chrome.runtime.onMessage.addListener((m, _s, reply) => {
    if (m.cfg) window.postMessage({ __jmAlertasCfg: m.cfg }, '*');
    if (m.test) window.postMessage({ __jmAlertasTest: true }, '*');
    if (m.update) { last = ''; check(); }
    const v = (last.match(/const VER = '([^']+)'/) || [])[1];
    reply({ ver: v || '?' });
  });
})();
