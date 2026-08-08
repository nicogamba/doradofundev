(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const l of n)if(l.type==="childList")for(const c of l.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function s(n){const l={};return n.integrity&&(l.integrity=n.integrity),n.referrerPolicy&&(l.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?l.credentials="include":n.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function i(n){if(n.ep)return;n.ep=!0;const l=s(n);fetch(n.href,l)}})();const y={ui:{siteTitle:"doradofundev",tagline:"Videojuegos hechos por mí, para jugar en el navegador.",catalogTitle:"Catálogo de juegos",catalogEmpty:"Todavía no hay juegos. Vuelve pronto.",play:"Jugar",back:"Volver al catálogo",fullscreen:"Pantalla completa",exitFullscreen:"Salir de pantalla completa",language:"Idioma",gameNotFound:"No se encontró ese juego."},games:{voleyaslife:{title:"VoleyAsLife",desc:"Tu carrera en el vóley: elegí tu posición, jugá la eliminatoria nacional y tomá decisiones en los momentos clave."},looking4stars:{title:"Looking4Stars",desc:"Lanza las bolas, destruye los asteroides y rescata a todos los aliens antes de quedarte sin bolas."},estigia:{title:"Estigia",desc:"Roguelike táctico por turnos: bajá al inframundo griego, conseguí equipo y habilidades estilo Diablo 2 y vencé a Cerbero."},cuatrolocks:{title:"cuatrolocks",desc:"Tetris de construcciones: liberá las llaves escondidas en los bloques y dispará explosiones encadenadas."},ejemploCuadritos:{title:"Cuadritos",desc:"Muévete con las flechas del teclado y recoge los puntos dorados antes de que se acabe el tiempo."}}},h={ui:{siteTitle:"doradofundev",tagline:"Games made by me, playable in your browser.",catalogTitle:"Game catalog",catalogEmpty:"No games yet. Check back soon.",play:"Play",back:"Back to catalog",fullscreen:"Fullscreen",exitFullscreen:"Exit fullscreen",language:"Language",gameNotFound:"That game was not found."},games:{voleyaslife:{title:"VoleyAsLife",desc:"Your volleyball career: pick your position, play the national knockout and make decisions at the key moments."},looking4stars:{title:"Looking4Stars",desc:"Shoot the balls, destroy the asteroids and rescue all the aliens before you run out of balls."},estigia:{title:"Estigia",desc:"Turn-based tactical roguelike: descend into the Greek underworld, gear up Diablo 2 style and defeat Cerberus."},cuatrolocks:{title:"cuatrolocks",desc:"Block puzzles: free the keys hidden in the stacks and trigger chained explosions."},ejemploCuadritos:{title:"Little Squares",desc:"Move with the arrow keys and collect the golden dots before time runs out."}}},m="doradofundev.lang",b={es:y,en:h};let r=v();const u=new Set;function v(){return localStorage.getItem(m)==="en"?"en":"es"}function g(e,t){let s=b[e];for(const i of t.split(".")){if(s===null||typeof s!="object")return;s=s[i]}return typeof s=="string"?s:void 0}function o(e){return g(r,e)??g("es",e)??e}function f(){return r}function k(e){e!==r&&(r=e,localStorage.setItem(m,e),u.forEach(t=>t()))}function $(e){return u.add(e),()=>u.delete(e)}const p=[{id:"estigia",titleKey:"games.estigia.title",descKey:"games.estigia.desc",thumb:"games/estigia/thumb.svg",orientation:"portrait"},{id:"voleyaslife",titleKey:"games.voleyaslife.title",descKey:"games.voleyaslife.desc",thumb:"games/voleyaslife/thumb.svg",orientation:"portrait"},{id:"cuatrolocks",titleKey:"games.cuatrolocks.title",descKey:"games.cuatrolocks.desc",thumb:"games/cuatrolocks/thumb.svg",orientation:"portrait"},{id:"looking4stars",titleKey:"games.looking4stars.title",descKey:"games.looking4stars.desc",thumb:"games/looking4stars/thumb.svg",orientation:"portrait"},{id:"ejemplo-cuadritos",titleKey:"games.ejemploCuadritos.title",descKey:"games.ejemploCuadritos.desc",thumb:"games/ejemplo-cuadritos/thumb.svg"}];function L(e){return p.find(t=>t.id===e)}function E(){const e=location.hash.replace(/^#\/?/,"").split("/").filter(Boolean);return e[0]==="juego"&&e[1]?{page:"game",id:e[1]}:{page:"catalog"}}function a(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t)}function K(){const e=f(),t=s=>`<button class="lang-btn${e===s?" is-active":""}" data-lang="${s}" type="button">${s.toUpperCase()}</button>`;return`
    <header class="header">
      <a class="logo" href="#/">${a(o("ui.siteTitle"))}</a>
      <div class="lang-switch" role="group" aria-label="${a(o("ui.language"))}">
        ${t("es")}${t("en")}
      </div>
    </header>`}function j(){const e=p.map(t=>`
        <a class="card" href="#/juego/${a(t.id)}">
          <img class="card-thumb" src="${a(t.thumb)}" alt="${a(o(t.titleKey))}" loading="lazy" />
          <div class="card-body">
            <h2 class="card-title">${a(o(t.titleKey))}</h2>
            <p class="card-desc">${a(o(t.descKey))}</p>
            <span class="card-play">${a(o("ui.play"))} &rarr;</span>
          </div>
        </a>`).join("");return`
    <main class="view">
      <section class="catalog">
        <h1>${a(o("ui.catalogTitle"))}</h1>
        <p class="tagline">${a(o("ui.tagline"))}</p>
        ${e?`<div class="grid">${e}</div>`:`<p class="empty">${a(o("ui.catalogEmpty"))}</p>`}
      </section>
    </main>`}function w(e){const t=L(e);if(!t)return`
      <main class="view">
        <section class="catalog">
          <h1>${a(o("ui.gameNotFound"))}</h1>
          <a class="btn" href="#/">${a(o("ui.back"))}</a>
        </section>
      </main>`;const s=t.orientation==="portrait";return`
    <main class="view${s?" view-portrait":""}">
      <section class="game-page">
        <div class="game-topbar">
          <a class="btn" href="#/">&larr; ${a(o("ui.back"))}</a>
          <button class="btn btn-fullscreen" type="button">${a(o("ui.fullscreen"))}</button>
        </div>
        <h1>${a(o(t.titleKey))}</h1>
        <p class="game-desc">${a(o(t.descKey))}</p>
        <div class="game-frame${s?" is-portrait":""}" id="game-frame">
          <iframe src="games/${a(t.id)}/index.html" title="${a(o(t.titleKey))}" allowfullscreen></iframe>
        </div>
      </section>
    </main>`}function d(){const e=document.getElementById("app");e&&(document.documentElement.lang=f(),e.innerHTML=`${K()}${T(E())}`,C(),window.scrollTo(0,0))}function T(e){return e.page==="game"?w(e.id):j()}function C(){document.querySelectorAll(".lang-btn").forEach(t=>{t.addEventListener("click",()=>k(t.dataset.lang))});const e=document.querySelector(".btn-fullscreen");e&&e.addEventListener("click",()=>{const t=document.getElementById("game-frame");t&&(document.fullscreenElement?document.exitFullscreen():t.requestFullscreen())})}function S(){const e=document.querySelector(".btn-fullscreen");e&&(e.textContent=document.fullscreenElement?o("ui.exitFullscreen"):o("ui.fullscreen"))}$(d);window.addEventListener("hashchange",d);document.addEventListener("fullscreenchange",S);d();
