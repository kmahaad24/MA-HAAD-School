// A4 PDF downloads of the academic calendar and the list of holidays (/campus/…/pdf).
// Same data and arithmetic as the web and print pages (src/lib/calendar.js). Uses Hind Siliguri
// (English + Bangla) from src/server/fonts.
import path from 'node:path';
import { existsSync } from 'node:fs';
import PDFDocument from 'pdfkit';
import { uploadPath } from '@/server/storage';
import { EVENT_TYPES } from '@/data/calendar';
import { DAY_LETTERS, MONTHS, buildDayMap, byMonth, dateKey, dayCount, formatRange, holidayStats, monthCells, typeOfDay, weekdayRange, workingDays } from '@/lib/calendar';

const FONT_DIR = path.join(process.cwd(), 'src', 'server', 'fonts');
const NAVY = '#0a1c3d';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const TEXT = '#1e293b';
const COLORS = {
  holiday: { fill: '#ffe4e6', text: '#9f1239', dot: '#f43f5e' },
  vacation: { fill: '#ede9fe', text: '#5b21b6', dot: '#8b5cf6' },
  exam: { fill: '#e0f2fe', text: '#075985', dot: '#0ea5e9' },
  event: { fill: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  meeting: { fill: '#d1fae5', text: '#065f46', dot: '#10b981' },
  weekend: { fill: '#ecfdf5', text: '#047857' },
};

// ---------- document helpers ----------

function newDoc(title, school) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 34, bottom: 46, left: 34, right: 34 }, bufferPages: true, info: { Title: `${title} — ${school}`, Author: school } });
  doc.registerFont('body', path.join(FONT_DIR, 'HindSiliguri-Regular.ttf'));
  doc.registerFont('bold', path.join(FONT_DIR, 'HindSiliguri-SemiBold.ttf'));
  doc.font('body');
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  return { doc, done };
}

const inner = (doc) => doc.page.width - doc.page.margins.left - doc.page.margins.right;
const bottomY = (doc) => doc.page.height - doc.page.margins.bottom;

// The school logo, if it is a PNG/JPG on this server (PDFKit cannot read WebP)
function logoFile(logo) {
  if (!logo || !/\.(png|jpe?g)$/i.test(logo)) return null;
  const file = logo.startsWith('/uploads/') ? uploadPath(logo) : logo.startsWith('/') ? path.join(process.cwd(), 'public', logo) : null;
  return file && existsSync(file) ? file : null;
}

function letterhead(doc, general, { title, subtitle, badge }) {
  const { identity, branding, contact } = general;
  const left = doc.page.margins.left;
  const width = inner(doc);
  const top = doc.page.margins.top;
  const logo = logoFile(branding.logo);
  if (logo) doc.image(logo, left, top, { height: 44 });
  else doc.font('bold').fontSize(15).fillColor(NAVY).text(identity.name, left, top + 8, { width: width * 0.55 });

  const info = [contact.address, [contact.phones.join(', '), contact.email].filter(Boolean).join(' · '), identity.curriculum].filter(Boolean);
  doc.font('body').fontSize(7.5).fillColor(MUTED);
  info.forEach((line, i) => doc.text(line, left + width * 0.4, top + 4 + i * 11, { width: width * 0.6, align: 'right' }));

  const lineY = top + 52;
  doc.moveTo(left, lineY).lineTo(left + width, lineY).lineWidth(2.5).strokeColor(NAVY).stroke();

  doc.font('bold').fontSize(18).fillColor(NAVY).text(title, left, lineY + 8, { width: width * 0.7 });
  if (subtitle) doc.font('body').fontSize(9).fillColor(MUTED).text(subtitle, left, doc.y, { width: width * 0.7 });
  if (badge) {
    doc.font('bold').fontSize(7.5);
    const w = doc.widthOfString(badge) + 16;
    const x = left + width - w;
    doc.roundedRect(x, lineY + 12, w, 16, 8).fillAndStroke('#fffbeb', '#fcd34d');
    doc.fillColor('#92400e').text(badge, x, lineY + 15.5, { width: w, align: 'center' });
  }
  doc.y = Math.max(doc.y, lineY + 44) + 12;
  doc.x = left;
}

// "Page x of y", school name and print date on every page
function footers(doc, general) {
  const printed = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const range = doc.bufferedPageRange();
  for (let p = range.start; p < range.start + range.count; p += 1) {
    doc.switchToPage(p);
    const left = doc.page.margins.left;
    const width = inner(doc);
    const y = doc.page.height - 30;
    doc.page.margins.bottom = 0; // the footer sits in the margin; without this PDFKit would add a page
    doc.moveTo(left, y - 6).lineTo(left + width, y - 6).lineWidth(0.5).strokeColor(LINE).stroke();
    doc.font('body').fontSize(7).fillColor(MUTED);
    doc.text(`${general.identity.name} · Printed ${printed}`, left, y, { width: width / 2, lineBreak: false });
    doc.text(`Page ${p + 1} of ${range.count}`, left + width / 2, y, { width: width / 2, align: 'right', lineBreak: false });
  }
}

// Signature line for the Principal at the end of the document
function signature(doc) {
  const width = inner(doc);
  if (doc.y + 42 > bottomY(doc)) doc.addPage();
  const x = doc.page.margins.left + width - 150;
  const y = doc.y + 26;
  doc.moveTo(x, y).lineTo(x + 150, y).lineWidth(0.7).strokeColor('#94a3b8').stroke();
  doc.font('body').fontSize(8).fillColor(MUTED).text('Principal', x, y + 4, { width: 150, align: 'center' });
}

function notes(doc, lines) {
  doc.moveDown(0.6);
  doc.font('body').fontSize(7.8).fillColor('#475569');
  lines.filter(Boolean).forEach((l) => doc.text(`•  ${l}`, doc.page.margins.left, doc.y, { width: inner(doc) }));
}

// Generic table with a repeating header; columns = [{ label, width, align? }], rows = [[cell…]]
// A cell is a string or { text, sub?, color?, bold?, dot? }.
function table(doc, columns, rows, { groupRow, pad = 4 } = {}) {
  const left = doc.page.margins.left;
  const width = columns.reduce((w, c) => w + c.width, 0);

  const header = () => {
    const y = doc.y;
    doc.rect(left, y, width, 18).fill(NAVY);
    let x = left;
    doc.font('bold').fontSize(8).fillColor('#ffffff');
    columns.forEach((c) => {
      doc.text(c.label, x + pad, y + 4.5, { width: c.width - pad * 2, align: c.align || 'left' });
      x += c.width;
    });
    doc.y = y + 18;
  };

  const cellHeight = (c, cell) => {
    const value = typeof cell === 'object' && cell ? cell : { text: String(cell ?? '') };
    const w = c.width - pad * 2 - (value.dot ? 9 : 0);
    doc.font(value.bold ? 'bold' : 'body').fontSize(8.2);
    let h = doc.heightOfString(value.text || ' ', { width: w });
    if (value.sub) {
      doc.font('body').fontSize(6.8);
      h += doc.heightOfString(value.sub, { width: w });
    }
    return h;
  };

  header();
  rows.forEach((row, index) => {
    if (row.group) {
      if (doc.y + 34 > bottomY(doc)) {
        doc.addPage();
        header();
      }
      const y = doc.y;
      doc.rect(left, y, width, 15).fill('#eef6fc');
      doc.font('bold').fontSize(7.5).fillColor('#11497a').text(row.group.toUpperCase(), left, y + 3.5, { width, align: 'center', characterSpacing: 0.8 });
      doc.y = y + 15;
      return;
    }
    const height = Math.max(...columns.map((c, i) => cellHeight(c, row.cells[i]))) + pad * 2;
    if (doc.y + height > bottomY(doc)) {
      doc.addPage();
      header();
    }
    const y = doc.y;
    if (!groupRow && index % 2) doc.rect(left, y, width, height).fill('#f8fafc');
    doc.moveTo(left, y + height).lineTo(left + width, y + height).lineWidth(0.5).strokeColor(LINE).stroke();
    let x = left;
    columns.forEach((c, i) => {
      const raw = row.cells[i];
      const value = typeof raw === 'object' && raw ? raw : { text: String(raw ?? '') };
      let tx = x + pad;
      let w = c.width - pad * 2;
      if (value.dot) {
        doc.circle(tx + 3, y + pad + 5.5, 2.6).fill(value.dot);
        tx += 9;
        w -= 9;
      }
      doc.font(value.bold ? 'bold' : 'body').fontSize(8.2).fillColor(value.color || TEXT).text(value.text, tx, y + pad, { width: w, align: c.align || 'left' });
      if (value.sub) doc.font('body').fontSize(6.8).fillColor(value.subColor || MUTED).text(value.sub, tx, doc.y, { width: w });
      x += c.width;
    });
    doc.y = y + height;
  });
  doc.x = left;
}

// ---------- List of Holidays ----------

export async function holidaysPdf({ session, general, campus }) {
  const title = `List of Holidays ${session.year}`;
  const { doc, done } = newDoc(title, general.identity.name);
  letterhead(doc, general, { title, subtitle: `${session.label} · Weekly holidays: ${session.weekendLabel}`, badge: session.confirmed ? null : 'Tentative — dates confirmed by notice' });

  const list = [...session.holidays].sort((a, b) => a.date.localeCompare(b.date) || dayCount(b) - dayCount(a));
  const stats = holidayStats(list, session.weekend);
  const width = inner(doc);
  const columns = [
    { label: '#', width: 24 },
    { label: 'Occasion', width: width - 24 - 120 - 80 - 34 },
    { label: 'Date', width: 120 },
    { label: 'Day', width: 80 },
    { label: 'Days', width: 34, align: 'right' },
  ];
  table(
    doc,
    columns,
    list.map((h, i) => {
      const type = EVENT_TYPES[h.type] || EVENT_TYPES.holiday;
      const inside = stats.overlaps.get(h);
      const sub = [h.kind || type.label, h.tentative && 'Tentative', inside && `Falls within: ${inside.join(', ')}`].filter(Boolean).join(' · ');
      return {
        cells: [
          { text: String(i + 1), color: MUTED },
          { text: h.title, bold: true, color: NAVY, sub, dot: (COLORS[h.type] || COLORS.holiday).dot },
          formatRange(h, { year: true }),
          { text: weekdayRange(h), color: MUTED },
          { text: String(dayCount(h)), bold: true, color: NAVY },
        ],
      };
    }),
    { pad: 3 }
  );

  // Totals
  doc.moveDown(0.6);
  const boxes = [
    [list.length, 'HOLIDAYS & VACATIONS'],
    [stats.calendarDays, 'DAYS OFF (INCL. WEEKENDS)'],
    [stats.schoolDays, 'SCHOOL DAYS OFF'],
  ];
  if (doc.y + 50 > bottomY(doc)) doc.addPage();
  const boxW = (width - 16) / 3;
  const y = doc.y;
  boxes.forEach(([value, label], i) => {
    const x = doc.page.margins.left + i * (boxW + 8);
    doc.roundedRect(x, y, boxW, 40, 5).fillAndStroke('#f8fafc', LINE);
    doc.font('bold').fontSize(16).fillColor(NAVY).text(String(value), x, y + 5, { width: boxW, align: 'center' });
    doc.font('body').fontSize(6.5).fillColor(MUTED).text(label, x, y + 26, { width: boxW, align: 'center', characterSpacing: 0.5 });
  });
  doc.y = y + 48;

  notes(doc, [
    'Days that fall within another holiday or vacation are counted once in the totals.',
    campus.holidays.intro,
    // The page intro usually explains tentative dates already
    !campus.holidays.intro && list.some((h) => h.tentative) && 'Dates marked “Tentative” depend on the moon or on a Government notice and may change.',
  ]);
  signature(doc);
  footers(doc, general);
  doc.end();
  return done;
}

// ---------- Academic Calendar ----------

function drawMonth(doc, { x, y, w, year, month, dayMap, weekend }) {
  const pad = 6;
  const cellW = (w - pad * 2) / 7;
  const cellH = 13.5;
  const cells = monthCells(year, month);
  const rows = Math.ceil(cells.length / 7);
  const h = pad + 15 + 11 + rows * cellH + pad;
  doc.roundedRect(x, y, w, h, 5).lineWidth(0.6).strokeColor(LINE).stroke();
  doc.font('bold').fontSize(9.5).fillColor(NAVY).text(MONTHS[month], x + pad, y + pad - 1, { continued: true }).fillColor('#bd7518').text(` ’${String(year).slice(2)}`);
  const top = y + pad + 15;
  doc.font('bold').fontSize(6.5);
  DAY_LETTERS.forEach((d, i) => doc.fillColor(weekend.includes(i) ? COLORS.weekend.text : '#94a3b8').text(d, x + pad + i * cellW, top, { width: cellW, align: 'center' }));
  cells.forEach((day, i) => {
    if (!day) return;
    const cx = x + pad + (i % 7) * cellW;
    const cy = top + 11 + Math.floor(i / 7) * cellH;
    const type = typeOfDay(dayMap.get(dateKey(year, month, day)));
    const isWeekend = weekend.includes(i % 7);
    const color = type ? COLORS[type] : isWeekend ? COLORS.weekend : null;
    if (color) doc.roundedRect(cx + 0.8, cy, cellW - 1.6, cellH - 1.6, 2).fill(color.fill);
    doc.font(type ? 'bold' : 'body').fontSize(7).fillColor(color ? color.text : '#334155').text(String(day), cx, cy + 2.3, { width: cellW, align: 'center' });
  });
  return h;
}

export async function academicCalendarPdf({ session, general, campus }) {
  const title = `Academic Calendar ${session.year}`;
  const { doc, done } = newDoc(title, general.identity.name);
  letterhead(doc, general, { title, subtitle: campus.calendar.subtitle || session.label, badge: session.confirmed ? null : 'Tentative plan' });

  const entries = [...session.events, ...session.holidays];
  const stats = holidayStats(session.holidays, session.weekend);
  const left = doc.page.margins.left;
  const width = inner(doc);

  // Legend + summary
  let lx = left;
  const ly = doc.y;
  doc.font('body').fontSize(7);
  [...Object.entries(EVENT_TYPES).map(([type, t]) => [COLORS[type].fill, t.label]), [COLORS.weekend.fill, `Weekend (${session.weekendLabel})`]].forEach(([fill, label]) => {
    doc.roundedRect(lx, ly + 1, 8, 8, 1.5).fill(fill);
    doc.fillColor('#334155').text(label, lx + 11, ly, { lineBreak: false });
    lx += 11 + doc.widthOfString(label) + 10;
  });
  doc.font('body').fontSize(7.5).fillColor(MUTED).text(`${workingDays(session.year, entries, session.weekend)} working days · ${stats.calendarDays} days of holidays & vacations`, left, ly + 14, { width });
  doc.y = ly + 30;

  // 12 months, 3 per row
  const dayMap = buildDayMap(entries);
  const gap = 9;
  const colW = (width - gap * 2) / 3;
  let y = doc.y;
  for (let row = 0; row < 4; row += 1) {
    let rowH = 0;
    for (let col = 0; col < 3; col += 1) {
      const month = row * 3 + col;
      rowH = Math.max(rowH, drawMonth(doc, { x: left + col * (colW + gap), y, w: colW, year: session.year, month, dayMap, weekend: session.weekend }));
    }
    y += rowH + gap;
  }
  doc.y = y;
  if (!session.confirmed && campus.calendar.tentativeNote) {
    doc.font('body').fontSize(7.8);
    const h = doc.heightOfString(campus.calendar.tentativeNote, { width: width - 16 }) + 10;
    doc.roundedRect(left, doc.y, width, h, 4).fillAndStroke('#fffbeb', '#fde68a');
    doc.fillColor('#78350f').text(campus.calendar.tentativeNote, left + 8, doc.y + 5, { width: width - 16 });
  }

  // Key dates
  doc.addPage();
  doc.font('bold').fontSize(14).fillColor(NAVY).text(`Key dates — ${session.label}`, left, doc.page.margins.top);
  doc.moveDown(0.4);
  const rows = byMonth(entries).flatMap((m) => [
    { group: `${m.name} ${session.year}` },
    ...m.items.map((e) => {
      const type = EVENT_TYPES[e.type] || EVENT_TYPES.event;
      return {
        cells: [
          { text: formatRange(e), bold: true, color: NAVY },
          { text: weekdayRange(e), color: MUTED },
          { text: e.title, sub: [type.label, e.tentative && 'Tentative'].filter(Boolean).join(' · '), dot: (COLORS[e.type] || COLORS.event).dot },
        ],
      };
    }),
  ]);
  table(doc, [{ label: 'Date', width: 100 }, { label: 'Day', width: 72 }, { label: 'Details / activities', width: width - 172 }], rows, { groupRow: true });
  notes(doc, [`Weekly holidays: ${session.weekendLabel}.`, campus.calendar.resumeNote]);
  signature(doc);
  footers(doc, general);
  doc.end();
  return done;
}

