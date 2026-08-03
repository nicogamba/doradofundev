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
- **Cancha legible:** la **red** se dibuja blanca y gruesa (con brillo y
  postes) y cada campo tiene su **línea de 3 metros** punteada a ~93px de la
  red (1/3 del medio campo, `threeM(team) = netY ± 93`) — límite de ataque
  de los zagueros.
- **Atmósfera de estadio:** fondo con gradiente, **gradas llenas** alrededor
  de la cancha (bandas/tiers de colores, sin motas), una **barrera** perimetral,
  publicidad en los costados y un **marcador de estadio** arriba con el
  resultado. La **multitud reacciona** (pulso de luces) en los puntos.
- **El golpe se siente:** la pelota se **aplasta** en cada contacto, la
  **cámara se sacude** sutilmente en remates fuertes, y cada toque muestra un
  **anillo blanco** en el jugador (la **X** solo cuando la pelota toca el
  suelo).
- **Micro-reacciones:** el equipo que pierde el punto **baja los hombros**,
  el bloqueador que bloquea **levanta los brazos**, el que anota festeja
  (salto).
- **Cambio de lado entre sets:** al terminar un set, los equipos **cambian
  de cancha** (`match.sidesFlipped`, la alineación de tu equipo pasa arriba)
  con el aviso "Cambio de lado".
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
  contador). Además del label y los comentarios, el feedback debe ser
  **más visual**:
  - **Banner grande en el centro** "¡PUNTO!" (verde si lo ganó tu equipo,
    rojo/azul si el rival) que aparece y se desvanece.
  - **Destello de color** sobre la cancha (flash breve del color del equipo
    que anota).
  - **El marcador del HUD parpadea** cuando cambia.
  - **El equipo que anota celebra** (sus jugadores saltan).
- **Dos mensajes en secuencia al anotar**: primero **"qué pasó"** (la razón
  del punto como mensaje visual: "¡Tocó la red!", "¡Salió fuera!",
  "¡Bloqueado!", "¡Doble toque!", "¡Punto directo!" para sueltas/pasarlas
  perfectas, etc.) y después **"Punto para X"** (quién lo ganó), y ahí
  continúa el juego. Los avisos deben durar lo suficiente para leerse
  (desvanecido lento, ~1s visible).
- **Aviso de saque**: antes de que el saque salga, un **aviso en el centro
  de la cancha** ("Saque de #X", ~0.7s, con desvanecido) avisa que viene un
  saque; se puede complementar con un anillo/pulso alrededor del sacador.
- **Aproximación antes de decidir**: en los turnos del jugador, primero su
  jugador **corre hasta la pelota** y recién después aparece el menú de
  decisión. La espera debe ser **hasta que el jugador llegue a la pelota**
  (no un tiempo fijo que puede quedar corto): el aviso "es tu turno" no
  aparece mientras el balón esté sobre otro jugador o el jugador aún no
  llegó.
- **Feedback del toque de suelo**: cuando la pelota toca el suelo (punto),
  se marca el lugar del impacto con un efecto visible que se desvanece
  (una "X" o un estallido/anillo en el punto de contacto) y la pelota
  queda reposando brevemente en el suelo durante el aviso del punto antes
  de reiniciar el siguiente saque.
- **Redimensionado por altura**: la pelota se dibuja **más GRANDE en el
  punto más alto del arco** (sensación de proximidad al punto de vista del
  jugador) y a tamaño real cerca del suelo. Perspectiva simple:
  escala = 1 + (altura / alturaMáxima) × factor.
- **Pulido de la simulación (visual):**
  - **Sombra de la pelota en el suelo**: una elipse bajo la pelota que se
    achica cuando la pelota sube (ayuda a leer la altura del arco).
  - **Estela de la pelota**: rastro de círculos que se desvanecen detrás de
    la pelota (ayuda a leer la trayectoria).
  - **Salto en remate y bloqueo**: el atacante y el bloqueador se elevan
    visualmente en el momento del golpe.
  - **Giro de la pelota**: una marca en la pelota que rota durante el vuelo
    (sensación de efecto).
- **Sonido: NO por ahora** (se descarta; en el futuro podría sumarse con
  WebAudio y un botón de silencio).
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
  como en el vóley real): **el jugador se ve parado fuera de la cancha**
  mientras saca y tras el saque se reposiciona a su zona, como todos los
  jugadores tras cada jugada.
- **Ambos equipos rotan** y usan la misma IA. El rival se comporta igual que
  el equipo del jugador.

### 5.2 IA por roles (ambos equipos)

Cada jugador tiene un comportamiento simple según la situación (IA
guionada por rol, no física):

- **Recepción:** el equipo se acomoda en **formación de recepción
  realista (sistema 5-1)**: el armador se retira (el "1", no recibe) y la W
  la forman las **puntas y el opuesto** (receptores): los delanteros se
  bajan de la red (~netY±106, brazos de la W) y los zagueros reciben en sus
  columnas (~netY±134); los **centrales** no reciben (el delantero protege la
  red ~netY±50 y el zaguero cubre su columna trasera).
- **Acomodo antes del saque:** al prepararse el saque, **ambos equipos deben
  estar ya en posición**: el equipo que saca en formación defensiva (a
  cubrir) y el equipo receptor en su **formación de recepción 5-1 W**
  (armador retirado, 3 receptores en W en la trasera, primera fila
  protegiendo). Se arma durante el aviso de saque (que dura ~1.5 s), antes
  de que salga la pelota: `playRally()` llama `setReceiveFormation(receiver)`
  y `setDefenseReady(server)` antes de `doServe()`.
- **Capa reactiva a la pelota (estilo Football Manager):** los jugadores
  **leen la pelota**: un pequeño **offset de dibujo acotado**
  (`ballReact()`, máx ±16 px en X y ±10 px en Y) inclina a cada jugador
  hacia la pelota en cada frame (los de atrás más que la primera fila), sin
  alterar sus posiciones reales — da vida sin romper la lógica del partido.
- **Formaciones de juego en curso:** durante el rally los equipos NO vuelven
  a su posición de rotación; el equipo con la pelota está en **formación de
  ataque** (`setOffenseFormation`) y el rival en **formación defensiva**
  (`setDefenseReady`/`setDefenseFormation`). Solo al empezar cada rally
  (`resetPlayerPositions`) se vuelve a la posición de rotación (alineación).
- **Anticipación (el jugador corre Mientras viene la pelota):** quien va a
  tocar la pelota empieza a correr **durante el vuelo**, no después de que
  cae: el receptor arranca cuando se pega el saque (`doServe` le da el target
  del aterrizaje antes de `playSegment`), el atacante durante el armado, y el
  bloqueo/defensa se desplaza hacia la zona del remate en cuanto se decide la
  zona. La decisión del jugador se pide **en el momento del contacto** (no
  tras caminar hasta el balón).
- **Sin pausas muertas:** el resultado de cada toque se muestra **mientras la
  pelota vuela** (no 0.8 s parados) y los avisos de fallo duran ~0.6 s. El
  flujo es continuo, tipo partido real.
- **Modo destacados (FM):** botón en el HUD que alterna entre "Jugar" (elegís
  cada jugada con modal + minigame) y "Destacados" (el partido se simula solo
  con `autoPhase` para tus toques — sin modales ni minigame, igual que ver
  highlights). Tu jugador sigue siendo el protagonista (usa sus stats y se lo
  ve con aro dorado).
- **Transición:** el armador corre hacia la pelota (segunda pelota) y los
  atacantes hacen su aproximación a las zonas 2/4/6 según el armado.
- **Posicionamiento por rol y por fila (delantera/zaguera):**
  `formationSpot(team, index, state)` toma la **zona actual** (columna +
  delantera 2/3/4 o zaguera 5/6/1) como base y el **rol** define la función
  de cada jugador en la jugada. Sin líbero: la alineación es **2 puntas, 1
  armador, 2 centrales, 1 opuesto**; el **central zaguero** hace la cobertura
  profunda que antes hacía el líbero.
  - **Armador:** su "hogar" es la **red-derecha entre zona 2 y 3** (`setterSpot`)
    para armar — NUNCA retirado al fondo. En ofensiva y defensa se para en
    `setterSpot` (la pelota recibida va hacia ahí). Al **recibir saque** se
    mueve según su rotación (posición legal del 5-1: zaguero detrás de la 3 m,
    delantero en su fila) y **ni bien el rival saca corre a `setterSpot`**.
    En rotación 1 es el sacador (sale de cancha). El spot está **espejado por
    equipo** (su "derecha" es la derecha de pantalla abajo, izquierda arriba).
  - **Puntas y opuesto:** son los receptores/atacantes — delanteros a la red
    en su columna, zagueros al fondo en su columna.
  - **Centrales (jugador central real):**
    - **Delantero + recibe saque:** protege la red al centro (netY±50),
      listo para el **quick**; no recibe.
    - **Delantero + su equipo saca:** a la red a bloquear (su fila).
    - **Zaguero + recibe:** se posiciona en **zona 5** (izquierda-atrás), no
      recibe.
    - **Zaguero + su equipo saca:** **zona 5** (izquierda-atrás), en defensa.
      (El central zaguero SIEMPRE juega en zona 5, sin importar su columna
      de rotación.)
    - **Ataque:** ataca el **quick (zona 3)** — `roleForZone(3)='middle'`,
      `attackerForZone` usa el central delantero (o el jugador si su
      posición es central). El armador IA arma el quick solo con **recepción
      buena + central delantero** (`setZoneChoice` agrega zona 3). El turno
      de remate del jugador central ocurre en zona 3 (`isMyAttack` incluye
      'central').
    - **Bloqueo:** el central delantero es el bloqueador principal (salta y
      se alinea con `blockGuess`).
- **Ataque según fila:** el atacante se elige por rol (4 → punta, 2 → opuesto,
  6 → opuesto/pipe) pero su posición y salto dependen de su fila:
  - **Delantero** → remata en la red con salto.
  - **Zaguero** → el armado va al **último cuarto** (detrás de la línea de
    3 m, `backAttackSpot`) y remata con salto desde ahí (remate de zaguero);
    si el balón se juega corto cerca de la red, el zaguero la toca **sin
    salto** (`jump = isFrontRow(atacante) || balón profundo`).
- **Bloqueo/defensa:** la primera fila arma la **línea de bloqueo** real
  (`frontBlockZone`): **punta → Z4, central → Z3, opuesto → Z2** (con 2
  centrales delanteros, el segundo tapa Z4) en vez de la columna de rotación.
  Luego los delanteros se alinean hacia la zona que el bloqueo **lee** del
  atacante (`blockGuess`, según sus tendencias) y saltan los **centrales
  delanteros**; los zagueros hacen **deslizamiento de zona**: el más cercano
  a la zona del remate cierra (~50%), el lejano se abre (~25%) y el **central
  zaguero** cubre profundo hacia la zona del remate.
- **Cadena de calidad recepción→armado→remate:** la recepción manda el pase
  con **spray** según su calidad (perfecta → exacto al armador; mala → se
  desvía y el armador persigue) y su calidad alimenta el armado; el armado
  alimenta el remate; un buen defensa (dig) alimenta el siguiente armado.
- **El remate cae en la zona:** un remate exitoso aterriza **dentro de la
  zona** (profundo, ~netY±128..162, con dispersión) con **arco plano** (~52)
  — no en la red ni con globo.
- **IA individual por jugador (3 niveles):**
  - **Nivel 1 — Decisiones situacionales:** el armador elige zona por
    ponderación (calidad de recepción, atacante disponible delantero/zaguero,
    sus stats, tendencia y lectura aleatoria acotada — `setZoneChoice`); el
    atacante elige zona de remate leyendo el bloqueo (rematar lejos de la
    columna del set) y su tendencia/agresividad (`hitZoneChoice`); el bloqueo
    lee al atacante (`blockGuess`): si acierta la zona, el remate es más
    difícil (-2.2); si no, más fácil (+0.6).
  - **Nivel 2 — Movimiento con propósito:** el **receptor más cercano** al
    saque sale a recibirlo (no siempre el de zona 6); el deslizamiento de
    zona cubre el hueco cuando un zaguero sale; la lectura reactiva dibuja a
    cada jugador inclinándose hacia la pelota (offset acotado, zagueros más).
  - **Nivel 3 — Identidad por jugador:** cada jugador tiene un **perfil de
    tendencias** (`tend`: zona favorita de armado/remate, agresividad,
    inteligencia) generado de sus stats + azar, que sesga las decisiones. El
    rival se puede **estudiar**: en la pantalla entre-partido aparece un
    **análisis (scouting)** de su juego (dónde arma, dónde remata, riesgo).
- **Bloqueo visible en la red:** el remate debe llegar **visiblemente hasta
  la red** (la zona donde bloquea la primera fila) y ser bloqueado ahí — la
  pelota no debe pasar directo al fondo del campo rival sin pasar por la red.
  Si el bloqueo tiene éxito, la pelota se desvía en la red (la primera fila
  salta a bloquear); si falla, continúa al fondo y la defensa la recupera.
    - El set (armar a 2/4/6) elige al atacante **por rol** (4 → punta,
      2 → opuesto, 6 → opuesto/pipe); el turno de remate del jugador
      ocurre cuando el set va a su zona de rol.
- **Movimiento continuo:** los jugadores se desplazan de forma **visible y
  constante** (nunca se quedan quietos): deriva (lerp) hacia su posición de
  rol en cada frame con velocidad suficiente para notarse, más un pequeño
  balanceo/bamboleo propio (oscilación leve por jugador) que los mantiene
  vivos incluso cuando ya llegaron a su posición. Implementación barata en
  el bucle de dibujo.
- **Movimiento a velocidad constante (no "disparo"):** el movimiento hacia la
  pelota/posición debe ser a **velocidad constante y natural** (correr a un
  ritmo real, ~200px/s), NO un lerp exponencial que da un gran salto inicial
  y parece un disparo. El bamboleo en el lugar debe ser **sutil** (±0.5px),
  no un movimiento visible mientras esperan.
- **Balanceo puramente visual (sin vibración):** el balanceo del jugador en
  el lugar NO debe tocar su posición real (no pelear contra el movimiento):
  se aplica como un **desplazamiento de dibujo** en drawTeam (offset suave
  sin/cos por jugador), de modo que nunca vibre.

### 5.3 Resolución del rally

- Cada rally se resuelve por **fases**: saque → recepción → armado → remate →
  bloqueo/defensa, comparando **stats con aleatoriedad**.
- **Fallos con razón específica**: cuando una fase falla, no basta decir
  "falló" — el comentario y (cuando aplique) la trayectoria de la pelota
  deben indicar el motivo real:  - **Saque:** tocó la red (la pelota corta en la red) · salió fuera (más
    allá de la línea de fondo) · pisó la línea de fondo (no llega a despegar).
  - **Recepción:** salió fuera · cayó al suelo · tocó la red.
  - **Armado:** tocó la red · doble toque del armador.
  - **Remate:** salió fuera · tocó la red · bloqueado por el rival (la pelota
    vuelve hacia el atacante) · invadió la cancha rival.
  - **Defensa:** salió fuera · cayó al suelo · más de 3 toques del equipo.
- **Contador de toques (límite legal de 3):** cada equipo tiene **máximo 3
  toques** por rally; si los supera, el punto es para el rival (razón "más
  de 3 toques"). El flujo debe ser: saque → (recepción → armado → remate)
  → (defensa = 1er toque → armado → remate) → … **La recepción SOLO es el
  primer toque tras el saque**; tras una defensa exitosa el equipo NO vuelve
  a "recepcionar" (serían 4 toques): pasa directo a armado → remate.
- **Probabilidad de bloqueo (con stats de todos los involucrados):** el
  bloqueo se resuelve comparando la **suma del Bloqueo de TODOS los
  bloqueadores de la primera fila** contra el **Ataque del atacante** (+
  calidad del remate + dificultad de la zona). Si el **jugador** bloquea, su
  resultado del **minijuego (0-3) se suma a su stat de Bloqueo** y se compara
  contra las stats del atacante.
- **Física pelota–jugador (la pelota encuentra al jugador):** la pelota vuela
  a una **velocidad según la stat del que le pega** (`ballSpeed(stat)` =
  175 + stat×20 px/s para saque/remate; los **pases** son controlados: la
  **recepción** va a `90 + R×12` px/s con arco 50, el **armado** a `95 +
  (R+calidad)×12` con arco 35 y el **dig** a `70 + calidad×18` con arco 28 —
  nada de curvas ni velocidad de golpe duro en los pases). El jugador que
  debe tocarla corre a **su velocidad** (`moveSpeed` = 165 + D×15 px/s). Hay
  una **carrera** en cada fase de persecución (`raceReaches`): si el jugador
  llega antes que la pelota al punto de contacto, **la toca** y el rally
  sigue; si la pelota llega primero (jugador lento o golpe muy bueno), **la
  pelota toca el suelo** (ace en el saque, set malo si el atacante no llega,
  o remate que entra si el defensor no llega). El saque tiene un **vuelo
  mínimo** (~0.45s) para que el profundo no "zumba". La **calidad** del toque
  sale del margen de la carrera + la stat y alimenta la cadena
  recepción→armado→remate. El pase/remate sale de la **posición real del
  jugador** y cada toque muestra un **anillo blanco** en el jugador (la **X**
  solo cuando la pelota toca el suelo).
- La **decisión del jugador define la zona y la jugada**, y el resultado
  **cascada**: calidad del armado → calidad del remate del atacante de esa
  zona (stat) → defensa rival (bloqueo + posicionamiento).
- El saque es **automático** (resuelto por la stat Saque).
- Cuando el rally llega al momento de **tu posición**, se pausa y aparece:
  1. **Decisión de jugada** atada a la jugada de vóley (§7).
  2. **Minijuego de timing bar** (§6) para ejecutar.
  3. El resultado se incorpora al rally según la cascada.
- (futuro) El saque como momento de decisión.

### 5.4 Movimientos por rol (sistema 5-1 profesional)

Guía definitiva de la IA de cada rol. **K1** = su equipo recibe el saque;
**K2** = su equipo saca. "Antes del saque" respeta la regla de rotación;
"luego del saque" los jugadores se mueven libres a su rol.

**ARMADOR** — base entre zona 2 y 3; no recibe el saque.
- K1 delantero (2/3/4): antes cerca de la red (lo más a la derecha posible
  sin faltar posición); luego → corre a la zona de armado (2-3). Arma y
  cubre el ataque.
- K1 zaguero (1/6/5): antes "escondido" detrás de la línea de 3 m; luego →
  **penetra** (corre) a la zona de armado (2-3) apenas golpea el sacador.
- K2 delantero: antes en la red; luego → permuta a **zona 2** (bloquea por
  la derecha, cubre cortos). Arma el contraataque.
- K2 zaguero: antes detrás de la 3 m (si saca, fuera en zona 1); luego →
  permuta a **zona 1** (defiende); listo para **penetrar** a la red si hay
  freeball o defensa exitosa.

**OPUESTO** — atacante de mayor volumen; base zona 2 (delantero) / zona 1
(zaguero); no recibe el saque.
- K1 delantero: pegado a la red (derecha o centro); luego → zona 2 (o se
  abre fuera por derecha a tomar carrera). Ataca zona 2.
- K1 zaguero: escondido detrás de la 3 m; luego → zona 1, listo para atacar
  **de zaguero por zona 1**.
- K2 delantero: en la red; luego → zona 2 (bloquea derecha). Transición para
  contraatacar por zona 2.
- K2 zaguero: defensa; luego → zona 1 (defiende largos). Transición rápida
  para contraataque zaguero.

**PUNTA** (2 en cancha) — completos: reciben y atacan; base zona 4
(delantero) / zona 6 zaguero (jugada **pipe**).
- K1 delantero: integrado en la línea de recepción (retrocede); luego → si
  recibe, pasa al armador y corre fuera por zona 4 a tomar carrera; si no,
  va directo. Ataca zona 4.
- K1 zaguero: parte principal de la recepción; luego → tras pasar, se prepara
  en el centro detrás de la 3 m. Ataca **pipe (zona 6)**.
- K2 delantero: en la red; luego → zona 4 (bloquea izquierda, cortos).
  Transición para contraatacar.
- K2 zaguero: fondo; luego → zona 6 (centro-fondo). Defiende y contraataca
  pipe.

**CENTRAL** — especialista en ataque rápido y bloqueo; base zona 3;
**reemplazado por el líbero en posiciones zagueras** (excepto al sacar).
- K1 delantero: cerca de la red sin tapar receptores; luego → corre al centro
  de la red (zona 3) para el **primer tiempo** (ataque rápido).
- K1 zaguero: **no está en cancha** (lo reemplaza el líbero).
- K2 delantero: en la red; luego → zona 3 (**lidera el bloqueo**: salta en el
  centro o se mueve a los extremos para bloqueo doble). Contraataque rápido.
- K2 zona 1 (al sacar): fuera sacando; luego → ingresa a defender **zona 5**.
  Al terminar el punto lo reemplaza el líbero.

**LÍBERO** — especialista defensivo; solo juega de zaguero (reemplaza al
central); base zona 5; **no saca, no bloquea ni ataca por encima de la red**.
- K1 zaguero: líder de la línea de recepción (cubre la mayor parte); luego →
  cubre el ataque y va a zona 5. Si el armador defiende el primer toque, el
  líbero arma de manejo (desde atrás de la 3 m).
- K2: espera en zagueros; luego → **zona 5** (defensa principal de diagonales
  y ataques potentes). Asistencia de armado si el armador defiende.

### 5.5 Decisiones de armado (modal del armador) — 4 botones contextuales

El armador arma según la **calidad de la recepción** y la rotación:

- **Botón 1 — Armar a Zona 4:** punta delantero.
- **Botón 2 — Armar a Zona 6 / Pipe:** punta zaguero (pase alto al centro-
  atrás, ataque de zaguero).
- **Botón 3 — Armar Quick a Zona 3:** central delantero (primer tiempo).
- **Botón 4 (dinámico) — Armar al Opuesto:** si el opuesto es delantero →
  **zona 2**; si es zaguero → **zona 1** (ataque zaguero del opuesto, arma
  principal del 5-1).

**Filtro de calidad de recepción:**
- **Pase bueno/perfecto (calidad ≥ 2):** habilitadas las 4 opciones.
- **Pase regular/malo (calidad < 2):** Quick (Z3) y Pipe (Z6) se
  **deshabilitan o fallan automáticamente** — solo pelotas altas a los
  extremos (Z4 y opuesto Z2/Z1).

**Máquina de estados del armador (regla de oro):**
- **K1 (su equipo recibe):** el armador zaguero **penetra** a la red (entre
  Z2 y Z3) apenas el rival golpea el saque — única misión: llegar a tiempo
  para armar. El armador delantero va a la red (Z2-Z3) también.
- **K2 (su equipo sacó):** si el armador es **delantero**, permuta a la red
  **zona 2 a bloquear**; si es **zaguero**, permuta a **zona 1** y se queda a
  defender. **Solo penetra a la red cuando su equipo defendió o hay
  freeball** (si penetrara antes, deja un hueco en la defensa de Z1).
- **Si el armador defiende el primer toque**, la IA asigna el armado al
  **líbero** (de manejo, desde atrás de la 3 m) o a una **punta**.

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
- **Ligas por país:** Argentina, España e Italia con distinto nivel (fuerza
  de clubs y salarios); elegís el país al crear la carrera y podés moverte a
  la liga del país siguiente al salir campeón de la División A.
- **Uso del dinero:** entrenamiento personal (invertís dinero para +1 a una
  stat entre partidos).
- **Más adversidades:** lesión leve (jugar con stats reducidas o descansar)
  y rumores de salida (negarlos o aprovechar la atención).
- **Más posiciones:** opuesto (atacante de zona 2) y central (remate y
  bloqueo). El líbero se deja para más adelante (rol de recambio).

**Futuro (ideas):**

- Sistemas tácticos (5-1 / 6-2) y elección de formación.
- Saque como decisión.
- Más minijuegos y adversidades.
- Retiro y carrera como DT.
- Multijugador u online.
- Realismo visual progresivo (salto, estela, sombra de la pelota).
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
  errores, y simulaciones `/tmp/opencode/vav-sim*.js` (punta, armador,
  opuesto, central) y `/tmp/opencode/vav-sim-watch.js` (modo destacados) con
  resultado OK.
- **Carrera en liga (Fase 1, §4/§8/§9/§10):** liga round-robin de 8 clubs
  (14 fechas) con tabla y campeón (perder no elimina), opción
  **Jugar/Simular** por partido, edad inicial con mejora/declive, salario,
  stats de carrera y palmarés, fin de temporada con "Siguiente temporada".
- **Fase 2 de la carrera (§14):** transferencias con dinero, forma y DT
  (banco con suplente), premios individuales (MVP y máximo anotador),
  divisiones A/B con ascenso/descenso, ligas por país (Argentina/España/
  Italia con progresión), uso del dinero (entrenamiento personal), más
  adversidades (lesión y rumores) y más posiciones (opuesto, central).
- **Pulido de la simulación (§2/§5.2/§5.3):** sombra y estela de la pelota,
  giro, salto en remate/bloqueo, sacador visiblemente fuera de la cancha,
  fallos con razón específica (red, fuera, pie de línea, bloqueo, doble
  toque, más de 3 toques, invasión), bloqueo en la red visible,
  anticipación defensiva, transición deliberada y variedad de formaciones
  de recepción.
- **Posicionamiento por rol × fila (§5.2):** `formationSpot` respeta la
  **delantera/zaguera** real de cada jugador (un zaguero no juega en la red),
  sin líbero (2 puntas, 1 armador, 2 centrales, 1 opuesto; el central
  zaguero cubre el fondo), recepción 5-1 con las puntas/opuesto de
  receptores, remate de zaguero desde el último cuarto (o sin salto cerca de
  la red) y línea de 3 metros + red visible en la cancha.
- **IA individual por jugador (§5.2, 3 niveles):** decisiones situacionales
  (armador elige por recepción+atacante, atacante lee el bloqueo, bloqueo
  lee al atacante con `blockGuess` que afecta el remate), cadena de calidad
  recepción→armado→defensa→armado con spray, remate que cae en la zona con
  arco plano, receptor más cercano, deslizamiento de zona en defensa, perfil
  de **tendencias por jugador** y **scouting del rival** en la pantalla
  entre-partido.
- **IA por rol (sistema 5-1, §5.4/§5.5):** **central real** — ataca el
  **quick (Z3)**, el **central zaguero juega en zona 5**, nunca recibe,
  bloquea (`blockGuess`); zonas de ataque correctas (**punta** Z4 + pipe Z6,
  **opuesto** Z2 + Z1 zaguero, **central** quick Z3) con `attackerForZone`
  según la fila; **armador K1/K2** — K1 penetra a la red a armar, K2 delantero
  **bloquea Z2** / zaguero **defiende Z1** y penetra al recuperar; **modal de
  armado con 4 botones contextuales** (Z4 · Pipe Z6 · Quick Z3 · Opuesto
  dinámico Z2/Z1) y **filtro de calidad**: pase < 2 deshabilita Quick y Pipe.
- **Opuesto no recibe el saque** (§5.4): excluido de `closestReceiver` y de la
  W de recepción (se queda en su base Z2/Z1). **Permutas defensivas K2:** la
  **punta zaguero → Z6** (centro-fondo) y el **opuesto zaguero → Z1**
  (derecha) en la formación defensiva.
- **Balance de la simulación (§5.3):** los compañeros del jugador escalan con
  el **poder de su club** (`teammateStat` usa `clubStats(power)`, ya no fijo
  en 4) y `autoPhase` traduce la diferencia de stats con **efecto moderado**
  (0.055 por punto y techo/piso 0.12-0.88), para que la ventaja de club se
  sienta pero no se vuelva un 8-0: un club fuerte de Div B gana ~5/8 y uno de
  fondo pierde más (el poder del club importa, como en FM).

**Pendiente (Fase 2 de la carrera — futuro):**

- Transferencias con dinero (ofertas según rendimiento, elegir quedarte o
  irte), forma/DT (jugar más o menos partidos según forma y técnico),
  divisiones y ligas múltiples, premios individuales, uso del dinero,
  más adversidades. Ver §14.
- **Complejidad del DT:** hoy es ilustrativo (nombre + figura en el banco);
  luego puede gestionar sustituciones reales y dar indicaciones tácticas.

**Hecho:**

- **Líbero (§5.4):** entra automáticamente por el **central zaguero** (zona
  5 o 6; si el central está en zona 1, saca primero y el líbero ingresa
  después). **El swap se ve antes del saque**: el central aparece en cancha,
  el líbero arranca en el **banco** y corre a zona 5 durante el aviso,
  mientras el central pasa al banco. Solo juega de zaguero, base **zona 5**,
  stats de especialista (R=6/D=6), **no saca, no bloquea ni ataca por encima
  de la red**, es el **receptor principal** (`closestReceiver`). Swap aplicado
  durante el aviso de saque y deshecho antes de rotar (`applyLibero`/
  `undoLibero`). **Banco visible** en la cancha + **DT** con nombre al costado
  y en la pantalla entre-partido.
