import { onRequestGet as getStats } from './api/net/stats';
import { onRequestGet as getChat, onRequestPost as postChat } from './api/net/chat';
import { onRequestPost as postEvent } from './api/net/event';
import { onRequestPost as postHello } from './api/net/hello';
import { onRequestGet as getMarket, onRequestPost as postMarket } from './api/net/market';
import { type Env as NetEnv, type PagesContext } from './api/net/common';

interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface WorkerEnv extends NetEnv {
  ASSETS: AssetBinding;
}

type Handler = (context: PagesContext) => Promise<Response>;
const NET_API_PATHS = new Set([
  '/api/net/stats',
  '/api/net/hello',
  '/api/net/event',
  '/api/net/chat',
  '/api/net/market',
]);

function methodNotAllowed(): Response {
  return Response.json({ error: 'method not allowed' }, {
    status: 405,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function notFound(): Response {
  return Response.json({ error: 'not found' }, {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function handlerFor(pathname: string, method: string): Handler | null {
  if (pathname === '/api/net/stats') return method === 'GET' ? getStats : null;
  if (pathname === '/api/net/hello') return method === 'POST' ? postHello : null;
  if (pathname === '/api/net/event') return method === 'POST' ? postEvent : null;
  if (pathname === '/api/net/market') {
    if (method === 'GET') return getMarket;
    if (method === 'POST') return postMarket;
    return null;
  }
  if (pathname === '/api/net/chat') {
    if (method === 'GET') return getChat;
    if (method === 'POST') return postChat;
    return null;
  }
  return null;
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/net/')) {
      const handler = handlerFor(url.pathname, request.method);
      if (!handler) return NET_API_PATHS.has(url.pathname)
        ? methodNotAllowed()
        : notFound();
      return handler({ request, env });
    }
    return env.ASSETS.fetch(request);
  },
};
