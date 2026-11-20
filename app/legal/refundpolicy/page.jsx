import LegalPage, { legalMetadata } from '@/components/layout/LegalPage';

export const generateMetadata = () => legalMetadata('refundpolicy');

export default function Page() {
  return <LegalPage docKey="refundpolicy" />;
}
