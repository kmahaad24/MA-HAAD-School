import { PortalPage, portalMetadata } from '@/views/PortalViews';

export const generateMetadata = ({ params }) => portalMetadata('requisition', params);

export default function Page({ params }) {
  return <PortalPage groupKey="requisition" params={params} />;
}
