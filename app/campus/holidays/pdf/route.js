import { pdfResponse } from '@/server/exports/pdf-response';
import { holidaysPdf } from '@/server/exports/calendar-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /campus/holidays/pdf — A4 PDF of the list of holidays (current session)
export const GET = () => pdfResponse('holidays', holidaysPdf);
