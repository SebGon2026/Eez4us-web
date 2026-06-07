import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'support_staff', 'super_admin'].includes(session.user.role)) redirect('/admin');

  const { q } = await searchParams;
  const search = (q ?? '').trim();

  const parents = await prisma.user.findMany({
    where: {
      schoolId: session.user.schoolId,
      role: 'parent',
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phoneE164: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phoneE164: true,
      _count: {
        select: {
          parentStudents: true,
          vehicles: true,
          authorizedFamilies: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Familias del colegio</h1>
        <p className="text-sm text-muted-foreground">
          Listado de padres con sus alumnos, vehículos y familiares secundarios.
        </p>
      </div>

      <form className="flex gap-2" action="" method="get">
        <input
          name="q"
          defaultValue={search}
          placeholder="Buscar por nombre, email o teléfono…"
          className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-2xl border-2 border-input px-4 text-sm font-bold hover:bg-secondary"
        >
          Buscar
        </button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Padres ({parents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {parents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {search
                ? 'Ningún padre encontrado con ese criterio.'
                : 'Aún no hay padres claimados.'}
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {parents.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{p.name ?? p.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.email}
                        {p.phoneE164 ? ` · ${p.phoneE164}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{p._count.parentStudents} hijos</span>
                      <span>{p._count.vehicles} vehículos</span>
                      <span>{p._count.authorizedFamilies} familiares</span>
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
