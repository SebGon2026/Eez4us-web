import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPollScheduler } from '@/lib/poll-scheduler';

const ACTIVE = 5_000;
const IDLE = 60_000;

function setup(opts: { active?: boolean; hidden?: boolean } = {}) {
  const state = { hidden: opts.hidden ?? false, active: opts.active ?? false };
  const run = vi.fn(async () => state.active);
  const scheduler = createPollScheduler({
    run,
    activeMs: ACTIVE,
    idleMs: IDLE,
    isHidden: () => state.hidden,
  });
  return { scheduler, run, state };
}

// Deja correr los timers y además drena las promesas del `await run()`.
async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
}

describe('createPollScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('con viajes activos mantiene el ritmo rapido', async () => {
    const { scheduler, run } = setup({ active: true });
    scheduler.start();
    await advance(0);
    expect(run).toHaveBeenCalledTimes(1);

    await advance(ACTIVE * 3);
    expect(run).toHaveBeenCalledTimes(4);
    scheduler.stop();
  });

  it('sin viajes se va al ritmo lento', async () => {
    const { scheduler, run } = setup({ active: false });
    scheduler.start();
    await advance(0);
    expect(run).toHaveBeenCalledTimes(1);

    // A los 5s todavia no toca de nuevo: espera el intervalo largo.
    await advance(ACTIVE);
    expect(run).toHaveBeenCalledTimes(1);

    await advance(IDLE);
    expect(run).toHaveBeenCalledTimes(2);
    scheduler.stop();
  });

  it('con la pestana oculta no pega una sola vez', async () => {
    const { scheduler, run } = setup({ active: true, hidden: true });
    scheduler.start();
    await advance(0);
    await advance(IDLE * 5);
    expect(run).not.toHaveBeenCalled();
    scheduler.stop();
  });

  it('ocultar la pestana corta el polling en curso', async () => {
    const { scheduler, run, state } = setup({ active: true });
    scheduler.start();
    await advance(0);
    expect(run).toHaveBeenCalledTimes(1);

    state.hidden = true;
    scheduler.sync();

    await advance(IDLE * 10);
    expect(run).toHaveBeenCalledTimes(1);
    scheduler.stop();
  });

  it('volver a la pestana refresca de inmediato y retoma', async () => {
    const { scheduler, run, state } = setup({ active: true, hidden: true });
    scheduler.start();
    await advance(IDLE);
    expect(run).not.toHaveBeenCalled();

    state.hidden = false;
    scheduler.sync();
    await advance(0);
    expect(run).toHaveBeenCalledTimes(1);

    await advance(ACTIVE);
    expect(run).toHaveBeenCalledTimes(2);
    scheduler.stop();
  });

  it('stop deja cero timers vivos', async () => {
    const { scheduler, run } = setup({ active: true });
    scheduler.start();
    await advance(0);
    expect(run).toHaveBeenCalledTimes(1);

    scheduler.stop();
    await advance(IDLE * 10);
    expect(run).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('una respuesta lenta no solapa corridas', async () => {
    const state = { active: true };
    let resolve: ((_v: boolean) => void) | null = null;
    const run = vi.fn(
      () =>
        new Promise<boolean>((r) => {
          resolve = r;
        }),
    );
    const scheduler = createPollScheduler({
      run,
      activeMs: ACTIVE,
      idleMs: IDLE,
      isHidden: () => false,
    });

    scheduler.start();
    await advance(0);
    expect(run).toHaveBeenCalledTimes(1);

    // Mientras la primera sigue en vuelo, el tiempo no dispara una segunda.
    await advance(ACTIVE * 4);
    expect(run).toHaveBeenCalledTimes(1);

    resolve!(state.active);
    await advance(ACTIVE);
    expect(run).toHaveBeenCalledTimes(2);
    scheduler.stop();
  });

  it('un fetch que falla no mata el polling', async () => {
    const run = vi.fn(async () => {
      throw new Error('network');
    });
    const scheduler = createPollScheduler({
      run,
      activeMs: ACTIVE,
      idleMs: IDLE,
      isHidden: () => false,
    });

    scheduler.start();
    await advance(0);
    expect(run).toHaveBeenCalledTimes(1);

    await advance(IDLE);
    expect(run).toHaveBeenCalledTimes(2);
    scheduler.stop();
  });
});
