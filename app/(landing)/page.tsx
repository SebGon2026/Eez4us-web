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

import { ContactForm } from '@/components/landing/contact-form';
import { CopyrightYear } from '@/components/landing/copyright-year';
import { Faq } from '@/components/landing/faq';
import { HeroMock } from '@/components/landing/hero-mock';
import { MobileMenu } from '@/components/landing/mobile-menu';
import { Reveal } from '@/components/landing/reveal';
import { ScrollProgress } from '@/components/landing/scroll-progress';
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_E164, CONTACT_WHATSAPP_URL } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Eez4us — La salida del colegio, en orden',
  description:
    'Plataforma de coordinación de recogida vehicular en zonas escolares: ETA en tiempo real para el portón, entrega verificada con QR y registro de cada recogida. Para colegios de México, Estados Unidos y Latinoamérica desde $99 MXN o $6.99 USD por alumno al mes.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Eez4us — La salida del colegio, en orden',
    description:
      'Coordinación de recogida vehicular en zonas escolares: ETA en tiempo real, entrega verificada con QR y registro de cada recogida. México, Estados Unidos y Latinoamérica.',
    images: ['/logo.png'],
  },
};

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#producto', label: 'Producto' },
  { href: '#precios', label: 'Precios' },
  { href: '#seguridad', label: 'Seguridad' },
  { href: '#preguntas', label: 'Preguntas' },
  { href: '#contacto', label: 'Contacto' },
];

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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
      <BrandDots />
      {children}
    </p>
  );
}

const MARQUEE_ITEMS = [
  'Menos fila vehicular',
  'ETA en tiempo real',
  'Entrega verificada con QR',
  'Tarjetas QR imprimibles',
  'Círculo de confianza',
  'Roster por cercanía',
  'Reportes para dirección',
  'México',
  'Estados Unidos',
  'Latinoamérica',
];

const MARQUEE_DOTS = [
  'bg-[hsl(var(--brand-green))]',
  'bg-[hsl(var(--brand-yellow))]',
  'bg-[hsl(var(--brand-blue))]',
  'bg-[hsl(var(--brand-pink))]',
  'bg-[hsl(var(--brand-orange))]',
];

function Marquee() {
  return (
    <div className="overflow-hidden border-y border-border bg-background py-4">
      <div className="animate-marquee flex w-max items-center">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex items-center gap-8 pr-8 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"
          >
            {MARQUEE_ITEMS.map((item, i) => (
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

const STEPS = [
  {
    n: '1',
    chip: 'bg-[hsl(var(--brand-green)/0.14)] text-[hsl(104_45%_32%)]',
    title: 'La familia avisa que va en camino',
    body: 'Un toque en la app y el trayecto se comparte con el colegio. La ubicación se usa solo durante el viaje.',
  },
  {
    n: '2',
    chip: 'bg-[hsl(var(--brand-orange)/0.14)] text-[hsl(28_85%_36%)]',
    title: 'El colegio lo ve venir',
    body: 'El personal del portón ve los vehículos ordenados por llegada, con hora estimada y semáforo de cercanía.',
  },
  {
    n: '3',
    chip: 'bg-[hsl(var(--brand-blue)/0.14)] text-[hsl(211_80%_38%)]',
    title: 'El alumno espera adentro',
    body: 'Se llama a cada alumno justo a tiempo: nada de esperar en la acera ni de bloquear la calle.',
  },
  {
    n: '4',
    chip: 'bg-[hsl(var(--brand-pink)/0.14)] text-[hsl(326_70%_40%)]',
    title: 'Entrega verificada con QR',
    body: 'Quien recoge presenta la tarjeta QR del alumno; el personal la escanea y la entrega queda registrada.',
  },
];

const ROLES = [
  {
    icon: Smartphone,
    chip: 'bg-[hsl(var(--brand-blue)/0.12)] text-[hsl(211_80%_40%)]',
    title: 'Para las familias',
    sub: 'Una app simple, pensada para el apuro de todos los días.',
    items: [
      'Botón «Voy en camino» y aviso automático al llegar a la zona escolar',
      'Tarjeta QR fija por alumno: la presenta la abuela o el tío autorizado, sin instalar nada',
      'Círculo de confianza y autorizaciones temporales por día',
      'Sin costo para las familias: el servicio lo contrata el colegio',
    ],
  },
  {
    icon: ScanLine,
    chip: 'bg-[hsl(var(--brand-green)/0.12)] text-[hsl(104_45%_32%)]',
    title: 'Para el portón',
    sub: 'El personal de logística deja de adivinar quién viene llegando.',
    items: [
      'Lista en tiempo real ordenada por hora estimada de llegada',
      'Semáforo de cercanía para llamar a cada alumno justo a tiempo',
      'Escáner de QR integrado para confirmar cada entrega',
      'Funciona aunque la familia llegue sin avisar: se escanea la tarjeta igual',
    ],
  },
  {
    icon: BarChart3,
    chip: 'bg-[hsl(var(--brand-purple)/0.12)] text-[hsl(280_55%_42%)]',
    title: 'Para la dirección',
    sub: 'Un panel web con la operación completa bajo control.',
    items: [
      'Mapa en vivo de la zona escolar y tablero de llegadas',
      'Alta de alumnos por Excel e invitaciones automáticas a las familias',
      'Reportes operativos y financieros por periodo',
      'Mensajes y avisos a todas las familias desde un solo lugar',
    ],
  },
];

const PLAN_FEATURES = [
  'App para las familias, sin límite de usuarios',
  'Panel web para dirección y tablero del portón',
  'Tarjetas QR por alumno, imprimibles',
  'Invitaciones automáticas por email',
  'Reportes operativos y financieros',
  'Soporte en español',
];

const PLANS = [
  {
    country: 'México',
    price: '$99',
    currency: 'MXN',
    payment: 'Suscripción mensual con tarjeta de crédito o débito vía Openpay (BBVA).',
    highlight: true,
  },
  {
    country: 'Estados Unidos',
    price: '$6.99',
    currency: 'USD',
    payment: 'Suscripción mensual con tarjeta de crédito o débito vía Stripe.',
    highlight: false,
  },
];

const BUY_STEPS = [
  {
    icon: MessagesSquare,
    chip: 'bg-[hsl(var(--brand-blue)/0.12)] text-[hsl(211_80%_40%)]',
    title: '1. Escríbenos',
    body: 'Cuéntanos de tu colegio y damos de alta tu cuenta con tu código de institución.',
  },
  {
    icon: FileSpreadsheet,
    chip: 'bg-[hsl(var(--brand-green)/0.12)] text-[hsl(104_45%_32%)]',
    title: '2. Configura y carga tu lista de alumnos',
    body: 'Marca tus puntos de recogida en el mapa y sube tus alumnos por Excel. Las familias reciben su invitación al instante.',
  },
  {
    icon: CreditCard,
    chip: 'bg-[hsl(var(--brand-pink)/0.12)] text-[hsl(326_70%_40%)]',
    title: '3. Activa tu suscripción',
    body: 'Pago mensual con tarjeta desde el panel: Openpay en México, Stripe en Estados Unidos. Cancelas cuando quieras.',
  },
];

const SECURITY_ITEMS = [
  {
    icon: UserCheck,
    title: 'Solo por invitación',
    body: 'No existe el registro abierto: cada cuenta de familia la emite el colegio con su lista de alumnos.',
  },
  {
    icon: QrCode,
    title: 'La tarjeta QR no manda',
    body: 'El código no lleva autoridad propia: el sistema valida en el momento quién está autorizado a recoger hoy.',
  },
  {
    icon: ShieldCheck,
    title: 'Una persona confirma siempre',
    body: 'Ninguna entrega se cierra sola. La confirma el personal del portón, escaneo en mano.',
  },
  {
    icon: MapPin,
    title: 'Ubicación solo durante el viaje',
    body: 'La app comparte posición únicamente durante el trayecto activo y se detiene al llegar. Nunca en segundo plano permanente.',
  },
  {
    icon: Lock,
    title: 'Datos aislados por colegio',
    body: 'Cada institución opera en su propio espacio y la información en tiempo real viaja cifrada.',
  },
  {
    icon: Users,
    title: 'Todo queda registrado',
    body: 'Quién recogió a cada alumno, a qué hora y quién lo confirmó: trazabilidad completa de cada salida.',
  },
];

const FAQS = [
  {
    q: '¿Cuánto cuesta?',
    a: 'En México, $99 MXN por alumno al mes. En Estados Unidos, $6.99 USD por alumno al mes. Se factura al colegio por alumno activo; las familias nunca pagan a Eez4us.',
  },
  {
    q: '¿Cómo se paga?',
    a: 'Como suscripción mensual con tarjeta de crédito o débito desde el panel del colegio: en México los pagos los procesa Openpay (BBVA) y en Estados Unidos, Stripe. Puedes cancelar cuando quieras.',
  },
  {
    q: '¿La abuela necesita instalar la app?',
    a: 'No. Cada alumno tiene una tarjeta QR fija que el padre puede imprimir o compartir. Quien esté autorizado la presenta en el portón y el sistema valida la autorización al instante.',
  },
  {
    q: '¿Qué pasa si una familia llega sin avisar?',
    a: 'El portón escanea la tarjeta igual: el sistema verifica la autorización del momento y registra la entrega, con o sin viaje iniciado desde la app.',
  },
  {
    q: '¿La app rastrea a los padres todo el día?',
    a: 'No. La ubicación se comparte solo mientras hay un trayecto activo hacia el colegio y se detiene al llegar. En iOS el permiso es «solo al usar la app».',
  },
  {
    q: '¿Qué necesita el colegio para arrancar?',
    a: 'Una lista de alumnos y contactos en Excel. Eez4us genera las invitaciones para las familias y el colegio queda operando en días, no meses.',
  },
  {
    q: '¿Dónde está disponible?',
    a: 'En México y Estados Unidos, y estamos habilitando el resto de Latinoamérica. Si tu colegio está en otro país, escríbenos y coordinamos la implementación.',
  },
];

export default function LandingPage() {
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

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
            {NAV_LINKS.map((link) => (
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
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Iniciar sesión
            </Link>
            <a
              href="#contacto"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-elev transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
            >
              Empezar ahora
            </a>
            <MobileMenu links={NAV_LINKS} />
          </div>
        </div>
        <ScrollProgress />
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center md:pt-24">
          <Reveal y={16}>
            <Eyebrow>Recogida escolar coordinada</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              La hora de salida del colegio, por fin en orden
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Eez4us conecta a las familias con el personal del portón: el colegio ve cada vehículo
              en camino con su hora estimada de llegada y entrega a cada alumno con verificación por
              QR. Menos fila, menos espera, cero confusiones.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#contacto"
                className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-elev transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
              >
                Empezar ahora
              </a>
              <a
                href="#precios"
                className="rounded-full border border-border bg-white px-7 py-3.5 text-sm font-bold text-foreground shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/25 active:translate-y-0"
              >
                Ver precios
              </a>
            </div>
            <p className="mt-5 text-xs font-semibold text-muted-foreground">
              Colegios de México, Estados Unidos y Latinoamérica · Sin costo para las familias
            </p>
          </Reveal>

          <HeroMock />
        </section>

        {/* ── Marquee ────────────────────────────────────────────── */}
        <Marquee />

        {/* ── Por qué ────────────────────────────────────────────── */}
        <section className="bg-background">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3 md:gap-6">
            {[
              {
                title: 'Menos fila vehicular',
                body: 'El alumno sale cuando su familia ya está por llegar, no antes. La calle deja de ser sala de espera.',
              },
              {
                title: 'Cero gritos y walkie-talkies',
                body: 'El portón ve el tablero ordenado por cercanía en tiempo real. Nadie corre a buscar a nadie.',
              },
              {
                title: 'Cada entrega, registrada',
                body: 'Quién recogió a cada alumno, a qué hora y quién lo confirmó. Respaldo para el colegio y para las familias.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <h2 className="text-lg font-extrabold tracking-tight">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Cómo funciona ──────────────────────────────────────── */}
        <section id="como-funciona" className="scroll-mt-24 border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow>Cómo funciona</Eyebrow>
                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                  Del «ya salgo» a la entrega verificada
                </h2>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
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
        <section id="producto" className="scroll-mt-24 border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow>Producto</Eyebrow>
                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                  Una sola plataforma, tres puestos de trabajo
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  La familia avisa desde la app, el portón opera con su tablero en vivo y la
                  dirección administra todo desde el panel web.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {ROLES.map((role, i) => (
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
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Importación por Excel
                </span>
                <span className="flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" /> Avisos automáticos
                </span>
                <span className="flex items-center gap-1.5">
                  <Printer className="h-3.5 w-3.5" /> Tarjetas QR imprimibles
                </span>
                <span className="flex items-center gap-1.5">
                  <MessagesSquare className="h-3.5 w-3.5" /> Mensajes a familias
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Círculo de confianza
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Precios ────────────────────────────────────────────── */}
        <section id="precios" className="scroll-mt-24 border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow>Precios</Eyebrow>
                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                  Un precio simple, por alumno
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  Se factura mensualmente al colegio por alumno activo. Todo incluido, sin
                  instalación ni costos ocultos. Las familias nunca pagan a Eez4us.
                </p>
              </div>
            </Reveal>

            <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
              {PLANS.map((plan, i) => (
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
                      por alumno / mes
                    </p>
                    <p className="mt-4 flex items-start gap-2 text-xs font-medium leading-relaxed text-muted-foreground">
                      <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {plan.payment}
                    </p>
                    <ul className="mt-6 flex-1 space-y-2.5 border-t border-border pt-6">
                      {PLAN_FEATURES.map((feature) => (
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
                      Empezar con mi colegio
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-background px-7 py-5">
                <p className="flex items-center gap-3 text-sm font-semibold text-foreground/85">
                  <Globe2 className="h-5 w-5 shrink-0 text-[hsl(211_80%_40%)]" />
                  ¿Tu colegio está en otro país de Latinoamérica? También llegamos.
                </p>
                <a href="#contacto" className="text-sm font-bold text-primary hover:underline">
                  Escríbenos y lo coordinamos
                </a>
              </div>
            </Reveal>

            <div className="mt-14">
              <Reveal>
                <h3 className="text-center text-xl font-extrabold tracking-tight md:text-2xl">
                  Así se contrata
                </h3>
              </Reveal>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {BUY_STEPS.map((step, i) => (
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
                  Pagos procesados por Openpay (BBVA) en México y Stripe en Estados Unidos ·
                  Facturación mensual por alumno activo · Cancelas cuando quieras
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Seguridad ──────────────────────────────────────────── */}
        <section id="seguridad" className="scroll-mt-24 border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow>Seguridad</Eyebrow>
                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                  Diseñado alrededor de una sola pregunta: ¿quién puede recoger a este alumno?
                </h2>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SECURITY_ITEMS.map((item, i) => (
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
        <section id="preguntas" className="scroll-mt-24 border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="text-center">
                <Eyebrow>Preguntas frecuentes</Eyebrow>
                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                  Lo que todo colegio nos pregunta
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-10">
                <Faq items={FAQS} />
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
                  Lleva Eez4us a tu colegio
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                  Desde $99 MXN o $6.99 USD por alumno al mes, todo incluido. Escríbenos y tu
                  colegio queda operando en días.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="#contacto"
                    className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-foreground shadow-elev transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Empezar ahora
                  </a>
                  <a
                    href={CONTACT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    Escribir por WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Contacto ───────────────────────────────────────────── */}
        <section id="contacto" className="scroll-mt-24 border-t border-border bg-background">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:gap-14 md:py-24">
            <Reveal>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <BrandDots />
                Contacto
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Hablemos</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                Cuéntanos de tu institución y te mostramos Eez4us funcionando. Sin compromiso y sin
                vueltas: una llamada, una demo en vivo y un plan para tu zona de recogida.
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
                    Llamadas y WhatsApp · Respondemos el mismo día hábil
                  </span>
                </span>
              </a>

              <ul className="mt-8 space-y-2.5">
                {[
                  'Demo en vivo de 20 minutos',
                  'Implementación en días: solo necesitas tu lista de alumnos en Excel',
                  '$99 MXN o $6.99 USD por alumno al mes, todo incluido',
                ].map((item) => (
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
                Coordinación de recogida vehicular en zonas escolares para colegios de México,
                Estados Unidos y Latinoamérica.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Producto
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold">
                {NAV_LINKS.slice(0, 5).map((link) => (
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
                Legal
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold">
                <li>
                  <Link
                    href="/terms"
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    Términos del servicio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    Política de privacidad
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Contacto
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
                    WhatsApp
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    Iniciar sesión
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
            <p>
              © <CopyrightYear /> Eez4us Technologies LLC · 30 N Gould St Ste N, Sheridan, WY 82801,
              EE. UU.
            </p>
            <p className="font-semibold">La salida del colegio, en orden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
