// Project detail page renderer. Reads ?id= from URL, looks up in window.PROJECTS,
// renders the techy mono layout. Falls back to a 404 panel if id is missing/unknown.
const { useState, useEffect, useRef } = React;

// ───────── shared modules (window globals) ─────────
// scripts/scroll.jsx    -> useScrub, useReveal, useScrollProgress, useParallax,
//                          useSmoothScroll
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

// P2 / P3 — media unmasks bottom-up over most of a viewport of travel. Four
// vertices on both sides: the top edge starts collapsed onto the bottom one and
// lifts to 0%. Released at 1 so a finished figure carries no clip into later
// paints — and so the inner figure's ±24px parallax is never cropped by a mask
// that has already done its job.
//
// `enter` span = vh × (1 − endAt), so a LOWER endAt is a LONGER, slower wipe:
// 0.18 spends ~82% of a viewport unmasking (Design Spec table W′).
const MEDIA_WIPE_SCRUB = [
  { at: 0, style: { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' } },
  { at: 1, style: { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } },
];
const MEDIA_WIPE_OPTS = { mode: 'enter', endAt: 0.18, releaseOnComplete: true };

// P3 — gallery stagger. The offset is the item's index modulo a FIXED column
// count, never the real one: the grid is `auto-fill`, so its column count
// changes with the viewport and would make the motion resize-dependent. The
// engine REMAPS a delayed range rather than truncating it, so every item still
// reaches 1 and still releases.
const GALLERY_STAGGER_COLS = 3;
const GALLERY_STAGGER_STEP = 0.10;
const galleryWipeOpts = (i) => ({
  ...MEDIA_WIPE_OPTS,
  delay: (i % GALLERY_STAGGER_COLS) * GALLERY_STAGGER_STEP,
});

// P4 — the outcomes band steps in behind a paper staircase: six vertices on
// both sides (the interpolator pairs them by index), the middle pair collapsing
// onto the top edge as it flattens. Same recipe as the index work/contact bands
// (Design Spec table W1); the two page modules never co-load, so each states
// its own copy rather than widening the engine's export surface.
// Step depths are VIEWPORT fractions, not section fractions — on a tall
// section a %-of-section step plays off-screen. Function keyframes resolve in
// the engine's READ pass, so the offsetHeight read is batched. Kept in step
// with app.jsx's bandClipScrub.
const BAND_STEP_VH = 0.34;
function bandClipScrub(sectionRef){
  const stepped = (ctx) => {
    const h = (sectionRef.current && sectionRef.current.offsetHeight) || ctx.vh;
    const s1 = Math.min((BAND_STEP_VH * ctx.vh) / h, 1) * 100;
    const s2 = s1 / 2;
    return 'polygon(0% ' + s1 + '%, 50% ' + s1 + '%, 50% ' + s2 + '%, 100% ' + s2 + '%, 100% 100%, 0% 100%)';
  };
  return [
    { at: 0, style: { clipPath: stepped } },
    { at: 1, style: { clipPath: 'polygon(0% 0%, 50% 0%, 50% 0%, 100% 0%, 100% 100%, 0% 100%)' } },
  ];
}
// `enter` span = vh × (1 − endAt), so a LOWER endAt is a LONGER, slower step-in
// and endAt 0 is the mode's ceiling of one whole viewport: 0.06 spends ~94% of a
// viewport on the staircase, against the previous 0.35 (~65%), which flattened
// before the steps had been read as steps. Released at 1 — a finished band must
// not carry a clip into every later paint. Kept in step with app.jsx's copy.
const BAND_CLIP_OPTS = { mode: 'enter', endAt: 0.06, releaseOnComplete: true };

// P5 — the full-bleed band under the project title pushes in slowly across its
// own crossing. `cross` (not `enter`): the band sits at or above the fold on
// load, so an `enter` range evaluated mid-viewport would rest part-played. The
// WRAPPER is the trigger and the image is the target — progress may never be
// read from a node the same entry transforms.
const PROJECT_BAND_SCRUB = [
  { at: 0, style: { scale: 1 } },
  { at: 1, style: { scale: 1.10 } },
];
const PROJECT_BAND_OPTS = { mode: 'cross' };

// A1 / X1 — the lateral counterpart of RISE_SCRUB: 24px of travel under the
// same fade, mirrored so a list of rows arrives from alternating sides. Both
// tables are consumed the same way — a row picks one by its index parity, and
// the choice is fixed for the row's lifetime, so the entry registers once.
const SLIDE_LEFT_SCRUB = [
  { at: 0, style: { translateX: -24, opacity: 0 } },
  { at: 1, style: { translateX: 0,   opacity: 1 } },
];
const SLIDE_RIGHT_SCRUB = [
  { at: 0, style: { translateX: 24, opacity: 0 } },
  { at: 1, style: { translateX: 0,  opacity: 1 } },
];
const SLIDE_OPTS = { mode: 'enter', endAt: 0.7 };

// A2 — the architecture connector DRAWS itself: the engine scrubs a plain
// `--scrub` number and CSS turns it into `scaleY`. The property is written on
// the line, the progress is read from the LIST — a scaled element must never
// measure itself. The CSS fallback is 1, which is why reduced motion renders
// the finished line with no extra rule (Design Spec A2).
const ARCH_LINE_SCRUB = [
  { at: 0, style: { '--scrub': 0 } },
  { at: 1, style: { '--scrub': 1 } },
];
// Shorter than SLIDE_OPTS on purpose: the connector must reach the last row
// before the rows it connects have finished arriving.
const ARCH_LINE_OPTS = { mode: 'enter', endAt: 0.35 };

// C1 — capability cards spend a little less of their range than the link cards.
const FEATURE_RISE_OPTS = { mode: 'enter', endAt: 0.7 };
// M1 / X2 — metric tiles and outcome bullets take the engine's default enter
// span: both live inside the outcomes band, which clips itself in on its own
// range, and a longer entry would leave them mid-rise under a finished band.
const TILE_RISE_OPTS = { mode: 'enter' };

// Stagger steps. The capabilities grid is a FIXED two columns (unlike the
// auto-fill galleries), so `index % FEATURE_STAGGER_COLS` is the real column
// at every viewport and the offset never depends on a resize. Metric tiles and
// outcome bullets are single files, so they stagger on the raw index.
const FEATURE_STAGGER_COLS = 2;
const FEATURE_STAGGER_STEP = 0.12;
const METRIC_STAGGER_STEP = 0.10;
const OUTCOME_STAGGER_STEP = 0.08;

// F1 / R1 — the facts grid and the comparison rows take the engine's default
// enter span. Both are dense blocks of short rows read as ONE unit, so a longer
// entry would leave the last row still rising after the block has been read.
// Their steps are half the feature grid's: a row is a line, not a card, and the
// run has up to eight of them.
const GRID_RISE_OPTS = { mode: 'enter' };
const COMPARE_STAGGER_STEP = 0.06;
const FACT_STAGGER_STEP = 0.06;

// ───────── Section numbering ─────────
// Sections are OPTIONAL, so their numbers cannot be literals: a project with no
// problem statement and no architecture list must still read 01, 02, 03 with no
// gaps. The order below is document order; only the keys actually rendered take
// a number.
const SECTION_ORDER = ['overview', 'problem', 'approach', 'pipeline', 'capabilities', 'architecture', 'media', 'comparison', 'outcomes', 'related'];

// The optional data-driven sections are presence-tested in exactly ONE place.
// `sectionNumbers` assigns a number from these predicates and the JSX guards
// render from the same ones, so a section can never take a number it does not
// draw — the failure mode a second, hand-written `d.pipeline && …` test invites.
const isNonEmptyArray = (v) => Array.isArray(v) && v.length > 0;
const hasPipeline = (d) => isNonEmptyArray(d.pipeline);
const hasComparison = (d) => !!d.comparison && isNonEmptyArray(d.comparison.rows);
const hasFacts = (d) => isNonEmptyArray(d.facts);

function sectionNumbers(d, hasPeers){
  const present = {
    overview: true,
    problem: !!d.problem,
    approach: !!(d.approach && d.approach.length),
    pipeline: hasPipeline(d),
    capabilities: !!(d.features && d.features.length),
    architecture: !!(d.architecture && d.architecture.length),
    media: true,
    comparison: hasComparison(d),
    outcomes: true,
    related: !!hasPeers,
  };
  const numbers = {};
  let n = 0;
  for(const key of SECTION_ORDER){
    if(present[key]) numbers[key] = String(++n).padStart(2, '0');
  }
  return numbers;
}

// The bracket is presentation, so the raw "01" stays available for the
// outcomes band's "05.a / 05.b" sub-labels.
const sectionMarker = (n) => `[${n}]`;

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

function MediaSection({ media, number }){
  if(!media || media.length === 0) return null;
  let frameNo = 0;
  return (
    <section data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">{sectionMarker(number)}</span><span className="eyebrow">media</span><span className="rule"></span>
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

// ───────── Facts grid (details.facts) ─────────

// One fact = one component, because it owns a ref and a scrub and hooks cannot
// live inside a `.map()` (GalleryItem precedent). The GRID is the shared
// trigger: a card is translated by its own entry, so its own rect would feed
// the scrub's output back into its input, and one trigger keeps the cards on a
// single staggered run instead of each restarting at its own crossing.
function FactCard({ fact, index, triggerRef }){
  const cardRef = useRef(null);
  useScrub(cardRef, RISE_SCRUB, { ...GRID_RISE_OPTS, triggerRef, delay: index * FACT_STAGGER_STEP });
  return (
    <div className="fact" ref={cardRef}>
      <div className="fk eyebrow">{fact.k}</div>
      <div className="fv">{fact.v}</div>
    </div>
  );
}

// Rides INSIDE the overview panel, directly under the overview paragraph, and
// takes no section number of its own: only the ten repo-matched projects carry
// the field, and a section that exists for ten projects in thirteen would make
// the numbering read as arbitrary (MetricsBand precedent).
//
// Composed motion is accepted here: the grid ref is translated by the PANEL's
// entry, never by a card's, so there is no self-feedback — and the panel
// (endAt 0.65) has typically settled before the cards enter.
function FactsGrid({ facts }){
  const gridRef = useRef(null);
  if(!isNonEmptyArray(facts)) return null;
  return (
    <div className="facts-grid" ref={gridRef}>
      {facts.map((f, i) => <FactCard key={f.k} fact={f} index={i} triggerRef={gridRef} />)}
    </div>
  );
}

// ───────── Pipeline (details.pipeline) ─────────

// Badges are CONTENT, not decoration: they state the branch or loop the source
// README documents, so they inherit the row's slide and register no hook of
// their own. Only the GLYPH is hidden from assistive tech — "↩" announces as
// punctuation, while the label beside it already says what the badge means.
const BADGE_GLYPH = { loop: '↩', branch: '→' };

// One step = one component, on the ApproachRow contract: the WRAPPER is the
// trigger, because the row itself is translated by this entry.
function PipeStep({ step, index }){
  const triggerRef = useRef(null);
  const rowRef = useRef(null);
  useScrub(rowRef, (index % 2 === 0) ? SLIDE_LEFT_SCRUB : SLIDE_RIGHT_SCRUB, { ...SLIDE_OPTS, triggerRef });
  const badges = isNonEmptyArray(step.badges) ? step.badges : [];
  return (
    <div className="pipe-trigger" ref={triggerRef}>
      <div className="pipe-row" ref={rowRef}>
        <div className="pp-n">{String(index + 1).padStart(2,'0')} /</div>
        <div>
          <div className="pp-t">{step.t}</div>
          {badges.length > 0 && (
            <div className="pipe-badges">
              {badges.map((b, i) => (
                <span className={`pipe-badge pipe-badge--${b.kind}`} key={i}>
                  <span className="pb-g" aria-hidden="true">{BADGE_GLYPH[b.kind] || BADGE_GLYPH.branch}</span>
                  <span className="pb-l">{b.label}</span>
                </span>
              ))}
            </div>
          )}
          <div className="pp-d">{step.d}</div>
        </div>
      </div>
    </div>
  );
}

// The hooks run before the empty-field bail-out, never inside it
// (ArchitectureSection precedent): hook order has to be identical on every
// render, and a null `lineRef.current` is already the engine's own no-op path.
//
// The connector REUSES the architecture tables as-is — same drawn line, same
// short range, so the new section speaks the page's existing motion grammar. It
// is decoration (it repeats the sequence the numbered steps already state), so
// it is hidden from assistive tech rather than described.
function PipelineSection({ pipeline, number }){
  const listRef = useRef(null);
  const lineRef = useRef(null);
  useScrub(lineRef, ARCH_LINE_SCRUB, { ...ARCH_LINE_OPTS, triggerRef: listRef });
  if(!isNonEmptyArray(pipeline)) return null;
  return (
    <section data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">{sectionMarker(number)}</span><span className="eyebrow">how it works</span><span className="rule"></span>
          <span>{String(pipeline.length).padStart(2,'0')} steps</span>
        </div>
        <div className="pipe-list" ref={listRef}>
          {pipeline.map((s, i) => <PipeStep key={i} step={s} index={i} />)}
          <span className="pipe-line" ref={lineRef} aria-hidden="true"></span>
        </div>
      </div>
    </section>
  );
}

// ───────── Comparison (details.comparison) ─────────

// An ARIA grid-table, NOT a native <table>: per-row transforms on a `<tr>` are
// engine-inconsistent, while a grid row is a clean transform target. The column
// template is declared ONCE on the table as `--compare-cols` and inherited by
// every row, so the header and the body can never disagree about widths.
const COMPARE_NOTE_ID = 'compare-note';
const COMPARE_FIRST_COL = 'minmax(160px, 1.6fr)';
const COMPARE_REST_COL = 'minmax(90px, 1fr)';
const compareCols = (count) => `${COMPARE_FIRST_COL} repeat(${Math.max(count - 1, 1)}, ${COMPARE_REST_COL})`;

// The first cell is the row's HEADER — it names what the values beside it
// describe. The winner row states its status in text as well as in colour: an
// accent border and a tinted fill are not available to a screen reader.
function CompareRow({ row, index, isWin, triggerRef }){
  const rowRef = useRef(null);
  useScrub(rowRef, RISE_SCRUB, { ...GRID_RISE_OPTS, triggerRef, delay: index * COMPARE_STAGGER_STEP });
  return (
    <div className={isWin ? 'compare-row compare-row--win' : 'compare-row'} role="row" ref={rowRef}>
      <span className="compare-cell compare-cell--head" role="rowheader">
        {row[0]}{isWin && <span className="compare-win-flag">Winner</span>}
      </span>
      {row.slice(1).map((cell, i) => (
        <span className="compare-cell" role="cell" key={i}>{cell}</span>
      ))}
    </div>
  );
}

// `highlightRow` is data, not a name match: the row is highlighted only where
// the source names a winner, so a roster table (no winner stated) can never
// false-positive on one of its own rows.
function ComparisonSection({ comparison, number }){
  const tableRef = useRef(null);
  const rows = (comparison && comparison.rows) || [];
  if(!isNonEmptyArray(rows)) return null;
  const columns = comparison.columns || [];
  const hasNote = !!comparison.note;
  return (
    <section data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">{sectionMarker(number)}</span><span className="eyebrow">results</span><span className="rule"></span>
          <span>{comparison.title}</span>
        </div>
        {/* The scroll box is a FOCUSABLE region: on a narrow viewport it is the
            only way to reach the right-hand columns, and a scroll container
            that cannot take focus cannot be scrolled from the keyboard. */}
        <div className="compare-scroll" role="region" tabIndex={0} aria-label={comparison.title}>
          <div
            className="compare-table"
            role="table"
            aria-label={comparison.title}
            aria-describedby={hasNote ? COMPARE_NOTE_ID : undefined}
            ref={tableRef}
            style={{ '--compare-cols': compareCols(columns.length) }}
          >
            <div className="compare-row compare-row--head reveal" role="row">
              {columns.map((c, i) => (
                <span className="compare-cell compare-cell--col eyebrow" role="columnheader" key={i}>{c}</span>
              ))}
            </div>
            {rows.map((r, i) => (
              <CompareRow key={i} row={r} index={i} isWin={i === comparison.highlightRow} triggerRef={tableRef} />
            ))}
          </div>
        </div>
        {hasNote && <p className="compare-note" id={COMPARE_NOTE_ID}>{comparison.note}</p>}
      </div>
    </section>
  );
}

// ───────── Approach (E3 / X1) ─────────

// One row = one component, because it owns a ref and a scrub and hooks cannot
// live inside a `.map()` (GalleryItem precedent). The WRAPPER is the trigger:
// the row itself is translated by this entry, so measuring it would feed the
// scrub's output back into its own input.
//
// The IO `.in` class keeps arriving on `.row` through the engine's own reveal
// selector and keeps driving ONLY the `::before` accent underline. The two
// compose because neither writes the other's properties — the scrub owns x and
// opacity, the class owns a pseudo-element's width.
function ApproachRow({ step, index }){
  const triggerRef = useRef(null);
  const rowRef = useRef(null);
  useScrub(rowRef, (index % 2 === 0) ? SLIDE_LEFT_SCRUB : SLIDE_RIGHT_SCRUB, { ...SLIDE_OPTS, triggerRef });
  return (
    <div className="approach-row-trigger" ref={triggerRef}>
      <div className="row" ref={rowRef}>
        <div className="pn">{String(index + 1).padStart(2,'0')} /</div>
        <div>
          <div className="pt">{step.t}</div>
          <div className="pd">{step.d}</div>
        </div>
      </div>
    </div>
  );
}

// ───────── Capabilities (details.features) ─────────

// Same wrapper-as-trigger contract as ApproachRow. The stagger is the card's
// COLUMN, not its index, so both cards in a row start together and the grid
// reads as rows arriving rather than a diagonal.
function FeatureCard({ feature, index }){
  const triggerRef = useRef(null);
  const cardRef = useRef(null);
  useScrub(cardRef, RISE_SCRUB, {
    ...FEATURE_RISE_OPTS,
    triggerRef,
    delay: (index % FEATURE_STAGGER_COLS) * FEATURE_STAGGER_STEP,
  });
  return (
    <div className="feat-trigger" ref={triggerRef}>
      <div className="feat-card" ref={cardRef}>
        <div className="ft">{feature.t}</div>
        <div className="fd">{feature.d}</div>
      </div>
    </div>
  );
}

// Absent field = absent section. Every project that has no verified feature
// list renders exactly the sections it did before, and `sectionNumbers` closes
// the gap in the numbering.
function CapabilitiesSection({ features, number }){
  if(!features || features.length === 0) return null;
  return (
    <section data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">{sectionMarker(number)}</span><span className="eyebrow">capabilities</span><span className="rule"></span>
          <span>{String(features.length).padStart(2,'0')} items</span>
        </div>
        <div className="feat-grid">
          {features.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ───────── Architecture (details.architecture) ─────────

function ArchRow({ text, index }){
  const triggerRef = useRef(null);
  const rowRef = useRef(null);
  useScrub(rowRef, (index % 2 === 0) ? SLIDE_LEFT_SCRUB : SLIDE_RIGHT_SCRUB, { ...SLIDE_OPTS, triggerRef });
  return (
    <div className="arch-trigger" ref={triggerRef}>
      <div className="arch-row" ref={rowRef}>
        <div className="an">{String(index + 1).padStart(2,'0')} /</div>
        <div className="ad">{text}</div>
      </div>
    </div>
  );
}

// The hooks run before the empty-field bail-out, never inside it: hook order
// has to be identical on every render, and a null `lineRef.current` is already
// the engine's own no-op path.
//
// The connector is decoration — it repeats the sequence the numbered rows
// already state — so it is hidden from assistive tech rather than described.
function ArchitectureSection({ architecture, number }){
  const listRef = useRef(null);
  const lineRef = useRef(null);
  useScrub(lineRef, ARCH_LINE_SCRUB, { ...ARCH_LINE_OPTS, triggerRef: listRef });
  if(!architecture || architecture.length === 0) return null;
  return (
    <section data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">{sectionMarker(number)}</span><span className="eyebrow">architecture</span><span className="rule"></span>
          <span>{String(architecture.length).padStart(2,'0')} layers</span>
        </div>
        <div className="arch-list" ref={listRef}>
          {architecture.map((a, i) => <ArchRow key={i} text={a} index={i} />)}
          <span className="arch-line" ref={lineRef} aria-hidden="true"></span>
        </div>
      </div>
    </section>
  );
}

// ───────── Metrics band (details.metrics) ─────────

// Values are STATIC. A scrubbed count-up was tried and retired: a number that
// only reads correctly at the end of its range is worse than a number.
function MetricTile({ metric, index, triggerRef }){
  const tileRef = useRef(null);
  useScrub(tileRef, RISE_SCRUB, { ...TILE_RISE_OPTS, triggerRef, delay: index * METRIC_STAGGER_STEP });
  return (
    <div className="metric" ref={tileRef}>
      <div className="mv display-2">{metric.v}</div>
      <div className="mk eyebrow">{metric.k}</div>
    </div>
  );
}

// Rides inside the outcomes band rather than claiming a section number of its
// own: only projects whose README states numbers have this field, and a
// section that exists for one project in thirteen would make the numbering
// read as arbitrary.
function MetricsBand({ metrics }){
  const gridRef = useRef(null);
  if(!metrics || metrics.length === 0) return null;
  return (
    <div className="metrics-grid" ref={gridRef}>
      {metrics.map((m, i) => <MetricTile key={m.k} metric={m} index={i} triggerRef={gridRef} />)}
    </div>
  );
}

// ───────── Outcomes list (E3 / X2) ─────────

// The `<li>` is the target and the `<ul>` is the trigger: a translated item
// cannot measure itself, and one shared trigger keeps the bullets on a single
// staggered run instead of each restarting at its own crossing.
function OutcomeItem({ text, index, triggerRef }){
  const itemRef = useRef(null);
  useScrub(itemRef, RISE_SCRUB, { ...TILE_RISE_OPTS, triggerRef, delay: index * OUTCOME_STAGGER_STEP });
  return <li ref={itemRef}>{text}</li>;
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

// The peers are selected ONCE, in ProjectPage — the same array decides whether
// this row renders at all and whether `related` takes a section number, so it
// cannot be recomputed here without the two answers drifting apart.
function RelatedProjects({ project, peers, number }){
  const gridRef = useRef(null);
  return (
    <div className="related">
      <div className="section-tag section-head reveal">
        <span className="marker section-num">{sectionMarker(number)}</span><span className="eyebrow">related</span><span className="rule"></span>
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

// ───────── Full-bleed media band ─────────

// The cinematic crop of the project's own imagery, sitting between the title
// header and the overview panel. Full viewport width, so it is a direct page
// child and never inside a `.wrap`; the overview's `.panel-overlap` then rides
// up over its lower edge on the geometry that primitive already owns.
//
// The source is the project's THUMBNAIL SOURCE — the first media item that
// yields a src (image, gif, video poster, or a gallery's first frame), so no
// project data has to declare a second image. Projects without one render no
// band at all and keep the padded `.ph-overlapped` path exactly as before.
//
// Decorative by construction: the band repeats imagery the media section
// documents later (this is the crop, that is the annotated record with caption
// and lightbox), so the meaningful alt stays on the documented copy below.
function ProjectBand({ src }){
  const bandRef = useRef(null);
  const imgRef = useRef(null);
  useScrub(imgRef, PROJECT_BAND_SCRUB, { ...PROJECT_BAND_OPTS, triggerRef: bandRef });
  return (
    <div className="project-band" ref={bandRef}>
      <img ref={imgRef} src={src} alt="" loading="eager" />
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
  const outcomesListRef = useRef(null);
  const pnavRef = useRef(null);
  useScrub(panelRef, RISE_SCRUB, { ...PANEL_RISE_OPTS, triggerRef: overviewRef });
  useScrub(outcomesRef, bandClipScrub(outcomesRef), BAND_CLIP_OPTS);

  // The band renders only when the project HAS imagery; without it the header
  // keeps its own compensation padding, because there is nothing to overlap.
  const bandSrc = (typeof window.getProjectThumbnail === 'function') ? window.getProjectThumbnail(project) : null;

  // adjacent projects
  const list = window.PROJECTS;
  const idx = list.findIndex(p => p.id === project.id);
  const prev = list[(idx - 1 + list.length) % list.length];
  const next = list[(idx + 1) % list.length];

  const d = project.details || {};

  // Same-category peers, in PROJECTS order, never the project you are reading.
  // Most categories are singletons, so the row renders nothing rather than
  // padding itself out with unrelated work — and an empty row takes no number.
  const peers = list
    .filter(p => p.category === project.category && p.id !== project.id)
    .slice(0, RELATED_MAX);
  const hasPeers = peers.length > 0;
  const nums = sectionNumbers(d, hasPeers);

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

      <section className={bandSrc ? 'ph ph-overlapped ph--banded' : 'ph ph-overlapped'} data-tone="light">
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

      {bandSrc && <ProjectBand src={bandSrc} />}

      {/* Overview */}
      <section className="overview overview-lead" data-tone="light" ref={overviewRef}>
        <div className="wrap panel-overlap" ref={panelRef}>
          <div className="section-tag section-head reveal">
            <span className="marker section-num">{sectionMarker(nums.overview)}</span><span className="eyebrow">overview</span><span className="rule"></span>
          </div>
          {d.overview && <p className="reveal">{d.overview}</p>}
          {/* The verified facts sit with the overview they summarise — inside
              the panel, under its paragraph, ahead of the problem statement. */}
          {hasFacts(d) && <FactsGrid facts={d.facts} />}
          {d.problem && (
            <>
              <div className="section-tag section-head reveal" style={{marginTop:'calc(var(--u)*5)'}}>
                <span className="marker section-num">{sectionMarker(nums.problem)}</span><span className="eyebrow">problem</span><span className="rule"></span>
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
              <span className="marker section-num">{sectionMarker(nums.approach)}</span><span className="eyebrow">approach</span><span className="rule"></span>
            </div>
            <div>
              {d.approach.map((a, i) => (
                <ApproachRow key={i} step={a} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works — the step-by-step path the README documents, after the
          approach (why) and before the capabilities (what). */}
      {hasPipeline(d) && <PipelineSection pipeline={d.pipeline} number={nums.pipeline} />}

      {/* Capabilities + architecture — both absent unless the project data
          carries a verified list for them. */}
      <CapabilitiesSection features={d.features} number={nums.capabilities} />
      <ArchitectureSection architecture={d.architecture} number={nums.architecture} />

      {/* Media (galleries, images, videos, gifs, embeds) */}
      {d.media && d.media.length > 0 ? (
        <MediaSection media={d.media} number={nums.media} />
      ) : (
        <section data-tone="light">
          <div className="wrap">
            <div className="section-tag section-head reveal">
              <span className="marker section-num">{sectionMarker(nums.media)}</span><span className="eyebrow">frames</span><span className="rule"></span>
              <span>placeholders</span>
            </div>
            <div className="gallery">
              <Frame mark={project.mark} label="overview" frameNo={1} />
              <Frame mark={project.mark} label="detail" frameNo={2} />
            </div>
          </div>
        </section>
      )}

      {/* Results — the measured evidence, on paper and before the dark band, so
          the outcomes stay the page's single dark beat (evidence → conclusion). */}
      {hasComparison(d) && <ComparisonSection comparison={d.comparison} number={nums.comparison} />}

      {/* Outcomes + Stack — the page's one dark band */}
      <section className="sec-dark" data-tone="dark" ref={outcomesRef}>
        <div className="wrap">
          <div className="section-tag section-head reveal">
            <span className="marker section-num">{sectionMarker(nums.outcomes)}</span><span className="eyebrow">outcomes &amp; stack</span><span className="rule"></span>
          </div>
          <MetricsBand metrics={d.metrics} />
          <div className="split">
            <div className="cell">
              <div className="sh">{nums.outcomes}.a / outcomes</div>
              <div className="st">what shipped</div>
              <ul ref={outcomesListRef}>
                {(d.outcomes || ["Live and in use", "Reproducible setup"]).map((o, i) => (
                  <OutcomeItem key={i} text={o} index={i} triggerRef={outcomesListRef} />
                ))}
              </ul>
            </div>
            <div className="cell">
              <div className="sh">{nums.outcomes}.b / stack</div>
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
          {hasPeers && <RelatedProjects project={project} peers={peers} number={nums.related} />}
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

  // Progress bar and smooth scrolling are page-level, so they run on the
  // not-found branch too.
  useScrollProgress();
  useSmoothScroll();

  // Set document title
  useEffect(() => {
    if(project) document.title = `${project.title} — Young Woo Song`;
    else document.title = `Project not found — Young Woo Song`;
  }, [project]);

  if(!project) return <NotFound id={id} />;
  return <ProjectPage project={project} />;
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
