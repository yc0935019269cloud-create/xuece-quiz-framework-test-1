const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const out = { checks: [], problems: [] };
const ok = (name, cond, detail) => { out.checks.push({ name, ok: !!cond }); if (!cond) out.problems.push({ name, detail }); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const mode of ['desktop-http', 'mobile-http', 'desktop-file']) {
    const ctx = await browser.newContext({ viewport: mode.startsWith('mobile') ? { width: 390, height: 844 } : { width: 1100, height: 900 }, isMobile: mode.startsWith('mobile'), hasTouch: mode.startsWith('mobile') });
    const page = await ctx.newPage(), errors = [], requests = [];
    let failure = false, hosted = 0;
    page.on('pageerror', e => errors.push(String(e)));
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, body: '{"ok":false}' }));
    await page.route('https://yc0935019269cloud-create.github.io/xuece-quiz-framework-test-1/**', r => {
      hosted++;
      const rel = decodeURIComponent(new URL(r.request().url()).pathname.split('/xuece-quiz-framework-test-1/')[1]);
      r.fulfill({ path: path.join(ROOT, rel), headers: { 'Access-Control-Allow-Origin': '*' } });
    });
    await page.route('https://fsfjvflfmpoohgfdzfpm.supabase.co/**', async r => {
      const url = r.request().url();
      if (url.endsWith('/functions/v1/ai-chat')) {
        const data = r.request().postDataJSON(); requests.push(data);
        const content = data.messages.at(-1).content, images = Array.isArray(content) ? content.filter(p => p.type === 'image_url').length : 0;
        await r.fulfill({ status: failure ? 502 : 200, contentType: 'application/json', body: JSON.stringify(failure ? { error: 'vision_unavailable' } : { text: '測試回應：圖文格式已接收。', images, provider: 'Google', model: 'fixture-vision' }), headers: { 'Access-Control-Allow-Origin': '*' } });
      } else await r.fulfill({ status: 200, contentType: 'application/json', body: url.includes('ai_status') ? '{"allowed":true,"used":0,"limit":null}' : '[]', headers: { 'Access-Control-Allow-Origin': '*' } });
    });
    const url = mode.endsWith('file') ? require('url').pathToFileURL(path.join(ROOT, 'index.html')).href : 'http://127.0.0.1:18778/index.html';
    await page.goto(url); await page.waitForFunction(() => typeof AI !== 'undefined');
    const backup = await page.evaluate(() => ({ ...localStorage }));
    try {
      const spec = await page.evaluate(() => {
        const p = LEARN_UI.packs.find(p => p.id === 'eyelab-vp'), l = p.lessons[0], si = l.steps.findIndex(s => s.type === 'diagram');
        localStorage.setItem(SKEY('cloud'), JSON.stringify({ sess: { at: 'fixture', rt: 'fixture', exp: Math.floor(Date.now() / 1000) + 7200, uid: 'fixture', email: 'fixture@example.invalid' } }));
        const d = LEARN_UI.exportData(); d.cfg.battle = false;
        d.les[p.id + '/' + l.id] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } };
        localStorage.setItem(SKEY('learn'), JSON.stringify(d));
        return { p: p.id, l: l.id, si, img: l.steps[si].img, name: l.steps[si].points[0].name };
      });
      await page.reload(); await page.waitForFunction(() => typeof AI !== 'undefined');
      await page.evaluate(id => { AI.toggle(false); App.go('learn', { pack: id }); }, spec.p); await page.locator('[data-play="0"]').click();
      await page.evaluate(() => AI.open());
      await page.locator('#dgWrap img').evaluate(im => im.decode());
      await page.evaluate(() => AI.open());
      const send = async text => {
        const response = page.waitForResponse(r => r.url().endsWith('/functions/v1/ai-chat'));
        await page.locator('#aiPanel textarea').fill(text); await page.locator('#aiPanel [data-act="send"]').click(); await response;
        await page.waitForFunction(() => !document.querySelector('#aiPanel [data-act="send"]').disabled);
        return requests.at(-1);
      };
      const data = await send('圖上的 1 是什麼？跟旁邊的構造有什麼關係？');
      const content = data.messages.at(-1).content;
      ok(mode + ' ordinary question automatically includes pixels', Array.isArray(content) && content.some(p => p.type === 'image_url' && p.image_url.url.startsWith('data:image/jpeg;base64,')));
      ok(mode + ' current text and point mapping included', content[0].text.includes(spec.name) && content[0].text.includes('編號位置') && content[0].text.includes('目前的學習頁面'));
      ok(mode + ' no obsolete cannot see picture prompt', !data.system.includes('頁面上的圖片和互動動畫你看不到') && !content[0].text.includes('AI 看不到圖片'));
      ok(mode + ' student sees attachment count', await page.locator('.ai-msg.me').last().innerText().then(t => /附 1 張圖片/.test(t)));
      const dims = await page.evaluate(async url => { const im = new Image(); im.src = url; await im.decode(); return [im.width, im.height]; }, content[1].image_url.url);
      ok(mode + ' encoded image retains usable resolution', Math.max(...dims) <= 2048 && Math.min(...dims) > 200);
      if (mode === 'desktop-http') fs.writeFileSync(path.join(ROOT, 'output/playwright/ai-vision-attached.jpg'), Buffer.from(content[1].image_url.url.split(',')[1], 'base64'));
      const follow = await send('那圖上編號 2 呢？');
      ok(mode + ' follow-up keeps current image', Array.isArray(follow.messages.at(-1).content) && follow.messages.length >= 3);
      await page.locator('[data-act="page"]').click();
      await page.waitForFunction(() => !document.querySelector('#aiPanel [data-act="send"]').disabled);
      ok(mode + ' explain-page action remains multimodal', Array.isArray(requests.at(-1).messages.at(-1).content));
      await page.screenshot({ path: path.join(ROOT, `output/playwright/ai-vision-${mode}.png`) });
      if (mode.endsWith('file')) ok(mode + ' file canvas fallback uses configured hosted copy', hosted > 0);
      await page.evaluate(spec => {
        const d = LEARN_UI.exportData(), p = LEARN_UI.packs.find(p => p.id === spec.p), l = p.lessons.find(l => l.id === spec.l), s = l.steps[spec.si];
        const r = { kind: 'term', p: p.id, l: l.id, img: s.img, name: s.points[0].name };
        d.starred = { [JSON.stringify(['term', r.p, r.l, r.img, r.name])]: r };
        App.go('learn', { tab: 'notes' });
      }, spec);
      const note = await send('這個星號名稱在圖上哪裡？');
      ok(mode + ' knowledge notes include selected original image', Array.isArray(note.messages.at(-1).content) && note.messages.at(-1).content[0].text.includes('知識筆記'));
      failure = true; await send('再講解一次這張圖');
      ok(mode + ' explicit vision unavailable message', await page.locator('.ai-msg.bot').last().innerText().then(t => /能看圖.*無法回答/.test(t)));
      failure = false;
      await page.evaluate(() => App.go('hub'));
      const plain = await send('請問自主神經是什麼？');
      ok(mode + ' outside learning stays text only', typeof plain.messages.at(-1).content === 'string');
      await page.evaluate(id => { AI.toggle(false); App.go('learn', { pack: id }); }, spec.p); await page.locator('[data-play="0"]').click();
      await page.evaluate(() => AI.open());
      await page.route('https://missing.invalid/**', r => r.abort());
      await page.locator('#dgWrap img').evaluate(im => { im.src = 'https://missing.invalid/broken.png'; });
      await page.waitForTimeout(100);
      const before = requests.length;
      await page.locator('#aiPanel textarea').fill('這張圖呢？'); await page.locator('#aiPanel [data-act="send"]').click();
      await page.waitForFunction(() => !document.querySelector('#aiPanel [data-act="send"]').disabled);
      ok(mode + ' image read failure does not silently send text', requests.length === before && await page.locator('.ai-msg.bot').last().innerText().then(t => /無法讀取圖片/.test(t)));
      ok(mode + ' no page errors', errors.length === 0, errors);
    } finally {
      await page.evaluate(backup => { localStorage.clear(); Object.entries(backup).forEach(([k, v]) => localStorage.setItem(k, v)); }, backup);
      ok(mode + ' storage restored', JSON.stringify(backup) === await page.evaluate(() => JSON.stringify({ ...localStorage })));
      await ctx.close();
    }
  }
  await browser.close(); fs.writeFileSync(path.join(ROOT, 'output/playwright/ai-vision-browser.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ checks: out.checks.length, problems: out.problems }, null, 2)); process.exitCode = out.problems.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(2); });
