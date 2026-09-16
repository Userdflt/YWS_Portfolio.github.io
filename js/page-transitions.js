// Runs before first paint so cross-document transitions respect saved preferences.
// Links and history remain browser navigations; no click interception or fetching.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => {
    let saved;
    try { saved = localStorage.getItem('yws-motion'); } catch { /* Optional storage. */ }
    return reduced.matches || saved === 'off' || root.classList.contains('motion-paused');
  };
  if (motionOff()) root.classList.add('motion-paused');
  else root.classList.add('motion-allowed');
  const activation = window.navigation?.activation;
  if (activation?.from && activation.navigationType !== 'reload') root.dataset.pageArrival = 'true';

  function direction(activation) {
    if (!activation?.from || !activation.entry) return 'forward';
    if (activation.navigationType === 'traverse') return activation.entry.index < activation.from.index ? 'back' : 'forward';
    const depth = value => {
      const path = new URL(value).pathname;
      if (/\/projects\/[^/]+\.html$/.test(path)) return 2;
      if (/\/(?:projects|about|contact)\.html$/.test(path)) return 1;
      return 0;
    };
    return depth(activation.entry.url) < depth(activation.from.url) ? 'back' : 'forward';
  }
  function prepare(event, activation, incoming) {
    const transition = event.viewTransition;
    if (!transition) return;
    if (motionOff()) { transition.skipTransition(); return; }
    root.dataset.transitionDirection = direction(activation);
    root.dataset.pageTransition = incoming ? 'entering' : 'leaving';
    if (incoming) root.dataset.pageArrival = 'true';
    const skip = () => { if (reduced.matches || root.classList.contains('motion-paused')) transition.skipTransition(); };
    reduced.addEventListener('change', skip);
    transition.finished.catch(() => {}).finally(() => {
      reduced.removeEventListener('change', skip);
      delete root.dataset.pageTransition;
    });
  }
  addEventListener('pageswap', event => prepare(event, event.activation, false));
  addEventListener('pagereveal', event => prepare(event, window.navigation?.activation, true));
})();
