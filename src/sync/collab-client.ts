/**
 * Collab client — connects to a Durable Object room via WebSocket
 * for real-time collaborative editing of an agenda.
 *
 * Usage:
 *   const room = joinRoom('abc123');
 *   room.onUpdate((agenda) => { ... });
 *   room.sendUpdate(agenda);
 *   room.leave();
 */

import type { Agenda } from '../types';
import { emit } from '../bus';
import { getApiUrl } from './sync-client';

export interface RoomConnection {
  /** Push the current agenda state to all other peers. */
  sendUpdate: (agenda: Agenda) => void;
  /** Register a callback for incoming updates from other peers. */
  onUpdate: (cb: (agenda: Agenda) => void) => void;
  /** Register a callback for peer count changes. */
  onPeers: (cb: (count: number) => void) => void;
  /** Disconnect from the room. */
  leave: () => void;
  /** Current readyState wrapper. */
  readonly connected: boolean;
}

/** Generate a short random room id. */
export function createRoomId(): string {
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(36)).join('').slice(0, 8);
}

/** Connect to a collaboration room. */
export function joinRoom(roomId: string): RoomConnection {
  const base = getApiUrl().replace(/^http/, 'ws');
  const ws = new WebSocket(`${base}/api/room/${roomId}`);

  let updateCb: ((agenda: Agenda) => void) | null = null;
  let peersCb: ((count: number) => void) | null = null;

  ws.addEventListener('open', () => {
    emit('room-status', { status: 'connected', roomId });
  });

  ws.addEventListener('message', (e) => {
    try {
      const msg = JSON.parse(e.data as string) as {
        type: string;
        data?: string;
        count?: number;
      };
      if ((msg.type === 'state' || msg.type === 'update') && msg.data) {
        const agenda = JSON.parse(msg.data) as Agenda;
        updateCb?.(agenda);
      }
      if (msg.type === 'peers' && msg.count !== undefined) {
        peersCb?.(msg.count);
        emit('room-peers', { count: msg.count });
      }
    } catch { /* ignore bad data */ }
  });

  ws.addEventListener('close', () => {
    emit('room-status', { status: 'disconnected', roomId });
  });

  ws.addEventListener('error', () => {
    emit('room-status', { status: 'error', roomId });
  });

  return {
    sendUpdate(agenda: Agenda) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'update', data: JSON.stringify(agenda) }));
      }
    },
    onUpdate(cb) { updateCb = cb; },
    onPeers(cb) { peersCb = cb; },
    leave() {
      ws.close();
    },
    get connected() {
      return ws.readyState === WebSocket.OPEN;
    },
  };
}

/** Build a shareable room URL. */
export function getRoomUrl(roomId: string): string {
  return `${window.location.origin}${window.location.pathname}?room=${roomId}`;
}

/** Extract room id from the current URL, if present. */
export function getRoomIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}
