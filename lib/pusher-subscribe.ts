'use client';

import { useEffect, useRef } from 'react';

import { getPusherClient } from './pusher-client';

export type ChannelEventHandler = (_data: unknown) => void;

export interface UseEncryptedChannelOptions {
  // Pusher resuscribe solo al reconectar, pero los eventos perdidos durante el corte no
  // se recuperan: acá va el refetch que resincroniza el estado del board.
  onReconnect?: () => void;
}

export function useEncryptedChannel(
  channelName: string | null,
  handlers: Record<string, ChannelEventHandler>,
  options?: UseEncryptedChannelOptions,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const onReconnectRef = useRef(options?.onReconnect);
  onReconnectRef.current = options?.onReconnect;

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

    let wasConnected = pusher.connection.state === 'connected';
    const onStateChange = ({ current }: { current: string }) => {
      if (current === 'connected') {
        if (wasConnected === false && onReconnectRef.current) onReconnectRef.current();
        wasConnected = true;
      }
    };
    pusher.connection.bind('state_change', onStateChange);

    return () => {
      pusher.connection.unbind('state_change', onStateChange);
      for (const { event, fn } of bindings) channel.unbind(event, fn);
      pusher.unsubscribe(channelName);
    };
  }, [channelName]);
}
