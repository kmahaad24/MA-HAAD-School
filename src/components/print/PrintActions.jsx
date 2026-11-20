import { FaPrint, FaFilePdf } from 'react-icons/fa';
import { cn } from '@/lib/utils';

// "Print" (opens the A4 print version and starts printing) and "Download PDF" — used on the
// holidays and academic-calendar pages. `base` is the page path, e.g. /campus/holidays.
export default function PrintActions({ base, className }) {
  const btn = 'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98]';
  return (
    <div className={cn('flex flex-wrap gap-2 print:hidden', className)}>
      <a href={`${base}/print?print=1`} target="_blank" rel="noopener" className={cn(btn, 'border border-brand-300 bg-white text-brand-700 hover:bg-brand-50')}>
        <FaPrint aria-hidden /> Print (A4)
      </a>
      <a href={`${base}/pdf`} download className={cn(btn, 'bg-gradient-to-r from-navy-900 to-brand-700 text-white shadow-md hover:brightness-110')}>
        <FaFilePdf aria-hidden /> Download PDF
      </a>
    </div>
  );
}
