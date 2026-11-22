// "Learn about this page" videos in the dashboard (button in the top bar).
// Key = dashboard route, value = YouTube video ID (the part after watch?v=). Add a line to add a video.
export const TUTORIALS = {
  '/dashboard': { id: 'ajtvOUXOiiA', title: 'Dashboard' },
  '/dashboard/messages': { id: 'ZR3qBC_yt9M', title: 'Contact Requests' },
  '/dashboard/menus': { id: 'dokGGVcBIUY', title: 'Menus' },
  '/dashboard/home-page': { id: 'KiXOAPRhIoM', title: 'Home Page' },
  '/dashboard/about-page': { id: '5lfYvJ2XDnE', title: 'About Page' },
  '/dashboard/facilities': { id: 'sIe8O9JK5lA', title: 'Facilities' },
  '/dashboard/admission': { id: 'UqWF0Er2j2Q', title: 'Admission' },
  '/dashboard/leaders': { id: 'wQUXLTAf09o', title: 'CEO & Principal' },
  '/dashboard/sessions': { id: 'G_7gxiv_RlU', title: 'Academic Sessions' },
  '/dashboard/login-history': { id: 'LsZ7TeAcbBA', title: 'Login History' },
  '/dashboard/school-info': { id: 'kKh1g9AItM0', title: 'School Information' },
  '/dashboard/content': { id: 'GuBaBzOxFgs', title: 'Page Content' },
  '/dashboard/notices': { id: 'q2Bor28-l58', title: 'Notices' },
  '/dashboard/gallery': { id: '3IxmH9QpLEs', title: 'Photo Gallery' },
  '/dashboard/staff': { id: 'bJv6kEMv-qQ', title: 'Teachers & Staff' },
  '/dashboard/traffic': { id: 'BXZDKhSQbTc', title: 'Traffic Analytics' },
  '/dashboard/activity': { id: '2EqM2cIW3ug', title: 'User Activity' },
};

// Exact route first, so /dashboard does not match every page
export const tutorialFor = (pathname = '') => TUTORIALS[pathname.replace(/\/+$/, '') || '/'] || null;
