async (page) => {
  const checks = [], check = (ok, msg) => { if (!ok) throw new Error(msg); checks.push(msg); };
  const backup = await page.evaluate(() => __favBackup);
  const snap = () => page.locator('body').ariaSnapshot();
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  const tap = locator => touch ? locator.tap() : locator.click();
  try {
    await snap();
    const first = page.locator('.bank-card').first(), id = await first.getAttribute('data-qid');
    const qsBefore = await page.evaluate(() => JSON.stringify(Store.qs));
    check(await first.locator('.qpreview-choice').count() === 4, 'Bank keeps readable stems and choices');
    if (await page.evaluate(() => IS_IOS)) {
      await page.waitForFunction(() => document.querySelector('.fav-toggle > .hap-sw'));
      check(await first.locator('.fav-toggle .hap-sw').count() === 1, 'iOS native haptic overlay covers favorite button');
    }
    await tap(first.locator('.fav-toggle')); await snap();
    check(await page.evaluate(id => Store.isFavorite(id), id), 'Favorite toggle works with nested haptic input');
    check(await first.locator('.bank-explanation').isHidden(), 'Collecting does not expand explanation');
    check(await page.evaluate(() => JSON.stringify(Store.qs)) === qsBefore, 'Collecting does not record an answer');
    await page.locator('#ff').selectOption('saved'); await snap();
    check(await page.locator('.bank-card').count() === 1, 'All favorites filter finds collected question');
    await tap(first.locator('[data-fav-folders]')); await snap();
    const editor = page.locator('.fav-editor'), name = editor.locator('.fav-create input.px-in');
    await name.fill('考前複習'); await tap(editor.locator('[data-fav-create]'));
    await name.fill('常錯 <重點>'); await tap(editor.locator('[data-fav-create]')); await snap();
    check(await editor.locator('[data-folder]:checked').count() === 2, 'New folders are selected for the current question');
    await name.fill('考前複習'); await tap(editor.locator('[data-fav-create]'));
    check((await editor.locator('.fav-error').textContent()).includes('同名'), 'Duplicate folder name shows a useful validation message');
    const [f1, f2] = await page.evaluate(() => Store.favorites.folders.map(f => f.id));
    await page.screenshot({path:'output/playwright/favorites-folders.png',fullPage:true,animations:'disabled'});
    await tap(page.locator('.fav-modal').getByRole('button', {name:'儲存收藏',exact:true})); await snap();
    check(await page.evaluate(id => Store.favorites.items[id].folders.length === 2, id), 'One question is saved in two folders');
    await tap(first.locator('[data-fav-folders]')); await snap();
    await page.locator('[data-folder="'+f2+'"]').uncheck();
    await tap(page.locator('.fav-modal').getByRole('button',{name:'儲存收藏',exact:true}));
    const removedMembership = await page.evaluate(id => Store.favorites.items[id].folders.length === 1, id);
    await tap(first.locator('[data-fav-folders]')); await snap();
    await page.locator('[data-folder="'+f2+'"]').check();
    await tap(page.locator('.fav-modal').getByRole('button',{name:'儲存收藏',exact:true})); await snap();
    check(removedMembership && await page.evaluate(id => Store.favorites.items[id].folders.length === 2, id), 'Manual folder checkbox changes persist after saving');
    await page.locator('#ff').selectOption('folder:' + f2); await snap();
    check(await page.locator('.bank-card').count() === 1, 'Specific folder filter finds its question');
    check(await page.locator('.fav-label').textContent() === '考前複習、常錯 <重點>', 'Folder names render as escaped text');
    await tap(page.locator('[data-fav-manage]')); await snap();
    await tap(page.locator('.fav-folder-row').last().locator('[data-rename]')); await snap();
    await page.locator('.fav-name').fill('期中複習');
    await tap(page.locator('.fav-modal').last().getByRole('button',{name:'儲存',exact:true})); await snap();
    check(await page.locator('#ff').inputValue() === 'folder:' + f2 && (await page.locator('#ff option:checked').textContent()).includes('期中複習'), 'Renaming retains folder membership and active filter');
    await tap(page.locator('.fav-folder-row').last().locator('[data-delete]')); await snap();
    await tap(page.locator('.modal').last().getByRole('button',{name:'確定',exact:true})); await snap();
    check(await page.evaluate(id => Store.isFavorite(id) && Store.favorites.items[id].folders.length === 1, id), 'Deleting one folder retains question and other membership');
    check(await page.locator('#ff').inputValue() === 'saved', 'Deleting selected folder falls back to all favorites');
    await tap(page.locator('.fav-folder-row').first().locator('[data-delete]')); await snap();
    await tap(page.locator('.modal').last().getByRole('button',{name:'確定',exact:true}));
    await tap(page.locator('.fav-modal').getByRole('button',{name:'完成',exact:true})); await snap();
    await page.locator('#ff').selectOption('unfiled'); await snap();
    check(await page.locator('.bank-card').count() === 1, 'Deleting final folder retains question under unfiled');
    await tap(page.locator('.fav-toggle')); await snap();
    check(await page.locator('.bank-card').count() === 0 && (await page.locator('#cnt').textContent()).includes('0'), 'Unfavoriting updates filtered list and count immediately');
    check(await page.locator('#pg').textContent().then(t => t.includes('1 / 1')), 'Empty favorite filter retains valid pagination');

    await page.evaluate(id => {
      window.__qaRun = Run.create({title:'收藏 QA',subjects:[Store.EX[Store.Q[id].exam].subj],types:['single']}, [id]);
      __qaRun.spawn(); __qaRun.s.mon.mechs = ['haste']; App.go('run', __qaRun);
    }, id); await snap();
    if (await page.getByRole('button',{name:'迎戰！',exact:true}).count()) { await tap(page.getByRole('button',{name:'迎戰！',exact:true})); await snap(); }
    check(await page.locator('#screen .fav-toggle').count() === 1 && await page.locator('.timer').count() === 1, 'Timed expedition exposes favorites beside question');
    const battleBefore = await page.evaluate(() => ({q:CUR.s.curQ,stats:JSON.stringify(CUR.s.stats),hp:CUR.p.hp,qs:JSON.stringify(Store.qs)}));
    await tap(page.locator('#screen .fav-toggle'));
    await tap(page.locator('#screen [data-fav-folders]')); await snap();
    const timeBefore = await page.locator('.timer').textContent();
    await page.waitForTimeout(1500);
    check(await page.locator('.timer').textContent() === timeBefore, 'Expedition countdown pauses while arranging folders');
    await page.keyboard.press('A'); await page.keyboard.press('Enter');
    check(await page.locator('.fav-modal').count() === 1, 'Dialog takes keyboard focus so Enter cannot reopen the underlying folder button');
    check(await page.evaluate(before => CUR.s.curQ === before.q && JSON.stringify(CUR.s.stats) === before.stats && CUR.p.hp === before.hp && JSON.stringify(Store.qs) === before.qs, battleBefore), 'Folder modal blocks answer hotkeys and preserves battle progress');
    await page.locator('.fav-create input.px-in').fill('遠征重點'); await tap(page.locator('[data-fav-create]'));
    await tap(page.locator('.fav-modal').getByRole('button',{name:'儲存收藏',exact:true})); await snap();
    await page.waitForTimeout(1300);
    check(await page.locator('.timer').textContent() !== timeBefore, 'Expedition countdown resumes after folder dialog closes');
    check(await page.locator('#screen .fav-toggle').getAttribute('aria-pressed') === 'true', 'Expedition reflects saved favorite without rerendering answers');
    await page.evaluate(() => App.go('bank')); await snap();
    const folder = await page.evaluate(() => Store.favorites.folders[0].id);
    await page.locator('#ff').selectOption('folder:' + folder); await snap();
    check(await page.locator('.bank-card').count() === 1 && await page.locator('.bank-card').getAttribute('data-qid') === id, 'Ordinary bank finds a question collected during expedition');
    await tap(page.locator('#runit')); await snap();
    check((await page.locator('.modal').textContent()).includes('1 題'), 'Favorite folder can launch an expedition using only its questions');
    await tap(page.locator('.modal button.close')); await snap();

    const exportData = await page.evaluate(() => Store.exportAll());
    check(JSON.parse(exportData).favorites.items[id].folders.includes(folder), 'Backup and cloud payload include favorite folders');
    const combinations = await page.evaluate(({id,folder}) => {
      const q=Store.Q[id], ex=Store.EX[q.exam];
      return Store.filter({favorites:'saved',favoriteFolder:folder,subjects:[ex.subj],exams:[q.exam],types:[q.type],status:'new'}).map(q=>q.id);
    }, {id,folder});
    check(combinations.length === 1 && combinations[0] === id, 'Favorites combine with subject, set, type and status filters');
    await page.evaluate(() => Store.setFavorite(QB.questions[1].id, true));
    await page.evaluate(txt => Store.importAll(txt), exportData);
    check(await page.evaluate(id => Store.favoriteCount() === 1 && Store.isFavorite(id), id), 'New-format import restores exact favorite contents');
    const legacy = JSON.parse(exportData); delete legacy.favorites;
    await page.evaluate(txt => Store.importAll(txt), JSON.stringify(legacy));
    check(await page.evaluate(id => Store.isFavorite(id), id), 'Older backups preserve existing local favorites');
    const unknown = JSON.parse(exportData); unknown.favorites.items['imported_future_id'] = {folders:[folder,'deleted'],at:10};
    await page.evaluate(txt => Store.importAll(txt), JSON.stringify(unknown));
    check(await page.evaluate(() => Store.favorites.items.imported_future_id.folders.length === 1 && Store.favoriteCount() === 1), 'Import retains unavailable question IDs and removes invalid folder references');
    check(await page.evaluate(() => __favErrors.length === 0), 'No JavaScript errors during favorites and expedition flows');
    await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { VOL.set('muted',true); App.go('bank',{favorites:'saved'}); }); await snap();
    check(await page.evaluate(id => Store.isFavorite(id) && Store.favorites.items[id].folders.length === 1, id), 'Favorite memberships persist after reload');
    check(await page.locator('.bank-card').count() === 1, 'Reloaded favorite filter resolves persisted questions');
    await page.setViewportSize({width:390,height:844}); await snap();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '390px favorite bank has no horizontal overflow');
    await page.screenshot({path:'output/playwright/favorites-mobile.png',fullPage:true,animations:'disabled'});
    await tap(page.locator('[data-fav-folders]')); await snap();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.fav-modal,.fav-folder-row')].every(el=>el.getBoundingClientRect().right<=innerWidth)), '390px folder dialog and controls fit screen');
    await page.screenshot({path:'output/playwright/favorites-mobile-folders.png',animations:'disabled'});
    await tap(page.locator('.fav-modal button.close')); await snap();
    await tap(page.locator('.bank-practice')); await snap();
    check(await page.locator('.modal .fav-toggle').count() === 1, 'Regular question practice shares favorite controls');
    const key = await page.evaluate(id => Store.Q[id].key, id);
    await tap(page.locator('.modal .opt[data-l="'+key+'"]'));
    check(await page.evaluate(id => Store.qs[id]?.a === 1, id), 'Answer buttons still record exactly once with favorites and haptics');
    check(await page.evaluate(() => __favErrors.length === 0), 'Reloaded and mobile views have no JavaScript errors');
    return {result:'passed',totalChecks:checks.length,checks,browser:'Edge disposable context',iosPath:await page.evaluate(()=>IS_IOS)};
  } finally {
    await page.evaluate(backup => { RunUI.stopTimer(); VOL.set('muted', true); localStorage.clear(); for (const [k,v] of Object.entries(backup)) localStorage.setItem(k,v); }, backup);
  }
}
