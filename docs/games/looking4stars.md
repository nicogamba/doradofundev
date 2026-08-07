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
- **Estrellas por nivel (1-3):**
  - ★ 1: completar el nivel (rescatar todos los aliens).
  - ★★ 2: ganar con al menos 1 bola sin gastar.
  - ★★★ 3: ganar con al menos 2 bolas sin gastar.
  - El total de estrellas acumuladas se muestra en el mapa.
- **Tienda de poderes en el mapa:** antes de empezar un nivel podés comprar
  poderes con monedas (precios en §10). El poder comprado se consume al
  activarse durante ese nivel; no se acumulan entre niveles.
- **Resultado al perder:** pantalla con "reintentar" y "volver al mapa".
- **Niveles (10):** progresión de dificultad con asteroides (cantidad y
  durabilidad), aliens a rescatar, bolas, estrategia de escondite, altura de
  cúpulas y anchos de agujeros (tabla en §10). El **nivel 9** tiene
  **regla especial de tiempo limitado** (pierde si se acaba el tiempo aunque
  le queden bolas).

## 8. Poderes

Se activan **antes del lanzamiento** (botón en pantalla); el lanzamiento
siguiente usa el poder. Se compran con monedas y se consumen al usarlos.

- **Multibola (20 monedas):** el lanzamiento suelta 3 bolas a la vez en
  abanico. Cada bola tiene su propia física y rebotes; todas suman hacia el
  objetivo.
- **Explosión (30 monedas):** la bola que impacta un asteroide **explota y
  daña todos los asteroides en un radio** (incluido el impactado, -1
  durabilidad a cada uno). El radio se configura en §10.
- **Tabla (25 monedas):** aparece una **tabla tipo Arkanoid** flotando sobre
  los agujeros durante unos segundos (~6 s, ancho configurable). Mientras
  dura, la bola que cae **rebota en la tabla y vuelve a subir** (no entra en
  ningún agujero, no se pierde la bola). Se mueve con las **flechas ← →** o
  **manteniendo presionado** el costado izquierdo/derecho de la pantalla.
- **A futuro:** la tabla se podrá **upgradear en anchura y tiempo de vida**.
- Solo se pueden activar cuando hay bolas disponibles y no hay una bola en
  vuelo.

## 9. Persistencia e idioma (autonomía del juego)

- Cada juego es autónomo: este juego guarda su progreso bajo el prefijo
  `doradofundev.looking4stars.` en `localStorage`:
  - `level` (nivel desbloqueado), `stars` (estrellas por nivel), `coins`
    (monedas), `score` (puntuación general/récord).
  - La web solo guarda el idioma (`doradofundev.lang`).
- El juego traduce sus propios textos con un diccionario propio
  (`i18n.js`, ES completo y EN completo) y reacciona a cambios de idioma en
  vivo vía el evento `storage`.

## 10. Balance (constantes ajustables en `game.js`)

- Velocidad de lanzamiento, gravedad, amortiguación de rebotes.
- Puntos por golpe de durabilidad.
- **Monedas:** ganar nivel +10, cada estrella extra +5. Precios: multibola
  20, explosión 30, tabla 25.
- **Poderes:** multibola 3 bolas en abanico; explosión radio ~60 px;
  tabla duración ~6 s y ancho ~160 px.
- **Niveles (10):**

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
| 9 | Jefe | 3 | 5 | 32 | [3,3,3] | fuerte | +40% | −15% | **tiempo 45 s** |
| 10 | Maestro | 2 | 5 | 34 | [3,3,3] | fuerte | +60% | −25% | |

## 11. Alcance futuro (non-goals)

- Upgrade de la tabla (anchura y tiempo de vida).
- Más poderes (tiempo lento, línea guía, bola extra, reintento, perforante).
- Más niveles y niveles con otras reglas especiales (solo bolas dobles,
  asteroides regenerantes, etc.).
- Editor de niveles.
- Sonido y música.
- Guardado en la nube / cuentas.
