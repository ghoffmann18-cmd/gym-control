const APP_KEY = 'gymControlV1';
const PROFILE_KEY = 'gymControlCurrentProfile';

const routines = {
  A: {
    name: 'Fuerza A',
    subtitle: 'Lunes / sábado alterno',
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
  B: {
    name: 'Fuerza B',
    subtitle: 'Jueves / sábado alterno',
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
  P: {
    name: 'Piscina',
    subtitle: '30–40 min',
    pool: true
  }
};

function emptyData(){
  return {
    profiles: {
      gus: {name:'Gus', workouts:[], bodyWeight:[]},
      tam: {name:'Tam', workouts:[], bodyWeight:[]}
    }
  };
}
function loadData(){
  try{
    const raw = localStorage.getItem(APP_KEY);
    if(!raw) return emptyData();
    const data = JSON.parse(raw);
    if(!data.profiles?.gus || !data.profiles?.tam) return emptyData();
    return data;
  }catch{ return emptyData(); }
}
function saveData(){ localStorage.setItem(APP_KEY, JSON.stringify(state.data)); }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function formatDate(iso){
  const [y,m,d]=iso.split('-');
  return `${d}/${m}/${y}`;
}
function currentProfile(){ return state.data.profiles[state.profile]; }

const state = {
  data: loadData(),
  profile: localStorage.getItem(PROFILE_KEY) || '',
  tab: 'home',
  activeRoutine: null
};

function setProfile(id){
  state.profile=id;
  localStorage.setItem(PROFILE_KEY,id);
  state.tab='home'; state.activeRoutine=null;
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
        if(!best || Number(s.weight)>Number(best.weight) || (Number(s.weight)===Number(best.weight) && Number(s.reps)>Number(best.reps))) best=s;
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
        <p class="muted">Elige quién usará este dispositivo. Cada perfil guarda sus propios pesos e historial.</p>
        <div class="profile-choice">
          <button class="primary" data-profile="gus">Gus</button>
          <button class="secondary" data-profile="tam">Tam</button>
        </div>
      </div>`;
    app.querySelectorAll('[data-profile]').forEach(b=>b.addEventListener('click',()=>setProfile(b.dataset.profile)));
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
    localStorage.removeItem(PROFILE_KEY); state.profile=''; render();
  });
  app.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;state.activeRoutine=null;render();}));
  renderView();
}
function renderView(){
  const v=document.getElementById('view');
  if(state.activeRoutine){ renderWorkout(v,state.activeRoutine); return; }
  if(state.tab==='home') renderHome(v);
  if(state.tab==='history') renderHistory(v);
  if(state.tab==='weight') renderWeight(v);
  if(state.tab==='settings') renderSettings(v);
}
function renderHome(v){
  const day=new Date().getDay();
  const suggestion = day===1?'Fuerza A':day===2?'Piscina':day===4?'Fuerza B':day===6?'Fuerza A/B':'Descanso';
  v.innerHTML = `
    <div class="card">
      <div class="small muted">Sugerencia de hoy</div>
      <div class="stat">${suggestion}</div>
      <div class="small muted">Puedes iniciar cualquier rutina igualmente.</div>
    </div>
    <div class="grid">
      ${Object.entries(routines).map(([id,r])=>`
        <button class="routine-btn" data-routine="${id}">
          <strong>${esc(r.name)}</strong>
          <span class="muted">${esc(r.subtitle)}</span>
        </button>`).join('')}
    </div>
    <div class="card">
      <h3>Últimos entrenamientos</h3>
      ${recentWorkouts(3)}
    </div>`;
  v.querySelectorAll('[data-routine]').forEach(b=>b.addEventListener('click',()=>{state.activeRoutine=b.dataset.routine;render();}));
}
function recentWorkouts(limit=10){
  const list=[...currentProfile().workouts].sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt||0)-(a.createdAt||0)).slice(0,limit);
  if(!list.length) return `<div class="empty">Todavía no hay entrenamientos guardados.</div>`;
  return list.map(w=>`
    <div class="history-item">
      <div class="history-title"><span>${esc(w.name)}</span><span>${formatDate(w.date)}</span></div>
      <div class="small muted">${w.type==='pool' ? `${w.minutes||0} min` : `${w.exercises?.length||0} ejercicios`}</div>
    </div>`).join('');
}
function renderWorkout(v,id){
  const r=routines[id];
  if(r.pool){ renderPool(v); return; }
  v.innerHTML = `
    <div class="actions"><button class="ghost" id="backBtn">← Volver</button></div>
    <div class="card">
      <h2>${esc(r.name)}</h2>
      <div class="field"><label>Fecha</label><input id="workoutDate" type="date" value="${todayISO()}"></div>
    </div>
    <form id="workoutForm" class="card">
      ${r.exercises.map(ex=>{
        const last=lastExerciseSession(ex.id);
        const lastText = last ? last.sets.map(s=>ex.type==='time'?`${s.seconds||0}s`:`${s.weight||0}kg×${s.reps||0}`).join(' · ') : 'Sin registros anteriores';
        return `<div class="exercise" data-ex="${ex.id}">
          <div class="exercise-head">
            <div>
              <strong>${esc(ex.name)}</strong>
              <div class="small muted">${ex.sets} series · ${ex.min}${ex.max!==ex.min?`–${ex.max}`:''} ${ex.type==='time'?'segundos':'reps'}</div>
              <div class="last">Última vez: ${esc(lastText)}</div>
            </div>
            ${bestSet(ex.id)&&ex.type==='weight'?`<span class="badge">Mejor ${bestSet(ex.id).weight} kg</span>`:''}
          </div>
          ${Array.from({length:ex.sets},(_,i)=>{
            const prev=last?.sets?.[i]||{};
            if(ex.type==='time') return `<div class="set-row time">
              <div class="small muted">S${i+1}</div>
              <div class="field"><label>Segundos</label><input inputmode="numeric" type="number" min="0" max="600" step="1" data-sec value="${prev.seconds??''}"></div>
            </div>`;
            return `<div class="set-row">
              <div class="small muted">S${i+1}</div>
              <div class="field"><label>kg</label><input inputmode="decimal" type="number" min="0" max="1000" step="0.5" data-weight value="${prev.weight??''}"></div>
              <div class="field"><label>Reps</label><input inputmode="numeric" type="number" min="0" max="100" step="1" data-reps value="${prev.reps??''}"></div>
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}
      <div class="actions" style="margin-top:14px">
        <button class="primary" type="submit">Guardar entrenamiento</button>
      </div>
      <div id="formMsg" class="small muted" aria-live="polite"></div>
    </form>`;
  document.getElementById('backBtn').addEventListener('click',()=>{state.activeRoutine=null;render();});
  document.getElementById('workoutForm').addEventListener('submit',e=>{
    e.preventDefault();
    const exercises=[];
    r.exercises.forEach(ex=>{
      const box=v.querySelector(`[data-ex="${ex.id}"]`);
      const sets=[];
      if(ex.type==='time'){
        box.querySelectorAll('[data-sec]').forEach(inp=>{
          const seconds=Number(inp.value||0);
          if(seconds>0) sets.push({seconds});
        });
      }else{
        const weights=[...box.querySelectorAll('[data-weight]')];
        const reps=[...box.querySelectorAll('[data-reps]')];
        weights.forEach((inp,i)=>{
          const weight=Number(inp.value||0), rep=Number(reps[i].value||0);
          if(weight>0 || rep>0) sets.push({weight, reps:rep});
        });
      }
      if(sets.length) exercises.push({id:ex.id,name:ex.name,type:ex.type,sets});
    });
    if(!exercises.length){ document.getElementById('formMsg').textContent='Añade al menos una serie antes de guardar.'; return; }
    currentProfile().workouts.push({
      id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      type:'strength', routine:id, name:r.name,
      date:document.getElementById('workoutDate').value||todayISO(),
      createdAt:Date.now(), exercises
    });
    saveData();
    state.activeRoutine=null; state.tab='home'; render();
  });
}
function renderPool(v){
  v.innerHTML=`
    <div class="actions"><button class="ghost" id="backBtn">← Volver</button></div>
    <form id="poolForm" class="card">
      <h2>Piscina</h2>
      <div class="field"><label>Fecha</label><input id="poolDate" type="date" value="${todayISO()}"></div>
      <div class="field" style="margin-top:10px"><label>Tiempo total (min)</label><input id="poolMinutes" inputmode="numeric" type="number" min="1" max="300" value="35"></div>
      <div class="notice" style="margin-top:10px">5 min suave · 10 min cómodo · 15 min alternando 1 largo rápido + 2 suaves · 5–10 min suave</div>
      <div class="field" style="margin-top:10px"><label>Notas</label><textarea id="poolNotes" placeholder="Ej.: me sentí bien, descansé 30 s cada 4 largos..."></textarea></div>
      <div class="actions" style="margin-top:12px"><button class="primary" type="submit">Guardar piscina</button></div>
    </form>`;
  document.getElementById('backBtn').addEventListener('click',()=>{state.activeRoutine=null;render();});
  document.getElementById('poolForm').addEventListener('submit',e=>{
    e.preventDefault();
    const minutes=Math.max(1,Math.min(300,Number(document.getElementById('poolMinutes').value||0)));
    currentProfile().workouts.push({
      id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      type:'pool', routine:'P', name:'Piscina',
      date:document.getElementById('poolDate').value||todayISO(),
      createdAt:Date.now(), minutes,
      notes:document.getElementById('poolNotes').value.trim()
    });
    saveData(); state.activeRoutine=null; state.tab='home'; render();
  });
}
function renderHistory(v){
  const list=[...currentProfile().workouts].sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt||0)-(a.createdAt||0));
  v.innerHTML=`<div class="card"><h2>Historial</h2>
    ${!list.length?`<div class="empty">No hay entrenamientos todavía.</div>`:list.map(w=>`
      <div class="history-item">
        <div class="history-title"><span>${esc(w.name)}</span><span>${formatDate(w.date)}</span></div>
        ${w.type==='pool'
          ? `<div class="small muted">${w.minutes||0} min${w.notes?` · ${esc(w.notes)}`:''}</div>`
          : (w.exercises||[]).map(e=>`<div class="small" style="margin-top:5px"><strong>${esc(e.name)}:</strong> ${
              e.type==='time' ? e.sets.map(s=>`${s.seconds}s`).join(' / ') : e.sets.map(s=>`${s.weight}kg×${s.reps}`).join(' / ')
            }</div>`).join('')
        }
      </div>`).join('')}
    </div>`;
}
function renderWeight(v){
  const weights=[...currentProfile().bodyWeight].sort((a,b)=>b.date.localeCompare(a.date));
  const latest=weights[0];
  v.innerHTML=`
    <div class="card">
      <h2>Peso corporal</h2>
      ${latest?`<div class="stat">${latest.kg} kg</div><div class="small muted">Último registro · ${formatDate(latest.date)}</div>`:`<div class="muted">Sin registros.</div>`}
      <form id="weightForm" style="margin-top:14px">
        <div class="weight-row">
          <div class="field"><label>Peso actual (kg)</label><input id="bodyKg" inputmode="decimal" type="number" min="30" max="300" step="0.1" required></div>
          <button class="primary" type="submit" style="align-self:end">Guardar</button>
        </div>
      </form>
    </div>
    <div class="card"><h3>Evolución</h3>
      ${weights.length?weights.map(x=>`<div class="history-item"><div class="history-title"><span>${x.kg} kg</span><span>${formatDate(x.date)}</span></div></div>`).join(''):`<div class="empty">Añade tu primer peso.</div>`}
    </div>`;
  document.getElementById('weightForm').addEventListener('submit',e=>{
    e.preventDefault();
    const kg=Number(document.getElementById('bodyKg').value);
    if(!Number.isFinite(kg)||kg<30||kg>300) return;
    currentProfile().bodyWeight.push({date:todayISO(),kg:Math.round(kg*10)/10,createdAt:Date.now()});
    saveData(); render();
  });
}
function renderSettings(v){
  v.innerHTML=`
    <div class="card">
      <h2>Ajustes</h2>
      <div class="field"><label>Nombre del perfil</label><input id="profileName" value="${esc(currentProfile().name)}" maxlength="30"></div>
      <div class="actions" style="margin-top:10px"><button class="secondary" id="saveName">Guardar nombre</button></div>
    </div>
    <div class="card">
      <h3>Copia de seguridad</h3>
      <p class="small muted">Tus datos están guardados en este dispositivo. Exporta una copia de vez en cuando.</p>
      <div class="actions">
        <button class="secondary" id="exportBtn">Exportar datos</button>
        <label class="secondary" style="display:inline-flex;align-items:center">Importar<input id="importFile" type="file" accept="application/json" hidden></label>
      </div>
    </div>
    <div class="card">
      <h3>Perfil del dispositivo</h3>
      <button class="ghost" id="changeProfile">Cambiar de perfil</button>
    </div>`;
  document.getElementById('saveName').addEventListener('click',()=>{
    const val=document.getElementById('profileName').value.trim();
    if(val){ currentProfile().name=val; saveData(); render(); }
  });
  document.getElementById('changeProfile').addEventListener('click',()=>{
    localStorage.removeItem(PROFILE_KEY); state.profile=''; render();
  });
  document.getElementById('exportBtn').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(state.data,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`gym-control-backup-${todayISO()}.json`; a.click(); URL.revokeObjectURL(a.href);
  });
  document.getElementById('importFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0]; if(!file) return;
    try{
      const parsed=JSON.parse(await file.text());
      if(!parsed.profiles?.gus || !parsed.profiles?.tam) throw new Error();
      state.data=parsed; saveData(); render();
    }catch{ alert('El archivo no parece una copia válida de Gym Control.'); }
  });
}

render();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}).catch(()=>{}));
}
