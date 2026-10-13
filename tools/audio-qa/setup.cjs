async (page) => {
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({status:200,contentType:'application/json',body:'{"ok":false}'}));
  await page.addInitScript(() => {
    window.__audioBackup = Object.fromEntries(Object.entries(localStorage));
    window.__audioErrors = []; window.__media = []; window.__contexts = []; window.__sources = []; window.__mediaRoutes = [];
    addEventListener('error', e => __audioErrors.push(e.message));
    addEventListener('unhandledrejection', e => __audioErrors.push(String(e.reason)));
    const NativeAudio = window.Audio;
    function Audio(...args) { const el = new NativeAudio(...args); __media.push(el); return el; }
    Audio.prototype = NativeAudio.prototype; window.Audio = Audio;
    const NativeContext = window.AudioContext || window.webkitAudioContext;
    if (NativeContext) {
      function Context(...args) {
        const c = new NativeContext(...args); __contexts.push(c);
        const bs = c.createBufferSource.bind(c); c.createBufferSource = () => {const s = bs(); __sources.push(s); return s;};
        const me = c.createMediaElementSource.bind(c); c.createMediaElementSource = el => {const s=me(el); __mediaRoutes.push({el,ctx:c}); return s;};
        return c;
      }
      Context.prototype = NativeContext.prototype; window.AudioContext = Context; window.webkitAudioContext = Context;
    }
  });
  await page.goto('http://127.0.0.1:8977/index.html');
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
  await page.evaluate(() => { BGM.setCfg({mode:'one',one:'select'}); App.go('settings'); });
  return await page.evaluate(() => ({ios:IS_IOS,protocol:location.protocol,engine:AUDIO_ENGINE.status(),music:BGM.status()}));
}
