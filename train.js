import {state, recalcTotals, recalcLineStats, persist} from './state.js';
import {showOverlay} from './overlays.js';
import {SEXP_KEYS} from './constants.js';

export function openTrain(){
  const html=`
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">Training</h3>
    <div class="tiny">Tap the prompted button quickly (5 rounds). Rewards small SEXP to your current line.</div>
    <div class="flex" style="margin:10px 0"><button class="btn" id="btnA">A</button><button class="btn" id="btnB">B</button></div>
    <div id="trainLog" class="mono" style="background:#fff;border:1px solid #2d5c3e;border-radius:10px;padding:8px;max-height:40dvh;overflow:auto;color:#0c1f16"></div>
    <div class="flex" style="margin-top:10px"><button class="btn secondary" id="quit">Close</button><button class="btn" id="start">Start</button></div>`;
  showOverlay(html);
  const log=document.getElementById('trainLog'); const q=s=>{ log.textContent+=s+"\n"; log.scrollTop=log.scrollHeight; };
  const btnA=document.getElementById('btnA'); const btnB=document.getElementById('btnB');
  let running=false, round=0, score=0, expect='A', windowMs=800, timer=null;

  function nextRound(){
    round++; if(round>5){ finish(); return; }
    expect=Math.random()<.5?'A':'B'; q(`Round ${round}: press ${expect}!`);
    const started=performance.now();
    const handler=(e)=>{
      const key=(e.target===btnA||e.key==='a'||e.key==='A')?'A':'B';
      if(key===expect){
        const rt=Math.floor(performance.now()-started); score += rt<=windowMs?1:0;
        q(rt<=windowMs?`✔️ ${rt}ms`:`❗ Slow ${rt}ms`); cleanup(); setTimeout(nextRound,220);
      }else q('✖ Wrong key');
    };
    function cleanup(){ btnA.onclick=null; btnB.onclick=null; window.onkeydown=null; clearTimeout(timer); }
    btnA.onclick=handler; btnB.onclick=handler; window.onkeydown=handler;
    timer=setTimeout(()=>{ q('⏱ Timeout'); cleanup(); setTimeout(nextRound,220); }, windowMs+280);
  }
  function finish(){
    running=false; q(`\nScore: ${score}/5`);
    const gain=score*2;
    const fav = state.line==='ROSE'?'Rose' : state.line==='TECH' ? (Math.random()<.5?'Skills':'Finance')
              : state.line==='GUARD'?'Home' : (Math.random()<.5?'Fitness':'Work');
    if(SEXP_KEYS.includes(fav)) state.sexp[fav]+=gain;
    recalcTotals(); recalcLineStats(); persist(); q(`Gained +${gain} ${fav} EXP`);
  }
  document.getElementById('quit').onclick=()=>document.getElementById('overlay').classList.remove('show');
  document.getElementById('start').onclick=()=>{ if(running) return; running=true; log.textContent=''; round=0; score=0; nextRound(); };
}