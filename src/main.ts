import './styles.css';
import { t, getLang, setLang, onLangChange, type Lang } from './i18n';
import { games, findGame } from './data/games';

type Route = { page: 'catalog' } | { page: 'game'; id: string };

function parseHash(): Route {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'juego' && parts[1]) return { page: 'game', id: parts[1] };
  return { page: 'catalog' };
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

function renderHeader(): string {
  const lang = getLang();
  const button = (value: Lang) =>
    `<button class="lang-btn${lang === value ? ' is-active' : ''}" data-lang="${value}" type="button">${value.toUpperCase()}</button>`;
  return `
    <header class="header">
      <a class="logo" href="#/">${esc(t('ui.siteTitle'))}</a>
      <div class="lang-switch" role="group" aria-label="${esc(t('ui.language'))}">
        ${button('es')}${button('en')}
      </div>
    </header>`;
}

function renderCatalog(): string {
  const cards = games
    .map(
      (g) => `
        <a class="card" href="#/juego/${esc(g.id)}">
          <img class="card-thumb" src="${esc(g.thumb)}" alt="${esc(t(g.titleKey))}" loading="lazy" />
          <div class="card-body">
            <h2 class="card-title">${esc(t(g.titleKey))}</h2>
            <p class="card-desc">${esc(t(g.descKey))}</p>
            <span class="card-play">${esc(t('ui.play'))} &rarr;</span>
          </div>
        </a>`,
    )
    .join('');

  return `
    <main class="view">
      <section class="catalog">
        <h1>${esc(t('ui.catalogTitle'))}</h1>
        <p class="tagline">${esc(t('ui.tagline'))}</p>
        ${cards ? `<div class="grid">${cards}</div>` : `<p class="empty">${esc(t('ui.catalogEmpty'))}</p>`}
      </section>
    </main>`;
}

function renderGame(id: string): string {
  const game = findGame(id);
  if (!game) {
    return `
      <main class="view">
        <section class="catalog">
          <h1>${esc(t('ui.gameNotFound'))}</h1>
          <a class="btn" href="#/">${esc(t('ui.back'))}</a>
        </section>
      </main>`;
  }
  const isPortrait = game.orientation === 'portrait';
  return `
    <main class="view${isPortrait ? ' view-portrait' : ''}">
      <section class="game-page">
        <div class="game-topbar">
          <a class="btn" href="#/">&larr; ${esc(t('ui.back'))}</a>
          <button class="btn btn-fullscreen" type="button">${esc(t('ui.fullscreen'))}</button>
        </div>
        <h1>${esc(t(game.titleKey))}</h1>
        <p class="game-desc">${esc(t(game.descKey))}</p>
        <div class="game-frame${isPortrait ? ' is-portrait' : ''}" id="game-frame">
          <iframe src="games/${esc(game.id)}/index.html" title="${esc(t(game.titleKey))}" allowfullscreen></iframe>
        </div>
      </section>
    </main>`;
}

function render(): void {
  const app = document.getElementById('app');
  if (!app) return;
  document.documentElement.lang = getLang();
  app.innerHTML = `${renderHeader()}${renderRoute(parseHash())}`;
  bindEvents();
  window.scrollTo(0, 0);
}

function renderRoute(route: Route): string {
  return route.page === 'game' ? renderGame(route.id) : renderCatalog();
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang as Lang));
  });
  const fullscreenBtn = document.querySelector<HTMLButtonElement>('.btn-fullscreen');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const frame = document.getElementById('game-frame');
      if (!frame) return;
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void frame.requestFullscreen();
      }
    });
  }
}

function syncFullscreenLabel(): void {
  const btn = document.querySelector<HTMLButtonElement>('.btn-fullscreen');
  if (!btn) return;
  btn.textContent = document.fullscreenElement ? t('ui.exitFullscreen') : t('ui.fullscreen');
}

onLangChange(render);
window.addEventListener('hashchange', render);
document.addEventListener('fullscreenchange', syncFullscreenLabel);
render();
