import { apiSecure, apiError } from '@/lib/api-client';

// Longest side photos are shrunk to in the browser before upload (same limits as the server)
const MAX_SIDE = { gallery: 2000, content: 2000, staff: 800, leaders: 900, notices: 1600, misc: 1600 };
// Files under this size are sent as they are
const SMALL_FILE = 300 * 1024;

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not a readable image.'));
    };
    img.src = url;
  });
}

/**
 * Shrinks a large phone photo in the browser (e.g. 6 MB → ~300 KB) so uploads are quick on slow
 * internet and work even if the server cannot resize images. GIFs and small files are left alone.
 */
export async function compressImage(file, folder = 'misc') {
  if (typeof window === 'undefined' || file.type === 'image/gif' || file.size <= SMALL_FILE) return file;
  try {
    const { img, url } = await loadImage(file);
    const max = MAX_SIDE[folder] || 1600;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    // Keep transparent logos transparent; photos get a white background
    if (file.type !== 'image/png') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const type = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg');
    return new File([blob], name, { type });
  } catch {
    return file;
  }
}

/**
 * Uploads one image to /api/uploads → { url, width, height }.
 * onProgress(0–100) reports the upload progress for a progress bar.
 */
export async function uploadImage(file, folder, { onProgress } = {}) {
  const ready = await compressImage(file, folder);
  const form = new FormData();
  form.append('file', ready);
  form.append('folder', folder);
  try {
    const res = await apiSecure.post('/uploads', form, {
      timeout: 120000,
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    });
    return res.data.data;
  } catch (err) {
    if (err?.code === 'ECONNABORTED' || !err?.response) throw new Error('The upload stopped — the internet connection may be slow. Please try again.');
    if (err.response.status === 413) throw new Error('The image is too large for the server. Try a smaller photo.');
    throw new Error(apiError(err, 'The image could not be uploaded.'));
  }
}
