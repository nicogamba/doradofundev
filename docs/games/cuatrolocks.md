# Spec del juego — cuatrolocks

> Documento vivo. Detalla el juego 4 del catálogo.
> La spec general del proyecto vive en `docs/specs.md`; este documento la
> complementa y es su referencia para todo lo específico del juego.
> Lo mantiene el agente `specs`. Lo ejecuta el agente `build`.

## 1. Idea

Tetris moderno con una vuelta propia: **niveles con construcciones ya
hechas** (tableros a medio jugar) donde tenés que **liberar llaves**
escondidas en los bloques. Sin marcas ni nombres de terceros: nombre propio
**cuatrolocks**. Vertical, mobile-first, sin economía (sin monedas ni tienda).

## 2. Mecánica base (tetris moderno)

- **Piezas:** los 7 tetrominós clásicos (I, O, T, S, Z, J, L), cada uno con su
  color propio.
- **Sorteo:** 7-bag (cada 7 piezas salen las 7 sin repetir) para que nunca
  falte una pieza.
- **Rotación:** sistema SRS (la pieza rota y si no cabe, "empuja" contra las
  paredes — giros cómodos). Rotación en ambos sentidos.
- **SIN pieza fantasma** (no hay sombra de dónde cae).
- **Preview:** solo la **próxima** pieza.
- **Hold (guardar):** una pieza guardada, se intercambia una vez por pieza.
- **Caída:** el **hard drop** (espacio) deja caer la pieza al instante; el
  **soft drop** (flecha abajo) la baja rápido.
- **Formato:** vertical, mobile-first (lienzo lógico ≈ 480×800). En
  escritorio, columna centrada tipo teléfono.

## 3. Tablero y fin del nivel

- Tablero de 10 columnas × 20 filas (estándar).
- **Top-out = perder:** si una pieza no puede entrar por la parte superior,
  el nivel se pierde.
- Al perder, se puede reintentar (los bloques y llaves se regeneran).

## 4. Construcciones pre-hechas y llaves

- Cada nivel empieza con **construcciones ya hechas**: bloques colocados en
  el tablero (patrón definido por nivel), como si el juego estuviera a medio
  jugar. El patrón define la forma (pilares, bolsillos, escaleras) y cuánta
  área ocupa.
- Las **llaves** están escondidas **solo en los bloques de la construcción**
  inicial (las piezas que caen nunca traen llaves). 1 llave por bloque-llave.
- **Liberar una llave:**
  1. Cuando se elimina una línea que contiene la llave, la llave **no se
     elimina**: los demás bloques de la línea desaparecen y la llave queda
     como un bloque especial.
  2. La llave cae **bloque a bloque** (gravedad normal): baja una fila cuando
     no tiene soporte, y puede volver a apoyarse sobre otros bloques (que
     tendrás que eliminar para que siga cayendo).
  3. Recién cuando la llave llega a la **línea más baja** (el piso) queda
     **liberada**: se contabiliza, da puntos y desaparece.
- La llave es **indestructible** por líneas y explosiones (excepto su propia
  liberación al llegar al piso): es el objetivo, no se puede destruir.
- **Visibilidad de las llaves:**
  - En niveles **normales**, las llaves son **siempre visibles**: candado
    dorado sobre el bloque (sabés dónde están).
  - En **niveles jefe** (1 cada 10 niveles: el 10 en el mapa actual), las
    llaves están **ocultas**: no se ve el candado ni cuántas quedan (el
    contador muestra "?"). Hay que eliminar líneas para descubrirlas; el
    nivel se gana automáticamente al liberar la última.
- Visual: la llave es un candado dorado sobre el bloque; al quedar libre, se
  dibuja flotando con un brillo.

## 5. Líneas y poder de explosión

Al eliminar líneas **con un solo toque de pieza**, hay premios según cuántas:

| Líneas en un toque | Premio |
|---|---|
| 1 | sin premio |
| 2 | aparece un **bloque explosivo** → al ser eliminado, **explosión vertical** (columna completa) |
| 3 | bloque explosivo → **explosión 3×3** |
| 4 (tetris) | bloque explosivo → **explosión 5×5** |

- El bloque explosivo aparece en la **columna de la pieza** que completó las
  líneas (si la celda está ocupada, en la celda vacía más baja de esa columna;
  si la columna está llena hasta arriba, no aparece).
- El bloque explosivo se elimina cuando una línea que lo contiene se
  completa: en vez de desaparecer, **explota** al instante.
- La **explosión** destruye todos los bloques dentro de su área (vertical,
  3×3 o 5×5) y **libera las llaves** que estén dentro del área (se cuentan al
  instante, caen hacia el piso y se liberan).
- **Cascada:** si la explosión alcanza otro bloque explosivo, explota también
  (cadena de explosiones).

## 6. Objetivo y fin de nivel

- **Ganar:** liberar **todas las llaves** del nivel. En los niveles jefe (con
  llaves ocultas), el nivel se gana automáticamente al liberar la última.
- **Perder:** top-out (la pila llega arriba) sin haber liberado todas.
- Puntuación por nivel: puntos por líneas (ver §10), puntos por llave
  liberada, y se acumula el mejor puntaje por nivel.

## 7. Mapa de niveles y estrellas (sin economía)

- **Mapa tipo camino (Angry Birds), igual que Looking4Stars:** los niveles
  son nodos en una ruta; se desbloquea el siguiente al ganar el anterior. Es
  la pantalla inicial del juego.
- **Estrellas por nivel (1-3):**
  - ★ 1: ganar (liberar todas las llaves).
  - ★★ 2: ganar sin que la pila pase el 75% del tablero.
  - ★★★ 3: ganar logrando al menos 1 tetris (4 líneas a la vez).
- **Sin economía:** no hay monedas ni tienda de poderes (a diferencia de
  Looking4Stars). Los poderes de explosión vienen de jugar bien (líneas).
- **10 niveles** con dificultad progresiva (ver tabla en §10).
- Resultado al perder: pantalla con "reintentar" y "volver al mapa".

## 8. Controles

- **Teclado:** ← → mover, ↑ rotar, ↓ bajar rápido, **Espacio** caída
  instantánea, **C** guardar pieza (hold). Rotación inversa opcional (Z).
- **Táctil:** botones en pantalla: mover ← →, rotar, bajar, caída
  instantánea y guardar. Botones grandes, aptos para pulgar.
- Pausa (tecla P o botón) durante la partida.

## 9. Persistencia e idioma (autonomía del juego)

- Guarda bajo el prefijo `doradofundev.cuatrolocks.` en `localStorage`:
  - `level` (nivel desbloqueado), `stars` (estrellas por nivel),
    `best` (mejor puntaje por nivel).
  - La web solo guarda el idioma (`doradofundev.lang`).
- El juego traduce sus propios textos con un diccionario propio
  (`i18n.js`, ES y EN completos) y reacciona a cambios de idioma en vivo vía
  el evento `storage`.

## 10. Balance (constantes ajustables en `game.js`)

- **Puntos:** 1 línea = 100, 2 = 300, 3 = 500, 4 = 800; llave liberada
  = 500; bonus de nivel = 1000.
- **Explosiones:** vertical = columna completa; 3×3 y 5×5 en torno al bloque
  explosivo.
- **Velocidad de caída:** progresiva por nivel (fila/s).
- **Niveles (10):**

| # | Dif | Velocidad | Llaves | Construcción |
|---|-----|-----------|--------|--------------|
| 1 | Fácil | baja | 2 | columnas bajas |
| 2 | Fácil | baja | 2 | pilares dispersos |
| 3 | Medio | media | 3 | escaleras bajas |
| 4 | Medio | media | 3 | bolsillos (llaves en el fondo) |
| 5 | Medio | media | 3 | construcción densa |
| 6 | Difícil | alta | 4 | pilares altos con llaves arriba |
| 7 | Difícil | alta | 4 | escaleras + bolsillos |
| 8 | Difícil | alta | 4 | construcción casi llena |
| 9 | Experto | alta | 5 | construcción máxima |
| 10 | **Jefe** | muy alta | 5 | construcción máxima + **llaves ocultas** |

- La forma exacta de cada construcción se define en la data del nivel
  (matriz de bloques + posición de llaves), diseñada a mano o generada con
  reglas (pilares, escaleras, bolsillos).
- **Niveles jefe:** 1 cada 10 niveles (el 10 hoy). Marca `hiddenKeys` en la
  data del nivel: oculta los candados y el contador de llaves.

## 11. Alcance futuro (non-goals)

- Pieza fantasma (descartada a propósito).
- Economía (monedas/tienda) — a propósito fuera de este juego.
- Más modos: maratón sin fin, contrarreloj, modo "solo piezas I".
- Power-ups que caen, modos multijugador.
- Sonido y música.
- Editor de niveles.
