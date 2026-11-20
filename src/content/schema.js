// Every editable part of the public website, described once. Used by:
//   • the dashboard editor (src/components/dashboard/SchemaForm.jsx) to draw the form
//   • the server (src/server/services/site-content.service.js) to clean and validate what is saved
// Starting values live in src/content/defaults.js.
//
// Field types:
//   text · textarea · paragraphs (string[] — blank line between paragraphs) · lines (string[] — one per line)
//   image (upload) · icon (pick from src/content/icons.js) · link (/page, https://, tel:, mailto:) · email
//   select (options) · toggle (true/false) · group (object of fields) · list (array of objects with `fields`)
// Field options: max (characters), rows, help, placeholder, maxItems, itemLabel (field shown on a collapsed
// list row), fixed (list rows can be edited but not added/removed/reordered), readOnly, slug (a-z 0-9 -), required.

const text = (name, label, o = {}) => ({ name, label, type: 'text', ...o });
const area = (name, label, o = {}) => ({ name, label, type: 'textarea', rows: 3, ...o });
const paras = (name, label, o = {}) => ({ name, label, type: 'paragraphs', rows: 8, ...o });
const lines = (name, label, o = {}) => ({ name, label, type: 'lines', rows: 5, ...o });
const image = (name, label, o = {}) => ({ name, label, type: 'image', ...o });
const icon = (name = 'icon', label = 'Icon') => ({ name, label, type: 'icon' });
const link = (name, label, o = {}) => ({ name, label, type: 'link', ...o });
const group = (name, label, fields, o = {}) => ({ name, label, type: 'group', fields, ...o });
const list = (name, label, fields, o = {}) => ({ name, label, type: 'list', fields, ...o });

// Reused shapes
const heading = (name, label) => group(name, label, [text('kicker', 'Small label above the title', { max: 80 }), text('title', 'Title', { max: 160 }), area('subtitle', 'Subtitle', { rows: 2, max: 400 })]);
const banner = (label = 'Page banner') =>
  group('banner', label, [text('title', 'Title', { max: 160 }), area('subtitle', 'Subtitle', { rows: 2, max: 400 }), image('image', 'Background photo', { folder: 'content' })]);
const navLink = [text('label', 'Text', { max: 80, required: true }), link('href', 'Link', { required: true })];
const step = [text('title', 'Step', { max: 120, required: true }), area('text', 'Description', { rows: 2, max: 500 })];

export const POSITIONS = [
  { value: 'object-center', label: 'Centre' },
  { value: 'object-left', label: 'Left' },
  { value: 'object-right', label: 'Right' },
  { value: 'object-top', label: 'Top' },
  { value: 'object-bottom', label: 'Bottom' },
  { value: 'object-[40%_50%]', label: 'Slightly left' },
  { value: 'object-[60%_50%]', label: 'Slightly right' },
  { value: 'object-[70%_50%]', label: 'Right of centre' },
];

export const CONTENT_SECTIONS = [
  // ---------- Whole site ----------
  {
    key: 'general',
    group: 'Whole site',
    title: 'School information',
    description: 'Name, logo, contact details, social links and search-engine text used on every page.',
    view: '/',
    fields: [
      group('identity', 'Name & description', [
        text('name', 'School name', { max: 120, required: true }),
        text('shortName', 'Short name', { max: 40, help: 'Used where space is tight (app name, mobile).' }),
        text('tagline', 'Tagline', { max: 160 }),
        area('description', 'Description for search engines', { max: 300, help: 'Shown under the site name on Google. About 150–160 characters is ideal.' }),
        area('about', 'One-line summary (footer)', { max: 300 }),
        text('curriculum', 'Curriculum line', { max: 160 }),
        text('levels', 'Classes offered (short)', { max: 80, placeholder: 'Play Group to Class X' }),
      ]),
      group('branding', 'Logo & sharing image', [
        image('logo', 'Logo (wide)', { folder: 'content', help: 'PNG or WebP with a transparent background, about 1200 × 370.' }),
        image('ogImage', 'Link preview image', { folder: 'content', help: 'Shown when the site is shared on Facebook / WhatsApp. 1200 × 630 is ideal.' }),
      ]),
      group('contact', 'Contact details', [
        { name: 'email', label: 'Email', type: 'email' },
        lines('phones', 'Phone numbers', { rows: 3, max: 30, maxItems: 5, help: 'One per line. The first one is used for “Call now” buttons.' }),
        text('callingTime', 'Office calling time', { max: 80 }),
        area('address', 'Full address', { rows: 2, max: 300 }),
        text('addressShort', 'Short address (header)', { max: 120 }),
        link('mapUrl', 'Google Maps link (for “Directions”)'),
        link('mapEmbed', 'Google Maps embed link', { help: 'Google Maps → Share → Embed a map → copy only the src="…" address.' }),
      ]),
      group('social', 'Social media', [link('facebook', 'Facebook page'), link('youtube', 'YouTube channel'), link('instagram', 'Instagram'), link('linkedin', 'LinkedIn'), link('x', 'X (Twitter)')], { help: 'Empty links are hidden.' }),
      group('apps', 'Mobile app links', [link('appStore', 'App Store link'), link('googlePlay', 'Google Play link')], { help: 'The footer badges become clickable once a link is added.' }),
      group('seo', 'Search engines', [lines('keywords', 'Keywords', { rows: 4, max: 80, maxItems: 30, help: 'One per line.' }), text('googleVerification', 'Google Search Console verification code', { max: 120 }), text('gtmId', 'Google Tag Manager ID', { max: 20, placeholder: 'GTM-XXXXXXX', pattern: '^GTM-[A-Z0-9]{4,12}$', help: 'Loads Google Tag Manager on the public website (not the dashboard). Leave empty to turn it off.' })]),
      group('header', 'Header', [
        text('ctaLabel', 'Header button text', { max: 40 }),
        link('ctaHref', 'Header button link'),
        { name: 'showStaffLogin', label: 'Show “Staff Login” in the top bar', type: 'toggle' },
      ]),
    ],
  },
  {
    key: 'navigation',
    group: 'Whole site',
    title: 'Menus',
    description: 'Main menu, footer link columns and legal links.',
    view: '/',
    fields: [
      list('main', 'Main menu', [...navLink, list('children', 'Dropdown links', navLink, { maxItems: 15, itemLabel: 'label' })], { maxItems: 12, itemLabel: 'label', help: 'Items with dropdown links open a menu. The dropdown also becomes the side menu on that section’s pages. Links to facilities and class levels are added automatically — add a facility or class level and it appears in the Facilities / Admission dropdown by itself.' }),
      list('footerQuick', 'Footer — Quick links', navLink, { maxItems: 12, itemLabel: 'label' }),
      list('footerAdmission', 'Footer — Admission', navLink, { maxItems: 12, itemLabel: 'label' }),
      list('footerUseful', 'Footer — Useful links', navLink, { maxItems: 12, itemLabel: 'label' }),
      group('footerTitles', 'Footer column titles', [text('quick', 'Column 1', { max: 40 }), text('admission', 'Column 2', { max: 40 }), text('useful', 'Column 3', { max: 40 })]),
      list('legal', 'Legal links (bottom of footer)', navLink, { maxItems: 8, itemLabel: 'label' }),
    ],
  },
  {
    key: 'shared',
    group: 'Whole site',
    title: 'Shared blocks',
    description: 'Admission banner, help card, notice-bar messages and default banner photo used on many pages.',
    view: '/about',
    fields: [
      image('defaultBanner', 'Default page-banner photo', { folder: 'content' }),
      group('cta', 'Admission banner (end of pages)', [
        text('badge', 'Badge', { max: 60 }),
        text('title', 'Title', { max: 160 }),
        area('text', 'Text', { rows: 2, max: 400 }),
        image('image', 'Background photo', { folder: 'content' }),
        text('primaryLabel', 'Button 1 text', { max: 40 }),
        link('primaryHref', 'Button 1 link'),
        text('secondaryLabel', 'Button 2 text', { max: 40 }),
        link('secondaryHref', 'Button 2 link'),
      ]),
      group('help', 'Help card (page sidebars)', [text('title', 'Title', { max: 80 }), area('text', 'Text', { rows: 2, max: 200 })]),
      heading('map', 'Map section heading (home page)'),
      lines('ticker', 'Notice bar messages', { rows: 4, max: 200, maxItems: 8, help: 'Shown in the scrolling bar while there are no published notices. One per line.' }),
      group('comingSoon', 'Empty-list message', [text('title', 'Title', { max: 120 }), area('text', 'Text', { rows: 2, max: 300 })], { help: 'Shown on staff pages that have no people yet.' }),
    ],
  },

  // ---------- Pages ----------
  {
    key: 'home',
    group: 'Pages',
    title: 'Home page',
    description: 'Slider, quick links, welcome block, section titles and values.',
    view: '/',
    fields: [
      list(
        'slides',
        'Slider',
        [
          image('image', 'Photo', { folder: 'content', required: true, help: 'Wide landscape photo, at least 1600 px wide.' }),
          { name: 'position', label: 'Keep this part of the photo in view', type: 'select', options: POSITIONS },
          text('kicker', 'Small label', { max: 80 }),
          text('title', 'Title', { max: 160, required: true }),
          area('text', 'Text', { rows: 2, max: 300 }),
          text('alt', 'Photo description (for screen readers)', { max: 160 }),
        ],
        { maxItems: 8, itemLabel: 'title' }
      ),
      group('slideButtons', 'Slider buttons', [text('primaryLabel', 'Button 1 text', { max: 40 }), link('primaryHref', 'Button 1 link'), text('secondaryLabel', 'Button 2 text', { max: 40 }), link('secondaryHref', 'Button 2 link')]),
      list('quickLinks', 'Quick-link cards (under the slider)', [text('title', 'Title', { max: 60, required: true }), text('text', 'Text', { max: 120 }), link('href', 'Link', { required: true }), text('cta', 'Link text', { max: 40 }), icon()], { maxItems: 8, itemLabel: 'title' }),
      group('welcome', 'Welcome block', [
        text('kicker', 'Small label', { max: 60 }),
        image('image', 'Main photo', { folder: 'content' }),
        image('image2', 'Small photo', { folder: 'content' }),
        text('badgeTitle', 'Badge — big text', { max: 20 }),
        text('badgeText', 'Badge — small text', { max: 40 }),
        text('buttonLabel', 'Button text', { max: 40 }),
      ], { help: 'The title and text come from Pages → About page → Welcome text (first two paragraphs).' }),
      heading('notices', 'Notices section'),
      heading('programmes', 'Programmes section'),
      heading('values', 'Values section'),
      image('valuesImage', 'Values section background photo', { folder: 'content' }),
      list('valueItems', 'Values', [icon(), text('title', 'Value', { max: 40, required: true })], { maxItems: 12, itemLabel: 'title' }),
      heading('approach', 'Approach section'),
      heading('facilities', 'Facilities section'),
      heading('gallery', 'Gallery section'),
    ],
  },
  {
    key: 'about',
    group: 'Pages',
    title: 'About page',
    description: 'Welcome text, highlights, mission / vision / values and educational approach.',
    view: '/about',
    fields: [
      banner(),
      group('welcome', 'Welcome text', [
        text('kicker', 'Small label', { max: 60 }),
        text('title', 'Title', { max: 160 }),
        text('tagline', 'Tagline', { max: 160 }),
        image('image', 'Photo', { folder: 'content' }),
        paras('paragraphs', 'Text', { rows: 14, max: 20000 }),
        area('closing', 'Closing line (highlighted)', { rows: 2, max: 300 }),
      ]),
      list('highlights', 'Highlights', [icon(), text('label', 'Text', { max: 80, required: true })], { maxItems: 8, itemLabel: 'label' }),
      heading('purposeHeading', 'Mission section title'),
      list('purpose', 'Mission, vision & values', [icon(), text('title', 'Title', { max: 60, required: true }), area('text', 'Text', { rows: 3, max: 600 })], { maxItems: 6, itemLabel: 'title' }),
      heading('approachHeading', 'Approach section title'),
      list('approach', 'Educational approach', [icon(), text('title', 'Title', { max: 80, required: true }), area('text', 'Text', { rows: 2, max: 400 })], { maxItems: 12, itemLabel: 'title', help: 'Also shown on the home page.' }),
    ],
  },
  {
    key: 'facilities',
    group: 'Pages',
    title: 'Facilities',
    description: 'Facilities list and the page of each facility.',
    view: '/facilities',
    fields: [
      banner(),
      heading('heading', 'Section title'),
      list(
        'items',
        'Facilities',
        [
          text('slug', 'Page address', { slug: true, required: true, max: 60, help: 'Lower-case letters, numbers and dashes, e.g. computer-lab → /facilities/computer-lab' }),
          text('title', 'Name', { max: 80, required: true }),
          icon(),
          image('image', 'Photo', { folder: 'content' }),
          area('summary', 'Short description', { rows: 2, max: 300 }),
          paras('paragraphs', 'Full description', { rows: 8, max: 10000 }),
          lines('features', 'Highlights', { rows: 6, max: 200, maxItems: 20 }),
        ],
        { maxItems: 24, itemLabel: 'title', help: 'Each facility gets its own page (/facilities/<page address>) and appears in the Facilities menu automatically, in this order.' }
      ),
    ],
  },
  {
    key: 'admission',
    group: 'Admission',
    title: 'Admission & classes',
    description: 'Admission page and the page of each class level (PG–KG, Class I–V …).',
    view: '/admission',
    fields: [
      banner(),
      heading('heading', 'Section title'),
      list(
        'programs',
        'Class levels',
        [
          text('slug', 'Page address', { slug: true, required: true, max: 60, help: 'e.g. pg-kg → /admission/pg-kg' }),
          text('title', 'Title', { max: 80, required: true }),
          text('level', 'Level label', { max: 60 }),
          image('image', 'Photo', { folder: 'content' }),
          lines('classes', 'Classes', { rows: 4, max: 60, maxItems: 15 }),
          area('summary', 'Short description', { rows: 2, max: 400 }),
          paras('paragraphs', 'Full description', { rows: 6, max: 10000 }),
          list('ages', 'Age guideline', [text('className', 'Class', { max: 60, required: true }), text('age', 'Minimum age', { max: 80 })], { maxItems: 15, itemLabel: 'className' }),
          lines('subjects', 'Main subjects', { rows: 5, max: 80, maxItems: 25 }),
          area('assessment', 'Admission test', { rows: 3, max: 1000 }),
        ],
        { maxItems: 10, itemLabel: 'title', help: 'Each class level gets its own page (/admission/<page address>) and appears in the Admission menu and footer automatically.' }
      ),
      text('ageNote', 'Note under age tables', { max: 200 }),
    ],
  },
  {
    key: 'admissionInfo',
    group: 'Admission',
    title: 'Admission information',
    description: 'How to apply — steps, documents and notes.',
    view: '/admission/information',
    fields: [area('intro', 'Introduction', { rows: 4, max: 1000 }), list('steps', 'Admission steps', step, { maxItems: 15, itemLabel: 'title' }), lines('documents', 'Documents required', { rows: 8, max: 300, maxItems: 30 }), lines('notes', 'Please note', { rows: 5, max: 300, maxItems: 20 })],
  },
  {
    key: 'rules',
    group: 'Admission',
    title: 'Rules and regulations',
    description: 'Attendance, uniform, conduct, fees and other rules.',
    view: '/admission/rules-and-regulations',
    fields: [area('intro', 'Introduction', { rows: 3, max: 1000 }), list('sections', 'Rule groups', [text('title', 'Title', { max: 80, required: true }), lines('items', 'Rules', { rows: 6, max: 400, maxItems: 30 })], { maxItems: 20, itemLabel: 'title' })],
  },
  {
    key: 'transfer',
    group: 'Admission',
    title: 'Transfer procedure',
    description: 'Transfer Certificate (TC) steps for leaving and joining.',
    view: '/admission/transfer-procedure',
    fields: [area('intro', 'Introduction', { rows: 3, max: 1000 }), list('leaving', 'Leaving the school — steps', step, { maxItems: 15, itemLabel: 'title' }), lines('joining', 'Joining from another school — documents', { rows: 5, max: 300, maxItems: 20 }), lines('notes', 'Notes', { rows: 3, max: 300, maxItems: 10 })],
  },
  {
    key: 'prospectus',
    group: 'Admission',
    title: 'Prospectus',
    description: 'Online prospectus and the downloadable PDF.',
    view: '/admission/prospectus',
    fields: [area('intro', 'Introduction', { rows: 3, max: 1000 }), image('image', 'Banner photo', { folder: 'content' }), list('sections', 'Sections', [text('title', 'Title', { max: 80, required: true }), area('text', 'Text', { rows: 2, max: 800 })], { maxItems: 20, itemLabel: 'title' }), link('pdf', 'PDF link', { help: 'Upload the PDF somewhere (e.g. Google Drive) and paste the link to show a “Download PDF” button.' })],
  },
  {
    key: 'administration',
    group: 'Pages',
    title: 'Administration',
    description: 'Titles and introductions of the trustee, management and teacher lists.',
    view: '/administration',
    fields: [
      banner(),
      heading('heading', 'Section title'),
      list('groups', 'Lists', [text('slug', 'Page address', { readOnly: true }), text('kicker', 'Small label', { max: 60 }), text('title', 'Title', { max: 80, required: true }), area('intro', 'Introduction', { rows: 3, max: 600 })], { fixed: true, itemLabel: 'title', help: 'The people are added in Dashboard → Teachers & Staff.' }),
    ],
  },
  {
    key: 'campus',
    group: 'Pages',
    title: 'Campus pages',
    description: 'Campus overview, book list, holidays and academic calendar text.',
    view: '/campus',
    fields: [
      banner(),
      heading('heading', 'Section title'),
      list('cards', 'Cards', [text('title', 'Title', { max: 60, required: true }), area('text', 'Text', { rows: 2, max: 200 }), link('href', 'Link', { required: true }), icon()], { maxItems: 9, itemLabel: 'title' }),
      group('books', 'Book list page', [image('image', 'Banner photo', { folder: 'content' }), area('intro', 'Introduction', { rows: 3, max: 1000, help: 'You can use **bold** text.' })]),
      group('holidays', 'Holidays page', [image('image', 'Banner photo', { folder: 'content' }), area('intro', 'Introduction', { rows: 3, max: 1000 })]),
      group('calendar', 'Academic calendar page', [image('image', 'Banner photo', { folder: 'content' }), area('subtitle', 'Subtitle', { rows: 2, max: 300 }), area('tentativeNote', 'Note while the calendar is tentative', { rows: 2, max: 400 }), text('resumeNote', 'Working-days note', { max: 200 })]),
    ],
  },
  {
    key: 'gallery',
    group: 'Pages',
    title: 'Photo gallery page',
    description: 'Banner and title of the gallery page. Photos are managed in Dashboard → Photo Gallery.',
    view: '/gallery',
    fields: [banner(), heading('heading', 'Section title'), text('emptyText', 'Message when there are no photos', { max: 160 })],
  },
  {
    key: 'notices',
    group: 'Pages',
    title: 'Notice board page',
    description: 'Banner of the notice board. Notices are managed in Dashboard → Notices.',
    view: '/notices',
    fields: [banner()],
  },
  {
    key: 'messages',
    group: 'Pages',
    title: 'CEO & Principal pages',
    description: 'Banner photos of the message pages. Names, photos and messages are in Dashboard → CEO & Principal.',
    view: '/about/ceo-message',
    fields: [image('ceoBanner', 'CEO page banner photo', { folder: 'content' }), image('principalBanner', 'Principal page banner photo', { folder: 'content' }), text('signOff', 'Sign-off line', { max: 60 })],
  },
  {
    key: 'contact',
    group: 'Pages',
    title: 'Contact page',
    description: 'Contact page text, form topics and the confirmation email.',
    view: '/contact',
    fields: [
      banner(),
      heading('heading', 'Section title'),
      group('form', 'Message form', [
        text('kicker', 'Small label', { max: 60 }),
        text('title', 'Title', { max: 120 }),
        area('text', 'Text', { rows: 2, max: 300 }),
        lines('topics', 'Topic buttons', { rows: 5, max: 60, maxItems: 10 }),
        text('privacyNote', 'Privacy note under the form', { max: 200 }),
        area('successText', 'Thank-you message after sending', { rows: 2, max: 300 }),
      ]),
      group('location', 'Location block', [text('kicker', 'Small label', { max: 60 }), text('title', 'Title', { max: 120 })]),
      group('email', 'Confirmation email to the sender', [text('subject', 'Subject', { max: 160 }), area('body', 'Message', { rows: 5, max: 2000, help: 'Use {{name}} for the sender’s name. A copy of their message is added below.' })]),
    ],
  },
  {
    key: 'portals',
    group: 'Pages',
    title: 'Login portals',
    description: 'School management and requisition login pages. Add the address of an online system to send users straight there.',
    view: '/portal',
    fields: ['portal', 'requisition'].map((name) =>
      group(name, name === 'portal' ? 'School Management Login' : 'Requisition Login', [
        text('title', 'Title', { max: 80 }),
        area('description', 'Description', { rows: 2, max: 300 }),
        list('items', 'Portals', [text('slug', 'Page address', { slug: true, required: true, max: 60 }), text('title', 'Title', { max: 80, required: true }), text('audience', 'For', { max: 120 }), text('idLabel', 'ID field label', { max: 40 }), link('url', 'Online system address')], { maxItems: 20, itemLabel: 'title' }),
      ])
    ),
  },
  {
    key: 'legal',
    group: 'Pages',
    title: 'Legal pages',
    description: 'Terms of use, privacy, cookie and refund policies.',
    view: '/legal/termsofuse',
    fields: [
      list(
        'docs',
        'Documents',
        [
          text('key', 'Page address', { readOnly: true }),
          text('title', 'Title', { max: 120, required: true }),
          area('summary', 'Summary', { rows: 2, max: 300 }),
          text('lastUpdated', 'Last updated', { max: 40 }),
          list('sections', 'Sections', [text('heading', 'Heading', { max: 160, required: true }), area('body', 'Text', { rows: 6, max: 6000, help: 'Blank line between paragraphs. Start a line with “- ” for a bullet. **bold**, [text](/link), {{school}}, {{email}} and {{address}} are supported.' })], { maxItems: 30, itemLabel: 'heading' }),
        ],
        { fixed: true, itemLabel: 'title' }
      ),
    ],
  },
];

export const SECTION_KEYS = CONTENT_SECTIONS.map((s) => s.key);
export const getSection = (key) => CONTENT_SECTIONS.find((s) => s.key === key);
