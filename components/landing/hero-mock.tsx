'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Car, Check, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.2 } },
};

const card = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

const ETA_CYCLE = ['2 min', '1 min', 'Llegó'] as const;

function MockLabel({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {children}
    </p>
  );
}

function FloatingCard({ index, children }: { index: number; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div variants={card} whileHover={{ y: -6, scale: 1.015 }} className="h-full">
      <motion.div
        animate={reduced ? undefined : { y: [0, -7, 0] }}
        transition={{
          duration: 5 + index * 0.9,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.7,
        }}
        className="h-full rounded-3xl border border-border bg-card p-5 shadow-elev"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function HeroMock() {
  const [etaIndex, setEtaIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setEtaIndex((i) => (i + 1) % ETA_CYCLE.length), 2600);
    return () => clearInterval(id);
  }, [reduced]);

  const eta = ETA_CYCLE[etaIndex];
  const arrived = eta === 'Llegó';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3"
    >
      <FloatingCard index={0}>
        <MockLabel dot="bg-[hsl(var(--brand-blue))]">App de la familia</MockLabel>
        <div className="mt-4 rounded-2xl border border-border bg-background p-4">
          <p className="text-xs font-semibold text-muted-foreground">Hola, Ana</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">Mateo · 3.º A</p>
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-elev"
          >
            <Car className="h-4 w-4" />
            Voy en camino
          </motion.div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[hsl(var(--brand-green))] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--brand-green))]" />
              </span>
              Compartiendo trayecto
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 font-bold text-foreground">
              ETA 6 min
            </span>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard index={1}>
        <MockLabel dot="bg-[hsl(var(--brand-green))]">Portón del colegio</MockLabel>
        <ul className="mt-4 space-y-2">
          <li
            className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition-colors duration-500 ${
              arrived
                ? 'border-[hsl(var(--brand-green)/0.5)] bg-[hsl(var(--brand-green)/0.08)]'
                : 'border-border bg-background'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[hsl(var(--brand-green))] opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--brand-green))]" />
              </span>
              <span>
                <span className="block text-xs font-bold text-foreground">Familia Rodríguez</span>
                <span className="block text-[11px] font-medium text-muted-foreground">
                  Sofía · 1.º B
                </span>
              </span>
            </span>
            {/* Remount por key (sin AnimatePresence): el nodo viejo sale al instante. */}
            <span className="relative h-4 w-14 overflow-hidden text-right">
              <motion.span
                key={eta}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={`absolute inset-0 text-xs font-black ${
                  arrived ? 'text-[hsl(104_45%_30%)]' : 'text-foreground'
                }`}
              >
                {eta}
              </motion.span>
            </span>
          </li>
          {[
            {
              dot: 'bg-[hsl(var(--brand-yellow))]',
              family: 'Familia Hernández',
              student: 'Lucas · 5.º A',
              eta: '7 min',
            },
            {
              dot: 'bg-muted-foreground/40',
              family: 'Familia García',
              student: 'Emma · 3.º C',
              eta: '15 min',
            },
          ].map((row) => (
            <li
              key={row.family}
              className="flex items-center justify-between rounded-2xl border border-border bg-background px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} aria-hidden />
                <span>
                  <span className="block text-xs font-bold text-foreground">{row.family}</span>
                  <span className="block text-[11px] font-medium text-muted-foreground">
                    {row.student}
                  </span>
                </span>
              </span>
              <span className="text-xs font-black text-foreground">{row.eta}</span>
            </li>
          ))}
        </ul>
      </FloatingCard>

      <FloatingCard index={2}>
        <MockLabel dot="bg-[hsl(var(--brand-pink))]">Entrega verificada</MockLabel>
        <div className="mt-4 rounded-2xl border border-border bg-background p-4 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5, ease: EASE }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-white"
          >
            <QrCode className="h-10 w-10 text-foreground" />
          </motion.div>
          <p className="mt-3 text-sm font-bold text-foreground">Sofía Rodríguez</p>
          <p className="text-[11px] font-medium text-muted-foreground">Tarjeta QR · 1.º B</p>
          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.15, type: 'spring', stiffness: 320, damping: 18 }}
            className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--brand-green)/0.14)] px-3 py-1 text-[11px] font-bold text-[hsl(104_45%_30%)]"
          >
            <Check className="h-3.5 w-3.5" />
            Entregada 14:32 · Miss Laura
          </motion.p>
        </div>
      </FloatingCard>
    </motion.div>
  );
}
