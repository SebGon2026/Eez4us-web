import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// =========================================================================
// SEED REALISTA: ~600 alumnos por colegio, ~200 padres, ~30 viajes activos
// con horarios de salida escalonados estilo colegio argentino real.
// =========================================================================

const FIRST_NAMES_M = [
  'Mateo', 'Benjamín', 'Tomás', 'Joaquín', 'Bautista', 'Lautaro', 'Felipe', 'Tiziano',
  'Valentino', 'Lorenzo', 'Santiago', 'Bruno', 'Ignacio', 'Lucas', 'Nicolás', 'Mauro',
  'Franco', 'Ramiro', 'Agustín', 'Gael', 'Dante', 'Maxi', 'Emilio', 'Iván', 'Diego',
  'Julián', 'Marcos', 'Andrés', 'Facundo', 'Gonzalo', 'Damián', 'Hernán', 'Pedro',
];

const FIRST_NAMES_F = [
  'Lucía', 'Emma', 'Sofía', 'Camila', 'Mía', 'Valentina', 'Olivia', 'Catalina',
  'Renata', 'Isabella', 'Martina', 'Mora', 'Julieta', 'Antonia', 'Delfina', 'Pilar',
  'Lola', 'Bianca', 'Helena', 'Constanza', 'Agustina', 'Florencia', 'Carolina',
  'Victoria', 'Manuela', 'Ámbar', 'Paula', 'Luna', 'Abril', 'Rocío', 'Lara', 'Ana',
];

const LAST_NAMES = [
  'García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez',
  'Pérez', 'Gómez', 'Romero', 'Suárez', 'Díaz', 'Álvarez', 'Torres', 'Ruiz',
  'Ramírez', 'Flores', 'Castro', 'Acosta', 'Vega', 'Méndez', 'Molina', 'Vidal',
  'Ortiz', 'Silva', 'Núñez', 'Rojas', 'Herrera', 'Aguirre', 'Medina', 'Castillo',
  'Reyes', 'Iglesias', 'Cabrera', 'Moreno', 'Cruz', 'Carrizo', 'Soto', 'Paz',
  'Benítez', 'Quiroga', 'Figueroa', 'Sosa', 'Ledesma', 'Ojeda', 'Lopez', 'Maldonado',
];

const VEHICLE_MODELS = [
  ['Toyota Corolla', 'Sedán'],
  ['Volkswagen Vento', 'Sedán'],
  ['Volkswagen Gol', 'Compacto'],
  ['Ford EcoSport', 'SUV'],
  ['Ford Ranger', 'Pickup'],
  ['Renault Sandero', 'Compacto'],
  ['Renault Duster', 'SUV'],
  ['Chevrolet Onix', 'Compacto'],
  ['Chevrolet Tracker', 'SUV'],
  ['Peugeot 208', 'Compacto'],
  ['Peugeot 2008', 'SUV'],
  ['Citroën C3', 'Compacto'],
  ['Honda HR-V', 'SUV'],
  ['Nissan Versa', 'Sedán'],
  ['Fiat Cronos', 'Sedán'],
  ['Jeep Renegade', 'SUV'],
  ['Toyota Hilux', 'Pickup'],
];

const VEHICLE_COLORS = [
  'Blanco', 'Gris plata', 'Gris', 'Negro', 'Rojo', 'Azul', 'Azul marino',
  'Bordó', 'Beige', 'Verde oliva',
];

const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

interface DemoSchool {
  internalCode: string;
  name: string;
  addressText: string;
  addressLat: number;
  addressLng: number;
  brandHue: number;
  director: { email: string; password: string; name: string };
  staff: Array<{ email: string; password: string; name: string }>;
  parentsCount: number;
  studentsPerLevelTarget: { INICIAL: number; PRIMARIA: number; SECUNDARIA: number };
}

const SUPER_ADMIN = {
  email: 'admin@eez4us.com',
  password: 'admin1234',
  name: 'Equipo Eez4us',
};

const SCHOOLS: DemoSchool[] = [
  {
    internalCode: 'STPATRICK',
    name: 'Saint Patrick School',
    addressText: 'Av. Libertador 4582, CABA',
    addressLat: -34.5689,
    addressLng: -58.4435,
    brandHue: 142,
    director: {
      email: 'maria.gonzalez@stpatrick.edu.ar',
      password: 'eez4us2026',
      name: 'María González',
    },
    staff: [
      { email: 'auxiliar@stpatrick.edu.ar', password: 'eez4us2026', name: 'Pablo Rivera' },
      { email: 'preceptora@stpatrick.edu.ar', password: 'eez4us2026', name: 'Laura Méndez' },
    ],
    parentsCount: 220,
    studentsPerLevelTarget: { INICIAL: 120, PRIMARIA: 320, SECUNDARIA: 180 },
  },
  {
    internalCode: 'COLBELGRANO',
    name: 'Instituto Belgrano',
    addressText: 'Cabildo 2380, CABA',
    addressLat: -34.5602,
    addressLng: -58.4561,
    brandHue: 211,
    director: {
      email: 'jorge.alvarez@belgrano.edu.ar',
      password: 'eez4us2026',
      name: 'Jorge Álvarez',
    },
    staff: [
      { email: 'soporte@belgrano.edu.ar', password: 'eez4us2026', name: 'Lucía Romero' },
    ],
    parentsCount: 140,
    studentsPerLevelTarget: { INICIAL: 80, PRIMARIA: 220, SECUNDARIA: 100 },
  },
  {
    internalCode: 'SANJOSE',
    name: 'Colegio San José',
    addressText: 'Av. Rivadavia 7890, CABA',
    addressLat: -34.6293,
    addressLng: -58.4711,
    brandHue: 354,
    director: {
      email: 'patricia.gomez@sanjose.edu.ar',
      password: 'eez4us2026',
      name: 'Patricia Gómez',
    },
    staff: [
      { email: 'preceptor@sanjose.edu.ar', password: 'eez4us2026', name: 'Diego Castillo' },
    ],
    parentsCount: 90,
    studentsPerLevelTarget: { INICIAL: 60, PRIMARIA: 150, SECUNDARIA: 70 },
  },
];

// Estructura de grados por nivel con horarios de salida escalonados
const GRADE_TEMPLATE: Array<{ level: string; name: string; dismissal: string; sortOrder: number }> = [
  // Inicial — salida 12:00
  { level: 'INICIAL', name: 'Sala de 3 A', dismissal: '12:00', sortOrder: 1 },
  { level: 'INICIAL', name: 'Sala de 3 B', dismissal: '12:00', sortOrder: 2 },
  { level: 'INICIAL', name: 'Sala de 4 A', dismissal: '12:00', sortOrder: 3 },
  { level: 'INICIAL', name: 'Sala de 4 B', dismissal: '12:00', sortOrder: 4 },
  { level: 'INICIAL', name: 'Sala de 5 A', dismissal: '12:00', sortOrder: 5 },
  { level: 'INICIAL', name: 'Sala de 5 B', dismissal: '12:00', sortOrder: 6 },
  // Primaria — salida 12:30 (1°-3°) y 13:00 (4°-6°)
  { level: 'PRIMARIA', name: '1° A', dismissal: '12:30', sortOrder: 10 },
  { level: 'PRIMARIA', name: '1° B', dismissal: '12:30', sortOrder: 11 },
  { level: 'PRIMARIA', name: '2° A', dismissal: '12:30', sortOrder: 12 },
  { level: 'PRIMARIA', name: '2° B', dismissal: '12:30', sortOrder: 13 },
  { level: 'PRIMARIA', name: '3° A', dismissal: '12:30', sortOrder: 14 },
  { level: 'PRIMARIA', name: '3° B', dismissal: '12:30', sortOrder: 15 },
  { level: 'PRIMARIA', name: '4° A', dismissal: '13:00', sortOrder: 20 },
  { level: 'PRIMARIA', name: '4° B', dismissal: '13:00', sortOrder: 21 },
  { level: 'PRIMARIA', name: '5° A', dismissal: '13:00', sortOrder: 22 },
  { level: 'PRIMARIA', name: '5° B', dismissal: '13:00', sortOrder: 23 },
  { level: 'PRIMARIA', name: '6° A', dismissal: '13:00', sortOrder: 24 },
  { level: 'PRIMARIA', name: '6° B', dismissal: '13:00', sortOrder: 25 },
  // Secundaria — salida 17:00
  { level: 'SECUNDARIA', name: '1° Año A', dismissal: '17:00', sortOrder: 30 },
  { level: 'SECUNDARIA', name: '1° Año B', dismissal: '17:00', sortOrder: 31 },
  { level: 'SECUNDARIA', name: '2° Año A', dismissal: '17:00', sortOrder: 32 },
  { level: 'SECUNDARIA', name: '2° Año B', dismissal: '17:00', sortOrder: 33 },
  { level: 'SECUNDARIA', name: '3° Año A', dismissal: '17:00', sortOrder: 34 },
  { level: 'SECUNDARIA', name: '3° Año B', dismissal: '17:00', sortOrder: 35 },
  { level: 'SECUNDARIA', name: '4° Año A', dismissal: '17:30', sortOrder: 40 },
  { level: 'SECUNDARIA', name: '4° Año B', dismissal: '17:30', sortOrder: 41 },
  { level: 'SECUNDARIA', name: '5° Año A', dismissal: '17:30', sortOrder: 42 },
  { level: 'SECUNDARIA', name: '5° Año B', dismissal: '17:30', sortOrder: 43 },
];

const PICKUP_TEMPLATE = [
  { name: 'Puerta principal', offsetLat: 0, offsetLng: 0, radius: 120 },
  { name: 'Puerta lateral', offsetLat: 0.0008, offsetLng: -0.0007, radius: 80 },
  { name: 'Salida vehicular', offsetLat: -0.0006, offsetLng: 0.0008, radius: 100 },
];

// ============== Helpers ==============

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function randomPlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const L = () => letters[Math.floor(Math.random() * letters.length)];
  const D = () => Math.floor(Math.random() * 10);
  return `A${L()} ${D()}${D()}${D()} ${L()}${L()}`;
}

function randomPhone(): string {
  const tail = String(Math.floor(Math.random() * 90000000) + 10000000);
  return `+5411${tail.slice(0, 8)}`;
}

function logoUrlFor(name: string, hue: number): string {
  const palette =
    hue === 142 ? '2f9e44,40c057' : hue === 211 ? '1971c2,4dabf7' : hue === 354 ? 'c92a2a,fa5252' : '495057,868e96';
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${palette}&fontWeight=900`;
}

async function ensureUser(opts: {
  email: string;
  password: string;
  name: string;
  role: string;
  schoolId: string | null;
  phoneE164?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        role: opts.role,
        schoolId: opts.schoolId,
        name: opts.name,
        phoneE164: opts.phoneE164 ?? existing.phoneE164,
      },
    });
  }
  await auth.api.signUpEmail({
    body: { email: opts.email, password: opts.password, name: opts.name },
  });
  return prisma.user.update({
    where: { email: opts.email },
    data: {
      role: opts.role,
      schoolId: opts.schoolId,
      emailVerified: true,
      phoneE164: opts.phoneE164 ?? null,
    },
  });
}

async function clearSchool(schoolId: string) {
  // Borramos en orden de dependencia para evitar FK errors
  const trips = await prisma.trip.findMany({ where: { schoolId }, select: { id: true } });
  const tripIds = trips.map((t) => t.id);
  if (tripIds.length > 0) {
    await prisma.tripStudent.deleteMany({ where: { tripId: { in: tripIds } } });
    await prisma.tripEvent.deleteMany({ where: { tripId: { in: tripIds } } });
    await prisma.trip.deleteMany({ where: { id: { in: tripIds } } });
  }
  // No borramos usuarios (better-auth) — solo desvinculamos al re-asociar
  await prisma.parentStudent.deleteMany({
    where: { student: { schoolId } },
  });
  await prisma.student.deleteMany({ where: { schoolId } });
  await prisma.grade.deleteMany({ where: { schoolId } });
  await prisma.invitation.deleteMany({ where: { schoolId } });
  await prisma.temporaryAuthorization.deleteMany({ where: { schoolId } });
  await prisma.conversation.deleteMany({ where: { schoolId } });
  await prisma.alert.deleteMany({ where: { schoolId } });
  await prisma.pickupPoint.deleteMany({ where: { schoolId } });
}

// ============== Seed per school ==============

async function seedSchool(s: DemoSchool) {
  const logoUrl = logoUrlFor(s.name, s.brandHue);
  const existing = await prisma.school.findUnique({ where: { internalCode: s.internalCode } });
  const school = existing
    ? await prisma.school.update({
        where: { id: existing.id },
        data: {
          name: s.name,
          addressText: s.addressText,
          addressLat: s.addressLat,
          addressLng: s.addressLng,
          brandHue: s.brandHue,
          logoUrl,
        },
      })
    : await prisma.school.create({
        data: {
          internalCode: s.internalCode,
          name: s.name,
          addressText: s.addressText,
          addressLat: s.addressLat,
          addressLng: s.addressLng,
          brandHue: s.brandHue,
          logoUrl,
        },
      });

  // Limpiamos data anterior pero conservamos users
  await clearSchool(school.id);

  // Staff
  await ensureUser({ ...s.director, role: 'director', schoolId: school.id });
  for (const staff of s.staff) {
    await ensureUser({ ...staff, role: 'support_staff', schoolId: school.id });
  }

  // Grados
  const gradeRecords: Array<{ id: string; name: string; level: string; dismissalTime: string }> = [];
  for (const g of GRADE_TEMPLATE) {
    const created = await prisma.grade.create({
      data: {
        schoolId: school.id,
        name: g.name,
        level: g.level,
        dismissalTime: g.dismissal,
        sortOrder: g.sortOrder,
      },
    });
    gradeRecords.push({
      id: created.id,
      name: g.name,
      level: g.level,
      dismissalTime: g.dismissal,
    });
  }

  // Pickup points
  const pickupRecords = [];
  for (const pp of PICKUP_TEMPLATE) {
    const created = await prisma.pickupPoint.create({
      data: {
        schoolId: school.id,
        name: pp.name,
        centerLat: s.addressLat + pp.offsetLat,
        centerLng: s.addressLng + pp.offsetLng,
        radiusMeters: pp.radius,
      },
    });
    pickupRecords.push(created);
  }

  // Generamos padres (sin user accounts para la mayoría, solo unos pocos claimean)
  // Padres con cuenta real (claimean en el sistema) = los primeros 8
  const realParents: Array<{ id: string; name: string; email: string }> = [];
  const REAL_PARENT_COUNT = Math.min(8, s.parentsCount);

  for (let i = 0; i < REAL_PARENT_COUNT; i++) {
    const firstName = pick(Math.random() > 0.5 ? FIRST_NAMES_M : FIRST_NAMES_F);
    const lastName = pick(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${pick(
      EMAIL_DOMAINS,
    )}`.replace(/[áéíóúñ]/g, (c) => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' }[c]!));
    const fullName = `${firstName} ${lastName}`;
    const user = await ensureUser({
      email,
      password: 'demo1234',
      name: fullName,
      role: 'parent',
      schoolId: school.id,
      phoneE164: randomPhone(),
    });
    realParents.push({ id: user.id, name: fullName, email });

    // Vehículo
    const [model, type] = pick(VEHICLE_MODELS);
    void type;
    await prisma.vehicle.create({
      data: {
        parentId: user.id,
        plate: randomPlate(),
        model,
        color: pick(VEHICLE_COLORS),
      },
    });
  }

  // Alumnos
  const target = s.studentsPerLevelTarget;
  const inicialGrades = gradeRecords.filter((g) => g.level === 'INICIAL');
  const primariaGrades = gradeRecords.filter((g) => g.level === 'PRIMARIA');
  const secundariaGrades = gradeRecords.filter((g) => g.level === 'SECUNDARIA');

  let studentCounter = 0;
  const allStudents: Array<{ id: string; firstName: string; lastName: string; gradeId: string; level: string }> = [];

  async function createStudentsForLevel(
    levelGrades: typeof gradeRecords,
    count: number,
    level: string,
  ) {
    for (let i = 0; i < count; i++) {
      const grade = levelGrades[i % levelGrades.length];
      const firstName = pick(Math.random() > 0.5 ? FIRST_NAMES_M : FIRST_NAMES_F);
      const lastName = `${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
      studentCounter++;
      const externalId = `${s.internalCode.slice(0, 3)}-${String(studentCounter).padStart(4, '0')}`;
      const student = await prisma.student.create({
        data: {
          schoolId: school.id,
          gradeId: grade.id,
          firstName,
          lastName,
          externalId,
        },
      });
      allStudents.push({
        id: student.id,
        firstName,
        lastName,
        gradeId: grade.id,
        level,
      });
    }
  }

  await createStudentsForLevel(inicialGrades, target.INICIAL, 'INICIAL');
  await createStudentsForLevel(primariaGrades, target.PRIMARIA, 'PRIMARIA');
  await createStudentsForLevel(secundariaGrades, target.SECUNDARIA, 'SECUNDARIA');

  // Vincular padres reales con 1-3 hijos cada uno (los primeros alumnos)
  for (let i = 0; i < realParents.length; i++) {
    const parent = realParents[i];
    const numKids = 1 + Math.floor(Math.random() * 3); // 1-3 hijos
    const kids = pickN(allStudents.slice(i * 3, i * 3 + numKids * 2), numKids);
    for (const kid of kids) {
      await prisma.parentStudent.upsert({
        where: { parentId_studentId: { parentId: parent.id, studentId: kid.id } },
        update: {},
        create: { parentId: parent.id, studentId: kid.id },
      });
    }
  }

  // Invitaciones pendientes (padres ficticios sin claim todavía)
  const pendingInvCount = Math.min(20, s.parentsCount - REAL_PARENT_COUNT);
  for (let i = 0; i < pendingInvCount; i++) {
    const firstName = pick(Math.random() > 0.5 ? FIRST_NAMES_M : FIRST_NAMES_F);
    const lastName = pick(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.inv${i}@${pick(EMAIL_DOMAINS)}`
      .replace(/[áéíóúñ]/g, (c) => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' }[c]!));
    // Token único: combinamos colegio + índice + 12 chars aleatorios para evitar
    // colisiones aún si dos bootstraps corren en paralelo.
    const randomSuffix = Array.from({ length: 12 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)],
    ).join('');
    await prisma.invitation.create({
      data: {
        schoolId: school.id,
        token: `inv_${s.internalCode}_${i}_${randomSuffix}`,
        channel: Math.random() > 0.3 ? 'EMAIL' : 'WHATSAPP',
        contactValue: Math.random() > 0.3 ? email : randomPhone(),
        recipientName: `${firstName} ${lastName}`,
        studentIds: [],
        status: i < 5 ? 'PENDING' : Math.random() > 0.5 ? 'SENT' : 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentAt: i >= 5 ? new Date() : null,
      },
    });
  }

  // Viajes activos: 8-15 por colegio en distintos estados/pickup/ETAs
  const activeTripCount = Math.min(realParents.length, 6);
  for (let i = 0; i < activeTripCount; i++) {
    const parent = realParents[i];
    const vehicles = await prisma.vehicle.findMany({ where: { parentId: parent.id }, take: 1 });
    if (vehicles.length === 0) continue;
    const links = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true },
    });
    if (links.length === 0) continue;

    const pickup = pickupRecords[i % pickupRecords.length];
    const inZone = i < 2; // primeros 2 ya llegaron
    const etaSeconds = inZone ? 0 : 60 + i * 90 + Math.floor(Math.random() * 120);

    // Posición: si en zona, dentro del radio; si no, alejada
    const distFactor = inZone ? 0.0003 : 0.005 + i * 0.002;
    const angle = (i / activeTripCount) * Math.PI * 2;
    const lat = pickup.centerLat + Math.cos(angle) * distFactor;
    const lng = pickup.centerLng + Math.sin(angle) * distFactor;

    const trip = await prisma.trip.create({
      data: {
        schoolId: school.id,
        pickupPointId: pickup.id,
        parentId: parent.id,
        vehicleId: vehicles[0].id,
        status: inZone ? 'EN_ZONA' : 'EN_CAMINO',
        startedAt: new Date(Date.now() - (i * 90 + 60) * 1000),
        arrivedAt: inZone ? new Date() : null,
        lastLat: lat,
        lastLng: lng,
        lastPositionAt: new Date(),
        lastSpeedMps: inZone ? 0 : 8 + Math.random() * 6,
        lastHeadingDeg: Math.floor(Math.random() * 360),
        etaSeconds,
        etaUpdatedAt: new Date(),
      },
    });
    for (const link of links) {
      await prisma.tripStudent.create({
        data: { tripId: trip.id, studentId: link.studentId },
      });
    }
    await prisma.tripEvent.create({ data: { tripId: trip.id, type: 'STARTED' } });
    if (inZone) {
      await prisma.tripEvent.create({
        data: { tripId: trip.id, type: 'ARRIVED_GEOFENCE' },
      });
    }
  }

  // Suscripción
  await prisma.subscription.upsert({
    where: { schoolId: school.id },
    update: { status: 'ACTIVE' },
    create: {
      schoolId: school.id,
      status: 'ACTIVE',
      pricePerStudent: 10,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    school,
    counts: {
      grades: gradeRecords.length,
      pickupPoints: pickupRecords.length,
      students: allStudents.length,
      realParents: realParents.length,
      pendingInvitations: pendingInvCount,
      activeTrips: activeTripCount,
    },
  };
}

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'disabled_in_production' }, { status: 403 });
  }

  await ensureUser({ ...SUPER_ADMIN, role: 'super_admin', schoolId: null });

  const results: Array<{ name: string; code: string; counts: object }> = [];
  for (const s of SCHOOLS) {
    const r = await seedSchool(s);
    results.push({
      name: r.school.name,
      code: r.school.internalCode.toLowerCase(),
      counts: r.counts,
    });
  }

  return Response.json({
    ok: true,
    super_admin: { email: SUPER_ADMIN.email, password: SUPER_ADMIN.password },
    schools: results,
    note: 'Datos masivos sembrados. Mira /admin/dashboard para los viajes activos.',
  });
}

export async function GET() {
  return Response.json({
    hint: 'POST este endpoint para sembrar 600+ alumnos por colegio. Tarda ~30s.',
  });
}
