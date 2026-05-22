/**
 * client:tina directive
 * Only hydrates the component when the page is loaded inside Tina's visual editor iframe.
 * In production, React is never loaded — zero JS overhead.
 *
 * @type {import('astro').ClientDirective}
 */
export default (load, opts, el) => {
  try {
    const isEditor = window.frameElement && window.frameElement.id === 'tina-iframe';
    if (isEditor) {
      load().then((hydrate) => hydrate());
    }
  } catch (e) {
    // silently fail in production (cross-origin iframe check throws)
  }
};
