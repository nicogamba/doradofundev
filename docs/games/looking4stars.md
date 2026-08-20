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
Los niveles se eligen desde un **mapa** con estrellas, y los **poderes** se
compran con monedas.

## 2. Mecánica base

- **Lanzador:** fijo arriba, centrado. El jugador hace clic o toca cualquier
  punto de la pantalla; la bola sale disparada hacia ese punto (solo importa
  la dirección, no la fuerza). La gravedad curva la trayectoria.
- **Bolas:** cada lanzamiento gasta una bola. Se empieza cada nivel con un
  número de bolas definido por nivel (3 típicamente, 2 en niveles avanzados).
- **Formato:** vertical, mobile-first (lienzo lógico ≈ 480×800). En
  escritorio la web lo muestra en una columna centrada tipo teléfono.

## 3. Asteroides (elementos destructibles)

- La bola rebota contra ellos; cada rebote resta 1 de durabilidad.
- Durabilidad de 1 a 3 golpes; el **color distingue la durabilidad**:
  verde (1), ámbar (2), rojo (3).
- Al llegar a 0, el asteroide se destruye y suma puntos a la bola en vuelo.
- Visual: rocas irregulares con cráteres, manteniendo el color por durabilidad.

## 4. Agujeros y cúpulas

- **5 agujeros** repartidos en el ancho inferior, con anchos según el premio
  (de mayor a menor):
  - Agujeros 0 y 4 (los más anchos): puntos ×1.
  - Agujeros 1 y 3 (medianos): puntos ×2.
  - Agujero 2 (el central, el más angosto): puntos ×1 y devuelve la vida
    gastada.
- **Anchos y cúpulas por nivel:** los niveles avanzados **angostan los
  agujeros centrales** y **elevan las cúpulas** (semi-elipses que desvían la
  bola con rebotes impredecibles). Ambos se configuran por nivel.
- La bola siempre termina cayendo en uno de los 5 agujeros (resuelto por
  gravedad, rebotes y un resguardo anti-atasco que la envía al agujero más
  cercano).

## 5. Puntuación y monedas

- Los puntos que acumuló la bola en vuelo (asteroides destruidos) se
  multiplican por el factor del agujero (×1 o ×2) y se suman a la
  **puntuación general**, que se acumula entre niveles.
- **Monedas** (economía del juego, ver §7):
  - **Ganar un nivel:** +10 monedas.
  - **Cada estrella extra:** +5 monedas (3 estrellas = +15).
  - Se muestran en el mapa y en el HUD del nivel.
- La puntuación general se guarda y se muestra como récord en el mapa.

## 6. Aliens y objetivo

- Cada nivel define cuántos aliens hay que rescatar (3 a 5 según el nivel).
- Los aliens están **escondidos en asteroides elegidos según la estrategia
  del nivel** (1 alien por asteroide). Al destruir el asteroide, el alien se
  libera y se contabiliza automáticamente (la caída visual es solo estética).
- **Ganar:** rescatar a todos los aliens del nivel (dentro del tiempo, si el
  nivel tiene límite de tiempo).
- **Perder:** la última bola entra en un agujero sin devolver vida y quedan 0
  bolas sin haber rescatado a todos los aliens (o se agota el tiempo).
- Al reintentar, los aliens se re-posicionan en otros asteroides (aleatorio).

## 7. Mapa de niveles, estrellas y monedas

- **Mapa tipo camino (Angry Birds):** los niveles son nodos en una ruta; se
  **desbloquea el siguiente al ganar el anterior**. Es la pantalla inicial
  del juego (reemplaza al arranque directo en nivel 1).
- **40 niveles en 4 mundos × 10:** el mapa agrupa los niveles en **4 mundos**
  de 10. Se navega entre mundos con las **flechas ◀ ▶** (o tocando los
  costados de la barra inferior). Cada mundo usa el mismo layout de camino.
  El desbloqueo secuencial cruza los mundos (ganar el nivel 10 desbloquea el
  11, etc.).
- **Estrellas por nivel (1-3):**
  - ★ 1: completar el nivel (rescatar todos los aliens).
  - ★★ 2: ganar con al menos 1 bola sin gastar.
  - ★★★ 3: ganar con al menos 2 bolas sin gastar.
  - El total de estrellas acumuladas se muestra en el mapa.
- **Tienda de poderes en el mapa:** antes de empezar un nivel podés comprar
  poderes con monedas (precios en §10). Cada compra agrega **una unidad** de
  ese poder: comprar 3 multibola da **3 usos**. Las existencias se conservan
  entre niveles y cada uso descuenta 1.
- **Resultado al perder:** pantalla con "reintentar" y "volver al mapa".
- **Progresión:** dificultad creciente con asteroides (cantidad y
  durabilidad), aliens a rescatar (hasta 6), bolas, estrategia de escondite,
  altura de cúpulas y anchos de agujeros (tabla en §10). Varios niveles
  (jefe) tienen **regla especial de tiempo limitado** (pierde si se acaba el
  tiempo aunque le queden bolas).

## 8. Poderes

Se activan desde el **HUD durante la partida** (un botón por poder). Cada
pulsación consume **una unidad** del poder (las existencias se compran en el
mapa, ver §7). Solo se pueden activar cuando no hay una tabla activa.

- **Multibola (20 monedas):** **multiplica las bolas en vuelo**. Cada
  pulsación **duplica las bolas activas** en su posición actual (1 → 2, 3 →
  6) y gasta 1 unidad. No actúa si no hay ninguna bola en vuelo (no lanza
  desde el lanzador).
- **Explosión (30 monedas):** la bola que impacta un asteroide **explota y
  daña todos los asteroides en un radio** (incluido el impactado, -1
  durabilidad a cada uno). El radio se configura en §10. **Se arma al
  presionar su botón** y se consume al lanzar.
- **Tabla (25 monedas):** aparece una **tabla tipo Arkanoid** flotando sobre
  los agujeros durante unos segundos (~6 s, ancho configurable). Mientras
  dura, la bola que cae **rebota en la tabla y vuelve a subir** (no entra en
  ningún agujero, no se pierde la bola). **Se activa al presionar su botón.**
  Se mueve con las **flechas ← →** o **tocando/manteniendo** el costado
  izquierdo/derecho **relativo a la tabla** (la tabla va hacia el lado del
  toque).
- **A futuro:** la tabla se podrá **upgradeear en anchura y tiempo de vida**.

## 9. Persistencia e idioma (autonomía del juego)

- Cada juego es autónomo: este juego guarda su progreso bajo el prefijo
  `doradofundev.looking4stars.` en `localStorage`:
  - `level` (nivel desbloqueado), `stars` (estrellas por nivel), `coins`
    (monedas), `score` (puntuación general/récord), `powers` (existencias de
    cada poder comprado, se conservan entre niveles).
  - La web solo guarda el idioma (`doradofundev.lang`).
- El juego traduce sus propios textos con un diccionario propio
  (`i18n.js`, ES completo y EN completo) y reacciona a cambios de idioma en
  vivo vía el evento `storage`.

## 10. Balance (constantes ajustables en `game.js`)

- Velocidad de lanzamiento, gravedad, amortiguación de rebotes.
- Puntos por golpe de durabilidad.
- **Monedas:** ganar nivel +10, cada estrella extra +5. Precios: multibola
  20, explosión 30, tabla 25.
- **Poderes:** multibola multiplica las bolas en vuelo (duplica cada pulsación);
  explosión radio ~60 px; tabla duración ~6 s y ancho ~160 px.
- **Niveles (40, en 4 mundos de 10):** los valores de cúpulas/agujeros son
  relativos a la base (0% = base, −30% = agujeros más angostos, +100% =
  cúpulas más altas). Los niveles con "tiempo" tienen límite de tiempo.

| # | Dif | Bolas | Aliens | Asteroides | Durabilidad | Estrategia | Cúpulas | Agujeros | Nota |
|---|-----|-------|--------|-----------|-------------|-----------|---------|----------|------|
| 1 | Fácil | 3 | 3 | 18 | [1,1,1] | débil | base | base | |
| 2 | Fácil | 3 | 3 | 20 | [1,1,2] | débil→aleat. | base | base | |
| 3 | Medio | 3 | 3 | 22 | [1,2,2] | aleatoria | base | base | |
| 4 | Medio | 3 | 3 | 24 | [1,2,2] | aleatoria | +20% | base | |
| 5 | Difícil | 3 | 4 | 26 | [2,3,3] | fuerte | base | base | |
| 6 | Difícil | 3 | 4 | 28 | [2,3,3] | fuerte | +40% | −10% | |
| 7 | Experto | 3 | 4 | 30 | [2,3,3] | fuerte | base | −15% | |
| 8 | Experto | 2 | 5 | 30 | [2,3,3] | fuerte | +60% | −20% | |
| 9 | Jefe | 3 | 5 | 32 | [3,3,3] | fuerte | +40% | −15% | tiempo 45 s |
| 10 | Maestro | 2 | 5 | 34 | [3,3,3] | fuerte | +60% | −25% | |
| 11 | Difícil | 3 | 5 | 34 | [2,3,3] | fuerte | +40% | −25% | |
| 12 | Difícil | 3 | 5 | 35 | [2,3,3] | fuerte | +50% | −30% | |
| 13 | Experto | 3 | 5 | 36 | [2,3,3] | fuerte | +50% | −32% | |
| 14 | Experto | 2 | 5 | 36 | [3,3,3] | fuerte | +50% | −32% | |
| 15 | Experto | 2 | 5 | 37 | [3,3,3] | fuerte | +60% | −35% | |
| 16 | Experto | 2 | 5 | 38 | [3,3,3] | fuerte | +60% | −38% | |
| 17 | Jefe | 2 | 6 | 38 | [3,3,3] | fuerte | +60% | −38% | |
| 18 | Jefe | 2 | 6 | 39 | [3,3,3] | fuerte | +70% | −40% | |
| 19 | Jefe | 2 | 6 | 39 | [3,3,3] | fuerte | +70% | −42% | |
| 20 | Jefe | 2 | 6 | 40 | [3,3,3] | fuerte | +70% | −45% | **tiempo 40 s** |
| 21 | Experto | 2 | 6 | 40 | [3,3,3] | fuerte | +70% | −40% | |
| 22 | Experto | 2 | 6 | 40 | [3,3,3] | fuerte | +75% | −42% | |
| 23 | Experto | 2 | 6 | 40 | [3,3,3] | fuerte | +75% | −44% | |
| 24 | Jefe | 2 | 6 | 40 | [3,3,3] | fuerte | +80% | −45% | |
| 25 | Jefe | 2 | 6 | 40 | [3,3,3] | fuerte | +80% | −47% | |
| 26 | Jefe | 2 | 6 | 40 | [3,3,3] | fuerte | +80% | −50% | tiempo 45 s |
| 27 | Jefe | 2 | 6 | 40 | [3,3,3] | fuerte | +85% | −48% | |
| 28 | Jefe | 2 | 6 | 40 | [3,3,3] | fuerte | +85% | −50% | |
| 29 | Jefe | 2 | 6 | 40 | [3,3,3] | fuerte | +90% | −50% | |
| 30 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +90% | −52% | **tiempo 45 s** |
| 31 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +90% | −50% | |
| 32 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +90% | −50% | tiempo 45 s |
| 33 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +95% | −52% | |
| 34 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +95% | −52% | tiempo 45 s |
| 35 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +100% | −55% | |
| 36 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +100% | −55% | tiempo 40 s |
| 37 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +100% | −55% | |
| 38 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +100% | −58% | |
| 39 | Maestro | 2 | 6 | 40 | [3,3,3] | fuerte | +100% | −58% | tiempo 40 s |
| 40 | Jefe | 2 | 6 | 40 | [3,3,3] | fuerte | +100% | −60% | **tiempo 45 s** |

## 11. Alcance futuro (non-goals)

- Upgrade de la tabla (anchura y tiempo de vida).
- Más poderes (tiempo lento, línea guía, bola extra, reintento, perforante).
- Más niveles y niveles con otras reglas especiales (solo bolas dobles,
  asteroides regenerantes, etc.).
- Editor de niveles.
- Sonido y música.
- Guardado en la nube / cuentas.
