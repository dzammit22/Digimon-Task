// src/tasks.js - Enhanced with evolution notifications
import {CATS, SEXP_KEYS} from './constants.js';
import {state, recalcTotals, recalcLineStats, persist} from './state.js';
import {showOverlay, hideOverlay, toast} from './overlays.js';
import {refresh, els} from './ui.js';
import {showEvolutionPopup, showLevelUpToast} from './evolution.js';

const escapeHtml = s => (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

/* ---------------- Tasks panel ---------------- */
export function openTasks(){
  const items = state.tasks
    .slice().sort((a,b)=>(a.done===b.done? (a.due||'').localeCompare(b.due||'') : (a.done?1:-1)))
    .map(t=>`<div class="item" data-id="${t.id}" style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid #2c5a3c;border-radius:10px;background:#fff;margin-bottom:8px">
      <div>
        <div><b class="${t.done?'done':''}">${escapeHtml(t.title)}</b> ${t.done?'<span class="pill">✓</span>':''}</div>
        <div class="tiny">${t.cat} • ${t.exp} EXP${t.due?` • Due ${t.due}`:''}</div>
      </div>
      <div>›</div>
    </div>`).join('') || `<div class="tiny" style="padding:8px">No tasks yet — add one!</div>`;

  const html = `
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">Tasks</h3>
    <div id="taskList">${items}</div>
    <div class="flex" style="margin-top:8px">
      <button class="btn" id="add">New Task</button>
      <button class="btn secondary" id="close">Close</button>
    </div>`;
  showOverlay(html);
  document.getElementById('close').onclick=hideOverlay;
  document.getElementById('add').onclick=()=>openTaskEditor();

  document.querySelectorAll('#taskList .item').forEach(elm=>{
    elm.onclick=()=>openTaskViewer(state.tasks.find(x=>x.id===elm.getAttribute('data-id')));
  });
}

/* ---------------- Editor ---------------- */
export function openTaskEditor(existing=null){
  const cats=CATS.map(c=>`<option value="${c}" ${existing&&existing.cat===c?'selected':''}>${c}</option>`).join('');
  const html = `
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">${existing?'Edit':'New'} Task</h3>
    <label class="tiny">Title</label><input id="title" value="${existing?escapeHtml(existing.title):''}" />
    <div
