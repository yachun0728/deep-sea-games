// Player result sharing. Every round can share a result card image. A verified ranked
// round links to a short /s/<id> score page; other rounds link straight to the game.
import { arcadeApiOrigin, createApiClient } from './api.mjs';
import { SHARE_GAMES, SHARE_ORIGIN, shareCopy, shareLang } from '../../shared/share-games.mjs';

const local = () => ['localhost', '127.0.0.1'].includes(location.hostname);
// Production pages (main domain and the GitHub Pages mirror) always link to the main
// domain. Other hosts, such as local preview containers, serve /s/<id> themselves.
const production = () => /(^|\.)ticaticagames\.com$|\.github\.io$/.test(location.hostname);

export function currentShareLang() {
  return shareLang(window.deepSeaI18n?.getLanguage?.());
}

export { SHARE_GAMES };

export function canShareGame(gameId) {
  return Object.hasOwn(SHARE_GAMES, gameId);
}

export function shareLinkOrigin() {
  if (production()) return SHARE_ORIGIN;
  return local() ? arcadeApiOrigin() : location.origin;
}

// Without a verified round the link opens the game itself. The card can still show
// the score from this browser; only /s/<id> pages require a server-verified score.
export function inviteLink(gameId, score = null) {
  const base = production() ? SHARE_ORIGIN + '/' : location.origin + location.pathname;
  return { url: base + '#' + gameId, score: Number.isSafeInteger(score) && score >= 0 ? score : null, verified: false };
}

export async function createShareLink({ gameId, roundId, token }, signal, lang = currentShareLang()) {
  const share = await createApiClient(arcadeApiOrigin()).createShare(token, { gameId, roundId, lang }, signal);
  return { url: shareLinkOrigin() + share.path, score: share.score, verified: true };
}

// Title and text follow the language shown when the player presses share.
export function shareMessage(gameId, { url, score }, lang = currentShareLang()) {
  return {
    url,
    title: SHARE_GAMES[gameId].name[lang],
    text: score === null ? shareCopy(gameId, 'invite', lang) : shareCopy(gameId, 'brag', lang, score),
  };
}

// Opens the result-card dialog: card preview, share image, download image, copy link.
export async function presentResult(gameId, link, { snapshot = null } = {}) {
  const lang = currentShareLang();
  const { presentShare } = await import('./share-card.mjs');
  return presentShare({ gameId, ...shareMessage(gameId, link, lang), score: link.score, snapshot, lang });
}
