import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { BillingActions } from '@/components/admin/billing-actions';
import { OpenpayBillingActions } from '@/components/admin/openpay-billing-actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { openpayPricePerStudentMXN, resolveProvider } from '@/lib/billing';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

function fmtMoney(n: number, currency: string): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`;
}

const STATUS_BADGE: Record<
  string,
  'default' | 'success' | 'warning' | 'destructive' | 'secondary'
> = {
  TRIALING: 'warning',
  ACTIVE: 'success',
  PAST_DUE: 'destructive',
  CANCELED: 'secondary',
  PAUSED: 'secondary',
};

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = d.getUTCFullYear();
  return `${dd}-${mm}-${yy}`;
}

export default async function BillingPage() {
  const t = await getTranslations('billing');
  const tCommon = await getTranslations('common');
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');
  const schoolId = session.user.schoolId;

  const [sub, studentCount, school, lastPaidInvoice, invoices] = await Promise.all([
    prisma.subscription.findUnique({ where: { schoolId } }),
    prisma.student.count({ where: { schoolId, active: true } }),
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, stripeCustomerId: true, country: true, currency: true },
    }),
    prisma.invoice.findFirst({
      where: { schoolId, status: 'PAID' },
      orderBy: { paidAt: 'desc' },
      select: { paidAt: true, amount: true },
    }),
    prisma.invoice.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        paidAt: true,
        pdfUrl: true,
      },
    }),
  ]);

  const provider = resolveProvider(school ?? { country: null, currency: null });
  const currencyCode = sub?.currency ?? (provider === 'openpay' ? 'MXN' : 'USD');
  const pricePerStudent =
    sub?.pricePerStudent ?? (provider === 'openpay' ? openpayPricePerStudentMXN() : 10);
  const amount = studentCount * pricePerStudent;
  const badgeVariant = sub ? STATUS_BADGE[sub.status] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('subtitle', { school: school?.name ?? t('yourSchool') })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{tCommon('fields.status')}</CardDescription>
            <div className="pt-2">
              {sub && badgeVariant ? (
                <Badge variant={badgeVariant}>{t(`status.${sub.status}`)}</Badge>
              ) : (
                <Badge variant="secondary">{t('noSubscription')}</Badge>
              )}
            </div>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('monthlyPayment')}</CardDescription>
            <CardTitle className="text-4xl text-primary">{fmtMoney(amount, currencyCode)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('perStudentBreakdown', {
                count: studentCount,
                price: fmtMoney(pricePerStudent, currencyCode),
              })}
            </p>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('cutoffDate')}</CardDescription>
            <CardTitle className="text-2xl">{fmtDate(sub?.currentPeriodEnd ?? null)}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('currentPeriodClose')}</p>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>{t('lastPayment')}</CardDescription>
            <CardTitle className="text-2xl">{fmtDate(lastPaidInvoice?.paidAt ?? null)}</CardTitle>
            {lastPaidInvoice && (
              <p className="text-xs text-muted-foreground">
                {fmtMoney(lastPaidInvoice.amount, currencyCode)}
              </p>
            )}
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{tCommon('fields.actions')}</CardTitle>
          <CardDescription>
            {provider === 'openpay'
              ? t('openpayDescription')
              : sub
                ? t('stripeManageDescription')
                : t('startSubscriptionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {provider === 'openpay' ? (
            <OpenpayBillingActions hasCard={!!sub?.openpayCardId} />
          ) : (
            <BillingActions hasSubscription={!!sub?.stripeSubscriptionId} />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t('paymentHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noInvoices')}</p>
          ) : (
            <ul className="divide-y text-sm">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-bold">{fmtMoney(inv.amount, currencyCode)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('invoiceIssued', { date: fmtDate(inv.createdAt) })}
                      {inv.paidAt ? t('invoicePaid', { date: fmtDate(inv.paidAt) }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        inv.status === 'PAID'
                          ? 'success'
                          : inv.status === 'FAILED'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {inv.status === 'PAID'
                        ? t('invoiceStatus.PAID')
                        : inv.status === 'FAILED'
                          ? t('invoiceStatus.FAILED')
                          : inv.status === 'VOID'
                            ? t('invoiceStatus.VOID')
                            : t('invoiceStatus.PENDING')}
                    </Badge>
                    {inv.pdfUrl && (
                      <a
                        href={inv.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
