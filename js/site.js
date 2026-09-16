// Content is static; core interactions do not depend on the optional motion engine.
import {createTabletJourney} from './tablet-journey.js';
document.documentElement.classList.add('js-enabled');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let preference;
try { preference = localStorage.getItem('yws-motion'); } catch { /* Optional storage. */ }
let motionEnabled = !reducedMotion.matches && preference !== 'off';
let anime, motionScope, observer, heroAnimation;
let stopTabletJourney;
const activeReveals = new Set();
const motionButton = document.querySelector('.motion-toggle');
motionButton.hidden = false;
function reflectMotion() {
  document.documentElement.classList.toggle('motion-paused', !motionEnabled);
  motionButton.textContent = `Motion: ${motionEnabled ? 'on' : 'off'}`;
  motionButton.setAttribute('aria-pressed', String(!motionEnabled));
  motionButton.setAttribute('aria-label', motionEnabled ? 'Motion: on — turn animations off' : 'Motion: off — turn animations on');
}
reflectMotion();
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('is-open', open);
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
});
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setMenu(false); });
matchMedia('(min-width: 481px)').addEventListener('change', () => setMenu(false));

// Shareable filter URLs and browser back/forward restoration.
const filterPanel = document.querySelector('[data-filters]');
let filterAnimation;
if (filterPanel) {
  filterPanel.hidden = false;
  const search = document.querySelector('#project-search');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.project-grid .project-card')];
  const count = document.querySelector('#project-count');
  const empty = document.querySelector('.empty-state');
  const valid = new Set(buttons.map(b => b.dataset.filter));
  let category = 'all';
  let searchTimer;
  function applyFilters({write = false, animate = false, replace = false} = {}) {
    const query = search.value.trim().toLowerCase();
    filterAnimation?.revert();
    buttons.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const visible = [];
    cards.forEach(card => {
      const matches = (category === 'all' || card.dataset.category === category) && query.split(/\s+/).every(word => card.dataset.search.includes(word));
      card.hidden = !matches;
      if (matches) visible.push(card);
    });
    count.textContent = category === 'all' && !query ? `Showing all ${cards.length} projects` : `${visible.length} ${visible.length === 1 ? 'project' : 'projects'} found${category === 'all' ? '' : ` in ${category}`}`;
    empty.hidden = visible.length > 0;
    if (write) {
      const url = new URL(location.href);
      category === 'all' ? url.searchParams.delete('category') : url.searchParams.set('category', category);
      query ? url.searchParams.set('q', search.value.trim()) : url.searchParams.delete('q');
      if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState']({}, '', url);
    }
    if (animate && motionEnabled && anime && visible.length) filterAnimation = anime.animate(visible, {opacity:[.25,1], y:[20,0], duration:520, delay:anime.stagger(35), ease:'outExpo'});
  }
  function restore() {
    const params = new URLSearchParams(location.search);
    category = valid.has(params.get('category')) ? params.get('category') : 'all';
    search.value = params.get('q') || '';
    applyFilters();
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    clearTimeout(searchTimer); category = button.dataset.filter; applyFilters({write:true,animate:true});
  }));
  search.addEventListener('input', () => {
    clearTimeout(searchTimer); searchTimer = setTimeout(() => applyFilters({write:true,replace:true,animate:true}), 120);
  });
  document.querySelector('.reset-filters').addEventListener('click', () => {
    clearTimeout(searchTimer); category = 'all'; search.value = ''; applyFilters({write:true,animate:true}); search.focus();
  });
  addEventListener('popstate', () => { clearTimeout(searchTimer); restore(); });
  restore();
}

// Native dialog provides focus containment and Escape. Without JS, open originals.
const dialog = document.querySelector('.lightbox');
const image = dialog.querySelector('.lightbox-image');
const caption = dialog.querySelector('.lightbox-caption');
const counter = dialog.querySelector('.lightbox-counter');
const original = dialog.querySelector('.lightbox-original');
const previous = dialog.querySelector('.lightbox-prev');
const next = dialog.querySelector('.lightbox-next');
const canvas = dialog.querySelector('.lightbox-canvas');
const zoomIn = dialog.querySelector('.zoom-in');
const zoomOut = dialog.querySelector('.zoom-out');
let zoom = 1;
function setZoom(value) {
  zoom = Math.max(1, Math.min(8, value));
  if (!image.naturalWidth || !dialog.open) return;
  const fit = Math.min((canvas.clientWidth - 24) / image.naturalWidth, (canvas.clientHeight - 24) / image.naturalHeight);
  image.style.width = `${Math.round(image.naturalWidth * fit * zoom)}px`;
  image.style.height = `${Math.round(image.naturalHeight * fit * zoom)}px`;
  zoomIn.disabled = zoom >= 8; zoomOut.disabled = zoom <= 1;
  dialog.querySelector('.zoom-level').textContent = `${Math.round(zoom * 100)}%`;
  if (zoom === 1) canvas.scrollTo(0, 0);
}
image.addEventListener('load', () => setZoom(zoom));
zoomIn.addEventListener('click', () => setZoom(zoom * 1.5));
zoomOut.addEventListener('click', () => setZoom(zoom / 1.5));
dialog.querySelector('.zoom-fit').addEventListener('click', () => setZoom(1));
addEventListener('resize', () => setZoom(zoom), {passive:true});
let group = [], current = 0, opener, imageAnimation;
function showImage(index) {
  current = index;
  zoom = 1;
  const link = group[current];
  imageAnimation?.revert();
  image.src = link.dataset.full;
  image.alt = link.querySelector('img').alt;
  caption.textContent = link.dataset.caption;
  counter.textContent = `${current + 1} / ${group.length}`;
  original.href = link.href;
  previous.disabled = current === 0;
  next.disabled = current === group.length - 1;
  if (motionEnabled && anime) imageAnimation = anime.animate(image, {opacity:[.35,1], scale:[.985,1], duration:350,ease:'outCubic'});
}
document.querySelectorAll('[data-gallery]').forEach(link => link.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  group = [...document.querySelectorAll('[data-gallery]')].filter(item => item.dataset.gallery === link.dataset.gallery);
  opener = link; showImage(group.indexOf(link)); dialog.showModal();
  setZoom(1);
  document.body.classList.add('dialog-open'); dialog.querySelector('.lightbox-close').focus();
}));
previous.addEventListener('click', () => { if (current > 0) showImage(current - 1); });
next.addEventListener('click', () => { if (current < group.length - 1) showImage(current + 1); });
dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
});
dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); opener?.focus(); });
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' && current > 0) { event.preventDefault(); showImage(current - 1); }
  if (event.key === 'ArrowRight' && current < group.length - 1) { event.preventDefault(); showImage(current + 1); }
  if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(zoom * 1.5); }
  if (event.key === '-') { event.preventDefault(); setZoom(zoom / 1.5); }
});

// Load heavy slide decks and static notebook readers only when a visitor asks.
document.querySelectorAll('[data-resource-viewer]').forEach(viewer => {
  viewer.hidden = false;
  const launch = viewer.querySelector('.resource-launch');
  const button = viewer.querySelector('.resource-load');
  const host = viewer.querySelector('.resource-frame-wrap');
  const footer = viewer.querySelector('.resource-viewer-footer');
  const close = viewer.querySelector('.resource-close');
  button.addEventListener('click', () => {
    const url = new URL(button.dataset.resourceSrc, location.href);
    const local = url.origin === location.origin;
    if (!local && (url.origin !== 'https://docs.google.com' || !/^\/(presentation|document)\//.test(url.pathname))) return;
    const frame = document.createElement('iframe');
    frame.title = button.dataset.resourceTitle;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.setAttribute('sandbox', local ? 'allow-same-origin allow-popups allow-popups-to-escape-sandbox' : 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation');
    frame.setAttribute('allow', 'fullscreen');
    frame.src = url.href;
    host.replaceChildren(frame); host.hidden = false; footer.hidden = false; launch.hidden = true;
    button.setAttribute('aria-expanded', 'true');
    frame.focus();
  });
  close.addEventListener('click', () => {
    host.replaceChildren(); host.hidden = true; footer.hidden = true; launch.hidden = false;
    button.setAttribute('aria-expanded', 'false'); button.focus();
  });
});

// Demonstrations play only on request, with a persistent pause control.
document.querySelectorAll('[data-gif]').forEach(button => {
  button.hidden = false;
  const img = button.querySelector('img'); const label = button.querySelector('span');
  const poster = img.src; let playing = false;
  const stop = () => { playing = false; img.src = poster; label.textContent = 'Play demonstration →'; button.setAttribute('aria-label',`Play demonstration: ${img.alt}`); };
  button.addEventListener('click', () => {
    if (playing) { stop(); return; }
    playing = true; img.src = button.dataset.gif; label.textContent = 'Pause demonstration Ⅱ'; button.setAttribute('aria-label',`Pause demonstration: ${img.alt}`);
  });
  button.stopDemo = stop;
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    document.querySelectorAll('video').forEach(video => video.pause());
    document.querySelectorAll('[data-gif]').forEach(button => button.stopDemo());
  }
});
let progressPending = false;
function updateProgress() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('.reading-progress').style.transform = `scaleX(${distance > 0 ? Math.min(scrollY / distance,1) : 0})`;
  progressPending = false;
}
addEventListener('scroll', () => { if (!progressPending) { progressPending = true; requestAnimationFrame(updateProgress); } }, {passive:true});
addEventListener('resize', updateProgress, {passive:true}); updateProgress();

function stopMotion() {
  stopTabletJourney?.(); stopTabletJourney = null;
  observer?.disconnect(); heroAnimation?.revert(); motionScope?.revert(); imageAnimation?.revert(); filterAnimation?.revert();
  const tabletHero = document.querySelector('[data-tablet-hero]');
  if (tabletHero) tabletHero.dataset.heroState = 'ready';
  activeReveals.forEach(animation => animation.revert()); activeReveals.clear();
  document.querySelectorAll('[data-reveal]').forEach(element => { element.style.removeProperty('opacity'); element.style.removeProperty('transform'); });
}
function startMotion() {
  if (!motionEnabled || !anime) return;
  stopTabletJourney = createTabletJourney(anime, () => heroAnimation?.complete());
  motionScope = anime.createScope().add(() => {
    const tabletHero = document.querySelector('[data-tablet-hero]');
    const arriving = document.documentElement.dataset.pageArrival === 'true';
    if (tabletHero && !arriving && scrollY < 5 && !tabletHero.contains(document.activeElement)) {
      const mobile = matchMedia('(max-width: 760px)').matches;
      tabletHero.dataset.heroState = 'revealing';
      heroAnimation = anime.createTimeline({defaults:{ease:'outExpo'},onComplete:() => { tabletHero.dataset.heroState = 'ready'; }})
        .add('.tablet-line',{scaleX:[0,1],duration:650,ease:'inOutCubic'},0)
        .add('.tablet-slot',{scaleX:[0,1],opacity:[0,1],duration:650},150)
        .add('.hero-tablet',{y:['115%',0],rotateX:[mobile?12:24,0],scale:[.9,1],duration:mobile?1150:1450,ease:'outQuart'},240)
        .add('.tablet-ground-shadow',{scaleX:[.3,1],opacity:[0,.6],duration:1100},400)
        .add('[data-tablet-content]',{y:[18,0],opacity:[0,1],duration:650,delay:anime.stagger(80)},mobile?650:850);
    } else if (tabletHero) tabletHero.dataset.heroState = 'ready';
    const title = document.querySelector('[data-title]');
    if (title && !arriving) anime.animate(title,{y:[24,0],opacity:[.25,1],duration:900,ease:'outExpo'});
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (motionEnabled && !entry.target.hidden) {
          const animation = anime.animate(entry.target,{y:[24,0],opacity:[.2,1],duration:800,ease:'outExpo',onComplete: self => activeReveals.delete(self)});
          activeReveals.add(animation);
        }
      });
    },{threshold:.08});
    // Never pre-hide content: animation failure must leave the document readable.
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
  });
}
// A visitor can tab straight into the hero while its entrance is running.
// Finish the sequence immediately so keyboard focus is never clipped below the line.
document.querySelector('[data-tablet-hero]')?.addEventListener('focusin', () => { heroAnimation?.complete(); });
motionButton.addEventListener('click', () => {
  motionEnabled = !motionEnabled; preference = motionEnabled ? 'on' : 'off';
  try { localStorage.setItem('yws-motion',preference); } catch { /* Optional preference. */ }
  stopMotion(); reflectMotion(); if (motionEnabled) startMotion();
});
reducedMotion.addEventListener('change', event => {
  motionEnabled = !event.matches && preference !== 'off';
  stopMotion(); reflectMotion(); if (motionEnabled) startMotion();
});
import('./vendor/anime.esm.min.js').then(module => { anime = module; startMotion(); }).catch(() => { stopMotion(); motionEnabled = false; reflectMotion(); });
