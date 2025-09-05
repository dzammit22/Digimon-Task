// src/state.js — evolution math + robust import/export + evolution event
import {CATS, SEXP_KEYS, STAGES, LEVEL_THRESHOLDS, BONUS} from './constants.js';
import {save, load} from './storage.js';

export const LINES = {
  POWER: {
    chain: ["Botamon","Koromon","Agumon","Greymon","MetalGreymon","WarGreymon"],
    baseStats: [
      {hp:30, atk:2, def:2, spd:3},{hp:40, atk:3, def:3, spd:3},{hp:60, atk:6, def:6, spd:6},
      {hp:80, atk:10,def:8, spd:7},{hp:100,atk:14,def:12,spd:9},{hp:130,atk:18,def:16,spd:12},
    ]
  },
  ROSE: {
    chain: ["Budmon","Roseling","Bloomon","Thornmon","RoseKnight","RoseKnight"],
    baseStats: [
      {hp:28, atk:2, def:2, spd:4},{hp:42, atk:4, def:3, spd:6},{hp:62, atk:7, def:6, spd:8},
      {hp:84, atk:10,def:9, spd:11},{hp:108,atk:13,def:12,spd:14},{hp:140,atk:17,def:16,spd:18},
    ]
  },
  TECH: {
    chain: ["Botamon","Koromon","Agumon","Greymon","MetalGreymon","WarGreymon"],
    baseStats: [
      {hp:28, atk:2, def:2, spd:4},{hp:38, atk:3, def:3, spd:5},{hp:56, atk:6, def:6, spd:8},
      {hp:74, atk:9, def:8, spd:11},{hp:92, atk:12,def:11,spd:14},{hp:120,atk:16,def:15,spd:18},
    ]
  },
  GUARD: {
    chain: ["Botamon","Koromon","Agumon","Greymon","MetalGreymon","WarGreymon"],
    baseStats: [
      {hp:34, atk:2, def:3, spd:2},{hp:46, atk:3, def:4, spd:3},{hp:70, atk:6, def:8, spd:5},
      {hp:92, atk:9, def:12,spd:6},{hp:120,atk:12,def:15,spd:8},{hp:150,atk:15,def:19,spd:10},
    ]
  }
};

const now = ()=>Date.now();
export const SAVE_VERSION = 2;

export function defaultState(){
  return {
    __v: SAVE_VERSION,
    createdAt: now(), lastTick: now(),
    line:'POWER', level:1, speciesIndex:0,
    name:'Partner', stage:STAGES.BABY_I,
    sexp:Object.fromEntries(SEXP_KEYS.map(k=>[k,0])),
    totalExp:0, tasksDone:0,
    hp:30, maxhp:30, base:{...LINES.POWER.baseStats[0]}, stats:{atk:2,def:2,spd:3},
    wins:0, battles:0,
    tasks:[], // {id,title,cat,exp,due,notes,done,createdAt,completedAt}
  };
}

export let state = load() || defaultState();
export function persist(){ save(state); }

/* ---------- Helpers ---------- */
export function getSpeciesName(){
  const chain = LINES[state.line]?.chain || LINES.POWER.chain;
  return chain[Math.min(chain.length-1, Math.max(0, state.speciesIndex))];
}
export function expToLevel(total){
  let level=1, next=LEVEL_THRESHOLDS[1];
  for(let i=0;i<LEVEL_THRESHOLDS.length;i++){
    if(total>=LEVEL_THRESHOLDS[i]){ level=i+1; next=LEVEL_THRESHOLDS[i+1]??LEVEL_THRESHOLDS[i]; }
  }
  return {level:Math.min(level,6), cur:total, curFloor: LEVEL_THRESHOLDS[(Math.min(level,6)-1)], next};
}
export function stageFromLevel(level){ return [STAGES.BABY_I,STAGES.BABY_II,STAGES.ROOKIE,STAGES.CHAMPION,STAGES.ULTIMATE,STAGES.MEGA][Math.max(1,level)-1]; }
export function pickLine(sexp){
  const sum = SEXP_KEYS.reduce((a,k)=>a+sexp[k],0)||1;
  const share = Object.fromEntries(SEXP_KEYS.map(k=>[k, sexp[k]/sum]));
  const rose=share.Rose, fit=share.Fitness, work=share.Work, skills=share.Skills, fin=share.Finance, home=share.Home;
  if(rose>=0.33 && rose>skills) return 'ROSE';
  if(Math.max(fit,work)>=0.30) return 'POWER';
  if(Math.max(skills,fin)>=0.30) return 'TECH';
  if(home>=0.30) return 'GUARD';
  const map={Rose:'ROSE',Fitness:'POWER',Work:'POWER',Skills:'TECH',Finance:'TECH',Home:'GUARD'};
  const argmax=Object.entries(share).sort((a,b)=>b[1]-a[1])[0][0];
  return map[argmax]||'POWER';
}

export function recalcLineStats(resetHP=false){
  const idx=Math.min(5, Math.max(0, state.level-1));
  state.base = {...LINES[state.line].baseStats[idx]};
  const bonus={hp:0,atk:0,def:0,spd:0};
  for(const k of SEXP_KEYS){
    const v=Number(state.sexp[k]||0); const b=BONUS[k];
    if(b.hpPer!==Infinity)  bonus.hp  += Math.floor(v/b.hpPer);
    if(b.atkPer!==Infinity) bonus.atk += Math.floor(v/b.atkPer);
    if(b.defPer!==Infinity) bonus.def += Math.floor(v/b.defPer);
    if(b.spdPer!==Infinity) bonus.spd += Math.floor(v/b.spdPer);
  }
  state.stats={ atk:state.base.atk+bonus.atk, def:state.base.def+bonus.def, spd:state.base.spd+bonus.spd };
  state.maxhp=state.base.hp+bonus.hp;
  state.hp = resetHP ? state.maxhp : Math.min(state.hp, state.maxhp);
}

export function recalcTotals(){
  const before = { level: state.level, line: state.line, stage: state.stage, species: getSpeciesName() };

  state.totalExp = SEXP_KEYS.reduce((a,k)=>a+(Number(state.sexp[k])||0),0);
  const {level} = expToLevel(state.totalExp);
  state.level = level;
  state.stage = stageFromLevel(level);

  const changedLevel = level !== before.level;
  if(changedLevel){
    const newLine = pickLine(state.sexp);
    if(level>=3) state.line = newLine;
    state.speciesIndex = Math.min(5, level-1);
  }

  recalcLineStats(changedLevel);

  // If species changed, fire an evolution event
  const afterSpecies = getSpeciesName();
  if(afterSpecies !== before.species){
    try {
      window.dispatchEvent(new CustomEvent('vt:evolved', {
        detail: { level: state.level, stage: state.stage, line: state.line, species: afterSpecies }
      }));
    } catch(_) {}
  }
}

/* ---------- Import/Export ---------- */
function normalizeTask(raw){
  return {
    id: String(raw.id ?? (Date.now()+Math.random()).toString(36)),
    title: String(raw.title ?? 'Untitled'),
    cat: CATS.includes(raw.cat) ? raw.cat : 'Other',
    exp: Math.max(1, Number(raw.exp) || 10),
    due: typeof raw.due === 'string' ? raw.due : '',
    notes: String(raw.notes ?? ''),
    done: !!raw.done,
    createdAt: Number(raw.createdAt) || Date.now(),
    completedAt: raw.completedAt != null ? Number(raw.completedAt) : null,
  };
}

export const SAVE_VERSION = 2;

export function importSave(raw){
  if(!raw || typeof raw !== 'object') throw new Error('Not an object');
  const base = defaultState();
  const merged = {
    ...base,
    ...raw,
    __v: SAVE_VERSION,
    sexp: {...base.sexp, ...(raw.sexp||{})},
    tasks: Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask) : [],
  };
  for(const k of Object.keys(merged.sexp)) merged.sexp[k] = Number(merged.sexp[k])||0;
  merged.tasksDone = merged.tasks.filter(t=>t.done).length;

  // Commit by mutation so other modules see the same object
  Object.keys(state).forEach(k=> delete state[k]);
  Object.assign(state, merged);

  recalcTotals();
  recalcLineStats(true);
  persist();
  return { tasks: state.tasks.length, level: state.level, line: state.line };
}

export function exportSave(){
  return JSON.stringify({ __v: SAVE_VERSION, ...state }, null, 2);
}

/* ---------- Tick ---------- */
export function tick(){
  const dt=Math.max(0, Math.floor((now()-state.lastTick)/1000));
  if(dt>0){
    state.lastTick=now();
    if(state.hp<state.maxhp) state.hp=Math.min(state.maxhp, state.hp+1);
    persist();
  }
  requestAnimationFrame(tick);
}
