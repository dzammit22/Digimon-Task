export const CATS = ["Fitness","Home","Finance","Skills","Work","Rose","Other"];
export const SEXP_KEYS = ["Fitness","Home","Finance","Skills","Work","Rose"];

export const STAGES = { BABY_I:"Baby I", BABY_II:"Baby II", ROOKIE:"Rookie", CHAMPION:"Champion", ULTIMATE:"Ultimate", MEGA:"Mega" };
export const LEVEL_THRESHOLDS = [0, 60, 180, 400, 800, 1400];

export const BONUS = {
  Fitness: {hpPer:5,  atkPer:15, defPer:Infinity, spdPer:Infinity},
  Home:    {hpPer:10, defPer:12,  atkPer:Infinity, spdPer:Infinity},
  Finance: {defPer:10, spdPer:20,  atkPer:Infinity, hpPer:Infinity},
  Skills:  {spdPer:8,  atkPer:20,  hpPer:Infinity, defPer:Infinity},
  Work:    {atkPer:12, defPer:12,  hpPer:Infinity, spdPer:Infinity},
  Rose:    {spdPer:12, hpPer:12,   atkPer:Infinity, defPer:Infinity},
};

export const MENUS = [
  {id:'tasks', label:'Tasks', desc:'Add, manage, complete'},
  {id:'calendar', label:'Calendar', desc:'Month view'},
  {id:'status', label:'Status', desc:'SEXP breakdown'},
  {id:'train', label:'Train', desc:'Mini-game'},
  {id:'battle', label:'Battle', desc:'3-round sim'},
  {id:'settings', label:'Settings', desc:'Rename/export/reset'},
];
