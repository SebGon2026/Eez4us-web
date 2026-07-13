import type { AlertSeverity, AlertType } from '@prisma/client';

import { prisma } from './db';
import { type AppLocale,localeForCountry } from './locale';
import { sendPushToSchoolRoles, sendPushToUser } from './push';
import { encryptForChannel, readEncryptionMasterKey } from './pusher-encrypt';
import { pusherTrigger, readPusherEnv } from './pusher-server';

const STAFF_ROLES = ['director', 'support_staff', 'super_admin'];
const DIRECTOR_ROLES = ['director', 'super_admin'];

// Textos de las notificaciones push por idioma. Corren en crons sin request: el
// idioma sale del país del colegio y la notificación queda generada así.
const ALERT_M: Record<
  AppLocale,
  {
    tripOverdueTitle: string;
    tripOverdueBody: (parentName: string | null) => string;
    arrivedNotDeliveredTitle: string;
    arrivedNotDeliveredBody: (parentName: string | null) => string;
    invitationStaleTitle: string;
    invitationStaleBody: (recipientName: string | null) => string;
  }
> = {
  es: {
    tripOverdueTitle: 'Viaje demorado',
    tripOverdueBody: (parentName) => `${parentName ?? 'Un padre'} lleva más de 30 minutos en camino.`,
    arrivedNotDeliveredTitle: 'Entrega pendiente',
    arrivedNotDeliveredBody: (parentName) => `${parentName ?? 'Un padre'} está en zona hace más de 10 min sin entrega.`,
    invitationStaleTitle: 'Invitación sin claim',
    invitationStaleBody: (recipientName) => `${recipientName ?? 'Un padre'} no ha aceptado la invitación tras 7 días.`,
  },
  en: {
    tripOverdueTitle: 'Trip delayed',
    tripOverdueBody: (parentName) => `${parentName ?? 'A parent'} has been on the way for over 30 minutes.`,
    arrivedNotDeliveredTitle: 'Handoff pending',
    arrivedNotDeliveredBody: (parentName) => `${parentName ?? 'A parent'} has been in the zone for over 10 minutes with no handoff.`,
    invitationStaleTitle: 'Unclaimed invitation',
    invitationStaleBody: (recipientName) => `${recipientName ?? 'A parent'} has not accepted the invitation after 7 days.`,
  },
};

const TRIP_OVERDUE_MS = 30 * 60 * 1000;
const ARRIVED_NOT_DELIVERED_MS = 10 * 60 * 1000;
const STALE_INVITATION_MS = 7 * 24 * 60 * 60 * 1000;

export function schoolAlertsChannel(schoolId: string): string {
  return `private-encrypted-school-${schoolId}-alerts`;
}

async function broadcastAlert(schoolId: string, alert: Record<string, unknown>): Promise<void> {
  try {
    const channel = schoolAlertsChannel(schoolId);
    const encrypted = await encryptForChannel(channel, alert, readEncryptionMasterKey());
    const creds = readPusherEnv();
    await pusherTrigger({
      ...creds,
      channel,
      event: 'alert.new',
      data: encrypted,
    });
  } catch {
    // pusher down should not block alert creation
  }
}

export interface CreateAlertArgs {
  schoolId: string;
  type: AlertType;
  targetUserId?: string | null;
  targetRole?: string | null;
  payload: Record<string, unknown>;
  severity?: AlertSeverity;
}

export async function createAlert(args: CreateAlertArgs) {
  const alert = await prisma.alert.create({
    data: {
      schoolId: args.schoolId,
      type: args.type,
      targetUserId: args.targetUserId ?? null,
      targetRole: args.targetRole ?? null,
      payload: args.payload,
      severity: args.severity ?? 'info',
    },
  });
  await broadcastAlert(args.schoolId, {
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    targetUserId: alert.targetUserId,
    targetRole: alert.targetRole,
    payload: alert.payload,
    createdAt: alert.createdAt.toISOString(),
  });
  return alert;
}

interface CheckSummary {
  scanned: number;
  created: number;
}

export async function checkOverdueTrips(): Promise<CheckSummary> {
  const cutoff = new Date(Date.now() - TRIP_OVERDUE_MS);
  const trips = await prisma.trip.findMany({
    where: {
      status: 'EN_CAMINO',
      startedAt: { lt: cutoff },
      arrivedAt: null,
    },
    select: {
      id: true,
      schoolId: true,
      parentId: true,
      startedAt: true,
      school: { select: { country: true } },
      parent: { select: { name: true } },
      tripStudents: { select: { student: { select: { firstName: true, lastName: true } } } },
    },
  });

  let created = 0;
  for (const trip of trips) {
    const existing = await prisma.alert.findFirst({
      where: {
        schoolId: trip.schoolId,
        type: 'TRIP_OVERDUE',
        readAt: null,
        payload: { path: ['tripId'], equals: trip.id },
      },
      select: { id: true },
    });
    if (existing) continue;

    const studentNames = trip.tripStudents
      .map((ts) => `${ts.student.firstName} ${ts.student.lastName}`)
      .join(', ');

    await createAlert({
      schoolId: trip.schoolId,
      type: 'TRIP_OVERDUE',
      targetRole: 'support_staff',
      severity: 'warning',
      payload: {
        tripId: trip.id,
        parentId: trip.parentId,
        parentName: trip.parent.name,
        startedAt: trip.startedAt.toISOString(),
        students: studentNames,
      },
    });

    const m = ALERT_M[localeForCountry(trip.school.country)];
    await sendPushToSchoolRoles(trip.schoolId, STAFF_ROLES, {
      title: m.tripOverdueTitle,
      body: m.tripOverdueBody(trip.parent.name),
      data: { type: 'alert-trip-overdue', tripId: trip.id },
    });
    created += 1;
  }

  return { scanned: trips.length, created };
}

export async function checkArrivedNotDelivered(): Promise<CheckSummary> {
  const cutoff = new Date(Date.now() - ARRIVED_NOT_DELIVERED_MS);
  const trips = await prisma.trip.findMany({
    where: {
      status: 'EN_ZONA',
      arrivedAt: { lt: cutoff },
      deliveredAt: null,
    },
    select: {
      id: true,
      schoolId: true,
      parentId: true,
      arrivedAt: true,
      school: { select: { country: true } },
      parent: { select: { name: true } },
      tripStudents: { select: { student: { select: { firstName: true, lastName: true } } } },
    },
  });

  let created = 0;
  for (const trip of trips) {
    const existing = await prisma.alert.findFirst({
      where: {
        schoolId: trip.schoolId,
        type: 'ARRIVED_NOT_DELIVERED',
        readAt: null,
        payload: { path: ['tripId'], equals: trip.id },
      },
      select: { id: true },
    });
    if (existing) continue;

    const studentNames = trip.tripStudents
      .map((ts) => `${ts.student.firstName} ${ts.student.lastName}`)
      .join(', ');

    await createAlert({
      schoolId: trip.schoolId,
      type: 'ARRIVED_NOT_DELIVERED',
      targetRole: 'support_staff',
      severity: 'critical',
      payload: {
        tripId: trip.id,
        parentId: trip.parentId,
        parentName: trip.parent.name,
        arrivedAt: trip.arrivedAt?.toISOString() ?? null,
        students: studentNames,
      },
    });

    const m = ALERT_M[localeForCountry(trip.school.country)];
    await sendPushToSchoolRoles(trip.schoolId, STAFF_ROLES, {
      title: m.arrivedNotDeliveredTitle,
      body: m.arrivedNotDeliveredBody(trip.parent.name),
      data: { type: 'alert-arrived-not-delivered', tripId: trip.id },
    });
    created += 1;
  }

  return { scanned: trips.length, created };
}

export async function checkStaleInvitations(): Promise<CheckSummary> {
  const cutoff = new Date(Date.now() - STALE_INVITATION_MS);
  const invitations = await prisma.invitation.findMany({
    where: {
      status: { in: ['PENDING', 'SENT'] },
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      schoolId: true,
      contactValue: true,
      recipientName: true,
      createdAt: true,
      channel: true,
      status: true,
      school: { select: { country: true } },
    },
  });

  let created = 0;
  for (const invitation of invitations) {
    const existing = await prisma.alert.findFirst({
      where: {
        schoolId: invitation.schoolId,
        type: 'INVITATION_STALE',
        readAt: null,
        payload: { path: ['invitationId'], equals: invitation.id },
      },
      select: { id: true },
    });
    if (existing) continue;

    await createAlert({
      schoolId: invitation.schoolId,
      type: 'INVITATION_STALE',
      targetRole: 'director',
      severity: 'info',
      payload: {
        invitationId: invitation.id,
        recipientName: invitation.recipientName,
        contactValue: invitation.contactValue,
        channel: invitation.channel,
        status: invitation.status,
        createdAt: invitation.createdAt.toISOString(),
      },
    });

    const directors = await prisma.user.findMany({
      where: { schoolId: invitation.schoolId, role: { in: DIRECTOR_ROLES } },
      select: { id: true },
    });
    const m = ALERT_M[localeForCountry(invitation.school.country)];
    for (const dir of directors) {
      await sendPushToUser(dir.id, {
        title: m.invitationStaleTitle,
        body: m.invitationStaleBody(invitation.recipientName),
        data: { type: 'alert-invitation-stale', invitationId: invitation.id },
      });
    }
    created += 1;
  }

  return { scanned: invitations.length, created };
}

export async function runAllAlertChecks() {
  const [overdue, arrived, stale] = await Promise.all([
    checkOverdueTrips(),
    checkArrivedNotDelivered(),
    checkStaleInvitations(),
  ]);
  return { overdue, arrived, stale };
}
