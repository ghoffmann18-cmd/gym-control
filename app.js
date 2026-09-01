const APP_KEY = 'gymControlV1';
const PROFILE_KEY = 'gymControlCurrentProfile';

const DEFAULT_ROUTINES = [
  {
    id: 'A',
    name: 'Fuerza A',
    subtitle: 'Lunes / sábado alterno',
    kind: 'strength',
    exercises: [
      {id:'prensa', name:'Prensa de piernas', sets:3, min:10, max:12, type:'weight'},
      {id:'press_pecho', name:'Press de pecho en máquina', sets:3, min:10, max:12, type:'weight'},
      {id:'jalon', name:'Jalón al pecho', sets:3, min:10, max:12, type:'weight'},
      {id:'rumano', name:'Peso muerto rumano con mancuernas', sets:2, min:10, max:12, type:'weight'},
      {id:'remo_sentado', name:'Remo sentado', sets:2, min:10, max:12, type:'weight'},
      {id:'laterales', name:'Elevaciones laterales', sets:2, min:12, max:15, type:'weight'},
      {id:'plancha', name:'Plancha', sets:3, min:20, max:40, type:'time'}
    ]
  },
  {
    id: 'B',
    name: 'Fuerza B',
    subtitle: 'Jueves / sábado alterno',
    kind: 'strength',
    exercises: [
      {id:'sentadilla', name:'Sentadilla Goblet o Hack Squat', sets:3, min:10, max:12, type:'weight'},
      {id:'press_inclinado', name:'Press inclinado', sets:3, min:10, max:12, type:'weight'},
      {id:'remo_maquina', name:'Remo en máquina', sets:3, min:10, max:12, type:'weight'},
      {id:'curl_femoral', name:'Curl femoral', sets:3, min:10, max:12, type:'weight'},
      {id:'press_hombros', name:'Press de hombros', sets:2, min:10, max:12, type:'weight'},
      {id:'biceps', name:'Curl de bíceps', sets:2, min:12, max:12, type:'weight'},
      {id:'triceps', name:'Tríceps en polea', sets:2, min:12, max:12, type:'weight'},
      {id:'crunch', name:'Crunch abdominal', sets:3, min:12, max:15, type:'weight'}
    ]
  },
  {
    id: 'P',
    name: 'Piscina',
    subtitle: '30–40 min',
    kind: 'pool',
    defaultMinutes: 35,
    poolPlan: '5 min suave · 10 min cómodo · 15 min alternando 1 largo rápido + 2 suaves · 5–10 min suave'
  }
];

function cloneDefaults(){
  return JSON.parse(JSON.stringify(DEFAULT_ROUTINES));
}

function uid(prefix='id'){
  if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
}

function emptyData(){
  return {
    profiles: {
      gus: {
        name:'Gus',
        heightCm:188,
        startWeightKg:96,
        goalWeightKg:90,
        workouts:[],
        bodyWeight:[],
        routines:cloneDefaults()
      },
      tam: {
        name:'Tam',
        heightCm:160,
        startWeightKg:65,
        goalWeightKg:60,
        workouts:[],
        bodyWeight:[],
        routines:cloneDefaults()
      }
    }
  };
}

function normaliseExercise(ex){
  if(!ex || typeof ex !== 'object') return null;
  const type = ex.type === 'time' ? 'time' : 'weight';
  const sets = clampInt(ex.sets, 1, 10, 3);
  let min = clampInt(ex.min, 1, type === 'time' ? 600 : 100, type === 'time' ? 20 : 10);
  let max = clampInt(ex.max, 1, type === 'time' ? 600 : 100, type === 'time' ? 40 : 12);
  if(max < min) [min,max] = [max,min];
  return {
    id: String(ex.id || uid('ex')),
    name: String(ex.name || 'Ejercicio').slice(0,80),
    sets, min, max, type
  };
}

function normaliseRoutine(r){
  if(!r || typeof r !== 'object') return null;
  const kind = r.kind === 'pool' || r.pool === true ? 'pool' : 'strength';
  if(kind === 'pool'){
    return {
      id: String(r.id || uid('routine')),
      name: String(r.name || 'Piscina').slice(0,60),
      subtitle: String(r.subtitle || '').slice(0,100),
      kind:'pool',
      defaultMinutes: clampInt(r.defaultMinutes, 1, 300, 35),
      poolPlan: String(r.poolPlan || 'Nado a ritmo cómodo.').slice(0,500)
    };
  }
  return {
    id: String(r.id || uid('routine')),
    name: String(r.name || 'Nueva rutina').slice(0,60),
    subtitle: String(r.subtitle || '').slice(0,100),
    kind:'strength',
    exercises: Array.isArray(r.exercises) ? r.exercises.map(normaliseExercise).filter(Boolean) : []
  };
}

function migrateData(data){
  if(!data || typeof data !== 'object') return emptyData();
  data.profiles ||= {};

  // Compatibilidad con una versión antigua que pudiera usar "ella".
  if(!data.profiles.tam && data.profiles.ella){
    data.profiles.tam = data.profiles.ella;
    delete data.profiles.ella;
  }

  const defaults = emptyData();
  for(const id of ['gus','tam']){
    if(!data.profiles[id]) data.profiles[id] = defaults.profiles[id];
    const p = data.profiles[id];
    p.name = String(p.name || defaults.profiles[id].name).slice(0,30);
    p.heightCm = clampNumber(p.heightCm, 100, 230, defaults.profiles[id].heightCm);
    p.startWeightKg = clampNumber(p.startWeightKg, 30, 300, defaults.profiles[id].startWeightKg);
    p.goalWeightKg = clampNumber(p.goalWeightKg, 30, 300, defaults.profiles[id].goalWeightKg);
    if(!Array.isArray(p.workouts)) p.workouts = [];
    if(!Array.isArray(p.bodyWeight)) p.bodyWeight = [];
    if(!Array.isArray(p.routines) || !p.routines.length){
      p.routines = cloneDefaults();
    }else{
      p.routines = p.routines.map(normaliseRoutine).filter(Boolean);
    }
  }
  return data;
}

function loadData(){
  try{
    const raw = localStorage.getItem(APP_KEY);
    if(!raw) return emptyData();
    return migrateData(JSON.parse(raw));
  }catch{
    return emptyData();
  }
}

function saveData(){
  localStorage.setItem(APP_KEY, JSON.stringify(state.data));
}

function esc(s){
  return String(s ?? '').replace(/[&<>"']/g,m=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

function clampInt(value,min,max,fallback){
  const n = Number.parseInt(value,10);
  if(!Number.isFinite(n)) return fallback;
  return Math.max(min,Math.min(max,n));
}

function clampNumber(value,min,max,fallback){
  const n = Number(value);
  if(!Number.isFinite(n)) return fallback;
  return Math.max(min,Math.min(max,n));
}

function todayISO(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function formatDate(iso){
  if(!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y,m,d]=iso.split('-');
  return `${d}/${m}/${y}`;
}

function currentProfile(){
  return state.data.profiles[state.profile];
}

function currentRoutines(){
  return currentProfile().routines;
}

function getRoutine(id){
  return currentRoutines().find(r=>r.id===id) || null;
}

const state = {
  data: loadData(),
  profile: localStorage.getItem(PROFILE_KEY) || '',
  tab: 'home',
  activeRoutine: null,
  settingsView: 'main',
  editRoutineId: null
};

saveData();

function setProfile(id){
  if(!state.data.profiles[id]) return;
  state.profile=id;
  localStorage.setItem(PROFILE_KEY,id);
  state.tab='home';
  state.activeRoutine=null;
  state.settingsView='main';
  state.editRoutineId=null;
  render();
}

function lastExerciseSession(exId){
  const ws = currentProfile().workouts
    .filter(w=>w.type==='strength' && w.exercises?.some(e=>e.id===exId))
    .sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt||0)-(a.createdAt||0));
  if(!ws.length) return null;
  const ex=ws[0].exercises.find(e=>e.id===exId);
  return {date:ws[0].date, ...ex};
}

function bestSet(exId){
  let best=null;
  currentProfile().workouts.forEach(w=>{
    (w.exercises||[]).forEach(e=>{
      if(e.id!==exId) return;
      (e.sets||[]).forEach(s=>{
        if(s.weight==null || s.reps==null) return;
        if(
          !best ||
          Number(s.weight)>Number(best.weight) ||
          (Number(s.weight)===Number(best.weight) && Number(s.reps)>Number(best.reps))
        ) best={weight:Number(s.weight),reps:Number(s.reps)};
      });
    });
  });
  return best;
}

function render(){
  const app=document.getElementById('app');

  if(!state.profile || !state.data.profiles[state.profile]){
    app.innerHTML = `
      <div class="card" style="margin-top:32px">
        <h2>Gym Control</h2>
        <p class="muted">Elige quién usará este dispositivo. Cada perfil guarda sus propias rutinas, pesos e historial.</p>
        <div class="profile-choice">
          <button class="primary" data-profile="gus">Gus</button>
          <button class="secondary" data-profile="tam">Tam</button>
        </div>
      </div>`;
    app.querySelectorAll('[data-profile]').forEach(
      b=>b.addEventListener('click',()=>setProfile(b.dataset.profile))
    );
    return;
  }

  app.innerHTML = `
    <div class="topbar">
      <div class="brand">Gym Control</div>
      <button class="profile-chip" id="profileBtn">${esc(currentProfile().name)} ▾</button>
    </div>
    <main id="view"></main>
    <nav class="nav">
      <button data-tab="home" class="${state.tab==='home'?'active':''}">Hoy</button>
      <button data-tab="history" class="${state.tab==='history'?'active':''}">Historial</button>
      <button data-tab="weight" class="${state.tab==='weight'?'active':''}">Peso</button>
      <button data-tab="settings" class="${state.tab==='settings'?'active':''}">Ajustes</button>
    </nav>`;

  document.getElementById('profileBtn').addEventListener('click',()=>{
    localStorage.removeItem(PROFILE_KEY);
    state.profile='';
    render();
  });

  app.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
    state.tab=b.dataset.tab;
    state.activeRoutine=null;
    state.settingsView='main';
    state.editRoutineId=null;
    render();
  }));

  renderView();
}

function renderView(){
  const v=document.getElementById('view');
  if(state.activeRoutine){
    renderWorkout(v,state.activeRoutine);
    return;
  }

  if(state.tab==='home') renderHome(v);
  if(state.tab==='history') renderHistory(v);
  if(state.tab==='weight') renderWeight(v);
  if(state.tab==='settings'){
    if(state.settingsView==='routines') renderRoutineManager(v);
    else if(state.settingsView==='editRoutine') renderRoutineEditor(v,state.editRoutineId);
    else renderSettings(v);
  }
}

function suggestionForToday(){
  const day=new Date().getDay();
  const preferredId = day===1?'A':day===2?'P':day===4?'B':day===6?'A':null;
  if(!preferredId) return 'Descanso';
  return getRoutine(preferredId)?.name || 'Elige una rutina';
}

function renderHome(v){
  const routines=currentRoutines();
  v.innerHTML = `
    <div class="card">
      <div class="small muted">Sugerencia de hoy</div>
      <div class="stat">${esc(suggestionForToday())}</div>
      <div class="small muted">Puedes iniciar cualquier rutina igualmente.</div>
    </div>
    <div class="grid">
      ${routines.map(r=>`
        <button class="routine-btn" data-routine="${esc(r.id)}">
          <strong>${esc(r.name)}</strong>
          <span class="muted">${esc(r.subtitle || (r.kind==='pool'?'Piscina':'Pesas'))}</span>
        </button>`).join('')}
    </div>
    ${!routines.length?`<div class="card empty">No tienes rutinas. Puedes crearlas en Ajustes → Editar rutinas.</div>`:''}
    <div class="card">
      <h3>Últimos entrenamientos</h3>
      ${recentWorkouts(3)}
    </div>`;

  v.querySelectorAll('[data-routine]').forEach(b=>b.addEventListener('click',()=>{
    state.activeRoutine=b.dataset.routine;
    render();
  }));
}

function recentWorkouts(limit=10){
  const list=[...currentProfile().workouts]
    .sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt||0)-(a.createdAt||0))
    .slice(0,limit);

  if(!list.length) return `<div class="empty">Todavía no hay entrenamientos guardados.</div>`;

  return list.map(w=>`
    <div class="history-item">
      <div class="history-title">
        <span>${esc(w.name)}</span><span>${formatDate(w.date)}</span>
      </div>
      <div class="small muted">
        ${w.type==='pool' ? `${w.minutes||0} min` : `${w.exercises?.length||0} ejercicios`}
      </div>
    </div>`).join('');
}

function renderWorkout(v,id){
  const r=getRoutine(id);
  if(!r){
    state.activeRoutine=null;
    render();
    return;
  }
  if(r.kind==='pool'){
    renderPool(v,r);
    return;
  }

  v.innerHTML = `
    <div class="actions"><button class="ghost" id="backBtn">← Volver</button></div>
    <div class="card">
      <h2>${esc(r.name)}</h2>
      <div class="field">
        <label>Fecha</label>
        <input id="workoutDate" type="date" value="${todayISO()}">
      </div>
    </div>
    <form id="workoutForm" class="card">
      ${r.exercises.map(ex=>{
        const last=lastExerciseSession(ex.id);
        const lastText = last
          ? last.sets.map(s=>ex.type==='time' ? `${s.seconds||0}s` : `${s.weight||0}kg×${s.reps||0}`).join(' · ')
          : 'Sin registros anteriores';
        const best=bestSet(ex.id);

        return `<div class="exercise" data-ex="${esc(ex.id)}">
          <div class="exercise-head">
            <div>
              <strong>${esc(ex.name)}</strong>
              <div class="small muted">
                ${ex.sets} series · ${ex.min}${ex.max!==ex.min?`–${ex.max}`:''}
                ${ex.type==='time'?'segundos':'reps'}
              </div>
              <div class="last">Última vez: ${esc(lastText)}</div>
            </div>
            ${best&&ex.type==='weight'?`<span class="badge">Mejor ${best.weight} kg</span>`:''}
          </div>

          ${Array.from({length:ex.sets},(_,i)=>{
            const prev=last?.sets?.[i]||{};
            if(ex.type==='time'){
              return `<div class="set-row time">
                <div class="small muted">S${i+1}</div>
                <div class="field">
                  <label>Segundos</label>
                  <input inputmode="numeric" type="number" min="0" max="600" step="1"
                    data-sec value="${prev.seconds??''}">
                </div>
              </div>`;
            }
            return `<div class="set-row">
              <div class="small muted">S${i+1}</div>
              <div class="field">
                <label>kg</label>
                <input inputmode="decimal" type="number" min="0" max="1000" step="0.5"
                  data-weight value="${prev.weight??''}">
              </div>
              <div class="field">
                <label>Reps</label>
                <input inputmode="numeric" type="number" min="0" max="100" step="1"
                  data-reps value="${prev.reps??''}">
              </div>
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}

      ${!r.exercises.length?`<div class="empty">Esta rutina todavía no tiene ejercicios. Añádelos desde Ajustes → Editar rutinas.</div>`:''}

      <div class="actions" style="margin-top:14px">
        <button class="primary" type="submit" ${!r.exercises.length?'disabled':''}>Guardar entrenamiento</button>
      </div>
      <div id="formMsg" class="small muted" aria-live="polite"></div>
    </form>`;

  document.getElementById('backBtn').addEventListener('click',()=>{
    state.activeRoutine=null;
    render();
  });

  document.getElementById('workoutForm').addEventListener('submit',e=>{
    e.preventDefault();
    const exercises=[];

    r.exercises.forEach(ex=>{
      const box=v.querySelector(`[data-ex="${CSS.escape(ex.id)}"]`);
      if(!box) return;
      const sets=[];

      if(ex.type==='time'){
        box.querySelectorAll('[data-sec]').forEach(inp=>{
          const seconds=clampInt(inp.value,0,600,0);
          if(seconds>0) sets.push({seconds});
        });
      }else{
        const weights=[...box.querySelectorAll('[data-weight]')];
        const reps=[...box.querySelectorAll('[data-reps]')];
        weights.forEach((inp,i)=>{
          const weight=clampNumber(inp.value,0,1000,0);
          const rep=clampInt(reps[i]?.value,0,100,0);
          if(weight>0 || rep>0) sets.push({weight,reps:rep});
        });
      }

      if(sets.length){
        exercises.push({
          id:ex.id,
          name:ex.name,
          type:ex.type,
          sets
        });
      }
    });

    if(!exercises.length){
      document.getElementById('formMsg').textContent='Añade al menos una serie antes de guardar.';
      return;
    }

    currentProfile().workouts.push({
      id:uid('workout'),
      type:'strength',
      routine:r.id,
      name:r.name,
      date:document.getElementById('workoutDate').value||todayISO(),
      createdAt:Date.now(),
      exercises
    });

    saveData();
    state.activeRoutine=null;
    state.tab='home';
    render();
  });
}

function renderPool(v,r){
  v.innerHTML=`
    <div class="actions"><button class="ghost" id="backBtn">← Volver</button></div>
    <form id="poolForm" class="card">
      <h2>${esc(r.name)}</h2>
      <div class="field">
        <label>Fecha</label>
        <input id="poolDate" type="date" value="${todayISO()}">
      </div>
      <div class="field" style="margin-top:10px">
        <label>Tiempo total (min)</label>
        <input id="poolMinutes" inputmode="numeric" type="number" min="1" max="300"
          value="${r.defaultMinutes||35}">
      </div>
      <div class="notice" style="margin-top:10px">${esc(r.poolPlan||'Nado a ritmo cómodo.')}</div>
      <div class="field" style="margin-top:10px">
        <label>Notas</label>
        <textarea id="poolNotes" placeholder="Ej.: me sentí bien, descansé 30 s cada 4 largos..."></textarea>
      </div>
      <div class="actions" style="margin-top:12px">
        <button class="primary" type="submit">Guardar piscina</button>
      </div>
    </form>`;

  document.getElementById('backBtn').addEventListener('click',()=>{
    state.activeRoutine=null;
    render();
  });

  document.getElementById('poolForm').addEventListener('submit',e=>{
    e.preventDefault();
    const minutes=clampInt(document.getElementById('poolMinutes').value,1,300,r.defaultMinutes||35);

    currentProfile().workouts.push({
      id:uid('workout'),
      type:'pool',
      routine:r.id,
      name:r.name,
      date:document.getElementById('poolDate').value||todayISO(),
      createdAt:Date.now(),
      minutes,
      notes:document.getElementById('poolNotes').value.trim()
    });

    saveData();
    state.activeRoutine=null;
    state.tab='home';
    render();
  });
}

function renderHistory(v){
  const list=[...currentProfile().workouts]
    .sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt||0)-(a.createdAt||0));

  v.innerHTML=`<div class="card"><h2>Historial</h2>
    ${!list.length
      ? `<div class="empty">No hay entrenamientos todavía.</div>`
      : list.map(w=>`
        <div class="history-item">
          <div class="history-title">
            <span>${esc(w.name)}</span><span>${formatDate(w.date)}</span>
          </div>
          ${w.type==='pool'
            ? `<div class="small muted">${w.minutes||0} min${w.notes?` · ${esc(w.notes)}`:''}</div>`
            : (w.exercises||[]).map(e=>`
                <div class="small" style="margin-top:5px">
                  <strong>${esc(e.name)}:</strong>
                  ${e.type==='time'
                    ? e.sets.map(s=>`${s.seconds}s`).join(' / ')
                    : e.sets.map(s=>`${s.weight}kg×${s.reps}`).join(' / ')}
                </div>`).join('')
          }
        </div>`).join('')
    }
  </div>`;
}


function latestBodyWeight(profile){
  const list=[...(profile.bodyWeight||[])]
    .sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt||0)-(a.createdAt||0));
  return list[0]?.kg ?? profile.startWeightKg ?? null;
}

function bodyProgress(profile){
  const start=Number(profile.startWeightKg);
  const goal=Number(profile.goalWeightKg);
  const current=Number(latestBodyWeight(profile));

  if(!Number.isFinite(start) || !Number.isFinite(goal) || !Number.isFinite(current)){
    return null;
  }

  const total=goal-start;
  const moved=current-start;
  let percent = total===0 ? 100 : (moved/total)*100;
  percent=Math.max(0,Math.min(100,percent));

  const change=current-start;
  const remaining=goal-current;

  const heightM=Number(profile.heightCm)/100;
  const bmi = heightM>0 ? current/(heightM*heightM) : null;

  return {
    start,goal,current,
    change:Math.round(change*10)/10,
    remaining:Math.round(remaining*10)/10,
    percent:Math.round(percent),
    bmi:Number.isFinite(bmi)?Math.round(bmi*10)/10:null
  };
}

function signedKg(n){
  if(!Number.isFinite(n)) return '';
  if(n>0) return `+${n} kg`;
  if(n<0) return `${n} kg`;
  return '0 kg';
}

function renderWeight(v){
  const profile=currentProfile();
  const weights=[...(profile.bodyWeight||[])]
    .sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt||0)-(a.createdAt||0));
  const progress=bodyProgress(profile);
  const latest=weights[0];

  const direction = progress
    ? (progress.goal < progress.start ? 'bajar' : progress.goal > progress.start ? 'subir' : 'mantener')
    : '';

  let progressText='';
  if(progress){
    if(direction==='bajar'){
      const lost=Math.round((progress.start-progress.current)*10)/10;
      const left=Math.max(0,Math.round((progress.current-progress.goal)*10)/10);
      progressText=`Has bajado <strong>${lost} kg</strong> desde el inicio. Te faltan <strong>${left} kg</strong> para tu objetivo.`;
    }else if(direction==='subir'){
      const gained=Math.round((progress.current-progress.start)*10)/10;
      const left=Math.max(0,Math.round((progress.goal-progress.current)*10)/10);
      progressText=`Has subido <strong>${gained} kg</strong> desde el inicio. Te faltan <strong>${left} kg</strong> para tu objetivo.`;
    }else{
      progressText='Tu peso inicial y objetivo son iguales.';
    }
  }

  v.innerHTML=`
    <div class="card">
      <div class="editor-heading">
        <div>
          <h2>Progreso corporal</h2>
          <div class="small muted">${esc(profile.heightCm)} cm de estatura</div>
        </div>
        ${progress?`<span class="badge">${progress.percent}% objetivo</span>`:''}
      </div>

      ${progress?`
        <div class="progress-stats">
          <div class="progress-stat">
            <div class="small muted">Inicio</div>
            <strong>${progress.start} kg</strong>
          </div>
          <div class="progress-stat">
            <div class="small muted">Actual</div>
            <strong>${progress.current} kg</strong>
          </div>
          <div class="progress-stat">
            <div class="small muted">Objetivo</div>
            <strong>${progress.goal} kg</strong>
          </div>
        </div>

        <div class="progress-track" aria-label="Progreso hacia el objetivo">
          <div class="progress-fill" style="width:${progress.percent}%"></div>
        </div>

        <div class="notice" style="margin-top:10px">${progressText}</div>

        <div class="small muted" style="margin-top:9px">
          Cambio total: <strong>${signedKg(progress.change)}</strong>
          ${progress.bmi?` · IMC actual: <strong>${progress.bmi}</strong>`:''}
        </div>
      `:''}
    </div>

    <div class="card">
      <h3>Registrar peso</h3>
      ${latest?`<div class="small muted" style="margin-bottom:10px">Último registro: ${latest.kg} kg · ${formatDate(latest.date)}</div>`:''}
      <form id="weightForm">
        <div class="field">
          <label>Fecha</label>
          <input id="bodyDate" type="date" value="${todayISO()}">
        </div>
        <div class="weight-row" style="margin-top:8px">
          <div class="field">
            <label>Peso (kg)</label>
            <input id="bodyKg" inputmode="decimal" type="number" min="30" max="300" step="0.1" required>
          </div>
          <button class="primary" type="submit" style="align-self:end">Actualizar</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>Historial de peso</h3>
      ${weights.length
        ? weights.map(x=>{
            const diff=Math.round((x.kg-profile.startWeightKg)*10)/10;
            return `
              <div class="history-item">
                <div class="history-title">
                  <span>${x.kg} kg</span>
                  <span>${formatDate(x.date)}</span>
                </div>
                <div class="small muted">Desde el inicio: ${signedKg(diff)}</div>
              </div>`;
          }).join('')
        : `<div class="empty">Todavía no hay pesajes. Tu referencia inicial es ${profile.startWeightKg} kg.</div>`}
    </div>`;

  document.getElementById('weightForm').addEventListener('submit',e=>{
    e.preventDefault();
    const kg=clampNumber(document.getElementById('bodyKg').value,30,300,0);
    if(!kg) return;

    const date=document.getElementById('bodyDate').value||todayISO();

    // If a weight already exists for this date, update it instead of duplicating it.
    const existing=profile.bodyWeight.find(x=>x.date===date);
    if(existing){
      existing.kg=Math.round(kg*10)/10;
      existing.createdAt=Date.now();
    }else{
      profile.bodyWeight.push({
        date,
        kg:Math.round(kg*10)/10,
        createdAt:Date.now()
      });
    }

    saveData();
    render();
  });
}

function renderSettings(v){
  v.innerHTML=`
    <div class="card">
      <h2>Ajustes</h2>
      <div class="field">
        <label>Nombre del perfil</label>
        <input id="profileName" value="${esc(currentProfile().name)}" maxlength="30">
      </div>
      <div class="actions" style="margin-top:10px">
        <button class="secondary" id="saveName">Guardar nombre</button>
      </div>
    </div>

    <div class="card">
      <h3>Datos corporales</h3>
      <p class="small muted">Estos datos se usan para calcular tu avance cuando registras nuevos pesos.</p>
      <form id="bodyProfileForm">
        <div class="editor-grid">
          <div class="field">
            <label>Estatura (cm)</label>
            <input id="heightCm" type="number" min="100" max="230" step="1" value="${esc(currentProfile().heightCm)}">
          </div>
          <div class="field">
            <label>Peso inicial (kg)</label>
            <input id="startWeightKg" type="number" min="30" max="300" step="0.1" value="${esc(currentProfile().startWeightKg)}">
          </div>
          <div class="field">
            <label>Peso objetivo (kg)</label>
            <input id="goalWeightKg" type="number" min="30" max="300" step="0.1" value="${esc(currentProfile().goalWeightKg)}">
          </div>
        </div>
        <div class="actions" style="margin-top:10px">
          <button class="primary" type="submit">Guardar datos corporales</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>Rutinas</h3>
      <p class="small muted">
        Añade, elimina, reordena o modifica ejercicios. Los cambios se guardan solo para
        <strong>${esc(currentProfile().name)}</strong> en este dispositivo.
      </p>
      <button class="primary" id="manageRoutines">Editar rutinas</button>
    </div>

    <div class="card">
      <h3>Copia de seguridad</h3>
      <p class="small muted">
        Tus datos están guardados en este dispositivo. La copia incluye entrenamientos,
        pesos y rutinas personalizadas.
      </p>
      <div class="actions">
        <button class="secondary" id="exportBtn">Exportar datos</button>
        <label class="secondary file-label">
          Importar
          <input id="importFile" type="file" accept="application/json" hidden>
        </label>
      </div>
    </div>

    <div class="card">
      <h3>Perfil del dispositivo</h3>
      <button class="ghost" id="changeProfile">Cambiar de perfil</button>
    </div>

    <div class="small muted" style="text-align:center;margin-top:12px">Gym Control v5</div>`;

  document.getElementById('saveName').addEventListener('click',()=>{
    const val=document.getElementById('profileName').value.trim();
    if(val){
      currentProfile().name=val.slice(0,30);
      saveData();
      render();
    }
  });

  document.getElementById('bodyProfileForm').addEventListener('submit',e=>{
    e.preventDefault();
    const p=currentProfile();
    p.heightCm=clampNumber(document.getElementById('heightCm').value,100,230,p.heightCm||170);
    p.startWeightKg=Math.round(clampNumber(document.getElementById('startWeightKg').value,30,300,p.startWeightKg||70)*10)/10;
    p.goalWeightKg=Math.round(clampNumber(document.getElementById('goalWeightKg').value,30,300,p.goalWeightKg||70)*10)/10;
    saveData();
    render();
  });

  document.getElementById('manageRoutines').addEventListener('click',()=>{
    state.settingsView='routines';
    render();
  });

  document.getElementById('changeProfile').addEventListener('click',()=>{
    localStorage.removeItem(PROFILE_KEY);
    state.profile='';
    render();
  });

  document.getElementById('exportBtn').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(state.data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`gym-control-backup-${todayISO()}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  });

  document.getElementById('importFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0];
    if(!file) return;

    try{
      const parsed=migrateData(JSON.parse(await file.text()));
      if(!parsed.profiles?.gus || !parsed.profiles?.tam) throw new Error();
      state.data=parsed;
      saveData();
      render();
    }catch{
      alert('El archivo no parece una copia válida de Gym Control.');
    }
  });
}

function moveItem(arr,index,direction){
  const next=index+direction;
  if(index<0 || next<0 || next>=arr.length) return false;
  [arr[index],arr[next]]=[arr[next],arr[index]];
  return true;
}

function renderRoutineManager(v){
  const routines=currentRoutines();

  v.innerHTML=`
    <div class="actions">
      <button class="ghost" id="backSettings">← Ajustes</button>
    </div>

    <div class="card">
      <h2>Editar rutinas</h2>
      <p class="small muted">
        Aquí puedes personalizar las rutinas de <strong>${esc(currentProfile().name)}</strong>.
        Cambiar el nombre de un ejercicio conserva su historial porque su identificador interno no cambia.
      </p>
    </div>

    <div class="card routine-manager-list">
      ${routines.length ? routines.map((r,i)=>`
        <div class="manage-row" data-routine-row="${esc(r.id)}">
          <div class="manage-main">
            <strong>${esc(r.name)}</strong>
            <div class="small muted">
              ${r.kind==='pool'?'Piscina':`${r.exercises.length} ejercicio${r.exercises.length===1?'':'s'}`}
              ${r.subtitle?` · ${esc(r.subtitle)}`:''}
            </div>
          </div>
          <div class="mini-actions">
            <button class="icon-btn" data-move-up="${esc(r.id)}" ${i===0?'disabled':''} aria-label="Subir rutina">↑</button>
            <button class="icon-btn" data-move-down="${esc(r.id)}" ${i===routines.length-1?'disabled':''} aria-label="Bajar rutina">↓</button>
            <button class="secondary compact" data-edit="${esc(r.id)}">Editar</button>
            <button class="danger compact" data-delete="${esc(r.id)}">Eliminar</button>
          </div>
        </div>`).join('')
        : `<div class="empty">No hay rutinas todavía.</div>`}
    </div>

    <div class="card">
      <h3>Nueva rutina</h3>
      <form id="newRoutineForm">
        <div class="field">
          <label>Nombre</label>
          <input id="newRoutineName" maxlength="60" placeholder="Ej.: Tren superior" required>
        </div>
        <div class="field" style="margin-top:8px">
          <label>Tipo</label>
          <select id="newRoutineKind">
            <option value="strength">Pesas / ejercicios</option>
            <option value="pool">Piscina</option>
          </select>
        </div>
        <div class="field" style="margin-top:8px">
          <label>Descripción breve (opcional)</label>
          <input id="newRoutineSubtitle" maxlength="100" placeholder="Ej.: Miércoles">
        </div>
        <div class="actions" style="margin-top:10px">
          <button class="primary" type="submit">Crear rutina</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>Restablecer</h3>
      <p class="small muted">
        Recupera Fuerza A, Fuerza B y Piscina originales. El historial de entrenamientos no se borra.
      </p>
      <button class="danger" id="resetRoutines">Restablecer rutinas originales</button>
    </div>`;

  document.getElementById('backSettings').addEventListener('click',()=>{
    state.settingsView='main';
    render();
  });

  v.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{
    state.editRoutineId=b.dataset.edit;
    state.settingsView='editRoutine';
    render();
  }));

  v.querySelectorAll('[data-move-up]').forEach(b=>b.addEventListener('click',()=>{
    const idx=routines.findIndex(r=>r.id===b.dataset.moveUp);
    if(moveItem(routines,idx,-1)){ saveData(); render(); }
  }));

  v.querySelectorAll('[data-move-down]').forEach(b=>b.addEventListener('click',()=>{
    const idx=routines.findIndex(r=>r.id===b.dataset.moveDown);
    if(moveItem(routines,idx,1)){ saveData(); render(); }
  }));

  v.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{
    const r=getRoutine(b.dataset.delete);
    if(!r) return;
    if(confirm(`¿Eliminar la rutina "${r.name}"?\n\nSu historial anterior no se borrará.`)){
      currentProfile().routines = routines.filter(x=>x.id!==r.id);
      saveData();
      render();
    }
  }));

  document.getElementById('newRoutineForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=document.getElementById('newRoutineName').value.trim().slice(0,60);
    if(!name) return;

    const kind=document.getElementById('newRoutineKind').value==='pool'?'pool':'strength';
    const subtitle=document.getElementById('newRoutineSubtitle').value.trim().slice(0,100);

    const r = kind==='pool'
      ? {
          id:uid('routine'),
          name, subtitle, kind:'pool',
          defaultMinutes:35,
          poolPlan:'Nado a ritmo cómodo.'
        }
      : {
          id:uid('routine'),
          name, subtitle, kind:'strength',
          exercises:[]
        };

    currentProfile().routines.push(r);
    saveData();
    state.editRoutineId=r.id;
    state.settingsView='editRoutine';
    render();
  });

  document.getElementById('resetRoutines').addEventListener('click',()=>{
    if(confirm('¿Restablecer las rutinas originales?\n\nTus entrenamientos e historial NO se borrarán.')){
      currentProfile().routines=cloneDefaults();
      saveData();
      render();
    }
  });
}

function renderRoutineEditor(v,id){
  const r=getRoutine(id);
  if(!r){
    state.settingsView='routines';
    state.editRoutineId=null;
    render();
    return;
  }

  if(r.kind==='pool'){
    renderPoolRoutineEditor(v,r);
    return;
  }

  v.innerHTML=`
    <div class="actions">
      <button class="ghost" id="backRoutines">← Rutinas</button>
    </div>

    <form id="routineMetaForm" class="card">
      <h2>Editar ${esc(r.name)}</h2>
      <div class="field">
        <label>Nombre de la rutina</label>
        <input id="routineName" value="${esc(r.name)}" maxlength="60" required>
      </div>
      <div class="field" style="margin-top:8px">
        <label>Descripción breve</label>
        <input id="routineSubtitle" value="${esc(r.subtitle||'')}" maxlength="100" placeholder="Ej.: Lunes">
      </div>
      <div class="actions" style="margin-top:10px">
        <button class="secondary" type="submit">Guardar nombre</button>
      </div>
    </form>

    <div class="card">
      <div class="editor-heading">
        <div>
          <h3>Ejercicios</h3>
          <div class="small muted">Edita valores y pulsa “Guardar ejercicios”.</div>
        </div>
        <span class="badge">${r.exercises.length} ejercicio${r.exercises.length===1?'':'s'}</span>
      </div>

      <form id="exerciseListForm">
        <div id="exerciseEditorList">
          ${r.exercises.length ? r.exercises.map((ex,i)=>exerciseEditorCard(ex,i,r.exercises.length)).join('') : `<div class="empty">Todavía no hay ejercicios.</div>`}
        </div>
        ${r.exercises.length?`
          <div class="actions" style="margin-top:12px">
            <button class="primary" type="submit">Guardar ejercicios</button>
          </div>
          <div id="exerciseMsg" class="small muted" aria-live="polite"></div>
        `:''}
      </form>
    </div>

    <div class="card">
      <h3>Añadir ejercicio</h3>
      <form id="addExerciseForm">
        <div class="field">
          <label>Nombre</label>
          <input id="newExName" maxlength="80" placeholder="Ej.: Hip thrust" required>
        </div>
        <div class="editor-grid" style="margin-top:8px">
          <div class="field">
            <label>Tipo</label>
            <select id="newExType">
              <option value="weight">Peso + repeticiones</option>
              <option value="time">Tiempo (segundos)</option>
            </select>
          </div>
          <div class="field">
            <label>Series</label>
            <input id="newExSets" type="number" min="1" max="10" value="3">
          </div>
          <div class="field">
            <label id="newMinLabel">Reps mín.</label>
            <input id="newExMin" type="number" min="1" max="100" value="10">
          </div>
          <div class="field">
            <label id="newMaxLabel">Reps máx.</label>
            <input id="newExMax" type="number" min="1" max="100" value="12">
          </div>
        </div>
        <div class="actions" style="margin-top:10px">
          <button class="primary" type="submit">Añadir ejercicio</button>
        </div>
      </form>
    </div>`;

  document.getElementById('backRoutines').addEventListener('click',()=>{
    state.settingsView='routines';
    state.editRoutineId=null;
    render();
  });

  document.getElementById('routineMetaForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=document.getElementById('routineName').value.trim();
    if(!name) return;
    r.name=name.slice(0,60);
    r.subtitle=document.getElementById('routineSubtitle').value.trim().slice(0,100);
    saveData();
    render();
  });

  v.querySelectorAll('[data-ex-up]').forEach(b=>b.addEventListener('click',()=>{
    const idx=r.exercises.findIndex(ex=>ex.id===b.dataset.exUp);
    if(moveItem(r.exercises,idx,-1)){ saveData(); render(); }
  }));

  v.querySelectorAll('[data-ex-down]').forEach(b=>b.addEventListener('click',()=>{
    const idx=r.exercises.findIndex(ex=>ex.id===b.dataset.exDown);
    if(moveItem(r.exercises,idx,1)){ saveData(); render(); }
  }));

  v.querySelectorAll('[data-ex-delete]').forEach(b=>b.addEventListener('click',()=>{
    const ex=r.exercises.find(x=>x.id===b.dataset.exDelete);
    if(!ex) return;
    if(confirm(`¿Eliminar "${ex.name}" de esta rutina?\n\nSu historial anterior se conservará.`)){
      r.exercises=r.exercises.filter(x=>x.id!==ex.id);
      saveData();
      render();
    }
  }));

  const exerciseForm=document.getElementById('exerciseListForm');
  if(exerciseForm){
    exerciseForm.addEventListener('submit',e=>{
      e.preventDefault();
      const cards=[...v.querySelectorAll('[data-editor-ex]')];

      cards.forEach(card=>{
        const ex=r.exercises.find(x=>x.id===card.dataset.editorEx);
        if(!ex) return;

        const name=card.querySelector('[data-name]').value.trim();
        if(name) ex.name=name.slice(0,80);

        ex.type=card.querySelector('[data-type]').value==='time'?'time':'weight';
        ex.sets=clampInt(card.querySelector('[data-sets]').value,1,10,3);

        const maxLimit=ex.type==='time'?600:100;
        ex.min=clampInt(card.querySelector('[data-min]').value,1,maxLimit,ex.type==='time'?20:10);
        ex.max=clampInt(card.querySelector('[data-max]').value,1,maxLimit,ex.type==='time'?40:12);
        if(ex.max<ex.min) [ex.min,ex.max]=[ex.max,ex.min];
      });

      saveData();
      const msg=document.getElementById('exerciseMsg');
      if(msg) msg.textContent='Cambios guardados.';
      setTimeout(()=>render(),350);
    });
  }

  document.getElementById('newExType').addEventListener('change',e=>{
    const timed=e.target.value==='time';
    document.getElementById('newMinLabel').textContent=timed?'Segundos mín.':'Reps mín.';
    document.getElementById('newMaxLabel').textContent=timed?'Segundos máx.':'Reps máx.';
    const minInput=document.getElementById('newExMin');
    const maxInput=document.getElementById('newExMax');
    minInput.max=timed?'600':'100';
    maxInput.max=timed?'600':'100';
    minInput.value=timed?'20':'10';
    maxInput.value=timed?'40':'12';
  });

  document.getElementById('addExerciseForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=document.getElementById('newExName').value.trim();
    if(!name) return;

    const type=document.getElementById('newExType').value==='time'?'time':'weight';
    const limit=type==='time'?600:100;
    let min=clampInt(document.getElementById('newExMin').value,1,limit,type==='time'?20:10);
    let max=clampInt(document.getElementById('newExMax').value,1,limit,type==='time'?40:12);
    if(max<min) [min,max]=[max,min];

    r.exercises.push({
      id:uid('ex'),
      name:name.slice(0,80),
      sets:clampInt(document.getElementById('newExSets').value,1,10,3),
      min,max,type
    });

    saveData();
    render();
  });
}

function exerciseEditorCard(ex,index,total){
  return `
    <div class="editor-card" data-editor-ex="${esc(ex.id)}">
      <div class="editor-heading">
        <strong>${index+1}. ${esc(ex.name)}</strong>
        <div class="mini-actions">
          <button class="icon-btn" type="button" data-ex-up="${esc(ex.id)}" ${index===0?'disabled':''} aria-label="Subir ejercicio">↑</button>
          <button class="icon-btn" type="button" data-ex-down="${esc(ex.id)}" ${index===total-1?'disabled':''} aria-label="Bajar ejercicio">↓</button>
          <button class="danger compact" type="button" data-ex-delete="${esc(ex.id)}">Eliminar</button>
        </div>
      </div>

      <div class="field" style="margin-top:8px">
        <label>Nombre</label>
        <input data-name value="${esc(ex.name)}" maxlength="80">
      </div>

      <div class="editor-grid" style="margin-top:8px">
        <div class="field">
          <label>Tipo</label>
          <select data-type>
            <option value="weight" ${ex.type==='weight'?'selected':''}>Peso + reps</option>
            <option value="time" ${ex.type==='time'?'selected':''}>Tiempo</option>
          </select>
        </div>
        <div class="field">
          <label>Series</label>
          <input data-sets type="number" min="1" max="10" value="${ex.sets}">
        </div>
        <div class="field">
          <label>Mínimo</label>
          <input data-min type="number" min="1" max="600" value="${ex.min}">
        </div>
        <div class="field">
          <label>Máximo</label>
          <input data-max type="number" min="1" max="600" value="${ex.max}">
        </div>
      </div>

      <div class="small muted" style="margin-top:7px">
        ID interno: ${esc(ex.id)} · No cambia al renombrar, por eso conserva el historial.
      </div>
    </div>`;
}

function renderPoolRoutineEditor(v,r){
  v.innerHTML=`
    <div class="actions">
      <button class="ghost" id="backRoutines">← Rutinas</button>
    </div>

    <form id="poolRoutineForm" class="card">
      <h2>Editar ${esc(r.name)}</h2>

      <div class="field">
        <label>Nombre</label>
        <input id="routineName" value="${esc(r.name)}" maxlength="60" required>
      </div>

      <div class="field" style="margin-top:8px">
        <label>Descripción breve</label>
        <input id="routineSubtitle" value="${esc(r.subtitle||'')}" maxlength="100">
      </div>

      <div class="field" style="margin-top:8px">
        <label>Duración predeterminada (min)</label>
        <input id="poolDefaultMinutes" type="number" min="1" max="300" value="${r.defaultMinutes||35}">
      </div>

      <div class="field" style="margin-top:8px">
        <label>Plan que aparece al iniciar</label>
        <textarea id="poolPlan" maxlength="500">${esc(r.poolPlan||'')}</textarea>
      </div>

      <div class="actions" style="margin-top:10px">
        <button class="primary" type="submit">Guardar cambios</button>
      </div>
    </form>`;

  document.getElementById('backRoutines').addEventListener('click',()=>{
    state.settingsView='routines';
    state.editRoutineId=null;
    render();
  });

  document.getElementById('poolRoutineForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=document.getElementById('routineName').value.trim();
    if(!name) return;

    r.name=name.slice(0,60);
    r.subtitle=document.getElementById('routineSubtitle').value.trim().slice(0,100);
    r.defaultMinutes=clampInt(document.getElementById('poolDefaultMinutes').value,1,300,35);
    r.poolPlan=document.getElementById('poolPlan').value.trim().slice(0,500) || 'Nado a ritmo cómodo.';
    saveData();

    state.settingsView='routines';
    state.editRoutineId=null;
    render();
  });
}

render();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
  });
}
