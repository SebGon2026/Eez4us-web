'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export function ReplyForm({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribí tu respuesta…"
            rows={3}
            maxLength={2000}
            required
          />
          <Button type="submit" disabled={pending || !message.trim()} className="self-end">
            {pending ? 'Enviando…' : 'Enviar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
