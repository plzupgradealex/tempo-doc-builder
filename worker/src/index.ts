/**
 * Tempo Sync Worker
 *
 * Routes:
 *   PUT  /api/sync        – push library to KV   (X-Sync-Key header)
 *   GET  /api/sync        – pull library from KV  (X-Sync-Key header)
 *   GET  /api/room/:id    – WebSocket upgrade → Durable Object room
 */

export interface Env {
  SYNC_KV: KVNamespace;
  ROOMS: DurableObjectNamespace;
}

/* ─── Durable Object: collaborative room ─── */

export class Room implements DurableObject {
  private sessions = new Set<WebSocket>();
  private agenda: string | null = null;

  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    // Only WebSocket upgrades allowed
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    this.sessions.add(server);

    // Send current agenda state to the new peer
    if (!this.agenda) {
      this.agenda = (await this.state.storage.get<string>('agenda')) ?? null;
    }
    if (this.agenda) {
      server.send(JSON.stringify({ type: 'state', data: this.agenda }));
    }

    // Send peer count to everyone
    this.broadcastPeerCount();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    try {
      const msg = JSON.parse(message) as { type: string; data?: string };
      if (msg.type === 'update' && msg.data) {
        this.agenda = msg.data;
        await this.state.storage.put('agenda', msg.data);
        // Broadcast to all OTHER connected peers
        for (const peer of this.sessions) {
          if (peer !== ws) {
            try { peer.send(JSON.stringify({ type: 'update', data: msg.data })); } catch { /* closed */ }
          }
        }
      }
    } catch { /* ignore bad JSON */ }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.sessions.delete(ws);
    this.broadcastPeerCount();
    // Auto-cleanup: if no one is connected after 1 hour, delete the room data
    if (this.sessions.size === 0) {
      await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.sessions.delete(ws);
    this.broadcastPeerCount();
  }

  async alarm(): Promise<void> {
    // If still empty, clean up
    if (this.sessions.size === 0) {
      await this.state.storage.deleteAll();
      this.agenda = null;
    }
  }

  private broadcastPeerCount(): void {
    const msg = JSON.stringify({ type: 'peers', count: this.sessions.size });
    for (const peer of this.sessions) {
      try { peer.send(msg); } catch { /* closed */ }
    }
  }
}

/* ─── CORS helper ─── */

function cors(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key',
  };
}

/* ─── Main fetch handler ─── */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '*';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    // ── Sync: KV-backed library storage ──
    if (url.pathname === '/api/sync') {
      const key = request.headers.get('X-Sync-Key');
      if (!key || key.length < 16) {
        return json({ error: 'Missing or invalid sync key' }, 401, origin);
      }

      if (request.method === 'GET') {
        const data = await env.SYNC_KV.get(key);
        return new Response(data ?? '{"agendas":[],"domains":[]}', {
          headers: { ...cors(origin), 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'PUT') {
        const body = await request.text();
        // KV value limit is 25 MiB — more than enough
        await env.SYNC_KV.put(key, body);
        return json({ ok: true }, 200, origin);
      }

      return json({ error: 'Method not allowed' }, 405, origin);
    }

    // ── Publish: public agenda HTML pages ──
    if (url.pathname.startsWith('/api/pub')) {
      const key = request.headers.get('X-Sync-Key');
      if (!key || key.length < 16) {
        return json({ error: 'Missing or invalid sync key' }, 401, origin);
      }

      if (request.method === 'PUT') {
        const { slug, html } = (await request.json()) as { slug: string; html: string };
        if (!slug || !html) {
          return json({ error: 'Missing slug or html' }, 400, origin);
        }
        if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(slug)) {
          return json({ error: 'Invalid slug' }, 400, origin);
        }
        // Verify ownership if slug already exists
        const existing = await env.SYNC_KV.getWithMetadata<{ owner: string }>(`pub:${slug}`);
        if (existing.value && existing.metadata?.owner !== key) {
          return json({ error: 'Slug already taken' }, 409, origin);
        }
        await env.SYNC_KV.put(`pub:${slug}`, html, { metadata: { owner: key } });
        return json({ ok: true, slug }, 200, origin);
      }

      // DELETE /api/pub/:slug
      const pubSlugMatch = url.pathname.match(/^\/api\/pub\/([a-z0-9][a-z0-9-]+[a-z0-9])$/);
      if (request.method === 'DELETE' && pubSlugMatch) {
        const slug = pubSlugMatch[1];
        const existing = await env.SYNC_KV.getWithMetadata<{ owner: string }>(`pub:${slug}`);
        if (!existing.value) {
          return json({ error: 'Not found' }, 404, origin);
        }
        if (existing.metadata?.owner !== key) {
          return json({ error: 'Forbidden' }, 403, origin);
        }
        await env.SYNC_KV.delete(`pub:${slug}`);
        return json({ ok: true }, 200, origin);
      }

      return json({ error: 'Method not allowed' }, 405, origin);
    }

    // ── Room: Durable Object WebSocket ──
    const roomMatch = url.pathname.match(/^\/api\/room\/([a-zA-Z0-9_-]+)$/);
    if (roomMatch) {
      const roomId = roomMatch[1];
      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);
      return stub.fetch(request);
    }

    // ── Public page: serve published HTML ──
    const pubPageMatch = url.pathname.match(/^\/([a-z0-9][a-z0-9-]+[a-z0-9])\.html$/);
    if (pubPageMatch && request.method === 'GET') {
      const slug = pubPageMatch[1];
      const html = await env.SYNC_KV.get(`pub:${slug}`);
      if (!html) {
        return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
      }
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Health check
    if (url.pathname === '/health') {
      return json({ status: 'ok', ts: Date.now() }, 200, origin);
    }

    return json({ error: 'Not found' }, 404, origin);
  },
} satisfies ExportedHandler<Env>;

function json(body: Record<string, unknown>, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' },
  });
}
