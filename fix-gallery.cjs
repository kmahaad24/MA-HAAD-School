const fs = require('fs');
const f = 'src/components/school/GalleryGrid.jsx';
let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { if (!s.includes(a)) { console.error('MISSING', a.slice(0, 70)); process.exitCode = 1; } s = s.split(a).join(b); };
rep(`import { cn } from '@/lib/utils';`, `import { cn } from '@/lib/utils';\nimport { SHIMMER } from '@/lib/image';\n\nconst PAGE = 12;`);
rep(`// Photo grid with category filter and a full-screen viewer
export default function GalleryGrid({ items, categories = [], limit }) {
  const [category, setCategory] = useState('All');
  const [open, setOpen] = useState(null);

  const shown = useMemo(() => {
    const list = category === 'All' ? items : items.filter((i) => i.category === category);
    return limit ? list.slice(0, limit) : list;
  }, [items, category, limit]);`, `// Photo grid with category filter and a full-screen viewer. Shows 12 photos at a time ("Show more")
// so phones on slow internet don't download the whole gallery at once.
export default function GalleryGrid({ items, categories = [], limit }) {
  const [category, setCategory] = useState('All');
  const [open, setOpen] = useState(null);
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => (category === 'All' ? items : items.filter((i) => i.category === category)), [items, category]);
  const shown = useMemo(() => filtered.slice(0, limit || visible), [filtered, limit, visible]);`);
rep(`onClick={() => setCategory(c)}`, `onClick={() => {\n                setCategory(c);\n                setVisible(PAGE);\n              }}`);
rep(`                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"`, `                sizes={i % 7 === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 50vw'}
                quality={60}
                placeholder={SHIMMER}
                className="object-cover transition-transform duration-500 group-hover:scale-110"`);
rep(`      {open !== null && shown[open]`, `      {!limit && filtered.length > shown.length && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE)}
            className="rounded-full border border-brand-300 bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 active:scale-[0.98]"
          >
            Show more photos ({filtered.length - shown.length} more)
          </button>
        </div>
      )}

      {open !== null && shown[open]`);
rep(`<Image src={item.src} alt={item.title} fill sizes="(min-width: 1024px) 1024px, 100vw" className="object-contain" />`, `<Image src={item.src} alt={item.title} fill sizes="(min-width: 1024px) 1024px, 100vw" placeholder={SHIMMER} className="object-contain" />`);
fs.writeFileSync(f, s);
