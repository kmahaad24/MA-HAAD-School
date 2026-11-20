'use client';
import { useId, useState } from 'react';
import { FaArrowUp, FaArrowDown, FaTrashAlt, FaPlus, FaChevronDown, FaCopy } from 'react-icons/fa';
import { ICON_OPTIONS } from '@/content/icons';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import ImageUpload from './ImageUpload';

// Draws an editable form from a field list (src/content/schema.js). Values are kept as plain JSON;
// `paragraphs` and `lines` fields are edited as text and turned into lists by the server when saved.
//   <SchemaForm fields={section.fields} value={value} onChange={setValue} />

const input =
  'w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink placeholder-faint focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 read-only:bg-line/5 read-only:text-muted';

const WIDE = new Set(['textarea', 'paragraphs', 'lines', 'image', 'group', 'list']);

// Starting value for a new list row
export function emptyValue(field) {
  switch (field.type) {
    case 'group':
      return Object.fromEntries(field.fields.map((f) => [f.name, emptyValue(f)]));
    case 'list':
    case 'paragraphs':
    case 'lines':
      return [];
    case 'toggle':
      return false;
    case 'icon':
      return ICON_OPTIONS[0].value;
    case 'select':
      return field.options[0].value;
    default:
      return '';
  }
}

const asText = (value, sep) => (Array.isArray(value) ? value.join(sep) : value ?? '');

function Label({ htmlFor, field }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-body">
      {field.label} {field.required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Help({ text }) {
  return text ? <p className="mt-1 text-xs text-subtle">{text}</p> : null;
}

function IconPicker({ id, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-lg text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
        <Icon name={value} />
      </span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={input}>
        {ICON_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ id, field, value, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-line/15 px-3 py-2.5">
      <span className="text-sm font-medium text-body">{field.label}</span>
      <span className="relative inline-flex">
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-line/20 transition peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function Field({ field, value, onChange, path }) {
  const id = useId();
  switch (field.type) {
    case 'text':
    case 'email':
    case 'link':
      return (
        <div>
          <Label htmlFor={id} field={field} />
          <input
            id={id}
            type={field.type === 'email' ? 'email' : 'text'}
            inputMode={field.type === 'link' ? 'url' : undefined}
            value={value ?? ''}
            onChange={(e) => onChange(field.slug ? e.target.value.toLowerCase().replace(/\s+/g, '-') : e.target.value)}
            maxLength={field.max}
            readOnly={field.readOnly}
            placeholder={field.placeholder || (field.type === 'link' ? '/page or https://…' : undefined)}
            className={input}
          />
          <Help text={field.help} />
        </div>
      );
    case 'textarea':
    case 'paragraphs':
    case 'lines': {
      const sep = field.type === 'paragraphs' ? '\n\n' : '\n';
      return (
        <div>
          <Label htmlFor={id} field={field} />
          <textarea id={id} rows={field.rows || 3} value={asText(value, sep)} onChange={(e) => onChange(e.target.value)} maxLength={field.type === 'textarea' ? field.max : undefined} placeholder={field.placeholder} className={cn(input, 'leading-relaxed')} />
          <Help text={field.help || (field.type === 'paragraphs' ? 'Leave an empty line between paragraphs.' : field.type === 'lines' ? 'One item per line.' : '')} />
        </div>
      );
    }
    case 'image':
      return <ImageUpload label={field.label} value={value || ''} folder={field.folder || 'content'} onChange={(url) => onChange(url)} hint={field.help} allowLink aspect="aspect-video" />;
    case 'icon':
      return (
        <div>
          <Label htmlFor={id} field={field} />
          <IconPicker id={id} value={value} onChange={onChange} />
        </div>
      );
    case 'select':
      return (
        <div>
          <Label htmlFor={id} field={field} />
          <select id={id} value={value ?? field.options[0].value} onChange={(e) => onChange(e.target.value)} className={input}>
            {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Help text={field.help} />
        </div>
      );
    case 'toggle':
      return <Toggle id={id} field={field} value={value} onChange={onChange} />;
    case 'group':
      return (
        <fieldset className="rounded-xl border border-line/15 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">{field.label}</legend>
          <Help text={field.help} />
          <Fields fields={field.fields} value={value || {}} onChange={onChange} path={path} />
        </fieldset>
      );
    case 'list':
      return <ListField field={field} value={Array.isArray(value) ? value : []} onChange={onChange} path={path} />;
    default:
      return null;
  }
}

function Fields({ fields, value, onChange, path = '' }) {
  return (
    <div className="mt-2 grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className={cn(WIDE.has(field.type) && 'sm:col-span-2')}>
          <Field field={field} value={value[field.name]} path={`${path}.${field.name}`} onChange={(v) => onChange({ ...value, [field.name]: v })} />
        </div>
      ))}
    </div>
  );
}

function ListField({ field, value, onChange, path }) {
  const [open, setOpen] = useState(() => (value.length === 1 ? 0 : null));
  const fixed = Boolean(field.fixed);
  const full = field.maxItems && value.length >= field.maxItems;

  const move = (i, step) => {
    const next = [...value];
    const [row] = next.splice(i, 1);
    next.splice(i + step, 0, row);
    onChange(next);
    if (open === i) setOpen(i + step);
  };
  const add = () => {
    onChange([...value, emptyValue({ type: 'group', fields: field.fields })]);
    setOpen(value.length);
  };
  const duplicate = (i) => {
    const copy = structuredClone(value[i]);
    const slugField = field.fields.find((f) => f.slug);
    if (slugField && copy[slugField.name]) copy[slugField.name] = `${copy[slugField.name]}-copy`;
    onChange([...value.slice(0, i + 1), copy, ...value.slice(i + 1)]);
    setOpen(i + 1);
  };
  const remove = (i) => {
    const label = value[i]?.[field.itemLabel] || `item ${i + 1}`;
    if (!window.confirm(`Remove “${label}”?`)) return;
    onChange(value.filter((_, j) => j !== i));
    setOpen(null);
  };

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{field.label}</p>
          <Help text={field.help} />
        </div>
        <span className="shrink-0 text-xs text-subtle">
          {value.length}
          {field.maxItems ? ` / ${field.maxItems}` : ''}
        </span>
      </div>
      <ol className="space-y-2">
        {value.map((row, i) => {
          const isOpen = open === i;
          const title = row?.[field.itemLabel] || `${field.label} ${i + 1}`;
          return (
            <li key={i} className={cn('rounded-xl border bg-surface', isOpen ? 'border-primary-300 shadow-sm dark:border-primary-500/40' : 'border-line/15')}>
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-line/5" aria-expanded={isOpen}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line/10 text-xs font-semibold text-muted">{i + 1}</span>
                  {row?.icon && <Icon name={row.icon} className="shrink-0 text-primary-600" />}
                  <span className="truncate font-medium text-ink">{title}</span>
                  <FaChevronDown className={cn('ml-auto shrink-0 text-xs text-faint transition-transform', isOpen && 'rotate-180')} aria-hidden />
                </button>
                {!fixed && (
                  <div className="flex shrink-0 items-center">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-2 text-faint hover:bg-line/10 hover:text-ink disabled:opacity-30" aria-label="Move up">
                      <FaArrowUp className="text-xs" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded p-2 text-faint hover:bg-line/10 hover:text-ink disabled:opacity-30" aria-label="Move down">
                      <FaArrowDown className="text-xs" />
                    </button>
                    <button type="button" onClick={() => duplicate(i)} disabled={full} className="hidden rounded p-2 text-faint hover:bg-line/10 hover:text-ink disabled:opacity-30 sm:block" aria-label="Duplicate">
                      <FaCopy className="text-xs" />
                    </button>
                    <button type="button" onClick={() => remove(i)} className="rounded p-2 text-faint hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" aria-label="Remove">
                      <FaTrashAlt className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
              {isOpen && (
                <div className="border-t border-line/10 px-4 pb-4 pt-2">
                  <Fields fields={field.fields} value={row || {}} path={`${path}[${i}]`} onChange={(v) => onChange(value.map((r, j) => (j === i ? v : r)))} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!value.length && <p className="rounded-xl border border-dashed border-line/20 px-4 py-6 text-center text-sm text-subtle">Nothing here yet.</p>}
      {!fixed && (
        <button
          type="button"
          onClick={add}
          disabled={full}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-dashed border-primary-300 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-300 dark:hover:bg-primary-500/10"
        >
          <FaPlus className="text-xs" aria-hidden /> Add {field.label.toLowerCase().replace(/s$/, '')}
        </button>
      )}
    </div>
  );
}

export default function SchemaForm({ fields, value, onChange }) {
  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <section key={field.name} className={cn(field.type === 'group' || field.type === 'list' ? '' : 'rounded-xl border border-line/10 p-4')}>
          <Field field={field} value={value?.[field.name]} path={field.name} onChange={(v) => onChange({ ...value, [field.name]: v })} />
        </section>
      ))}
    </div>
  );
}
