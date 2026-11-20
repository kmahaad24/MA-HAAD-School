import LegalPage, { legalMetadata } from '@/components/layout/LegalPage';

export const generateMetadata = () => legalMetadata('termsofuse');

export default function Page() {
  return <LegalPage docKey="termsofuse" />;
}
