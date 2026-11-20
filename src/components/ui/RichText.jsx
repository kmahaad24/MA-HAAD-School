import { Fragment } from 'react';
import Link from 'next/link';
import { isExternal } from '@/lib/utils';

const SAFE_LINK = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

// Inline formatting for text written in the dashboard: **bold** and [label](/link).
// Anything else is shown as plain text (no HTML is ever injected).
export function Inline({ text, linkClassName = 'font-medium text-brand-600 underline-offset-2 hover:underline' }) {
  const parts = String(text ?? '').split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i} className="font-semibold text-navy-900">{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link && SAFE_LINK.test(link[2])) {
      return isExternal(link[2]) ? (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className={linkClassName}>{link[1]}</a>
      ) : (
        <Link key={i} href={link[2]} className={linkClassName}>{link[1]}</Link>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// Paragraphs (array, or text with blank lines between paragraphs). Lines starting with "- " become a bullet list.
export default function RichText({ value, className = 'prose-school', lead = false }) {
  const blocks = Array.isArray(value) ? value : String(value ?? '').split(/\n\s*\n/);
  const items = blocks.map((b) => String(b).trim()).filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={className}>
      {items.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((l) => /^\s*-\s+/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*-\s+/, '')} /></li>)}
            </ul>
          );
        }
        return (
          <p key={i} className={lead && i === 0 ? 'text-lg font-medium leading-relaxed text-navy-900' : undefined}>
            <Inline text={block} />
          </p>
        );
      })}
    </div>
  );
}
