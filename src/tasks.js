import {CATS, SEXP_KEYS} from './constants.js';
import {state, recalcTotals, recalcLineStats, persist} from './state.js';
import {showOverlay, hideOverlay, toast} from './overlays.js';

const escapeHtml = s => (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

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

export function openTaskEditor(existing=null){
  const cats=CATS.map(c=>`<option value="${c}" ${existing&&existing.cat===c?'selected':''}>${c}</option>`).join('');
  const html = `
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">${existing?'Edit':'New'} Task</h3>
    <label class="tiny">Title</label><input id="title" value="${existing?escapeHtml(existing.title):''}" />
    <div class="flex" style="gap:8px; margin-top:6px">
      <div style="flex:1"><label class="tiny">Category</label><select id="cat">${cats}</select></div>
      <div style="width:40%"><label class="tiny">EXP</label><input type="number" id="exp" min="1" max="500" value="${existing?existing.exp:20}" /></div>
    </div>
    <label class="tiny" style="margin-top:6px">Due</label><input type="date" id="due" value="${existing&&existing.due?existing.due:''}" />
    <label class="tiny" style="margin-top:6px">Notes</label><textarea id="notes" rows="4">${existing?escapeHtml(existing.notes||''):''}</textarea>
    <div class="flex" style="margin-top:10px">
      ${existing?'<button class="btn warn" id="del">Delete</button>':''}
      <span style="flex:1"></span>
      <button class="btn secondary" id="cancel">Cancel</button>
      <button class="btn" id="save">Save</button>
    </div>`;
  showOverlay(html);
  document.getElementById('cancel').onclick=hideOverlay;
  document.getElementById('save').onclick=()=>{
    const t = {
      id: existing?existing.id:String(Date.now()),
      title: (document.getElementById('title').value||'').trim()||'Untitled',
      cat: document.getElementById('cat').value,
      exp: Math.max(1, Math.floor(Number(document.getElementById('exp').value)||20)),
      due: document.getElementById('due').value||'',
      notes: document.getElementById('notes').value||'',
      done: existing?existing.done:false,
      createdAt: existing?existing.createdAt: Date.now(),
      completedAt: existing?existing.completedAt:null,
    };
    upsertTask(t); toast(existing?'Updated!':'Added!'); openTasks();
  };
  if(existing){
    document.getElementById('del').onclick=()=>{
      if(confirm('Delete this task?')){
        state.tasks = state.tasks.filter(x=>x.id!==existing.id);
        persist(); openTasks();
      }
    };
  }
}

export function openTaskViewer(t){
  const html = `
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">Task</h3>
    <div><b class="${t.done?'done':''}">${escapeHtml(t.title)}</b></div>
    <div class="tiny">${t.cat} • ${t.exp} EXP ${t.due?`• Due ${t.due}`:''}</div>
    ${t.notes?`<div class="tiny" style="margin-top:6px">${escapeHtml(t.notes)}</div>`:''}
    <div class="flex" style="margin-top:10px">
      <button class="btn secondary" id="close">Close</button>
      <button class="btn" id="edit">Edit</button>
      ${!t.done?'<button class="btn" id="complete">Complete</button>':'<button class="btn" id="undo">Undo</button>'}
      <button class="btn warn" id="delete">Delete</button>
    </div>`;
  showOverlay(html);
  document.getElementById('close').onclick=hideOverlay;
  document.getElementById('edit').onclick=()=>openTaskEditor(t);
  document.getElementById('delete').onclick=()=>{
    if(confirm('Delete this task?')){
      state.tasks = state.tasks.filter(x=>x.id!==t.id);
      persist(); openTasks();
    }
  };
  document.getElementById('complete')&&(document.getElementById('complete').onclick=()=>completeTask(t.id));
  document.getElementById('undo')&&(document.getElementById('undo').onclick=()=>undoTask(t.id));
}

function upsertTask(t){ const i=state.tasks.findIndex(x=>x.id===t.id); if(i>=0) state.tasks[i]=t; else state.tasks.push(t); persist(); }

export function completeTask(id){
  const t=state.tasks.find(x=>x.id===id); if(!t||t.done) return;
  t.done=true; t.completedAt=Date.now(); state.tasksDone++;
  if(SEXP_KEYS.includes(t.cat)) state.sexp[t.cat]+=t.exp;
  recalcTotals(); recalcLineStats(); persist(); toast(`+${t.exp} ${t.cat} EXP!`); openTasks();
}

export function undoTask(id){
  const t=state.tasks.find(x=>x.id===id); if(!t||!t.done) return;
  t.done=false; t.completedAt=null; state.tasksDone=Math.max(0,state.tasksDone-1);
  if(SEXP_KEYS.includes(t.cat)) state.sexp[t.cat]=Math.max(0, state.sexp[t.cat]-t.exp);
  recalcTotals(); recalcLineStats(); persist(); toast('Undone.'); openTasks();
}
