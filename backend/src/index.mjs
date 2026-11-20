import { json, route } from './routes/api.mjs';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const crossOrigin = origin && origin !== new URL(request.url).origin;
    const allowedOrigins = (env.FRONTEND_ORIGIN ?? '').split(',').map(value => value.trim());
    if (crossOrigin && !allowedOrigins.includes(origin)) {
      return json({ error: 'origin_not_allowed' }, 403, { Vary: 'Origin' });
    }

    try {
      const response = crossOrigin && request.method === 'OPTIONS'
        ? new Response(null, { status: 204 })
        : await route(request, env.DB, env);
      response.headers.set('Vary', 'Origin');
      if (crossOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST');
        response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      }
      return response;
    } catch {
      const headers = { Vary: 'Origin' };
      if (crossOrigin) headers['Access-Control-Allow-Origin'] = origin;
      return json({ error: 'service_unavailable' }, 503, headers);
    }
  },
};
