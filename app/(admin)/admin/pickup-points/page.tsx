import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { DeleteButton } from '@/components/admin/delete-button';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function PickupPointsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const schoolId = session.user.schoolId;
  const t = await getTranslations('pickupPoints');
  const tc = await getTranslations('common');

  const pickupPoints = await prisma.pickupPoint.findMany({
    where: { schoolId, active: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      centerLat: true,
      centerLng: true,
      radiusMeters: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">{t('list.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
        </div>
        <Link href="/admin/pickup-points/new">
          <Button>{t('list.newPoint')}</Button>
        </Link>
      </div>

      {pickupPoints.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t('list.emptyTitle')}
          description={t('list.emptyDescription')}
          action={
            <Link href="/admin/pickup-points/new">
              <Button>{t('list.createFirst')}</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc('fields.name')}</TableHead>
                <TableHead>{t('list.coordinates')}</TableHead>
                <TableHead>{t('list.radius')}</TableHead>
                <TableHead className="text-right">{tc('fields.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pickupPoints.map((pp) => (
                <TableRow key={pp.id}>
                  <TableCell className="font-bold">{pp.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {pp.centerLat.toFixed(5)}, {pp.centerLng.toFixed(5)}
                  </TableCell>
                  <TableCell>{pp.radiusMeters} m</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Link href={`/admin/pickup-points/${pp.id}/edit`}>
                        <Button variant="outline" size="sm">
                          {tc('actions.edit')}
                        </Button>
                      </Link>
                      <DeleteButton
                        url={`/api/schools/${schoolId}/pickup-points/${pp.id}`}
                        description={t('list.deleteDescription')}
                        successMessage={t('list.deleteSuccess')}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
