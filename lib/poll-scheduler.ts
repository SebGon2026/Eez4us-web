export interface PollSchedulerOptions {
  run: () => Promise<boolean>;
  activeMs: number;
  idleMs: number;
  isHidden: () => boolean;
}

export interface PollScheduler {
  start: () => void;
  stop: () => void;
  /** Llamar cuando cambia la visibilidad de la pestaña. */
  sync: () => void;
}

/**
 * Scheduler de polling adaptativo, sin React para poder testearlo.
 *
 * Reglas:
 *  - Pestaña oculta ⇒ no se pega nada y no queda timer vivo.
 *  - Volver a la pestaña ⇒ refresco inmediato.
 *  - `run()` devuelve si hay actividad; sin actividad se espera `idleMs`.
 *  - Nunca hay dos corridas solapadas ni dos timers en paralelo.
 */
export function createPollScheduler({
  run,
  activeMs,
  idleMs,
  isHidden,
}: PollSchedulerOptions): PollScheduler {
  let stopped = true;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (ms: number) => {
    clear();
    if (stopped || isHidden()) return;
    timer = setTimeout(() => void tick(), ms);
  };

  const tick = async () => {
    if (stopped || running || isHidden()) {
      clear();
      return;
    }
    running = true;
    let active = false;
    try {
      active = await run();
    } catch {
      active = false;
    } finally {
      running = false;
    }
    if (!stopped) schedule(active ? activeMs : idleMs);
  };

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      void tick();
    },
    stop() {
      stopped = true;
      clear();
    },
    sync() {
      if (stopped) return;
      if (isHidden()) clear();
      else if (timer === null && !running) void tick();
    },
  };
}
