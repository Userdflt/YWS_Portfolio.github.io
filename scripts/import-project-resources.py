"""Prepare checked-in previews from the explicitly audited public repository snapshots.

Optional maintenance command; normal builds are offline and use generated output.
Install scripts/resource-preview-requirements.txt, then run from the repository root.
Notebook code is never executed. Credential-like strings are redacted in previews.
"""
import base64, hashlib, html, io, json, pathlib, re, subprocess, sys, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.preview/python-resources'))
import bleach
import markdown
from PIL import Image

def read_json(path): return json.loads((ROOT / path).read_text(encoding='utf8'))
def save_json(path, value): (ROOT / path).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
def slug(value): return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
def escape(value): return html.escape(str(value), quote=True)
def fetch(url, cache, expected_sha=None):
    path = ROOT / '.preview/resource-cache' / cache
    def matches(data): return not expected_sha or hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==expected_sha
    if not path.exists() or not matches(path.read_bytes()):
        path.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'YWS-Portfolio'}), timeout=90) as r: path.write_bytes(r.read())
    if not matches(path.read_bytes()): raise ValueError('Repository content hash mismatch: '+cache)
    return path.read_bytes()
def redact(text):
    text = re.sub(r'AIza[\w-]{30,}|(?:sk-|hf_)[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}', '[redacted credential]', text)
    return re.sub(r'''(?im)((?:api_?key|access_?token|secret|password)\s*[:=]\s*)["'][^"'\r\n]{12,}["']''', r'\1"[redacted credential]"', text)
TAGS = ['p','br','strong','em','b','i','ul','ol','li','h2','h3','h4','h5','h6','pre','code','blockquote','hr','table','thead','tbody','tr','th','td','a','sup','sub']
def clean_markup(text, source, raw_html=False):
    text = redact(text)
    rendered = text if raw_html else markdown.markdown(text, extensions=['tables','fenced_code','toc'])
    rendered = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', rendered, flags=re.I|re.S)
    rendered = re.sub(r'<(/?)h1\b',r'<\1h2',rendered)
    rendered = bleach.clean(rendered, tags=TAGS, attributes={'a':['href','title','id'],**{h:['id'] for h in ['h2','h3','h4','h5','h6']},'th':['colspan','rowspan'],'td':['colspan','rowspan']}, protocols=['https','http','mailto'], strip=True)
    def link(match):
        href = html.unescape(match.group(1))
        if href.startswith('#'): return '<a href="'+escape(href)+'">'
        href = urllib.parse.urljoin(source, href)
        if not href.startswith(('https://','http://','mailto:')): return '<a>'
        return '<a href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">'
    return re.sub(r'<a href="([^"]*)"[^>]*>',link,rendered)

def reader(path, title, source, content, intro):
    path.parent.mkdir(parents=True, exist_ok=True)
    ids=set()
    def unique_id(match):
        value=match.group(1);candidate=value;number=2
        while candidate in ids: candidate=f'{value}-{number}';number+=1
        ids.add(candidate);return f'id="{candidate}"'
    content=re.sub(r'id="([^"]+)"',unique_id,content)
    content=re.sub(r'<a href="#([^"]+)"[^>]*>(.*?)</a>',lambda m:m.group(0) if urllib.parse.unquote(m.group(1)) in ids else m.group(2),content,flags=re.S)
    path.write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'"><title>{escape(title)} — project resource</title><link rel="stylesheet" href="../../../styles/resource-reader.css"></head><body><header><p class="eyebrow">YWS / PROJECT RESOURCES</p><h1>{escape(title)}</h1><p>{escape(intro)}</p><a href="{escape(source)}" target="_blank" rel="noopener noreferrer">View original on GitHub ↗</a></header><main>{content}</main><footer>Read-only snapshot of the project resource. Refer to GitHub for the latest version.</footer></body></html>''',encoding='utf8')

def image_preview(data, path, max_size=2000):
    image=Image.open(io.BytesIO(data)).convert('RGB')
    image.thumbnail((max_size,max_size))
    path.parent.mkdir(parents=True,exist_ok=True)
    image.save(path,'WEBP',quality=86)
    return list(image.size)

titles={
 'Local_RAG_LLM':'Local LLM retrieval and self-correction',
 'Sketch_to_render_testings':'Sketch to Render experiments',
 'CSS_Image_detection_Inspection':'Construction dataset inspection',
 'Final_YOLO_Model_50_epochs_ovs_norm':'YOLO training · 50 epochs with oversampling',
 'Final_YOLO_Model_70_epochs_norm':'YOLO training · 70 epochs with normalisation',
 'YouTube_Statistics_Analysis':'YouTube statistics analysis',
 'NASA_Outgassing_Materials_Data_Processing':'Materials data processing',
 'NASA_Outgassing_Materials_EDA':'Materials exploratory analysis',
 'NASA_Outgassing_Materials_ML_Modelling':'Materials machine learning models',
 'NASA_Outgassing_Materials_ML_Pipeline':'Materials prediction pipeline',
 'FakeNews_Data_Pre-Processing':'News dataset preprocessing',
 'FakeNews_EDA_Feature_Eng':'News analysis and feature engineering',
 'FakeNews_Classification_Model':'News classification models',
 'Notebook':'Wind energy prediction notebook',
 'Workflow_Diagram':'CodeVision retrieval workflow',
 'flow_chart':'Self-correcting retrieval workflow',
 'Local_Deployment_Example':'Local deployment example',
 'Sample_extracted':'Extracted document content',
 'Webcam_Inference':'Live webcam inference',
 'construction_workers_vid':'Construction site video inference',
}
def title_for(path):
    stem=pathlib.PurePosixPath(path).stem
    if stem.isdigit(): return 'Sketch to Render example '+stem
    if re.fullmatch(r'output\d*',stem): return 'Detection result '+(stem[6:] or '1')
    return titles.get(stem,stem.replace('_',' ').replace('-',' '))

def notebook(data, output, title, source):
    nb=json.loads(data); parts=[]; charts=0
    for index,cell in enumerate(nb['cells'],1):
        text=''.join(cell.get('source',[]))
        if cell['cell_type']=='markdown':
            parts.append('<section class="notebook-note">'+clean_markup(text,source)+'</section>')
        elif cell['cell_type']=='code' and text.strip():
            parts.append(f'<details class="code-cell"><summary>Code cell {index}</summary><pre><code>{escape(redact(text))}</code></pre></details>')
        for result in cell.get('outputs',[]):
            out=result.get('data',{})
            image_type=next((t for t in ['image/png','image/jpeg'] if t in out),None)
            if image_type:
                charts+=1; name=f'chart-{charts:02}.webp'
                image_data=out[image_type]; image_data=''.join(image_data) if isinstance(image_data,list) else image_data
                w,h=image_preview(base64.b64decode(image_data),output.parent/name)
                parts.append(f'<figure><a href="{name}" target="_blank" rel="noopener noreferrer"><img src="{name}" alt="{escape(title)} — output chart {charts}, following code cell {index}" width="{w}" height="{h}" loading="lazy"></a><figcaption>Output {charts} · Code cell {index} · Open image to enlarge</figcaption></figure>')
            elif 'text/html' in out:
                parts.append('<div class="table-output" tabindex="0" role="region" aria-label="Notebook table output">'+clean_markup(''.join(out['text/html']),source,True)+'</div>')
            elif 'text/plain' in out:
                value=''.join(out['text/plain'])
                if len(value)>12000:value=value[:12000]+'\n[Preview shortened. View the full output on GitHub.]'
                parts.append('<details class="text-output"><summary>Text output</summary><pre>'+escape(redact(value))+'</pre></details>')
    reader(output,title,source,''.join(parts),'Read the notebook, inspect the code, and explore saved chart outputs. This preview does not run code; credential-like strings are redacted.')
    return {'cells':len(nb['cells']),'charts':charts}

def main():
    projects={p['id']:p for p in read_json('content/projects.json')}
    assets=read_json('content/assets.json')
    known={}
    for a in assets:
        data=(ROOT/a['source']).read_bytes()
        known[hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()]=a
    for p in projects.values():
        for media in p['demos']+p['videos']:
            path=media['src'].split('#')[0];data=(ROOT/path).read_bytes()
            known[hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()]={'src':path,'source':path}
    manifest={p:{'items':[],'existingSources':{},'excluded':[]} for p in projects}
    for snapshot in read_json('content/repository-resource-sources.json'):
        project=snapshot['project']; output=ROOT/'resources'/project
        output.mkdir(parents=True,exist_ok=True)
        m=manifest[project];m['repository']=snapshot['repository'];m['commit']=snapshot['commit'];m['verified']=snapshot['verified']
        repo=snapshot['repository']; commit=snapshot['commit']; raw=repo.replace('github.com','raw.githubusercontent.com')+'/'+commit+'/'
        source_base=repo+'/blob/'+commit+'/'
        readme=fetch(raw+'README.md',project+'/README.md',snapshot['readmeSha']).decode('utf8')
        for i,match in enumerate(re.finditer(r'```mermaid\s*\n(.*?)```',readme,re.S)):
            resource_id=['agent-workflow','ingestion-workflow'][i] if project=='n8n-rag' else f'diagram-{i+1}'
            source=source_base+'README.md'
            mmd=output/(resource_id+'.mmd');mmd.write_text(match.group(1),encoding='utf8')
            workflow='n8n/Code_Orch_Agent.json' if i==0 else 'n8n/RAG_Ingest.json'
            m['items'].append({'id':resource_id,'kind':'diagram','title':['Agent orchestration workflow','Document ingestion workflow'][i],'description':['How the orchestration agent routes questions to specialist Building Code agents and their vector stores.','From document detection and OCR to text and image embeddings in section-specific knowledge stores.'][i],'src':f'resources/{project}/{resource_id}.svg','definition':mmd.relative_to(ROOT).as_posix(),'source':source,'workflow':source_base+workflow,'download':['n8n/Code_Orch_Agent_u.json','n8n/RAG_Ingest.json'][i]})
        for publication in snapshot['publications']:
            kind='presentation' if '/presentation/' in publication else 'report'
            embed=publication.replace('/pub?','/embed?') if kind=='presentation' else publication+'?embedded=true'
            cover=f'resources/{project}/presentation-cover.webp'
            m['items'].append({'id':kind,'kind':kind,'title':projects[project]['title']+(' · Presentation' if kind=='presentation' else ' · Project report'),'description':'Browse the published slides, including the research approach and findings.' if kind=='presentation' else 'Read the published project report and supporting research.','source':publication,'embed':embed,'discoveredIn':source_base+'README.md','poster':cover if kind=='presentation' and (ROOT/cover).exists() else projects[project]['cover']})
        for f in snapshot['files']:
            path=f['path'];ext=pathlib.PurePosixPath(path).suffix.lower();source=source_base+urllib.parse.quote(path)
            if f['size']<32:
                m['excluded'].append({'path':path,'reason':'Empty placeholder, not a valid media file','bytes':f['size']});continue
            title=title_for(path);rid=slug(path)
            if f['sha'] in known:
                existing=known[f['sha']];m['existingSources'][existing['source']]=source
                # Diagrams receive a prominent preview in the resource library.
                if 'flow' in path.lower():m['items'].append({'id':rid,'kind':'diagram','title':title,'description':'Original system diagram from the project repository.','src':existing['src'],'source':source})
                continue
            data=fetch(raw+urllib.parse.quote(path),project+'/'+path,f['sha'])
            if ext=='.ipynb':
                local=output/rid/'index.html';stats=notebook(data,local,title,source)
                m['items'].append({'id':rid,'kind':'notebook','title':title,'description':f"{stats['cells']} cells · {stats['charts']} saved charts. Read the analysis, code, and recorded results.",'src':local.relative_to(ROOT).as_posix(),'source':source,'poster':f'resources/{project}/{rid}/chart-01.webp' if stats['charts'] else projects[project]['cover'],**stats})
            elif ext in ['.mp4','.gif']:
                local=output/(rid+ext);local.write_bytes(data);poster=output/(rid+'.webp')
                if ext=='.gif':image_preview(data,poster,1280)
                else:subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','0.5','-i',str(local),'-frames:v','1','-vf','scale=1280:-2',str(poster)],check=True)
                m['items'].append({'id':rid,'kind':'video' if ext=='.mp4' else 'animation','title':title,'description':'Original demonstration from the project repository.','src':local.relative_to(ROOT).as_posix(),'poster':poster.relative_to(ROOT).as_posix(),'source':source})
            else:
                local=output/(rid+'.webp');dimensions=image_preview(data,local)
                group=path.split('/')[0] if '/' in path else 'Project imagery'
                group=group.replace('_',' ').replace('w normalisation','with normalisation').replace('w Oversampling','with oversampling')
                m['items'].append({'id':rid,'kind':'image','title':title,'description':group,'src':local.relative_to(ROOT).as_posix(),'source':source,'width':dimensions[0],'height':dimensions[1]})
        guide=output/'documentation'/'index.html'
        reader(guide,projects[project]['title']+' · Documentation',source_base+'README.md',clean_markup(readme,source_base+'README.md'),'Project documentation from GitHub. Diagrams and demonstrations are available in the project resource library.')
        m['items'].append({'id':'documentation','kind':'guide','title':'Project documentation','description':'Read the project overview, setup notes, and technical documentation.','src':guide.relative_to(ROOT).as_posix(),'source':source_base+'README.md','poster':projects[project]['cover']})
        print(project, len(m['items']), 'resources;',len(m['existingSources']),'existing media linked;',len(m['excluded']),'placeholders skipped',flush=True)
    save_json('content/project-resources.json',manifest)

if __name__=='__main__':main()
