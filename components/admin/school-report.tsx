'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchoolData {
  days: string[];
  totalPerDay: Array<{ day: string; count: number }>;
  series: Array<{
    studentId: string;
    name: string;
    points: Array<{ day: string; count: number }>;
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

export function SchoolReport() {
  const [data, setData] = useState<SchoolData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/reports/school')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SchoolData>;
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

  const merged = data.days.map((day, i) => {
    const row: Record<string, string | number> = { day, total: data.totalPerDay[i]?.count ?? 0 };
    for (const s of data.series) {
      row[s.name] = s.points[i]?.count ?? 0;
    }
    return row;
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Entregas totales por día</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(215 90% 57%)"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {data.series.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Por niño</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {data.series.slice(0, 8).map((s, i) => (
                  <Line
                    key={s.studentId}
                    type="monotone"
                    dataKey={s.name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
