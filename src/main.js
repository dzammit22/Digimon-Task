// src/main.js
import {
  state,
  recalcTotals,
  recalcLineStats,
  tick,
  persist,
  exportSave,     // ← added
  importSave      // ← added
} from './state.js';

import {MENUS} from './constants.js';
import {els, refresh, renderMenu} from './ui.js';
import {showOverlay, hideOverlay, toast} from './overlays.js';
import {openTasks} from './tasks.js';
import {openCalendar} from './calendar.js';
import {openTrain} from './train.js';
import {openBattle} from './battle.js';

const btnBack = document.getElementById('btnBack');
const btnOk   = document.getElementById('btnOk');
const btnNext = document.getElementById('btnNext');

let idx = 0;
function setIndex(i){
  idx = (i + MENUS.length) % MENUS.length;
  const items = document.querySelectorAll('#menu .item');
  items.forEach((n, k)=> n.classList.toggle('active', k===idx));
}

/* ---------- Menu actions ---------- */
btnNext.onclick = ()=>{ setIndex(idx+1); };
btnBack.onclick = ()=>{ hideOverlay(); };
btnOk.onclick   = ()=>{
  const id = MENUS[idx].id;
  if(id==='tasks')    openTasks();
  if(id==='calendar') openCalendar();
  if(id==='status')   openStatus();
  if(id==='train')    openTrain();
  if(id==='battle')   openBattle();
  if(id==='settings') openSettings();
};

window.addEventListener('keydown', e=>{
  if(e.key==='ArrowDown'||e.key==='PageDown') btnNext.click();
  if(e.key==='Enter'||e.key===' ')            btnOk.click();
  if(e.key==='Escape'||e.key==='Backspace')   btnBack.click();
});

/* ---------- Panels ---------- */
function openStatus(){
  const rows = Object.entries(state.sexp).map(([k,v])=>{
    const pct = state.totalExp ? Math.min(1, v/state.totalExp) : 0;
    return `<div style="display:grid;grid-template-columns:70px 1fr 48px;gap:8px;align-items:center">
      <div class="tiny">${k}</div>
      <div class="bar"><span style="width:${Math.round(pct*100)}%"></span></div>
      <div class="mono" style="text-align:right">${v}</div>
    </div>`;
  }).join('');

  showOverlay(`
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">Status</h3>
    <div class="tiny">Stage • Line</div>
    <div style="margin-bottom:6px"><b>${state.stage}</b> • <b>${state.line}</b></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div>Level</div><div class="mono" style="text-align:right">${state.level}</div>
      <div>Total EXP</div><div class="mono" style="text-align:right">${state.totalExp}</div>
      <div>Tasks Done</div><div class="mono" style="text-align:right">${state.tasksDone}</div>
      <div>HP</div><div class="mono" style="text-align:right">${state.hp}/${state.maxhp}</div>
      <div>ATK</div><div class="mono" style="text-align:right">${state.stats.atk}</div>
      <div>DEF</div><div class="mono" style="text-align:right">${state.stats.def}</div>
      <div>SPD</div><div class="mono" style="text-align:right">${state.stats.spd}</div>
      <div>Wins</div><div class="mono" style="text-align:right">${state.wins}/${state.battles}</div>
    </div>
    <hr style="border:none;height:1px;background:#2c5a3c;margin:10px 0" />
    ${rows}
    <div class="flex" style="margin-top:10px"><button class="btn" id="close">Close</button></div>
  `);
  document.getElementById('close').onclick = hideOverlay;
}

function openSettings(){
  showOverlay(`
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">Settings</h3>
    <label class="tiny">Nickname</label><input id="nick" value="${state.name}" />
    <div class="flex" style="margin-top:8px">
      <button class="btn" id="save">Save</button>
      <button class="btn warn" id="reset">Reset</button>
    </div>

    <div class="tiny" style="margin-top:8px">Export / Import</div>
    <div class="flex">
      <button class="btn secondary" id="export">Export JSON</button>
      <button class="btn secondary" id="import">Import JSON</button>
    </div>
  `);

  // Basic settings
  document.getElementById('save').onclick = ()=>{
    state.name = (document.getElementById('nick').value||'').trim() || state.name;
    persist(); refresh(); hideOverlay();
  };

  document.getElementById('reset').onclick = ()=>{
    if(confirm('Reset everything? This cannot be undone.')){
      // Soft reset without losing createdAt
      state.sexp = Object.fromEntries(Object.keys(state.sexp).map(k=>[k,0]));
      state.totalExp = 0;
      state.tasks = [];
      state.tasksDone = 0;
      state.wins = 0;
      state.battles = 0;
      state.level = 1;
      state.line = 'POWER';
      state.speciesIndex = 0;
      recalcTotals(); recalcLineStats(true); persist(); refresh(); hideOverlay();
    }
  };

  // ----- Export (uses robust exportSave) -----
  document.getElementById('export').onclick = ()=>{
    const blob = new Blob([exportSave()], {type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'vital-tasks-save.json'; a.click();
    URL.revokeObjectURL(url);
  };

  // ----- Import (uses robust importSave) -----
  document.getElementById('import').onclick = ()=>{
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json,application/*+json,.json';
    inp.onchange = e=>{
      const f = e.target.files?.[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        try{
          const raw = JSON.parse(reader.result);
          const res = importSave(raw); // validates, normalizes, recomputes, persists
          refresh();
          setTimeout(()=>{
            toast(`Imported ${res.tasks} tasks • L${res.level} (${res.line}) ✔️`);
            hideOverlay();
          }, 50);
        }catch(err){
          alert('Import failed: ' + (err?.message || err));
        }
      };
      reader.readAsText(f);
    };
    inp.click();
  };
}

/* ---------- Boot ---------- */
recalcTotals();
recalcLineStats(true);
refresh();
renderMenu();
setIndex(0);
requestAnimationFrame(tick);
setTimeout(()=>toast('Modular build ready. Add your first task! 💡', 1400), 500);
