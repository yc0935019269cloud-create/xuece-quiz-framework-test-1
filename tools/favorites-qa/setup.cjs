async (page) => {
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({status:200,contentType:'application/json',body:'{"ok":false}'}));
  await page.addInitScript(() => {
    window.__favBackup = Object.fromEntries(Object.entries(localStorage));
    window.__favErrors = [];
    addEventListener('error', e => __favErrors.push(e.message));
    addEventListener('unhandledrejection', e => __favErrors.push(String(e.reason)));
  });
  await page.goto('http://127.0.0.1:8977/index.html');
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
  await page.evaluate(() => { VOL.set('muted', true); App.go('bank'); });
  return await page.evaluate(() => ({ios:IS_IOS,questions:QB.questions.length,favorites:Store.favoriteCount()}));
}
