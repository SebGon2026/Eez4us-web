import {
  BarChart3,
  Bell,
  Check,
  CreditCard,
  FileSpreadsheet,
  Globe2,
  Lock,
  MapPin,
  MessagesSquare,
  Phone,
  Printer,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { ContactForm } from '@/components/landing/contact-form';
import { CopyrightYear } from '@/components/landing/copyright-year';
import { Faq } from '@/components/landing/faq';
import { HeroMock } from '@/components/landing/hero-mock';
import { MobileMenu } from '@/components/landing/mobile-menu';
import { Reveal } from '@/components/landing/reveal';
import { ScrollProgress } from '@/components/landing/scroll-progress';
import { LanguageSwitcher } from '@/components/language-switcher';
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_E164, CONTACT_WHATSAPP_URL } from '@/lib/contact';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    robots: { index: true, follow: true },
    openGraph: {
      title: t('meta.ogTitle'),
      description: t('meta.ogDescription'),
      images: ['/logo.png'],
    },
  };
}

const NAV_ANCHORS = [
  { href: '#como-funciona', key: 'howItWorks' },
  { href: '#producto', key: 'product' },
  { href: '#precios', key: 'pricing' },
  { href: '#seguridad', key: 'security' },
  { href: '#preguntas', key: 'faq' },
  { href: '#contacto', key: 'contact' },
] as const;

function BrandDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-hidden>
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-green))]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-yellow))]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-blue))]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-pink))]" />
    </span>
  );
}

// Cada sección se identifica con su propio color de cabecera (pedido de Cesar 2026-07-03):
// texto en tono de marca + punto del mismo color. El hero conserva los 4 puntos multicolor.
const EYEBROW_TONE = {
  brand: 'text-muted-foreground',
  blue: 'text-[hsl(211_72%_42%)]',
  green: 'text-[hsl(104_45%_30%)]',
  amber: 'text-[hsl(30_82%_34%)]',
  purple: 'text-[hsl(280_52%_46%)]',
  pink: 'text-[hsl(326_58%_46%)]',
} as const;

const EYEBROW_DOT = {
  blue: 'bg-[hsl(var(--brand-blue))]',
  green: 'bg-[hsl(var(--brand-green))]',
  amber: 'bg-[hsl(var(--brand-orange))]',
  purple: 'bg-[hsl(var(--brand-purple))]',
  pink: 'bg-[hsl(var(--brand-pink))]',
} as const;

type EyebrowTone = keyof typeof EYEBROW_TONE;

function Eyebrow({ children, tone = 'brand' }: { children: React.ReactNode; tone?: EyebrowTone }) {
  return (
    <p
      className={`flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] ${EYEBROW_TONE[tone]}`}
    >
      {tone === 'brand' ? (
        <BrandDots />
      ) : (
        <span className={`h-2 w-2 rounded-full ${EYEBROW_DOT[tone]}`} aria-hidden />
      )}
      {children}
    </p>
  );
}

const MARQUEE_KEYS = [
  'lessCarLine',
  'realTimeEta',
  'qrVerifiedDelivery',
  'printableQrCards',
  'trustCircle',
  'proximityRoster',
  'reportsForAdmins',
  'mexico',
  'usa',
  'latam',
] as const;

const MARQUEE_DOTS = [
  'bg-[hsl(var(--brand-green))]',
  'bg-[hsl(var(--brand-yellow))]',
  'bg-[hsl(var(--brand-blue))]',
  'bg-[hsl(var(--brand-pink))]',
  'bg-[hsl(var(--brand-orange))]',
];

function Marquee({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden border-y border-border bg-background py-4">
      <div className="animate-marquee flex w-max items-center">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex items-center gap-8 pr-8 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"
          >
            {items.map((item, i) => (
              <span key={item} className="flex items-center gap-8">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${MARQUEE_DOTS[i % MARQUEE_DOTS.length]}`}
                  aria-hidden
                />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const STEP_CHIPS = [
  'bg-[hsl(var(--brand-green)/0.14)] text-[hsl(104_45%_32%)]',
  'bg-[hsl(var(--brand-orange)/0.14)] text-[hsl(28_85%_36%)]',
  'bg-[hsl(var(--brand-blue)/0.14)] text-[hsl(211_80%_38%)]',
  'bg-[hsl(var(--brand-pink)/0.14)] text-[hsl(326_70%_40%)]',
];

const ROLE_STYLES = [
  {
    key: 'families',
    icon: Smartphone,
    chip: 'bg-[hsl(var(--brand-blue)/0.12)] text-[hsl(211_80%_40%)]',
  },
  {
    key: 'gate',
    icon: ScanLine,
    chip: 'bg-[hsl(var(--brand-green)/0.12)] text-[hsl(104_45%_32%)]',
  },
  {
    key: 'admin',
    icon: BarChart3,
    chip: 'bg-[hsl(var(--brand-purple)/0.12)] text-[hsl(280_55%_42%)]',
  },
] as const;

const BUY_STEP_STYLES = [
  {
    icon: MessagesSquare,
    chip: 'bg-[hsl(var(--brand-blue)/0.12)] text-[hsl(211_80%_40%)]',
  },
  {
    icon: FileSpreadsheet,
    chip: 'bg-[hsl(var(--brand-green)/0.12)] text-[hsl(104_45%_32%)]',
  },
  {
    icon: CreditCard,
    chip: 'bg-[hsl(var(--brand-pink)/0.12)] text-[hsl(326_70%_40%)]',
  },
];

const SECURITY_ICONS = [UserCheck, QrCode, ShieldCheck, MapPin, Lock, Users];

export default async function LandingPage() {
  const t = await getTranslations('landing');
  const tCommon = await getTranslations('common');

  const navLinks = NAV_ANCHORS.map((link) => ({
    href: link.href,
    label: t(`nav.${link.key}`),
  }));

  const marqueeItems = MARQUEE_KEYS.map((key) => t(`marquee.${key}`));

  const steps = STEP_CHIPS.map((chip, i) => ({
    n: String(i + 1),
    chip,
    title: t(`howItWorks.step${i + 1}Title`),
    body: t(`howItWorks.step${i + 1}Body`),
  }));

  const roles = ROLE_STYLES.map((role) => ({
    icon: role.icon,
    chip: role.chip,
    title: t(`product.${role.key}.title`),
    sub: t(`product.${role.key}.sub`),
    items: [1, 2, 3, 4].map((n) => t(`product.${role.key}.item${n}`)),
  }));

  const planFeatures = [1, 2, 3, 4, 5, 6].map((n) => t(`pricing.feature${n}`));

  const plans = [
    {
      country: t('pricing.mexico'),
      price: '$99',
      currency: 'MXN',
      payment: t('pricing.paymentMx'),
      highlight: true,
    },
    {
      country: t('pricing.usa'),
      price: '$6.99',
      currency: 'USD',
      payment: t('pricing.paymentUs'),
      highlight: false,
    },
  ];

  const buySteps = BUY_STEP_STYLES.map((step, i) => ({
    icon: step.icon,
    chip: step.chip,
    title: t(`pricing.buyStep${i + 1}Title`),
    body: t(`pricing.buyStep${i + 1}Body`),
  }));

  const securityItems = SECURITY_ICONS.map((icon, i) => ({
    icon,
    title: t(`security.item${i + 1}Title`),
    body: t(`security.item${i + 1}Body`),
  }));

  const faqs = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`),
  }));

  const whyItems = [1, 2, 3].map((n) => ({
    title: t(`why.item${n}Title`),
    body: t(`why.item${n}Body`),
  }));

  const productChips = [
    { icon: FileSpreadsheet, label: t('product.chips.excelImport') },
    { icon: Bell, label: t('product.chips.autoNotices') },
    { icon: Printer, label: t('product.chips.printableQr') },
    { icon: MessagesSquare, label: t('product.chips.familyMessages') },
    { icon: Users, label: t('product.chips.trustCircle') },
  ];

  const contactBullets = [t('contact.bullet1'), t('contact.bullet2'), t('contact.bullet3')];

  return (
    <div className="bg-white text-foreground">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Eez4us"
              width={110}
              height={52}
              priority
              className="h-auto w-[96px] md:w-[110px]"
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label={t('nav.mainAriaLabel')}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden lg:inline-flex" />
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t('nav.login')}
            </Link>
            <a
              href="#contacto"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-elev transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
            >
              {t('nav.ctaStart')}
            </a>
            <MobileMenu links={navLinks} />
          </div>
        </div>
        <ScrollProgress />
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center md:pt-24">
          <Reveal y={16}>
            <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              {t('hero.title')}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {t('hero.subtitle')}
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#contacto"
                className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-elev transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
              >
                {t('nav.ctaStart')}
              </a>
              <a
                href="#precios"
                className="rounded-full border border-border bg-white px-7 py-3.5 text-sm font-bold text-foreground shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/25 active:translate-y-0"
              >
                {t('hero.ctaPricing')}
              </a>
            </div>
            <p className="mt-5 text-xs font-semibold text-muted-foreground">
              {t('hero.footnote')}
            </p>
          </Reveal>

          <HeroMock />
        </section>

        {/* ── Marquee ────────────────────────────────────────────── */}
        <Marquee items={marqueeItems} />

        {/* ── Por qué ────────────────────────────────────────────── */}
        <section className="bg-background">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3 md:gap-6">
            {whyItems.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <h2 className="text-lg font-extrabold tracking-tight">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Cómo funciona ──────────────────────────────────────── */}
        <section
          id="como-funciona"
          className="scroll-mt-24 border-t border-border bg-[hsl(211_100%_56%/0.045)]"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow tone="blue">{t('howItWorks.eyebrow')}</Eyebrow>
                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                  {t('howItWorks.title')}
                </h2>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <Reveal key={step.n} delay={i * 0.09} className="h-full">
                  <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elev">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black ${step.chip}`}
                    >
                      {step.n}
                    </span>
                    <h3 className="mt-4 text-base font-extrabold leading-snug">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Producto por rol ───────────────────────────────────── */}
        <section
          id="producto"
          className="scroll-mt-24 border-t border-border bg-[hsl(104_75%_51%/0.05)]"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow tone="green">{t('product.eyebrow')}</Eyebrow>
                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                  {t('product.title')}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {t('product.subtitle')}
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {roles.map((role, i) => (
                <Reveal key={role.title} delay={i * 0.1} className="h-full">
                  <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elev">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${role.chip}`}
                    >
                      <role.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-xl font-extrabold tracking-tight">{role.title}</h3>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{role.sub}</p>
                    <ul className="mt-5 space-y-3">
                      {role.items.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-foreground/85">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.15}>
              <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-muted-foreground">
                {productChips.map((chip) => (
                  <span key={chip.label} className="flex items-center gap-1.5">
                    <chip.icon className="h-3.5 w-3.5" /> {chip.label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Precios ────────────────────────────────────────────── */}
        <section
          id="precios"
          className="scroll-mt-24 border-t border-border bg-[hsl(38_100%_55%/0.055)]"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow tone="amber">{t('pricing.eyebrow')}</Eyebrow>
                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                  {t('pricing.title')}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {t('pricing.subtitle')}
                </p>
              </div>
            </Reveal>

            <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
              {plans.map((plan, i) => (
                <Reveal key={plan.country} delay={i * 0.12} className="h-full">
                  <div
                    className={`relative flex h-full flex-col rounded-3xl border bg-card p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-pop ${
                      plan.highlight
                        ? 'border-primary/60 shadow-elev ring-1 ring-primary/30'
                        : 'border-border shadow-card'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {plan.country}
                    </p>
                    <p className="mt-4 flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                      <span className="text-lg font-extrabold text-muted-foreground">
                        {plan.currency}
                      </span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {tCommon('misc.perStudentPerMonth')}
                    </p>
                    <p className="mt-4 flex items-start gap-2 text-xs font-medium leading-relaxed text-muted-foreground">
                      <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {plan.payment}
                    </p>
                    <ul className="mt-6 flex-1 space-y-2.5 border-t border-border pt-6">
                      {planFeatures.map((feature) => (
                        <li key={feature} className="flex gap-2.5 text-sm leading-relaxed">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-foreground/85">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#contacto"
                      className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold shadow-card transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                        plan.highlight
                          ? 'bg-primary text-primary-foreground shadow-elev hover:opacity-95'
                          : 'border border-border bg-white text-foreground hover:border-foreground/25'
                      }`}
                    >
                      {t('pricing.ctaPlan')}
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-background px-7 py-5">
                <p className="flex items-center gap-3 text-sm font-semibold text-foreground/85">
                  <Globe2 className="h-5 w-5 shrink-0 text-[hsl(211_80%_40%)]" />
                  {t('pricing.latamBanner')}
                </p>
                <a href="#contacto" className="text-sm font-bold text-primary hover:underline">
                  {t('pricing.latamCta')}
                </a>
              </div>
            </Reveal>

            <div className="mt-14">
              <Reveal>
                <h3 className="text-center text-xl font-extrabold tracking-tight md:text-2xl">
                  {t('pricing.howToBuyTitle')}
                </h3>
              </Reveal>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {buySteps.map((step, i) => (
                  <Reveal key={step.title} delay={i * 0.1} className="h-full">
                    <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elev">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${step.chip}`}
                      >
                        <step.icon className="h-5 w-5" />
                      </span>
                      <h4 className="mt-4 text-base font-extrabold">{step.title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.12}>
                <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
                  {t('pricing.footnote')}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Seguridad ──────────────────────────────────────────── */}
        <section
          id="seguridad"
          className="scroll-mt-24 border-t border-border bg-[hsl(280_70%_53%/0.045)]"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow tone="purple">{t('security.eyebrow')}</Eyebrow>
                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                  {t('security.title')}
                </h2>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {securityItems.map((item, i) => (
                <Reveal key={item.title} delay={(i % 3) * 0.09} className="h-full">
                  <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elev">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section
          id="preguntas"
          className="scroll-mt-24 border-t border-border bg-[hsl(326_90%_60%/0.038)]"
        >
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow tone="pink">{t('faq.eyebrow')}</Eyebrow>
                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                  {t('faq.title')}
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-10">
                <Faq items={faqs} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <div className="rounded-[2.5rem] bg-foreground px-8 py-14 text-center shadow-pop md:py-16">
                <BrandDots className="justify-center" />
                <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight text-white md:text-4xl">
                  {t('cta.title')}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                  {t('cta.body')}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="#contacto"
                    className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-foreground shadow-elev transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {t('nav.ctaStart')}
                  </a>
                  <a
                    href={CONTACT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    {t('cta.whatsapp')}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Contacto ───────────────────────────────────────────── */}
        <section
          id="contacto"
          className="scroll-mt-24 border-t border-border bg-[hsl(104_75%_51%/0.045)]"
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:gap-14 md:py-24">
            <Reveal>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <BrandDots />
                {t('contact.eyebrow')}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                {t('contact.title')}
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                {t('contact.body')}
              </p>

              <a
                href={`tel:${CONTACT_PHONE_E164}`}
                className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elev"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Phone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-lg font-black tracking-tight text-foreground">
                    {CONTACT_PHONE_DISPLAY}
                  </span>
                  <span className="block text-xs font-semibold text-muted-foreground">
                    {t('contact.phoneNote')}
                  </span>
                </span>
              </a>

              <ul className="mt-8 space-y-2.5">
                {contactBullets.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-sm font-medium text-foreground/85"
                  >
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.12}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Image
                src="/logo.png"
                alt="Eez4us"
                width={110}
                height={52}
                className="h-auto w-[110px]"
              />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t('footer.blurb')}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t('footer.productHeading')}
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold">
                {navLinks.slice(0, 5).map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t('footer.legalHeading')}
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold">
                <li>
                  <Link
                    href="/terms"
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {t('footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {t('footer.privacy')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t('footer.contactHeading')}
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold">
                <li>
                  <a
                    href={`tel:${CONTACT_PHONE_E164}`}
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {t('footer.whatsapp')}
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {t('footer.login')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
            <p>
              © <CopyrightYear /> {t('footer.company')}
            </p>
            <p className="font-semibold">{t('footer.motto')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
