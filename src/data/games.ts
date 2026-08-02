export interface Game {
  id: string;
  titleKey: string;
  descKey: string;
  thumb: string;
  orientation?: 'portrait' | 'landscape';
}

export const games: Game[] = [
  {
    id: 'voleyaslife',
    titleKey: 'games.voleyaslife.title',
    descKey: 'games.voleyaslife.desc',
    thumb: '/games/voleyaslife/thumb.svg',
    orientation: 'portrait',
  },
  {
    id: 'looking4stars',
    titleKey: 'games.looking4stars.title',
    descKey: 'games.looking4stars.desc',
    thumb: '/games/looking4stars/thumb.svg',
    orientation: 'portrait',
  },
  {
    id: 'ejemplo-cuadritos',
    titleKey: 'games.ejemploCuadritos.title',
    descKey: 'games.ejemploCuadritos.desc',
    thumb: '/games/ejemplo-cuadritos/thumb.svg',
  },
];

export function findGame(id: string): Game | undefined {
  return games.find((g) => g.id === id);
}
