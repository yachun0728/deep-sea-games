import {
  SHARE_GAMES, SHARE_ID, SHARE_ORIGIN, formatScore, shareCopy, shareLang,
} from '../../../shared/share-games.mjs';

const ROUND_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function newShareId() {
  let id = '';
  while (id.length < 10) {
    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
      // 248 = 62 * 4, so every accepted byte maps uniformly onto the alphabet.
      if (byte < 248 && id.length < 10) id += ALPHABET[byte % 62];
    }
  }
  return id;
}

export async function readShareCommand(request) {
  try {
    const text = await request.text();
    if (text.length > 1024) return null;
    const command = JSON.parse(text);
    if (!command || typeof command !== 'object' || Array.isArray(command)) return null;
    if (Object.keys(command).some(key => !['gameId', 'roundId', 'lang'].includes(key))) return null;
    if (!Object.hasOwn(SHARE_GAMES, command.gameId)) return null;
    if (typeof command.roundId !== 'string' || !ROUND_ID.test(command.roundId)) return null;
    return { gameId: command.gameId, roundId: command.roundId, lang: shareLang(command.lang) };
  } catch {
    return null;
  }
}

export async function createShare(db, playerId, { gameId, roundId, lang }) {
  const round = await db.prepare(
    'SELECT score FROM ranked_boards WHERE id = ? AND player_id = ? AND game_id = ?',
  ).bind(roundId, playerId, gameId).first();
  if (!round) return { error: 'round_not_found', status: 404 };
  if (round.score === null) return { error: 'round_unfinished', status: 409 };

  const existing = db.prepare('SELECT id, score FROM result_shares WHERE round_id = ?').bind(roundId);
  for (let attempt = 0; attempt < 3; attempt++) {
    const found = await existing.first();
    if (found) return { id: found.id, gameId, score: found.score, path: '/s/' + found.id };
    try {
      await db.prepare(
        'INSERT INTO result_shares (id, round_id, player_id, game_id, score, lang, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (round_id) DO NOTHING',
      ).bind(newShareId(), roundId, playerId, gameId, round.score, lang, Date.now()).run();
    } catch {
      // A share ID collision is retried with a fresh ID; anything else surfaces below.
    }
  }
  const found = await existing.first();
  if (!found) throw new Error('share_insert_failed');
  return { id: found.id, gameId, score: found.score, path: '/s/' + found.id };
}

export async function findShare(db, id) {
  if (!SHARE_ID.test(id)) return null;
  return db.prepare(
    `SELECT shares.game_id AS gameId, shares.score, shares.lang, shares.created_at AS createdAt,
            players.display_name AS displayName
       FROM result_shares AS shares JOIN players ON players.id = shares.player_id
      WHERE shares.id = ?`,
  ).bind(id).first();
}

const escape = value => String(value).replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[ch]);

const TEXT = {
  zh: {
    verified: '伺服器驗證成績', player: '訪客', play: '我也要玩', home: '回到 TICATICA GAMES',
    missing: '找不到這個分享連結', missingBody: '連結可能輸入錯誤，或分享已不存在。',
    challenge: '在 TICATICA GAMES 免費遊玩，挑戰這個成績！', on: '達成時間',
  },
  en: {
    verified: 'Server-verified score', player: 'Guest', play: 'Play now', home: 'Back to TICATICA GAMES',
    missing: 'Share link not found', missingBody: 'The link may be mistyped, or the share no longer exists.',
    challenge: 'Play free on TICATICA GAMES and beat this score!', on: 'Achieved',
  },
};

function page({ lang, title, description, image, url, body, status }) {
  const html = `<!doctype html>
<html lang="${lang === 'en' ? 'en' : 'zh-Hant'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TICATICA GAMES">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:image" content="${escape(image)}">
<meta property="og:url" content="${escape(url)}">
<meta name="twitter:card" content="summary">
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" href="${escape(new URL('/images/favicon.png?v=3', url))}">
<style>
:root{color-scheme:light dark;--bg:#0b1d33;--card:#12304f;--ink:#f3f7ff;--muted:#a9c1dd;--accent:#ffd23f;--accent-ink:#1b1b2f}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:var(--bg);color:var(--ink);font:16px/1.5 "Noto Sans TC",system-ui,-apple-system,sans-serif}
main{width:100%;max-width:420px;background:var(--card);border-radius:20px;padding:28px 24px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.35)}
img{max-width:180px;height:auto}
h1{margin:16px 0 4px;font-size:1.35rem}
.score{margin:12px 0 4px;font-size:3rem;font-weight:900;color:var(--accent);line-height:1.1}
.score small{font-size:1.1rem;margin-left:4px}
.meta{color:var(--muted);font-size:.9rem;margin:4px 0}
.badge{display:inline-block;margin-top:8px;padding:2px 10px;border-radius:999px;background:rgba(255,210,63,.15);color:var(--accent);font-size:.8rem}
a.play{display:block;margin-top:22px;padding:14px;border-radius:14px;background:var(--accent);color:var(--accent-ink);font-weight:900;text-decoration:none;font-size:1.1rem}
a.play:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
p.cta{color:var(--muted);font-size:.9rem;margin:14px 0 0}
</style>
</head>
<body><main>${body}</main></body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
      'Content-Security-Policy': "default-src 'none'; img-src https: http:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

function taipeiDate(ms, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(ms));
}

export function renderSharePage(share, { id, siteOrigin = SHARE_ORIGIN, langOverride } = {}) {
  const origin = new URL(siteOrigin).origin;
  const url = origin + '/s/' + id;
  const logo = new URL('/images/ticatica-logo.png', origin).href;
  if (!share || !SHARE_GAMES[share.gameId]) {
    const lang = shareLang(langOverride);
    const t = TEXT[lang];
    return page({
      lang, status: 404, title: t.missing + ' · TICATICA GAMES', description: t.missingBody, image: logo, url,
      body: `<img src="${escape(logo)}" alt="TICATICA GAMES"><h1>${escape(t.missing)}</h1><p class="meta">${escape(t.missingBody)}</p><a class="play" href="${escape(origin + '/')}">${escape(t.home)}</a>`,
    });
  }
  const lang = langOverride ? shareLang(langOverride) : share.lang;
  const t = TEXT[lang], game = SHARE_GAMES[share.gameId];
  const name = game.name[lang], result = shareCopy(share.gameId, 'result', lang, share.score);
  const player = share.displayName?.trim() || t.player;
  const image = new URL('/' + game.image, origin).href;
  return page({
    lang, status: 200, url, image,
    title: name + (lang === 'en' ? ' | ' : '｜') + result,
    description: shareCopy(share.gameId, 'brag', lang, share.score),
    body: `<img src="${escape(logo)}" alt="TICATICA GAMES">
<h1>${escape(name)}</h1>
<p class="meta">${escape(player)}</p>
<p class="score">${escape(formatScore(share.score))}<small>${escape(game.unit[lang])}</small></p>
<p class="meta">${escape(t.on)}${lang === 'en' ? ': ' : '：'}${escape(taipeiDate(share.createdAt, lang))}</p>
<span class="badge">✓ ${escape(t.verified)}</span>
<a class="play" href="${escape(origin + '/#' + share.gameId)}">${escape(t.play)}</a>
<p class="cta">${escape(t.challenge)}</p>`,
  });
}
