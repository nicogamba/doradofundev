# Spec — doradofundev

> Documento vivo. Es la única fuente de verdad del proyecto.
> Lo mantiene el agente `specs`. Lo ejecuta el agente `build`.

## 1. Objetivo

Una web personal donde el autor publica videojuegos propios para jugar en el
navegador, sin instalar nada. El visitante entra, ve el catálogo de juegos,
elige uno y lo juega a pantalla completa.

## 2. Usuarios y casos de uso

- **Autor (nico):** añade juegos al catálogo sin tocar el código de la web.
  Edita un archivo de configuración (una entrada por juego) y suelta los
  archivos del juego en su carpeta.
- **Jugador:** entra, ve la lista, hace clic en un juego y juega. Puede volver
  al catálogo con un botón y cambiar el idioma de la interfaz (ES/EN).

## 3. Features (priorizada)

1. **Catálogo:** home con cards de juegos (miniatura, título, descripción).
2. **Página de juego:** carga el juego en un iframe, botón de pantalla
   completa y botón "volver al catálogo".
3. **Selector de idioma:** ES (completo) y EN (por ahora incompleto, se
   traduce después). El idioma elegido se guarda en `localStorage`.
4. **Juego principal — Looking4Stars:** juego de habilidad 2D, original
   (ver sección 5.2). **Mapa de 10 niveles** con estrellas y desbloqueo
   progresivo, **poderes** (multibola, explosión, tabla) que se compran con
   **monedas**. Ver `docs/games/looking4stars.md`.
5. **Juego 2 — Cuadritos:** juego de recolección simple (se mueve con
   flechas). Se mantiene como juego propio del catálogo con: pantalla
   ajustada al marco (formato horizontal sin barras de desplazamiento),
   objeto de bonificación de tiempo que aparece aleatoriamente y récord
   máximo guardado. Ver `docs/games/cuadritos.md`.
 6. **Juego 3 — VoleyAsLife:** gestión + simulación de vóley con carrera
    (nombre, sexo, número, club, posición) y eliminatoria de 16 clubs.
    El partido se simula solo desde arriba; cuando le toca a tu jugador,
    elegís la jugada y ejecutás un minijuego de timing. Mejoras de stats
    entre partidos y adversidades. Ver `docs/games/voleyaslife.md`.
 7. **Juego 4 — cuatrolocks:** tetris moderno con giro propio: niveles con
    **construcciones pre-hechas** donde hay que **liberar llaves** (cada
    línea eliminada deja caer la llave hasta el piso). Premios por líneas
    en un toque: 2 líneas = explosión vertical, 3 = 3×3, 4 = 5×5. Mapa de
    10 niveles con estrellas, **sin economía**. Ver
    `docs/games/cuatrolocks.md`.
 8. *(futuro)* Más poderes y niveles para Looking4Stars (ver su spec),
    miniaturas automáticas, buscador, ordenación, página "acerca de".

## 4. Decisiones técnicas y por qué

- **Vite + TypeScript vanilla** (sin framework): mínimo de conceptos para un
  primer proyecto, servidor de desarrollo con recarga en vivo y build estático
  fácil de publicar gratis (GitHub Pages, Netlify, Vercel).
- **Cada juego vive en `public/games/<nombre>/`**: se sirve como archivo
  estático, así cualquier formato sirve (Canvas, Phaser, export de
  Godot/Unity) sin reescribir la web.
- **SPA con hash routing** (`#/` y `#/juego/<id>`): sin librerías extra,
  simple y funciona en hosting estático.
- **i18n desde el arranque**: todos los textos salen de
  `src/i18n/` (`es.ts`, `en.ts`) vía `t('clave')`. Nada hardcodeado.
  Título y descripción de cada juego también son claves de traducción.
- **Los juegos son autónomos en i18n y datos**: cada juego es una página
  estática separada y no puede usar el i18n de la web. Cada juego traduce sus
  propios textos con un diccionario propio dentro de su carpeta (leyendo el
  idioma guardado en `doradofundev.lang`) y persiste su progreso bajo su
  propio prefijo (`doradofundev.<game>.`). La web solo conoce el catálogo y
  guarda el idioma.
- **Sin Docker por ahora**: el build es estático, se publica gratis sin
  contenedores. Se evaluará solo si hay autohospedaje o backend (ver sección 7).
- **El agente `specs` solo especifica**; nunca toca código. El agente `build`
  implementa la spec.

## 5. Estructura de datos

### 5.1 Catálogo

Catálogo en `src/data/games.ts` — una entrada por juego:

```
{
  id: 'looking4stars',           // identifica la carpeta en public/games/
  titleKey: 'games.looking4stars.title',
  descKey: 'games.looking4stars.desc',
  thumb: '/games/looking4stars/thumb.png',
  orientation: 'portrait'        // 'portrait' | 'landscape'
}
```

- `orientation` indica cómo dibujar el marco en la página del juego:
  `portrait` = columna vertical centrada (tipo teléfono, máx. ~480px),
  `landscape` = ancho completo con ratio 16:9. Valor por defecto: `landscape`.

Traducciones en `src/i18n/<lang>.ts`:

```
{
  ui: { catalogTitle, catalogEmpty, play, fullscreen, back, language, ... },
  games: { '<id>': { title, desc } }
}
```

Idioma persistido en `localStorage` con clave `doradofundev.lang`.

La web no sabe nada de los niveles de cada juego: cada juego gestiona su
propio contenido dentro de su carpeta.

### 5.2 Especificación del juego — Looking4Stars

Juego principal del catálogo: 2D de puntería con física, vertical y
mobile-first. El jugador lanza bolas para destruir asteroides y rescatar a los
aliens escondidos, antes de quedarse sin bolas. Incluye 5 agujeros con
multiplicadores (el central devuelve la bola), cúpulas semi-elípticas entre
agujeros, **mapa de 10 niveles** con estrellas y **poderes** (multibola,
explosión, tabla) que se compran con **monedas**.

**Detalle completo (mecánica, balance, niveles):**
→ [docs/games/looking4stars.md](games/looking4stars.md)

### 5.3 Especificación del juego — VoleyAsLife

Gestión + simulación de vóley con **carrera de jugador**, vertical y
mobile-first. Creas tu identidad (nombre, sexo, número, edad, club, posición
fija) y jugás **temporadas de liga** (round-robin con tabla y campeón;
perder no elimina) con opción de **simular o jugar** cada partido. Partidos
auto-simulados desde arriba con **IA por roles y rotaciones** (estilo
Football Manager 2D); en tus turnos aparece una **decisión atada a la jugada**
(armador: armar a 2/4/6 o pasarla de una; punta: recepción y remate a zona)
y un **minijuego de timing**. Mejoras de stats con **edad** (joven mejorás
más, mayor declinás), **salario** y **palmarés/stats de carrera**. Fase 2:
transferencias con dinero, forma/DT y divisiones.

**Detalle completo (mecánica, zonas, rotaciones, IA, liga, stats, balance):**
→ [docs/games/voleyaslife.md](games/voleyaslife.md)

### 5.4 Especificación del juego — cuatrolocks

Tetris moderno (7-bag, SRS, hold, preview de la próxima, sin pieza fantasma)
con niveles de **construcciones pre-hechas** donde hay que **liberar llaves**
escondidas en los bloques: al eliminar la línea que las contiene caen bloque
a bloque hasta el piso, donde se liberan. Premios por líneas en un toque:
2 líneas = bloque explosivo de explosión **vertical**, 3 = **3×3**, 4 = **5×5**
(las explosiones liberan llaves y encadenan otros explosivos). **Mapa de 10
niveles** con estrellas (1-3), **sin economía**: las llaves son **visibles**
salvo en el **nivel jefe** (1 cada 10, ocultas). Controles teclado + táctil.

**Detalle completo (mecánica, llaves, explosiones, balance):**
→ [docs/games/cuatrolocks.md](games/cuatrolocks.md)

## 6. Alcance actual vs. futuro

**Actual:** catálogo, página de juego, i18n ES/EN (EN incompleto),
Looking4Stars v1 (vertical, física, 5 agujeros, cúpulas, aliens, 3 niveles,
móvil), Cuadritos (recolección con récord y bonos de tiempo), VoleyAsLife v1
(simulación de vóley, eliminatoria, stats, minijuego timing), tema oscuro
responsive.

**Futuro (non-goals por ahora):** inglés completo, power-ups, moneda de gemas
y canje por bolas/poderes, mapa de niveles, más niveles, miniatura automática,
buscador/ordenación, página "acerca de", backend, cuentas de usuario, guardado
de partidas en la nube.

## 7. Preguntas abiertas

- ¿El idioma por defecto debe seguir el del navegador o siempre español?
- ¿Los juegos deben tener página propia o basta el iframe a pantalla completa?
- **Moneda en Looking4Keys:** ¿gemas y/o llaves canjeables por bolas o
  poderes? Sin decidir; se diseña cuando el juego base funcione.
- **Recompensa por puntos:** umbral "cada X puntos → nueva bola o poder".
  Se afina jugando.
- **Valores de balance:** puntos por golpe, bolas iniciales, número de llaves
  por nivel. Son constantes ajustables, no fijas en la spec.
- **Docker:** no por ahora (despliegue estático). Revisar si hay
  autohospedaje o backend en el futuro.
- **Persistencia de datos:** v1 guarda en `localStorage` (puntuación general,
  niveles desbloqueados) sin servidor. Si se quiere sincronización entre
  dispositivos/cuentas, se suma un backend como servicio (Supabase/Firebase)
  sin reescribir la web. Backend propio sería el único caso que justificaría
  Docker.
- **Pantalla completa en iOS:** Safari para iPhone no permite
  `requestFullscreen` en elementos que no sean video; el botón no funcionará
  ahí. Decidir si ocultarlo en iOS o aceptarlo (el juego llena el iframe
  igualmente).
- **Hosting de despliegue:** elegir entre GitHub Pages / Netlify / Vercel.
  Cualquiera sirve el build estático; el hash routing evita configuración
  extra de redirecciones.
