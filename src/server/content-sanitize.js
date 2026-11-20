// Cleans dashboard input for a content section using its field list (src/content/schema.js).
// Unknown keys are dropped, text is trimmed and length-limited, links and images are checked so a
// saved value can never inject a `javascript:` link or an untrusted map frame.
import { HttpError } from '@/server/http';
import { ICON_KEYS } from '@/content/icons';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LINK_RE = /^(\/(?!\/)|#|https?:\/\/|tel:|mailto:)/i;
const IMAGE_RE = /^(\/(?!\/)|https:\/\/)/i;
const MAP_EMBED_RE = /^https:\/\/(www\.)?(google\.com\/maps|maps\.google\.com\/)/i;

const DEFAULT_MAX = { text: 300, textarea: 3000, link: 1000, image: 1000, email: 160 };

const clip = (value, max) => (value === undefined || value === null ? '' : String(value).replace(/\r\n?/g, '\n').trim().slice(0, max));

function fail(path, message) {
  throw new HttpError(400, `${path}: ${message}`);
}

function cleanValue(field, value, path) {
  const label = path || field.label;
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const out = clip(value, field.max || DEFAULT_MAX[field.type]);
      if (field.type === 'text' && /\n/.test(out)) return out.replace(/\s*\n\s*/g, ' ');
      if (field.slug && out && !SLUG_RE.test(out)) fail(label, 'use lower-case letters, numbers and dashes only (e.g. computer-lab).');
      if (field.pattern && out && !new RegExp(field.pattern).test(out)) fail(label, `use the format ${field.placeholder || field.pattern}.`);
      if (field.required && !out) fail(label, 'this field is required.');
      return out;
    }
    case 'email': {
      const out = clip(value, DEFAULT_MAX.email).toLowerCase();
      if (out && !EMAIL_RE.test(out)) fail(label, 'enter a valid email address.');
      return out;
    }
    case 'link': {
      const out = clip(value, DEFAULT_MAX.link);
      if (out && !LINK_RE.test(out)) fail(label, 'links must start with /, https://, tel: or mailto:');
      if (field.name === 'mapEmbed' && out && !MAP_EMBED_RE.test(out)) fail(label, 'use the Google Maps embed address (https://www.google.com/maps/embed?…).');
      if (field.required && !out) fail(label, 'this field is required.');
      return out;
    }
    case 'image': {
      const out = clip(value, DEFAULT_MAX.image);
      if (out && !IMAGE_RE.test(out)) fail(label, 'the image must be uploaded, or be a link starting with https://');
      if (field.required && !out) fail(label, 'upload a photo.');
      return out;
    }
    case 'icon':
      return ICON_KEYS.includes(value) ? value : ICON_KEYS[0];
    case 'select':
      return field.options.some((o) => o.value === value) ? value : field.options[0].value;
    case 'toggle':
      return Boolean(value);
    case 'paragraphs': {
      const raw = Array.isArray(value) ? value.join('\n\n') : String(value ?? '');
      return clip(raw, field.max || 20000)
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 100);
    }
    case 'lines': {
      const raw = Array.isArray(value) ? value : String(value ?? '').split('\n');
      return raw
        .map((l) => clip(l, field.max || 300))
        .filter(Boolean)
        .slice(0, field.maxItems || 100);
    }
    case 'group':
      return cleanFields(field.fields, value && typeof value === 'object' && !Array.isArray(value) ? value : {}, label);
    case 'list': {
      const rows = (Array.isArray(value) ? value : []).slice(0, field.maxItems || 100);
      const out = rows.map((row, i) => cleanFields(field.fields, row && typeof row === 'object' ? row : {}, `${label} ${i + 1}`));
      // Page addresses must be unique inside a list
      const slugField = field.fields.find((f) => f.slug);
      if (slugField) {
        const seen = new Set();
        out.forEach((row, i) => {
          if (seen.has(row[slugField.name])) fail(`${label} ${i + 1}`, `the page address “${row[slugField.name]}” is used twice.`);
          seen.add(row[slugField.name]);
        });
      }
      return out;
    }
    default:
      return undefined;
  }
}

function cleanFields(fields, input, path = '') {
  const out = {};
  for (const field of fields) {
    const name = path ? `${path} › ${field.label}` : field.label;
    out[field.name] = cleanValue(field, input[field.name], name);
  }
  return out;
}

// Rows of `fixed` lists can be edited but not added, removed or renamed: keep the built-in rows and
// their read-only keys, take only the editable fields from the input.
function keepFixedRows(fields, cleaned, defaults) {
  for (const field of fields) {
    if (field.type === 'group' && defaults?.[field.name]) keepFixedRows(field.fields, cleaned[field.name], defaults[field.name]);
    if (field.type !== 'list' || !field.fixed) continue;
    const readOnly = field.fields.filter((f) => f.readOnly).map((f) => f.name);
    const idKey = readOnly[0];
    const base = defaults?.[field.name] || [];
    cleaned[field.name] = base.map((row) => {
      const edited = cleaned[field.name].find((r) => idKey && r[idKey] === row[idKey]) || {};
      const merged = { ...row, ...edited };
      readOnly.forEach((k) => (merged[k] = row[k]));
      return merged;
    });
  }
  return cleaned;
}

export function sanitizeSection(section, input, defaults) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Send the content as a JSON object.');
  return keepFixedRows(section.fields, cleanFields(section.fields, input), defaults);
}
