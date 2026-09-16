import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
const base = 'http://localhost:4173/';
const errors = [];
const scroll = async (page, y) => {
  await page.evaluate(y => scrollTo({top:y,behavior:'instant'}), y);
  await page.waitForTimeout(100);
};
const finished = async page => {
  // History navigation can resolve before pagereveal starts the transition.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => !document.documentElement.dataset.pageTransition && !document.getAnimations().some(animation => animation.playState === 'running' && animation.effect?.pseudoElement?.startsWith('::view-transition')));
};
// Mouse coordinates avoid Playwright scrolling a sticky navigation into view.
async function clickVisible(link) {
  const box = await link.boundingBox();
  await link.page().mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
try {
  for (const [width,height] of [[1440,1000],[768,1024],[390,844],[320,800]]) {
    const context = await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
    const page = await context.newPage();
    page.on('pageerror',error => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => document.querySelector('[data-tablet-hero]').dataset.heroState === 'ready');
    const initial = await page.locator('.tablet-screen').boundingBox();
    await scroll(page,350);
    const enlarged = await page.locator('.tablet-screen').boundingBox();
    assert.ok(enlarged.width > initial.width, `${width}: scroll enlarges the screen`);
    assert.equal(await page.locator('.device-frame').evaluate(e => getComputedStyle(e).opacity),'1');
    assert.ok(await page.evaluate(() => Number(getComputedStyle(document.querySelector('.device-frame')).zIndex) > Number(getComputedStyle(document.querySelector('.home-content')).zIndex)), 'Bezel stays in front of content');
    assert.equal(await page.locator('.home-content').evaluate(e => getComputedStyle(e).opacity),'0','Following sections wait until the viewer enters the tablet');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: no overflow`);
    const zoomEnd = await page.locator('[data-tablet-journey]').evaluate(e => e.getBoundingClientRect().top + scrollY - parseFloat(e.style.getPropertyValue('--tablet-pin-top')) + parseFloat(e.style.getPropertyValue('--tablet-scroll-distance')));
    await scroll(page,Math.ceil(zoomEnd));
    assert.equal(await page.locator('[data-tablet-journey]').getAttribute('data-zoom-progress'),'1.000');
    assert.equal(await page.locator('.home-content').evaluate(e => getComputedStyle(e).opacity),'1');
    const bezel = await page.locator('.device-frame').boundingBox();
    assert.ok(bezel.x >= 0 && bezel.y >= 0 && bezel.x + bezel.width <= width && bezel.y + bezel.height <= height, 'All device edges remain in the viewport');
    await scroll(page,Math.ceil(zoomEnd) + 200);
    assert.deepEqual(await page.locator('.device-frame').boundingBox(),bezel,'Device frame stays fixed while content scrolls');
    await scroll(page,Math.ceil(zoomEnd));
    assert.ok(await page.locator('#perspective h2').isVisible());
    const next = await page.locator('#perspective h2').boundingBox();
    assert.ok(next.y < height && next.y + next.height > 74, `${width}: content takes over the screen`);
    await scroll(page,0);
    const restored = await page.locator('.tablet-screen').boundingBox();
    assert.ok(Math.abs(restored.width - initial.width) < 1, `${width}: scroll reversal restores the tablet`);
    await scroll(page,500);
    await page.locator('.tablet-actions a').first().focus();
    await page.waitForFunction(() => Number(document.querySelector('[data-tablet-journey]').dataset.zoomProgress) === 0);
    await scroll(page,450);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(() => !document.querySelector('.has-tablet-journey'));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.tablet-zoom')).transform === 'none');
    assert.equal(await page.locator('.tablet-layout').evaluate(e => getComputedStyle(e).opacity),'1');
    assert.equal(await page.locator('.device-frame').evaluate(e => getComputedStyle(e).opacity),'1','Reduced motion retains the device shell');
    await context.close();
  }

  const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  const page = await context.newPage();
  page.on('pageerror',error => errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('[data-tablet-hero]').dataset.heroState === 'ready');
  await scroll(page,1400);
  await clickVisible(page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Projects',exact:true}));
  await page.waitForURL('**/projects.html');
  await page.waitForFunction(() => document.documentElement.dataset.pageTransition === 'entering');
  assert.equal(await page.locator('html').getAttribute('data-transition-direction'),'forward');
  assert.ok(await page.evaluate(() => document.getAnimations().some(a => a.effect?.pseudoElement === '::view-transition-new(root)')));
  assert.equal(await page.locator('.device-frame').evaluate(e => getComputedStyle(e).viewTransitionName),'device-frame');
  await finished(page);
  await page.locator('.project-grid .project-image').first().click();
  await page.waitForURL('**/projects/*.html');
  await finished(page);
  assert.equal(await page.locator('.device-frame').evaluate(e => getComputedStyle(e).opacity),'1','Case studies retain the device shell');
  await page.goBack();
  await page.waitForURL('**/projects.html');
  await finished(page);
  assert.equal(await page.locator('html').getAttribute('data-transition-direction'),'back');
  await page.goBack();
  await page.waitForURL(base);
  await finished(page);
  await page.waitForTimeout(150);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - 1400) < 3, 'Back restores home scroll position');
  await page.goForward();
  await page.waitForURL('**/projects.html');
  await finished(page);
  assert.equal(await page.locator('html').getAttribute('data-transition-direction'),'forward');
  await page.evaluate(() => localStorage.setItem('yws-motion','off'));
  await clickVisible(page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'About',exact:true}));
  await page.waitForURL('**/about.html');
  assert.equal(await page.locator('html').getAttribute('data-page-transition'),null);
  assert.equal(await page.locator('.device-frame').evaluate(e => getComputedStyle(e).opacity),'1');
  assert.ok(await page.locator('html').evaluate(e => e.classList.contains('motion-paused')));
  await context.close();

  // The published GitHub Pages path must have the same native navigation behaviour.
  const prefixed = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await prefixed.goto(base+'YWS_Portfolio.github.io/');
  assert.equal(await prefixed.locator('.has-tablet-journey').count(),0);
  await prefixed.locator('.tablet-actions a').first().click();
  await prefixed.waitForURL('**/YWS_Portfolio.github.io/projects.html');
  assert.equal(await prefixed.locator('html').getAttribute('data-page-transition'),null);
  assert.deepEqual(errors,[]);
  console.log('Passed: scroll zoom and reversal at four widths, keyboard access, live reduced motion, native sideways transitions, project links, Back/Forward scroll restoration, saved motion preference, and GitHub Pages prefix.');
} finally { await browser.close(); }
