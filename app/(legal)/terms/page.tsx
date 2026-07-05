import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { LegalPageShell } from '@/components/legal-page-shell';

import { TermsContentEn } from './content-en';
import { TermsContentEs } from './content-es';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal');
  return {
    title: t('terms.metaTitle'),
    description: t('terms.metaDescription'),
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const t = await getTranslations('legal');

  return (
    <LegalPageShell title={t('terms.title')} updatedAt={t('terms.updatedAt')}>
      {locale === 'en' ? <TermsContentEn /> : <TermsContentEs />}
    </LegalPageShell>
  );
}
