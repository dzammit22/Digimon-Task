export const el = {
  overlay: document.getElementById('overlay'),
  card: document.getElementById('card'),
};

export function showOverlay(html){
  el.card.innerHTML = html;
  el.overlay.classList.add('show');
  el.card.scrollTop = 0;
}
export function hideOverlay(){
  el.overlay.classList.remove('show');
  el.card.innerHTML = '';
}

let timer=null;
export function toast(msg, ms=1500){
  showOverlay(`<div class="center">${msg}<div class="flex" style="margin-top:10px"><button class="btn" id="ok">OK</button></div></div>`);
  clearTimeout(timer);
  timer=setTimeout(()=>hideOverlay(), ms);
  document.getElementById('ok').onclick=hideOverlay;
}