// Main portfolio app — paper/ink editorial.
const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "azure",
  "density": "regular"
}/*EDITMODE-END*/;

// One entry per palette, TWO accents per entry: the tone scopes in theme.css
// pick the pair that reads on their own surface. A single accent cannot serve
// both — anything legible on #f0f1f4 is too dark for #0e1228 and vice versa.
// Every `accent` is >= 4.5:1 on its surface, every `accent2` >= 3:1
// (verified: scratchpad contrast.cjs).
const PALETTES = {
  azure:  { label: "Azure",  accent: "#2c46d8", accent2: "#5a70e8", soft: "rgba(44,70,216,0.10)",
            accentDark: "#9db4ff", accent2Dark: "#c3d1ff", softDark: "rgba(157,180,255,0.14)" },
  teal:   { label: "Teal",   accent: "#0f6f66", accent2: "#1d7fa8", soft: "rgba(15,111,102,0.10)",
            accentDark: "#5eead4", accent2Dark: "#7dd3fc", softDark: "rgba(94,234,212,0.14)" },
  cyber:  { label: "Cyber",  accent: "#0e7490", accent2: "#6d28d9", soft: "rgba(14,116,144,0.10)",
            accentDark: "#22d3ee", accent2Dark: "#a78bfa", softDark: "rgba(34,211,238,0.14)" },
  matrix: { label: "Matrix", accent: "#3f6212", accent2: "#15803d", soft: "rgba(63,98,18,0.10)",
            accentDark: "#84cc16", accent2Dark: "#22c55e", softDark: "rgba(132,204,22,0.14)" },
  amber:  { label: "Amber",  accent: "#92400e", accent2: "#9a3412", soft: "rgba(146,64,14,0.10)",
            accentDark: "#fbbf24", accent2Dark: "#fb923c", softDark: "rgba(251,191,36,0.14)" },
  bone:   { label: "Bone",   accent: "#57534e", accent2: "#78716c", soft: "rgba(87,83,78,0.10)",
            accentDark: "#e7e5e4", accent2Dark: "#a8a29e", softDark: "rgba(231,229,228,0.12)" },
};

// Hero image band — a four-tile mosaic of the flagship projects. Tile `a` is the
// LCP element, so it is eager + high priority; the other three sit in the same
// above-the-fold band and are small, so they are eager too rather than racing a
// lazy load against the fold. Every tile carries its intrinsic size to reserve
// its box before the bytes land.
//
// `area` names a cell in the .hero-mosaic template — theme.css owns the shape
// (the 1.6fr asymmetry, and the 2x2 it collapses to under 900px), this owns
// which project lands where. `pos` overrides the default centre crop wherever
// the cell's aspect fights the source's; a tile without one takes centre.
const HERO_MOSAIC = [
  { area: "a",
    src: "images/optimized/sketch_2_render_1.webp", width: 1088, height: 960,
    alt: "Sketch to render: the photoreal output of the sketch-to-render pipeline — a mixed-use tower over a landscaped podium, with street trees, a pedestrian crossing and passers-by." },
  // Portrait source in a landscape tile: a centred crop lands on the waist and
  // loses both the hardhat and its label, so the origin rides high.
  { area: "b", pos: "50% 12%",
    src: "images/optimized/cv.webp", width: 1024, height: 1536,
    alt: "Construction site safety detection: a computer-vision frame boxing a worker's hardhat and high-visibility vest, each box labelled with the item it found." },
  // The clubhouse/pool cluster sits above and right of the frame centre; the
  // crop keeps it in view only with the origin pushed there.
  { area: "c", pos: "58% 45%",
    src: "images/optimized/masterplan_1_render_2.webp", width: 1088, height: 960,
    alt: "Masterplan render: an aerial view of a residential development with landscaped parkland, a central clubhouse and pool, and detached houses across a rural site." },
  // A UI screenshot in the widest tile: a centred crop opens mid-headline and
  // leaves the tile reading "Code Assistant". Anchored to the top it keeps the
  // wordmark and both headline lines, so the tile names its own project.
  { area: "d", pos: "50% 0%",
    src: "images/optimized/code_vision.webp", width: 1026, height: 582,
    alt: "CodeVision: the landing screen of an AI building-code assistant, offering answers on the New Zealand Building Code across its clause tiles." },
];

// Shared runtime, consumed as window globals — this file owns home sections only:
//   scripts/scroll.jsx    -> useScrub, useParallax, useReveal,
//                            useScrollProgress, useScrollSpy, useSmoothScroll
//   scripts/shared-ui.jsx -> Nav, Footer
// Re-declaring any of those names at top level here would shadow the shared copy.

// ─────────────── Scroll-scrubbed motion (Design Spec tables H / W / X) ───────────
// Every table below is a pure function of scroll position: `at` is progress
// through the entry's own trigger range, never elapsed time. The values live
// here, named, so a tuning pass never means reading JSX for numbers.

// The pinned hero is retired on viewports too short to pin. Kept in sync with
// the `@media (max-height: 560px)` block in theme.css that flattens the same
// scene — the two must agree, or the scrubs would move an unpinned hero.
const HERO_PIN_OFF_QUERY = '(max-height: 560px)';
// Inertia on the large slow surfaces only. Edge-revealing entries (the clips)
// must track the wheel exactly, so they stay undamped.
const SCRUB_DAMPING = 0.14;

// H1 — the title slides up under its own mask as the pin is consumed.
const HERO_TITLE_SCRUB = [
  { at: 0,    style: { translateY: '0%' } },
  { at: 0.30, style: { translateY: '-101%' } },
];
// H2 — status line and scroll cue leave first.
const HERO_FADE_SCRUB = [
  { at: 0,    style: { opacity: 1, translateY: '0svh' } },
  { at: 0.22, style: { opacity: 0, translateY: '-5svh' } },
];
// H3 — the band pushes in slowly across the whole pin.
const HERO_BAND_SCRUB = [
  { at: 0, style: { scale: 1 } },
  { at: 1, style: { scale: 1.14 } },
];
// H6a — the role line hands the lead area over to the second beat.
const HERO_ROLE_SCRUB = [
  { at: 0.32, style: { opacity: 1, translateY: '0svh' } },
  { at: 0.44, style: { opacity: 0, translateY: '-4svh' } },
];
// H6b — the second beat rises into the vacated space and HOLDS there: the last
// keyframe is the resting state for the whole remainder of the pin.
const HERO_BEAT2_SCRUB = [
  { at: 0.46, style: { opacity: 0, translateY: '3svh' } },
  { at: 0.62, style: { opacity: 1, translateY: '0svh' } },
];
// H4 — the whole scene exits upward over the pin's last 30%.
const HERO_TAIL_SCRUB = [
  { at: 0.70, style: { translateY: '0svh' } },
  { at: 1,    style: { translateY: '-25svh' } },
];
// H5 — the paper panel rises into the space the scene vacates.
const HERO_PANEL_SCRUB = [
  { at: 0, style: { translateY: 24, opacity: 0 } },
  { at: 1, style: { translateY: 0,  opacity: 1 } },
];
const HERO_PIN_OPTS = { mode: 'pin', offQuery: HERO_PIN_OFF_QUERY };
const HERO_PANEL_OPTS = { mode: 'enter', endAt: 0.65 };

// W1 / X2 — stepped clip entry for the dark bands: paper shows through the
// staircase until it flattens. Six vertices on both sides (the interpolator
// pairs them by index); the middle pair collapses onto the top edge.
//
// The step depths are VIEWPORT fractions, not section fractions: on a very
// tall section (13 showcases ≈ 10k px) a %-of-section step sits thousands of
// px below the top edge and the whole staircase plays off-screen. Function
// keyframes resolve in the engine's READ pass, so reading offsetHeight here
// is batched with the frame's other layout reads.
const BAND_STEP_VH = 0.34; // deepest step, as a fraction of the viewport
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
// Released at 1: a finished band must not carry a clip into every later paint.
// `enter` span = vh × (1 − endAt), so a LOWER endAt is a LONGER, slower step-in
// and endAt 0 is the mode's ceiling of one whole viewport: 0.06 spends ~94% of a
// viewport on the staircase. The band is the section's own entrance, so it has a
// full crossing to spend — at the previous 0.35 (~65% of a viewport) the steps
// flattened before they had been read as steps.
const BAND_CLIP_OPTS = { mode: 'enter', endAt: 0.06, releaseOnComplete: true };

// ─────────────── Tables SC1–SC3 — the project showcase articles ───────────────
// One article per project, three entries each. Every table is progress through
// the article's own crossing, so thirteen showcases reverse exactly on
// scroll-back with no sequencing state anywhere.

// SC1 — the media unmasks bottom-up. The wipe target is ALSO its own trigger:
// clip-path never moves the rect it is measured from, so self-measurement is
// safe here (unlike SC2/SC3, whose targets are translated by their own entries).
// A per-page copy of project.jsx's MEDIA_WIPE table — the two page modules never
// co-load, so each states its own recipe rather than widening the engine's
// export surface (same precedent as BAND_CLIP_SCRUB above).
//
// `enter` span = vh × (1 − endAt), so a HIGHER endAt is a SHORTER, quicker wipe:
// 0.25 spends ~75% of a viewport unmasking, against the project page's 0.18 —
// thirteen consecutive wipes at that length read as syrup.
const SHOWCASE_WIPE_SCRUB = [
  { at: 0, style: { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' } },
  { at: 1, style: { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } },
];
// Released at 1: a finished figure must not carry a clip into every later paint,
// and the inner figure's ±24px parallax must not be cropped by a mask that has
// already done its job.
const SHOWCASE_WIPE_OPTS = { mode: 'enter', endAt: 0.25, releaseOnComplete: true };

// SC2 — the whole text block rises as ONE unit. Per-child staggers would cost
// ~40 more registry entries to say what the masked title already says.
const SHOWCASE_TEXT_SCRUB = [
  { at: 0, style: { translateY: 36, opacity: 0 } },
  { at: 1, style: { translateY: 0,  opacity: 1 } },
];
const SHOWCASE_TEXT_OPTS = { mode: 'enter', endAt: 0.75 };

// SC3 — the index numeral travels against the article it sits in: depth, not
// decoration. Retired at the width where the article becomes a single column and
// the numeral is static background. This query is mirrored by the `.showcase`
// breakpoint in theme.css — a scrubbed numeral over a layout with no room for
// its travel is exactly what the breakpoint exists to prevent.
const SHOWCASE_NUM_OFF_QUERY = '(max-width: 899px)';
// ±16px, not the old ±60: the numeral now lives IN FLOW above the title, so
// its travel must stay inside the margin the layout reserves for it.
const SHOWCASE_NUM_SCRUB = [
  { at: 0, style: { translateY: 16 } },
  { at: 1, style: { translateY: -16 } },
];
const SHOWCASE_NUM_OPTS = { mode: 'cross', damping: SCRUB_DAMPING, offQuery: SHOWCASE_NUM_OFF_QUERY };

// ───────────────────────── Hero ─────────────────────────
// A pinned scene plus a paper card. `.hero-pin` is 260svh of scroll distance;
// `.hero-sticky` holds the type lead and the full-bleed band still while that
// distance is consumed, then slides away; `.hero-panel` follows in normal flow.
// The band is a direct child of the sticky (never inside .wrap) so it spans the
// viewport instead of being capped at the content width.
//
// Every pin scrub measures `.hero-pin` and writes somewhere else: progress may
// never be read from a node the same entry transforms.
function Hero(){
  const pinRef = useRef(null);
  const sceneRef = useRef(null);
  const titleRef = useRef(null);
  const statusRef = useRef(null);
  const cueRef = useRef(null);
  const roleRef = useRef(null);
  const beat2Ref = useRef(null);
  // H3 scales the mosaic GRID, not its four images: one scrubbed node instead of
  // four, and the gaps travel with the tiles so the plate pushes in as one piece.
  const bandGridRef = useRef(null);
  const panelRef = useRef(null);

  useScrub(titleRef, HERO_TITLE_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef, damping: SCRUB_DAMPING });
  useScrub(statusRef, HERO_FADE_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(cueRef, HERO_FADE_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(roleRef, HERO_ROLE_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(beat2Ref, HERO_BEAT2_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(bandGridRef, HERO_BAND_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef, damping: SCRUB_DAMPING });
  useScrub(sceneRef, HERO_TAIL_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(panelRef, HERO_PANEL_SCRUB, HERO_PANEL_OPTS);

  return (
    <section id="top" className="hero" data-tone="light">
      <div className="hero-pin" ref={pinRef}>
        <div className="hero-sticky" ref={sceneRef}>
          <div className="wrap hero-lead">
            <p className="hero-status eyebrow" ref={statusRef}>ai specialist · ignite · auckland · hybrid</p>

            <div className="mask-line">
              <h1 className="text-ink display-1" ref={titleRef}>Young Woo Song</h1>
            </div>

            {/* Scrub-owned from H6a on, so it carries no IO reveal: an
                observer and a scrub writing opacity to one node would fight. */}
            <p className="hero-role" ref={roleRef}>Applied AI for AEC</p>

            {/* The second beat occupies the SAME lead area as the role line —
                absolutely, so the swap is a cross-fade in one place instead of
                two elements shoving each other around in flow. Parked at
                opacity 0 by theme.css, never by the engine's first write. */}
            <div className="hero-beat2" ref={beat2Ref}>
              <p className="eyebrow b2-eyebrow">systems · tools · governance</p>
              <p className="display-2 text-ink b2-line">i make ai work for architecture teams.</p>
            </div>

            <div className="scroll-cue" ref={cueRef} aria-hidden="true">
              <span>scroll</span>
              <span className="line"></span>
            </div>
          </div>

          <div className="hero-band">
            <div className="hero-mosaic" ref={bandGridRef}>
              {/* Placement and crop are inline because they belong to the ENTRY,
                  not the stylesheet: theme.css declares the two templates, the
                  data says which project takes which cell in both of them. */}
              {HERO_MOSAIC.map((tile, i) => (
                <img
                  key={tile.src}
                  style={{ gridArea: tile.area, objectPosition: tile.pos }}
                  src={tile.src}
                  alt={tile.alt}
                  width={tile.width}
                  height={tile.height}
                  loading="eager"
                  fetchpriority={i === 0 ? "high" : undefined}
                  decoding="async"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="panel-overlap hero-panel" ref={panelRef}>
          <p className="hero-tag">
            i build and maintain ignite's internal ai applications — generative ai, retrieval and rag, document intelligence, workflow automation, and ai-assisted design — plus the enterprise foundations beneath them: azure data architecture, permission-aware retrieval, evaluation, and monitoring. i set the governance and delivery standards that keep ai reliable, secure, and responsibly deployed.
          </p>

          <div className="hero-foot">
            <div className="col">
              <span className="k">role</span>
              <span className="v">ai specialist · ignite</span>
            </div>
            <div className="col">
              <span className="k">based</span>
              <span className="v">auckland · nz · hybrid</span>
            </div>
            <div className="col">
              <span className="k">since</span>
              <span className="v">jan 2026 → present</span>
            </div>
            <div className="col">
              <span className="k">channels</span>
              <span className="v">
                <a href="https://github.com/Userdflt">github</a>{" · "}
                <a href="https://www.linkedin.com/in/young-woo-song-145488217/">linkedin</a>{" · "}
                <a href="mailto:youngwoo930@gmail.com">email</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Work: project showcases ─────────────────────────

// One article = one component, because it owns four refs and three scrub hooks
// and hooks cannot live inside a `.map()` (precedent: project.jsx's ProjectCard).
//
// Three DISCRETE links — figure, title, CTA — rather than one article-wide click
// handler: a whole-article hit area is invisible to the keyboard and absent from
// the link list a screen reader builds. The figure and the CTA carry the same
// aria-label because neither's own content names the project; the title link
// names itself, and is what `aria-labelledby` points the article at.
//
// Which node measures which is the engine's one hard contract: progress may
// never be read from a node the same entry transforms. The wipe measures itself
// (clip-path moves nothing), while the rise and the numeral — both transformed
// by their own entries — measure the article, which never moves.
function ProjectShowcase({ project, index }){
  const articleRef = useRef(null);
  const numRef = useRef(null);
  const wipeRef = useRef(null);
  const figureRef = useRef(null);
  const textRef = useRef(null);

  useScrub(wipeRef, SHOWCASE_WIPE_SCRUB, SHOWCASE_WIPE_OPTS);
  useScrub(textRef, SHOWCASE_TEXT_SCRUB, { ...SHOWCASE_TEXT_OPTS, triggerRef: articleRef });
  useScrub(numRef, SHOWCASE_NUM_SCRUB, { ...SHOWCASE_NUM_OPTS, triggerRef: articleRef });
  useParallax(figureRef);

  const href = `project.html?id=${project.id}`;
  const titleId = `showcase-${project.id}`;
  const mediaLabel = `View ${project.title} project`;
  // Real media when the project has any, its letter mark when it does not —
  // getProjectThumbnail already encodes "first usable image in details.media".
  const thumb = (typeof window.getProjectThumbnail === 'function') ? window.getProjectThumbnail(project) : null;

  return (
    <article
      className={index % 2 === 1 ? 'showcase showcase--flip' : 'showcase'}
      ref={articleRef}
      aria-labelledby={titleId}
    >
      {/* The ARTICLE is the two-column grid, so the media is a HALF of the
          section rather than a box inside a content column: no `.wrap` around
          it, flush to the viewport edge, full article height. Only the copy
          half carries the content padding. */}
      <a className="showcase-media" href={href} aria-label={mediaLabel}>
        {/* Wipe target and parallax target are SEPARATE elements: the mask has
            to stand still while the picture drifts through it. */}
        <div className="showcase-frame" ref={wipeRef}>
          <figure ref={figureRef}>
            {thumb
              ? <img src={thumb} alt="" loading="lazy" decoding="async" />
              : <span className="mark">{project.mark || '⟁'}</span>}
          </figure>
        </div>
      </a>

      <div className="showcase-copy">
        {/* Decoration, IN FLOW above the text: sharing the copy column means
            the layout reserves its space — the numeral can never overlap the
            title at any viewport, which its old absolute anchoring did. */}
        <div className="showcase-num" ref={numRef} aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="showcase-text" ref={textRef}>
          <p className="eyebrow">{project.category} · {project.year}</p>
          <div className="mask-line">
            <h2 id={titleId} className="mask-reveal text-ink display-2">
              <a href={href}>{project.title}</a>
            </h2>
          </div>
          <p className="showcase-dek">{project.subtitle} — {project.blurb}</p>
          <div className="stags">
            {project.tech.map(t => <span className="tag" key={t}>{t}</span>)}
          </div>
          <a className="showcase-cta" href={href} aria-label={mediaLabel}>
            view project <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </article>
  );
}

// The dark band of the index: the section head, then one showcase article per
// project. ProjectShowcase is the ONLY work renderer — the pinned stats scene
// and the compact editorial rows were competing surfaces for the same content,
// so the page no longer has to declare which one it wants (git is their archive).
//
// The articles are direct children of the section, NOT of one shared `.wrap`:
// each owns its own wrap so its index numeral can be positioned against the
// article's own edges and bleed past them.
function Work(){
  const sectionRef = useRef(null);
  useScrub(sectionRef, bandClipScrub(sectionRef), BAND_CLIP_OPTS);
  return (
    <section id="work" className="sec-dark" data-tone="dark" ref={sectionRef}>
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[01]</span>
          <span className="eyebrow">selected work</span>
          <span className="rule"></span>
          <span>{PROJECTS.length} projects</span>
        </div>
      </div>

      {PROJECTS.map((p, i) => (
        <ProjectShowcase key={p.id} project={p} index={i} />
      ))}
    </section>
  );
}

// ───────────────────────── Approach ─────────────────────────
function Approach(){
  return (
    <section id="approach" className="approach" data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[02]</span>
          <span className="eyebrow">approach</span>
          <span className="rule"></span>
        </div>
        <div className="approach-grid">
          <div>
            <div className="mask-line">
              <h2 className="mask-reveal text-ink">from architecture to <span className="acc">applied ai</span>.</h2>
            </div>
            <p className="reveal reveal-1">seven years across new zealand architecture practices — ignite, woods bagot, rcg — taught me to work with constraints and ship under pressure. now back at ignite as ai specialist, applying generative ai and machine learning to real architecture and design workflows.</p>
            <p className="reveal reveal-2">i build internal tools — rag, workflow automation, document and compliance support — and stand up the governance, evals, and adoption frameworks that make them safe to scale. aut-accredited in data science &amp; ai (institute of data) and ibm-certified across ai engineering and ai development.</p>
          </div>
          <div className="principles">
            {PRINCIPLES.map((p) => (
              <div className="principle" key={p.n}>
                <div className="pn">{p.n}</div>
                <div>
                  <div className="pt">{p.t}</div>
                  <div className="pd">{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Stack ─────────────────────────
function Stack(){
  return (
    <section id="stack" className="band-paper" data-tone="light">
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[03]</span>
          <span className="eyebrow">stack</span>
          <span className="rule"></span>
        </div>
        <div className="stack-grid">
          {STACK.map((s) => (
            <div className="stack-cell" key={s.head}>
              <div className="sh">{s.head}</div>
              <div className="st">{s.title}</div>
              <div className="stags">
                {s.tags.map(t => <span className="tag" key={t}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Contact ─────────────────────────
function Contact(){
  const sectionRef = useRef(null);
  useScrub(sectionRef, bandClipScrub(sectionRef), BAND_CLIP_OPTS);
  return (
    <section id="contact" className="contact sec-dark" data-tone="dark" ref={sectionRef}>
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[04]</span>
          <span className="eyebrow">contact</span>
          <span className="rule"></span>
        </div>
        {/* The card is no longer the reveal unit: its headline is masked and its
            body keeps the plain IO reveal, so each part enters on its own. */}
        <div className="contact-card">
          <div className="mask-line">
            <h2 className="mask-reveal text-ink display-2">let&rsquo;s build<br/>something <span className="acc">real</span>.</h2>
          </div>
          <p className="reveal">open to interesting work in applied ai, ai governance and adoption, multi-agent systems, and tools for architecture and design.</p>
          <div className="contact-actions reveal">
            <a className="btn btn-primary" href="mailto:youngwoo930@gmail.com">youngwoo930@gmail.com <span className="ar">↗</span></a>
            <a className="btn btn-ghost" href="https://www.linkedin.com/in/young-woo-song-145488217/">linkedin <span className="ar">↗</span></a>
            <a className="btn btn-ghost" href="https://github.com/Userdflt">github <span className="ar">↗</span></a>
          </div>
        </div>
      </div>
      <div className="wrap">
        <Footer page="index" />
      </div>
    </section>
  );
}

// ───────────────────────── App + Tweaks ─────────────────────────

// Document order — useScrollSpy returns the first of these still intersecting
// the band under the nav, which is what the nav highlights.
const SPY_SECTIONS = ['top', 'work', 'approach', 'stack', 'contact'];

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Palette writes the tone-NEUTRAL base vars, never --accent itself: an
  // inline --accent on documentElement would reach the light scope only,
  // because .sec-dark re-declares --accent for its own subtree.
  useEffect(() => {
    const p = PALETTES[t.palette] || PALETTES.azure;
    const r = document.documentElement;
    r.style.setProperty('--accent-l', p.accent);
    r.style.setProperty('--accent-2-l', p.accent2);
    r.style.setProperty('--accent-soft-l', p.soft);
    r.style.setProperty('--accent-d', p.accentDark);
    r.style.setProperty('--accent-2-d', p.accent2Dark);
    r.style.setProperty('--accent-soft-d', p.softDark);
    r.classList.remove('density-compact','density-regular','density-spacious');
    r.classList.add(`density-${t.density}`);
  }, [t.palette, t.density]);

  useReveal();
  useScrollProgress();
  useSmoothScroll();
  const activeId = useScrollSpy(SPY_SECTIONS);

  return (
    <>
      <Nav page="index" activeId={activeId} />
      <Hero />
      <Work />
      <Approach />
      <Stack />
      <Contact />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette" />
        <TweakColor
          label="Accent"
          value={PALETTES[t.palette]?.accent}
          options={Object.values(PALETTES).map(p => p.accent)}
          onChange={(hex) => {
            const key = Object.keys(PALETTES).find(k => PALETTES[k].accent === hex) || 'teal';
            setTweak('palette', key);
          }}
        />

        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "regular", "spacious"]}
          onChange={(v) => setTweak('density', v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
