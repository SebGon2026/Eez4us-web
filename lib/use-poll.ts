'use client';

import { useEffect, useRef } from 'react';

import { createPollScheduler } from './poll-scheduler';

interface PollOptions {
  activeMs: number;
  idleMs: number;
  enabled?: boolean;
}

/**
 * Polling que se apaga con la pestaña oculta y baja el ritmo cuando no hay nada
 * vivo que seguir. El callback devuelve `true` mientras haya actividad.
 *
 * Un `setInterval` fijo sobre un endpoint que pega a Accelerate factura 24/7 por
 * cada pestaña abierta, aunque la pantalla esté apagada y no haya un solo viaje.
 * La lógica vive en `poll-scheduler` para poder testearla.
 */
export function usePoll(
  fn: () => Promise<boolean>,
  { activeMs, idleMs, enabled = true }: PollOptions,
): void {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!enabled) return;

    const scheduler = createPollScheduler({
      run: () => fnRef.current(),
      activeMs,
      idleMs,
      isHidden: () => document.hidden,
    });

    const onVisibility = () => scheduler.sync();
    document.addEventListener('visibilitychange', onVisibility);
    scheduler.start();

    return () => {
      scheduler.stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activeMs, idleMs, enabled]);
}
