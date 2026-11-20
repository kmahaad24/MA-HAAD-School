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
};

// Exact route first, so /dashboard does not match every page
export const tutorialFor = (pathname = '') => TUTORIALS[pathname.replace(/\/+$/, '') || '/'] || null;
