import { PortalIndex, portalIndexMetadata } from '@/views/PortalViews';

export const generateMetadata = () => portalIndexMetadata('requisition');

export default function Page() {
  return <PortalIndex groupKey="requisition" />;
}
