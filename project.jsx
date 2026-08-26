// Project detail page renderer. Reads ?id= from URL, looks up in window.PROJECTS,
// renders the techy mono layout. Falls back to a 404 panel if id is missing/unknown.
const { useState, useEffect, useRef } = React;

// ───────── shared modules (window globals) ─────────
// scripts/scroll.jsx    -> useScrub, useReveal, useScrollProgress, useParallax
// scripts/shared-ui.jsx -> Nav, Footer
// This page owns detail sections only; re-declaring any of those names at top
// level here would shadow the shared copy.

// A related row of 3 fills one grid line and stays a suggestion, not a list.
const RELATED_MAX = 3;

// ───────── Scroll-scrubbed motion (Design Spec tables P1–P4) ─────────
// Every table below is a pure function of scroll position: `at` is progress
// through the entry's own trigger range, never elapsed time. The values live
// here, named, so a tuning pass never means reading JSX for numbers.
//
// Detail pages are NOT pinned (Design Note "no pin on project pages") — reading
// speed wins over a second sticky scene.

// P1 / P4 — the one rise recipe on this page: 28px of travel under a fade. The
// overview panel and the link cards differ only in how much of their entry
// range they spend on it.
const RISE_SCRUB = [
  { at: 0, style: { translateY: 28, opacity: 0 } },
  { at: 1, style: { translateY: 0,  opacity: 1 } },
];
const PANEL_RISE_OPTS = { mode: 'enter', endAt: 0.65 };
const CARD_RISE_OPTS = { mode: 'enter', endAt: 0.75 };

// P2 / P3 — media unmasks bottom-up over roughly one viewport of travel. Four
// vertices on both sides: the top edge starts collapsed onto the bottom one and
// lifts to 0%. Released at 1 so a finished figure carries no clip into later
// paints — and so the inner figure's ±24px parallax is never cropped by a mask
// that has already done its job.
const MEDIA_WIPE_SCRUB = [
  { at: 0, style: { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' } },
  { at: 1, style: { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } },
];
const MEDIA_WIPE_OPTS = { mode: 'enter', endAt: 0.35, releaseOnComplete: true };

// P3 — gallery stagger. The offset is the item's index modulo a FIXED column
// count, never the real one: the grid is `auto-fill`, so its column count
// changes with the viewport and would make the motion resize-dependent. The
// engine REMAPS a delayed range rather than truncating it, so every item still
// reaches 1 and still releases.
const GALLERY_STAGGER_COLS = 3;
const GALLERY_STAGGER_STEP = 0.07;
const galleryWipeOpts = (i) => ({
  ...MEDIA_WIPE_OPTS,
  delay: (i % GALLERY_STAGGER_COLS) * GALLERY_STAGGER_STEP,
});

// P4 — the outcomes band steps in behind a paper staircase: six vertices on
// both sides (the interpolator pairs them by index), the middle pair collapsing
// onto the top edge as it flattens. Same recipe as the index work/contact bands
// (Design Spec table W1); the two page modules never co-load, so each states
// its own copy rather than widening the engine's export surface.
const BAND_CLIP_SCRUB = [
  { at: 0, style: { clipPath: 'polygon(0% 34%, 50% 34%, 50% 17%, 100% 17%, 100% 100%, 0% 100%)' } },
  { at: 1, style: { clipPath: 'polygon(0% 0%, 50% 0%, 50% 0%, 100% 0%, 100% 100%, 0% 100%)' } },
];
const BAND_CLIP_OPTS = { mode: 'enter', endAt: 0.55, releaseOnComplete: true };

// ───────── Not found ─────────
function NotFound({ id }){
  return (
    <>
      <Nav page="project" />
      <section className="wrap" data-tone="light">
        <div className="crumbs"><a href="index.html">← index</a><span className="sep">/</span><span className="here">404</span></div>
        <h1 style={{ fontWeight:500, fontSize:'clamp(40px,7vw,88px)', lineHeight:1.02, letterSpacing:'-.04em', margin:'40px 0 16px' }}>
          project <span style={{color:'var(--accent)'}}>{id || 'unknown'}</span> not found.
        </h1>
        <p style={{color:'var(--ink-dim)',fontSize:15,maxWidth:'60ch',margin:'0 0 28px'}}>
          there is no project with that id. head back to the index and pick another.
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
      <span className="mark">{mark}</span>
      <span className="label">{label}</span>
    </div>
  );
}

// ───────── Lightbox ─────────
// Click any grid/image to open the original-size source in a full-screen overlay.
const LightboxContext = React.createContext(() => {});

function Lightbox({ state, onClose }){
  useEffect(() => {
    if(!state) return;
    function onKey(e){ if(e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [state, onClose]);
  if(!state) return null;
  return (
    // .overlay-dark carries the dark ink/line tokens: the overlay is a fixed
    // body-level layer, so it can never inherit a section's tone, and the page
    // tone under it is now light. The scrim colour itself stays an explicit
    // value — it is the component's own surface, not a themed one.
    <div
      className="overlay-dark"
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(8,11,26,0.94)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'4vh 4vw', cursor:'zoom-out' }}
    >
      <span style={{ position:'absolute', top:18, right:24, color:'var(--ink-dim)', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase' }}>esc / click to close</span>
      <figure onClick={(e) => e.stopPropagation()} style={{ margin:0, display:'flex', flexDirection:'column', maxWidth:'92vw', maxHeight:'92vh', cursor:'default' }}>
        <img src={state.src} alt={state.alt || ''} style={{ maxWidth:'92vw', maxHeight: state.caption ? '84vh' : '92vh', width:'auto', height:'auto', objectFit:'contain', border:'1px solid var(--line)', background:'var(--ink-navy)' }} />
        {state.caption && <figcaption style={{ ...mediaCaptionStyle, borderTop:'none', textAlign:'center' }}>{state.caption}</figcaption>}
      </figure>
    </div>
  );
}

// ───────── Media renderers ─────────
// Shared styles inlined so we don't depend on css that doesn't ship in project.html.
// Every colour reads a token, so a figure renders correctly wherever it lands:
// on the light media section, or inside the dark lightbox overlay.
const mediaFigureStyle = {
  margin: 0,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  position: 'relative',
  overflow: 'hidden',
};
// Caption text uses --ink-dim, never --ink-faint: faint is reserved for
// non-text decoration because it falls below AA at every size.
const mediaCaptionStyle = {
  fontFamily: 'var(--fs-mono)',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--ink-dim)',
  padding: '10px 12px',
  borderTop: '1px solid var(--line)',
};
// The frame label sits over arbitrary media, so it carries its own paper chip
// instead of the old difference blend — which only ever resolved against a
// dark page and inverted to mud on paper.
const mediaCornerStyle = {
  position: 'absolute',
  top: 10,
  left: 12,
  color: 'var(--ink-dim)',
  background: 'var(--bg)',
  padding: '3px 7px',
  fontFamily: 'var(--fs-mono)',
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  zIndex: 1,
  pointerEvents: 'none',
};

// The wipe and the parallax must own SEPARATE elements. The mask has to stand
// still while the picture drifts through it: clip-path is applied in the
// element's own coordinate space, so a clip on the parallaxed figure would
// simply travel with it and mask nothing. Outer div = wipe target (static
// window), inner figure = parallax target (the thing that moves inside it).
function MediaImage({ item, frameNo }){
  const openLightbox = React.useContext(LightboxContext);
  const wipeRef = useRef(null);
  const figureRef = useRef(null);
  useScrub(wipeRef, MEDIA_WIPE_SCRUB, MEDIA_WIPE_OPTS);
  useParallax(figureRef);
  return (
    <div ref={wipeRef}>
      <figure ref={figureRef} style={mediaFigureStyle}>
        <span style={mediaCornerStyle}>IMG {String(frameNo).padStart(2,'0')}</span>
        <img
          src={item.src} alt={item.alt || ''} loading="lazy"
          onClick={() => openLightbox({ src:item.src, alt:item.alt, caption:item.caption })}
          style={{ display:'block', width:'100%', height:'auto', cursor:'zoom-in' }}
        />
        {item.caption && <figcaption style={mediaCaptionStyle}>{item.caption}</figcaption>}
      </figure>
    </div>
  );
}

// No parallax on a video: the wipe lands on the figure itself, which carries
// authored inline layout. The engine only ever owns the properties its
// keyframes name (here: clip-path), so releasing restores the authored style
// untouched.
function MediaVideo({ item, frameNo }){
  const figureRef = useRef(null);
  useScrub(figureRef, MEDIA_WIPE_SCRUB, MEDIA_WIPE_OPTS);
  return (
    <figure ref={figureRef} style={mediaFigureStyle}>
      <span style={mediaCornerStyle}>VID {String(frameNo).padStart(2,'0')}</span>
      <video controls preload="metadata" playsInline poster={item.poster} style={{ display:'block', width:'100%', height:'auto', background:'#000' }}>
        <source src={item.src} />
      </video>
      {item.caption && <figcaption style={mediaCaptionStyle}>{item.caption}</figcaption>}
    </figure>
  );
}

function MediaGif({ item, frameNo }){
  const wipeRef = useRef(null);
  const figureRef = useRef(null);
  useScrub(wipeRef, MEDIA_WIPE_SCRUB, MEDIA_WIPE_OPTS);
  useParallax(figureRef);
  return (
    <div ref={wipeRef}>
      <figure ref={figureRef} style={mediaFigureStyle}>
        <span style={mediaCornerStyle}>GIF {String(frameNo).padStart(2,'0')}</span>
        <img src={item.src} alt={item.alt || ''} loading="lazy" style={{ display:'block', width:'100%', height:'auto' }} />
        {item.caption && <figcaption style={mediaCaptionStyle}>{item.caption}</figcaption>}
      </figure>
    </div>
  );
}

function MediaEmbed({ item, frameNo }){
  const figureRef = useRef(null);
  useScrub(figureRef, MEDIA_WIPE_SCRUB, MEDIA_WIPE_OPTS);
  return (
    <figure ref={figureRef} style={{ ...mediaFigureStyle, aspectRatio:'16/9' }}>
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

// One gallery tile = one component, because it owns a ref and a scrub and hooks
// cannot live inside a `.map()`. Each tile wipes on its own progress, offset by
// its column position, so a row unmasks left to right instead of as a slab.
function GalleryItem({ image, frameNo, index }){
  const openLightbox = React.useContext(LightboxContext);
  const figureRef = useRef(null);
  useScrub(figureRef, MEDIA_WIPE_SCRUB, galleryWipeOpts(index));
  return (
    <figure
      ref={figureRef}
      onClick={() => openLightbox({ src:image.src, alt:image.alt, caption:image.caption })}
      style={{ ...mediaFigureStyle, aspectRatio:'4/3', cursor:'zoom-in' }}
    >
      <span style={mediaCornerStyle}>{String(frameNo).padStart(2,'0')}</span>
      <img src={image.src} alt={image.alt || ''} loading="lazy" style={{ display:'block', width:'100%', height:'100%', objectFit:'cover' }} />
      {/* Scrim caption: a dark gradient inside a light section, so it
          carries .overlay-dark to read its ink from the dark scope. */}
      {image.caption && <figcaption className="overlay-dark" style={{ ...mediaCaptionStyle, position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(180deg, transparent, rgba(8,11,26,0.88))', borderTop:'none' }}>{image.caption}</figcaption>}
    </figure>
  );
}

function VideoGalleryItem({ clip, frameNo, index }){
  const figureRef = useRef(null);
  useScrub(figureRef, MEDIA_WIPE_SCRUB, galleryWipeOpts(index));
  return (
    <figure ref={figureRef} style={mediaFigureStyle}>
      <span style={mediaCornerStyle}>VID {String(frameNo).padStart(2,'0')}</span>
      <video controls preload="metadata" playsInline poster={clip.poster} style={{ display:'block', width:'100%', height:'auto', background:'#000' }}>
        <source src={clip.src} />
      </video>
      {clip.caption && <figcaption style={mediaCaptionStyle}>{clip.caption}</figcaption>}
    </figure>
  );
}

function MediaGallery({ item, baseNo }){
  return (
    <div style={{ marginTop:'calc(var(--u)*2)' }}>
      {item.title && (
        <div className="section-tag" style={{ marginBottom:'calc(var(--u)*2)' }}>
          <span className="marker">▸</span>
          <span>{item.title}</span>
          <span className="rule"></span>
          <span>{String(item.items.length).padStart(2,'0')} frames</span>
        </div>
      )}
      <div className="gallery" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {item.items.map((g, i) => (
          <GalleryItem key={i} image={g} frameNo={baseNo + i} index={i} />
        ))}
      </div>
    </div>
  );
}

function MediaVideoGallery({ item, baseNo }){
  return (
    <div style={{ marginTop:'calc(var(--u)*2)' }}>
      {item.title && (
        <div className="section-tag" style={{ marginBottom:'calc(var(--u)*2)' }}>
          <span className="marker">▸</span>
          <span>{item.title}</span>
          <span className="rule"></span>
          <span>{String(item.items.length).padStart(2,'0')} clips</span>
        </div>
      )}
      <div className="gallery" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {item.items.map((v, i) => (
          <VideoGalleryItem key={i} clip={v} frameNo={baseNo + i} index={i} />
        ))}
      </div>
    </div>
  );
}

function MediaSection({ media }){
  if(!media || media.length === 0) return null;
  let frameNo = 0;
  return (
    <section data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[04]</span><span className="eyebrow">media</span><span className="rule"></span>
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
            if(item.type === 'videoGallery'){
              const base = frameNo;
              frameNo += (item.items?.length || 0) - 1;
              return <MediaVideoGallery key={i} item={item} baseNo={base} />;
            }
            return null;
          })}
        </div>
      </div>
    </section>
  );
}

// ───────── Project link cards ─────────

// Real media when the project has any, its letter mark when it doesn't —
// getProjectThumbnail already encodes "first usable image in details.media".
function CardThumb({ project }){
  const src = (typeof window.getProjectThumbnail === 'function') ? window.getProjectThumbnail(project) : null;
  return (
    <div className="card-thumb" aria-hidden="true">
      {src
        ? <img src={src} alt="" loading="lazy" />
        : <span className="mark">{project.mark || '⟁'}</span>}
    </div>
  );
}

// One link card = one component: it owns a ref and a scrub, and hooks cannot
// live inside a `.map()`. Prev/next and the related row are the SAME card — the
// optional `label` line and the `prev`/`next` modifier are the only difference,
// and the modifier is what CSS mirrors the next card with.
//
// The card measures its CONTAINER, never itself: it is translated by its own
// entry, so its own rect would feed the scrub's output back into its input.
function ProjectCard({ project, triggerRef, variant, label }){
  const ref = useRef(null);
  useScrub(ref, RISE_SCRUB, { ...CARD_RISE_OPTS, triggerRef });
  return (
    <a className={variant ? `card ${variant}` : 'card'} href={`project.html?id=${project.id}`} ref={ref}>
      <CardThumb project={project} />
      <div className="card-body">
        {label && <div className="l">{label}</div>}
        <div className="t">{project.title}</div>
        <div className="c">{project.category}</div>
      </div>
    </a>
  );
}

// Same-category peers, in PROJECTS order, never the project you are reading.
// Most categories are singletons, so the whole row renders nothing rather than
// padding itself out with unrelated work.
function RelatedProjects({ project }){
  const gridRef = useRef(null);
  const peers = (window.PROJECTS || [])
    .filter(p => p.category === project.category && p.id !== project.id)
    .slice(0, RELATED_MAX);
  if(peers.length === 0) return null;
  return (
    <div className="related">
      <div className="section-tag section-head reveal">
        <span className="marker section-num">[06]</span><span className="eyebrow">related</span><span className="rule"></span>
        <span>{project.category.toLowerCase()}</span>
      </div>
      <div className="related-grid" ref={gridRef}>
        {peers.map(p => (
          <ProjectCard key={p.id} project={p} triggerRef={gridRef} />
        ))}
      </div>
    </div>
  );
}

// ───────── Page ─────────
function ProjectPage({ project }){
  useReveal();
  const [lightbox, setLightbox] = useState(null);

  // The overview panel and the two link cards are translated by their own
  // entries, so each measures a container that stays put instead of itself.
  const overviewRef = useRef(null);
  const panelRef = useRef(null);
  const outcomesRef = useRef(null);
  const pnavRef = useRef(null);
  useScrub(panelRef, RISE_SCRUB, { ...PANEL_RISE_OPTS, triggerRef: overviewRef });
  useScrub(outcomesRef, BAND_CLIP_SCRUB, BAND_CLIP_OPTS);

  // adjacent projects
  const list = window.PROJECTS;
  const idx = list.findIndex(p => p.id === project.id);
  const prev = list[(idx - 1 + list.length) % list.length];
  const next = list[(idx + 1) % list.length];

  const d = project.details || {};

  return (
    <LightboxContext.Provider value={setLightbox}>
      <Nav page="project" />

      <div className="wrap" data-tone="light">
        <div className="crumbs reveal">
          <a href="index.html">index</a><span className="sep">/</span>
          <a href="index.html#work">work</a><span className="sep">/</span>
          <span className="here">{project.id}</span>
        </div>
      </div>

      <section className="ph ph-overlapped" data-tone="light">
        <div className="wrap">
          <div className="meta reveal">
            <span className="pill"><span className="blip"></span>{project.status}</span>
            <span className="pill">{project.category}</span>
            <span className="pill">{project.year}</span>
            <span className="pill acc">[ idx {String(idx + 1).padStart(2,'0')} / {String(list.length).padStart(2,'0')} ]</span>
          </div>

          {/* Masked line, not a scrub: a short headline parked at half progress
              would read as a cropped line. IO owns it (`.mask-reveal`). */}
          <div className="mask-line">
            <h1 className="mask-reveal text-ink display-1">{project.title}</h1>
          </div>

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
      <section className="overview overview-lead" data-tone="light" ref={overviewRef}>
        <div className="wrap panel-overlap" ref={panelRef}>
          <div className="section-tag section-head reveal">
            <span className="marker section-num">[01]</span><span className="eyebrow">overview</span><span className="rule"></span>
          </div>
          {d.overview && <p className="reveal">{d.overview}</p>}
          {d.problem && (
            <>
              <div className="section-tag section-head reveal" style={{marginTop:'calc(var(--u)*5)'}}>
                <span className="marker section-num">[02]</span><span className="eyebrow">problem</span><span className="rule"></span>
              </div>
              <p className="reveal">{d.problem}</p>
            </>
          )}
        </div>
      </section>

      {/* Approach */}
      {d.approach && d.approach.length > 0 && (
        <section className="approach" data-tone="light">
          <div className="wrap">
            <div className="section-tag section-head reveal">
              <span className="marker section-num">[03]</span><span className="eyebrow">approach</span><span className="rule"></span>
            </div>
            <div>
              {d.approach.map((a, i) => (
                <div className="row" key={i}>
                  <div className="pn">{String(i + 1).padStart(2,'0')} /</div>
                  <div>
                    <div className="pt">{a.t}</div>
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
        <section data-tone="light">
          <div className="wrap">
            <div className="section-tag section-head reveal">
              <span className="marker section-num">[04]</span><span className="eyebrow">frames</span><span className="rule"></span>
              <span>placeholders</span>
            </div>
            <div className="gallery">
              <Frame mark={project.mark} label="overview" frameNo={1} />
              <Frame mark={project.mark} label="detail" frameNo={2} />
            </div>
          </div>
        </section>
      )}

      {/* Outcomes + Stack — the page's one dark band */}
      <section className="sec-dark" data-tone="dark" ref={outcomesRef}>
        <div className="wrap">
          <div className="section-tag section-head reveal">
            <span className="marker section-num">[05]</span><span className="eyebrow">outcomes &amp; stack</span><span className="rule"></span>
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

      {/* Related → Prev/Next → Footer */}
      <section data-tone="light">
        <div className="wrap">
          <RelatedProjects project={project} />
          <div className="pnav" ref={pnavRef}>
            <ProjectCard
              project={prev} triggerRef={pnavRef} variant="prev"
              label={<><span className="acc">←</span> previous</>}
            />
            <ProjectCard
              project={next} triggerRef={pnavRef} variant="next"
              label={<>next <span className="acc">→</span></>}
            />
          </div>
          <Footer page="project" />
        </div>
      </section>

      <Lightbox state={lightbox} onClose={() => setLightbox(null)} />
    </LightboxContext.Provider>
  );
}

// ───────── Mount ─────────
function App(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const project = (window.PROJECTS || []).find(p => p.id === id);

  // Progress bar is page-level, so it runs on the not-found branch too.
  useScrollProgress();

  // Set document title
  useEffect(() => {
    if(project) document.title = `${project.title} — Young Woo Song`;
    else document.title = `Project not found — Young Woo Song`;
  }, [project]);

  if(!project) return <NotFound id={id} />;
  return <ProjectPage project={project} />;
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
