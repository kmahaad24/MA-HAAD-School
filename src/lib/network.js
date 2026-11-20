// True when the visitor turned on Data Saver or is on a 2G-class connection (browser only).
// Used to skip heavy extras (auto-playing slider, map frame, scroll animations) on slow internet.
export function isSlowConnection() {
  if (typeof navigator === 'undefined') return false;
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return false;
  return Boolean(c.saveData) || /(^|-)2g$/.test(c.effectiveType || '');
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
