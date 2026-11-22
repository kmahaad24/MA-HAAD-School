import { getContents } from '@/server/services/site-content.service';
import { admissionClasses } from '@/server/services/admission.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import Container from '@/components/ui/Container';
import AdmissionForm from '@/components/forms/AdmissionForm';

const TITLE = 'Online Admission';
const SUBTITLE = 'Fill in the form and the school office will contact you to complete the admission.';

export async function generateMetadata() {
  const { admission } = await getContents('admission');
  return pageMetadata({ title: TITLE, description: SUBTITLE, path: '/admission/apply', image: admission.banner.image });
}

export default async function AdmissionApplyPage() {
  const [{ admission }, classes] = await Promise.all([getContents('admission'), admissionClasses()]);
  return (
    <>
      <PageBanner banner={{ ...admission.banner, title: TITLE, subtitle: SUBTITLE }} breadcrumbs={[{ label: admission.banner.title, href: '/admission' }, { label: TITLE }]} />
      <section className="bg-slate-50 py-16 md:py-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl shadow-navy-900/5 ring-1 ring-slate-200 sm:p-8" data-reveal="">
            <h2 className="font-display text-2xl text-navy-900">Admission application</h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">All fields are required.</p>
            <AdmissionForm classes={classes} />
          </div>
        </Container>
      </section>
    </>
  );
}
