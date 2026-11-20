import { PortalPage, portalMetadata } from '@/views/PortalViews';

export const generateMetadata = ({ params }) => portalMetadata('portal', params);

export default function Page({ params }) {
  return <PortalPage groupKey="portal" params={params} />;
}
