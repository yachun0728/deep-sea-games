// Result card image (1080×1350 PNG) and the share dialog that previews it.
// Everything is drawn in the browser; nothing is uploaded.
import { SHARE_GAMES, formatScore } from '../../shared/share-games.mjs';

const W = 1080, H = 1350;
const FONT = '"Inter","Noto Sans TC","PingFang TC",system-ui,sans-serif';
const COLORS = { bg: '#0b0c0f', surface: '#191c21', line: '#292d35', primary: '#7717ff', accent: '#886cff', text: '#fff', muted: '#acb5c2', score: '#ffb020' };

const TEXT = {
  zh: {
    title: '分享成績', invite: '分享遊戲', close: '關閉', share: '分享圖片', shareLink: '分享連結', download: '下載圖片',
    copy: '複製連結', copied: '已複製連結。', copyFailed: '無法自動複製，請長按連結複製。', downloaded: '圖片已下載。',
    shareFailed: '這個瀏覽器無法分享圖片，請改用下載。', challenge: '來挑戰看看！',
    footer: '在 TICATICA GAMES 免費遊玩', alt: '成績卡預覽', linkLabel: '分享連結', making: '正在產生成績卡…',
  },
  en: {
    title: 'Share score', invite: 'Share game', close: 'Close', share: 'Share image', shareLink: 'Share link', download: 'Download image',
    copy: 'Copy link', copied: 'Link copied.', copyFailed: 'Could not copy automatically. Long-press the link to copy it.', downloaded: 'Image downloaded.',
    shareFailed: 'This browser cannot share images. Download it instead.', challenge: 'Come and play!',
    footer: 'Play free on TICATICA GAMES', alt: 'Result card preview', linkLabel: 'Share link', making: 'Creating result card…',
  },
};

function loadImage(src) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

// Game art: a cover image, or the lobby icon, which is stored as an SVG <symbol> fragment.
async function loadArt(path) {
  const href = new URL(path, document.baseURI).href;
  if (!path.endsWith('.svg')) return loadImage(href);
  try {
    const text = await (await fetch(href)).text();
    // Keep every symbol (icons may reference helper symbols) and draw the main icon-* one.
    const tag = /<symbol\b[^>]*\bid="icon-[^"]+"[^>]*>/.exec(text)?.[0];
    const id = tag && /\bid="([^"]+)"/.exec(tag)[1], viewBox = tag && /\bviewBox="([^"]+)"/.exec(tag)?.[1];
    if (!id || !viewBox) return null;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="${viewBox}"><defs>${text}</defs><use href="#${id}" width="100%" height="100%"/></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const image = await loadImage(url);
    URL.revokeObjectURL(url);
    return image;
  } catch {
    return null;
  }
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function fitText(g, text, x, y, size, weight, color, maxWidth) {
  g.font = `${weight} ${size}px ${FONT}`;
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillText(text, x, y, maxWidth);
}

// snapshot: an optional canvas copied from the game at the moment the round ended.
export async function renderShareCard({ gameId, score, snapshot, lang }) {
  const game = SHARE_GAMES[gameId], t = TEXT[lang];
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  try { await Promise.race([document.fonts?.load(`900 120px ${FONT}`), new Promise(r => setTimeout(r, 1500))]); } catch {}
  const logo = await loadImage(new URL('images/ticatica-logo.png', document.baseURI).href);

  g.fillStyle = COLORS.bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, -200, 100, W / 2, -200, 1100);
  glow.addColorStop(0, 'rgba(119,23,255,.55)'); glow.addColorStop(1, 'rgba(119,23,255,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);

  if (logo) {
    const lw = 360, lh = lw * logo.naturalHeight / logo.naturalWidth;
    g.drawImage(logo, (W - lw) / 2, 64, lw, lh);
  } else fitText(g, 'TICATICA GAMES', W / 2, 130, 56, 800, COLORS.text, 900);

  // Game snapshot (or the game's cover / icon) fitted inside a rounded frame.
  const frameTop = 200, frameH = 600, frameW = 960;
  if (game.snapshot === false) snapshot = null;
  const picture = snapshot || await loadArt(game.art);
  const pw = picture ? (picture.naturalWidth || picture.width) : 0, ph = picture ? (picture.naturalHeight || picture.height) : 0;
  if (pw && ph) {
    const scale = Math.min(frameW / pw, frameH / ph), fw = pw * scale, fh = ph * scale;
    const fx = (W - fw) / 2, fy = frameTop + (frameH - fh) / 2;
    if (!snapshot) { roundRect(g, (W - frameW) / 2, frameTop, frameW, frameH, 28); g.fillStyle = COLORS.surface; g.fill(); }
    g.save(); roundRect(g, fx, fy, fw, fh, 28); g.clip();
    g.drawImage(picture, fx, fy, fw, fh); g.restore();
    if (snapshot) { roundRect(g, fx, fy, fw, fh, 28); g.lineWidth = 6; g.strokeStyle = COLORS.accent; g.stroke(); }
  } else {
    roundRect(g, (W - frameW) / 2, frameTop, frameW, frameH, 28);
    g.fillStyle = COLORS.surface; g.fill();
  }

  fitText(g, game.name[lang], W / 2, 900, 60, 800, COLORS.text, 960);
  if (score === null) {
    fitText(g, t.challenge, W / 2, 1080, 104, 900, COLORS.score, 960);
  } else {
    const value = formatScore(score), unit = game.unit[lang];
    g.font = `900 150px ${FONT}`; const vw = g.measureText(value).width;
    g.font = `800 60px ${FONT}`; const uw = g.measureText(unit).width;
    const start = (W - vw - 18 - uw) / 2;
    g.textAlign = 'left'; g.fillStyle = COLORS.score;
    g.font = `900 150px ${FONT}`; g.fillText(value, start, 1090);
    g.font = `800 60px ${FONT}`; g.fillText(unit, start + vw + 18, 1090);
  }
  g.fillStyle = COLORS.line; g.fillRect(120, 1180, W - 240, 2);
  fitText(g, t.footer, W / 2, 1262, 40, 600, COLORS.text, 960);

  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('card_failed')), 'image/png'));
}

let dialog;
function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'share-dialog';
  // Text is set per language by this module, so the page translator must not touch it.
  dialog.setAttribute('data-i18n-ignore', '');
  dialog.setAttribute('aria-labelledby', 'share-dialog-title');
  dialog.innerHTML = `
    <div class="share-dialog-head"><h2 id="share-dialog-title"></h2><button type="button" class="share-dialog-close" data-action="close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
    <div class="share-dialog-preview"><img alt=""><p class="share-dialog-making"></p></div>
    <label class="share-dialog-link"><span></span><input type="text" readonly><button type="button" data-action="copy"><i class="fa-regular fa-copy" aria-hidden="true"></i><span></span></button></label>
    <div class="share-dialog-actions">
      <button type="button" class="share-dialog-primary" data-action="share"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span></span></button>
      <button type="button" class="share-dialog-secondary" data-action="download"><i class="fa-solid fa-download" aria-hidden="true"></i><span></span></button>
    </div>
    <p class="share-dialog-note" role="status"></p>`;
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  document.body.appendChild(dialog);
  return dialog;
}

// Opens the dialog at once and fills in the card when it is ready.
export async function presentShare({ gameId, url, score, snapshot, text, title, lang }) {
  const t = TEXT[lang], box = ensureDialog();
  const $ = selector => box.querySelector(selector);
  const note = message => { $('.share-dialog-note').textContent = message; };
  const fileName = `ticatica-${gameId}${score === null ? '' : '-' + score}.png`;
  let blob = null, objectUrl = null;

  $('#share-dialog-title').textContent = score === null ? t.invite : t.title;
  $('.share-dialog-close').setAttribute('aria-label', t.close);
  $('.share-dialog-link > span').textContent = t.linkLabel;
  $('.share-dialog-link input').value = url;
  $('[data-action="copy"] span').textContent = t.copy;
  $('[data-action="download"] span').textContent = t.download;
  $('.share-dialog-preview img').alt = t.alt;
  $('.share-dialog-preview img').hidden = true;
  $('.share-dialog-making').textContent = t.making;
  $('.share-dialog-making').hidden = false;
  note('');

  const fileShare = file => typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const shareButton = $('[data-action="share"]');
  const linkOnly = typeof navigator.share === 'function';
  shareButton.hidden = !linkOnly;
  shareButton.disabled = true;
  $('[data-action="download"]').disabled = true;
  shareButton.querySelector('span').textContent = t.share;

  const handlers = {
    close: () => box.close(),
    copy: async () => {
      try { await navigator.clipboard.writeText(text + ' ' + url); note(t.copied); }
      catch { $('.share-dialog-link input').select(); note(t.copyFailed); }
    },
    download: () => {
      if (!objectUrl) return;
      const anchor = document.createElement('a');
      anchor.href = objectUrl; anchor.download = fileName; anchor.click();
      note(t.downloaded);
    },
    share: async () => {
      const file = blob && new File([blob], fileName, { type: 'image/png' });
      try {
        if (file && fileShare(file)) await navigator.share({ files: [file], title, text: text + ' ' + url });
        else await navigator.share({ title, text, url });
      } catch (error) {
        if (error?.name !== 'AbortError') note(t.shareFailed);
      }
    },
  };
  const onClick = event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action && handlers[action]) handlers[action]();
  };
  box.addEventListener('click', onClick);
  box.addEventListener('close', () => {
    box.removeEventListener('click', onClick);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, { once: true });
  if (!box.open) box.showModal();

  try {
    blob = await renderShareCard({ gameId, score, snapshot, lang });
  } catch {
    // A canvas that drew cross-origin images cannot be exported; use the game art instead.
    try { blob = snapshot ? await renderShareCard({ gameId, score, snapshot: null, lang }) : null; }
    catch { blob = null; }
  }
  if (!box.open) return;
  $('.share-dialog-making').hidden = true;
  if (blob) {
    objectUrl = URL.createObjectURL(blob);
    $('.share-dialog-preview img').src = objectUrl;
    $('.share-dialog-preview img').hidden = false;
    $('[data-action="download"]').disabled = false;
    const canFiles = fileShare(new File([blob], fileName, { type: 'image/png' }));
    shareButton.querySelector('span').textContent = canFiles ? t.share : t.shareLink;
  }
  shareButton.disabled = false;
}
