'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Tile {
  label: string;
  value: number;
  href: string;
}

interface AdminHomeTilesProps {
  tiles: Tile[];
}

const container = {
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export function AdminHomeTiles({ tiles }: AdminHomeTilesProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {tiles.map((t) => (
        <motion.div key={t.label} variants={item}>
          <Link href={t.href}>
            <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader>
                <CardDescription>{t.label}</CardDescription>
                <CardTitle className="text-4xl text-primary">{t.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
