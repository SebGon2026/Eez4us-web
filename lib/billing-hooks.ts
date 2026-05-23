import { prisma } from './db';
import { updateSubscriptionQuantity } from './stripe';

async function syncQuantity(schoolId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { schoolId },
    select: { stripeSubscriptionId: true, status: true },
  });
  if (!sub?.stripeSubscriptionId) return;
  if (sub.status === 'CANCELED' || sub.status === 'PAUSED') return;

  const count = await prisma.student.count({
    where: { schoolId, active: true },
  });

  try {
    await updateSubscriptionQuantity(schoolId, count);
  } catch (err) {
    console.error('billing-hooks: updateSubscriptionQuantity failed', { schoolId, err });
  }
}

export async function onStudentCreated(schoolId: string): Promise<void> {
  await syncQuantity(schoolId);
}

export async function onStudentDeactivated(schoolId: string): Promise<void> {
  await syncQuantity(schoolId);
}

export async function onStudentActivationChanged(
  schoolId: string,
  wasActive: boolean,
  nowActive: boolean,
): Promise<void> {
  if (wasActive === nowActive) return;
  await syncQuantity(schoolId);
}
