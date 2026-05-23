'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface SidebarItem {
  href: string;
  label: string;
  roles?: string[];
}

const ITEMS: SidebarItem[] = [
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/dashboard', label: 'Dashboard en vivo' },
  { href: '/admin/pickup-points', label: 'Puntos de recogida' },
  { href: '/admin/grades', label: 'Grados' },
  { href: '/admin/students', label: 'Alumnos' },
  { href: '/admin/invitations', label: 'Invitaciones' },
  { href: '/admin/reports/operational', label: 'Reporte operativo', roles: ['director', 'super_admin'] },
  { href: '/admin/reports/school', label: 'Reporte de escuela', roles: ['director', 'super_admin'] },
  { href: '/admin/reports/financial', label: 'Reporte financiero', roles: ['super_admin'] },
  { href: '/admin/billing', label: 'Facturación', roles: ['director', 'super_admin'] },
  { href: '/admin/vendors', label: 'Vendors', roles: ['super_admin'] },
  { href: '/admin/support', label: 'Soporte' },
  { href: '/admin/support/admin', label: 'Tickets (admin)', roles: ['super_admin'] },
];

interface SidebarProps {
  userName: string | null;
  role: string;
  schoolName: string | null;
}

export function Sidebar({ userName, role, schoolName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visible = ITEMS.filter((it) => !it.roles || it.roles.includes(role));

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      <div className="space-y-1 border-b px-6 py-6">
        <h1 className="text-2xl font-black text-primary">Eez4us</h1>
        {schoolName && <p className="text-xs text-muted-foreground">{schoolName}</p>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visible.map((item) => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t px-6 py-4 text-xs">
        <p className="font-bold">{userName ?? 'Usuario'}</p>
        <p className="text-muted-foreground">{role}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 w-full rounded-2xl border-2 border-input px-3 py-2 text-xs font-bold transition-colors hover:bg-secondary"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
