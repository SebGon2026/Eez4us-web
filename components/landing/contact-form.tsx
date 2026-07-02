'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CONTACT_PHONE_DISPLAY, CONTACT_WHATSAPP_URL } from '@/lib/contact';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary';

export function ContactForm() {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const intro = `Hola, soy ${name.trim()}, de ${school.trim()}${
      city.trim() ? ` (${city.trim()})` : ''
    }.`;
    const text = `${intro}\n\n${message.trim()}`;
    window.open(
      `${CONTACT_WHATSAPP_URL}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
    toast.success('Tu mensaje quedó listo en WhatsApp', {
      description: 'Solo falta tocar «enviar» en la conversación.',
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-border bg-card p-6 shadow-elev md:p-8"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="text-xs font-bold text-muted-foreground">
            Nombre completo
          </label>
          <input
            id="contact-name"
            type="text"
            required
            placeholder="Ana Rodríguez"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contact-school" className="text-xs font-bold text-muted-foreground">
            Colegio o institución
          </label>
          <input
            id="contact-school"
            type="text"
            required
            placeholder="Colegio Santa María"
            autoComplete="organization"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contact-city" className="text-xs font-bold text-muted-foreground">
            Ciudad <span className="font-medium text-muted-foreground/60">(opcional)</span>
          </label>
          <input
            id="contact-city"
            type="text"
            placeholder="Tucson, AZ · Monterrey, MX"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="text-xs font-bold text-muted-foreground">
            ¿Cómo podemos ayudarte?
          </label>
          <textarea
            id="contact-message"
            required
            rows={4}
            placeholder="Quiero agendar una demo para mi colegio…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-elev transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
      >
        <Send className="h-4 w-4" />
        Enviar por WhatsApp
      </button>

      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
        Al enviar se abre WhatsApp con tu mensaje dirigido a{' '}
        <span className="font-semibold text-foreground">{CONTACT_PHONE_DISPLAY}</span>. No guardamos
        nada en esta página.
      </p>
    </form>
  );
}
