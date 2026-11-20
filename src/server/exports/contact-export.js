// Contact Requests → Excel (.xlsx) and PDF downloads (Dashboard → Contact Requests → Excel / PDF).
// The PDF embeds Hind Siliguri (src/server/fonts, SIL Open Font License), which covers English and Bangla,
// so messages written in Bangla print correctly.
import path from 'node:path';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const FONT_DIR = path.join(process.cwd(), 'src', 'server', 'fonts');
const STATUS_LABEL = { unread: 'Unread', read: 'Read', replied: 'Replied', archived: 'Archived' };

const formatter = (timeZone) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ---------- Excel ----------

export async function contactsToXlsx(rows, { school, title, filterLabel, timeZone }) {
  const fmt = formatter(timeZone);
  const wb = new ExcelJS.Workbook();
  wb.creator = school;
  wb.created = new Date();
  const ws = wb.addWorksheet('Contact Requests', { views: [{ state: 'frozen', ySplit: 4 }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });

  ws.columns = [
    { key: 'n', width: 6 },
    { key: 'date', width: 20 },
    { key: 'name', width: 24 },
    { key: 'email', width: 30 },
    { key: 'phone', width: 16 },
    { key: 'subject', width: 26 },
    { key: 'message', width: 60 },
    { key: 'status', width: 11 },
    { key: 'note', width: 30 },
  ];

  // Title block
  ws.mergeCells('A1:I1');
  ws.getCell('A1').value = `${school} — ${title}`;
  ws.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF0A1C3D' } };
  ws.mergeCells('A2:I2');
  ws.getCell('A2').value = `${filterLabel} · ${rows.length} request${rows.length === 1 ? '' : 's'} · Exported ${fmt.format(new Date())}`;
  ws.getCell('A2').font = { size: 10, color: { argb: 'FF64748B' } };

  const header = ws.getRow(4);
  header.values = ['#', 'Date', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Office note'];
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { vertical: 'middle' };
  header.height = 22;
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1C3D' } };
  });

  rows.forEach((m, i) => {
    const row = ws.addRow({
      n: i + 1,
      date: fmt.format(new Date(m.createdAt)),
      name: m.fullName,
      email: m.email,
      phone: m.phone || '',
      subject: m.subject || '',
      message: m.message,
      status: STATUS_LABEL[m.status] || m.status,
      note: m.note || '',
    });
    row.alignment = { vertical: 'top', wrapText: true };
    row.getCell('email').value = { text: m.email, hyperlink: `mailto:${m.email}` };
    row.getCell('email').font = { color: { argb: 'FF126CB5' }, underline: true };
    if (i % 2) row.eachCell((cell) => (cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }));
  });

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 9 } };
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------- PDF ----------

const COLS = [
  { key: 'n', label: '#', width: 26 },
  { key: 'date', label: 'Date', width: 92 },
  { key: 'from', label: 'From', width: 150 },
  { key: 'subject', label: 'Subject', width: 110 },
  { key: 'message', label: 'Message', width: 340 },
  { key: 'status', label: 'Status', width: 56 },
];
const NAVY = '#0a1c3d';
const MUTED = '#64748b';
const PAD = 5;

export function contactsToPdf(rows, { school, title, filterLabel, timeZone }) {
  const fmt = formatter(timeZone);
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 36, bottom: 36, left: 36, right: 36 }, bufferPages: true, info: { Title: `${school} — ${title}`, Author: school } });
  doc.registerFont('body', path.join(FONT_DIR, 'HindSiliguri-Regular.ttf'));
  doc.registerFont('bold', path.join(FONT_DIR, 'HindSiliguri-SemiBold.ttf'));

  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const left = doc.page.margins.left;
  const bottom = () => doc.page.height - doc.page.margins.bottom;

  // Title
  doc.font('bold').fontSize(16).fillColor(NAVY).text(school, left, 36);
  doc.font('body').fontSize(11).fillColor(NAVY).text(title);
  doc.fontSize(9).fillColor(MUTED).text(`${filterLabel} · ${rows.length} request${rows.length === 1 ? '' : 's'} · Exported ${fmt.format(new Date())}`);
  doc.moveDown(0.6);

  const drawHeader = () => {
    const y = doc.y;
    doc.rect(left, y, COLS.reduce((w, c) => w + c.width, 0), 20).fill(NAVY);
    let x = left;
    doc.font('bold').fontSize(9).fillColor('#ffffff');
    COLS.forEach((c) => {
      doc.text(c.label, x + PAD, y + 5, { width: c.width - PAD * 2 });
      x += c.width;
    });
    doc.y = y + 20;
  };

  drawHeader();

  if (!rows.length) {
    doc.moveDown().font('body').fontSize(10).fillColor(MUTED).text('No contact requests match this view.', left);
  }

  rows.forEach((m, i) => {
    const cells = {
      n: String(i + 1),
      date: fmt.format(new Date(m.createdAt)),
      from: [m.fullName, m.email, m.phone].filter(Boolean).join('\n'),
      subject: m.subject || '—',
      message: m.message.length > 1200 ? `${m.message.slice(0, 1200)}…` : m.message,
      status: STATUS_LABEL[m.status] || m.status,
    };
    doc.font('body').fontSize(8.5);
    const height = Math.max(...COLS.map((c) => doc.heightOfString(cells[c.key], { width: c.width - PAD * 2 }))) + PAD * 2;

    if (doc.y + height > bottom()) {
      doc.addPage();
      doc.y = doc.page.margins.top;
      drawHeader();
    }
    const y = doc.y;
    const width = COLS.reduce((w, c) => w + c.width, 0);
    if (i % 2) doc.rect(left, y, width, height).fill('#f8fafc');
    doc.moveTo(left, y + height).lineTo(left + width, y + height).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

    let x = left;
    COLS.forEach((c) => {
      const bold = c.key === 'from';
      if (bold) {
        // Name in bold, email / phone below in grey
        const [name, ...rest] = cells.from.split('\n');
        doc.font('bold').fontSize(8.5).fillColor(NAVY).text(name, x + PAD, y + PAD, { width: c.width - PAD * 2 });
        if (rest.length) doc.font('body').fontSize(8).fillColor(MUTED).text(rest.join('\n'), { width: c.width - PAD * 2 });
      } else {
        doc.font('body').fontSize(8.5).fillColor(c.key === 'date' || c.key === 'n' ? MUTED : '#1e293b').text(cells[c.key], x + PAD, y + PAD, { width: c.width - PAD * 2 });
      }
      x += c.width;
    });
    doc.y = y + height;
  });

  // Page numbers
  const range = doc.bufferedPageRange();
  for (let p = range.start; p < range.start + range.count; p += 1) {
    doc.switchToPage(p);
    // The footer sits inside the bottom margin; without this PDFKit would start a new page for it
    doc.page.margins.bottom = 0;
    doc.font('body').fontSize(8).fillColor(MUTED).text(`Page ${p + 1} of ${range.count}`, left, doc.page.height - 26, { width: doc.page.width - left * 2, align: 'right', lineBreak: false });
  }

  doc.end();
  return done;
}
