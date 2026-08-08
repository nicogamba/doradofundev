# Estigia — spec del juego

> Roguelike táctico por turnos. **Nombre decidido: Estigia.**
> Mecánica, niveles y balance. Lo mantiene el agente `specs`, lo ejecuta `build`.

## 1. Concepto

Bajás al inframundo griego a través de 4 pisos generados al azar. Cada piso es
un tablero por turnos: vos movés un paso, los enemigos mueven después. Mientras
descendés armás tu build con **stats, equipo y habilidades** (estilo Diablo 2)
y en el piso 4 enfrentás a **Cerbero**, el perro de tres cabezas que custodia
las puertas del Tártaro.

El "rol" sale de dos lados: el **botín y las builds** (cada partida podés armar
un personaje distinto) y el **combate táctico por turnos** (cada decisión de
posición cuenta, como en el ajedrez).

## 2. Cómo se juega (para alguien nuevo)

Estás parado en un tablero cuadriculado que es la mazmorra. Con las flechas (o
tocando una casilla) te movés un paso a la vez. Todo es por turnos: cuando vos
hacés tu movimiento, los monstruos hacen los suyos. Bajás pisos buscando la
escalera, conseguís armas y armaduras cada vez mejores, subís de nivel y
repartís puntos en tus habilidades. Si llegás al piso 4 y vencés a Cerbero,
ganaste. Si morís, depende del modo que elegiste al empezar: reaparecés en la
entrada (modo Héroe) o la partida termina (modo Mortal).

## 3. Mecánica central

### 3.1 Grid y turnos

- Grid cuadrado de ~19×19 casillas por piso (constante ajustable).
- Movimiento en 8 direcciones (incluye diagonal). Una acción por turno:
  moverse, atacar, usar habilidad o esperar.
- Orden del turno: primero el jugador, después los enemigos visibles.
- **Visión:** el jugador ve en un radio de ~7 casillas; lo ya explorado queda
  en memoria (niebla de guerra). Los enemigos solo se mueven si te ven
  (persiguen en línea de vista; patrullan si no).

### 3.2 Pisos y generación

- **4 pisos** generados proceduralmente: salas conectadas por pasillos, muros
  sólidos y la escalera al siguiente piso en una sala lejana.
- Cada piso sube la dificultad: enemigos más fuertes y mejor botín.
- **Piso 4:** arena fija con el jefe **Cerbero** + sirvientes (élite).
- Generación aleatoria: cada partida es distinta.

### 3.3 Combate

- **Melee:** atacar a una casilla adyacente. **Distancia:** arco o magia con
  línea de vista y rango limitado.
- Daño simple: `daño = ataque del personaje − defensa del enemigo` (mínimo 1).
  Fórmula ajustable, no fija.
- Críticos y esquivas según stats y habilidades.
- **Estados de estatus (v1):**
  - **Veneno:** daño por turno durante X turnos.
  - **Quemadura:** daño extra inmediato (+ daño menor por turno).
  - **Aturdido/Congelado:** el afectado saltea turnos.
  - Las **tres cabezas de Cerbero** aplican sus estados (fuego = quemadura,
    hielo = congelado, veneno = veneno). Los estados también pueden salir de
    habilidades (p. ej. Hielo de Perséfone ya congela) y de ítems con daño
    elemental.

### 3.4 Stats y nivel

- Stats estilo Diablo 2: **Fuerza, Destreza, Vitalidad, Energía** (maná).
- Matar enemigos y bajar pisos da **XP**; al subir de nivel: +puntos de stats
  para repartir y +1 punto de habilidad.
- Vida y maná se regeneran al esperar/descansar (regla simple).

### 3.5 Equipo y botín (estilo Diablo 2)

- **Ranuras:** arma, casco, armadura, botas, anillo, amuleto.
- **Rarezas:** común (blanco) < mágico (azul) < raro (amarillo) < único
  (naranja, con nombre propio de la mitología, ej. "Espada de Aquiles").
- **Afijos aleatorios** según rareza (1 a 4): +stat, +% daño, daño elemental,
  +vida/maná, resistencia, velocidad, robo de vida, etc.
- Se encuentra en cofres, enemigos caídos y el piso; se equipa o se suelta.
- **Tienda de Caronte (v1):** al bajar de piso, el barquero de la Estigia te
  vende equipo a cambio de oro (ítems generados, con rarezas y precios según
  el piso). El oro cae de enemigos y cofres y se gasta acá.

### 3.6 Clases y árboles de habilidades

| Clase | Stat principal | Estilo | Ramas del árbol (prototipo) |
|---|---|---|---|
| **Espartano** | Fuerza | Melee con escudo | Golpe poderoso (daño), Falange (defensa), Furia (berzerker) |
| **Mago de Hecate** | Energía | Magia a distancia | Fuego, Rayo, Control (hielo/atrapar) |
| **Pícaro de Hermes** | Destreza | Velocidad y crítico | Cuchillas, Arco, Esquiva/Velocidad |

- **9 habilidades por clase** (decidido): 3 ramas × 3 habilidades. Cada rama
  tiene 1 habilidad de nivel 1 y 2 que se desbloquean con nivel y puntos.
- Se gasta 1 punto de habilidad por nivel para desbloquear/subir habilidades.

### 3.7 Modos de juego (se eligen al crear la partida)

- **Héroe:** al morir reaparecés en la entrada de la mazmorra. Conservás
  niveles y equipo, perdés la mitad del oro; el piso vuelve a generarse.
- **Mortal:** muerte permanente. La partida queda marcada como "caída" y se
  borra. Lo que desbloqueaste queda (progreso meta).

## 4. Progreso meta (lo que queda entre partidas)

- **Récords por clase:** piso alcanzado, enemigos derrotados, jefes vencidos.
- **Colección/bestiario:** ítems únicos y enemigos descubiertos.
- **Récords globales (decisión tomada):** cuando exista backend, se suman
  récords online (top de jugadores). El guardado local se diseña para que
  luego se pueda enviar sin reescribirlo.
- Futuro: dificultad extra, gemas/encajes, nuevas clases.

## 5. Controles

- **Teclado:** flechas o ESDF para moverse/atacar; esperar (tecla dedicada);
  habilidades (1-9); inventario (I); equipar/soltar (E o clic).
- **Ratón:** clic en una casilla = moverte o atacar.
- **Táctil:** tocar una casilla = moverte o atacar; botones de habilidades.
- Pausa (P o Esc).

## 6. Persistencia e i18n

- `doradofundev.estigia.save`: partida activa (piso, personaje, equipo, modo).
- `doradofundev.estigia.meta`: récords y colección.
- i18n ES/EN propio dentro de la carpeta del juego, leyendo
  `doradofundev.lang` (igual que los otros juegos).

## 7. Balance (constantes ajustables, no fijas)

Grid 19×19, visión 7, 4 pisos, daño = ataque − defensa, rarezas con 1-4
afijos, 1 punto de habilidad por nivel, XP por enemigo/piso. Todos los números
se afinan jugando; esta spec no fija valores definitivos.

## 8. Pisos (temática griega)

1. **Puerta del inframundo** — sombras y ratas gigantes. Tutorial implícito.
2. **Llanura de Asfódelos** — espectros y arpías. Más botín mágico.
3. **Camino al Tártaro** — gorgonas y furias. Más ítems raros.
4. **Puertas del Tártaro** — arena del jefe: **Cerbero** (cabeza de veneno =
   veneno, fuego = quemadura, hielo = congelado) + sirvientes.

## 9. Fuera de alcance (fase 2+)

Gemas y encajes, más pisos y clases, historia con diálogos, sonido, récords
globales/backend (decidido como futuro).

## 10. Preguntas abiertas y trabajo pendiente

### Arte y presentación (dirección decidida)

- **Tileset dibujado:** piso, muros, escalera y puertas con textura propia
  (no rectángulos lisos). Se dibujan por código en canvas, sin archivos
  externos; más adelante se pueden reemplazar por PNG si hace falta.
- **Sprites de personajes:** jugador (uno distinto por clase) y enemigos con
  cuerpo, ojos, armas y detalle, dibujados proceduralmente en canvas
  (reemplazables por PNG en el futuro).
- **Fluidez (crítico):** el movimiento actual salta de casilla en casilla y
  no se entiende. Se implementa **interpolación suave** (lerp) entre casillas
  para cada acción de movimiento/ataque.
- **Animaciones mínimas:** parpadeo rojo y números de daño flotantes al
  golpear, animación de ataque (embestida del que ataca), iconos de estado
  (veneno, fuego, hielo) sobre el afectado, animación al recoger ítems y al
  bajar la escalera.
- **Paleta definida por piso:**
  1. Piso 1 — **gris pétreo** (muros de piedra del inframundo).
  2. Piso 2 — **azul espectral** (bruma de la llanura de Asfódelos).
  3. Piso 3 — **rojo tártaro** (camino al Tártaro).
  4. Piso 4 — **fuego** (puertas del Tártaro, arena de Cerbero).
- El tema general se mantiene: inframundo oscuro con acentos por piso.

### Preguntas abiertas restantes
- **Dificultad y balance:** aún sin ajustar; se afina jugando después de la
  mejora visual (enemigos, XP, botín).
- **Tienda de Caronte:** precios y qué ítems vende según piso; oro inicial.
- **Gemas/encajes:** si entran en una fase 2, cómo interactúan con rarezas.
