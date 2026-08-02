# Spec del juego — VoleyAsLife

> Documento vivo. Detalla el juego 3 del catálogo.
> La spec general del proyecto vive en `docs/specs.md`; este documento la
> complementa. Lo mantiene el agente `specs`. Lo ejecuta el agente `build`.

## 1. Idea

Juego de gestión + simulación de vóley. Creas tu carrera: nombre, sexo,
número de camiseta, club y posición (punta o armador, fija). Juegas una
eliminatoria de 16 clubs (octavos → cuartos → semifinal → final). El partido
se ve desde arriba y se simula solo con **IA por roles y rotaciones** (vista
tipo Football Manager 2D: los jugadores se mueven y reaccionan según la
jugada); cuando el balón llega a tu posición, elegís la jugada y superás un
minijuego de timing para ejecutarla. Entre partidos mejorás stats y pueden
aparecer adversidades que las cambian.

## 2. Pantalla y presentación

- **Mobile first**, formato vertical (como Looking4Stars).
- Vista desde arriba de una cancha de vóley: jugadores como círculos de
  colores, balón con trayectoria animada.
- **La simulación debe verse como un partido real de vóley (estilizado)**: el
  balón recorre trayectorias variadas con arcos, los **jugadores se mueven
  por rol** (recepción, transición, ataque, bloqueo) y los **equipos rotan**
  al ganar el saque. Nada de movimientos solo verticales ni estáticos.
- Botón de velocidad **×1/×2** durante el partido.
- HUD: marcador (sets y puntos), rival actual, tu posición.

## 3. Creación de carrera

- **Nombre** (texto libre), **sexo** (elección), **número** (1–99).
- **Club:** elegir entre 16 clubs ficticios o asignarlo al azar.
- **Posición** (fija para toda la carrera):
  - **Punta:** recibe y remata. Base inicial mejor en Ataque/Recepción.
  - **Armador:** arma el balón para los atacantes. Base inicial mejor en
    Defensa/Recepción (y el armado).
- **Stats iniciales** (escala 0–10): Saque, Ataque, Recepción, Bloqueo,
  Defensa.

## 4. Torneo (eliminatoria)

- 16 clubs ficticios: **octavos → cuartos → semifinal → final**.
- Partido: **mejor de 3 sets**, cada **set a 15** (diferencia mínima de 2,
  el set se extiende si hace falta).
- **Perder un partido = eliminado** (fin de la carrera; se muestra la
  posición final y el botón de nueva carrera).
- Al ganar: avanzas de ronda. **Entre partidos:** mejora de stats (§8) y
  posible adversidad (§9).
- Los rivales de rondas avanzadas tienen stats más altos (escala por ronda).

## 5. Simulación del partido (IA por roles y rotaciones)

### 5.1 Zonas y rotación

- El campo tiene las **6 zonas estándar de vóley** (numeración 1–6): fila de
  adelante = 4 (izquierda), 3 (centro), 2 (derecha); fila de atrás = 5
  (izquierda), 6 (centro), 1 (derecha, zona de saque).
- Al **ganar el saque** (side-out), el equipo **rota en sentido horario**: cada
  jugador avanza una zona (1→6→5→4→3→2→1). Saca el jugador en zona 1.
- **Ambos equipos rotan** y usan la misma IA. El rival se comporta igual que
  el equipo del jugador.

### 5.2 IA por roles (ambos equipos)

Cada jugador tiene un comportamiento simple según la situación (IA
guionada por rol, no física):

- **Recepción:** el equipo se acomoda en formación de recepción; los que no
  reciben se apartan hacia sus zonas.
- **Transición:** el armador corre hacia la pelota (segunda pelota) y los
  atacantes hacen su aproximación a las zonas 2/4/6 según el armado.
- **Ataque:** el atacante salta/remata hacia la zona elegida.
- **Bloqueo/defensa:** los bloqueadores se alinean en la red hacia la zona
  probable del remate; los de atrás se mueven hacia esa zona.

### 5.3 Resolución del rally

- Cada rally se resuelve por **fases**: saque → recepción → armado → remate →
  bloqueo/defensa, comparando **stats con aleatoriedad**.
- La **decisión del jugador define la zona y la jugada**, y el resultado
  **cascada**: calidad del armado → calidad del remate del atacante de esa
  zona (stat) → defensa rival (bloqueo + posicionamiento).
- El saque es **automático** (resuelto por la stat Saque).
- Cuando el rally llega al momento de **tu posición**, se pausa y aparece:
  1. **Decisión de jugada** atada a la jugada de vóley (§7).
  2. **Minijuego de timing bar** (§6) para ejecutar.
  3. El resultado se incorpora al rally según la cascada.
- (futuro) El saque como momento de decisión.

## 6. Minijuego (timing bar)

- Una barra oscila de un lado a otro; tocas cuando el marcador esté en la
  **zona verde**.
- Las stats influyen: a más stat, **zona verde más ancha** y/o barra más
  lenta.
- **La dificultad también la define la decisión/zona elegida** (§7): rematar
  a una esquina (zonas 1/5) da un minijuego más difícil que a la zona 6.
- **El marcador debe ser claramente visible** (ancho, brillante, con
  puntero), no una línea fina difícil de seguir.
- **Feedback explícito del resultado**: al tocar, el minijuego muestra de
  forma clara si fue éxito o fallo (texto y color: Perfecto/Bien/Regular/
  Fallaste) antes de continuar con el rally. El jugador siempre sabe si ganó
  o perdió la jugada.
- Resultados: zona verde central → éxito pleno; zona verde → éxito; zona
  amarilla → a medias; fuera → fallo.
- (futuro) Otros tipos de minijuego.

## 7. Decisiones de jugada (atadas a la jugada de vóley)

### 7.1 Armador (segunda pelota)

Al armador le toca generalmente en la **segunda pelota**. Opciones:

- **Armar a 2** / **Armar a 4** / **Armar a 6:** elige a qué atacante se le
  pasa (zona 2, zona 4 o pipe de zona 6). El minijuego define la **calidad
  del armado**; luego la **stat de Ataque del atacante de esa zona** decide
  si convierte o si la defensa rival lo defiende.
- **Pasarla de una:** la manda directa sobre la red (sorpresa). Requiere
  timing perfecto; si entra, es punto directo.

### 7.2 Punta

- **Recepción** (minijuego): "Recepción segura" (fácil, buen pase al armador)
  o "Recepción agresiva" (arriesgada; perfecta acelera el ataque).
- **Remate a zona** (minijuego): elige la **zona** del remate — esquinas
  (zonas 1/5), centro (zona 6) o "Suelta/tocar". La zona elegida define la
  **dificultad del minijuego** y qué tan defendible es: rematar a la esquina
  es más difícil pero más difícil de defender.

### 7.3 Cascada del resultado

- La opción define la zona y la jugada; el minijuego decide la ejecución; las
  stats de los implicados (atacante de la zona, bloqueo/defensa rival) deciden
  el desenlace del rally.

## 8. Stats y mejoras

- Stats: **Saque, Ataque, Recepción, Bloqueo, Defensa** (0–10).
- **Entre partidos:** aparecen **3 opciones al azar** de mejora (+1 a una
  stat); eliges 1.
- Las stats influyen en las fases automáticas y en la dificultad del
  minijuego.

## 9. Adversidades (2 ejemplos en v1)

- Aparecen al azar entre partidos (~30% de probabilidad).
- **Ejemplo 1 (negativa):** "Tu mamá criticó al club en redes sociales."
  Elegís: bancarla (pierdes 2 puntos de una stat aleatoria) o defender al
  club (suspensión: no juegas el próximo partido; el equipo usa un suplente,
  sin minijuegos en ese partido).
- **Ejemplo 2 (positiva):** "Un fan te regala una pulsera de la suerte."
  +1 a una stat a elección.
- (futuro) Muchas más adversidades.

## 10. Persistencia e idioma (autonomía del juego)

- Guarda la carrera en `localStorage` bajo `doradofundev.voleyaslife.*`:
  nombre, sexo, número, club, posición, stats y ronda actual (se puede
  retomar).
- i18n propio (`i18n.js`, ES y EN) leyendo `doradofundev.lang` y
  reaccionando a cambios de idioma en vivo.

## 11. Balance (constantes ajustables)

- Puntos del set (15), sets (3).
- Stats iniciales por posición; escala de stats de rivales por ronda.
- Velocidad de la barra y tamaño de zona verde según stat y zona elegida.
- Dificultad de las zonas de remate (esquinas vs. centro) y cascada
  armado→remate→defensa.
- Probabilidad de adversidad (~30%).

## 12. Alcance futuro (non-goals v1)

- Temporada completa con ascenso/descenso.
- Más posiciones (líbero, opuesto, central).
- Más minijuegos y adversidades.
- Saque como decisión.
- Multijugador u online.
- **Realismo visual progresivo** (priorizado, opcional): salto en remate y
  bloqueo, estela de la pelota, más variedad de atacantes/zona, sombra de la
  pelota en el suelo. La base ya simula rotaciones, IA por roles y zonas.

## 13. Estado actual y pendientes para build

**Ya implementado (funciona):** carrera (nombre, sexo, número, club,
posición), torneo eliminatorio, partido con fases y puntuación, decisiones y
minijuego básicos, mejoras 1-de-3, adversidades (mamá y pulsera),
suspensión, persistencia de carrera, i18n ES/EN en vivo, fix de arranque
(btn-play null).

**Pendiente (lo que build debe implementar ahora):**

1. **Simulación real (§2):** trayectorias variadas del balón (saques,
   recepciones, armados, remates sobre la red con arcos) y **jugadores que
   se mueven** hacia la pelota. No más movimientos solo verticales ni
   jugadores estáticos.
2. **Rotaciones y zonas (§5.1):** zonas 1–6, rotación horaria tras
   side-out, ambos equipos, saque desde zona 1.
3. **IA por roles (§5.2):** recepción, transición del armador, aproximación
   de atacantes, bloqueo/defensa. Ambos equipos con la misma IA.
4. **Decisiones atadas (§7):** armador arma a 2/4/6 o pasa de una; punta
   recibe y remata a zona (esquinas 1/5, centro 6, o suelta) con dificultad
   del minijuego según la zona; cascada armado→remate→defensa con stats.
5. **Minijuego pulido (§6):** marcador claramente visible (ancho, puntero,
   glow) y **feedback explícito del resultado** (Perfecto/Bien/Regular/
   Fallaste con color) antes de continuar.
6. **Verificación:** `node --check` en los .js, `npm run build`, chrome
   headless (`--headless --disable-gpu --dump-dom --virtual-time-budget=5000`
   sobre el preview) sin errores de consola, y re-ejecutar las simulaciones
   de `/tmp/opencode/vav-sim.js` (punta) y `vav-sim-armador.js` (armador)
   con resultado OK.
