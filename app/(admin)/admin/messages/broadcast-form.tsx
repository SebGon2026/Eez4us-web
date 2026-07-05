'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function BroadcastForm() {
  const t = useTranslations('comms');
  const tc = useTranslations('common');
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
      toast.success(t('broadcast.sent', { count: data.broadcasted }));
      setSubject('');
      setMessage('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('broadcast.sendError'));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('broadcast.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('broadcast.subjectPlaceholder')}
            maxLength={120}
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('broadcast.messagePlaceholder')}
            rows={3}
            maxLength={2000}
            required
          />
          <Button type="submit" disabled={pending || !message.trim()}>
            {pending ? tc('actions.sending') : t('broadcast.sendToAll')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
