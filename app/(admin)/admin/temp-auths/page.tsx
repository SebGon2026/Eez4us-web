import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

import { ValidateCodeForm } from './validate-code-form';

export default async function TempAuthsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'support_staff', 'super_admin'].includes(session.user.role)) {
    redirect('/admin');
  }

  const history = await prisma.temporaryAuthorization.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      parent: { select: { name: true, email: true } },
      usedByStaff: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Autorizaciones temporales</h1>
        <p className="text-sm text-muted-foreground">
          Validá un código generado por el padre para personas ocasionales (niñera, etc.).
        </p>
      </div>

      <ValidateCodeForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Histórico ({history.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay autorizaciones temporales generadas.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {history.map((h) => (
                <li key={h.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{h.personName}</p>
                      <p className="text-xs text-muted-foreground">
                        Padre: {h.parent.name ?? h.parent.email} · Código{' '}
                        <code className="rounded bg-secondary px-1 py-0.5">{h.code}</code> ·{' '}
                        Válido {new Date(h.validDate).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div>
                      {h.revokedAt ? (
                        <span className="rounded-full bg-destructive/20 px-2 py-1 text-xs font-bold text-destructive">
                          Revocada
                        </span>
                      ) : h.usedAt ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                          Usada por {h.usedByStaff?.name ?? 'staff'}
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
