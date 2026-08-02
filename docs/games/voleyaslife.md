# Spec del juego — VoleyAsLife

> Documento vivo. Detalla el juego 3 del catálogo.
> La spec general del proyecto vive en `docs/specs.md`; este documento la
> complementa. Lo mantiene el agente `specs`. Lo ejecuta el agente `build`.

## 1. Idea

Juego de gestión + simulación de vóley con **carrera de jugador** (career
mode). Creas tu carrera: nombre, sexo, número, edad, club y posición (punta
o armador, fija). Juegas **temporadas de liga** (round-robin con tabla de
posiciones y campeón; perder no elimina), con opción de **simular o jugar**
cada partido. El partido se ve desde arriba y se simula solo con **IA por
roles y rotaciones**; cuando el balón llega a tu posición, elegís la jugada y
superás un minijuego de timing. Entre partidos mejorás stats (la **edad**
influye: de joven mejorás más, de mayor declinás), cobrás un **salario** y
pueden aparecer adversidades. Registrás tu **palmarés** (títulos y stats de
carrera).

## 2. Pantalla y presentación

- **Mobile first**, formato vertical (como Looking4Stars).
- Vista desde arriba de una cancha de vóley: jugadores como círculos de
  colores, balón con trayectoria animada.
- **La simulación debe verse como un partido real de vóley (estilizado)**: el
  balón recorre trayectorias variadas con arcos, los **jugadores se mueven
  por rol** (recepción, transición, ataque, bloqueo) y los **equipos rotan**
  al ganar el saque. Nada de movimientos solo verticales ni estáticos.
- **Cada jugador muestra su número de camiseta** en la cancha (el jugador del
  usuario lleva su número elegido; los demás tienen números propios).
- **Comentario de los sucesos**: una línea de texto (tipo Football Manager)
  va comentando el partido con **precisión de jugada por jugada**:
  quién hace cada acción y el desenlace. Ejemplos: "#2 recibe", "#4 levanta
  a zona 6", "#6 remata a zona 5", "#2 no puede recibir — punto para Tu
  equipo". Incluye los fallos con su consecuencia ("no puede recibir/armar/
  rematar/defender — punto para X") y usa el nombre del jugador del usuario
  o el número de camiseta de los demás. **El comentario más reciente va
  arriba** del feed.
- **Feedback del punto**: cuando se anota un punto, se muestra claramente
  quién lo ganó y el marcador antes de continuar (no solo se actualiza el
  contador).
- **Feedback del toque de suelo**: cuando la pelota toca el suelo (punto),
  se marca el lugar del impacto con un efecto visible que se desvanece
  (una "X" o un estallido/anillo en el punto de contacto) y la pelota
  queda reposando brevemente en el suelo durante el aviso del punto antes
  de reiniciar el siguiente saque.
- **Redimensionado por altura**: la pelota se dibuja **más GRANDE en el
  punto más alto del arco** (sensación de proximidad al punto de vista del
  jugador) y a tamaño real cerca del suelo. Perspectiva simple:
  escala = 1 + (altura / alturaMáxima) × factor.
- Botón de velocidad **×1/×2** durante el partido.
- HUD: marcador (sets y puntos), rival actual, tu posición.

## 3. Creación de carrera

- **Nombre** (texto libre), **sexo** (elección), **número** (1–99),
  **edad inicial** (elección, ~18–23; ver §8).
- **Club:** elegir entre los clubs de la liga o asignarlo al azar.
- **Posición** (fija para toda la carrera):
  - **Punta:** recibe y remata. Base inicial mejor en Ataque/Recepción.
  - **Armador:** arma el balón para los atacantes. Base inicial mejor en
    Defensa/Recepción (y el armado).
- **Stats iniciales** (escala 0–10): Saque, Ataque, Recepción, Bloqueo,
  Defensa.

## 4. Liga y temporada (Fase 1)

- **Liga round-robin**: ~8 clubs, todos contra todos a ida y vuelta
  (**14 fechas**), con **tabla de posiciones** y campeón al final.
- **Perder NO elimina**: la temporada sigue y terminás donde te ubiques
  (1º campeón, 2º subcampeón, resto según tabla).
- **Saltear o jugar**: antes de cada partido elegís
  - **Jugar partido**: se juega con decisiones + minijuegos (simulación
    completa).
  - **Simular**: el partido se resuelve automáticamente por stats (sin tus
    turnos ni minijuegos) y se muestra el resultado.
- Al terminar la temporada: palmarés (§9), mejoras/edad (§8), salario
  (§10) y (Fase 2) transferencias.
- (Fase 2) Ascensos/descensos y ligas múltiples.

## 5. Simulación del partido (IA por roles y rotaciones)

### 5.1 Zonas y rotación

- El campo tiene las **6 zonas estándar de vóley** (numeración 1–6): fila de
  adelante = 4 (izquierda), 3 (centro), 2 (derecha); fila de atrás = 5
  (izquierda), 6 (centro), 1 (derecha, zona de saque).
- Al **ganar el saque** (side-out), el equipo **rota en sentido horario**: cada
  jugador avanza una zona (1→6→5→4→3→2→1). Saca el jugador en zona 1.
- **El sacador se ubica FUERA de la cancha** (detrás de la línea de fondo,
  como en el vóley real) y tras el saque se reposiciona a su zona, como
  todos los jugadores tras cada jugada.
- **Ambos equipos rotan** y usan la misma IA. El rival se comporta igual que
  el equipo del jugador.

### 5.2 IA por roles (ambos equipos)

Cada jugador tiene un comportamiento simple según la situación (IA
guionada por rol, no física):

- **Recepción:** el equipo se acomoda en **formación de recepción
  realista**: el armador se retira de la zona de recepción y los receptores
  se distribuyen en la zona trasera (disposición tipo "W"); los que no
  reciben protegen sus zonas.
- **Transición:** el armador corre hacia la pelota (segunda pelota) y los
  atacantes hacen su aproximación a las zonas 2/4/6 según el armado.
- **Ataque:** el atacante salta/remata hacia la zona elegida.
- **Bloqueo/defensa:** los bloqueadores se alinean en la red hacia la zona
  probable del remate; los de atrás se mueven hacia esa zona.
- **Movimiento continuo:** los jugadores se desplazan de forma **visible y
  constante** (nunca se quedan quietos): deriva (lerp) hacia su posición de
  rol en cada frame con velocidad suficiente para notarse, más un pequeño
  balanceo/bamboleo propio (oscilación leve por jugador) que los mantiene
  vivos incluso cuando ya llegaron a su posición. Implementación barata en
  el bucle de dibujo.

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
- **Visualización del rango de éxito**: la barra debe mostrar claramente las
  **tres zonas** y sus límites visibles, para que el jugador sepa dónde
  detenerse según el resultado que busca:
  - zona central (la más chica, color más brillante) → **Perfecto**;
  - zona verde → **Bien**;
  - zona ámbar (la más ancha) → **Regular**;
  - fuera de las zonas → **Fallaste**.
  Las zonas no deben superponerse ni quedar ambiguas: cada una con su color
  y límite definido.
- **Feedback explícito del resultado**: al tocar, el minijuego muestra de
  forma clara si fue éxito o fallo (texto y color: Perfecto/Bien/Regular/
  Fallaste) antes de continuar con el rally. El jugador siempre sabe si ganó
  o perdió la jugada.
- Resultados: zona central → éxito pleno; zona verde → éxito; zona ámbar →
  a medias; fuera → fallo.
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

## 8. Stats, mejoras y edad

- Stats: **Saque, Ataque, Recepción, Bloqueo, Defensa** (0–10).
- **Entre partidos:** aparecen **3 opciones al azar** de mejora (+1 a una
  stat); eliges 1.
- **Edad (Fase 1):** la edad inicial se elige al crear la carrera (~18–23).
  Influye en las mejoras:
  - **Joven (~18–23):** más potencial de mejora (las mejoras entre partidos
    pueden valer más o aparecer más seguido).
  - **De mayor (~30+):** las stats pueden **decaer** con la temporada.
  - La curva exacta (potencial vs. declive) son constantes ajustables.
- Las stats influyen en las fases automáticas y en la dificultad del
  minijuego.

## 9. Stats de carrera y palmarés

- **Stats de carrera** (acumulan entre temporadas): partidos jugados, sets
  ganados, puntos anotados por tus acciones (minijuegos), aces.
- **Palmarés:** títulos ganados (campeonato de liga), subcampeonatos y
  temporadas jugadas por club.
- Se muestran en una pantalla de "carrera" accesible desde el entre-partidos.

## 10. Salario

- El club te ofrece un **salario** (valor que sube con tus stats, tu edad y
  el nivel del club).
- El dinero se **registra** como parte de tu carrera y **condiciona las
  ofertas de transferencia** (Fase 2): clubes con más plata ofrecen más.
- (futuro, a decidir) Uso del dinero: invertir en entrenamiento, patrocinios,
  etc.

## 11. Adversidades (2 ejemplos en v1)

- Aparecen al azar entre partidos (~30% de probabilidad).
- **Ejemplo 1 (negativa):** "Tu mamá criticó al club en redes sociales."
  Elegís: bancarla (pierdes 2 puntos de una stat aleatoria) o defender al
  club (suspensión: no juegas el próximo partido; el equipo usa un suplente,
  sin minijuegos en ese partido).
- **Ejemplo 2 (positiva):** "Un fan te regala una pulsera de la suerte."
  +1 a una stat a elección.
- (futuro) Muchas más adversidades.

## 12. Persistencia e idioma (autonomía del juego)

- Guarda la carrera en `localStorage` bajo `doradofundev.voleyaslife.*`:
  nombre, sexo, número, club, posición, stats y ronda actual (se puede
  retomar).
- i18n propio (`i18n.js`, ES y EN) leyendo `doradofundev.lang` y
  reaccionando a cambios de idioma en vivo.

## 13. Balance (constantes ajustables)

- Puntos del set (15), sets (3).
- **Ritmo del partido**: la velocidad base de las animaciones debe ser
  más lenta que la actual (factor de escala base ~1.35 sobre las
  duraciones), con el botón ×1/×2 que siga acelerando a partir de ahí.
- Stats iniciales por posición; escala de stats de rivales por ronda.
- Velocidad de la barra y tamaño de zona verde según stat y zona elegida.
- Dificultad de las zonas de remate (esquinas vs. centro) y cascada
  armado→remate→defensa.
- Probabilidad de adversidad (~30%).

## 14. Alcance futuro (non-goals v1) — Fase 2 de la carrera

**Ya implementado en Fase 2:**

- **Transferencias con dinero:** al fin de temporada, ofertas de otros
  clubes (distinto nivel y más/menos salario) según tu rendimiento; elegís
  quedarte o irte.
- **Forma y DT:** stat de forma que sube con victorias y baja con derrotas;
  según la forma y la edad, el DT a veces te deja en el banco (el partido se
  simula con suplente, sin tus turnos).
- **Premios individuales:** MVP de la temporada y máximo anotador, guardados
  por temporada en el palmarés.
- **Divisiones A/B con ascenso y descenso:** dos divisiones sobre un pool de
  16 clubs (A más fuerte, B más débil); empezás en B; campeón de B asciende
  a A, último de A desciende a B; transferencias dentro de tu división.

**Pendiente de Fase 2 (futuro):**

- **Ligas de distinto nivel (países):** Argentina, España, Italia… (elegir
  liga o progresar entre ellas).
- **Uso del dinero** (a decidir): invertir en entrenamiento, patrocinios, etc.
- Más adversidades.
- Más posiciones (líbero, opuesto, central).
- **Sistemas tácticos (5-1 / 6-2) y elección de formación**: capa táctica
  que define quién arma según la rotación. No por ahora; el armador ya
  decide a qué zona pasa.
- Más minijuegos y adversidades.
- Saque como decisión.
- Multijugador u online.
- **Realismo visual progresivo** (priorizado, opcional): salto en remate y
  bloqueo, estela de la pelota, más variedad de atacantes/zona, sombra de la
  pelota en el suelo. La base ya simula rotaciones, IA por roles y zonas.

## 15. Estado actual y pendientes para build

**Ya implementado (funciona):**

- Carrera (nombre, sexo, número, club, posición), torneo eliminatorio,
  partido con fases y puntuación, decisiones y minijuego, mejoras 1-de-3,
  adversidades (mamá y pulsera), suspensión, persistencia de carrera, i18n
  ES/EN en vivo, fix de arranque (btn-play null).
- **Simulación real (§2):** trayectorias variadas del balón y jugadores que
  se mueven hacia la pelota (nada de solo vertical).
- **Rotaciones y zonas (§5.1):** zonas 1–6, rotación horaria tras side-out,
  ambos equipos, saque desde zona 1.
- **IA por roles (§5.2):** recepción, transición del armador, aproximación
  de atacantes, bloqueo/defensa. Ambos equipos con la misma IA.
- **Decisiones atadas (§7):** armador arma a 2/4/6 o pasa de una; punta
  recibe y remata a zona (esquinas 1/5, centro 6, o suelta) con dificultad
  del minijuego según la zona; cascada armado→remate→defensa con stats.
- **Minijuego pulido (§6):** marcador visible (ancho, puntero, glow) y
  feedback explícito del resultado antes de continuar.
- **Feedback del punto, comentarios y números (§2):** label claro del punto
  ganador + marcador; feed de comentarios (saque, ace, recepción, armado a
  zona, remate a zona, bloqueo, defensa, punto) con nombre del jugador o
  #número; números de camiseta de cada jugador en la cancha.
- **Comentarios precisos (§2):** jugada por jugada con desenlaces ("no puede
  recibir — punto para X"), el más reciente arriba.
- **Movimiento y posicionamiento (§5.1/§5.2):** formación de recepción
  realista (armador se retira, receptores en la trasera), movimiento
  continuo (jugadores derivan hacia su rol en cada frame) y sacador que se
  ubica fuera de la cancha y se reposiciona.
- **Feedback del toque de suelo (§2):** X + anillo que se desvanece en el
  impacto y la pelota reposa durante el aviso del punto.
- **Redimensionado por altura (§2):** la pelota se ve más chica en el punto
  más alto del arco.
- **Verificación:** `node --check`, `npm run build`, chrome headless sin
  errores, y simulaciones `/tmp/opencode/vav-sim.js` (punta) y
  `vav-sim-armador.js` (armador) con resultado OK.
- **Carrera en liga (Fase 1, §4/§8/§9/§10):** liga round-robin de 8 clubs
  (14 fechas) con tabla y campeón (perder no elimina), opción
  **Jugar/Simular** por partido, edad inicial con mejora/declive, salario,
  stats de carrera y palmarés, fin de temporada con "Siguiente temporada".
- **Fase 2 de la carrera (§14):** transferencias con dinero (ofertas según
  rendimiento, quedarte o irte), forma y DT (a veces te toca banco con
  suplente), premios individuales (MVP y máximo anotador), divisiones A/B
  con ascenso/descenso.

**Pendiente (Fase 2 de la carrera — futuro):**

- Transferencias con dinero (ofertas según rendimiento, elegir quedarte o
  irte), forma/DT (jugar más o menos partidos según forma y técnico),
  divisiones y ligas múltiples, premios individuales, uso del dinero,
  más adversidades. Ver §14.
