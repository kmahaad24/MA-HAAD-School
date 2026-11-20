import LegalPage, { legalMetadata } from '@/components/layout/LegalPage';

export const generateMetadata = () => legalMetadata('cookiepolicy');

export default function Page() {
  return <LegalPage docKey="cookiepolicy" />;
}
