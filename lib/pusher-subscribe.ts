'use client';

import { useEffect, useRef } from 'react';

import { getPusherClient } from './pusher-client';

export type ChannelEventHandler = (data: unknown) => void;

export function useEncryptedChannel(
  channelName: string | null,
  handlers: Record<string, ChannelEventHandler>,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!channelName) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    const events = Object.keys(handlersRef.current);
    const bindings = events.map((event) => {
      const fn = (data: unknown) => handlersRef.current[event]?.(data);
      channel.bind(event, fn);
      return { event, fn };
    });

    return () => {
      for (const { event, fn } of bindings) channel.unbind(event, fn);
      pusher.unsubscribe(channelName);
    };
  }, [channelName]);
}
