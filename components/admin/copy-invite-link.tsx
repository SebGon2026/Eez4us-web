'use client';

import { Check, Link2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

// Copia el link de claim de la invitación. Camino manual cuando el email/WhatsApp no
// llega (o para reenviarlo por el canal que sea): el director lo pega donde quiera.
export function CopyInviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const link = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard bloqueado (http/permisos): mostrar el link para copiar a mano.
      window.prompt('Copiá el link de invitación:', link);
      return;
    }
    setCopied(true);
    toast.success('Link de invitación copiado');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} title="Copiar link de invitación">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      <span className="ml-1 hidden sm:inline">Link</span>
    </Button>
  );
}
