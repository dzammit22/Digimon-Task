import {MENUS} from './constants.js';
import {state, expToLevel} from './state.js';
import {drawSprite} from './sprites.js';

export const els = {
  tasksDone: document.getElementById('tasksDone'),
  level: document.getElementById('level'),
  level2: document.getElementById('level2'),
  xpnum: document.getElementById('xpnum'),
  clock: document.getElementById('clock'),
  xpbar: document.getElementById('xpbar').querySelector('span'),
  xpbarLabel: document.getElementById('xpbar').querySelector('.label'),
  hpbar: document.getElementById('hpbar').querySelector('span'),
  hpbarLabel: document.getElementById('hpbar').querySelector('.label'),
  stage: document.getElementById('stage'),
  diginame: document.getElementById('diginame'),
  atk: document.getElementById('atk'), def: document.getElementById('def'), spd: document.getElementById('spd'),
  sprite: document.getElementById('sprite'),
  menu: document.getElementById('menu'),
};

export let menuIndex=0;

export function renderMenu(){
  els.menu.innerHTML = '';
  MENUS.forEach((m,i)=>{
    const item = document.createElement('div');
    item.className='item'+(i===menuIndex?' active':'');
    item.innerHTML=`<div><div><b>${m.label}</b></div><div class="tiny">${m.desc}</div></div><div>›</div>`;
    els.menu.appendChild(item);
  });
}

const fmtClock=(d)=>`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

export function refresh(){
  els.clock.textContent = fmtClock(new Date());
  const {curFloor,next} = expToLevel(state.totalExp);
  const span=next-curFloor||1, prog=Math.min(1,(state.totalExp-curFloor)/span);
  els.xpbar.style.width=(prog*100)+'%'; els.xpbarLabel.textContent=`EXP ${state.totalExp} • L${state.level}`;
  els.level.textContent = state.level; els.level2.textContent = state.level; els.xpnum.textContent = state.totalExp;
  const hpPct = Math.min(1, state.hp/(state.maxhp||1)); els.hpbar.style.width=(hpPct*100)+'%';
  els.hpbarLabel.textContent = `HP ${state.hp}/${state.maxhp}`;
  els.tasksDone.textContent = state.tasksDone;
  els.stage.textContent = state.stage;
  els.atk.textContent = state.stats.atk; els.def.textContent = state.stats.def; els.spd.textContent = state.stats.spd;

  // draw sprite
  const ctx = els.sprite.getContext('2d');
  const name = state.line==='ROSE' ? (state.level===1?'Budmon':'Roseling') : 'Agumon';
  drawSprite(ctx, name, 72);

  renderMenu();
}