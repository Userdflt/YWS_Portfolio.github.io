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

// Hero image band — the LCP element, so it is eager + high priority and carries
// its intrinsic size to reserve the box before the bytes land.
const HERO_IMAGE = {
  src: "images/optimized/masterplan_1_render_2.webp",
  width: 1088,
  height: 960,
  alt: "Aerial masterplan render: a residential development with landscaped parkland, a central clubhouse and pool, and detached houses across a rural site.",
};

// Shared runtime, consumed as window globals — this file owns home sections only:
//   scripts/scroll.jsx    -> useScrub, useReveal, useScrollProgress,
//                            useScrollSpy, useSmoothScroll, CountUp
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
const BAND_CLIP_SCRUB = [
  { at: 0, style: { clipPath: 'polygon(0% 34%, 50% 34%, 50% 17%, 100% 17%, 100% 100%, 0% 100%)' } },
  { at: 1, style: { clipPath: 'polygon(0% 0%, 50% 0%, 50% 0%, 100% 0%, 100% 100%, 0% 100%)' } },
];
// Released at 1: a finished band must not carry a clip into every later paint.
const BAND_CLIP_OPTS = { mode: 'enter', endAt: 0.55, releaseOnComplete: true };

// W2 — each row rises on its own progress, which IS the stagger.
const WORK_ROW_SCRUB = [
  { at: 0, style: { translateY: 36, opacity: 0 } },
  { at: 1, style: { translateY: 0,  opacity: 1 } },
];
const WORK_ROW_OPTS = { mode: 'enter', endAt: 0.75 };
// W3 — the numeral travels against the row it sits in: depth, not decoration.
const WORK_IDX_SCRUB = [
  { at: 0, style: { translateY: 18 } },
  { at: 1, style: { translateY: -18 } },
];
const WORK_IDX_OPTS = { mode: 'cross', damping: SCRUB_DAMPING };
// W4 — the stat hairline draws itself left to right (theme.css `.stat::after`).
const STAT_SCRUB = [
  { at: 0, style: { '--scrub': 0 } },
  { at: 1, style: { '--scrub': 1 } },
];
const STAT_OPTS = { mode: 'enter', endAt: 0.7 };

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
  const bandImgRef = useRef(null);
  const panelRef = useRef(null);

  useScrub(titleRef, HERO_TITLE_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef, damping: SCRUB_DAMPING });
  useScrub(statusRef, HERO_FADE_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(cueRef, HERO_FADE_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(roleRef, HERO_ROLE_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(beat2Ref, HERO_BEAT2_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef });
  useScrub(bandImgRef, HERO_BAND_SCRUB, { ...HERO_PIN_OPTS, triggerRef: pinRef, damping: SCRUB_DAMPING });
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
            <p className="hero-role" ref={roleRef}>Applied AI</p>

            {/* The second beat occupies the SAME lead area as the role line —
                absolutely, so the swap is a cross-fade in one place instead of
                two elements shoving each other around in flow. Parked at
                opacity 0 by theme.css, never by the engine's first write. */}
            <div className="hero-beat2" ref={beat2Ref}>
              <p className="eyebrow b2-eyebrow">internal tools · retrieval · governance</p>
              <p className="display-2 text-ink b2-line">i make ai work for architecture teams.</p>
            </div>

            <div className="scroll-cue" ref={cueRef} aria-hidden="true">
              <span>scroll</span>
              <span className="line"></span>
            </div>
          </div>

          <div className="hero-band">
            <img
              ref={bandImgRef}
              src={HERO_IMAGE.src}
              alt={HERO_IMAGE.alt}
              width={HERO_IMAGE.width}
              height={HERO_IMAGE.height}
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="panel-overlap hero-panel" ref={panelRef}>
          <p className="hero-tag">
            ai specialist at ignite. i build internal ai tools — knowledge retrieval, workflow automation, document and compliance support — and establish governance, evaluation, and adoption frameworks for design and architecture teams.
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

// ───────────────────────── Work: editorial list ─────────────────────────

// One row = one component because it owns three refs and two scrub hooks, and
// hooks cannot live inside a `.map()`.
//
// `.work-row-slot` exists purely as a measurement anchor: the row itself is
// translated by W2, so its own rect would feed the scrub's output back into its
// input. The slot never moves, so both the row and its numeral measure it.
function WorkRow({ project, index, onMove, onLeave }){
  const slotRef = useRef(null);
  const rowRef = useRef(null);
  const idxRef = useRef(null);
  useScrub(rowRef, WORK_ROW_SCRUB, { ...WORK_ROW_OPTS, triggerRef: slotRef });
  useScrub(idxRef, WORK_IDX_SCRUB, { ...WORK_IDX_OPTS, triggerRef: slotRef });

  return (
    <div className="work-row-slot" ref={slotRef}>
      <a href={`project.html?id=${project.id}`}
         className="work-row"
         ref={rowRef}
         onMouseMove={(e) => onMove(e, project)}
         onMouseLeave={onLeave}>
        <div className="idx" ref={idxRef}>{String(index + 1).padStart(2, '0')}</div>
        <div className="title-col">
          <div className="title">{project.title}</div>
          <div className="blurb">{project.subtitle} — {project.blurb}</div>
        </div>
        <div className="cat">{project.category}</div>
        <div className="arrow" aria-hidden="true">↗</div>
      </a>
    </div>
  );
}

// Same reason: the hairline draw needs a ref per stat.
function Stat({ end, label }){
  const ref = useRef(null);
  useScrub(ref, STAT_SCRUB, STAT_OPTS);
  return (
    <div className="stat" ref={ref}>
      <span className="sn"><CountUp end={end} /></span>
      <span className="sl">{label}</span>
    </div>
  );
}

function WorkEditorial({ projects, previewRef }){
  const onMove = (e, p) => {
    const el = previewRef.current; if(!el) return;
    el.style.left = e.clientX + 'px';
    el.style.top = e.clientY + 'px';
    el.classList.add('show');
    const markEl = document.getElementById('preview-mark');
    const imgEl = document.getElementById('preview-img');
    const thumb = (typeof window.getProjectThumbnail === 'function') ? window.getProjectThumbnail(p) : null;
    if (imgEl) {
      if (thumb) {
        if (imgEl.getAttribute('src') !== thumb) imgEl.src = thumb;
        imgEl.alt = p.title || '';
        imgEl.style.display = 'block';
        if (markEl) markEl.style.display = 'none';
      } else {
        imgEl.removeAttribute('src');
        imgEl.style.display = 'none';
        if (markEl) markEl.style.display = '';
      }
    }
    if (markEl) markEl.textContent = p.mark || '⟁';
    document.getElementById('preview-cat').textContent = p.category;
    document.getElementById('preview-tag').textContent = `${p.year} · open →`;
  };
  const onLeave = () => previewRef.current?.classList.remove('show');

  return (
    <div className="work-list">
      {projects.map((p, i) => (
        <WorkRow key={p.id} project={p} index={i} onMove={onMove} onLeave={onLeave} />
      ))}
    </div>
  );
}

// The dark band of the index. Editorial is the ONLY work renderer — the card
// and table variants were competing surfaces for the same content, so the page
// no longer has to declare which one it wants.
function Work(){
  const previewRef = useRef(null);
  const sectionRef = useRef(null);
  useEffect(() => { previewRef.current = document.getElementById('work-preview'); }, []);
  useScrub(sectionRef, BAND_CLIP_SCRUB, BAND_CLIP_OPTS);
  return (
    <section id="work" className="sec-dark" data-tone="dark" ref={sectionRef}>
      <div className="wrap">
        <div className="section-tag section-head reveal">
          <span className="marker section-num">[01]</span>
          <span className="eyebrow">selected work</span>
          <span className="rule"></span>
          <span>{PROJECTS.length} projects</span>
        </div>

        <div className="stats">
          <Stat end={PROJECTS.length} label="shipped projects" />
          <Stat end={7} label="yrs in architecture" />
          <Stat end={4} label="multi-agent systems" />
          <Stat end={2} label="ibm specializations · 2025" />
        </div>

        <WorkEditorial projects={PROJECTS} previewRef={previewRef} />
      </div>
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
  useScrub(sectionRef, BAND_CLIP_SCRUB, BAND_CLIP_OPTS);
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
