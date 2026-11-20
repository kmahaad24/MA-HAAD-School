// Soft grey shimmer shown while a photo downloads (next/image `placeholder`). Tiny inline SVG — no extra request,
// so slow connections see the layout and a calm placeholder instead of empty white boxes.
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30" viewBox="0 0 40 30"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset=".5" stop-color="#f1f5f9"/><stop offset="1" stop-color="#e2e8f0"/></linearGradient></defs><rect width="40" height="30" fill="url(#g)"/></svg>';

export const SHIMMER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
