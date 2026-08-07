(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const l of s)if(l.type==="childList")for(const c of l.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function n(s){const l={};return s.integrity&&(l.integrity=s.integrity),s.referrerPolicy&&(l.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?l.credentials="include":s.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function r(s){if(s.ep)return;s.ep=!0;const l=n(s);fetch(s.href,l)}})();const y={ui:{siteTitle:"doradofundev",tagline:"Videojuegos hechos por mí, para jugar en el navegador.",catalogTitle:"Catálogo de juegos",catalogEmpty:"Todavía no hay juegos. Vuelve pronto.",play:"Jugar",back:"Volver al catálogo",fullscreen:"Pantalla completa",exitFullscreen:"Salir de pantalla completa",language:"Idioma",gameNotFound:"No se encontró ese juego."},games:{voleyaslife:{title:"VoleyAsLife",desc:"Tu carrera en el vóley: elegí tu posición, jugá la eliminatoria nacional y tomá decisiones en los momentos clave."},looking4stars:{title:"Looking4Stars",desc:"Lanza las bolas, destruye los asteroides y rescata a todos los aliens antes de quedarte sin bolas."},ejemploCuadritos:{title:"Cuadritos",desc:"Muévete con las flechas del teclado y recoge los puntos dorados antes de que se acabe el tiempo."}}},h={ui:{siteTitle:"doradofundev",tagline:"Games made by me, playable in your browser.",catalogTitle:"Game catalog",catalogEmpty:"No games yet. Check back soon.",play:"Play",back:"Back to catalog",fullscreen:"Fullscreen",exitFullscreen:"Exit fullscreen",language:"Language",gameNotFound:"That game was not found."},games:{voleyaslife:{title:"VoleyAsLife",desc:"Your volleyball career: pick your position, play the national knockout and make decisions at the key moments."},looking4stars:{title:"Looking4Stars",desc:"Shoot the balls, destroy the asteroids and rescue all the aliens before you run out of balls."},ejemploCuadritos:{title:"Little Squares",desc:"Move with the arrow keys and collect the golden dots before time runs out."}}},m="doradofundev.lang",b={es:y,en:h};let i=v();const u=new Set;function v(){return localStorage.getItem(m)==="en"?"en":"es"}function g(e,t){let n=b[e];for(const r of t.split(".")){if(n===null||typeof n!="object")return;n=n[r]}return typeof n=="string"?n:void 0}function o(e){return g(i,e)??g("es",e)??e}function f(){return i}function $(e){e!==i&&(i=e,localStorage.setItem(m,e),u.forEach(t=>t()))}function L(e){return u.add(e),()=>u.delete(e)}const p=[{id:"voleyaslife",titleKey:"games.voleyaslife.title",descKey:"games.voleyaslife.desc",thumb:"games/voleyaslife/thumb.svg",orientation:"portrait"},{id:"looking4stars",titleKey:"games.looking4stars.title",descKey:"games.looking4stars.desc",thumb:"games/looking4stars/thumb.svg",orientation:"portrait"},{id:"ejemplo-cuadritos",titleKey:"games.ejemploCuadritos.title",descKey:"games.ejemploCuadritos.desc",thumb:"games/ejemplo-cuadritos/thumb.svg"}];function E(e){return p.find(t=>t.id===e)}function j(){const e=location.hash.replace(/^#\/?/,"").split("/").filter(Boolean);return e[0]==="juego"&&e[1]?{page:"game",id:e[1]}:{page:"catalog"}}function a(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t)}function k(){const e=f(),t=n=>`<button class="lang-btn${e===n?" is-active":""}" data-lang="${n}" type="button">${n.toUpperCase()}</button>`;return`
    <header class="header">
      <a class="logo" href="#/">${a(o("ui.siteTitle"))}</a>
      <div class="lang-switch" role="group" aria-label="${a(o("ui.language"))}">
        ${t("es")}${t("en")}
      </div>
    </header>`}function w(){const e=p.map(t=>`
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
    </main>`}function K(e){const t=E(e);if(!t)return`
      <main class="view">
        <section class="catalog">
          <h1>${a(o("ui.gameNotFound"))}</h1>
          <a class="btn" href="#/">${a(o("ui.back"))}</a>
        </section>
      </main>`;const n=t.orientation==="portrait";return`
    <main class="view${n?" view-portrait":""}">
      <section class="game-page">
        <div class="game-topbar">
          <a class="btn" href="#/">&larr; ${a(o("ui.back"))}</a>
          <button class="btn btn-fullscreen" type="button">${a(o("ui.fullscreen"))}</button>
        </div>
        <h1>${a(o(t.titleKey))}</h1>
        <p class="game-desc">${a(o(t.descKey))}</p>
        <div class="game-frame${n?" is-portrait":""}" id="game-frame">
          <iframe src="games/${a(t.id)}/index.html" title="${a(o(t.titleKey))}" allowfullscreen></iframe>
        </div>
      </section>
    </main>`}function d(){const e=document.getElementById("app");e&&(document.documentElement.lang=f(),e.innerHTML=`${k()}${S(j())}`,T(),window.scrollTo(0,0))}function S(e){return e.page==="game"?K(e.id):w()}function T(){document.querySelectorAll(".lang-btn").forEach(t=>{t.addEventListener("click",()=>$(t.dataset.lang))});const e=document.querySelector(".btn-fullscreen");e&&e.addEventListener("click",()=>{const t=document.getElementById("game-frame");t&&(document.fullscreenElement?document.exitFullscreen():t.requestFullscreen())})}function C(){const e=document.querySelector(".btn-fullscreen");e&&(e.textContent=document.fullscreenElement?o("ui.exitFullscreen"):o("ui.fullscreen"))}L(d);window.addEventListener("hashchange",d);document.addEventListener("fullscreenchange",C);d();
