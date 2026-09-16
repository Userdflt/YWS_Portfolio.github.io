# Young Woo Song - Portfolio

A static portfolio for Young Woo Song, an AI specialist specialising in the architecture, engineering, and construction (AEC) industry. The design follows the supplied ivory, forest-green, and terracotta branding, with self-hosted Manrope typography and Anime.js 4.5.0 motion.

## Preview and verification

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm run dev
```

Open http://localhost:4173. The generated HTML is checked in, so GitHub Pages can serve the repository directly. No runtime React, Babel compiler, external font request, or application server is needed.

```sh
npm test
npx playwright install chromium
# With npm run dev running in another terminal:
npm run test:browser
npm run test:tablet
npm run test:resources
```

The browser checks cover all 20 pages (17 main pages plus three supporting pages) at 1440, 768, 390, and 320 pixels; WCAG A/AA automated checks; filtering and search; history restoration; gallery keyboard controls and focus return; media controls; old URLs; reduced motion; and JavaScript-disabled content.

## Edit content

- `content/site.json`: contact details, profile links, and canonical deployment URL.
- `content/projects.json`: the 13 case studies, repository mappings, galleries, videos, and technology.
- `content/assets.json`: inventory of all 139 original images. The 33 images removed from project galleries and the personal archive at the owner's request have `galleryExcluded: true`; the original files remain available for existing cover uses and archival reference. Optimized variants are used where available.
- `content/project-dates.json`: project dates and their sources. Ten projects use the latest commit on their repository's default branch, displayed in UTC with a commit link. CodeVision, Vision Studio, and AI Architectural Visualisations retain their originally recorded project years (2025, 2025, and 2024). Portfolio edits never determine project dates. All projects are labelled as past personal projects.
- `content/responsive-images.json`: responsive 480px and 960px WebP exports.
- `content/image-sizes.json`: intrinsic image dimensions used to reserve layout space.
- `content/repository-audit.json`: ten public repositories verified through the GitHub API.
- `content/project-resources.json`: project resource viewers, source URLs, notebook statistics, existing-media provenance, and excluded empty placeholders.
- `content/repository-resource-sources.json`: audited repository snapshots, commit IDs, content hashes, and published presentation/report links.
- `content/brand-artwork.json`: generated homepage artwork provenance and exact generation/edit prompts.
- `scripts/build.mjs`: shared HTML templates, complete case studies, canonical metadata, legacy routing, and sitemap.
- `styles/site.css`: design tokens and responsive layouts.
- `js/site.js`: progressive enhancement, accessible gallery, filters, and animation.
- `js/tablet-journey.js`: scroll-linked tablet expansion and the handoff to home-page content.
- `js/page-transitions.js`: native page-transition direction and early motion-preference handling.

After editing content or templates, run `npm run build`. Commit generated pages alongside their source data. `scripts/import-content.mjs` documents the initial migration from `data.jsx`; do not rerun it during normal editing, as it overwrites the current content files. Earlier JSX, CSS, and backups remain as historical resources and are no longer loaded by the new site.

To refresh project repository dates from GitHub, run `npm run update:dates`, then `npm run build`. Projects without a verified repository retain their recorded project years. Ordinary builds use the saved snapshot and do not change dates simply because a page was rebuilt.

## Pages and compatibility

Home, Projects, About, Contact, and all 13 original case-study paths are complete static pages. `project.html?id=...` continues to route old links to their corresponding case studies. The 404 page and the unlisted, noindex performance diagnostic page share the new branding. The development server also supports the `/YWS_Portfolio.github.io/` prefix used by GitHub Pages.

The Projects page combines discipline filters with text search. URLs retain selections. With JavaScript disabled, all projects, content, navigation, and original-image links remain available.

## Media and motion

All six supplied videos and seven GIF demonstrations are included. Videos use poster images and `preload="none"`; GIFs require an explicit play action and have pause controls. Native video controls remain available. Nothing autoplays. Architectural visualisations are identified as AI-generated studies.

The home hero presents the introduction inside an iPad-style frame with a dark bezel, metallic rim, rounded screen, and camera. Anime.js draws a horizontal line, lifts the tablet through it with a gentle perspective tilt, then reveals the text and links. Scrolling expands a separate foreground frame toward the viewport. The following sections stay hidden until the final part of the zoom, then appear inside the device. The frame stays fixed above content on every page, including the navigation and footer. Scrolling upward reverses the home-page expansion. This uses a sticky section and ordinary document scrolling; it does not intercept the wheel, create a nested scroll area, or lock scrolling. Keyboard focus reveals the relevant content immediately.

Same-origin page navigation uses native cross-document View Transitions: content slides sideways inside the persistent tablet edge. The bezel and navigation remain stationary; Back navigation reverses the slide. Links, history, hashes, and browser scroll restoration remain native. Browsers without cross-document View Transitions use normal navigation. The OS reduced-motion setting and saved footer motion preference skip the zoom and page slides; the device shell and all content remain available when JavaScript or Anime.js is unavailable.

`npm run test:tablet` checks zoom/reversal at four widths, foreground frame layering, persistent visible edges, content handoff, keyboard access, live reduced-motion changes, project navigation, sideways transitions, Back/Forward scroll restoration, saved motion preferences, and the GitHub Pages path prefix. Anime.js also supplies staggered section entrances, gallery changes, and filter transitions.

Fonts, animation code, and imagery are served locally. Licenses are retained in `fonts/OFL-Manrope.txt` and `js/vendor/ANIME-LICENSE.md`.

## Project resource library

Case studies have a resource index linking to their available galleries and demonstrations; empty galleries and resource sections are omitted. The ten verified public repositories provide 64 additional resource entries: three published presentations, one report, four diagrams, 14 notebooks, two videos, 30 images, and ten documentation readers. Existing matching images and GIFs are reused and attributed to their exact GitHub files. Projects without a verified public repository use their available local media.

Presentations and the report open in on-demand Google viewers with permanent original links. Notebooks and documentation use local static readers; the notebooks include 120 saved charts, collapsible code, and recorded outputs. They never execute notebook code. HTML is sanitised, credential-like strings are redacted, and embedded readers disallow scripts. Diagram/image viewers support zoom, scrolling, keyboard navigation, and focus return. The n8n sidebar links open visible workflow diagrams; both original GitHub JSON and local downloads remain available.

Resource media and readers are checked in, so `npm run build` requires no GitHub or Google requests. Four two-byte Sketch to Render media placeholders were excluded; the working local demonstrations remain on that page. Resource provenance points to the audited commits; published Google documents remain externally hosted and may change independently.

To refresh resources intentionally, update the audited snapshot in `content/repository-resource-sources.json`, install `scripts/resource-preview-requirements.txt`, then run `python scripts/import-project-resources.py`. The importer verifies file hashes and does not execute downloaded code. With the preview server running, `node scripts/render-resource-diagrams.mjs` renders the existing Mermaid definitions using pinned Mermaid 11.12.0; SVGs are shipped without adding Mermaid to the browser bundle. See the [Mermaid API documentation](https://mermaid.js.org/config/usage.html).

`node scripts/capture-resource-covers.mjs` optionally captures the first slides from the published decks. Convert the resulting covers to WebP and rerun the importer to use them. The presentation/report links are discovered in each repository's README, not inferred from project names. Rebuild with `npm run build` after refreshing resources.

## Publishing notes

The canonical deployment URL is `https://userdflt.github.io/YWS_Portfolio.github.io/`. If publishing elsewhere, update `content/site.json` and rebuild. `.nojekyll` and `sitemap.xml` are included. No changes have been pushed or published by the redesign task.

The branding email `youngwoosong@gmail.com` is used by default. The former site used `youngwoo930@gmail.com`; change the single site setting if that address is preferred.

The old Vision Studio GitHub URL returns 404. The CodeVision web application has no verified public repository. Their pages explain source availability; CodeVision links separately to the verified open-source retrieval prototype. The architectural visualisation collection has no standalone repository. Generic profile links are never labelled as project source code.

The biography draws on the existing portfolio, supplied branding, and saved LinkedIn screenshot in `uploads/`. LinkedIn blocked automated live access. Existing project research findings were retained; unsupported headline latency and deployment-status claims were removed. Automated accessibility results are not a substitute for editorial review of the supplied videos and their audio content before publication.

To regenerate image sizes and video posters after adding media, run `python scripts/prepare-media.py` (requires Pillow and ffmpeg), then rebuild. The public website uses only the checked-in output.

## Verification snapshot (16 September 2026)

- Seven static checks pass: links and anchors, responsive assets, media coverage, repository mappings, deterministic output, resource coverage, and static reader integrity.
- All 20 HTML pages pass browser checks at four viewport widths (320 to 1440px), with zero detected WCAG A/AA violations or browser errors.
- Filters, search, history, image-viewer keyboard interaction, source links, videos, GIF controls, mobile navigation, reduced motion, and JavaScript-disabled access verified.
- Homepage baseline before the resource library addition, Lighthouse 12.8.2 mobile: Performance 98, Accessibility 100, Best Practices 100, SEO 100. LCP 2.3s; total blocking time 0ms; layout shift 0. Production results depend on hosting and device conditions.
- The optional visible-label accessibility rule also passes.
- Resource verification covers 24 document readers at desktop and mobile widths, zero detected WCAG A/AA violations, iframe loading, notebook code expansion, diagram zoom, video playback, published presentation/report viewing, deployment-prefix paths, and JavaScript-disabled original links.
- Original user deletions were preserved; no commit, push, or publication performed.

The homepage uses `images/brand/aec-connected-intelligence.webp` for the hero and `images/brand/aec-generative-workflows.webp` for the applied AI section (original PNGs alongside them). These conceptual illustrations represent retrieval, automation, and image-generation tools. Exact prompts and built-in-tool provenance are recorded in [content/brand-artwork.json](content/brand-artwork.json).
