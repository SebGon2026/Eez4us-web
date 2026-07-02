'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface FaqItem {
  q: string;
  a: string;
}

// El contenido queda montado siempre y se anima height/opacity (sin AnimatePresence:
// con framer-motion 12 + React 19 el exit no desmonta y el acordeón queda a medias).
export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`overflow-hidden rounded-2xl border bg-card shadow-card transition-colors duration-300 ${
              isOpen ? 'border-primary/40' : 'border-border'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-foreground"
            >
              {item.q}
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 text-muted-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>
            <motion.div
              initial={false}
              animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.32, ease: [0.21, 0.65, 0.36, 1] }}
              className="overflow-hidden"
              aria-hidden={!isOpen}
            >
              <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
