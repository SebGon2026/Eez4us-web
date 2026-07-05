import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { LanguageSwitcher } from '@/components/language-switcher';

interface LegalPageShellProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export async function LegalPageShell({ title, updatedAt, children }: LegalPageShellProps) {
  const t = await getTranslations('legal.shell');

  return (
    <main className="legal-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 border-b bg-card/80 backdrop-blur">
        <Link href="/login" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Eez4us"
            width={110}
            height={55}
            className="h-auto w-[110px]"
          />
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {t('backToLogin')}
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="rounded-2xl bg-card p-10 shadow-card border">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Eez4us
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('lastUpdated', { date: updatedAt })}
          </p>
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/85 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:font-semibold hover:[&_a]:underline">
            {children}
          </div>
        </div>
      </article>

      <footer className="flex items-center justify-between gap-4 px-6 pb-6 pt-2 text-xs">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Link href="/privacy" className="font-medium hover:text-foreground hover:underline">
            {t('privacy')}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="font-medium hover:text-foreground hover:underline">
            {t('terms')}
          </Link>
        </div>
        <Image
          src="/logo.png"
          alt="Eez4us"
          width={70}
          height={32}
          className="h-auto w-[70px] opacity-70"
        />
      </footer>
    </main>
  );
}
