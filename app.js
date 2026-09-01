const APP_KEY='gymControlV1';
const PROFILE_KEY='gymControlCurrentProfile';
const ROUTINE_PACK='torso-pierna-v1';

const BASE_ROUTINES=[
  {
    id:'A',name:'Fuerza torso',subtitle:'Lunes / sábado alterno',kind:'strength',
    exercises:[
      {id:'torso_press',name:'Press de pecho en máquina / banca',sets:3,min:8,max:10,type:'weight'},
      {id:'torso_jalon',name:'Jalón al pecho',sets:3,min:8,max:10,type:'weight'},
      {id:'torso_remo',name:'Remo en polea / máquina',sets:3,min:8,max:10,type:'weight'},
      {id:'torso_inclinado',name:'Press inclinado máquina / mancuernas',sets:2,min:10,max:12,type:'weight'},
      {id:'torso_laterales',name:'Elevaciones laterales',sets:2,min:12,max:15,type:'weight'},
      {id:'torso_biceps',name:'Curl de bíceps',sets:2,min:10,max:12,type:'weight'},
      {id:'torso_triceps',name:'Tríceps en polea',sets:2,min:10,max:12,type:'weight'}
    ]
  },
  {
    id:'B',name:'Fuerza pierna',subtitle:'Jueves / sábado alterno',kind:'strength',
    exercises:[
      {id:'pierna_hack',name:'Hack squat o sentadilla Goblet',sets:3,min:8,max:10,type:'weight'},
      {id:'pierna_rumano',name:'Peso muerto rumano',sets:3,min:8,max:10,type:'weight'},
      {id:'pierna_hip_thrust',name:'Hip thrust',sets:3,min:8,max:10,type:'weight'},
      {id:'pierna_femoral',name:'Curl femoral',sets:2,min:10,max:12,type:'weight'},
      {id:'pierna_extension',name:'Extensiones de cuádriceps',sets:2,min:10,max:12,type:'weight'},
      {id:'pierna_pantorrilla',name:'Pantorrilla',sets:3,min:12,max:15,type:'weight'}
    ]
  },
  {
    id:'P',name:'Piscina',subtitle:'Martes / después de pesas',kind:'pool',
    defaultMinutes:35,
    poolPlan:'5 min suave · 10 min ritmo cómodo · 15 min alternando 1 largo rápido + 2 suaves · 5–10 min suave'
  }
];

function clone(x){return JSON.parse(JSON.stringify(x));}
function uid(prefix='id'){if(globalThis.crypto?.randomUUID)return`${prefix}_${crypto.randomUUID()}`;return`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;}
function optionalNumber(v,min,max){if(v===null||v===undefined||v==='')return null;const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)return null;return n;}
function clampInt(v,min,max,fallback){const n=parseInt(v,10);if(!Number.isFinite(n))return fallback;return Math.max(min,Math.min(max,n));}
function clampNumber(v,min,max,fallback){const n=Number(v);if(!Number.isFinite(n))return fallback;return Math.max(min,Math.min(max,n));}
function normaliseExercise(ex){if(!ex||typeof ex!=='object')return null;const type=ex.type==='time'?'time':'weight';const sets=clampInt(ex.sets,1,10,3);let min=clampInt(ex.min,1,type==='time'?600:100,type==='time'?20:10);let max=clampInt(ex.max,1,type==='time'?600:100,type==='time'?40:12);if(max<min)[min,max]=[max,min];return{id:String(ex.id||uid('ex')),name:String(ex.name||'Ejercicio').slice(0,80),sets,min,max,type};}
function normaliseRoutine(r){if(!r||typeof r!=='object')return null;const kind=r.kind==='pool'||r.pool===true?'pool':'strength';if(kind==='pool')return{id:String(r.id||uid('routine')),name:String(r.name||'Piscina').slice(0,60),subtitle:String(r.subtitle||'').slice(0,100),kind:'pool',defaultMinutes:clampInt(r.defaultMinutes,1,300,35),poolPlan:String(r.poolPlan||'Nado a ritmo cómodo.').slice(0,500)};return{id:String(r.id||uid('routine')),name:String(r.name||'Rutina').slice(0,60),subtitle:String(r.subtitle||'').slice(0,100),kind:'strength',exercises:Array.isArray(r.exercises)?r.exercises.map(normaliseExercise).filter(Boolean):[]};}
function emptyData(){return{routinePack:ROUTINE_PACK,profiles:{
  gus:{name:'Gus',heightCm:186,startWeightKg:96,goalWeightKg:90,workouts:[],bodyWeight:[],routines:clone(BASE_ROUTINES)},
  tam:{name:'Tam',heightCm:160,startWeightKg:65,goalWeightKg:60,workouts:[],bodyWeight:[],routines:clone(BASE_ROUTINES)}
}};}
function applyRoutinePack(p){
  const current=Array.isArray(p.routines)?p.routines.map(normaliseRoutine).filter(Boolean):[];
  const extra=current.filter(r=>!['A','B','P'].includes(r.id));
  const currentPool=current.find(r=>r.id==='P');
  const pool=currentPool||clone(BASE_ROUTINES.find(r=>r.id==='P'));
  p.routines=[
    clone(BASE_ROUTINES.find(r=>r.id==='A')),
    clone(BASE_ROUTINES.find(r=>r.id==='B')),
    pool,
    ...extra
  ];
}
function migrateData(data){
  if(!data||typeof data!=='object')return emptyData();
  data.profiles||={};
  if(!data.profiles.tam&&data.profiles.ella){data.profiles.tam=data.profiles.ella;delete data.profiles.ella;}
  const defaults=emptyData();
  for(const id of ['gus','tam']){
    if(!data.profiles[id])data.profiles[id]=clone(defaults.profiles[id]);
    const p=data.profiles[id];
    p.name=String(p.name||defaults.profiles[id].name).slice(0,30);
    p.heightCm=optionalNumber(p.heightCm,100,230)??defaults.profiles[id].heightCm;
    p.startWeightKg=optionalNumber(p.startWeightKg,30,300)??defaults.profiles[id].startWeightKg;
    p.goalWeightKg=optionalNumber(p.goalWeightKg,30,300)??defaults.profiles[id].goalWeightKg;
    if(!Array.isArray(p.workouts))p.workouts=[];
    if(!Array.isArray(p.bodyWeight))p.bodyWeight=[];
    if(data.routinePack!==ROUTINE_PACK)applyRoutinePack(p);
    else if(!Array.isArray(p.routines)||!p.routines.length)p.routines=clone(BASE_ROUTINES);
    else p.routines=p.routines.map(normaliseRoutine).filter(Boolean);
  }
  data.routinePack=ROUTINE_PACK;
  return data;
}
function loadData(){try{const raw=localStorage.getItem(APP_KEY);return raw?migrateData(JSON.parse(raw)):emptyData()}catch{return emptyData()}}
function saveData(){localStorage.setItem(APP_KEY,JSON.stringify(state.data))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function todayISO(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function formatDate(iso){if(!iso)return'';const[y,m,d]=iso.split('-');return`${d}/${m}/${y}`}
function currentProfile(){return state.data.profiles[state.profile]}
function currentRoutines(){return currentProfile().routines}
function getRoutine(id){return currentRoutines().find(r=>r.id===id)||null}
function fmtSet(s){return`${Number(s.weight||0)>0?`${s.weight}kg`:'sin peso'}×${s.reps||0}`}

const state={data:loadData(),profile:localStorage.getItem(PROFILE_KEY)||'',tab:'home',activeRoutine:null,settingsView:'main',editRoutineId:null};
saveData();

function setProfile(id){if(!state.data.profiles[id])return;state.profile=id;localStorage.setItem(PROFILE_KEY,id);state.tab='home';state.activeRoutine=null;state.settingsView='main';state.editRoutineId=null;render()}
function lastExerciseSession(exId){
  const ws=currentProfile().workouts.filter(w=>w.type==='strength'&&w.exercises?.some(e=>e.id===exId)).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0));
  if(!ws.length)return null;const ex=ws[0].exercises.find(e=>e.id===exId);return{date:ws[0].date,...ex}
}
function bestSet(exId){let best=null;currentProfile().workouts.forEach(w=>(w.exercises||[]).forEach(e=>{if(e.id!==exId)return;(e.sets||[]).forEach(s=>{if(s.weight==null||s.reps==null)return;if(!best||Number(s.weight)>Number(best.weight)||(Number(s.weight)===Number(best.weight)&&Number(s.reps)>Number(best.reps)))best=s})}));return best}
function suggestionForToday(){const day=new Date().getDay();const id=day===1?'A':day===2?'P':day===4?'B':day===6?'A':null;return id?(getRoutine(id)?.name||'Elige una rutina'):'Descanso'}

function render(){
  const app=document.getElementById('app');
  if(!state.profile||!state.data.profiles[state.profile]){
    app.innerHTML=`<div class="card" style="margin-top:32px"><h2>Gym Control</h2><p class="muted">Elige quién usará este dispositivo.</p><div class="profile-choice"><button class="primary" data-profile="gus">Gus</button><button class="secondary" data-profile="tam">Tam</button></div></div>`;
    app.querySelectorAll('[data-profile]').forEach(b=>b.addEventListener('click',()=>setProfile(b.dataset.profile)));return;
  }
  app.innerHTML=`<div class="topbar"><div class="brand">Gym Control</div><button class="profile-chip" id="profileBtn">${esc(currentProfile().name)} ▾</button></div><main id="view"></main><nav class="nav"><button data-tab="home" class="${state.tab==='home'?'active':''}">Hoy</button><button data-tab="history" class="${state.tab==='history'?'active':''}">Historial</button><button data-tab="weight" class="${state.tab==='weight'?'active':''}">Peso</button><button data-tab="settings" class="${state.tab==='settings'?'active':''}">Ajustes</button></nav>`;
  document.getElementById('profileBtn').addEventListener('click',()=>{localStorage.removeItem(PROFILE_KEY);state.profile='';render()});
  app.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;state.activeRoutine=null;state.settingsView='main';state.editRoutineId=null;render()}));
  renderView();
}
function renderView(){const v=document.getElementById('view');if(state.activeRoutine){renderWorkout(v,state.activeRoutine);return}if(state.tab==='home')renderHome(v);if(state.tab==='history')renderHistory(v);if(state.tab==='weight')renderWeight(v);if(state.tab==='settings'){if(state.settingsView==='routines')renderRoutineManager(v);else if(state.settingsView==='editRoutine')renderRoutineEditor(v,state.editRoutineId);else renderSettings(v)}}
function renderHome(v){
  const routines=currentRoutines();
  v.innerHTML=`<div class="card"><div class="small muted">Sugerencia de hoy</div><div class="stat">${esc(suggestionForToday())}</div><div class="small muted">Lunes torso · Martes piscina · Jueves pierna · Sábado alterna torso/pierna</div></div><div class="grid">${routines.map(r=>`<button class="routine-btn" data-routine="${esc(r.id)}"><strong>${esc(r.name)}</strong><span class="muted">${esc(r.subtitle)}</span></button>`).join('')}</div><div class="card"><h3>Últimos entrenamientos</h3>${recentWorkouts(3)}</div>`;
  v.querySelectorAll('[data-routine]').forEach(b=>b.addEventListener('click',()=>{state.activeRoutine=b.dataset.routine;render()}));
}
function recentWorkouts(limit=10){const list=[...currentProfile().workouts].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0)).slice(0,limit);if(!list.length)return`<div class="empty">Todavía no hay entrenamientos guardados.</div>`;return list.map(w=>`<div class="history-item"><div class="history-title"><span>${esc(w.name)}</span><span>${formatDate(w.date)}</span></div><div class="small muted">${w.type==='pool'?`${w.minutes||0} min`:`${w.exercises?.length||0} ejercicios`}</div></div>`).join('')}
function renderWorkout(v,id){const r=getRoutine(id);if(!r){state.activeRoutine=null;render();return}if(r.kind==='pool'){renderPool(v,r);return}
  v.innerHTML=`<div class="actions"><button class="ghost" id="backBtn">← Volver</button></div><div class="card"><h2>${esc(r.name)}</h2><div class="field"><label>Fecha</label><input id="workoutDate" type="date" value="${todayISO()}"></div></div><form id="workoutForm" class="card">${r.exercises.map(ex=>{const last=lastExerciseSession(ex.id);const lastText=last?last.sets.map(fmtSet).join(' · '):'Sin registros anteriores';const best=bestSet(ex.id);return`<div class="exercise" data-ex="${esc(ex.id)}"><div class="exercise-head"><div><strong>${esc(ex.name)}</strong><div class="small muted">${ex.sets} series · ${ex.min}${ex.max!==ex.min?`–${ex.max}`:''} reps</div><div class="last">Última vez: ${esc(lastText)}</div></div>${best&&Number(best.weight)>0?`<span class="badge">Mejor ${best.weight} kg</span>`:''}</div>${Array.from({length:ex.sets},(_,i)=>{const prev=last?.sets?.[i]||{};return`<div class="set-row"><div class="small muted">S${i+1}</div><div class="field"><label>kg</label><input inputmode="decimal" type="number" min="0" max="1000" step="0.5" data-weight value="${prev.weight??''}"></div><div class="field"><label>Reps</label><input inputmode="numeric" type="number" min="0" max="100" step="1" data-reps value="${prev.reps??''}"></div></div>`}).join('')}</div>`}).join('')}<div class="actions" style="margin-top:14px"><button class="primary" type="submit">Guardar entrenamiento</button></div><div id="formMsg" class="small muted"></div></form>`;
  document.getElementById('backBtn').addEventListener('click',()=>{state.activeRoutine=null;render()});
  document.getElementById('workoutForm').addEventListener('submit',e=>{e.preventDefault();const exercises=[];r.exercises.forEach(ex=>{const box=v.querySelector(`[data-ex="${CSS.escape(ex.id)}"]`);const weights=[...box.querySelectorAll('[data-weight]')],reps=[...box.querySelectorAll('[data-reps]')],sets=[];weights.forEach((inp,i)=>{const weight=clampNumber(inp.value,0,1000,0),rep=clampInt(reps[i]?.value,0,100,0);if(weight>0||rep>0)sets.push({weight,reps:rep})});if(sets.length)exercises.push({id:ex.id,name:ex.name,type:'weight',sets})});if(!exercises.length){document.getElementById('formMsg').textContent='Añade al menos una serie antes de guardar.';return}currentProfile().workouts.push({id:uid('workout'),type:'strength',routine:r.id,name:r.name,date:document.getElementById('workoutDate').value||todayISO(),createdAt:Date.now(),exercises});saveData();state.activeRoutine=null;state.tab='home';render()});
}
function renderPool(v,r){
  v.innerHTML=`<div class="actions"><button class="ghost" id="backBtn">← Volver</button></div><form id="poolForm" class="card"><h2>${esc(r.name)}</h2><div class="field"><label>Fecha</label><input id="poolDate" type="date" value="${todayISO()}"></div><div class="field" style="margin-top:10px"><label>Tiempo total (min)</label><input id="poolMinutes" type="number" min="1" max="300" value="${r.defaultMinutes||35}"></div><div class="notice" style="margin-top:10px">${esc(r.poolPlan)}</div><div class="field" style="margin-top:10px"><label>Notas</label><textarea id="poolNotes"></textarea></div><div class="actions" style="margin-top:12px"><button class="primary" type="submit">Guardar piscina</button></div></form>`;
  document.getElementById('backBtn').addEventListener('click',()=>{state.activeRoutine=null;render()});
  document.getElementById('poolForm').addEventListener('submit',e=>{e.preventDefault();currentProfile().workouts.push({id:uid('workout'),type:'pool',routine:r.id,name:r.name,date:document.getElementById('poolDate').value||todayISO(),createdAt:Date.now(),minutes:clampInt(document.getElementById('poolMinutes').value,1,300,35),notes:document.getElementById('poolNotes').value.trim()});saveData();state.activeRoutine=null;state.tab='home';render()});
}
function renderHistory(v){const list=[...currentProfile().workouts].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0));v.innerHTML=`<div class="card"><h2>Historial</h2>${!list.length?`<div class="empty">No hay entrenamientos todavía.</div>`:list.map(w=>`<div class="history-item"><div class="history-title"><span>${esc(w.name)}</span><span>${formatDate(w.date)}</span></div>${w.type==='pool'?`<div class="small muted">${w.minutes||0} min${w.notes?` · ${esc(w.notes)}`:''}</div>`:(w.exercises||[]).map(e=>`<div class="small" style="margin-top:5px"><strong>${esc(e.name)}:</strong> ${e.sets.map(fmtSet).join(' / ')}</div>`).join('')}</div>`).join('')}</div>`}
function latestBodyWeight(p){const list=[...(p.bodyWeight||[])].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0));return list[0]?.kg??p.startWeightKg??null}
function bodyProgress(p){const start=Number(p.startWeightKg),goal=Number(p.goalWeightKg),current=Number(latestBodyWeight(p));if(!Number.isFinite(start)||!Number.isFinite(goal)||!Number.isFinite(current))return null;const total=goal-start,moved=current-start;let percent=total===0?100:(moved/total)*100;percent=Math.max(0,Math.min(100,percent));const h=Number(p.heightCm)/100,bmi=h>0?current/(h*h):null;return{start,goal,current,change:Math.round((current-start)*10)/10,percent:Math.round(percent),bmi:Number.isFinite(bmi)?Math.round(bmi*10)/10:null}}
function signedKg(n){return`${n>0?'+':''}${n} kg`}
function renderWeight(v){const p=currentProfile(),weights=[...(p.bodyWeight||[])].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0)),progress=bodyProgress(p),latest=weights[0];let text='';if(progress){if(progress.goal<progress.start){const lost=Math.round((progress.start-progress.current)*10)/10,left=Math.max(0,Math.round((progress.current-progress.goal)*10)/10);text=`Has bajado <strong>${lost} kg</strong>. Te faltan <strong>${left} kg</strong> para tu objetivo.`}else{const gained=Math.round((progress.current-progress.start)*10)/10,left=Math.max(0,Math.round((progress.goal-progress.current)*10)/10);text=`Has subido <strong>${gained} kg</strong>. Te faltan <strong>${left} kg</strong> para tu objetivo.`}}
  v.innerHTML=`<div class="card"><div class="editor-heading"><div><h2>Progreso corporal</h2><div class="small muted">${(Number(p.heightCm)/100).toFixed(2).replace('.',',')} m · ${p.heightCm} cm</div></div>${progress?`<span class="badge">${progress.percent}% objetivo</span>`:''}</div>${progress?`<div class="progress-stats"><div class="progress-stat"><div class="small muted">Inicio</div><strong>${progress.start} kg</strong></div><div class="progress-stat"><div class="small muted">Actual</div><strong>${progress.current} kg</strong></div><div class="progress-stat"><div class="small muted">Objetivo</div><strong>${progress.goal} kg</strong></div></div><div class="progress-track"><div class="progress-fill" style="width:${progress.percent}%"></div></div><div class="notice" style="margin-top:10px">${text}</div><div class="small muted" style="margin-top:9px">Cambio total: <strong>${signedKg(progress.change)}</strong>${progress.bmi?` · IMC actual: <strong>${progress.bmi}</strong>`:''}</div>`:''}</div><div class="card"><h3>Registrar peso</h3>${latest?`<div class="small muted" style="margin-bottom:10px">Último registro: ${latest.kg} kg · ${formatDate(latest.date)}</div>`:''}<form id="weightForm"><div class="field"><label>Fecha</label><input id="bodyDate" type="date" value="${todayISO()}"></div><div class="weight-row" style="margin-top:8px"><div class="field"><label>Peso (kg)</label><input id="bodyKg" type="number" min="30" max="300" step="0.1" required></div><button class="primary" type="submit" style="align-self:end">Actualizar</button></div></form></div><div class="card"><h3>Historial de peso</h3>${weights.length?weights.map(x=>`<div class="history-item"><div class="history-title"><span>${x.kg} kg</span><span>${formatDate(x.date)}</span></div><div class="small muted">Desde el inicio: ${signedKg(Math.round((x.kg-p.startWeightKg)*10)/10)}</div></div>`).join(''):`<div class="empty">Todavía no hay pesajes.</div>`}</div>`;
  document.getElementById('weightForm').addEventListener('submit',e=>{e.preventDefault();const kg=clampNumber(document.getElementById('bodyKg').value,30,300,0);if(!kg)return;const date=document.getElementById('bodyDate').value||todayISO(),existing=p.bodyWeight.find(x=>x.date===date);if(existing){existing.kg=Math.round(kg*10)/10;existing.createdAt=Date.now()}else p.bodyWeight.push({date,kg:Math.round(kg*10)/10,createdAt:Date.now()});saveData();render()});
}
function renderSettings(v){const p=currentProfile();v.innerHTML=`<div class="card"><h2>Ajustes</h2><div class="field"><label>Nombre del perfil</label><input id="profileName" value="${esc(p.name)}"></div><div class="actions" style="margin-top:10px"><button class="secondary" id="saveName">Guardar nombre</button></div></div><div class="card"><h3>Datos corporales</h3><p class="small muted">Son editables y todos los cálculos se actualizan automáticamente.</p><form id="bodyProfileForm"><div class="editor-grid"><div class="field"><label>Estatura (cm)</label><input id="heightCm" type="number" min="100" max="230" value="${p.heightCm}"></div><div class="field"><label>Peso inicial (kg)</label><input id="startWeightKg" type="number" min="30" max="300" step="0.1" value="${p.startWeightKg}"></div><div class="field"><label>Peso objetivo (kg)</label><input id="goalWeightKg" type="number" min="30" max="300" step="0.1" value="${p.goalWeightKg}"></div></div><div class="actions" style="margin-top:10px"><button class="primary" type="submit">Guardar datos corporales</button></div></form></div><div class="card"><h3>Rutinas</h3><button class="primary" id="manageRoutines">Editar rutinas</button></div><div class="card"><h3>Copia de seguridad</h3><div class="actions"><button class="secondary" id="exportBtn">Exportar datos</button><label class="secondary file-label">Importar<input id="importFile" type="file" accept="application/json" hidden></label></div></div><div class="card"><h3>Perfil del dispositivo</h3><button class="ghost" id="changeProfile">Cambiar de perfil</button></div><div class="small muted" style="text-align:center">Gym Control v7</div>`;
  document.getElementById('saveName').addEventListener('click',()=>{const val=document.getElementById('profileName').value.trim();if(val){p.name=val.slice(0,30);saveData();render()}});
  document.getElementById('bodyProfileForm').addEventListener('submit',e=>{e.preventDefault();p.heightCm=clampNumber(document.getElementById('heightCm').value,100,230,p.heightCm);p.startWeightKg=Math.round(clampNumber(document.getElementById('startWeightKg').value,30,300,p.startWeightKg)*10)/10;p.goalWeightKg=Math.round(clampNumber(document.getElementById('goalWeightKg').value,30,300,p.goalWeightKg)*10)/10;saveData();render()});
  document.getElementById('manageRoutines').addEventListener('click',()=>{state.settingsView='routines';render()});
  document.getElementById('changeProfile').addEventListener('click',()=>{localStorage.removeItem(PROFILE_KEY);state.profile='';render()});
  document.getElementById('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state.data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`gym-control-backup-${todayISO()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)});
  document.getElementById('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{state.data=migrateData(JSON.parse(await file.text()));saveData();render()}catch{alert('Copia no válida')}});
}
function moveItem(arr,i,d){const n=i+d;if(i<0||n<0||n>=arr.length)return false;[arr[i],arr[n]]=[arr[n],arr[i]];return true}
function renderRoutineManager(v){const routines=currentRoutines();v.innerHTML=`<div class="actions"><button class="ghost" id="backSettings">← Ajustes</button></div><div class="card"><h2>Editar rutinas</h2><p class="small muted">Cambiar el nombre de un ejercicio conserva su historial.</p></div><div class="card">${routines.map((r,i)=>`<div class="manage-row"><div class="manage-main"><strong>${esc(r.name)}</strong><div class="small muted">${r.kind==='pool'?'Piscina':`${r.exercises.length} ejercicios`} · ${esc(r.subtitle)}</div></div><div class="mini-actions"><button class="icon-btn" data-up="${r.id}" ${i===0?'disabled':''}>↑</button><button class="icon-btn" data-down="${r.id}" ${i===routines.length-1?'disabled':''}>↓</button><button class="secondary compact" data-edit="${r.id}">Editar</button><button class="danger compact" data-delete="${r.id}">Eliminar</button></div></div>`).join('')}</div><div class="card"><h3>Restablecer</h3><p class="small muted">Recupera Fuerza torso, Fuerza pierna y Piscina. El historial no se borra.</p><button class="danger" id="resetRoutines">Restablecer rutinas originales</button></div>`;
  document.getElementById('backSettings').addEventListener('click',()=>{state.settingsView='main';render()});
  v.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{state.editRoutineId=b.dataset.edit;state.settingsView='editRoutine';render()}));
  v.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click',()=>{const i=routines.findIndex(r=>r.id===b.dataset.up);if(moveItem(routines,i,-1)){saveData();render()}}));
  v.querySelectorAll('[data-down]').forEach(b=>b.addEventListener('click',()=>{const i=routines.findIndex(r=>r.id===b.dataset.down);if(moveItem(routines,i,1)){saveData();render()}}));
  v.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{const r=getRoutine(b.dataset.delete);if(r&&confirm(`¿Eliminar "${r.name}"?`)){currentProfile().routines=routines.filter(x=>x.id!==r.id);saveData();render()}}));
  document.getElementById('resetRoutines').addEventListener('click',()=>{if(confirm('¿Restablecer las rutinas base? El historial NO se borrará.')){currentProfile().routines=clone(BASE_ROUTINES);saveData();render()}});
}
function exerciseEditorCard(ex,index,total){return`<div class="editor-card" data-editor-ex="${esc(ex.id)}"><div class="editor-heading"><strong>${index+1}. ${esc(ex.name)}</strong><div class="mini-actions"><button class="icon-btn" type="button" data-ex-up="${ex.id}" ${index===0?'disabled':''}>↑</button><button class="icon-btn" type="button" data-ex-down="${ex.id}" ${index===total-1?'disabled':''}>↓</button><button class="danger compact" type="button" data-ex-delete="${ex.id}">Eliminar</button></div></div><div class="field" style="margin-top:8px"><label>Nombre</label><input data-name value="${esc(ex.name)}"></div><div class="editor-grid" style="margin-top:8px"><div class="field"><label>Series</label><input data-sets type="number" min="1" max="10" value="${ex.sets}"></div><div class="field"><label>Mínimo</label><input data-min type="number" min="1" max="600" value="${ex.min}"></div><div class="field"><label>Máximo</label><input data-max type="number" min="1" max="600" value="${ex.max}"></div></div></div>`}
function renderRoutineEditor(v,id){const r=getRoutine(id);if(!r){state.settingsView='routines';render();return}if(r.kind==='pool'){renderPoolEditor(v,r);return}
  v.innerHTML=`<div class="actions"><button class="ghost" id="backRoutines">← Rutinas</button></div><form id="metaForm" class="card"><h2>Editar ${esc(r.name)}</h2><div class="field"><label>Nombre</label><input id="routineName" value="${esc(r.name)}"></div><div class="field" style="margin-top:8px"><label>Descripción</label><input id="routineSubtitle" value="${esc(r.subtitle)}"></div><div class="actions" style="margin-top:10px"><button class="secondary" type="submit">Guardar nombre</button></div></form><div class="card"><h3>Ejercicios</h3><form id="exerciseForm">${r.exercises.map((ex,i)=>exerciseEditorCard(ex,i,r.exercises.length)).join('')}<div class="actions" style="margin-top:12px"><button class="primary" type="submit">Guardar ejercicios</button></div></form></div><div class="card"><h3>Añadir ejercicio</h3><form id="addForm"><div class="field"><label>Nombre</label><input id="newName" required></div><div class="editor-grid" style="margin-top:8px"><div class="field"><label>Series</label><input id="newSets" type="number" value="3"></div><div class="field"><label>Reps mín.</label><input id="newMin" type="number" value="10"></div><div class="field"><label>Reps máx.</label><input id="newMax" type="number" value="12"></div></div><div class="actions" style="margin-top:10px"><button class="primary" type="submit">Añadir ejercicio</button></div></form></div>`;
  document.getElementById('backRoutines').addEventListener('click',()=>{state.settingsView='routines';render()});
  document.getElementById('metaForm').addEventListener('submit',e=>{e.preventDefault();r.name=document.getElementById('routineName').value.trim()||r.name;r.subtitle=document.getElementById('routineSubtitle').value.trim();saveData();render()});
  v.querySelectorAll('[data-ex-up]').forEach(b=>b.addEventListener('click',()=>{const i=r.exercises.findIndex(x=>x.id===b.dataset.exUp);if(moveItem(r.exercises,i,-1)){saveData();render()}}));
  v.querySelectorAll('[data-ex-down]').forEach(b=>b.addEventListener('click',()=>{const i=r.exercises.findIndex(x=>x.id===b.dataset.exDown);if(moveItem(r.exercises,i,1)){saveData();render()}}));
  v.querySelectorAll('[data-ex-delete]').forEach(b=>b.addEventListener('click',()=>{const ex=r.exercises.find(x=>x.id===b.dataset.exDelete);if(ex&&confirm(`¿Eliminar "${ex.name}"?`)){r.exercises=r.exercises.filter(x=>x.id!==ex.id);saveData();render()}}));
  document.getElementById('exerciseForm').addEventListener('submit',e=>{e.preventDefault();v.querySelectorAll('[data-editor-ex]').forEach(card=>{const ex=r.exercises.find(x=>x.id===card.dataset.editorEx);ex.name=card.querySelector('[data-name]').value.trim()||ex.name;ex.sets=clampInt(card.querySelector('[data-sets]').value,1,10,3);ex.min=clampInt(card.querySelector('[data-min]').value,1,100,10);ex.max=clampInt(card.querySelector('[data-max]').value,1,100,12);if(ex.max<ex.min)[ex.min,ex.max]=[ex.max,ex.min]});saveData();render()});
  document.getElementById('addForm').addEventListener('submit',e=>{e.preventDefault();const name=document.getElementById('newName').value.trim();if(!name)return;let min=clampInt(document.getElementById('newMin').value,1,100,10),max=clampInt(document.getElementById('newMax').value,1,100,12);if(max<min)[min,max]=[max,min];r.exercises.push({id:uid('ex'),name,sets:clampInt(document.getElementById('newSets').value,1,10,3),min,max,type:'weight'});saveData();render()});
}
function renderPoolEditor(v,r){v.innerHTML=`<div class="actions"><button class="ghost" id="backRoutines">← Rutinas</button></div><form id="poolEdit" class="card"><h2>Editar piscina</h2><div class="field"><label>Nombre</label><input id="poolName" value="${esc(r.name)}"></div><div class="field" style="margin-top:8px"><label>Descripción</label><input id="poolSubtitle" value="${esc(r.subtitle)}"></div><div class="field" style="margin-top:8px"><label>Minutos</label><input id="poolMinutesEdit" type="number" value="${r.defaultMinutes}"></div><div class="field" style="margin-top:8px"><label>Plan</label><textarea id="poolPlanEdit">${esc(r.poolPlan)}</textarea></div><div class="actions" style="margin-top:10px"><button class="primary" type="submit">Guardar cambios</button></div></form>`;document.getElementById('backRoutines').addEventListener('click',()=>{state.settingsView='routines';render()});document.getElementById('poolEdit').addEventListener('submit',e=>{e.preventDefault();r.name=document.getElementById('poolName').value.trim()||r.name;r.subtitle=document.getElementById('poolSubtitle').value.trim();r.defaultMinutes=clampInt(document.getElementById('poolMinutesEdit').value,1,300,35);r.poolPlan=document.getElementById('poolPlanEdit').value.trim()||r.poolPlan;saveData();state.settingsView='routines';render()})}

render();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{}));
