(function () {
  'use strict';

  var LANG_KEY = 'doradofundev.lang';

  var STRINGS = {
    es: {
      level: 'Nivel',
      score: 'Puntos',
      lines: 'Líneas',
      keys: 'Llaves',
      keysHidden: 'Llaves',
      start: 'Empezar',
      play: 'Jugar',
      next: 'Siguiente nivel',
      backMap: 'Mapa',
      retry: 'Reintentar',
      pause: 'Pausa',
      resume: 'Seguir',
      win: '¡Nivel completado!',
      winAll: '¡Has completado cuatrolocks!',
      lose: 'Perdiste — la pila llegó arriba.',
      hint: 'Completá líneas para que las llaves caigan hasta el fondo.',
      legend:
        'Liberá todas las llaves: al eliminar la línea que las contiene no se destruyen, caen bloque a bloque y se liberan al llegar al piso. Con 2 líneas aparece un explosivo vertical, con 3 una explosión 3×3 y con 4 una 5×5. ¡Cuidado que la pila no llegue arriba!',
      ready: '¡A jugar!',
      tapNode: 'Toca un nivel para jugar',
      locked: 'Bloqueado',
      linesClear: 'Líneas',
      tetris: '¡TETRIS!',
      doubleLine: '¡Doble!',
      tripleLine: '¡Triple!',
      keyFound: '+1 llave',
      hold: 'Guardar',
      nextLabel: 'Próxima',
      difficulty: 'Dificultad',
      diffEasy: 'Fácil',
      diffMedium: 'Medio',
      diffHard: 'Difícil',
      diffExpert: 'Experto',
      diffBoss: 'Jefe',
      diffMaster: 'Maestro',
      starsEarned: 'Estrellas',
      best: 'Récord',
      bossHint: 'Nivel jefe: las llaves están ocultas. ¡Eliminá líneas para descubrirlas!',
    },
    en: {
      level: 'Level',
      score: 'Score',
      lines: 'Lines',
      keys: 'Keys',
      keysHidden: 'Keys',
      start: 'Start',
      play: 'Play',
      next: 'Next level',
      backMap: 'Map',
      retry: 'Try again',
      pause: 'Pause',
      resume: 'Resume',
      win: 'Level complete!',
      winAll: 'You beat cuatrolocks!',
      lose: 'You lost — the stack reached the top.',
      hint: 'Clear lines so the keys fall all the way to the floor.',
      legend:
        'Free all the keys: clearing the line that holds one doesn\'t destroy it — it falls block by block and is freed when it reaches the floor. Clear 2 lines for a vertical blast, 3 for a 3×3 and 4 for a 5×5. Watch out: don\'t let the stack reach the top!',
      ready: 'Let\'s go!',
      tapNode: 'Tap a level to play',
      locked: 'Locked',
      linesClear: 'Lines',
      tetris: 'TETRIS!',
      doubleLine: 'Double!',
      tripleLine: 'Triple!',
      keyFound: '+1 key',
      hold: 'Hold',
      nextLabel: 'Next',
      difficulty: 'Difficulty',
      diffEasy: 'Easy',
      diffMedium: 'Medium',
      diffHard: 'Hard',
      diffExpert: 'Expert',
      diffBoss: 'Boss',
      diffMaster: 'Master',
      starsEarned: 'Stars',
      best: 'Best',
      bossHint: 'Boss level: the keys are hidden. Clear lines to find them!',
    },
  };

  window.CLK = {
    currentLang: function () {
      try {
        return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'es';
      } catch (e) {
        return 'es';
      }
    },
    t: function (lang, key) {
      var dict = STRINGS[lang] || STRINGS.es;
      return dict[key] || STRINGS.es[key] || key;
    },
    LANG_KEY: LANG_KEY,
  };
})();
