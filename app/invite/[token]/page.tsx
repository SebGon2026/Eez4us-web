import { prisma } from '@/lib/db';

import { ClaimInvitation } from './claim-form';

// Claim público de invitaciones: el link del email/WhatsApp del padre cae acá.
// Sin sesión (middleware lo deja pasar); el token cuid es la credencial.
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      status: true,
      expiresAt: true,
      recipientName: true,
      studentIds: true,
      channel: true,
      contactValue: true,
      school: { select: { name: true, country: true } },
    },
  });

  if (!invitation) {
    return <ClaimInvitation token={token} state="NOT_FOUND" />;
  }

  const expired = invitation.expiresAt.getTime() < Date.now();
  const status = expired && invitation.status !== 'CLAIMED' ? 'EXPIRED' : invitation.status;

  const students = invitation.studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: invitation.studentIds } },
        select: { firstName: true, lastName: true },
      })
    : [];

  const loginEmail =
    invitation.channel === 'EMAIL'
      ? invitation.contactValue
      : `${invitation.contactValue.replace(/[^\d]/g, '')}@whatsapp.eez4us.local`;

  return (
    <ClaimInvitation
      token={token}
      state={status === 'PENDING' || status === 'SENT' ? 'READY' : status}
      schoolName={invitation.school.name}
      schoolCountry={invitation.school.country}
      parentName={invitation.recipientName}
      studentNames={students.map((s) => `${s.firstName} ${s.lastName}`.trim())}
      loginEmail={loginEmail}
    />
  );
}
