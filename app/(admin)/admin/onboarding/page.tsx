import { ArrowRight, Check, MapPin, ShieldCheck, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSchoolReadiness, type ReadinessStepKey } from '@/lib/onboarding';
import { requireSchoolPage } from '@/lib/session';

const STEP_META: Record<
  ReadinessStepKey,
  { title: string; description: string; href: string; cta: string; icon: typeof MapPin }
> = {
  pickup: {
    title: 'Punto de recogida',
    description: 'Marcá en el mapa la puerta del colegio y su radio (geofence).',
    href: '/admin/pickup-points/new',
    cta: 'Agregar punto',
    icon: MapPin,
  },
  students: {
    title: 'Alumnos',
    description: 'Cargá alumnos uno a uno o por Excel, con sus grados.',
    href: '/admin/students/new',
    cta: 'Agregar alumno',
    icon: Users,
  },
  parents: {
    title: 'Padres invitados',
    description: 'Subí el Excel de padres: el sistema les manda la invitación por email o WhatsApp.',
    href: '/admin/students/import',
    cta: 'Importar padres',
    icon: UserPlus,
  },
  staff: {
    title: 'Personal de portón',
    description: 'Sumá auxiliares (logistics) y soporte que operan la TV y finalizan entregas.',
    href: '/admin/staff',
    cta: 'Agregar personal',
    icon: ShieldCheck,
  },
};

export default async function OnboardingPage() {
  const { session, schoolId } = await requireSchoolPage();
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');

  const readiness = await getSchoolReadiness(schoolId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black">Configurá tu escuela</h1>
        <p className="text-sm text-muted-foreground">
          Completá estos pasos para dejar la escuela lista para operar. Podés volver cuando quieras.
        </p>
      </div>

      {readiness.isReady ? (
        <Card className="border-2 border-green-200 bg-green-50/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <CardTitle className="text-xl">Tu escuela está lista</CardTitle>
            </div>
            <CardDescription>
              Tenés puntos de recogida, alumnos y padres invitados. Ya podés operar las recogidas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/admin/dashboard">
                Ir al tablero en vivo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Falta poco</CardTitle>
            <CardDescription>
              La escuela queda lista con al menos un punto de recogida, un alumno y un padre invitado.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

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
                    <p className="font-bold leading-tight">{meta.title}</p>
                    {step.done ? (
                      <Badge variant="success">{step.count}</Badge>
                    ) : step.required ? (
                      <Badge variant="warning">Requerido</Badge>
                    ) : (
                      <Badge variant="secondary">Opcional</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {meta.description}
                  </p>
                </div>
                <Button asChild variant={step.done ? 'outline' : 'default'} className="shrink-0">
                  <Link href={meta.href}>{step.done ? 'Agregar más' : meta.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
