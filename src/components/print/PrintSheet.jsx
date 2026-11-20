// A4 letterhead used by the print pages: school logo, name, contact line, document title and a footer.
// Everything comes from Dashboard → School Information, so the printout always matches the website.
export function Letterhead({ general, title, subtitle, badge }) {
  const { identity, branding, contact } = general;
  return (
    <header className="mb-3 border-b-[3px] border-navy-900 pb-2">
      <div className="flex items-center gap-4">
        {branding.logo && (
          // eslint-disable-next-line @next/next/no-img-element -- printed letterhead; next/image is not needed here
          <img src={branding.logo} alt={identity.name} className="h-[14mm] w-auto" />
        )}
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[8pt] leading-snug text-slate-600">{contact.address}</p>
          <p className="text-[8pt] leading-snug text-slate-600">
            {[contact.phones.join(', '), contact.email].filter(Boolean).join(' · ')}
          </p>
          {identity.curriculum && <p className="text-[8pt] leading-snug text-slate-500">{identity.curriculum}</p>}
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[17pt] font-bold leading-tight text-navy-900">{title}</h1>
          {subtitle && <p className="text-[9.5pt] text-slate-600">{subtitle}</p>}
        </div>
        {badge && <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[8pt] font-semibold text-amber-800">{badge}</span>}
      </div>
    </header>
  );
}

export function PrintFooter({ general, note }) {
  const printed = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <footer className="mt-4 flex break-inside-avoid items-end justify-between gap-6 border-t border-slate-300 pt-2 text-[7.5pt] text-slate-500">
      <div>
        {note && <p className="mb-1 text-slate-600">{note}</p>}
        <p>
          {general.identity.name} · Printed {printed}
        </p>
      </div>
      <div className="w-[45mm] shrink-0 text-center">
        <div className="h-[10mm] border-b border-slate-400" />
        <p className="mt-1">Principal</p>
      </div>
    </footer>
  );
}

export default function PrintSheet({ children }) {
  return <article className="print-sheet">{children}</article>;
}
