import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentSession } from '@/lib/session';

import { NewSchoolForm } from './new-school-form';

export default async function NewSchoolPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin');
  const t = await getTranslations('schools');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('new.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('new.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('new.schoolData')}</CardTitle>
        </CardHeader>
        <CardContent>
          <NewSchoolForm />
        </CardContent>
      </Card>
    </div>
  );
}
