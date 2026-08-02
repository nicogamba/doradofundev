# Spec del juego — Cuadritos

> Documento vivo. Detalla el juego 2 del catálogo.
> La spec general del proyecto vive en `docs/specs.md`; este documento la
> complementa. Lo mantiene el agente `specs`. Lo ejecuta el agente `build`.

## 1. Idea

Juego de recolección simple y casual: un cuadrado se mueve con las flechas del
teclado para recoger puntos dorados antes de que se acabe el tiempo. Mantiene
un récord máximo del jugador.

## 2. Pantalla y presentación

- El juego es **horizontal** (lienzo lógico 800×600) y debe verse **completo
  en el marco**: el lienzo se escala con "carta de correo" (mantiene la
  proporción, con barras negras si sobra espacio) y **sin barras de
  desplazamiento** (overflow oculto). Nada de estirar el dibujo.
- HUD superior con **tres columnas**: Puntos · Récord · Tiempo.
  Texto de ayuda al pie.

## 3. Mecánica

- Movimiento con flechas (y WASD como alternativa). El cuadrado no sale de
  los límites.
- **Puntos:** recoger un punto dorado suma 1. Al recogerlo, aparece otro en
  una posición aleatoria.
- **Tiempo:** la partida empieza con 30s. Si llega a 0, la partida termina
  (se muestra la puntuación final y el récord).

## 4. Objeto de bonificación de tiempo

- Cada cierto intervalo **aleatorio** (constante ajustable, ~5–9s) aparece
  un objeto especial (un reloj) en una posición aleatoria.
- Dura **poco tiempo en pantalla** (constante ajustable, ~3s) y desaparece si
  no se recoge: es difícil de atrapar.
- Si el jugador lo recoge: **+2s** de vida (constante ajustable) y se muestra
  un aviso breve "+2s" sobre el objeto.

## 5. Récord máximo

- El récord se guarda en `localStorage` bajo la clave
  `doradofundev.cuadritos.highscore` (autonomía del juego: prefijo propio).
- Se muestra en el HUD desde el inicio de la partida.
- Al terminar la partida, si la puntuación supera el récord, se guarda y se
  avisa "¡Nuevo récord!".

## 6. Idioma (autonomía del juego)

- El juego traduce sus propios textos con un diccionario propio
  (`i18n.js`, ES y EN), leyendo `doradofundev.lang` y reaccionando a cambios
  de idioma en vivo vía el evento `storage`.

## 7. Balance (constantes ajustables en `game.js`)

- Tiempo inicial (30s), bonificación del reloj (+2s).
- Intervalo de aparición del reloj y duración en pantalla (~3s).
- Velocidad del jugador.

## 8. Alcance futuro (non-goals)

- Control táctil para móvil.
- Sonido y efectos visuales mayores.
- Niveles o variantes de dificultad.
