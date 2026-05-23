// Project detail page renderer. Reads ?id= from URL, looks up in window.PROJECTS,
// renders the techy mono layout. Falls back to a 404 panel if id is missing/unknown.
const { useState, useEffect, useRef } = React;

// ───────── shared helpers ─────────
function useReveal(){
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .approach .row, .cell');
    const vh = window.innerHeight;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if(r.top < vh * 0.95 && r.bottom > 0) el.classList.add('in');
    });
    const io = new IntersectionObserver(es => {
      for(const e of es){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => !el.classList.contains('in') && io.observe(el));
    return () => io.disconnect();
  }, []);
}

// Quick scramble that ends on the right word.
function GlyphShuffle({ text, perChar = 60, scrambleMs = 180, fps = 28 }){
  const [, force] = React.useReducer((s) => s + 1, 0);
  const startRef = useRef(0);
  useEffect(() => {
    startRef.current = performance.now();
    let raf;
    function tick(){
      force();
      raf = requestAnimationFrame(() => setTimeout(tick, 1000 / fps));
    }
    tick();
    const stopAt = perChar * text.length + scrambleMs + 80;
    const stop = setTimeout(() => cancelAnimationFrame(raf), stopAt);
    return () => { cancelAnimationFrame(raf); clearTimeout(stop); };
  }, [text]);
  const glyphs = "▓▒░█ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}<>/=*_-";
  const now = performance.now() - startRef.current;
  return (
    <span>
      {text.split("").map((ch, i) => {
        const cs = i * perChar; const ce = cs + scrambleMs;
        let d = ch; let flash = false;
        if(now < cs){ d = ch === " " ? " " : ""; }
        else if(now < ce && ch !== " "){ d = glyphs[(Math.random()*glyphs.length)|0]; flash = true; }
        return <span key={i} style={{ display:'inline-block', minWidth:'.55ch', textAlign:'center', color: flash ? 'var(--accent)' : undefined, textShadow: flash ? '0 0 14px var(--accent-glow)' : 'none' }}>{d || "\u00A0"}</span>;
      })}
    </span>
  );
}

// Scroll progress bar
function useScrollProgress(){
  useEffect(() => {
    function onScroll(){
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (window.scrollY / h) * 100 : 0;
      const bar = document.getElementById('scroll-bar');
      if(bar) bar.style.width = p + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

// ───────── Nav ─────────
function Nav(){
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="index.html" className="brand">
          <span className="dot"></span>
          <span>y_w_song.sh</span>
        </a>
        <div className="nav-links">
          <a href="index.html#work">work</a>
          <a href="index.html#approach">approach</a>
          <a href="index.html#stack">stack</a>
          <a href="index.html#contact">contact</a>
        </div>
        <a className="nav-cta" href="mailto:youngwoo930@gmail.com">connect</a>
      </div>
    </nav>
  );
}

// ───────── Not found ─────────
function NotFound({ id }){
  return (
    <>
      <Nav />
      <section className="wrap">
        <div className="crumbs"><a href="index.html">← index.html</a><span className="sep">/</span><span className="here">404</span></div>
        <h1 style={{ fontWeight:500, fontSize:'clamp(40px,7vw,88px)', lineHeight:1.02, letterSpacing:'-.04em', textTransform:'lowercase', margin:'40px 0 16px' }}>
          project <span style={{color:'var(--accent)'}}>{id || 'unknown'}</span> not found.
        </h1>
        <p style={{color:'var(--ink-dim)',fontSize:15,maxWidth:'60ch',margin:'0 0 28px'}}>
          <span style={{color:'var(--accent)',opacity:.6}}>{'> '}</span>
          this id isn&rsquo;t in the registry. head back to the index and pick another.
        </p>
        <a className="btn btn-primary" href="index.html">return to index ↗</a>
      </section>
    </>
  );
}

// ───────── Frame placeholder ─────────
function Frame({ mark, label, frameNo }){
  return (
    <div className="frame">
      <span className="corner">FRAME {String(frameNo).padStart(2,'0')}</span>
      <span className="corner r">● REC</span>
      <span className="mark">{mark}</span>
      <span className="label">{label}</span>
    </div>
  );
}

// ───────── Media renderers ─────────
// Shared styles inlined so we don't depend on css that doesn't ship in project.html.
const mediaFigureStyle = {
  margin: 0,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  position: 'relative',
  overflow: 'hidden',
};
const mediaCaptionStyle = {
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  padding: '10px 12px',
  borderTop: '1px solid var(--line)',
};
const mediaCornerStyle = {
  position: 'absolute',
  top: 10,
  left: 12,
  color: 'var(--ink-faint)',
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  zIndex: 1,
  pointerEvents: 'none',
  mixBlendMode: 'difference',
};

function MediaImage({ item, frameNo }){
  return (
    <figure className="reveal" style={mediaFigureStyle}>
      <span style={mediaCornerStyle}>IMG {String(frameNo).padStart(2,'0')}</span>
      <img src={item.src} alt={item.alt || ''} loading="lazy" style={{ display:'block', width:'100%', height:'auto' }} />
      {item.caption && <figcaption style={mediaCaptionStyle}>{item.caption}</figcaption>}
    </figure>
  );
}

function MediaVideo({ item, frameNo }){
  return (
    <figure className="reveal" style={mediaFigureStyle}>
      <span style={mediaCornerStyle}>VID {String(frameNo).padStart(2,'0')}</span>
      <span style={{ ...mediaCornerStyle, left:'auto', right:12, color:'var(--accent)' }}>● REC</span>
      <video controls preload="metadata" playsInline poster={item.poster} style={{ display:'block', width:'100%', height:'auto', background:'#000' }}>
        <source src={item.src} />
      </video>
      {item.caption && <figcaption style={mediaCaptionStyle}>{item.caption}</figcaption>}
    </figure>
  );
}

function MediaGif({ item, frameNo }){
  return (
    <figure className="reveal" style={mediaFigureStyle}>
      <span style={mediaCornerStyle}>GIF {String(frameNo).padStart(2,'0')}</span>
      <img src={item.src} alt={item.alt || ''} loading="lazy" style={{ display:'block', width:'100%', height:'auto' }} />
      {item.caption && <figcaption style={mediaCaptionStyle}>{item.caption}</figcaption>}
    </figure>
  );
}

function MediaEmbed({ item, frameNo }){
  return (
    <figure className="reveal" style={{ ...mediaFigureStyle, aspectRatio:'16/9' }}>
      <span style={mediaCornerStyle}>EMBED {String(frameNo).padStart(2,'0')}</span>
      <iframe
        src={item.src}
        title={item.title || 'Embedded content'}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }}
      />
    </figure>
  );
}

function MediaGallery({ item, baseNo }){
  return (
    <div className="reveal" style={{ marginTop:'calc(var(--u)*2)' }}>
      {item.title && (
        <div className="section-tag" style={{ marginBottom:'calc(var(--u)*2)' }}>
          <span className="marker">▸</span>
          <span>{item.title.toLowerCase()}</span>
          <span className="rule"></span>
          <span>{String(item.items.length).padStart(2,'0')} frames</span>
        </div>
      )}
      <div className="gallery" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {item.items.map((g, i) => (
          <figure key={i} style={{ ...mediaFigureStyle, aspectRatio:'4/3' }}>
            <span style={mediaCornerStyle}>{String(baseNo + i).padStart(2,'0')}</span>
            <img src={g.src} alt={g.alt || ''} loading="lazy" style={{ display:'block', width:'100%', height:'100%', objectFit:'cover' }} />
            {g.caption && <figcaption style={{ ...mediaCaptionStyle, position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(180deg, transparent, rgba(5,7,10,0.85))', borderTop:'none' }}>{g.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

function MediaSection({ media }){
  if(!media || media.length === 0) return null;
  let frameNo = 0;
  return (
    <section>
      <div className="wrap">
        <div className="section-tag reveal">
          <span className="marker">[04]</span><span>media</span><span className="rule"></span>
          <span>{media.length} blocks</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'calc(var(--u)*3)' }}>
          {media.map((item, i) => {
            frameNo += 1;
            if(item.type === 'image') return <MediaImage key={i} item={item} frameNo={frameNo} />;
            if(item.type === 'video') return <MediaVideo key={i} item={item} frameNo={frameNo} />;
            if(item.type === 'gif')   return <MediaGif key={i} item={item} frameNo={frameNo} />;
            if(item.type === 'embed') return <MediaEmbed key={i} item={item} frameNo={frameNo} />;
            if(item.type === 'gallery'){
              const base = frameNo;
              frameNo += (item.items?.length || 0) - 1;
              return <MediaGallery key={i} item={item} baseNo={base} />;
            }
            return null;
          })}
        </div>
      </div>
    </section>
  );
}

// ───────── Page ─────────
function ProjectPage({ project }){
  useReveal();
  useScrollProgress();

  // adjacent projects
  const list = window.PROJECTS;
  const idx = list.findIndex(p => p.id === project.id);
  const prev = list[(idx - 1 + list.length) % list.length];
  const next = list[(idx + 1) % list.length];

  const d = project.details || {};

  return (
    <>
      <Nav />

      <div className="wrap">
        <div className="crumbs reveal">
          <a href="index.html">index.html</a><span className="sep">/</span>
          <a href="index.html#work">work</a><span className="sep">/</span>
          <span className="here">{project.id}</span>
        </div>
      </div>

      <section className="ph">
        <div className="wrap">
          <div className="meta reveal">
            <span className="pill"><span className="blip"></span>{project.status}</span>
            <span className="pill">{project.category}</span>
            <span className="pill">{project.year}</span>
            <span className="pill acc">[ idx {String(idx + 1).padStart(2,'0')} / {String(list.length).padStart(2,'0')} ]</span>
          </div>

          <h1 className="reveal reveal-1">
            <GlyphShuffle text={project.title.toLowerCase()} />
          </h1>

          <p className="sub reveal reveal-2">{project.subtitle} — {project.blurb}</p>

          <div className="actions reveal reveal-3">
            {(d.links || []).map((l, i) => (
              <a key={i} className={i === 0 ? "btn btn-primary" : "btn btn-ghost"} href={l.href}>{l.label} ↗</a>
            ))}
            <a className="btn btn-ghost" href="index.html#work">← back to work</a>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="overview">
        <div className="wrap">
          <div className="section-tag reveal">
            <span className="marker">[01]</span><span>overview</span><span className="rule"></span>
          </div>
          {d.overview && <p className="reveal">{d.overview}</p>}
          {d.problem && (
            <>
              <div className="section-tag reveal" style={{marginTop:'calc(var(--u)*5)'}}>
                <span className="marker">[02]</span><span>problem</span><span className="rule"></span>
              </div>
              <p className="reveal">{d.problem}</p>
            </>
          )}
        </div>
      </section>

      {/* Approach */}
      {d.approach && d.approach.length > 0 && (
        <section className="approach">
          <div className="wrap">
            <div className="section-tag reveal">
              <span className="marker">[03]</span><span>approach</span><span className="rule"></span>
            </div>
            <div>
              {d.approach.map((a, i) => (
                <div className="row" key={i}>
                  <div className="pn">{String(i + 1).padStart(2,'0')} /</div>
                  <div>
                    <div className="pt">{a.t.toLowerCase()}</div>
                    <div className="pd">{a.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Media (galleries, images, videos, gifs, embeds) */}
      {d.media && d.media.length > 0 ? (
        <MediaSection media={d.media} />
      ) : (
        <section>
          <div className="wrap">
            <div className="section-tag reveal">
              <span className="marker">[04]</span><span>frames</span><span className="rule"></span>
              <span>placeholders</span>
            </div>
            <div className="gallery">
              <Frame mark={project.mark} label="overview" frameNo={1} />
              <Frame mark={project.mark} label="detail" frameNo={2} />
            </div>
          </div>
        </section>
      )}

      {/* Outcomes + Stack */}
      <section>
        <div className="wrap">
          <div className="section-tag reveal">
            <span className="marker">[05]</span><span>outcomes &amp; stack</span><span className="rule"></span>
          </div>
          <div className="split">
            <div className="cell">
              <div className="sh">05.a / outcomes</div>
              <div className="st">what shipped</div>
              <ul>
                {(d.outcomes || ["Live and in use", "Reproducible setup"]).map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
            <div className="cell">
              <div className="sh">05.b / stack</div>
              <div className="st">{project.tech.length} components</div>
              <div className="stags">
                {project.tech.map(t => <span className="tag" key={t}>{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prev/Next */}
      <section>
        <div className="wrap">
          <div className="pnav">
            <a className="card prev" href={`project.html?id=${prev.id}`}>
              <div className="l"><span className="acc">←</span> previous</div>
              <div className="t">{prev.title.toLowerCase()}</div>
            </a>
            <a className="card next" href={`project.html?id=${next.id}`}>
              <div className="l">next <span className="acc">→</span></div>
              <div className="t">{next.title.toLowerCase()}</div>
            </a>
          </div>
          <div className="footer">
            <div className="footer-inner">
              <span>© 2026 young woo song <span className="acc">·</span> auckland, nz</span>
              <span>build <span className="acc">v2.0</span> · last sync may 2026</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ───────── Mount ─────────
function App(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const project = (window.PROJECTS || []).find(p => p.id === id);

  // Set document title
  useEffect(() => {
    if(project) document.title = `${project.title} — Young Woo Song`;
    else document.title = `Project not found — Young Woo Song`;
  }, [project]);

  if(!project) return <NotFound id={id} />;
  return <ProjectPage project={project} />;
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
