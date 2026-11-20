// Builds a calendar PDF from the current session and sends it as a download.
import { currentSession } from '@/server/services/content.service';
import { getContents } from '@/server/services/site-content.service';

export async function pdfResponse(name, build) {
  try {
    const [session, { general, campus }] = await Promise.all([currentSession(), getContents('general', 'campus')]);
    const file = await build({ session, general, campus });
    return new Response(file, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}-${session.year}.pdf"`,
        'Content-Length': String(file.length),
        // Public document: browsers may reuse it for 5 minutes
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error(`${name} PDF failed:`, error);
    return new Response('The PDF could not be created. Please try again later.', { status: 500 });
  }
}
