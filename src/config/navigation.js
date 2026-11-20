import { TbLayoutDashboard } from 'react-icons/tb';
import { FaGlobe, FaCog, FaSignInAlt, FaHistory, FaBullhorn, FaImages, FaUsers, FaUserTie, FaCalendarAlt, FaEnvelope, FaEdit, FaSchool, FaBars, FaHome, FaGraduationCap, FaFlask, FaInfoCircle, FaUserCog, FaUserCircle } from 'react-icons/fa';

// The public menus are website content (Dashboard → Website Content → Menus). Helpers below take that content.

// The dropdown links of one top-level item, e.g. sectionLinks(navigation, '/admission') — used for page sidebars
export const sectionLinks = (navigation, href) => navigation?.main?.find((item) => item.href === href)?.children || [];

// Every internal page in the menus (sitemap)
export function menuLinks(navigation) {
  const seen = new Set();
  const links = [];
  const add = (link) => {
    if (!link?.href?.startsWith('/') || seen.has(link.href)) return;
    seen.add(link.href);
    links.push(link);
  };
  navigation.main.forEach((item) => {
    add(item);
    item.children?.forEach(add);
  });
  [...navigation.footerQuick, ...navigation.footerAdmission, ...navigation.legal].forEach(add);
  return links;
}

// Admin dashboard sidebar
export const dashboardNav = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: TbLayoutDashboard },
      { label: 'Contact Requests', href: '/dashboard/messages', icon: FaEnvelope, badge: 'unreadMessages' },
      { label: 'Traffic Analytics', href: '/dashboard/traffic', icon: FaGlobe },
    ],
  },
  {
    title: 'Site Setup',
    items: [
      { label: 'School Information', href: '/dashboard/school-info', icon: FaSchool },
      { label: 'Menus', href: '/dashboard/menus', icon: FaBars },
      { label: 'Home Page', href: '/dashboard/home-page', icon: FaHome },
      { label: 'About Page', href: '/dashboard/about-page', icon: FaInfoCircle },
      { label: 'Facilities', href: '/dashboard/facilities', icon: FaFlask },
      { label: 'Admission', href: '/dashboard/admission', icon: FaGraduationCap },
    ],
  },
  {
    title: 'Website',
    items: [
      { label: 'Page Content', href: '/dashboard/content', icon: FaEdit },
      { label: 'Notices', href: '/dashboard/notices', icon: FaBullhorn },
      { label: 'Photo Gallery', href: '/dashboard/gallery', icon: FaImages },
      { label: 'Teachers & Staff', href: '/dashboard/staff', icon: FaUsers },
      { label: 'CEO & Principal', href: '/dashboard/leaders', icon: FaUserTie },
      { label: 'Academic Sessions', href: '/dashboard/sessions', icon: FaCalendarAlt },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Login History', href: '/dashboard/login-history', icon: FaSignInAlt },
      { label: 'User Activity', href: '/dashboard/activity', icon: FaHistory },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Users', href: '/dashboard/users', icon: FaUserCog },
      { label: 'My Profile', href: '/dashboard/profile', icon: FaUserCircle },
      { label: 'Settings', href: '/dashboard/settings', icon: FaCog },
    ],
  },
];

// Routes where the public header/footer are hidden
export const appOnlyRoutes = ['/dashboard', '/login'];
