import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export const runtime = 'edge';

const ALLOWED_ROLES = ['director', 'super_admin'];

interface DayBucket {
  day: string;
  count: number;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildEmptyBuckets(days: number): DayBucket[] {
  const out: DayBucket[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push({ day: dayKey(d), count: 0 });
  }
  return out;
}

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ALLOWED_ROLES);
    const isSuper = session.user.role === 'super_admin';
    const schoolFilter = isSuper ? undefined : session.user.schoolId ?? undefined;
    if (!isSuper && !schoolFilter) {
      return Response.json({ error: 'NO_SCHOOL' }, { status: 400 });
    }

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const dayCutoff = new Date();
    dayCutoff.setUTCHours(0, 0, 0, 0);
    dayCutoff.setUTCDate(dayCutoff.getUTCDate() - 29);

    const studentWhere = isSuper ? { active: true } : { active: true, schoolId: schoolFilter };
    const tripMonthWhere = isSuper
      ? { startedAt: { gte: monthStart } }
      : { startedAt: { gte: monthStart }, schoolId: schoolFilter };
    const trip30Where = isSuper
      ? { startedAt: { gte: dayCutoff } }
      : { startedAt: { gte: dayCutoff }, schoolId: schoolFilter };

    const [studentsActive, tripsThisMonth, byStatus, recentTrips, perSchool] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.trip.count({ where: tripMonthWhere }),
      prisma.trip.groupBy({
        by: ['status'],
        where: tripMonthWhere,
        _count: { _all: true },
      }),
      prisma.trip.findMany({
        where: trip30Where,
        select: { startedAt: true, schoolId: true, status: true },
      }),
      isSuper
        ? prisma.trip.groupBy({
            by: ['schoolId'],
            where: tripMonthWhere,
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const delivered = byStatus.find((s) => s.status === 'ENTREGADO')?._count._all ?? 0;
    const canceled = byStatus.find((s) => s.status === 'CANCELADO')?._count._all ?? 0;
    const total = tripsThisMonth || 1;

    const buckets = buildEmptyBuckets(30);
    const idx = new Map(buckets.map((b, i) => [b.day, i]));
    for (const t of recentTrips) {
      const k = dayKey(t.startedAt);
      const i = idx.get(k);
      if (i !== undefined) buckets[i].count += 1;
    }

    let breakdown: Array<{ schoolId: string; schoolName: string; trips: number }> = [];
    if (isSuper && perSchool.length > 0) {
      const ids = perSchool.map((p) => p.schoolId);
      const schools = await prisma.school.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      const nameById = new Map(schools.map((s) => [s.id, s.name]));
      breakdown = perSchool
        .map((p) => ({
          schoolId: p.schoolId,
          schoolName: nameById.get(p.schoolId) ?? p.schoolId,
          trips: p._count._all,
        }))
        .sort((a, b) => b.trips - a.trips);
    }

    return Response.json({
      studentsActive,
      tripsThisMonth,
      deliveredPct: Math.round((delivered / total) * 1000) / 10,
      canceledPct: Math.round((canceled / total) * 1000) / 10,
      tripsPerDay: buckets,
      breakdown,
    });
  } catch (err) {
    return jsonError(err);
  }
}
