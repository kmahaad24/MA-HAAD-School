import { pdfResponse } from '@/server/exports/pdf-response';
import { academicCalendarPdf } from '@/server/exports/calendar-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /campus/academic-calendar/pdf — A4 PDF: year at a glance + key dates (current session)
export const GET = () => pdfResponse('academic-calendar', academicCalendarPdf);
