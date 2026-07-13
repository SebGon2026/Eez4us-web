'use client';

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { LanguageSwitcher } from '@/components/language-switcher';

interface MobileMenuProps {
  links: { href: string; label: string }[];
}

// Sin AnimatePresence a propósito: con framer-motion 12 + React 19 el exit
// no desmonta y deja un overlay invisible que bloquea taps. Render condicional puro.
export function MobileMenu({ links }: MobileMenuProps) {
  const t = useTranslations('landing.nav');
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? t('closeMenu') : t('openMenu')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:bg-secondary"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.21, 0.65, 0.36, 1] }}
          className="absolute inset-x-0 top-16 border-b border-border bg-white/95 shadow-elev backdrop-blur lg:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-4" aria-label={t('menuAriaLabel')}>
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-bold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl border-t border-border px-3 pb-2 pt-4 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('login')}
            </Link>
            <div className="px-3 pb-1 pt-3">
              <LanguageSwitcher />
            </div>
          </nav>
        </motion.div>
      )}
    </div>
  );
}
