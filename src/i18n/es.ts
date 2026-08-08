export const es = {
  ui: {
    siteTitle: 'doradofundev',
    tagline: 'Videojuegos hechos por mí, para jugar en el navegador.',
    catalogTitle: 'Catálogo de juegos',
    catalogEmpty: 'Todavía no hay juegos. Vuelve pronto.',
    play: 'Jugar',
    back: 'Volver al catálogo',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    language: 'Idioma',
    gameNotFound: 'No se encontró ese juego.',
  },
  games: {
    voleyaslife: {
      title: 'VoleyAsLife',
      desc: 'Tu carrera en el vóley: elegí tu posición, jugá la eliminatoria nacional y tomá decisiones en los momentos clave.',
    },
    looking4stars: {
      title: 'Looking4Stars',
      desc: 'Lanza las bolas, destruye los asteroides y rescata a todos los aliens antes de quedarte sin bolas.',
    },
    cuatrolocks: {
      title: 'cuatrolocks',
      desc: 'Tetris de construcciones: liberá las llaves escondidas en los bloques y dispará explosiones encadenadas.',
    },
    ejemploCuadritos: {
      title: 'Cuadritos',
      desc: 'Muévete con las flechas del teclado y recoge los puntos dorados antes de que se acabe el tiempo.',
    },
  },
} as const;

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof es>;
