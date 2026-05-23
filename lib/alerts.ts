import type { AlertSeverity, AlertType } from '@prisma/client';

import { prisma } from './db';
import { sendPushToSchoolRoles, sendPushToUser } from './push';
import { encryptForChannel, readEncryptionMasterKey } from './pusher-encrypt';
import { pusherTrigger, readPusherEnv } from './pusher-server';

const STAFF_ROLES = ['director', 'support_staff', 'super_admin'];
const DIRECTOR_ROLES = ['director', 'super_admin'];

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

    await sendPushToSchoolRoles(trip.schoolId, STAFF_ROLES, {
      title: 'Viaje demorado',
      body: `${trip.parent.name ?? 'Un padre'} lleva más de 30 minutos en camino.`,
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

    await sendPushToSchoolRoles(trip.schoolId, STAFF_ROLES, {
      title: 'Entrega pendiente',
      body: `${trip.parent.name ?? 'Un padre'} está en zona hace más de 10 min sin entrega.`,
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
    for (const dir of directors) {
      await sendPushToUser(dir.id, {
        title: 'Invitación sin claim',
        body: `${invitation.recipientName ?? 'Un padre'} no ha aceptado la invitación tras 7 días.`,
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
