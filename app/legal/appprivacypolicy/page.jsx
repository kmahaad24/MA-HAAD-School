import LegalPage, { legalMetadata } from '@/components/layout/LegalPage';

export const generateMetadata = () => legalMetadata('appprivacypolicy');

export default function Page() {
  return <LegalPage docKey="appprivacypolicy" />;
}
