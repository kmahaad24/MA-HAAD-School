'use client';
import { useRef, useState } from 'react';
import { FaCloudUploadAlt, FaTrashAlt, FaImage, FaLink } from 'react-icons/fa';
import { uploadImage, IMAGE_ACCEPT } from '@/lib/upload';
import { cn } from '@/lib/utils';

/**
 * Photo picker: shrinks and uploads the chosen file straight away (with a progress bar) and reports the new
 * link. Photos can also be dropped onto the preview, or given as an https:// link.
 *   <ImageUpload value={form.photo} folder="staff" onChange={(url, info) => …} />
 */
export default function ImageUpload({ value, onChange, folder = 'misc', label = 'Photo', aspect = 'aspect-[4/3]', hint, allowRemove = true, allowLink = false, id }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const busy = progress !== null;

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose a JPG, PNG, WebP or GIF image.');
      return;
    }
    setProgress(0);
    setError('');
    try {
      const info = await uploadImage(file, folder, { onProgress: setProgress });
      onChange(info.url, info);
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    upload(file);
  };

  return (
    <div>
      {label && <p className="mb-1 block text-sm font-medium text-body">{label}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => !busy && input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'relative w-full max-w-[220px] overflow-hidden rounded-xl border bg-line/5 transition',
            dragging ? 'border-primary-500 ring-2 ring-primary-200' : 'border-line/15 hover:border-primary-400',
            aspect
          )}
          aria-label={value ? 'Change photo' : 'Upload photo'}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of a just-uploaded file
            <img src={value} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-faint">
              <FaImage className="text-3xl" aria-hidden />
              <span className="text-xs">Click or drop a photo</span>
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 px-4 text-white">
              <span className="text-sm font-semibold">{progress < 100 ? `Uploading ${progress}%` : 'Processing…'}</span>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                <span className="block h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
              </span>
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm font-medium text-body hover:bg-line/5 disabled:opacity-60"
            >
              <FaCloudUploadAlt aria-hidden /> {busy ? 'Uploading…' : value ? 'Change photo' : 'Upload photo'}
            </button>
            {allowLink && (
              <button type="button" onClick={() => setLinkMode((v) => !v)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-line/5">
                <FaLink aria-hidden /> Use a link
              </button>
            )}
          </div>
          {linkMode && (
            <input
              id={id}
              type="url"
              defaultValue={value?.startsWith('http') ? value : ''}
              placeholder="https://…"
              onBlur={(e) => {
                const url = e.target.value.trim();
                if (!url || /^https:\/\//i.test(url)) onChange(url, null);
                else setError('The link must start with https://');
              }}
              className="w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none"
            />
          )}
          {value && allowRemove && (
            <button type="button" onClick={() => onChange('', null)} disabled={busy} className="flex items-center gap-2 text-sm text-red-600 hover:underline">
              <FaTrashAlt aria-hidden /> Remove photo
            </button>
          )}
          <p className="text-xs text-subtle">{hint || 'JPG, PNG or WebP. Large photos are made smaller automatically before upload.'}</p>
          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        </div>
      </div>
      <input ref={input} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={pick} />
    </div>
  );
}
