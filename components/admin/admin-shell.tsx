'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';

interface AdminShellProps {
  userName: string | null;
  role: string;
  schoolName: string | null;
  schoolLogo: string | null;
  internalCode: string | null;
  children: React.ReactNode;
}

export function AdminShell({
  userName,
  role,
  schoolName,
  schoolLogo,
  internalCode,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Cerrar el drawer al navegar
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Escape cierra el drawer
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        userName={userName}
        role={role}
        schoolName={schoolName}
        schoolLogo={schoolLogo}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          schoolName={schoolName}
          internalCode={internalCode}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl 3xl:max-w-[110rem] shell-px shell-py">{children}</div>
        </main>
      </div>
    </div>
  );
}
