// Keep document scrolling native. Only the tablet's presentation follows scroll.
export function createTabletJourney(anime, finishEntrance) {
  const journey = document.querySelector('[data-tablet-journey]');
  if (!journey) return () => {};
  const hero = journey.querySelector('[data-tablet-hero]');
  const zoom = journey.querySelector('.tablet-zoom');
  const tablet = journey.querySelector('.hero-tablet');
  const layout = journey.querySelector('.tablet-layout');
  const content = document.querySelector('.home-content');
  const header = document.querySelector('.site-header');
  const heroFooter = hero.querySelector('.tablet-hero-footer');
  const device = document.querySelector('.device-frame');
  const root = document.documentElement;
  let deviceStart, deviceEnd;
  let timeline, frame, start = 0, distance = 1, progress = 0, lastSize = '';
  let disposed = false;
  journey.classList.add('has-tablet-journey');
  root.classList.add('tablet-portal-active');

  function draw() {
    frame = null;
    if (disposed) return;
    progress = Math.max(0, Math.min(1, (scrollY - start) / distance));
    if (progress > 0) finishEntrance();
    timeline?.seek(progress * 1000);
    layout.style.pointerEvents = progress > .7 ? 'none' : '';
    zoom.style.pointerEvents = progress > .7 ? 'none' : '';
    heroFooter.style.pointerEvents = progress > .15 ? 'none' : '';
    header.style.pointerEvents = progress > .001 && progress < .99 ? 'none' : '';
    content.style.opacity = String(Math.max(0, Math.min(1, (progress - .8) / .2)));
    content.style.pointerEvents = progress < .98 ? 'none' : '';
    const visible = progress > .001;
    device.style.opacity = visible ? '1' : '0';
    root.classList.toggle('tablet-portal-open', progress >= .999);
    journey.classList.toggle('uses-foreground-frame', visible);
    for (const key of ['left','top','width','height','radius','bezel']) {
      const value = deviceStart[key] + (deviceEnd[key] - deviceStart[key]) * progress;
      device.style.setProperty(`--frame-${key}`, `${value}px`);
    }
    journey.dataset.zoomProgress = progress.toFixed(3);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function offsetWithin(element, parent) {
    let top = 0;
    while (element && element !== parent) { top += element.offsetTop; element = element.offsetParent; }
    return top;
  }
  function measure() {
    if (disposed) return;
    timeline?.revert();
    const styles = getComputedStyle(root);
    const gap = parseFloat(styles.getPropertyValue('--device-gap'));
    const bezel = parseFloat(styles.getPropertyValue('--device-bezel'));
    const radius = parseFloat(styles.getPropertyValue('--device-radius'));
    const screenInset = gap + bezel + 2;
    const headerHeight = header.offsetHeight + screenInset;
    const heroHeight = hero.offsetHeight;
    const pinTop = Math.min(headerHeight, innerHeight - heroHeight - screenInset);
    distance = Math.max(460, Math.min(900, innerHeight * .85));
    const overlap = Math.min(heroHeight, innerHeight * .9);
    journey.style.setProperty('--tablet-pin-top', `${pinTop}px`);
    journey.style.setProperty('--tablet-hero-height', `${heroHeight}px`);
    journey.style.setProperty('--tablet-scroll-distance', `${distance}px`);
    content.style.setProperty('--tablet-overlap', `${overlap}px`);
    start = journey.getBoundingClientRect().top + scrollY - pinTop;
    const initialTop = pinTop + offsetWithin(tablet, hero);
    const centreY = pinTop + offsetWithin(zoom, hero) + zoom.offsetHeight / 2;
    const tabletStyle = getComputedStyle(tablet);
    deviceStart = {left:(document.documentElement.clientWidth - tablet.offsetWidth) / 2,top:initialTop,width:tablet.offsetWidth,height:tablet.offsetHeight,radius:parseFloat(tabletStyle.borderRadius),bezel:parseFloat(tabletStyle.paddingLeft) + 1};
    deviceEnd = {left:gap,top:gap,width:document.documentElement.clientWidth - gap * 2,height:innerHeight - gap * 2,radius,bezel};
    const scale = deviceEnd.width / tablet.offsetWidth;
    const translateY = gap - centreY - (initialTop - centreY) * scale;
    timeline = anime.createTimeline({autoplay:false,defaults:{ease:'linear'}})
      .add(zoom,{scale:[1,scale],y:[0,translateY],duration:1000},0)
      .add('.tablet-hero-heading, .tablet-hero-footer, .tablet-baseline, .tablet-ground-shadow',{opacity:[1,0],duration:280},0)
      .add('.tablet-topbar, .tablet-layout',{opacity:[1,0],duration:300},480)
      .add(zoom,{opacity:[1,0],duration:200},800)
      .add(header,{opacity:[1,0],duration:120},0)
      .add(header,{opacity:[0,1],duration:120},880);
    lastSize = `${innerWidth}:${innerHeight}:${tablet.offsetWidth}:${tablet.offsetHeight}`;
    draw();
  }
  const resize = new ResizeObserver(() => {
    const size = `${innerWidth}:${innerHeight}:${tablet.offsetWidth}:${tablet.offsetHeight}`;
    if (size !== lastSize) measure();
  });
  measure();
  resize.observe(tablet);
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', measure, {passive:true});
  addEventListener('pageshow', measure);

  // Restore the introduction if keyboard navigation returns to an enlarged screen.
  function restoreFocusedHero(event) {
    if (progress > .1 && event.target.matches(':focus-visible')) scrollTo({top:Math.max(0, start),behavior:'instant'});
    finishEntrance();
    draw();
  }
  hero.querySelector('.tablet-actions').addEventListener('focusin', restoreFocusedHero);
  function revealFocusedContent() {
    if (progress < 1) { scrollTo({top:Math.ceil(start + distance),behavior:'instant'}); draw(); }
  }
  content.addEventListener('focusin', revealFocusedContent);
  function revealFocusedNavigation() { if (progress > .001) revealFocusedContent(); }
  header.addEventListener('focusin', revealFocusedNavigation);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    removeEventListener('scroll', schedule);
    removeEventListener('resize', measure);
    removeEventListener('pageshow', measure);
    hero.querySelector('.tablet-actions').removeEventListener('focusin', restoreFocusedHero);
    content.removeEventListener('focusin', revealFocusedContent);
    header.removeEventListener('focusin', revealFocusedNavigation);
    const contentTop = content.getBoundingClientRect().top;
    const wasBelow = contentTop < innerHeight;
    timeline?.revert();
    layout.style.removeProperty('pointer-events');
    zoom.style.removeProperty('pointer-events');
    header.style.removeProperty('pointer-events');
    heroFooter.style.removeProperty('pointer-events');
    journey.classList.remove('has-tablet-journey');
    journey.classList.remove('uses-foreground-frame');
    root.classList.remove('tablet-portal-active','tablet-portal-open');
    device.removeAttribute('style');
    journey.removeAttribute('style');
    content.style.removeProperty('--tablet-overlap');
    content.style.removeProperty('opacity');
    content.style.removeProperty('pointer-events');
    delete journey.dataset.zoomProgress;
    if (scrollY > start) {
      if (wasBelow) scrollBy({top:content.getBoundingClientRect().top - contentTop,behavior:'instant'});
      else scrollTo({top:Math.max(0, start),behavior:'instant'});
    }
  };
}
