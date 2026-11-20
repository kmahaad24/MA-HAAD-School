import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { uploadPath } from '@/server/storage';

export const dynamic = 'force-dynamic';

const TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif' };

// Serves uploaded images from UPLOAD_DIR. File names are random and never reused, so browsers may keep them
// for a year; repeat visits send "304 Not Modified" instead of the photo. Files are streamed, so a large photo
// never fills the server's memory.
export async function GET(req, { params }) {
  const parts = (await params).path || [];
  const file = uploadPath(`/uploads/${parts.map(encodeURIComponent).join('/')}`);
  const type = file && TYPES[path.extname(file).toLowerCase()];
  if (!type) return new Response('Not found', { status: 404 });

  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    const etag = `"${info.size.toString(36)}-${Math.floor(info.mtimeMs).toString(36)}"`;
    const headers = {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: etag,
      'Last-Modified': info.mtime.toUTCString(),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    };
    if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
    const body = Readable.toWeb(createReadStream(file));
    return new Response(body, { headers: { ...headers, 'Content-Length': String(info.size) } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
