import {
  FaSchool, FaBars, FaShapes, FaHome, FaInfoCircle, FaFlask, FaGraduationCap, FaClipboardList, FaGavel, FaExchangeAlt,
  FaBookOpen, FaUsers, FaCalendarAlt, FaImages, FaBullhorn, FaUserTie, FaEnvelope, FaUserLock, FaFileContract,
} from 'react-icons/fa';

// Icon of each Website Content section (src/content/schema.js) in the dashboard
export const SECTION_ICONS = {
  general: FaSchool,
  navigation: FaBars,
  shared: FaShapes,
  home: FaHome,
  about: FaInfoCircle,
  facilities: FaFlask,
  admission: FaGraduationCap,
  admissionInfo: FaClipboardList,
  rules: FaGavel,
  transfer: FaExchangeAlt,
  prospectus: FaBookOpen,
  administration: FaUsers,
  campus: FaCalendarAlt,
  gallery: FaImages,
  notices: FaBullhorn,
  messages: FaUserTie,
  contact: FaEnvelope,
  portals: FaUserLock,
  legal: FaFileContract,
};

export const sectionIcon = (key) => SECTION_ICONS[key] || FaShapes;

// Sections that have their own page in the dashboard menu (not listed under Website Content).
// Each page: its route, menu label, intro and the sections it edits (several = tabs).
export const SECTION_PAGES = [
  { href: '/dashboard/school-info', title: 'School Information', description: 'Name, logo, contact details, social links and search-engine text used on every page.', keys: ['general'] },
  { href: '/dashboard/menus', title: 'Menus', description: 'Main menu, footer link columns and legal links.', keys: ['navigation'] },
  { href: '/dashboard/home-page', title: 'Home Page', description: 'Slider, quick links, welcome block, section titles and values.', keys: ['home'] },
  { href: '/dashboard/about-page', title: 'About Page', description: 'Welcome text, highlights, mission / vision / values and educational approach.', keys: ['about'] },
  { href: '/dashboard/facilities', title: 'Facilities', description: 'Facilities list and the page of each facility.', keys: ['facilities'] },
  {
    href: '/dashboard/admission',
    title: 'Admission',
    description: 'Class levels, admission information, rules, transfer procedure and prospectus.',
    keys: ['admission', 'admissionInfo', 'rules', 'transfer', 'prospectus'],
  },
];

// Section key → the dashboard page that edits it (for old links)
export const pageForSection = (key) => SECTION_PAGES.find((p) => p.keys.includes(key));
