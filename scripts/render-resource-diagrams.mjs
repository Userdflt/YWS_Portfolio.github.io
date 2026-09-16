// One-time/maintenance renderer. The public site uses the checked-in SVGs, not Mermaid JS.
import fs from 'node:fs';
import {chromium} from 'playwright';
const resources=JSON.parse(fs.readFileSync('content/project-resources.json','utf8'));
const diagrams=Object.values(resources).flatMap(record=>record.items).filter(item=>item.definition);
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1800,height:1200}});
 await page.goto('http://localhost:4173/');
 await page.addScriptTag({url:'https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.min.js'});
 await page.evaluate(()=>mermaid.initialize({startOnLoad:false,securityLevel:'strict',htmlLabels:false,theme:'base',fontFamily:'Arial, sans-serif',themeVariables:{primaryColor:'#e9ede5',primaryTextColor:'#213e33',primaryBorderColor:'#758878',lineColor:'#a14d35',secondaryColor:'#f5f3ed',tertiaryColor:'#f5f3ed',background:'#f5f3ed',fontSize:'16px'},flowchart:{htmlLabels:false,curve:'basis',nodeSpacing:32,rankSpacing:50,padding:18}}));
 for (const [index,item] of diagrams.entries()) {
  const definition=fs.readFileSync(item.definition,'utf8');
  const svg=await page.evaluate(async({definition,index})=>{
   const {svg}=await mermaid.render('resourceDiagram'+index,definition);
   const element=new DOMParser().parseFromString(svg,'text/html').querySelector('svg');
   const [, ,width,height]=element.getAttribute('viewBox').split(/\s+/).map(Number);
   element.setAttribute('width',width); element.setAttribute('height',height);
   element.style.removeProperty('max-width');
   return new XMLSerializer().serializeToString(element);
  },{definition,index});
  fs.writeFileSync(item.src,svg.replaceAll('&amp;amp;','&amp;'));
  console.log('Rendered '+item.src);
 }
} finally {await browser.close();}
