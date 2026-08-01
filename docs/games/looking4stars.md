# Spec del juego — Looking4Stars

> Documento vivo. Detalla el juego 1 del catálogo.
> La spec general del proyecto vive en `docs/specs.md`; este documento la
> complementa y es su referencia para todo lo específico del juego.
> Lo mantiene el agente `specs`. Lo ejecuta el agente `build`.

## 1. Idea

Juego 2D de puntería con física, vertical y mobile-first. El jugador lanza
bolas desde un lanzador fijo arriba para destruir asteroides y rescatar a los
aliens que están atrapados dentro de ellos, antes de quedarse sin bolas.
Mecánica original: no usa assets ni nombres de terceros.

## 2. Mecánica base

- **Lanzador:** fijo arriba, centrado. El jugador hace clic o toca cualquier
  punto de la pantalla; la bola sale disparada hacia ese punto (solo importa
  la dirección, no la fuerza). La gravedad curva la trayectoria.
- **Bolas:** cada lanzamiento gasta una bola. Se empieza cada nivel con 3
  bolas (constante ajustable).
- **Formato:** vertical, mobile-first (lienzo lógico ≈ 480×800). En
  escritorio la web lo muestra en una columna centrada tipo teléfono.

## 3. Asteroides (elementos destructibles)

- La bola rebota contra ellos; cada rebote resta 1 de durabilidad.
- Durabilidad de 1 a 3 golpes; el **color distingue la durabilidad**:
  verde (1), ámbar (2), rojo (3).
- Al llegar a 0, el asteroide se destruye y suma puntos a la bola en vuelo.
- Visual: rocas irregulares con cráteres, manteniendo el color por durabilidad.

## 4. Agujeros y cúpulas

- **5 agujeros** repartidos en el ancho inferior, con los siguientes anchos
  (de mayor a menor) según el premio:
  - Agujeros 0 y 4 (los más anchos): puntos ×1.
  - Agujeros 1 y 3 (medianos): puntos ×2.
  - Agujero 2 (el central, el más angosto): puntos ×1 y devuelve la vida
    gastada.
- **Cúpulas:** en cada segmento de suelo entre agujeros hay una
  **semi-elipse** que desvía la bola con rebotes impredecibles.
- La bola siempre termina cayendo en uno de los 5 agujeros (resuelto por
  gravedad, rebotes y un resguardo anti-atasco que la envía al agujero más
  cercano).

## 5. Puntuación

- Los puntos que acumuló la bola en vuelo (asteroides destruidos) se
  multiplican por el factor del agujero (×1 o ×2) y se suman a la
  **puntuación general**, que se acumula entre niveles.
- Recompensas por puntos acumulados (nueva bola, poder): **sin decidir**, se
  negocia al afinar el ritmo del juego.

## 6. Aliens y objetivo

- Cada nivel define cuántos aliens hay que rescatar (constante ajustable,
  típicamente 3).
- Los aliens están **escondidos en asteroides elegidos al azar** (1 alien por
  asteroide). Al destruir el asteroide, el alien se libera y se contabiliza
  automáticamente (la caída visual es solo estética).
- **Ganar:** rescatar a todos los aliens del nivel.
- **Perder:** la última bola entra en un agujero sin devolver vida y quedan 0
  bolas sin haber rescatado a todos los aliens.
- Al reintentar, los aliens se re-posicionan en otros asteroides (aleatorio).

## 7. Niveles y dificultad

- La dificultad influye en qué asteroides esconden aliens:
  - **Fácil:** aliens en asteroides de baja durabilidad.
  - **Medio:** posición aleatoria.
  - **Difícil:** aliens en asteroides de alta durabilidad.
- v1: 3 niveles (fácil, medio, difícil) con avance secuencial al ganar.
  Un mapa de niveles se puede sumar después sin rehacer el juego.
- Móvil: se juega con toques simples (tap); sin gestos.
- Power-ups: pendientes, se diseñan más adelante.

## 8. Persistencia e idioma (autonomía del juego)

- Cada juego es autónomo: este juego guarda su progreso bajo el prefijo
  `doradofundev.looking4stars.` (puntuación general y nivel desbloqueado) en
  `localStorage`. La web solo guarda el idioma (`doradofundev.lang`).
- El juego traduce sus propios textos con un diccionario propio
  (`i18n.js`, ES completo y EN completo) y reacciona a cambios de idioma en
  vivo vía el evento `storage`.

## 9. Balance (constantes ajustables en `game.js`)

- Velocidad de lanzamiento, gravedad, amortiguación de rebotes.
- Puntos por golpe de durabilidad.
- Bolas iniciales por nivel, cantidad de aliens por nivel.
- Cantidad de asteroides, rango de durabilidad y estrategia de escondite por
  nivel.
- Altura de las cúpulas.

## 10. Alcance futuro (non-goals)

- Power-ups, moneda y canje por bolas/poderes.
- Mapa de niveles, más niveles, editor de niveles.
- Sonido y música.
- Guardado en la nube / cuentas.
