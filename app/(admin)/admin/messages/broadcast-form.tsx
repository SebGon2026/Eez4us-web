'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function BroadcastForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setPending(true);
    try {
      const res = await fetch('/api/admin/conversations?broadcast=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: subject || undefined, message, scope: 'ALL' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { broadcasted: number };
      toast.success(`Broadcast enviado a ${data.broadcasted} padres`);
      setSubject('');
      setMessage('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el broadcast');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Broadcast a todos los padres</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto (opcional)"
            maxLength={120}
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mensaje para todos los padres..."
            rows={3}
            maxLength={2000}
            required
          />
          <Button type="submit" disabled={pending || !message.trim()}>
            {pending ? 'Enviando…' : 'Enviar a todos'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
