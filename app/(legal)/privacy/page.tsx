import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { LegalPageShell } from '@/components/legal-page-shell';

import { PrivacyContentEn } from './content-en';
import { PrivacyContentEs } from './content-es';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal');
  return {
    title: t('privacy.metaTitle'),
    description: t('privacy.metaDescription'),
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = await getTranslations('legal');

  return (
    <LegalPageShell title={t('privacy.title')} updatedAt={t('privacy.updatedAt')}>
      {locale === 'en' ? <PrivacyContentEn /> : <PrivacyContentEs />}
    </LegalPageShell>
  );
}
