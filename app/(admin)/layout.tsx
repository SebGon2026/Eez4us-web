import { redirect } from 'next/navigation';

import { Sidebar } from '@/components/admin/sidebar';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

const STAFF_ROLES = new Set(['director', 'support_staff', 'super_admin']);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (!STAFF_ROLES.has(session.user.role)) redirect('/login');

  let schoolName: string | null = null;
  if (session.user.schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: { name: true },
    });
    schoolName = school?.name ?? null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={session.user.name} role={session.user.role} schoolName={schoolName} />
      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-10">{children}</div>
      </div>
    </div>
  );
}
