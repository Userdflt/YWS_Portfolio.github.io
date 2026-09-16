// Optional maintenance: capture the first slide of each published presentation.
import {chromium} from 'playwright';
import fs from 'node:fs';
const resources=JSON.parse(fs.readFileSync('content/project-resources.json','utf8'));
const browser=await chromium.launch();
try {
 await Promise.all(Object.entries(resources).map(async ([id,record])=>{
  const item=record.items.find(i=>i.kind==='presentation');if(!item)return;
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(item.embed,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('svg')?.querySelector('image'),{},{timeout:60000});
  await page.waitForTimeout(2000);
  await page.locator('svg').first().screenshot({path:`resources/${id}/presentation-cover.png`});
  console.log('Captured '+id);
  await page.close();
 }));
} finally {await browser.close();}
