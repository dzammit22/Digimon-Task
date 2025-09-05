const SAVE_KEY = 'vital-tasks-save-mod-1';

export function save(state){
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
export function load(){
  try{ return JSON.parse(localStorage.getItem(SAVE_KEY)||''); }
  catch(e){ return null; }
}
