// Starting values of every content section (see src/content/schema.js). The website shows these until
// something is saved in Dashboard → Website Content; saved values are merged over them.
import * as school from '@/data/school';
import { legalDocs, LEGAL_ORDER } from '@/data/legal';
import { portalGroups } from '@/data/portals';
import { staffGroups } from '@/data/staff';

const { images } = school;

// Legal text: [paragraph | { list: [] }] → editable text (blank line between paragraphs, "- " bullets)
const legalBody = (blocks) => blocks.map((b) => (typeof b === 'string' ? b : b.list.map((item) => `- ${item}`).join('\n'))).join('\n\n');

export const CONTENT_DEFAULTS = {
  general: {
    identity: {
      name: 'MA HAAD School & College',
      shortName: 'MA HAAD',
      tagline: 'Inspiring Young Minds, Nurturing Bright Futures',
      description:
        'MA HAAD School & College is an English Version school in Khilkhet, Dhaka, following the National Curriculum of Bangladesh — quality education from Play Group to Class X in a supportive, student-friendly environment.',
      about: 'An English Version school following the National Curriculum of Bangladesh, committed to quality education in a supportive, engaging and student-friendly environment.',
      curriculum: 'English Version · National Curriculum of Bangladesh',
      levels: 'Play Group to Class X',
    },
    branding: { logo: '/logos/ma-haad-logo.png', ogImage: images.marchPast },
    contact: {
      email: 'info@mahaad.edu.bd',
      phones: ['01896-281602', '01753-555222'],
      callingTime: '9:00 am – 6:00 pm',
      address: 'House-49/A, Bot Tola, Khilkhet, Dhaka-1229, Bangladesh',
      addressShort: 'Bot Tola, Khilkhet, Dhaka-1229',
      mapUrl: 'https://maps.app.goo.gl/1kdhVMF3X8qiSPcW9',
      mapEmbed: 'https://maps.google.com/maps?q=23.8312461,90.4256367&z=17&hl=en&output=embed',
    },
    social: { facebook: '', youtube: '', instagram: '', linkedin: '', x: '' },
    apps: { appStore: '', googlePlay: '' },
    seo: {
      keywords: ['MA HAAD School', 'MA HAAD School & College', 'English Version school Dhaka', 'school in Khilkhet', 'National Curriculum', 'Play Group to Class X'],
      googleVerification: '',
      gtmId: 'GTM-M7KCJXLQ',
    },
    header: { ctaLabel: 'Admission', ctaHref: '/admission/information', showStaffLogin: true },
  },

  navigation: {
    main: [
      { label: 'Home', href: '/', children: [] },
      {
        label: 'About Us',
        href: '/about',
        children: [
          { label: 'About MA HAAD School and College', href: '/about' },
          { label: "CEO's Message", href: '/about/ceo-message' },
          { label: "Principal's Message", href: '/about/principal-message' },
        ],
      },
      { label: 'Facilities', href: '/facilities', children: school.facilities.map((f) => ({ label: f.title, href: `/facilities/${f.slug}` })) },
      {
        label: 'Admission',
        href: '/admission',
        children: [
          ...school.programs.map((p) => ({ label: p.title, href: `/admission/${p.slug}` })),
          { label: 'Admission Information', href: '/admission/information' },
          { label: 'Rules and Regulations', href: '/admission/rules-and-regulations' },
          { label: 'Transfer Procedure', href: '/admission/transfer-procedure' },
          { label: 'Prospectus', href: '/admission/prospectus' },
        ],
      },
      {
        label: 'Campus',
        href: '/campus',
        children: [
          { label: 'Books', href: '/campus/books' },
          { label: 'List of Holidays', href: '/campus/holidays' },
          { label: 'Academic Calendar', href: '/campus/academic-calendar' },
        ],
      },
      { label: 'Administration', href: '/administration', children: staffGroups.map((g) => ({ label: g.title, href: `/administration/${g.slug}` })) },
      { label: 'Photo Gallery', href: '/gallery', children: [] },
      { label: 'Contact Us', href: '/contact', children: [] },
    ],
    footerQuick: [
      { label: 'About Us', href: '/about' },
      { label: 'Notice Board', href: '/notices' },
      { label: 'Academic Calendar', href: '/campus/academic-calendar' },
      { label: 'List of Holidays', href: '/campus/holidays' },
      { label: 'Photo Gallery', href: '/gallery' },
      { label: 'Contact Us', href: '/contact' },
    ],
    footerAdmission: [
      ...school.programs.map((p) => ({ label: p.title, href: `/admission/${p.slug}` })),
      { label: 'Admission Information', href: '/admission/information' },
      { label: 'Rules and Regulations', href: '/admission/rules-and-regulations' },
      { label: 'Prospectus', href: '/admission/prospectus' },
    ],
    footerUseful: [
      { label: 'Ministry of Education', href: 'https://moedu.gov.bd' },
      { label: 'Ministry of Primary & Mass Education', href: 'https://mopme.gov.bd' },
      { label: 'Dhaka Education Board', href: 'https://dhakaeducationboard.gov.bd' },
      { label: 'NCTB', href: 'https://nctb.gov.bd' },
      { label: 'Directorate of Secondary & Higher Education', href: 'https://dshe.gov.bd' },
      { label: 'Directorate of Primary Education', href: 'https://dpe.gov.bd' },
    ],
    footerTitles: { quick: 'Quick Links', admission: 'Admission', useful: 'Useful Links' },
    legal: LEGAL_ORDER.map((key) => ({ label: legalDocs[key].title, href: `/legal/${key}` })),
  },

  shared: {
    defaultBanner: images.marchPast,
    cta: {
      badge: 'Admission enquiries',
      title: 'Ready to join the MA HAAD family?',
      text: 'Play Group to Class IX · English Version · National Curriculum. Call us during office calling time.',
      image: images.sportsTeam,
      primaryLabel: 'Admission Information',
      primaryHref: '/admission/information',
      secondaryLabel: 'Contact Us',
      secondaryHref: '/contact',
    },
    help: { title: 'Need help?', text: 'Our office is happy to answer your questions.' },
    map: { kicker: 'Find us', title: 'Visit Our Campus', subtitle: '' },
    ticker: [
      'Welcome to MA HAAD School & College — Inspiring Young Minds, Nurturing Bright Futures',
      'For admission enquiries call 01896-281602 / 01753-555222 (9:00 am – 6:00 pm)',
      'English Version · National Curriculum of Bangladesh · Play Group to Class X',
    ],
    comingSoon: { title: 'This list is being updated', text: 'This list will be published here soon. For any information, please contact the school office.' },
  },

  home: {
    slides: school.heroSlides.map((s) => ({ alt: '', ...s })),
    slideButtons: { primaryLabel: 'Admission Information', primaryHref: '/admission/information', secondaryLabel: 'About Us', secondaryHref: '/about' },
    quickLinks: school.quickLinks,
    welcome: { kicker: 'About us', image: images.marchPast, image2: images.scienceLab, badgeTitle: 'PG–X', badgeText: 'English Version', buttonLabel: 'Read More' },
    notices: { kicker: 'Stay updated', title: 'Latest Notices & Announcements', subtitle: 'Important updates, circulars and announcements from the school administration.' },
    programmes: { kicker: 'Our programmes', title: 'Classes at MA HAAD', subtitle: 'English Version education following the National Curriculum of Bangladesh — from the first day of school to the SSC examination.' },
    values: { kicker: 'Character first', title: 'Values We Nurture', subtitle: 'We encourage our students to develop honesty, discipline, respect, kindness, teamwork, and a positive attitude towards life.' },
    valuesImage: images.prizeWinners,
    valueItems: school.values,
    approach: { kicker: 'Why choose us', title: 'Our Approach to Learning', subtitle: 'Learning that is enjoyable, purposeful and relevant to the needs of today’s learners.' },
    facilities: { kicker: 'Facilities', title: 'Everything a Learner Needs', subtitle: 'Well-equipped spaces and caring support that make every school day productive and safe.' },
    gallery: { kicker: 'Campus life', title: 'Photo Gallery', subtitle: 'Moments from our sports, cultural programmes and classrooms.' },
  },

  about: {
    banner: { title: 'About MA HAAD School and College', subtitle: school.welcome.tagline, image: images.marchPast },
    welcome: { kicker: 'Our story', ...school.welcome, image: images.sportsTeam },
    highlights: school.highlights,
    purposeHeading: { kicker: 'Our purpose', title: 'Mission, Vision & Values', subtitle: 'The guiding principles that shape every decision we make and every student we educate.' },
    purpose: school.purpose,
    approachHeading: { kicker: 'What makes us different', title: 'Our Educational Approach', subtitle: '' },
    approach: school.approach,
  },

  facilities: {
    banner: { title: 'Facilities', subtitle: 'Well-equipped spaces and caring support for every learner.', image: images.scienceLab },
    heading: { kicker: 'On campus', title: 'Our Facilities', subtitle: 'Everything our students need to learn, explore and grow — safely and happily.' },
    items: school.facilities,
  },

  admission: {
    banner: { title: 'Admission', subtitle: school.admissionInfo.intro, image: images.newYear },
    heading: { kicker: 'Choose a level', title: 'Classes We Offer', subtitle: '' },
    programs: school.programs,
    ageNote: 'Age as of 1 January of the admission year.',
  },
  admissionInfo: school.admissionInfo,
  rules: { intro: 'These rules help us keep MA HAAD a safe, disciplined and happy place to learn. Every student and parent is expected to read and follow them.', sections: school.rules },
  transfer: school.transferProcedure,
  prospectus: { ...school.prospectus, image: images.sportsTeam },

  administration: {
    banner: { title: 'Administration', subtitle: 'The people who lead, teach and care for our students.', image: images.sportsTeachers },
    heading: { kicker: 'Our people', title: 'Leadership & Faculty', subtitle: '' },
    groups: staffGroups,
  },

  campus: {
    banner: { title: 'Campus', subtitle: 'Everything students and parents need to plan the school year.', image: images.bookFestival },
    heading: { kicker: 'Plan the year', title: 'Campus Information', subtitle: '' },
    cards: [
      { href: '/campus/books', title: 'Books', text: 'Class-wise list of textbooks and school-selected books.', icon: 'book' },
      { href: '/campus/holidays', title: 'List of Holidays', text: 'National, religious and school holidays of the session.', icon: 'umbrella-beach' },
      { href: '/campus/academic-calendar', title: 'Academic Calendar', text: 'Examinations, events, meetings and vacations, month by month.', icon: 'calendar' },
    ],
    books: {
      image: images.bookFestival,
      intro: 'From Class I, students follow the **NCTB textbooks (English Version)**, which are provided free of cost by the Government of Bangladesh. Books marked **School** are selected by MA HAAD and are available through the school office.',
    },
    holidays: { image: images.cultural, intro: 'Religious holidays depend on the sighting of the moon, so dates marked tentative may change — the school will confirm every holiday by notice.' },
    calendar: {
      image: images.podium,
      subtitle: 'Examinations, events, parent–teacher meetings, holidays and vacations at a glance.',
      tentativeNote: 'This is a tentative plan. Final dates for examinations, events and religious holidays are confirmed by notice — please check the Notice Board.',
      resumeNote: 'School resumes in January with the new session & book festival.',
    },
  },

  gallery: {
    banner: { title: 'Photo Gallery', subtitle: 'Moments and memories from MA HAAD.', image: images.trophy },
    heading: { kicker: 'Moments & memories', title: 'Life at MA HAAD', subtitle: 'Explore moments from our sports, cultural programmes and academic life.' },
    emptyText: 'New photos are coming soon',
  },

  notices: { banner: { title: 'Notices & Announcements', subtitle: 'Important updates and circulars from the school administration.', image: images.openingCeremony } },

  messages: { ceoBanner: images.sportsGuests, principalBanner: images.sportsTeachers, signOff: 'With best wishes,' },

  contact: {
    banner: { title: 'Contact Us', subtitle: "We'd love to hear from you.", image: images.openingCeremony },
    heading: { kicker: 'Get in touch', title: 'For Any Inquiries & Assistance', subtitle: 'Call us during office calling time or send us a message.' },
    form: {
      kicker: 'Send message',
      title: 'Drop Us a Line',
      text: 'Have a question about admission, or want to visit the school? Send us a message and we will get back to you.',
      topics: ['Admission', 'Fees & payment', 'Transfer Certificate', 'Visit the school', 'Something else'],
      privacyNote: 'Your details are only used to answer this message.',
      successText: 'Thank you! Your message has been sent. A confirmation has been emailed to you.',
    },
    location: { kicker: 'Find us', title: 'Our Location' },
    email: {
      subject: 'We received your message — MA HAAD School & College',
      body: 'Dear {{name}},\n\nThank you for contacting MA HAAD School & College. We have received your message and our office will get back to you as soon as possible.\n\nFor urgent matters, please call us during office calling time.',
    },
  },

  portals: Object.fromEntries(Object.entries(portalGroups).map(([key, g]) => [key, { title: g.title, description: g.description, items: g.items }])),

  legal: {
    docs: LEGAL_ORDER.map((key) => {
      const doc = legalDocs[key];
      return { key, title: doc.title, summary: doc.summary, lastUpdated: doc.lastUpdated, sections: doc.sections.map((s) => ({ heading: s.heading, body: legalBody(s.body) })) };
    }),
  },
};
