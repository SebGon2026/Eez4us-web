import {
  BarChart3,
  Bell,
  Car,
  Check,
  ChevronDown,
  Clock,
  FileSpreadsheet,
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
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_E164, CONTACT_WHATSAPP_URL } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Eez4us — La salida del colegio, en orden',
  description:
    'Plataforma de coordinación de recogida vehicular en zonas escolares: el colegio ve cada vehículo en camino con su hora estimada de llegada y entrega a cada alumno con verificación por QR. Para colegios de Estados Unidos y México.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Eez4us — La salida del colegio, en orden',
    description:
      'Coordinación de recogida vehicular en zonas escolares: ETA en tiempo real, entrega verificada con QR y registro de cada recogida.',
    images: ['/logo.png'],
  },
};

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#producto', label: 'Producto' },
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

const SECURITY_ITEMS = [
  {
    icon: UserCheck,
    title: 'Solo por invitación',
    body: 'No existe el registro abierto: cada cuenta de familia la emite el colegio con su nómina.',
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
    body: 'La app comparte posición únicamente con el trayecto activo y se detiene al llegar. Nunca en segundo plano permanente.',
  },
  {
    icon: Lock,
    title: 'Datos aislados por colegio',
    body: 'Cada institución opera en su propio espacio y la información en tiempo real viaja cifrada.',
  },
  {
    icon: Clock,
    title: 'Todo queda registrado',
    body: 'Quién recogió a cada alumno, a qué hora y quién lo confirmó: trazabilidad completa de cada salida.',
  },
];

const FAQS = [
  {
    q: '¿Cuánto cuesta?',
    a: 'Eez4us se contrata por institución, con un precio por alumno que se acuerda en el contrato comercial. Las familias nunca pagan a Eez4us.',
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
    a: 'Trabajamos con colegios de Estados Unidos y México.',
  },
];

function MockLabel({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {children}
    </p>
  );
}

function HeroMock() {
  return (
    <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-elev transition-transform hover:-translate-y-1">
        <MockLabel dot="bg-[hsl(var(--brand-blue))]">App de la familia</MockLabel>
        <div className="mt-4 rounded-2xl border border-border bg-background p-4">
          <p className="text-xs font-semibold text-muted-foreground">Hola, Ana</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">Mateo · 3.º A</p>
          <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-elev">
            <Car className="h-4 w-4" />
            Voy en camino
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--brand-green))]" />
              Compartiendo trayecto
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 font-bold text-foreground">
              ETA 6 min
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-elev transition-transform hover:-translate-y-1">
        <MockLabel dot="bg-[hsl(var(--brand-green))]">Portón del colegio</MockLabel>
        <ul className="mt-4 space-y-2">
          {[
            {
              dot: 'bg-[hsl(var(--brand-green))]',
              family: 'Familia Rodríguez',
              student: 'Sofía · 1.º B',
              eta: '2 min',
            },
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
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-elev transition-transform hover:-translate-y-1">
        <MockLabel dot="bg-[hsl(var(--brand-pink))]">Entrega verificada</MockLabel>
        <div className="mt-4 rounded-2xl border border-border bg-background p-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-white">
            <QrCode className="h-10 w-10 text-foreground" />
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">Sofía Rodríguez</p>
          <p className="text-[11px] font-medium text-muted-foreground">Tarjeta QR · 1.º B</p>
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--brand-green)/0.14)] px-3 py-1 text-[11px] font-bold text-[hsl(104_45%_30%)]">
            <Check className="h-3.5 w-3.5" />
            Entregada 14:32 · Miss Laura
          </p>
        </div>
      </div>
    </div>
  );
}

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

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
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
              Solicitar demo
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center md:pt-24">
          <Eyebrow>Recogida escolar coordinada</Eyebrow>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
            La hora de salida del colegio, por fin en orden
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Eez4us conecta a las familias con el personal del portón: el colegio ve cada vehículo en
            camino con su hora estimada de llegada y entrega a cada alumno con verificación por QR.
            Menos fila, menos espera, cero confusiones.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#contacto"
              className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-elev transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
            >
              Solicitar una demo
            </a>
            <a
              href="#como-funciona"
              className="rounded-full border border-border bg-white px-7 py-3.5 text-sm font-bold text-foreground shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/25 active:translate-y-0"
            >
              Ver cómo funciona
            </a>
          </div>
          <p className="mt-5 text-xs font-semibold text-muted-foreground">
            Para colegios de Estados Unidos y México · Sin costo para las familias
          </p>

          <HeroMock />
        </section>

        {/* ── Por qué ────────────────────────────────────────────── */}
        <section className="border-y border-border bg-background">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3 md:gap-6">
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
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-lg font-extrabold tracking-tight">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Cómo funciona ──────────────────────────────────────── */}
        <section id="como-funciona" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="text-center">
              <Eyebrow>Cómo funciona</Eyebrow>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                Del «ya salgo» a la entrega verificada
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <div
                  key={step.n}
                  className="rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elev"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black ${step.chip}`}
                  >
                    {step.n}
                  </span>
                  <h3 className="mt-4 text-base font-extrabold leading-snug">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Producto por rol ───────────────────────────────────── */}
        <section id="producto" className="scroll-mt-24 border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="text-center">
              <Eyebrow>Producto</Eyebrow>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                Una sola plataforma, tres puestos de trabajo
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                La familia avisa desde la app, el portón opera con su tablero en vivo y la dirección
                administra todo desde el panel web.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {ROLES.map((role) => (
                <div
                  key={role.title}
                  className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-elev"
                >
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
              ))}
            </div>

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
          </div>
        </section>

        {/* ── Seguridad ──────────────────────────────────────────── */}
        <section id="seguridad" className="scroll-mt-24 border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="text-center">
              <Eyebrow>Seguridad</Eyebrow>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                Diseñado alrededor de una sola pregunta: ¿quién puede recoger a este alumno?
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SECURITY_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-border bg-card p-6 shadow-card"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section id="preguntas" className="scroll-mt-24 border-t border-border bg-background">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <div className="text-center">
              <Eyebrow>Preguntas frecuentes</Eyebrow>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                Lo que todo colegio nos pregunta
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-card"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-foreground [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="rounded-[2.5rem] bg-foreground px-8 py-14 text-center shadow-pop md:py-16">
              <BrandDots className="justify-center" />
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight text-white md:text-4xl">
                Lleva Eez4us a tu colegio
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                Agenda una demo en vivo de 20 minutos y mira el tablero funcionando con tu propia
                zona de recogida.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#contacto"
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-foreground shadow-elev transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Solicitar una demo
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
          </div>
        </section>

        {/* ── Contacto ───────────────────────────────────────────── */}
        <section id="contacto" className="scroll-mt-24 border-t border-border bg-background">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:gap-14 md:py-24">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <BrandDots />
                Contacto
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Hablemos</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                Cuéntanos de tu institución y te mostramos Eez4us funcionando. Sin compromiso y sin
                vueltas: una llamada, una demo y un plan para tu zona de recogida.
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
                  'Implementación en días: solo necesitas tu nómina en Excel',
                  'Precio por alumno acordado con cada institución',
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
            </div>

            <ContactForm />
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
                Coordinación de recogida vehicular en zonas escolares para colegios de Estados
                Unidos y México.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Producto
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold">
                {NAV_LINKS.slice(0, 4).map((link) => (
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
              © {new Date().getFullYear()} Eez4us Technologies LLC · 30 N Gould St Ste N, Sheridan,
              WY 82801, EE. UU.
            </p>
            <p className="font-semibold">La salida del colegio, en orden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
