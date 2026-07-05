'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OperationalData {
  studentsActive: number;
  tripsThisMonth: number;
  deliveredPct: number;
  canceledPct: number;
  avgPickupMinutes: number | null;
  avgOutsideWaitMinutes: number | null;
  mobileUsers: { withApp: number; total: number };
  outsideUsage: { parents: number; trips: number };
  tripsPerDay: Array<{ day: string; count: number }>;
  breakdown: Array<{ schoolId: string; schoolName: string; trips: number }>;
}

function minutesLabel(v: number | null): string {
  return v == null ? '—' : `${v} min`;
}

export function OperationalReport({ isSuper }: { isSuper: boolean }) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const [data, setData] = useState<OperationalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/reports/operational')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<OperationalData>;
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
  }, []);

  if (error) {
    return (
      <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
        {error}
      </p>
    );
  }
  if (!data) return <p className="text-sm text-muted-foreground">{tCommon('states.loading')}</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('operational.activeStudents')}</CardDescription>
            <CardTitle className="text-4xl text-primary">{data.studentsActive}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('operational.tripsThisMonth')}</CardDescription>
            <CardTitle className="text-4xl text-primary">{data.tripsThisMonth}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('operational.deliveredPct')}</CardDescription>
            <CardTitle className="text-4xl text-emerald-600">{data.deliveredPct}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('operational.canceledPct')}</CardDescription>
            <CardTitle className="text-4xl text-destructive">{data.canceledPct}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('operational.avgPickupDuration')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {minutesLabel(data.avgPickupMinutes)}
            </CardTitle>
            <CardDescription>{t('operational.avgPickupDurationHint')}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('operational.avgOutsideWait')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {minutesLabel(data.avgOutsideWaitMinutes)}
            </CardTitle>
            <CardDescription>{t('operational.avgOutsideWaitHint')}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('operational.parentsWithApp')}</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {data.mobileUsers.withApp}
              <span className="text-xl text-muted-foreground"> / {data.mobileUsers.total}</span>
            </CardTitle>
            <CardDescription>{t('operational.withRegisteredDevice')}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('operational.useImOutside')}</CardDescription>
            <CardTitle className="text-4xl text-primary">{data.outsideUsage.parents}</CardTitle>
            <CardDescription>
              {t('operational.usesThisMonth', { count: data.outsideUsage.trips })}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t('operational.tripsPerDayLast30')}</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.tripsPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(215 90% 57%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {isSuper && data.breakdown.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">{t('operational.breakdownBySchool')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.school')}</TableHead>
                  <TableHead className="text-right">{t('operational.tripsMonth')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.breakdown.map((b) => (
                  <TableRow key={b.schoolId}>
                    <TableCell className="font-bold">{b.schoolName}</TableCell>
                    <TableCell className="text-right font-mono">{b.trips}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="text-right font-bold">{t('table.total')}</TableCell>
                  <TableCell className="text-right font-mono font-black text-primary">
                    {data.breakdown.reduce((a, b) => a + b.trips, 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
