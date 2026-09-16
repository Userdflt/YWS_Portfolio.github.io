import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const projects=JSON.parse(fs.readFileSync('content/projects.json','utf8'));
const assets=JSON.parse(fs.readFileSync('content/assets.json','utf8'));
const pages=['index.html','projects.html','about.html','contact.html','project.html','404.html','test-performance.html',...projects.map(p=>`projects/${p.slug}.html`)];
test('Every generated page has working local links, images, scripts, and anchors',()=>{
 const errors=[];
 for(const page of pages){
  const html=fs.readFileSync(page,'utf8');
  for(const [,raw] of html.matchAll(/(?:href|src|poster|data-full|data-gif)="([^"]+)"/g)){
   const href=raw.replaceAll('&amp;','&');
   if(/^(https?:|mailto:|data:)/.test(href))continue;
   const [url,anchor]=href.split('#');
   const localUrl=decodeURI(url.split('?')[0]);
   const file=url?(localUrl.startsWith('/YWS_Portfolio.github.io/')?path.resolve(localUrl.replace('/YWS_Portfolio.github.io/','')):path.resolve(path.dirname(page),localUrl)):path.resolve(page);
   if(!fs.existsSync(file))errors.push(`${page}: missing ${href}`);
   else if(anchor&&file.endsWith('.html')&&!fs.readFileSync(file,'utf8').includes(`id="${anchor}"`))errors.push(`${page}: missing anchor ${href}`);
  }
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,page+' needs one h1');
  assert.ok(html.includes('rel="canonical"'),page+' canonical');
  assert.ok(!html.includes('text/babel'),page+' must not compile JSX in the browser');
 }
 assert.deepEqual(errors,[]);
});
test('Responsive image candidates exist and maintain source identity',()=>{
 const manifest=JSON.parse(fs.readFileSync('content/responsive-images.json','utf8'));
 for(const [source,variants] of Object.entries(manifest)){
  assert.ok(fs.existsSync(source));
  for(const variant of variants){assert.ok(fs.existsSync(variant.src),variant.src);assert.ok(variant.width>0);}
  assert.equal(variants.at(-1).src,source);
 }
});
test('Included project images render and requested gallery exclusions stay excluded',()=>{
 const all=pages.map(p=>fs.readFileSync(p,'utf8')).join('');
 assert.equal(projects.length,13);
 for(const asset of assets){
  assert.ok(fs.existsSync(asset.source),asset.source);
  assert.ok(fs.existsSync(asset.src),asset.src);
  if(asset.galleryExcluded){
   const project=projects.find(project=>project.id===asset.owner);
   assert.ok(!project?.gallery.some(image=>image.source===asset.source),`Excluded gallery image: ${asset.source}`);
  }else assert.ok(all.includes(encodeURI(asset.src)),`Unused image: ${asset.src}`);
  assert.ok(asset.alt.length>0);
 }
 for(const video of fs.readdirSync('Videos').filter(x=>x.endsWith('.mp4')))assert.ok(all.includes(`Videos/${video}`),video);
 for(const gif of fs.readdirSync('gifs').filter(x=>x.endsWith('.gif')))assert.ok(all.includes(`gifs/${gif}`),gif);
});
test('Project source buttons always point to a specific repository',()=>{
 assert.equal(projects.filter(p=>p.repository).length,10);
 for(const p of projects){
  if(p.repository)assert.match(p.repository,/^https:\/\/github\.com\/Userdflt\/[^/]+$/);
  else assert.ok(p.repositoryNote);
 }
});
test('Generated output is deterministic',()=>{
 const prior=Object.fromEntries(pages.map(p=>[p,fs.readFileSync(p,'utf8')]));
 return import('../scripts/build.mjs').then(()=>{for(const page of pages)assert.equal(fs.readFileSync(page,'utf8'),prior[page],page);});
});
test('Available resources are exposed and each preview links to its audited source',()=>{
 const resources=JSON.parse(fs.readFileSync('content/project-resources.json','utf8'));
 const sources=JSON.parse(fs.readFileSync('content/repository-resource-sources.json','utf8'));
 for(const project of projects){
  const record=resources[project.id];
  const html=fs.readFileSync(`projects/${project.slug}.html`,'utf8');
  const hasResources=Boolean(record.items.length||project.gallery.length||project.videos.length||project.demos.length);
  assert.equal(html.includes('id="resources"'),hasResources,project.id);
  assert.equal(html.includes('href="#resources"'),hasResources,project.id+' resource shortcut');
  assert.equal(html.includes('id="project-gallery"'),project.gallery.length>0,project.id+' gallery visibility');
  for(const item of record.items){
   assert.ok(html.includes(`id="resource-${item.id}"`),item.id);
   assert.ok(html.includes(item.source.replaceAll('&','&amp;')),item.source);
   for(const field of ['src','poster','definition','download'])if(item[field])assert.ok(fs.existsSync(item[field]),item[field]);
   if(item.source.startsWith('https://github.com/'))assert.ok(item.source.startsWith(record.repository+'/blob/'+record.commit+'/'));
   if(item.embed)assert.match(item.embed,/^https:\/\/docs\.google\.com\/(presentation|document)\//);
  }
  const audited=sources.find(source=>source.project===project.id);
  if(audited)for(const file of audited.files){
   const source=audited.repository+'/blob/'+audited.commit+'/'+file.path.split('/').map(encodeURIComponent).join('/');
   assert.ok(record.items.some(item=>item.source===source)||Object.values(record.existingSources).includes(source)||record.excluded.some(item=>item.path===file.path),`${project.id}: missing audited resource ${file.path}`);
  }
 }
});
test('Static readers are self-contained, script-free, and have working local assets and anchors',()=>{
 const resources=JSON.parse(fs.readFileSync('content/project-resources.json','utf8'));
 const readers=Object.values(resources).flatMap(r=>r.items).filter(item=>['notebook','guide'].includes(item.kind));
 assert.equal(readers.filter(item=>item.kind==='notebook').length,14);
 for(const item of readers){
  const html=fs.readFileSync(item.src,'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,item.src);
  assert.ok(!/<script\b|<iframe\b|\bonerror\s*=|href="javascript:/i.test(html),item.src);
  assert.ok(html.includes("default-src 'none'"),item.src+' CSP');
  for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(/^(https?:|mailto:)/.test(raw))continue;
   const [url,anchor]=raw.split('#');
   const file=url?path.resolve(path.dirname(item.src),decodeURI(url)):path.resolve(item.src);
   assert.ok(fs.existsSync(file),item.src+': '+raw);
   if(anchor)assert.ok(fs.readFileSync(file,'utf8').includes(`id="${decodeURI(anchor)}"`),item.src+': '+raw);
  }
 }
});
