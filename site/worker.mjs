// Main-site Worker. Static files are served by the assets binding; only result
// share links (/s/<id>) run this script and are answered by the API Worker,
// which owns the share records and renders the preview page.
const SHARE_PATH = /^\/s\/[A-Za-z0-9]{10}\/?$/;

export default {
  async fetch(request, env) {
    if (SHARE_PATH.test(new URL(request.url).pathname)) return env.API.fetch(request);
    return env.ASSETS.fetch(request);
  },
};
