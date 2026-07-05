import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { intlLocaleOf } from '@/lib/locale';
import { getCurrentSession } from '@/lib/session';

import { BroadcastForm } from './broadcast-form';

export default async function MessagesPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const schoolId = session.user.schoolId;
  const t = await getTranslations('comms');
  const intlLocale = intlLocaleOf(await getLocale());

  const conversations = await prisma.conversation.findMany({
    where: { schoolId },
    orderBy: { lastMessageAt: 'desc' },
    include: {
      parent: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, senderType: true },
      },
    },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{t('messages.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('messages.subtitle')}</p>
        </div>
      </div>

      <BroadcastForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('messages.conversations', { count: conversations.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('messages.empty')}</p>
          ) : (
            <ul className="divide-y">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/messages/${c.id}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-secondary/50 -mx-2 px-2 rounded-2xl"
                  >
                    <div>
                      <p className="font-bold">{c.parent.name ?? c.parent.email}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {c.messages[0]
                          ? `${c.messages[0].senderType === 'PARENT' ? '↩' : '➜'} ${c.messages[0].body}`
                          : c.subject ?? t('messages.noMessages')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {c.unreadStaff > 0 && (
                        <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">
                          {c.unreadStaff}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.lastMessageAt).toLocaleString(intlLocale, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
