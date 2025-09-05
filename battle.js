import {state, recalcTotals, recalcLineStats, persist} from './state.js';
import {showOverlay} from './overlays.js';

export function openBattle(){
  const enemies=[
    {name:'Goburimon', stats:{hp:60, atk:6, def:5, spd:5}},
    {name:'Betamon', stats:{hp:55, atk:5, def:5, spd:6}},
    {name:'Tyrannomon', stats:{hp:85, atk:9, def:7, spd:6}},
  ];
  const foe=enemies[Math.floor(Math.random()*enemies.length)];
  const html=`
    <h3 style="margin:.2em 0; font-size:var(--fs-18)">Battle</h3>
    <div class="tiny">Best of 3 • Stats include SEXP bonuses.</div>
    <div class="mono tiny">Enemy: ${foe.name} (HP ${foe.stats.hp}, A${foe.stats.atk} D${foe.stats.def} S${foe.stats.spd})</div>
    <div id="log" class="mono" style="background:#fff;border:1px solid #2d5c3e;border-radius:10px;padding:8px;max-height:40dvh;overflow:auto;color:#0c1f16"></div>
    <div class="flex" style="margin-top:10px"><button class="btn secondary" id="close">Close</button><button class="btn" id="start">Start</button></div>`;
  showOverlay(html);
  const log=document.getElementById('log'); const q=s=>{ log.textContent+=s+"\n"; log.scrollTop=log.scrollHeight; };

  document.getElementById('close').onclick=()=>document.getElementById('overlay').classList.remove('show');
  document.getElementById('start').onclick=()=>{
    document.getElementById('start').disabled=true;
    state.battles++; let rounds=0, wins=0, foeWins=0;
    const my=JSON.parse(JSON.stringify(state.stats));
    let myHP=state.hp, foeHP=foe.stats.hp;

    function round(){
      rounds++; if(rounds>3 || myHP<=0 || foeHP<=0){ end(); return; }
      q(`\nRound ${rounds}`);
      const myInit=my.spd+Math.random()*2, foeInit=foe.stats.spd+Math.random()*2;
      const first=myInit>=foeInit?'you':'foe';
      function attack(att,def){ const base=6+Math.random()*6; return Math.max(1, Math.floor(base + att.atk*1.2 - def.def*0.8 + (Math.random()*2-1))); }
      if(first==='you'){
        const d=attack(my,foe.stats); foeHP-=d; q(`You strike for ${d}. Foe HP ${Math.max(0,foeHP)}`);
        if(foeHP<=0){ wins++; q(`You win the round!`); return setTimeout(round,350); }
        const d2=attack(foe.stats,my); myHP-=d2; q(`Foe hits for ${d2}. Your HP ${Math.max(0,myHP)}`);
        if(myHP<=0){ foeWins++; q(`Foe wins the round.`); return setTimeout(round,350); }
      }else{
        const d=attack(foe.stats,my); myHP-=d; q(`Foe hits for ${d}. Your HP ${Math.max(0,myHP)}`);
        if(myHP<=0){ foeWins++; q(`Foe wins the round.`); return setTimeout(round,350); }
        const d2=attack(my,foe.stats); foeHP-=d2; q(`You strike for ${d2}. Foe HP ${Math.max(0,foeHP)}`);
        if(foeHP<=0){ wins++; q(`You win the round!`); return setTimeout(round,350); }
      }
      if(myHP>0 && foeHP>0){
        if(myHP>foeHP) wins++; else if(foeHP>myHP) foeWins++; else Math.random()<.5?wins++:foeWins++;
        setTimeout(round,350);
      }
    }
    function end(){
      const victory=wins>foeWins;
      q(`\n${victory?'🏆 Victory!':'💥 Defeat.'} (${wins}-${foeWins})`);
      if(victory){
        state.wins++; state.hp=Math.min(state.maxhp, state.hp+8);
      }else{
        state.hp=Math.max(0, state.hp-8);
      }
      recalcTotals(); recalcLineStats(); persist();
    }
    round();
  };
}