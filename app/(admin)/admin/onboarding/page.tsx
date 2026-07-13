import { ArrowRight, Check, FileSpreadsheet, MapPin, ShieldCheck, Tag, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSchoolReadiness, type ReadinessStepKey } from '@/lib/onboarding';
import { getCurrentSession } from '@/lib/session';

const STEP_META: Record<ReadinessStepKey, { href: string; icon: typeof MapPin }> = {
  pickup: { href: '/admin/pickup-points/new', icon: MapPin },
  grades: { href: '/admin/grades', icon: Tag },
  // El onboarding empuja la carga MASIVA por Excel (no uno-por-uno): el alta individual
  // sigue disponible desde la lista de alumnos.
  students: { href: '/admin/students/import', icon: Users },
  parents: { href: '/admin/invitations/import', icon: UserPlus },
  staff: { href: '/admin/staff', icon: ShieldCheck },
};

export default async function OnboardingPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');

  const readiness = await getSchoolReadiness(session.user.schoolId);
  const t = await getTranslations('schools');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('onboarding.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('onboarding.subtitle')}</p>
      </div>

      {readiness.isReady ? (
        <Card className="border-2 border-green-200 bg-green-50/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <CardTitle className="text-xl">{t('onboarding.readyTitle')}</CardTitle>
            </div>
            <CardDescription>{t('onboarding.readyDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/admin/dashboard">
                {t('onboarding.goLive')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">{t('onboarding.almostTitle')}</CardTitle>
            <CardDescription>{t('onboarding.almostDesc')}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="border-2 border-dashed border-primary/30 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">{t('onboarding.combined.title')}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t('onboarding.combined.description')}
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/admin/imports/combined">{t('onboarding.combined.cta')}</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {readiness.steps.map((step) => {
          const meta = STEP_META[step.key];
          const Icon = meta.icon;
          return (
            <Card key={step.key} className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={
                    step.done
                      ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600'
                      : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground'
                  }
                >
                  {step.done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold leading-tight">
                      {t(`onboarding.steps.${step.key}.title`)}
                    </p>
                    {step.done ? (
                      <Badge variant="success">{step.count}</Badge>
                    ) : step.required ? (
                      <Badge variant="warning">{t('onboarding.required')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('onboarding.optional')}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`onboarding.steps.${step.key}.description`)}
                  </p>
                  {step.key === 'parents' && readiness.invitedParentsCount > 0 && (
                    <p className="mt-1 text-xs font-bold">
                      {t('onboarding.parentsProgress', {
                        invited: readiness.invitedParentsCount,
                        registered: readiness.registeredParentsCount,
                      })}{' '}
                      <Link href="/admin/invitations" className="text-primary underline">
                        {t('onboarding.manageInvitations')}
                      </Link>
                    </p>
                  )}
                </div>
                <Button asChild variant={step.done ? 'outline' : 'default'} className="shrink-0">
                  <Link href={meta.href}>
                    {step.done ? t('onboarding.addMore') : t(`onboarding.steps.${step.key}.cta`)}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
