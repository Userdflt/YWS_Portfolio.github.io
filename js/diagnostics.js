addEventListener('load', () => {
  requestAnimationFrame(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const data = [
      ['Document ready', `${Math.round(navigation.domContentLoadedEventEnd)} ms`],
      ['Page load', `${Math.round(navigation.loadEventEnd)} ms`],
      ['Resource requests', String(resources.length)],
      ['Transferred resources', `${Math.round(resources.reduce((sum, item) => sum + item.transferSize, 0) / 1024)} KB`],
      ['Viewport', `${innerWidth} × ${innerHeight}`],
      ['Reduced motion preference', matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Enabled' : 'Disabled'],
    ];
    const container = document.querySelector('#diagnostics');
    container.replaceChildren(...data.map(([label, value]) => {
      const group = document.createElement('div'); const term = document.createElement('dt'); const description = document.createElement('dd');
      term.textContent = label; description.textContent = value; group.append(term, description); return group;
    }));
  });
});
