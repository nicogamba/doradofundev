(function () {
  'use strict';

  var LANG_KEY = 'doradofundev.lang';

  var STRINGS = {
    es: {
      points: 'Puntos',
      record: 'Récord',
      time: 'Tiempo',
      gameOver: '¡Se acabó el tiempo!',
      finalPoints: 'Puntos:',
      pressR: 'pulsa R para repetir',
      newRecord: '¡Nuevo récord!',
      hint: 'Muévete con las flechas o WASD. Recoge el reloj para ganar tiempo.',
    },
    en: {
      points: 'Points',
      record: 'Record',
      time: 'Time',
      gameOver: "Time's up!",
      finalPoints: 'Points:',
      pressR: 'press R to play again',
      newRecord: 'New record!',
      hint: 'Move with the arrow keys or WASD. Grab the clock for extra time.',
    },
  };

  window.CUAD = {
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
