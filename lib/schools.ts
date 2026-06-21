import { auth } from './auth';
import { countryDefaults, normalizeCountry } from './country';
import { prisma } from './db';

const TRIAL_DAYS = 14;

export interface CreateSchoolArgs {
  name: string;
  internalCode: string;
  city?: string | null;
  country?: string | null;
  // overrides opcionales; si faltan se derivan del país (countryDefaults).
  currency?: string | null;
  timezone?: string | null;
  director: { name: string; email: string; password: string };
  actorId: string;
  // vendor que da de alta la escuela de prueba (self-service). Se auto-enrola.
  vendorId?: string | null;
}

// Errores de negocio que el caller mapea a HTTP.
export type CreateSchoolError = 'CODE_ALREADY_USED' | 'DIRECTOR_EMAIL_ALREADY_USED';

export class SchoolCreateError extends Error {
  code: CreateSchoolError;
  constructor(code: CreateSchoolError) {
    super(code);
    this.code = code;
  }
}

// Alta de escuela + director + suscripción trial. Centraliza el patrón (antes inline en
// /api/admin/schools) para reusarlo desde el alta self-service del vendor. Deriva moneda y
// timezone del país para que la escuela quede multi-país lista sin pasos extra.
export async function createSchoolWithDirector(args: CreateSchoolArgs) {
  const codeUpper = args.internalCode.toUpperCase();
  const exists = await prisma.school.findUnique({ where: { internalCode: codeUpper } });
  if (exists) throw new SchoolCreateError('CODE_ALREADY_USED');

  const emailExists = await prisma.user.findUnique({ where: { email: args.director.email } });
  if (emailExists) throw new SchoolCreateError('DIRECTOR_EMAIL_ALREADY_USED');

  const defaults = countryDefaults(args.country);
  const currency = args.currency || defaults?.currency || 'USD';
  const timezone = args.timezone || defaults?.timezone || 'America/Mexico_City';
  // Persistimos el ISO canónico (SV/MX/US/AR) cuando se reconoce, así el ruteo de cobro y
  // los reportes por país comparan contra ISO sin re-normalizar en cada call site.
  const country = normalizeCountry(args.country) ?? (args.country?.trim() || null);

  const school = await prisma.school.create({
    data: {
      name: args.name,
      internalCode: codeUpper,
      city: args.city || null,
      country,
      currency,
      timezone,
      ...(defaults?.locale ? { locale: defaults.locale } : {}),
    },
  });

  // signUpEmail (better-auth) no participa de una tx de Prisma. Si cualquier paso posterior
  // falla, compensamos borrando la School recién creada para no dejarla huérfana ni quemar el
  // internalCode (unique): así el director puede reintentar con el mismo código.
  try {
    await auth.api.signUpEmail({
      body: {
        email: args.director.email,
        password: args.director.password,
        name: args.director.name,
      },
    });
    await prisma.user.update({
      where: { email: args.director.email },
      data: { role: 'director', schoolId: school.id, emailVerified: true },
    });

    await prisma.subscription.create({
      data: {
        schoolId: school.id,
        status: 'TRIALING',
        pricePerStudent: 10,
        currency,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    if (args.vendorId) {
      await prisma.vendorSchool.upsert({
        where: { vendorId_schoolId: { vendorId: args.vendorId, schoolId: school.id } },
        create: { vendorId: args.vendorId, schoolId: school.id },
        update: {},
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: args.actorId,
        schoolId: school.id,
        action: 'CREATE',
        entity: 'School',
        entityId: school.id,
        metadata: {
          directorEmail: args.director.email,
          currency,
          timezone,
          ...(args.vendorId ? { vendorId: args.vendorId } : {}),
        },
      },
    });
  } catch (err) {
    // Compensación: borramos primero al director (si signUp alcanzó a crearlo) para soltar la
    // FK y liberar el email, y después la School (cascada de subscription/vendorSchool). Así un
    // reintento puede reusar el mismo internalCode y email.
    await prisma.user.deleteMany({ where: { email: args.director.email, schoolId: school.id } }).catch(() => {});
    await prisma.school.delete({ where: { id: school.id } }).catch(() => {});
    throw err;
  }

  return school;
}
