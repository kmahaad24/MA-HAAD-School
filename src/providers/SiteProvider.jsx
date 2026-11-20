'use client';
import { createContext, useContext } from 'react';

// Website content needed by client components (header, footer, notice bar, forms):
// { general, navigation, shared } — read on the server in app/layout.jsx.
const SiteContext = createContext(null);

export function SiteProvider({ value, children }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const site = useContext(SiteContext);
  if (!site) throw new Error('useSite() must be used inside <SiteProvider>.');
  return site;
}
