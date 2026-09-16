import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const resources=JSON.parse(fs.readFileSync('content/project-resources.json','utf8'));
const base='http://localhost:4173/';
const browser=await chromium.launch();
const errors=[];
try {
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 for(const item of Object.values(resources).flatMap(r=>r.items).filter(item=>['notebook','guide'].includes(item.kind))){
  await page.goto(base+item.src);
  await page.locator('h1').waitFor();
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(audit.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)})),[],item.src);
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),item.src+' width '+width);
  }
  console.log('Reader verified: '+item.title);
 }
 await page.setViewportSize({width:1280,height:900});
 await page.goto(base+'projects/n8n_rag.html');
 await page.getByRole('link',{name:'View ingestion workflow',exact:false}).click();
 assert.ok(page.url().endsWith('#resource-ingestion-workflow'));
 await page.locator('#resource-ingestion-workflow [data-gallery]').click();
 await page.waitForFunction(()=>document.querySelector('.lightbox-image').naturalWidth>0);
 await page.waitForFunction(()=>{const img=document.querySelector('.lightbox-image');return Math.abs(img.getBoundingClientRect().width-parseFloat(img.style.width))<2;});
 const before=await page.locator('.lightbox-image').evaluate(img=>img.getBoundingClientRect().width);
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await page.waitForFunction(()=>{const img=document.querySelector('.lightbox-image');return Math.abs(img.getBoundingClientRect().width-parseFloat(img.style.width))<2;});
 assert.ok(await page.locator('.lightbox-image').evaluate(img=>img.getBoundingClientRect().width)>before*1.4);
 assert.equal(await page.getByRole('button',{name:'Zoom out',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'Fit image to viewer'}).click();
 assert.equal(await page.locator('.zoom-level').textContent(),'100%');
 await page.keyboard.press('Escape');
 await page.goto(base+'YWS_Portfolio.github.io/projects/nasa-outgassing.html');
 assert.equal(await page.locator('iframe').count(),0,'No viewers preload');
 const notebook=page.locator('[data-resource-kind="notebook"]').first();
 await notebook.click();
 const frame=page.frameLocator('.resource-reading-frame iframe');
 await frame.locator('h1').waitFor();
 assert.match(await frame.locator('h1').innerText(),/Materials data processing/);
 assert.ok((await page.locator('.resource-reading-frame iframe').getAttribute('sandbox')).includes('allow-same-origin'));
 assert.ok(!(await page.locator('.resource-reading-frame iframe').getAttribute('sandbox')).includes('allow-scripts'));
 await frame.locator('details.code-cell').first().locator('summary').click();
 assert.ok(await frame.locator('details.code-cell[open] code').first().isVisible());
 await page.screenshot({path:'.preview/resource-reader-open.png',fullPage:false});
 await page.getByRole('button',{name:'Close preview',exact:false}).click();
 assert.equal(await page.locator('iframe').count(),0);
 assert.ok(await notebook.evaluate(el=>document.activeElement===el));
 await page.goto(base+'projects/cv.html');
 for(const video of await page.locator('#resources-video video').all()){
  await video.evaluate(video=>{video.muted=true;return video.play();});
  await video.evaluate(video=>new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Video did not advance')),10000);
   const check=()=>{if(video.currentTime>0){clearTimeout(timeout);video.removeEventListener('timeupdate',check);resolve();}};
   video.addEventListener('timeupdate',check);check();
  }));
  await video.evaluate(video=>video.pause());
 }
 await page.locator('.resource-more summary').click();
 assert.equal(await page.locator('.resource-image:visible').count(),resources['cv-safety'].items.filter(i=>i.kind==='image').length);
 const slides=page.locator('[data-resource-kind="presentation"]');
 await slides.click();
 const slideFrame=page.frameLocator('.resource-presentation iframe');
 await slideFrame.locator('svg').first().waitFor({timeout:60000});
 assert.ok(await slideFrame.locator('svg').first().isVisible());
 await slideFrame.locator('.punch-viewer-navbar-next').click();
 await slideFrame.locator('[aria-label^="Slide 2 of"]').waitFor({timeout:30000});
 await page.locator('.resource-presentation').screenshot({path:'.preview/presentation-inline.png'});
 await page.getByRole('button',{name:'Close preview',exact:false}).click();
 await page.locator('[data-resource-kind="report"]').click();
 const report=page.frameLocator('.resource-report-frame iframe');
 await report.locator('body').waitFor({timeout:60000});
 await page.waitForFunction(()=>{const frame=document.querySelector('.resource-report-frame iframe');return frame?.src.includes('docs.google.com/document/');});
 assert.ok((await report.locator('body').innerText()).length>1000,'Published report loaded');
 await context.close();
 const noJs=await browser.newContext({javaScriptEnabled:false});
 const plain=await noJs.newPage();await plain.goto(base+'projects/nasa-outgassing.html');
 assert.equal(await plain.locator('iframe').count(),0);
 assert.ok(await plain.locator('#resources-presentation').getByRole('link',{name:'Open original',exact:false}).isVisible());
 assert.ok(await plain.locator('#resources-notebook').getByRole('link',{name:'Open reading view',exact:false}).first().isVisible());
 await noJs.close();
 assert.deepEqual(errors,[]);
 console.log('Passed: 24 readers, responsive accessibility, diagram zoom, inline notebooks, video playback, presentation/report embeds, and no-JS fallbacks.');
} finally {await browser.close();}
