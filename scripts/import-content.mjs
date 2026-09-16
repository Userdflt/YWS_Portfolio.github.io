// One-time migration from the previous site's data. Normal editing uses content/projects.json.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('data.jsx','utf8'),context);
const projects = context.window.PROJECTS;
const filenames = ['code-vision','gemini-vision','n8n_rag','notion_mcp','stablediffusion','vision_model','llm','cv','youtube-analytics','nasa-outgassing','ai-detection','wind-energy','ai-visualizations'];
const categories = ['AI applications','Generative AI','Agents & automation','Agents & automation','Generative AI','AI applications','Agents & automation','Computer vision','Data science','Data science','Data science','Data science','Generative AI'];
const covers = ['code_vision','Vision_Studio_Hero','n8n','notion_w_w','stable_sketch','codevision','LLM','output8','youtube_analytics','nasa_outgassing','ai_detection','wind_energy','ai_visual_images/text_to_render/final_w_ppl'];
const rootAssignments = {
 'codevision':['code_vision','comingsoon'],
 'vision-studio':['Vision Studio logo','Vision_Studio_Hero','Vision_Studio_logo2'],
 'n8n-rag':['n8n','ingest','orch','techstackn8n'],
 'notion-mcp':['fastmcp','langchain','mcp_logo','notion','notion_mcp','notion_w_w'],
 'stable-diffusion':['3','6','stable','stable_image','stable_sketch','sd_feature','sd_tech','Screenshot 2025-06-04 093010'],
 'vision-rag':['building_code','codevision','codevision_app','Local_Deployment_Example','Sample_extracted','vit'],
 'llm-rag':['LLM','llmflow','llm_flow_chart','llm_flow_chart_1','llm_flow_chart_2','workflow','Workflow_Diagram'],
 'cv-safety':['cv','cv2','cv3','output1','output8'],
 'youtube-analytics':['youtube_analytics'], 'nasa-outgassing':['nasa_outgassing'], 'ai-detection':['ai_detection'], 'wind-energy':['wind_energy'],
 'ai-visualizations':['image.3','image5','output2','357FF18C-D11F-4763-8269-5DF7E24BCFF6'],
 'about':['me','me_1','me_22','me_3','me_light','portfolio_screenshot']
};
const captions = {
 code_vision:'CodeVision web application', comingsoon:'Early CodeVision teaser artwork', 'Vision Studio logo':'Vision Studio identity', Vision_Studio_Hero:'Vision Studio image-generation interface', Vision_Studio_logo2:'Vision Studio wordmark',
 n8n:'Building Code retrieval system', ingest:'Document ingestion workflow', orch:'Specialist agent orchestration', techstackn8n:'n8n technology stack',
 fastmcp:'FastMCP tool layer', langchain:'Agent orchestration', mcp_logo:'Notion MCP concept', notion:'Notion and MCP integration', notion_mcp:'Notion agent in use', notion_w_w:'Notion MCP project overview',
 stable_sketch:'Original sketch and generated architecture', stable_image:'Sketch-to-image application concept', sd_feature:'Generation and editing capabilities', sd_tech:'Stable Diffusion technology stack', stable:'Generated architectural facade', '3':'Architectural generation study', '6':'Facade and material study',
 building_code:'Building Code document retrieval', codevision:'CodeVision NZ retrieval prototype', codevision_app:'Building Code question and answer interface', Local_Deployment_Example:'Local deployment', Sample_extracted:'Extracted images from source documents', vit:'Vision and retrieval components',
 LLM:'Local language-model retrieval', llmflow:'Retrieval system components', llm_flow_chart:'Retrieval workflow diagram', llm_flow_chart_1:'Agent flow and decision points', llm_flow_chart_2:'Self-correction workflow', workflow:'Retrieval workflow detail', Workflow_Diagram:'System architecture diagram',
 cv:'Construction safety concept', cv2:'Detection technology and capabilities', cv3:'Safety system overview', output1:'Detection across sample images', output8:'Object detection sample output', youtube_analytics:'YouTube analytics dashboard', nasa_outgassing:'Materials research concept', ai_detection:'Human and AI news classification', wind_energy:'Wind turbine power prediction',
 me:'Personal avatar study', me_1:'Personal avatar colour study', me_22:'Personal avatar variation', me_3:'Personal avatar refinement', me_light:'Personal illustration', portfolio_screenshot:'An earlier version of this portfolio',
 'image.3':'Atmospheric interior study', image5:'Curved architectural facade study', output2:'Waterfront architectural study', '357FF18C-D11F-4763-8269-5DF7E24BCFF6':'Architectural concept study', 'Screenshot 2025-06-04 093010':'Sketch-to-render desktop interface'
};
function walk(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);}
const inventory=[];
const images=walk('images').filter(f=>!/\/optimized\//.test(f)&&/\.(png|jpe?g|webp)$/i.test(f));
for(const source of images) {
 const relative=source.replace(/^images\//,'');const stem=path.basename(source,path.extname(source));
 const optimized=`images/optimized/${relative.replace(/\.[^.]+$/,'.webp')}`;
 const src=fs.existsSync(optimized)?optimized:source;
 const isArchitecture=relative.startsWith('ai_visual_images/');
 const owner=isArchitecture?'ai-visualizations':Object.keys(rootAssignments).find(id=>rootAssignments[id].includes(stem));
 if(!owner)throw Error(`Unassigned image: ${source}`);
 let group='Project imagery';
 if(isArchitecture)group=relative.split('/')[1];
 let caption=captions[stem]||stem.replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
 if(isArchitecture && /^[0-9A-F-]{25,}$/i.test(stem))caption='Architectural context study';
 inventory.push({source,src,owner,group,alt:caption,caption});
}
// Preserve optimized-only images, including sketch studies missing original exports.
for(const src of walk('images/optimized/ai_visual_images').filter(f=>f.endsWith('.webp'))) {
 if(inventory.some(a=>a.src===src))continue;
 const stem=path.basename(src,'.webp');
 inventory.push({source:src,src,owner:'ai-visualizations',group:src.split('/')[3],alt:stem.replaceAll('_',' '),caption:stem.replaceAll('_',' ')});
}
projects.forEach((p,i)=>{
 p.slug=filenames[i];p.discipline=categories[i];p.cover=`images/optimized/${covers[i]}.webp`;
 p.repository=p.details.links.find(l=>l.href!=='https://github.com/Userdflt')?.href||null;
 if(p.id==='vision-studio'||p.id==='codevision'||p.id==='ai-visualizations')p.repository=null;
 p.repositoryNote=p.id==='vision-studio'?'A public repository is not currently available.':p.id==='codevision'?'The web application source is not publicly linked. Explore the related open-source retrieval prototype below.':'A visual research collection; no standalone code repository.';
 p.status=p.id==='codevision'?'In development':p.id==='ai-visualizations'?'Visual research':'Project study';
 p.details.links=p.repository?[{label:'View on GitHub',href:p.repository}]:[];
 if(p.id==='vision-rag')p.details.overview=p.details.overview.replace('Building-Code-compliant','Building Code');
 p.gallery=inventory.filter(a=>a.owner===p.id);
 p.videos=[];p.demos=[];
 for(const media of p.details.media){
  if(media.type==='video')p.videos.push({src:media.src,caption:media.caption});
  if(media.type==='videoGallery')p.videos.push(...media.items);
  if(media.type==='gif')p.demos.push(media);
 }
 delete p.href;delete p.mark;delete p.details.media;
});
projects.find(p=>p.id==='codevision').details.outcomes=['Specialist routing for Building Code queries','Clause-level citations for source review','Persistent sessions and streaming responses'];
projects.find(p=>p.id==='codevision').details.overview=projects.find(p=>p.id==='codevision').details.overview.replace('production-grade web application','web application');
projects.find(p=>p.id==='ai-visualizations').title='AI Architectural Visualisations';
projects.find(p=>p.id==='stable-diffusion').title='Sketch to Render';
projects.find(p=>p.id==='cv-safety').title='Construction Safety Vision';
const config={name:'Young Woo Song',role:'AI Specialist for the AEC Industry',email:'youngwoosong@gmail.com',location:'Auckland, New Zealand',github:'https://github.com/Userdflt',linkedin:'https://nz.linkedin.com/in/young-woo-song-145488217',cv:'https://youngwoosongcv.notion.site/Young-Woo-Song-1c964ba2209280bb954ad884c1a11b0f?pvs=74',url:'https://userdflt.github.io/YWS_Portfolio.github.io/'};
fs.mkdirSync('content',{recursive:true});
fs.writeFileSync('content/projects.json',JSON.stringify(projects,null,2)+'\n');
fs.writeFileSync('content/site.json',JSON.stringify(config,null,2)+'\n');
fs.writeFileSync('content/assets.json',JSON.stringify(inventory,null,2)+'\n');
console.log(`Imported ${projects.length} projects and assigned ${inventory.length} original images.`);
