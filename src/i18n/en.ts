import type { Messages } from './es';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const en: DeepPartial<Messages> = {
  ui: {
    siteTitle: 'doradofundev',
    tagline: 'Games made by me, playable in your browser.',
    catalogTitle: 'Game catalog',
    catalogEmpty: 'No games yet. Check back soon.',
    play: 'Play',
    back: 'Back to catalog',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    language: 'Language',
    gameNotFound: 'That game was not found.',
  },
  games: {
    looking4stars: {
      title: 'Looking4Stars',
      desc: 'Shoot the balls, destroy the asteroids and rescue all the aliens before you run out of balls.',
    },
    ejemploCuadritos: {
      title: 'Little Squares',
      desc: 'Move with the arrow keys and collect the golden dots before time runs out.',
    },
  },
};
