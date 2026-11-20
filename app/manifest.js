import { getContent } from '@/server/services/site-content.service';
import { THEME_COLOR, APP_ICONS } from '@/config/site';

// Refreshed hourly so a new school name / description shows up
export const revalidate = 3600;

// Lets phones "Add to home screen" with the school name and icon
export default async function manifest() {
  const { identity } = await getContent('general');
  return {
    name: identity.name,
    short_name: identity.shortName || identity.name,
    description: identity.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: THEME_COLOR,
    icons: APP_ICONS,
  };
}
