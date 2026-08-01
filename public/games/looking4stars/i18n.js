(function () {
  'use strict';

  var LANG_KEY = 'doradofundev.lang';

  var STRINGS = {
    es: {
      level: 'Nivel',
      points: 'Puntos',
      balls: 'Bolas',
      aliens: 'Aliens',
      start: 'Empezar',
      next: 'Siguiente nivel',
      retry: 'Reintentar',
      replay: 'Jugar de nuevo',
      win: '¡Nivel completado!',
      winAll: '¡Has completado Looking4Stars!',
      lose: 'Nivel perdido — te quedaste sin bolas.',
      hint: 'Toca o haz clic en la pantalla para lanzar la bola.',
      legend:
        'El agujero central devuelve la bola. Los dos agujeros a sus lados multiplican los puntos ×2. Las cúpulas desvían la bola, ¡cuidado! Destruye los asteroides para liberar a los aliens.',
      ready: 'Toca o haz clic para lanzar',
      plusBall: '+1 bola',
      plusAlien: '+1 alien',
      found: 'Aliens rescatados:',
    },
    en: {
      level: 'Level',
      points: 'Points',
      balls: 'Balls',
      aliens: 'Aliens',
      start: 'Start',
      next: 'Next level',
      retry: 'Try again',
      replay: 'Play again',
      win: 'Level complete!',
      winAll: 'You beat Looking4Stars!',
      lose: 'Level lost — you ran out of balls.',
      hint: 'Tap or click on the screen to launch the ball.',
      legend:
        'The center hole returns your ball. The two holes beside it multiply points ×2. The domes deflect the ball, watch out! Destroy asteroids to rescue the aliens.',
      ready: 'Tap or click to launch',
      plusBall: '+1 ball',
      plusAlien: '+1 alien',
      found: 'Aliens rescued:',
    },
  };

  window.L4K = {
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
