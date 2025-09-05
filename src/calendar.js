import {state} from './state.js';
import {showOverlay} from './overlays.js';
import {openTaskEditor, openTaskViewer} from './tasks.js';

const fmtDateInput = d => {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), da=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${da}`;
};
const monthName = m => ['January','February','March','April','May','June','July','August','September','October','November','December'][m];

export function openCalendar(){
  renderCalendar(new Date());
}
let calCursor = new Date();

function renderCalendar(d){
  calCursor = d;
  const y=d.getFullYear(), m=d.getMonth();
  const first=new Date(y,m,1), startDay=(first.getDay()+6)%7, daysInMonth=new Date(y,m+1,0).getDate(), prevDays=new Date(y,m,0).getDate();

  const cells=[];
  for(let i=0;i<42;i++){
    const dayNum=i-startDay+1; let dateObj, out=false;
    if(dayNum<1){ dateObj=new Date(y,m-1, prevDays+dayNum); out=true; }
    else if(dayNum>daysInMonth){ dateObj=new Date(y,m+1, dayNum-daysInMonth); out=true; }
    else{ dateObj=new Date(y,m, dayNum); }
    const dateStr=fmtDateInput(dateObj);
    const count = state.tasks.filter(t=>t.due===dateStr).length;
    cells.push(`<div class="cal-cell ${out?'out':''}" data-date="${dateStr}"><div class="cal-date">${dateObj.getDate()}</div>${count?`<span class="cal-badge">${count}</span>`:''}</div>`);
  }
  const dow=['Mo','Tu','We','Th','Fr','Sa','Su'].map(s=>`<div class="cal-dow">${s}</div>`).join('');

  const html = `
    <style>
      .cal-head{display:flex; align-items:center; justify-content:space-between; gap:8px}
      .cal-title{font-weight:800; font-size:var(--fs-16)}
      .cal-grid{display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; margin-top:6px}
      .cal-dow{font-size:var(--fs-10); text-align:center; color:#20533a}
      .cal-cell{background:#ffffff; border:1px solid #2c5a3c; border-radius:10px; min-height:44px; padding:6px; position:relative}
      .cal-cell.out{opacity:.45}
      .cal-date{font-size:var(--fs-10); color:#17442c}
      .cal-badge{position:absolute; right:6px; bottom:6px; background:#bff3b8; border:1px solid #2a5b38; font-size:var(--fs-10); padding:0 6px; border-radius:10px}
      .cal-list{max-height:50dvh; overflow:auto; background:#fff; border:1px solid #2d5c3e; border-radius:10px; padding:8px; color:#0c1f16}
    </style>
    <div class="cal-head">
      <button class="btn secondary" id="prev">◀︎</button>
      <div class="cal-title">${monthName(m)} ${y}</div>
      <button class="btn secondary" id="next">▶︎</button>
    </div>
    <div class="cal-grid">${dow}${cells.join('')}</div>
    <div class="tiny" style="margin-top:6px">Tap a day to view/edit tasks.</div>
    <div class="flex" style="margin-top:8px">
      <button class="btn" id="add">New Task</button>
      <button class="btn secondary" id="close">Close</button>
    </div>
  `;
  showOverlay(html);

  document.getElementById('close').onclick = ()=> history.back?.() || (document.body.focus(), document.querySelector('.overlay').classList.remove('show'));
  document.getElementById('add').onclick = ()=> openTaskEditor({cat:'Other',exp:10,due:fmtDateInput(new Date(y,m,1)),title:'',notes:'',id:String(Date.now()),done:false,createdAt:Date.now(),completedAt:null});
  document.getElementById('prev').onclick = ()=> renderCalendar(new Date(y, m-1, 1));
  document.getElementById('next').onclick = ()=> renderCalendar(new Date(y, m+1, 1));

  document.querySelectorAll('.cal-cell').forEach(c=> c.onclick=()=>{
    const dateStr = c.getAttribute('data-date');
    openDay(dateStr);
  });
}

function openDay(dateStr){
  const tasks=state.tasks.filter(t=>t.due===dateStr).sort((a,b)=>(a.done===b.done?0:(a.done?1:-1)));
  const list = tasks.length? tasks.map(t=>`
    <div class="item" data-id="${t.id}" style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid #2c5a3c;border-radius:10px;background:#fff;margin-bottom:8px">
      <div>
        <div><b class="${t.done?'done':''}">${t.title||'(Untitled)'}</b> ${t.done?'<span class="pill">✓</span>':''}</div>
        <div class="tiny">${t.cat} • ${t.exp} EXP</div>
      </div>
      <div>›</div>
    </div>`).join('') : `<div class="tiny" style="padding:6px">No tasks on this day.</div>`;
  const html=`
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">${dateStr}</h3>
    <div class="cal-list" id="dayList">${list}</div>
    <div class="flex" style="margin-top:8px">
      <button class="btn" id="new">New Task</button>
      <button class="btn secondary" id="back">Back</button>
    </div>`;
  showOverlay(html);
  document.getElementById('back').onclick = ()=> renderCalendar(calCursor);
  document.getElementById('new').onclick = ()=> openTaskEditor({cat:'Other',exp:10,due:dateStr,title:'',notes:'',id:String(Date.now()),done:false,createdAt:Date.now(),completedAt:null});
  document.querySelectorAll('#dayList .item').forEach(elm=> elm.onclick=()=> openTaskViewer(state.tasks.find(x=>x.id===elm.getAttribute('data-id'))) );
}
