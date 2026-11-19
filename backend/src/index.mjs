import { json, route } from './routes/api.mjs';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const crossOrigin = origin && origin !== new URL(request.url).origin;
    if (crossOrigin && origin !== env.FRONTEND_ORIGIN) {
      return json({ error: 'origin_not_allowed' }, 403, { Vary: 'Origin' });
    }

    try {
      const response = crossOrigin && request.method === 'OPTIONS'
        ? new Response(null, { status: 204 })
        : await route(request, env.DB);
      response.headers.set('Vary', 'Origin');
      if (crossOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST');
        response.headers.set('Access-Control-Allow-Headers', 'Authorization');
      }
      return response;
    } catch {
      const headers = { Vary: 'Origin' };
      if (crossOrigin) headers['Access-Control-Allow-Origin'] = origin;
      return json({ error: 'service_unavailable' }, 503, headers);
    }
  },
};
