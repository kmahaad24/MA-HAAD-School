import { PortalIndex, portalIndexMetadata } from '@/views/PortalViews';

export const generateMetadata = () => portalIndexMetadata('portal');

export default function Page() {
  return <PortalIndex groupKey="portal" />;
}
