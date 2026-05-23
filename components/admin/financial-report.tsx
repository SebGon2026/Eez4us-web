'use client';

import { useEffect, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FinancialData {
  totalBilled: number;
  totalCommissions: number;
  net: number;
  perSchool: Array<{
    schoolId: string;
    schoolName: string;
    quantity: number;
    revenue: number;
    commissions: number;
    status: string;
  }>;
}

const COLORS = [
  'hsl(215 90% 57%)',
  'hsl(160 70% 45%)',
  'hsl(30 90% 55%)',
  'hsl(280 60% 60%)',
  'hsl(350 80% 60%)',
  'hsl(190 70% 50%)',
];

function fmt(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function FinancialReport() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/reports/financial')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FinancialData>;
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
  if (!data) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>Facturado/mes</CardDescription>
            <CardTitle className="text-3xl text-primary">{fmt(data.totalBilled)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>Comisiones</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{fmt(data.totalCommissions)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>Neto</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{fmt(data.net)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Revenue por escuela</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {data.perSchool.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay suscripciones activas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.perSchool}
                  dataKey="revenue"
                  nameKey="schoolName"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {data.perSchool.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(v) : String(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Detalle</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escuela</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Alumnos</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.perSchool.map((p) => (
                <TableRow key={p.schoolId}>
                  <TableCell className="font-bold">{p.schoolName}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(p.revenue)}</TableCell>
                  <TableCell className="text-right font-mono text-amber-700">
                    {fmt(p.commissions)}
                  </TableCell>
                </TableRow>
              ))}
              {data.perSchool.length > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-mono font-black text-primary">
                    {fmt(data.totalBilled)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-black text-amber-700">
                    {fmt(data.totalCommissions)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
