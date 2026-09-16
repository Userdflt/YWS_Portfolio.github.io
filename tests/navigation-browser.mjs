import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const browser = await chromium.launch();
const base = 'http://localhost:4173/';
const errors = [];
fs.mkdirSync('.preview', {recursive:true});

async function tapVisible(locator) {
  const box = await locator.boundingBox();
  assert.ok(box, 'Tap target has a bounding box');
  const point = {x:box.x + box.width / 2, y:box.y + box.height / 2};
  assert.ok(await locator.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), point), 'Tap reaches the navigation, not the tablet');
  await locator.page().touchscreen.tap(point.x, point.y);
}

async function assertOpen(page, allLinks = true) {
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('.site-header').evaluate(element => getComputedStyle(element).opacity), '1');
  const box = await page.locator('.site-nav').boundingBox();
  const viewport = page.viewportSize();
  assert.ok(box.y >= 0 && box.y + box.height <= viewport.height, 'Menu stays within the viewport');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
  if (allLinks) {
    for (const link of await page.locator('.site-nav a').all()) {
      assert.ok(await link.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      }), `Unobscured menu link: ${await link.textContent()}`);
    }
  }
}

try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    for (const width of [320, 390, 480, 640, 768, 1024, 1100]) {
      const context = await browser.newContext({viewport:{width,height:900}, hasTouch:true, reducedMotion});
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.locator('.menu-toggle').waitFor({state:'visible'});
      if (reducedMotion === 'no-preference') await page.waitForFunction(() => document.querySelector('[data-tablet-hero]').dataset.heroState === 'ready');
      await tapVisible(page.locator('.menu-toggle'));
      await assertOpen(page);

      if (reducedMotion === 'no-preference') {
        const midpoint = await page.locator('[data-tablet-journey]').evaluate(element => element.getBoundingClientRect().top + scrollY - parseFloat(element.style.getPropertyValue('--tablet-pin-top')) + parseFloat(element.style.getPropertyValue('--tablet-scroll-distance')) / 2);
        await page.evaluate(y => scrollTo({top:y,behavior:'instant'}), midpoint);
        await page.waitForFunction(() => {
          const progress = Number(document.querySelector('[data-tablet-journey]').dataset.zoomProgress);
          return progress > .4 && progress < .6;
        });
        await assertOpen(page);
      }

      if (width === 390 && reducedMotion === 'no-preference') await page.screenshot({path:'.preview/navigation-foreground.png'});
      await tapVisible(page.getByRole('navigation').getByRole('link',{name:'Projects',exact:true}));
      await page.waitForURL('**/projects.html');
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.waitForFunction(() => !document.documentElement.dataset.pageTransition);
      await tapVisible(page.locator('.menu-toggle'));
      await assertOpen(page);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
      assert.ok(await page.locator('.menu-toggle').evaluate(element => document.activeElement === element));
      await context.close();
      console.log(`Navigation passed: ${width}px, ${reducedMotion}`);
    }
  }

  const context = await browser.newContext({viewport:{width:844,height:320},hasTouch:true,reducedMotion:'reduce'});
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  // Short landscape screens must be able to scroll to the final link on any page.
  for (const path of ['index.html','about.html','contact.html','projects/code-vision.html']) {
    await page.goto(base + path);
    await tapVisible(page.locator('.menu-toggle'));
    await assertOpen(page, false);
    assert.ok(await page.locator('.site-nav').evaluate(element => element.scrollHeight > element.clientHeight));
    await page.locator('.site-nav').evaluate(element => { element.scrollTop = element.scrollHeight; });
    await tapVisible(page.getByRole('navigation').getByRole('link',{name:'Contact',exact:true}));
    await page.waitForURL('**/contact.html');
  }

  await page.goto(base);
  await tapVisible(page.locator('.menu-toggle'));
  await page.setViewportSize({width:1280,height:900});
  await page.waitForFunction(() => document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false');
  assert.ok(await page.locator('.menu-toggle').isHidden());
  assert.ok(await page.getByRole('navigation').getByRole('link',{name:'Projects',exact:true}).isVisible());
  await page.setViewportSize({width:768,height:900});
  assert.ok(await page.locator('.site-nav').isHidden(), 'Returning to compact width leaves the menu closed');
  await tapVisible(page.locator('.menu-toggle'));
  await page.locator('.tablet-description').tap();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false', 'Outside tap closes the menu');
  await context.close();

  const plain = await browser.newContext({viewport:{width:320,height:800},javaScriptEnabled:false});
  const plainPage = await plain.newPage();
  await plainPage.goto(base);
  await plainPage.getByRole('navigation').getByRole('link',{name:'Projects',exact:true}).click();
  await plainPage.waitForURL('**/projects.html');
  await plain.close();
  assert.deepEqual(errors, []);
  console.log('Passed: touch targets above the tablet, zoom with menu open, reduced motion, short-screen scrolling, other-page navigation, Escape, outside tap, resize, and no-JS navigation.');
} finally {
  await browser.close();
}
