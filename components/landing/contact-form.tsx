'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/25';

export function ContactForm() {
  const t = useTranslations('landing.contact.form');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Espeja la validación del server (zod trimea antes de medir longitudes).
    const payload = {
      name: name.trim(),
      school: school.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      message: message.trim(),
      website,
    };
    if (payload.name.length < 2 || payload.school.length < 2 || payload.message.length < 10) {
      toast.error(t('validationErrorTitle'), {
        description: t('validationErrorDescription'),
      });
      return;
    }
    setPending(true);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(
          data?.error === 'INVALID_FIELDS' ? t('validationErrorTitle') : t('sendError'),
        );
        return;
      }
      setSent(true);
      toast.success(t('successToastTitle'), {
        description: t('successToastDescription'),
      });
    } catch {
      toast.error(t('sendError'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative rounded-3xl border border-border bg-card p-6 shadow-elev md:p-8">
      {/* Condicional puro (sin AnimatePresence): con framer 12 + React 19 el exit
          no desmonta y la vista de éxito nunca aparecería con mode="wait". */}
      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.21, 0.65, 0.36, 1] }}
          className="flex min-h-[420px] flex-col items-center justify-center text-center"
        >
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 16 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--brand-green)/0.14)]"
          >
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </motion.span>
          <h3 className="mt-5 text-xl font-black tracking-tight">{t('successTitle')}</h3>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t.rich('successBody', {
              email,
              strong: (chunks) => (
                <span className="font-semibold text-foreground">{chunks}</span>
              ),
            })}
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setMessage('');
            }}
            className="mt-6 text-sm font-bold text-primary transition-colors hover:underline"
          >
            {t('sendAnother')}
          </button>
        </motion.div>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="text-xs font-bold text-muted-foreground">
                  {t('nameLabel')}
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder={t('namePlaceholder')}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="contact-school" className="text-xs font-bold text-muted-foreground">
                  {t('schoolLabel')}
                </label>
                <input
                  id="contact-school"
                  type="text"
                  required
                  placeholder={t('schoolPlaceholder')}
                  autoComplete="organization"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-email" className="text-xs font-bold text-muted-foreground">
                {t('emailLabel')}
              </label>
              <input
                id="contact-email"
                type="email"
                required
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-phone" className="text-xs font-bold text-muted-foreground">
                  {t('phoneLabel')}{' '}
                  <span className="font-medium text-muted-foreground">{t('optional')}</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  placeholder={t('phonePlaceholder')}
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="contact-city" className="text-xs font-bold text-muted-foreground">
                  {t('cityLabel')}{' '}
                  <span className="font-medium text-muted-foreground">{t('optional')}</span>
                </label>
                <input
                  id="contact-city"
                  type="text"
                  placeholder={t('cityPlaceholder')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="text-xs font-bold text-muted-foreground">
                {t('messageLabel')}
              </label>
              <textarea
                id="contact-message"
                required
                minLength={10}
                rows={4}
                placeholder={t('messagePlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Honeypot anti-bots: invisible para humanos */}
            <div className="absolute left-[-9999px] top-auto" aria-hidden>
              <label htmlFor="contact-website">{t('websiteLabel')}</label>
              <input
                id="contact-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={pending}
            whileTap={{ scale: 0.98 }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-elev transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('submit')}
              </>
            )}
          </motion.button>

          <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            {t('footnote')}
          </p>
        </form>
      )}
    </div>
  );
}
