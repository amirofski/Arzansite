import { io, Socket } from 'socket.io-client';
import { tokenManager } from '@/lib/tokenManager';

type SiteConfigEvents = {
  config_update: (data: unknown) => void;
  mode_updated: (data: unknown) => void;
};

export class SocketClient {
  private socket: Socket | null = null;
  private baseURL = (import.meta.env.VITE_WS_URL as string) || 'https://nest.arzansite.com';
  private namespace = '/site-config';

  connect(): Socket {
    if (this.socket && this.socket.connected) return this.socket;

    const token = tokenManager.getAccessToken();
    const url = `${this.baseURL}${this.namespace}`;

    this.socket = io(url, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: token ? { token } : undefined,
    });

    this.attachCoreLogging(this.socket);

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T extends keyof SiteConfigEvents>(event: T, listener: SiteConfigEvents[T]) {
    const s = this.ensureConnected();
    s.on(event, listener);
  }

  off<T extends keyof SiteConfigEvents>(event: T, listener: SiteConfigEvents[T]) {
    if (!this.socket) return;
    this.socket.off(event, listener);
  }

  private ensureConnected(): Socket {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }

  private attachCoreLogging(s: Socket) {
    s.on('connect', () => {
      console.log('[Socket] connected', { id: s.id });
    });
    s.on('disconnect', (reason) => {
      console.log('[Socket] disconnected', { reason });
    });
    s.on('connect_error', (err) => {
      console.error('[Socket] connect_error', err.message);
    });
    s.on('error', (err) => {
      console.error('[Socket] error', err);
    });
  }
}

export const socketClient = new SocketClient();


