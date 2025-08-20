import { useEffect, useRef, useState } from 'react';
import { socketClient } from '@/lib/socketClient';

export interface SiteConfigMessage {
  type: 'config_update' | 'mode_updated' | string;
  payload: unknown;
}

export function useSiteConfigSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SiteConfigMessage | null>(null);
  const listenersAttached = useRef(false);

  useEffect(() => {
    const socket = socketClient.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConfigUpdate = (data: unknown) => setLastMessage({ type: 'config_update', payload: data });
    const onModeUpdated = (data: unknown) => setLastMessage({ type: 'mode_updated', payload: data });

    if (!listenersAttached.current) {
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('config_update', onConfigUpdate);
      socket.on('mode_updated', onModeUpdated);
      listenersAttached.current = true;
    }

    return () => {
      if (listenersAttached.current) {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('config_update', onConfigUpdate);
        socket.off('mode_updated', onModeUpdated);
        listenersAttached.current = false;
      }
    };
  }, []);

  return { connected, lastMessage };
}


