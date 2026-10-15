const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const demoTemplates = [
  {id:'abdomen',name:'Ecografía abdominal',description:'Hígado, vesícula, vías biliares, páncreas, bazo, riñones y vejiga.',content:`<h3>ECOSONOGRAMA ABDOMINAL</h3><p><b>Hígado:</b> Tamaño y ecogenicidad dentro de parámetros a describir. Arquitectura conservada.</p><p><b>Vesícula biliar:</b> Pared, contenido y vía biliar a describir.</p><p><b>Páncreas:</b> Morfología y ecogenicidad a describir.</p><p><b>Bazo:</b> Tamaño y ecotextura a describir.</p><p><b>Riñones:</b> Tamaño, morfología, diferenciación corticomedular y sistema colector a describir.</p><p><b>Vejiga:</b> Distensión, pared y contenido a describir.</p><p><b>IMPRESIÓN:</b> Describir hallazgos y conclusión.</p>`},
  {id:'pelvis',name:'Ecografía pélvica',description:'Útero, endometrio, anexos y fondo de saco.',content:`<h3>ECOSONOGRAMA PÉLVICO</h3><p><b>Útero:</b> Posición, dimensiones, contornos y ecotextura a describir.</p><p><b>Endometrio:</b> Grosor y características a describir.</p><p><b>Anexo derecho:</b> Describir dimensiones y características.</p><p><b>Anexo izquierdo:</b> Describir dimensiones y características.</p><p><b>Fondo de saco:</b> Describir presencia o ausencia de líquido.</p><p><b>IMPRESIÓN:</b> Describir hallazgos y conclusión.</p>`},
  {id:'renal',name:'Ecografía renal y vesical',description:'Riñones, sistema colector y vejiga.',content:`<h3>ECOSONOGRAMA RENAL Y VESICAL</h3><p><b>Riñón derecho:</b> Dimensiones, cortical, diferenciación y sistema colector.</p><p><b>Riñón izquierdo:</b> Dimensiones, cortical, diferenciación y sistema colector.</p><p><b>Vejiga:</b> Distensión, pared y contenido. Residuo postmiccional si corresponde.</p><p><b>IMPRESIÓN:</b> Describir hallazgos y conclusión.</p>`},
  {id:'thyroid',name:'Ecografía tiroidea',description:'Tiroides, parénquima y lesiones focales.',content:`<h3>ECOSONOGRAMA TIROIDEO</h3><p><b>Tiroides:</b> Dimensiones, volumen y ecogenicidad a describir.</p><p><b>Lóbulo derecho:</b> Describir lesiones focales si existen.</p><p><b>Lóbulo izquierdo:</b> Describir lesiones focales si existen.</p><p><b>Istmo y cadenas ganglionares:</b> Describir.</p><p><b>IMPRESIÓN:</b> Describir hallazgos y conclusión.</p>`}
];

const demoConsultationTemplates = [
  {id:'demo-general',name:'Consulta general',description:'Motivo, antecedentes, examen físico, evaluación, diagnóstico y plan.',content:`<h3>CONSULTA GENERAL</h3><p><b>Motivo de consulta:</b></p><p><b>Antecedentes relevantes:</b></p><p><b>Examen físico:</b></p><p><b>Evaluación:</b></p><p><b>Diagnóstico:</b></p><p><b>Plan / indicaciones:</b></p><p><b>Observaciones:</b></p>`},
  {id:'demo-gineco',name:'Consulta ginecológica',description:'Estructura orientativa para consultas ginecológicas.',content:`<h3>CONSULTA GINECOLÓGICA</h3><p><b>Motivo de consulta:</b></p><p><b>Antecedentes gineco-obstétricos:</b></p><p><b>Examen físico:</b></p><p><b>Evaluación:</b></p><p><b>Diagnóstico:</b></p><p><b>Plan / indicaciones:</b></p><p><b>Observaciones:</b></p>`},
  {id:'demo-control',name:'Consulta de seguimiento',description:'Plantilla para controles y seguimiento.',content:`<h3>CONSULTA DE SEGUIMIENTO</h3><p><b>Motivo / evolución:</b></p><p><b>Hallazgos relevantes:</b></p><p><b>Evaluación:</b></p><p><b>Diagnóstico:</b></p><p><b>Plan / indicaciones:</b></p><p><b>Observaciones:</b></p>`}
];
// EcoReport Pro V5.8.8.7
const cfg = window.ECOREPORT_CONFIG || {};
let supabaseClient = null;
let currentUser = null;
let monthlyChart, typesChart;
let state = {
  templates:[...demoTemplates], reports:[], images:[], patients:[], appointments:[], consultationTemplates:[], consultations:[], specialties:[], specialtyMemberIds:new Set(), managementConsultationTemplates:[], currentSpecialtyId:null, currentConsultationId:null, agendaDate:new Date(), agendaMode:'month', historyMode:'ecografias', templateMode:'ecografias', historyConsultations:[], monitoringHistoryAppointments:[], currentReportAppointmentId:null, specialtySessionAccess:new Set(), sectionSessionAccess:new Set(), adminMode:'overview', prescriptionSource:null, prescriptionItems:[], adminCharts:{} , patientLoadError:'', prescriptionFormat:'a6', navigationBusy:false, navigationSeq:0, overdueModalLastShown:0, isPlatformOwner:false, clinicAccessEnabled:true, clinicAccessStatus:'active', clinicAccessReason:'', ownerClinics:[], ownerSelectedClinicId:null, ownerSelectedSpecialtyId:null, ownerAccessVerified:false,
  settings:{clinicName:'Clínica Demo',clinicAddress:'',clinicPhone:'',doctorName:'',baseFontSize:11,fontFamily:'Arial',letterheadWidth:100,letterheadHeight:100,topMargin:28,bottomMargin:20,publicReportBase:cfg.DOWNLOAD_FUNCTION_URL||''},
  letterhead:null, signature:null, currentTemplate:'abdomen', clinicId:cfg.CLINIC_ID||'', currentRemoteReportId:null, currentReportToken:null
};

function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)}
function isConnected(){return !!supabaseClient}
function requireConnection(){if(!supabaseClient){toast('Configura Supabase y pulsa Conectar.');showView('settings');return false}return true}
function requireSession(){if(!currentUser){toast('Inicia sesión antes de guardar informes.');showLogin();return false}return true}

async function connectSupabase(){
  const url=$('#supabaseUrl').value.trim();
  const key=$('#supabaseKey').value.trim();
  if(!url||!key){toast('Completa Supabase URL y Publishable key.');return}
  try{
    supabaseClient=window.supabase.createClient(url,key);
    const {data:{user}}=await supabaseClient.auth.getUser();
    currentUser=user||null;
    state.clinicId=$('#clinicId').value.trim()||cfg.CLINIC_ID||'';
    state.settings.publicReportBase=$('#downloadFunctionUrl').value.trim()||cfg.DOWNLOAD_FUNCTION_URL||'';
    updateConnectionUI();
    if(currentUser) await afterLogin();
    toast(currentUser?'Supabase conectado.':'Supabase conectado; inicia sesión.');
  }catch(e){console.error(e);supabaseClient=null;toast('No se pudo conectar con Supabase. Revisa la URL y la key.')}
}

async function loadMyClinic(){
  if(!supabaseClient || !currentUser) return null;
  const {data: rows, error} = await supabaseClient.rpc('get_my_clinics_access');
  if(error){ console.error('EcoReport clinic access error:',error); throw error; }
  const memberships=(rows||[]).filter(m=>m.access_enabled!==false && m.active!==false);
  if(!memberships.length){ state.clinicId=''; updateConnectionUI(); return null; }
  const selected=memberships.find(m=>String(m.clinic_id)===String(state.clinicId))||memberships[0];
  state.clinicId=selected.clinic_id;
  $('#clinicId').value=state.clinicId;
  state.clinicAccessEnabled=selected.access_enabled!==false;
  state.clinicAccessStatus=selected.subscription_status||(state.clinicAccessEnabled?'active':'suspended');
  state.clinicAccessReason=selected.access_reason||'';
  state.settings.clinicName=selected.name||state.settings.clinicName;
  state.settings.clinicAddress=selected.address||'';
  state.settings.clinicPhone=selected.phone||'';
  loadSettings();
  return selected;
}

async function afterLogin(){
  const {data:{user}}=await supabaseClient.auth.getUser();
  currentUser=user||null;
  if(!currentUser){ updateConnectionUI(); return; }

  try{
    await loadOwnerState();
    const clinicResult=await loadMyClinic();
    if(!state.isPlatformOwner && clinicResult && clinicResult.access_enabled===false){ const err=new Error('El acceso de esta clínica está suspendido. Contacta al propietario de EcoReport.'); err.code='CLINIC_SUSPENDED'; throw err; }
    updateConnectionUI();
    if(state.clinicId){
      await loadRemoteTemplates();
      await loadPatients();
      await loadRemoteHistory();
      await loadAppointments();
      await loadSpecialties();
      await loadConsultationData();
    }
  }catch(e){
    console.error('EcoReport afterLogin error:', e);
    updateConnectionUI();
    toast('Sesión iniciada, pero no se pudo cargar la clínica: '+(e?.message||e));
  }
}

function updateConnectionUI(){
  const badge=$('#connectionStatus');
  const auth=$('#authStatus');
  badge.textContent=supabaseClient?(currentUser?'Conectado':'Supabase conectado'):'Sin conectar';
  badge.className='pill '+(currentUser?'ok':'');
  auth.textContent=currentUser?`Sesión: ${currentUser.email||currentUser.id}${state.clinicId?' · Clínica: '+state.clinicId:' · Falta Clinic ID'}`:'No hay una sesión activa.';
  $('#clinicBadge').textContent=state.settings.clinicName||'Clínica';
}

function showLogin(){
  openModal('Acceso a EcoReport',`
    <label>Correo electrónico<input id="loginEmail" type="email" autocomplete="email" placeholder="correo@clinica.com"></label>
    <label>Contraseña<input id="loginPassword" type="password" autocomplete="current-password" placeholder="Mínimo 6 caracteres"></label>
    <div class="quick-actions"><button class="btn primary" id="doLogin" type="button">Iniciar sesión</button><button class="btn secondary" id="doSignup" type="button">Crear cuenta</button></div>
    <div id="authModalStatus" class="auth-modal-status">Listo para conectar con Supabase.</div>
    <p class="editor-hint">Si está activada la confirmación de correo en Supabase, después de crear la cuenta debes confirmar el correo antes de iniciar sesión.</p>`);

  const status = (message, ok=false) => {
    const el=$('#authModalStatus');
    if(el){ el.textContent=message; el.className='auth-modal-status '+(ok?'ok':''); }
  };
  const setBusy = (busy) => {
    const a=$('#doLogin'), b=$('#doSignup');
    if(a){a.disabled=busy;a.textContent=busy?'Procesando…':'Iniciar sesión'}
    if(b){b.disabled=busy;b.textContent=busy?'Procesando…':'Crear cuenta'}
  };
  const credentials = () => ({email:$('#loginEmail').value.trim().toLowerCase(),password:$('#loginPassword').value});

  $('#doLogin').onclick=async()=>{
    if(!requireConnection()) return;
    const {email,password}=credentials();
    if(!email||!password){status('Completa el correo y la contraseña.');return toast('Completa correo y contraseña')}
    setBusy(true); status('Conectando con Supabase…');
    try{
      const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
      if(error){console.error('EcoReport login error:',error);status(error.message||'No fue posible iniciar sesión.');toast(error.message||'No fue posible iniciar sesión.');return}
      currentUser=data.user;
      await afterLogin();
      closeModal();
      toast('Sesión iniciada correctamente.');
    }catch(e){console.error('EcoReport login exception:',e);status('Error de conexión: '+(e?.message||e));toast('Error de conexión con Supabase.')}
    finally{setBusy(false)}
  };

  $('#doSignup').onclick=async()=>{
    if(!requireConnection()) return;
    const {email,password}=credentials();
    if(!email||!password){status('Completa el correo y la contraseña.');return toast('Completa correo y contraseña')}
    if(password.length<6){status('La contraseña debe tener al menos 6 caracteres.');return toast('Usa una contraseña de al menos 6 caracteres')}
    setBusy(true); status('Creando la cuenta en Supabase…');
    try{
      const {data,error}=await supabaseClient.auth.signUp({email,password});
      if(error){console.error('EcoReport signup error:',error);status(error.message||'No fue posible crear la cuenta.');toast(error.message||'No fue posible crear la cuenta.');return}
      if(data.session){
        currentUser=data.user;
        await afterLogin();
        closeModal();
        toast('Cuenta creada y sesión iniciada.');
      }else{
        status('Cuenta creada. Revisa tu correo para confirmar la cuenta.',true);
        toast('Cuenta creada. Revisa tu correo de confirmación.');
      }
    }catch(e){console.error('EcoReport signup exception:',e);status('Error de conexión: '+(e?.message||e));toast('Error de conexión con Supabase.')}
    finally{setBusy(false)}
  };
}

async function signOut(){if(!supabaseClient)return;await supabaseClient.auth.signOut();currentUser=null;state.clinicId='';state.specialties=[];state.specialtyMemberIds=new Set();state.currentSpecialtyId=null;updateConnectionUI();showAuthGate();setGateStatus('Sesión cerrada. Puedes iniciar sesión nuevamente.');toast('Sesión cerrada')}

async function createClinic(){
  if(!requireConnection()||!requireSession())return;
  openModal('Crear clínica',`<label>Nombre de la clínica<input id="newClinicName" value="${esc(state.settings.clinicName||'Mi clínica')}"></label><label>Dirección<input id="newClinicAddress" value="${esc(state.settings.clinicAddress||'')}"></label><label>Teléfono<input id="newClinicPhone" value="${esc(state.settings.clinicPhone||'')}"></label><label>Ecografista<input id="newClinicDoctor" value="${esc(state.settings.doctorName||'')}"></label><button class="btn primary" id="doCreateClinic">Crear clínica</button>`);
  $('#doCreateClinic').onclick=async()=>{
    const {data,error}=await supabaseClient.rpc('create_my_clinic',{clinic_name:$('#newClinicName').value,clinic_address:$('#newClinicAddress').value,clinic_phone:$('#newClinicPhone').value,sonographer_name:$('#newClinicDoctor').value});
    if(error){console.error(error);return toast(error.message)}
    state.clinicId=data;$('#clinicId').value=data;state.settings.clinicName=$('#newClinicName').value;state.settings.clinicAddress=$('#newClinicAddress').value;state.settings.clinicPhone=$('#newClinicPhone').value;state.settings.doctorName=$('#newClinicDoctor').value;loadSettings();closeModal();updateConnectionUI();await loadRemoteTemplates();await loadRemoteHistory();toast('Clínica creada correctamente')
  };
}

async function loadRemoteTemplates(){
  if(!supabaseClient||!currentUser||!state.clinicId)return;
  const {data,error}=await supabaseClient.from('templates').select('id,name,description,content_html').eq('clinic_id',state.clinicId).eq('active',true).order('name');
  if(error){console.error(error);return}
  if(data?.length){
    state.templates=data.map(t=>({id:t.id,name:t.name,description:t.description||'',content:t.content_html||''}));
    if(!state.templates.some(t=>String(t.id)===String(state.currentTemplate))) state.currentTemplate=state.templates[0].id;
  }
  if(!state.templates.some(t=>t.id===state.currentTemplate)) state.currentTemplate=state.templates[0]?.id||state.currentTemplate;
  renderTemplates();renderTemplateSelect();loadTemplate();
}

async function loadRemoteHistory(){
  if(!supabaseClient||!currentUser||!state.clinicId)return;
  try{
    let rows=[];
    try{
      const rpc=await supabaseClient.rpc('history_list_reports',{p_clinic_id:state.clinicId});
      if(rpc.error)throw rpc.error;
      rows=rpc.data||[];
    }catch(rpcErr){
      console.warn('EcoReport history RPC fallback:',rpcErr?.message||rpcErr);
      const direct=await supabaseClient.from('reports').select('id,patient_id,template_id,public_token,public_download_enabled,pdf_storage_path,reason,conditions,status,performed_at,created_at,findings_html').eq('clinic_id',state.clinicId).order('performed_at',{ascending:false}).limit(500);
      if(direct.error)throw direct.error;
      const reportRows=direct.data||[];const patientIds=[...new Set(reportRows.map(r=>r.patient_id).filter(Boolean))];const templateIds=[...new Set(reportRows.map(r=>r.template_id).filter(Boolean))];let patients=[],templates=[];
      if(patientIds.length){const rr=await supabaseClient.from('patients').select('id,first_name,last_name,birth_date,patient_identifier,sex').in('id',patientIds);if(rr.error)throw rr.error;patients=rr.data||[]}
      if(templateIds.length){const rr=await supabaseClient.from('templates').select('id,name').in('id',templateIds);if(rr.error)throw rr.error;templates=rr.data||[]}
      const pm=new Map(patients.map(x=>[x.id,x])),tm=new Map(templates.map(x=>[x.id,x]));
      rows=reportRows.map(r=>{const p=pm.get(r.patient_id)||{},t=tm.get(r.template_id)||{};return {...r,first_name:p.first_name||'Paciente',last_name:p.last_name||'',birth_date:p.birth_date||'',patient_identifier:p.patient_identifier||'',sex:p.sex||'',template_name:t.name||'Estudio'}});
    }
    state.reports=(rows||[]).map(r=>({id:r.id,remote:true,publicToken:r.public_token,pdfStoragePath:r.pdf_storage_path,patient:{firstName:r.first_name||'Paciente',lastName:r.last_name||'',birthDate:r.birth_date||'',age:'',patientId:r.patient_identifier||'',sex:r.sex||'',reason:r.reason||'',conditions:r.conditions||[]},template:r.template_name||'Estudio',templateId:r.template_id||'',date:r.performed_at||r.created_at,content:r.findings_html||'',status:r.status==='normal'?'Normal':r.status==='pendiente'?'Pendiente':'Con hallazgos'}));
    renderHistory();renderDashboard();if($('#historyCount'))$('#historyCount').textContent=`${state.reports.length} informe${state.reports.length===1?'':'s'}`;
  }catch(error){console.error('EcoReport history load error:',error);state.reports=[];renderHistory();if($('#historyCount'))$('#historyCount').textContent='Error al cargar';toast('No se pudo cargar el historial de ecografías: '+(error?.message||error))}
}
function setGateStatus(message,type=''){const el=$('#gateStatus');if(el){el.textContent=message;el.className='auth-gate-status '+type}}
function setGateBusy(busy){const a=$('#gateLogin'),b=$('#gateSignup');if(a){a.disabled=busy;a.textContent=busy?'Conectando…':'Iniciar sesión'}if(b){b.disabled=busy;b.textContent=busy?'Espera…':'Crear cuenta'}}
function showAuthGate(){const g=$('#authGate');if(g)g.classList.remove('hidden')}
function hideAuthGate(){const g=$('#authGate');if(g)g.classList.add('hidden')}
async function ensureClientFromConfig(){if(supabaseClient)return true;const url=(cfg.SUPABASE_URL||'').trim(),key=(cfg.SUPABASE_PUBLISHABLE_KEY||'').trim();if(!url||!key){setGateStatus('Falta configurar la URL y la Publishable Key de Supabase.','error');return false}try{supabaseClient=window.supabase.createClient(url,key);state.clinicId=cfg.CLINIC_ID||state.clinicId||'';state.settings.publicReportBase=cfg.DOWNLOAD_FUNCTION_URL||state.settings.publicReportBase||'';return true}catch(e){console.error(e);supabaseClient=null;setGateStatus('No se pudo inicializar Supabase: '+(e.message||e),'error');return false}}
async function handleGateLogin(){if(!await ensureClientFromConfig())return;const email=$('#gateEmail').value.trim().toLowerCase(),password=$('#gatePassword').value;if(!email||!password){setGateStatus('Completa el correo y la contraseña.','error');return}setGateBusy(true);setGateStatus('Verificando credenciales…','busy');try{const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});if(error)throw error;currentUser=data.user||null;if(!currentUser)throw new Error('Supabase no devolvió un usuario autenticado.');await afterLogin();if(!state.clinicId&&!state.isPlatformOwner)throw new Error('La cuenta inició sesión, pero no tiene una clínica asociada.');hideAuthGate();updateConnectionUI();state.ownerAccessVerified=false;state.ownerSelectedClinicId=null;state.ownerSelectedSpecialtyId=null;showView('home');setTimeout(()=>{checkUpcomingAppointments(true);checkOverdueAppointmentsModal(true)},700);setGateStatus('Sesión iniciada correctamente.','ok');toast('Sesión iniciada correctamente.')}catch(e){console.error('EcoReport login:',e);if(e?.code==='CLINIC_SUSPENDED'){try{await supabaseClient.auth.signOut()}catch{}currentUser=null;setGateStatus('Acceso suspendido para esta clínica. Contacta al propietario de EcoReport.','error');openModal('Acceso suspendido','<p class="form-help">La suscripción de esta clínica no está activa. El acceso ha sido suspendido por el propietario de EcoReport.</p><div class="quick-actions"><button class="btn primary" id="closeSuspendedLogin" type="button">Entendido</button></div>');$('#closeSuspendedLogin').onclick=closeModal;}else setGateStatus(e.message||'No fue posible iniciar sesión.','error')}finally{setGateBusy(false)}}
async function handleGateSignup(){if(!await ensureClientFromConfig())return;const email=$('#gateEmail').value.trim().toLowerCase(),password=$('#gatePassword').value;if(!email||!password){setGateStatus('Completa el correo y la contraseña.','error');return}if(password.length<6){setGateStatus('La contraseña debe tener al menos 6 caracteres.','error');return}setGateBusy(true);setGateStatus('Creando cuenta…','busy');try{const {data,error}=await supabaseClient.auth.signUp({email,password});if(error)throw error;if(data.session){currentUser=data.user||null;await afterLogin();if(!state.clinicId)throw new Error('Cuenta creada. Primero debes asociar una clínica desde la configuración.');hideAuthGate();showView('home');setGateStatus('Cuenta creada y sesión iniciada.','ok');toast('Cuenta creada y sesión iniciada.')}else{setGateStatus('Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.','ok');toast('Revisa tu correo de confirmación.')}}catch(e){console.error('EcoReport signup:',e);setGateStatus(e.message||'No fue posible crear la cuenta.','error')}finally{setGateBusy(false)}}

function init(){
  // Siempre arrancamos visualmente en Inicio. Ninguna sesión nueva debe abrir el Panel del propietario.
  showView('home');
  $('#supabaseUrl').value=cfg.SUPABASE_URL||'';$('#supabaseKey').value=cfg.SUPABASE_PUBLISHABLE_KEY||'';$('#clinicId').value=cfg.CLINIC_ID||'';$('#downloadFunctionUrl').value=cfg.DOWNLOAD_FUNCTION_URL||'';

  // Bind authentication FIRST so a UI error in a secondary module can never
  // prevent the login screen from receiving the submit/click handlers.
  const form=$('#loginForm');
  if(form) form.onsubmit=(e)=>{e.preventDefault();void handleGateLogin()};
  const signup=$('#gateSignup');
  if(signup) signup.onclick=()=>void handleGateSignup();
  const loginButton=$('#gateLogin');
  if(loginButton) loginButton.onclick=()=>{
    // The form submit handler remains the single source of truth; this prevents
    // accidental navigation if the browser behaves differently with local files.
    if(form && typeof form.requestSubmit==='function') form.requestSubmit();
  };

  showAuthGate();

  // La navegación se registra PRIMERO. Ningún error secundario de renderizado
  // puede dejar la barra lateral sin funcionalidad.
  try{ bindNav(); }
  catch(e){ console.error('EcoReport navigation initialization:',e); }

  // El resto de la interfaz se inicializa después y de forma independiente.
  try{ renderTemplates();renderTemplateSelect();loadTemplate(); }catch(e){ console.error('EcoReport templates initialization:',e); }
  try{ bindForm(); }catch(e){ console.error('EcoReport form initialization:',e); }
  try{ renderHome();renderHistory();renderDashboard();loadSettings();renderSpecialtySelect(); }catch(e){ console.error('EcoReport UI initialization:',e); }

  (async()=>{
    if(!await ensureClientFromConfig())return;
    try{
      // No iniciar sesión automáticamente al abrir la aplicación.
      // Supabase puede conservar una sesión en el navegador, pero EcoReport
      // exige una acción explícita del usuario para continuar. Esto permite
      // probar otra clínica/cuenta sin que la cuenta anterior tome el control.
      const {data:{session}}=await supabaseClient.auth.getSession();
      if(session?.user){
        currentUser=null;
        state.isPlatformOwner=false;
        state.clinicId=cfg.CLINIC_ID||state.clinicId||'';
        state.ownerAccessVerified=false;
        state.ownerSelectedClinicId=null;
        state.ownerSelectedSpecialtyId=null;
        showAuthGate();
        setGateStatus('Hay una sesión guardada en este navegador. Pulsa “Iniciar sesión” para continuar o cambiar de cuenta.','ok');
      }else{
        currentUser=null;
        showAuthGate();
        setGateStatus('Listo para iniciar sesión.');
      }
    }catch(e){
      console.error('EcoReport startup auth:',e);
      showAuthGate();
      setGateStatus('Listo para iniciar sesión.','');
    }
  })();
}

function protectedSectionCode(id){return ({report:'ecografias',consultations:'consultas',dashboard:'panel',agenda:'agenda',history:'historial'})[id]||null}

async function requestOwnerPanelAccess(){
  if(!state.isPlatformOwner)return false;
  if(state.ownerAccessVerified)return true;
  let configured=true;
  try{
    const {data,error}=await supabaseClient.rpc('owner_platform_key_configured');
    if(error)throw error;
    configured=!!data;
  }catch(e){
    console.error('Owner key status:',e);
    toast('No se pudo comprobar la clave del propietario.');
    return false;
  }
  if(!configured){
    return await new Promise(resolve=>{
      openModal('Configurar acceso del propietario',`<p class="form-help">Define una clave exclusiva para abrir el Panel del propietario. Esta clave no se mostrará posteriormente en texto plano.</p><label>Nueva clave<input id="ownerSetupKey" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></label><label>Confirmar clave<input id="ownerSetupKey2" type="password" autocomplete="new-password" placeholder="Repite la clave"></label><div id="ownerSetupStatus" class="form-help"></div><div class="quick-actions"><button class="btn primary" id="saveOwnerSetupKey" type="button">Guardar clave</button><button class="btn ghost" id="cancelOwnerSetupKey" type="button">Cancelar</button></div>`);
      $('#cancelOwnerSetupKey').onclick=()=>{closeModal();resolve(false)};
      $('#saveOwnerSetupKey').onclick=async()=>{
        const a=$('#ownerSetupKey').value.trim(),b=$('#ownerSetupKey2').value.trim(),btn=$('#saveOwnerSetupKey');
        if(a.length<8)return toast('La clave debe tener al menos 8 caracteres.');
        if(a!==b)return toast('Las claves no coinciden.');
        try{btn.disabled=true;btn.textContent='Guardando…';const {data,error}=await supabaseClient.rpc('owner_set_platform_access_key',{p_access_key:a});if(error)throw error;if(!data)throw new Error('No se pudo guardar la clave.');state.ownerAccessVerified=true;closeModal();resolve(true);toast('Clave del propietario configurada.')}catch(e){console.error(e);$('#ownerSetupStatus').textContent=e?.message||'No se pudo guardar la clave.';btn.disabled=false;btn.textContent='Guardar clave';}
      };
    });
  }
  return await new Promise(resolve=>{
    openModal('Acceso al Panel del propietario',`<p class="form-help">🔐 Esta área es exclusiva del propietario y requiere su clave en cada acceso.</p><label>Clave del propietario<input id="ownerAccessKey" type="password" autocomplete="off" placeholder="Introduce la clave"></label><div id="ownerAccessStatus" class="form-help"></div><div class="quick-actions"><button class="btn primary" id="confirmOwnerAccess" type="button">Abrir panel</button><button class="btn ghost" id="cancelOwnerAccess" type="button">Cancelar</button></div>`);
    $('#cancelOwnerAccess').onclick=()=>{closeModal();resolve(false)};
    $('#confirmOwnerAccess').onclick=async()=>{const btn=$('#confirmOwnerAccess'),key=$('#ownerAccessKey').value.trim();if(!key)return toast('Introduce la clave.');try{btn.disabled=true;btn.textContent='Verificando…';const {data,error}=await supabaseClient.rpc('verify_platform_owner_access',{p_access_key:key});if(error)throw error;if(!data)throw new Error('La clave del propietario no es válida.');state.ownerAccessVerified=true;closeModal();resolve(true);toast('Acceso de propietario concedido.')}catch(e){console.error(e);$('#ownerAccessStatus').textContent=e?.message||'No se pudo verificar la clave.';btn.disabled=false;btn.textContent='Abrir panel';}};
  });
}

async function navigateToSection(id){
  try{
    const target=document.getElementById(id);
    if(!target){console.warn('EcoReport: sección inexistente',id);return false}

    // Registrar el intento actual para que solo el último acceso pendiente
    // pueda abrir una vista después de un modal.
    const seq=++state.navigationSeq;

    if(!state.isPlatformOwner&&state.clinicAccessEnabled===false){
      openModal('Acceso suspendido','<p class=\"form-help\">El acceso de esta clínica está suspendido. Contacta al propietario de EcoReport para reactivar la suscripción.</p><div class=\"quick-actions\"><button class=\"btn primary\" id=\"closeSuspendedAccess\" type=\"button\">Entendido</button></div>');
      $('#closeSuspendedAccess').onclick=closeModal;
      return false;
    }

    if(id==='ownerAdmin'){
      if(!state.isPlatformOwner){toast('Acceso exclusivo del propietario.');return false}
      const ok=await requestOwnerPanelAccess();
      if(!ok || seq!==state.navigationSeq)return false;
    }else{
      const code=protectedSectionCode(id);
      if(code&&!state.isPlatformOwner&&!state.sectionSessionAccess.has(code)){
        const ok=await requestSectionAccess(code);
        if(!ok || seq!==state.navigationSeq)return false;
        state.sectionSessionAccess.add(code);
      }
    }

    const prev=document.querySelector('.view.active')?.id;
    if(prev&&prev!==id){
      const pcode=protectedSectionCode(prev);
      if(pcode)state.sectionSessionAccess.delete(pcode);
      if(prev==='ownerAdmin')state.ownerAccessVerified=false;
    }

    return showView(id);
  }catch(e){
    console.error('EcoReport navigation error:',e);
    toast(e?.message||'No se pudo abrir esa sección.');
    return false;
  }
}

function bindNav(){
  const nav=document.querySelector('.sidebar nav');
  if(!nav || nav.dataset.ecoNavBound==='1') return;
  nav.dataset.ecoNavBound='1';
  nav.addEventListener('click',e=>{
    const b=e.target.closest('.nav');
    if(!b || !nav.contains(b)) return;
    e.preventDefault();
    e.stopPropagation();
    const id=b.dataset.view;
    if(id) void navigateToSection(id);
  },true);
  $$('.nav').forEach(b=>{b.type='button'});
  window.EcoNavigate=(id)=>navigateToSection(id);
}

function showView(id){
  const target=document.getElementById(id);
  if(!target)return false;
  $$('.view').forEach(v=>v.classList.remove('active'));
  target.classList.add('active');
  $$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  const titles={home:'Inicio',report:'Ecografías',agenda:'Agendar y citas',consultations:'Consultas médicas',history:'Historial',templates:'Plantillas',dashboard:'Panel administrativo',ownerAdmin:'Panel del propietario',settings:'Clínica y formato'};
  $('#viewTitle').textContent=titles[id]||'EcoReport Pro';

  // La navegación no debe depender de que una función secundaria termine bien.
  // Cada cargador se encapsula para que un error del módulo no bloquee el menú.
  try{
    if(id==='home')renderHome();
    if(id==='dashboard'){renderDashboard();Promise.resolve(loadDashboardData()).catch(e=>console.error('Dashboard:',e));}
    if(id==='history'){renderUnifiedHistory();Promise.resolve(loadPatients()).then(()=>{renderUnifiedHistory();if(state.historyMode==='consultas')return loadConsultationHistoryForHistory();}).catch(e=>console.error('History refresh:',e));}
    if(id==='agenda'){renderAgenda();Promise.resolve(loadAppointments()).then(()=>{renderAgenda();renderTodayUltrasoundAppointments();renderAgendaFollowUp();checkOverdueAppointmentsModal(true)}).catch(e=>console.error('Agenda:',e));}
    if(id==='consultations'){clearConsultationForm();Promise.resolve(loadSpecialties()).then(()=>loadConsultationData()).catch(e=>{console.error('Consultas:',e);loadConsultationData();});}
    if(id==='templates')Promise.resolve(loadTemplateManagementData()).catch(e=>{console.error('Templates:',e);renderTemplateManagement()});
    if(id==='ownerAdmin')Promise.resolve(loadOwnerPanel()).catch(e=>console.error('Owner panel:',e));
  }catch(e){console.error('EcoReport view error:',e)}
  return true;
}

async function requestSectionAccess(sectionCode){

  if(!supabaseClient||!currentUser||!state.clinicId)return false;
  const labels={ecografias:'Ecografías',consultas:'Consultas médicas',panel:'Panel administrativo',agenda:'Agendar y citas',historial:'Historial'};
  return await new Promise(resolve=>{
    openModal(`Acceso protegido · ${labels[sectionCode]||sectionCode}`,`<p class="form-help">🔐 Esta sección está protegida por una clave administrada por el propietario de EcoReport.</p><label>Clave de acceso<input id="sectionAccessKeyInput" type="password" autocomplete="off" placeholder="Introduce la clave"></label><div id="sectionAccessStatus" class="form-help"></div><div class="quick-actions"><button class="btn primary" id="confirmSectionAccess">Abrir sección</button><button class="btn ghost" id="cancelSectionAccess">Cancelar</button></div>`);
    $('#cancelSectionAccess').onclick=()=>{closeModal();resolve(false)};
    $('#confirmSectionAccess').onclick=async()=>{
      const btn=$('#confirmSectionAccess'),key=$('#sectionAccessKeyInput').value.trim();if(!key){toast('Introduce la clave.');return}
      try{btn.disabled=true;btn.textContent='Verificando…';const {data,error}=await supabaseClient.rpc('verify_section_access',{p_clinic_id:state.clinicId,p_section_code:sectionCode,p_access_key:key});if(error)throw error;if(!data)throw new Error('La clave no es válida o la sección no está configurada.');closeModal();resolve(true);toast(`Acceso concedido: ${labels[sectionCode]||sectionCode}`)}catch(e){console.error('Section access:',e);$('#sectionAccessStatus').textContent=e?.message||'No se pudo validar la clave.';btn.disabled=false;btn.textContent='Abrir sección'}};
  });
}
async function ensureSectionAccess(code){
  const section=protectedSectionCode(code)||code;
  if(!section)return true;
  if(state.isPlatformOwner)return true;
  if(state.sectionSessionAccess.has(section))return true;
  const ok=await requestSectionAccess(section);
  if(ok)state.sectionSessionAccess.add(section);
  return ok;
}
function bindForm(){
  // Ecografías
  $('#templateSelect')?.addEventListener('change',e=>applyTemplateSelection(e.target.value));
  $('#templateSelect')?.addEventListener('input',e=>applyTemplateSelection(e.target.value));
  $('#editTemplate')?.addEventListener('click',()=>openTemplateEditor(state.currentTemplate));
  $('#manageTemplates')?.addEventListener('click',()=>showView('templates'));
  $('#saveAsTemplate')?.addEventListener('click',()=>saveCurrentAsTemplate());
  $('#createTemplate')?.addEventListener('click',createTemplate);
  $('#newReport')?.addEventListener('click',async()=>{if(await ensureSectionAccess('ecografias')){showView('report');resetReport()}});
  $('#resetReport')?.addEventListener('click',resetReport);
  $('#saveReport')?.addEventListener('click',saveReport);
  $('#downloadPdf')?.addEventListener('click',downloadPdf);
  $('#openReportPrescription')?.addEventListener('click',()=>openPrescriptionComposer('report'));
  $('#imageInput')?.addEventListener('change',e=>[...e.target.files].forEach(addImage));
  $$('.toolbar button').forEach(b=>b.onclick=()=>document.execCommand(b.dataset.cmd,false,null));
  $('#fontSize')?.addEventListener('change',e=>document.execCommand('fontSize',false,e.target.value));
  $('#refreshTodayUltrasounds')?.addEventListener('click',async()=>{await loadAppointments();renderTodayUltrasoundAppointments()});

  // Agenda
  $('#createAppointment')?.addEventListener('click',()=>openAppointmentModal());
  $('#agendaToday')?.addEventListener('click',()=>{state.agendaDate=new Date();renderAgenda()});
  $('#agendaPrev')?.addEventListener('click',()=>shiftAgenda(-1));
  $('#agendaNext')?.addEventListener('click',()=>shiftAgenda(1));
  $('#agendaMonthBtn')?.addEventListener('click',()=>{state.agendaMode='month';renderAgendaModeButtons();renderAgenda()});
  $('#agendaListBtn')?.addEventListener('click',()=>{state.agendaMode='list';renderAgendaModeButtons();renderAgenda()});

  // Consultas y especialidades
  $('#newConsultation')?.addEventListener('click',resetConsultation);
  $('#resetConsultation')?.addEventListener('click',resetConsultation);
  $('#saveConsultation')?.addEventListener('click',saveConsultation);
  $('#downloadConsultationPdf')?.addEventListener('click',downloadConsultationPdf);
  $('#openConsultationPrescription')?.addEventListener('click',()=>openPrescriptionComposer('consultation'));
  $('#createConsultationTemplate')?.addEventListener('click',createConsultationTemplate);
  $('#createConsultationTemplateFromTemplates')?.addEventListener('click',createConsultationTemplate);
  $('#consultPatient')?.addEventListener('change',onConsultationPatientSelected);
  $('#consultAppointment')?.addEventListener('change',()=>{});
  $('#consultTemplate')?.addEventListener('change',applyConsultationTemplate);
  $('#consultSpecialty')?.addEventListener('change',handleSpecialtyChange);
  $('#manageSpecialties')?.addEventListener('click',manageSpecialties);
  $('#consultationSearch')?.addEventListener('input',renderConsultations);

  // Historial
  $('#historyEcoTab')?.addEventListener('click',()=>setHistoryMode('ecografias'));
  $('#historyConsultTab')?.addEventListener('click',()=>setHistoryMode('consultas'));
  $('#historyMapaTab')?.addEventListener('click',()=>setHistoryMode('mapa'));
  $('#historyHolterTab')?.addEventListener('click',()=>setHistoryMode('holter'));
  $('#historySearch')?.addEventListener('input',()=>{renderHistory();renderConsultationHistory();if(state.historyMode==='mapa')renderMonitoringHistory('mapa');if(state.historyMode==='holter')renderMonitoringHistory('holter')});
  $('#refreshHistory')?.addEventListener('click',async()=>{const b=$('#refreshHistory');try{if(b){b.disabled=true;b.textContent='Actualizando…'}await loadPatients();await loadRemoteHistory();if(state.historyMode==='consultas')await loadConsultationHistoryForHistory();if(state.historyMode==='mapa')await loadMonitoringHistory('mapa');if(state.historyMode==='holter')await loadMonitoringHistory('holter');renderUnifiedHistory();toast('Historial actualizado.')}catch(e){console.error('History manual refresh:',e);toast('No se pudo actualizar el historial: '+(e?.message||e))}finally{if(b){b.disabled=false;b.textContent='↻ Actualizar'}}});

  // Plantillas
  $('#templateEcoTab')?.addEventListener('click',()=>setTemplateMode('ecografias'));
  $('#templateConsultTab')?.addEventListener('click',()=>setTemplateMode('consultas'));

  // Panel administrativo
  $('#dashPeriod')?.addEventListener('change',()=>renderDashboard());
  $('#adminOverviewTab')?.addEventListener('click',()=>setAdminMode('overview'));
  $('#adminEcoTab')?.addEventListener('click',()=>setAdminMode('ecografias'));
  $('#adminConsultTab')?.addEventListener('click',()=>setAdminMode('consultas'));

  // Inicio
  $$('.home-tool-card').forEach(b=>b.addEventListener('click',()=>void navigateToSection(b.dataset.homeView)));
  $('#ownerRefresh')?.addEventListener('click',()=>loadOwnerPanel());
  $('#ownerClinicSelect')?.addEventListener('change',()=>loadOwnerClinicDetail($('#ownerClinicSelect').value));
  $('#ownerSaveSectionKeys')?.addEventListener('click',saveOwnerSectionKeys);
  $('#ownerSuspendClinicAccess')?.addEventListener('click',()=>setOwnerClinicAccess(false));
  $('#ownerEnableClinicAccess')?.addEventListener('click',()=>setOwnerClinicAccess(true));
  $('#ownerSaveSpecialtyKey')?.addEventListener('click',saveOwnerSpecialtyKey);
  $('#ownerNewClinic')?.addEventListener('click',openOwnerNewClinicModal);
  $('#ownerNewUser')?.addEventListener('click',openOwnerNewUserModal);
  $('#ownerDownloadBackup')?.addEventListener('click',downloadOwnerClinicBackup);
  $('#ownerRestoreBackup')?.addEventListener('change',e=>{const file=e.target.files?.[0]; if(file) void restoreOwnerClinicBackup(file); e.target.value='';});

  // Configuración
  $('#saveSettings')?.addEventListener('click',saveSettings);
  $('#letterheadInput')?.addEventListener('change',e=>handleAsset(e,'letterhead'));
  $('#signatureInput')?.addEventListener('change',e=>handleAsset(e,'signature'));
  $('#connectSupabase')?.addEventListener('click',connectSupabase);
  $('#signInBtn')?.addEventListener('click',showLogin);
  $('#createClinicBtn')?.addEventListener('click',createClinic);
  $('#signOutBtn')?.addEventListener('click',signOut);

  // Render inicial de controles que dependen de la UI.
  renderAgendaModeButtons();
  renderTodayUltrasoundAppointments();
  updateHistoryTabs();
  setAdminMode(state.adminMode||'overview');
}

function renderTemplateSelect(){const s=$('#templateSelect');s.innerHTML=state.templates.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');const exists=state.templates.some(t=>String(t.id)===String(state.currentTemplate));if(!exists&&state.templates.length)state.currentTemplate=state.templates[0].id;s.value=state.currentTemplate||''}
function loadTemplate(){const t=state.templates.find(x=>String(x.id)===String(state.currentTemplate));if(!t)return;const editor=$('#reportEditor');if(editor)editor.innerHTML=t.content||'';const preview=$('#templatePreview');if(preview)preview.innerHTML=`<b>${esc(t.name)}</b><br>${esc(t.description)}<br><br><span>La plantilla se puede editar antes de guardar el informe.</span>`}
function applyTemplateSelection(id,{resetReport=true}={}){const t=state.templates.find(x=>String(x.id)===String(id));if(!t)return false;state.currentTemplate=t.id;if(resetReport){state.currentRemoteReportId=null;state.currentReportToken=null;}const select=$('#templateSelect');if(select)select.value=t.id;loadTemplate();return true}
function renderTemplates(){const box=$('#templateCards');if(!box)return;box.innerHTML=state.templates.length?state.templates.map(t=>`<div class="template-card"><div class="template-card-type">📡 Ecografía</div><h3>${esc(t.name)}</h3><p>${esc(t.description||'Sin descripción')}</p><div class="actions"><button class="btn secondary" onclick="openTemplateEditor('${esc(t.id)}')">Editar</button><button class="btn ghost" onclick="useTemplate('${esc(t.id)}')">Usar</button><button class="btn danger ghost" onclick="window.deleteUltrasoundTemplate('${esc(t.id)}')">Eliminar</button></div></div>`).join(''):'<div class="patient-empty">No hay plantillas de ecografía activas.</div>';updateTemplatePanels()}
function updateTemplatePanels(){const eco=$('#templateEcoTab'),consult=$('#templateConsultTab'),ecoPanel=$('#templateEcoPanel'),consultPanel=$('#templateConsultPanel');const mode=state.templateMode||'ecografias';eco?.classList.toggle('active',mode==='ecografias');consult?.classList.toggle('active',mode==='consultas');ecoPanel?.classList.toggle('hidden-panel',mode!=='ecografias');consultPanel?.classList.toggle('hidden-panel',mode!=='consultas');const createEco=$('#createTemplate'),createConsult=$('#createConsultationTemplateFromTemplates');createEco?.classList.toggle('hidden-panel',mode!=='ecografias');createConsult?.classList.toggle('hidden-panel',mode!=='consultas')}
function setTemplateMode(mode){state.templateMode=mode==='consultas'?'consultas':'ecografias';updateTemplatePanels();if(state.templateMode==='consultas')loadTemplateManagementData().catch(e=>{console.error(e);renderTemplateManagement()})}
async function loadTemplateManagementData(){if(!supabaseClient||!currentUser||!state.clinicId){renderTemplateManagement();return}try{await loadSpecialties();const {data,error}=await supabaseClient.from('consultation_templates').select('id,name,description,content_html,specialty_id,active').eq('clinic_id',state.clinicId).eq('active',true).order('name');if(error)throw error;state.managementConsultationTemplates=(data||[]).map(t=>({id:t.id,name:t.name,description:t.description||'',content:t.content_html||'',specialtyId:t.specialty_id||''}));renderTemplateManagement()}catch(e){console.error('EcoReport template management load error:',e);state.managementConsultationTemplates=[];renderTemplateManagement();toast('No se pudieron cargar las plantillas de consulta: '+(e?.message||e))}}
function renderTemplateManagement(){const box=$('#consultationTemplateCards');if(!box)return;const rows=state.managementConsultationTemplates.map(t=>{const sp=specialtyById(t.specialtyId);return `<div class="template-card"><div class="template-card-type">🩺 Consulta · ${esc(sp?.name||'Especialidad')}</div><h3>${esc(t.name)}</h3><p>${esc(t.description||'Sin descripción')}</p><div class="actions"><button class="btn secondary" onclick="window.useConsultationTemplateFromManagement('${esc(t.id)}','${esc(t.specialtyId)}')">Usar</button><button class="btn ghost" onclick="window.editConsultationTemplateFromManagement('${esc(t.id)}','${esc(t.specialtyId)}')">Editar</button><button class="btn danger ghost" onclick="window.deleteConsultationTemplate('${esc(t.id)}','${esc(t.specialtyId)}')">Eliminar</button></div></div>`}).join('');box.innerHTML=rows||'<div class="patient-empty">No hay plantillas de consulta activas para las especialidades a las que tienes acceso.</div>';updateTemplatePanels()}
window.deleteUltrasoundTemplate=async id=>{const t=state.templates.find(x=>String(x.id)===String(id));if(!t)return;if(!confirm(`¿Retirar la plantilla "${t.name}"?

Los informes históricos se conservan; la plantilla dejará de aparecer como activa.`))return;if(!requireConnection()||!requireSession()||!state.clinicId)return;try{const {error}=await supabaseClient.from('templates').update({active:false,updated_at:new Date().toISOString()}).eq('id',id).eq('clinic_id',state.clinicId);if(error)throw error;await loadRemoteTemplates();toast('Plantilla de ecografía retirada.')}catch(e){console.error(e);toast('No se pudo retirar la plantilla: '+(e?.message||e))}}
window.deleteConsultationTemplate=async(id,specialtyId)=>{const t=state.managementConsultationTemplates.find(x=>String(x.id)===String(id))||state.consultationTemplates.find(x=>String(x.id)===String(id));if(!t)return;if(!confirm(`¿Retirar la plantilla "${t.name}"?

Las consultas históricas se conservan; la plantilla dejará de aparecer como activa.`))return;if(!requireConnection()||!requireSession()||!state.clinicId)return;if(specialtyId&&!currentUserIsSpecialtyMember(specialtyId)){toast('No tienes acceso a esta especialidad.');return}try{const {error}=await supabaseClient.from('consultation_templates').update({active:false,updated_at:new Date().toISOString()}).eq('id',id).eq('clinic_id',state.clinicId).eq('specialty_id',specialtyId);if(error)throw error;await loadConsultationData();await loadTemplateManagementData();toast('Plantilla de consulta retirada.')}catch(e){console.error(e);toast('No se pudo retirar la plantilla: '+(e?.message||e))}}
window.useConsultationTemplateFromManagement=async(id,specialtyId)=>{if(!specialtyId){toast('La plantilla no tiene especialidad asociada.');return}showView('consultations');await loadSpecialties();const sp=specialtyById(specialtyId);if(!state.specialtySessionAccess.has(String(specialtyId))&&sp){const ok=await requestSpecialtyAccess(sp);if(!ok)return;}state.currentSpecialtyId=specialtyId;await loadConsultationData();$('#consultTemplate').value=id;applyConsultationTemplate();toast('Plantilla seleccionada.')}
window.editConsultationTemplateFromManagement=async(id,specialtyId)=>{if(!specialtyId){toast('La plantilla no tiene especialidad asociada.');return}state.currentSpecialtyId=specialtyId;await loadSpecialties();if(!currentUserIsSpecialtyMember(specialtyId)){toast('No tienes acceso a esta especialidad.');return}const t=state.managementConsultationTemplates.find(x=>String(x.id)===String(id));if(!t)return;openModal(`Editar plantilla · ${esc(specialtyById(specialtyId)?.name||'Especialidad')}`,`<label>Nombre<input id="mctName" value="${esc(t.name)}"></label><label>Descripción<input id="mctDesc" value="${esc(t.description||'')}"></label><label>Contenido<div id="mctEditor" class="editor" contenteditable="true">${t.content||''}</div></label><div class="quick-actions"><button class="btn primary" id="mctSave">Guardar</button><button class="btn ghost" id="mctCancel">Cancelar</button></div>`);$('#mctCancel').onclick=closeModal;$('#mctSave').onclick=async()=>{try{const nt={...t,name:$('#mctName').value.trim()||t.name,description:$('#mctDesc').value.trim(),content:$('#mctEditor').innerHTML,id:t.id,specialtyId};await ensureConsultationTemplate(nt);closeModal();await loadConsultationData();await loadTemplateManagementData();toast('Plantilla de consulta actualizada.')}catch(e){console.error(e);toast('No se pudo actualizar la plantilla: '+(e?.message||e))}}}
window.useTemplate=async id=>{if(!applyTemplateSelection(id))return;if(!await ensureSectionAccess('ecografias'))return;renderTemplateSelect();showView('report')}
function openTemplateEditor(id){const t=state.templates.find(x=>x.id===id);if(!t)return;openModal('Editar plantilla',`<label>Nombre<input id="mtName" value="${esc(t.name)}"></label><label>Descripción<input id="mtDesc" value="${esc(t.description)}"></label><label>Contenido<div id="mtEditor" class="editor" contenteditable="true">${t.content}</div></label><div class="quick-actions"><button class="btn primary" id="mtSave">Guardar plantilla</button><button class="btn danger ghost" id="mtDelete">Eliminar</button></div>`);$('#mtSave').onclick=async()=>{t.name=$('#mtName').value.trim();t.description=$('#mtDesc').value.trim();t.content=$('#mtEditor').innerHTML;if(supabaseClient&&currentUser&&state.clinicId){const dbId=await ensureTemplate(t);if(!dbId)return}applyTemplateSelection(t.id);renderTemplates();renderTemplateSelect();closeModal();toast('Plantilla actualizada')};$('#mtDelete').onclick=async()=>{closeModal();await window.deleteUltrasoundTemplate(t.id)}}
function saveCurrentAsTemplate(){openModal('Guardar como plantilla',`<label>Nombre<input id="newTName" placeholder="Ej. Ecografía obstétrica"></label><label>Descripción<input id="newTDesc" placeholder="Descripción breve"></label><button class="btn primary" id="newTSave">Guardar</button>`);$('#newTSave').onclick=async()=>{const t={id:'t'+Date.now(),name:$('#newTName').value.trim()||'Nueva plantilla',description:$('#newTDesc').value.trim(),content:$('#reportEditor').innerHTML};if(supabaseClient&&currentUser&&state.clinicId){const dbId=await ensureTemplate(t);if(!dbId)return;t.id=dbId}state.templates.push(t);applyTemplateSelection(t.id);renderTemplates();renderTemplateSelect();closeModal();toast('Plantilla guardada y seleccionada')}}
function createTemplate(){
  openModal('Nueva plantilla',`
    <label>Nombre<input id="newTName" placeholder="Ej. Ecografía obstétrica"></label>
    <label>Descripción<input id="newTDesc" placeholder="Descripción breve del estudio"></label>
    <label>Contenido del informe<div id="newTEditor" class="editor" contenteditable="true"><h3>NUEVO ESTUDIO ECOGRÁFICO</h3><p><b>Descripción:</b> Escriba aquí los hallazgos correspondientes a este estudio.</p><p><b>Hallazgos:</b> Describa los órganos, estructuras y mediciones relevantes.</p><p><b>IMPRESIÓN:</b> Escriba la conclusión del estudio.</p></div></label>
    <button class="btn primary" id="newTSave">Crear plantilla</button>
  `);
  $('#newTSave').onclick=async()=>{
    const t={
      id:'t'+Date.now(),
      name:$('#newTName').value.trim()||'Nueva plantilla',
      description:$('#newTDesc').value.trim(),
      content:$('#newTEditor').innerHTML
    };
    if(supabaseClient&&currentUser&&state.clinicId){
      const dbId=await ensureTemplate(t);
      if(!dbId)return;
      t.id=dbId;
    }
    state.templates.push(t);
    applyTemplateSelection(t.id);
    renderTemplates();
    renderTemplateSelect();
    closeModal();
    toast('Plantilla creada y seleccionada.');
  };
}
async function ensureTemplate(t){
  if(!supabaseClient||!currentUser||!state.clinicId) return null;
  const {data:existing,error:qerr}=await supabaseClient.from('templates').select('id').eq('clinic_id',state.clinicId).eq('name',t.name).maybeSingle();
  if(qerr){console.error('EcoReport template lookup:',qerr);toast('No se pudo consultar la plantilla: '+qerr.message);return null}
  if(existing){
    const {error}=await supabaseClient.from('templates').update({description:t.description,content_html:t.content,updated_at:new Date().toISOString()}).eq('id',existing.id).eq('clinic_id',state.clinicId);
    if(error){console.error('EcoReport template update:',error);toast('No se pudo guardar la plantilla: '+error.message);return null}
    t.id=existing.id;return existing.id;
  }
  const {data,error}=await supabaseClient.from('templates').insert({clinic_id:state.clinicId,name:t.name,description:t.description,content_html:t.content,created_by:currentUser.id}).select('id').single();
  if(error){console.error('EcoReport template insert:',error);toast('No se pudo crear la plantilla: '+error.message);return null}
  t.id=data.id;return data.id;
}
function addImage(file){if(!file.type.match(/image\/(jpeg|png|bmp)/))return toast('Formato no permitido');const reader=new FileReader();reader.onload=()=>{state.images.push({src:reader.result,name:file.name,brightness:100,contrast:100,scale:100});renderImages()};reader.readAsDataURL(file)}
function renderImages(){const g=$('#imageGrid');if(!state.images.length){g.innerHTML='<div class="empty"><div>▧</div><b>No hay imágenes</b><span>Agrega las imágenes ecográficas del paciente.</span></div>';return}g.innerHTML=state.images.map((im,i)=>`<div class="image-card"><img id="im${i}" src="${im.src}" style="filter:brightness(${im.brightness}%) contrast(${im.contrast}%);transform:scale(${im.scale/100})"><div class="image-controls"><small>${esc(im.name)}</small><label>Brillo <input type="range" min="50" max="160" value="${im.brightness}" oninput="adjustImage(${i},'brightness',this.value)"></label><label>Contraste <input type="range" min="50" max="180" value="${im.contrast}" oninput="adjustImage(${i},'contrast',this.value)"></label><label>Tamaño <input type="range" min="70" max="130" value="${im.scale}" oninput="adjustImage(${i},'scale',this.value)"></label><button class="btn ghost" onclick="removeImage(${i})">Eliminar</button></div></div>`).join('')}
window.adjustImage=(i,k,v)=>{state.images[i][k]=+v;const im=state.images[i],el=$('#im'+i);el.style.filter=`brightness(${im.brightness}%) contrast(${im.contrast}%)`;el.style.transform=`scale(${im.scale/100})`};
window.removeImage=i=>{state.images.splice(i,1);renderImages()}
function patient(){return {firstName:$('#firstName').value.trim(),lastName:$('#lastName').value.trim(),birthDate:$('#birthDate').value,age:$('#age').value,patientId:$('#patientId').value.trim(),sex:$('#sex').value,reason:$('#reason').value.trim(),conditions:$$('.conditions input:checked').map(x=>x.value)}}
function extractImpression(text){const m=/IMPRESIÓN\s*[:\-]?\s*([\s\S]*)/i.exec(text||'');return (m?m[1]:text||'').trim().slice(0,3000)}
function currentStatus(text){return /normal|sin alteraciones|sin hallazgos/i.test(text)?'normal':'con_hallazgos'}

async function ensurePatient(p){
  let row=null;
  if(p.patientId){const {data,error}=await supabaseClient.from('patients').select('id').eq('clinic_id',state.clinicId).eq('patient_identifier',p.patientId).maybeSingle();if(error)throw error;row=data}
  if(row){const {data,error}=await supabaseClient.from('patients').update({first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,sex:p.sex||null,updated_at:new Date().toISOString()}).eq('id',row.id).select('id').single();if(error)throw error;return data.id}
  const {data,error}=await supabaseClient.from('patients').insert({clinic_id:state.clinicId,first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,patient_identifier:p.patientId||null,sex:p.sex||null}).select('id').single();if(error)throw error;return data.id
}
async function ensureSonographer(){let {data,error}=await supabaseClient.from('sonographers').select('id').eq('clinic_id',state.clinicId).eq('user_id',currentUser.id).maybeSingle();if(error)throw error;if(data)return data.id;const r=await supabaseClient.from('sonographers').insert({clinic_id:state.clinicId,user_id:currentUser.id,full_name:state.settings.doctorName||currentUser.email||'Ecografista'}).select('id').single();if(r.error)throw r.error;return r.data.id}

async function ensureRemoteReport(){
  if(!requireConnection()||!requireSession())throw new Error('Conexión/sesión requerida');
  if(!state.clinicId){toast('Indica un Clinic ID o crea una clínica en Configuración.');showView('settings');throw new Error('Falta clinic_id')}
  const p=patient();if(!p.firstName||!p.lastName)throw new Error('Completa nombre y apellido');
  const t=state.templates.find(x=>String(x.id)===String(state.currentTemplate))||state.templates[0];
  if(!t)throw new Error('Selecciona una plantilla de ecografía.');
  let templateId=t.id;
  const isRemoteId=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(templateId));
  if(!isRemoteId){templateId=await ensureTemplate(t);if(!templateId)throw new Error('No se pudo guardar la plantilla.');}
  const patientId=await ensurePatient(p);const sonographerId=await ensureSonographer();
  const payload={clinic_id:state.clinicId,patient_id:patientId,template_id:templateId,sonographer_id:sonographerId,reason:p.reason||null,conditions:p.conditions,findings_html:$('#reportEditor').innerHTML,impression:extractImpression($('#reportEditor').innerText),status:currentStatus($('#reportEditor').innerText),performed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  if(state.currentRemoteReportId){const {data,error}=await supabaseClient.from('reports').update(payload).eq('id',state.currentRemoteReportId).eq('clinic_id',state.clinicId).select('id,public_token,pdf_storage_path').single();if(error)throw error;state.currentReportToken=data.public_token;return data}
  const {data,error}=await supabaseClient.from('reports').insert(payload).select('id,public_token,pdf_storage_path').single();if(error)throw error;state.currentRemoteReportId=data.id;state.currentReportToken=data.public_token;return data
}

async function saveReport(){
  try{const r=await ensureRemoteReport();await loadRemoteHistory();toast(`Informe guardado. Código QR: ${r.public_token}`)}catch(e){console.error(e);toast(e.message||'No se pudo guardar el informe')}
}

function updateHistoryTabs(){
  const modes=['ecografias','consultas','mapa','holter'];
  modes.forEach(m=>{$(`#history${m==='ecografias'?'Eco':m==='consultas'?'Consult':m.charAt(0).toUpperCase()+m.slice(1)}Tab`)?.classList.toggle('active',state.historyMode===m);});
  $('#historyEcoPanel')?.classList.toggle('hidden-panel',state.historyMode!=='ecografias');
  $('#historyConsultPanel')?.classList.toggle('hidden-panel',state.historyMode!=='consultas');
  $('#historyMapaPanel')?.classList.toggle('hidden-panel',state.historyMode!=='mapa');
  $('#historyHolterPanel')?.classList.toggle('hidden-panel',state.historyMode!=='holter');
}
function setHistoryMode(mode){
  state.historyMode=['consultas','mapa','holter'].includes(mode)?mode:'ecografias';
  updateHistoryTabs();
  if(state.historyMode==='consultas') loadConsultationHistoryForHistory();
  else if(state.historyMode==='mapa') loadMonitoringHistory('mapa');
  else if(state.historyMode==='holter') loadMonitoringHistory('holter');
  else renderHistory();
}
function renderUnifiedHistory(){updateHistoryTabs();if(state.historyMode==='ecografias')renderHistory();else if(state.historyMode==='consultas')renderConsultationHistory();else renderMonitoringHistory(state.historyMode)}
async function loadConsultationHistoryForHistory(){
  if(!supabaseClient||!currentUser||!state.clinicId)return;
  try{
    const {data,error}=await supabaseClient.from('consultations').select('id,clinic_id,patient_id,template_id,specialty_id,performed_at,status,reason,diagnosis').eq('clinic_id',state.clinicId).order('performed_at',{ascending:false}).limit(1000);
    if(error)throw error;
    const rows=data||[];
    const tIds=[...new Set(rows.map(r=>r.template_id).filter(Boolean))];
    let templates=[];if(tIds.length){const tr=await supabaseClient.from('consultation_templates').select('id,name').in('id',tIds);if(tr.error)throw tr.error;templates=tr.data||[];}
    const tMap=new Map(templates.map(t=>[t.id,t.name]));
    state.historyConsultations=rows.map(r=>({...r,templateName:tMap.get(r.template_id)||'Consulta'}));
    renderConsultationHistory();
  }catch(e){console.error('EcoReport unified consultation history:',e);state.historyConsultations=[];renderConsultationHistory();toast('No se pudo cargar el historial de consultas: '+(e?.message||e))}
}
function renderConsultationHistory(){
  const body=$('#historyConsultationsBody');if(!body)return;
  const q=($('#historySearch')?.value||'').trim().toLowerCase();
  const rows=state.historyConsultations.filter(c=>{
    const p=patientById(c.patient_id)||{};const sp=specialtyById(c.specialty_id);const text=`${p.firstName||''} ${p.lastName||''} ${p.patientId||''} ${sp?.name||''} ${c.templateName||''} ${c.reason||''} ${c.diagnosis||''}`.toLowerCase();
    return text.includes(q);
  });
  $('#historyCount').textContent=`${rows.length} consulta${rows.length===1?'':'s'}`;
  if(!rows.length){body.innerHTML='<tr><td colspan="6" class="patient-empty">No hay consultas que coincidan con la búsqueda.</td></tr>';return}
  body.innerHTML=rows.map(c=>{const p=patientById(c.patient_id)||{firstName:'Paciente',lastName:''};const sp=specialtyById(c.specialty_id);return `<tr><td>${esc(formatDateLocal(c.performed_at))}<span class="consultation-mini">${esc(formatTimeLocal(c.performed_at))}</span></td><td><b>${esc(p.firstName+' '+p.lastName)}</b><span class="consultation-mini">${esc(p.patientId||'Sin ID')}</span></td><td>${esc(sp?.name||'—')}</td><td>${esc(c.templateName||'Consulta')}</td><td><span class="pill ${consultationStatusClass(c.status)}">${esc(consultationStatusLabel(c.status))}</span></td><td><div class="consultation-row-actions"><button class="btn ghost" onclick="window.openConsultationFromHistory('${esc(c.id)}')">Abrir</button></div></td></tr>`}).join('');
}
window.openConsultationFromHistory=async id=>{const c=state.historyConsultations.find(x=>String(x.id)===String(id));if(!c)return;if(!await ensureSectionAccess('consultas'))return;showView('consultations');await loadSpecialties();if(c.specialty_id){state.currentSpecialtyId=c.specialty_id;const sp=specialtyById(c.specialty_id);if(!state.specialtySessionAccess.has(String(c.specialty_id))&&sp){const ok=await requestSpecialtyAccess(sp);if(!ok)return;}await loadConsultationData();window.openConsultation(id);} }

async function loadMonitoringHistory(kind){
  if(!supabaseClient||!currentUser||!state.clinicId)return;
  const type=kind==='holter'?'Holter de ritmo':'MAPA de presión arterial';
  try{const {data,error}=await supabaseClient.from('appointments').select('id,clinic_id,patient_id,start_at,end_at,appointment_type,status,attendance_status,paid,patient_notified,reason,notes').eq('clinic_id',state.clinicId).eq('appointment_type',type).order('start_at',{ascending:false}).limit(2000);if(error)throw error;state.monitoringHistoryAppointments=data||[];renderMonitoringHistory(kind)}catch(e){console.error('EcoReport monitoring history:',e);state.monitoringHistoryAppointments=[];renderMonitoringHistory(kind);toast(`No se pudo cargar el historial de ${kind==='holter'?'Holter':'MAPA'}: ${e?.message||e}`)}}
function renderMonitoringHistory(kind){
  const body=kind==='holter'?$('#historyHolterBody'):$('#historyMapaBody');if(!body)return;
  const q=($('#historySearch')?.value||'').trim().toLowerCase();const rows=(state.monitoringHistoryAppointments||[]).filter(a=>{const p=patientById(a.patient_id)||{};const text=`${p.firstName||''} ${p.lastName||''} ${p.patientId||''} ${a.reason||''} ${a.notes||''} ${a.appointment_type||''}`.toLowerCase();return text.includes(q)});
  $('#historyCount').textContent=`${rows.length} registro${rows.length===1?'':'s'}`;
  if(!rows.length){body.innerHTML=`<tr><td colspan="6" class="patient-empty">No hay registros de ${kind==='holter'?'Holter de ritmo':'MAPA de presión arterial'}.</td></tr>`;return}
  body.innerHTML=rows.map(a=>{const p=patientById(a.patient_id)||{firstName:'Paciente',lastName:'',patientId:''};const att=a.attendance_status==='present'?'Presente':a.attendance_status==='cancelled'?'Canceló':a.attendance_status==='no-show'?'No asistió':'Pendiente';return `<tr><td>${esc(formatDateLocal(a.start_at))}<span class="consultation-mini">${esc(formatTimeLocal(a.start_at))}</span></td><td><b>${esc(`${p.firstName||''} ${p.lastName||''}`.trim())}</b><span class="consultation-mini">${esc(p.patientId||'Sin ID')}</span></td><td><span class="pill">${esc(appointmentStatusLabel(a.status))}</span></td><td>${a.paid?'💳 Pagado':'⏳ Pendiente'}</td><td>${a.patient_notified?'🔔 Avisado':'🔕 No avisado'}</td><td><div class="consultation-row-actions"><button class="btn ghost" onclick="window.editAppointment('${esc(a.id)}')">Abrir cita</button></div><small class="consultation-mini">${esc(att)}</small></td></tr>`}).join('');
}

function historyPatientKey(p={}){
  const id=String(p.patientId||'').trim().toLowerCase();
  if(id)return `id:${id}`;
  const name=`${p.firstName||''}|${p.lastName||''}`.trim().toLowerCase();
  return `name:${name}`;
}
function renderHistory(){
  const q=($('#historySearch')?.value||'').trim().toLowerCase();

  // Historial de pacientes: muestra a toda la población de la clínica,
  // incluso cuando un paciente aún no tenga una ecografía registrada.
  const patientsMap=new Map();
  state.patients.forEach(p=>patientsMap.set(historyPatientKey(p),p));

  // Respaldo: si existe un informe cuyo paciente no está disponible en la
  // carga de patients, también lo conservamos en la vista histórica.
  state.reports.forEach(r=>{
    const p=r.patient||{};
    const key=historyPatientKey(p);
    if(!patientsMap.has(key))patientsMap.set(key,{
      id:'report-only-'+r.id,firstName:p.firstName||'Paciente',lastName:p.lastName||'',birthDate:p.birthDate||'',patientId:p.patientId||'',sex:p.sex||''
    });
  });

  const latestByPatient=new Map(),countByPatient=new Map();
  state.reports.forEach(r=>{
    const key=historyPatientKey(r.patient||{});
    countByPatient.set(key,(countByPatient.get(key)||0)+1);
    const previous=latestByPatient.get(key);
    if(!previous||new Date(r.date)>new Date(previous.date))latestByPatient.set(key,r);
  });

  const rows=[...patientsMap.entries()]
    .map(([key,p])=>({key,p,latest:latestByPatient.get(key)||null,count:countByPatient.get(key)||0}))
    .filter(row=>{
      const text=`${row.p.firstName||''} ${row.p.lastName||''} ${row.p.patientId||''} ${row.latest?.template||''}`.toLowerCase();
      return text.includes(q);
    })
    .sort((a,b)=>{
      const lastA=`${a.p.lastName||''} ${a.p.firstName||''}`.trim();
      const lastB=`${b.p.lastName||''} ${b.p.firstName||''}`.trim();
      return lastA.localeCompare(lastB,'es',{sensitivity:'base'});
    });

  if(!rows.length && state.patientLoadError){
    $('#historyCount').textContent='Error al cargar pacientes';
    $('#historyBody').innerHTML=`<tr><td colspan="7" style="text-align:center;padding:35px"><b style="color:#a33a3a">No se pudo cargar el historial de pacientes.</b><br><small style="color:#8a96a8">${esc(state.patientLoadError)}</small></td></tr>`;
    return;
  }
  $('#historyCount').textContent=`${rows.length} paciente${rows.length===1?'':'s'}`;
  if(!rows.length){
    $('#historyBody').innerHTML='<tr><td colspan="7" style="text-align:center;color:#8a96a8;padding:35px">No hay pacientes que coincidan con la búsqueda.</td></tr>';
    return;
  }

  $('#historyBody').innerHTML=rows.map(row=>{
    const p=row.p,r=row.latest;
    return `<tr>
      <td><b>${esc(`${p.firstName||''} ${p.lastName||''}`.trim()||'Paciente')}</b></td>
      <td>${esc(p.patientId||'—')}</td>
      <td>${r?esc(r.template):'<span class="history-no-data">Sin ecografías</span>'}</td>
      <td>${r?esc(formatDateLocal(r.date)):'—'}</td>
      <td><span class="pill history-count-pill">${row.count}</span></td>
      <td>${r?`<span class="pill">${esc(r.status)}</span>`:'<span class="history-no-data">Sin registro</span>'}</td>
      <td>${r?`<button class="btn ghost" onclick="openReport('${esc(r.id)}')">Abrir última</button>`:'<span style="color:#a0a9b5;font-size:11px">—</span>'}</td>
    </tr>`;
  }).join('');
}
window.openReport=async id=>{const r=state.reports.find(x=>x.id===id);if(!r)return;if(!await ensureSectionAccess('ecografias'))return;$('#firstName').value=r.patient.firstName;$('#lastName').value=r.patient.lastName;$('#birthDate').value=r.patient.birthDate;$('#age').value=r.patient.age;$('#patientId').value=r.patient.patientId;$('#sex').value=r.patient.sex;$('#reason').value=r.patient.reason;$$('.conditions input').forEach(x=>x.checked=r.patient.conditions.includes(x.value));state.currentRemoteReportId=r.remote?r.id:null;state.currentReportToken=r.publicToken||null;applyTemplateSelection(r.templateId,{resetReport:false});renderTemplateSelect();$('#reportEditor').innerHTML=r.content||'';showView('report')}

async function saveOwnerSectionKeys(){
  if(!state.isPlatformOwner)return toast('Acceso exclusivo del propietario.');
  const clinicId=$('#ownerClinicSelect')?.value;
  if(!clinicId)return toast('Selecciona una clínica.');
  const codes=['ecografias','consultas','panel','agenda','historial'];
  const pending=codes.map(code=>({code,key:$('#ownerKey_'+code)?.value.trim()||''})).filter(x=>x.key);
  if(!pending.length)return toast('Introduce al menos una nueva clave.');
  try{
    const btn=$('#ownerSaveSectionKeys');if(btn){btn.disabled=true;btn.textContent='Guardando…';}
    for(const x of pending){const {data,error}=await supabaseClient.rpc('owner_set_section_access',{p_clinic_id:clinicId,p_section_code:x.code,p_access_key:x.key,p_active:true});if(error)throw error;if(!data)throw new Error('No se pudo guardar la clave de '+x.code+'.');}
    toast('Claves de sección actualizadas.');
    await loadOwnerClinicDetail(clinicId);
  }catch(e){console.error(e);toast(e?.message||'No se pudieron guardar las claves.')}
  finally{const btn=$('#ownerSaveSectionKeys');if(btn){btn.disabled=false;btn.textContent='Guardar claves';}}
}

async function saveOwnerSpecialtyKey(){
  if(!state.isPlatformOwner||!state.ownerSelectedSpecialtyId)return toast('Selecciona una especialidad.');
  const key=$('#ownerSpecialtyKey')?.value.trim()||'';
  if(key.length<8)return toast('La clave debe tener al menos 8 caracteres.');
  try{const {data,error}=await supabaseClient.rpc('owner_reset_specialty_key',{p_specialty_id:state.ownerSelectedSpecialtyId,p_access_key:key});if(error)throw error;if(!data)throw new Error('No se pudo cambiar la clave.');closeModal();toast('Clave de especialidad actualizada.');await loadOwnerClinicDetail(state.ownerSelectedClinicId);}catch(e){console.error(e);toast(e?.message||'No se pudo cambiar la clave.')}}

window.ownerChooseSpecialtyKey=(id,name)=>{
  state.ownerSelectedSpecialtyId=id;
  openModal('Cambiar clave · '+name,`<p class="form-help">La clave anterior no se muestra. Define una nueva clave para esta especialidad.</p><label>Nueva clave<input id="ownerSpecialtyKey" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></label><div class="quick-actions"><button class="btn primary" id="ownerSaveSpecialtyKey" type="button">Guardar clave</button><button class="btn ghost" id="ownerCancelSpecialtyKey" type="button">Cancelar</button></div>`);
  $('#ownerSaveSpecialtyKey').onclick=saveOwnerSpecialtyKey;
  $('#ownerCancelSpecialtyKey').onclick=closeModal;
};

async function loadOwnerState(){
  state.isPlatformOwner=false;
  const conn=$('#supabaseConnectionCard');
  if(!supabaseClient||!currentUser){conn?.classList.add('hidden-panel');return;}
  try{const {data,error}=await supabaseClient.rpc('is_platform_owner');if(error)throw error;state.isPlatformOwner=!!data;const card=$('#ownerToolCard');if(card)card.classList.toggle('hidden-panel',!state.isPlatformOwner);const nav=$('#ownerNav');if(nav)nav.classList.toggle('hidden-panel',!state.isPlatformOwner);conn?.classList.toggle('hidden-panel',!state.isPlatformOwner)}catch(e){state.isPlatformOwner=false;const card=$('#ownerToolCard');if(card)card.classList.add('hidden-panel');const nav=$('#ownerNav');if(nav)nav.classList.add('hidden-panel');conn?.classList.add('hidden-panel');console.warn('EcoReport owner state:',e?.message||e)}
}
async function loadOwnerPanel(){if(!state.isPlatformOwner){toast('Acceso exclusivo del propietario.');return}const table=$('#ownerClinicsTable');if(table)table.innerHTML='<tr><td colspan="6">Cargando información de las clínicas…</td></tr>';try{const {data,error}=await supabaseClient.rpc('owner_list_clinics');if(error)throw error;state.ownerClinics=Array.isArray(data)?data:[];const sel=$('#ownerClinicSelect');if(sel){sel.innerHTML=state.ownerClinics.length?state.ownerClinics.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join(''):'<option value="">No hay clínicas disponibles</option>';if(!state.ownerSelectedClinicId||!state.ownerClinics.some(c=>String(c.id)===String(state.ownerSelectedClinicId)))state.ownerSelectedClinicId=state.ownerClinics[0]?.id||null;if(state.ownerSelectedClinicId)sel.value=state.ownerSelectedClinicId}renderOwnerClinics();if(state.ownerSelectedClinicId)await loadOwnerClinicDetail(state.ownerSelectedClinicId)}catch(e){console.error('EcoReport owner panel:',e);state.ownerClinics=[];if(table)table.innerHTML=`<tr><td colspan="6"><b>No se pudo cargar el panel.</b><br><small>${esc(e?.message||e)}</small></td></tr>`;toast('No se pudo cargar el panel del propietario: '+(e?.message||e))}}
function renderOwnerClinics(){const box=$('#ownerClinicsTable');if(!box)return;box.innerHTML=state.ownerClinics.length?state.ownerClinics.map(c=>`<tr class="${c.access_enabled===false?'owner-clinic-suspended':''}"><td><b>${esc(c.name)}</b><span class="owner-mini">${esc(c.address||'')}</span></td><td><span class="owner-table-status ${c.access_enabled===false?'suspended':'active'}">${c.access_enabled===false?'Suspendida':'Activa'}</span></td><td>${c.members||0}</td><td>${c.reports||0}</td><td>${c.consultations||0}</td><td>${c.appointments||0}</td></tr>`).join(''):'<tr><td colspan="6">No hay clínicas registradas.</td></tr>'}
function updateOwnerClinicAccessUI(clinic){const status=$('#ownerClinicAccessStatus'),reason=$('#ownerClinicAccessReason'),suspend=$('#ownerSuspendClinicAccess'),enable=$('#ownerEnableClinicAccess');if(!clinic){if(status)status.textContent='—';if(reason)reason.textContent='—';suspend?.classList.remove('hidden-panel');enable?.classList.add('hidden-panel');return}const active=clinic.access_enabled!==false;if(status){status.textContent=active?'ACTIVA':'SUSPENDIDA';status.className=active?'owner-status-active':'owner-status-suspended'}if(reason)reason.textContent=active?(clinic.access_changed_at?`Último cambio: ${formatDateLocal(clinic.access_changed_at)}`:'Acceso habilitado'):(clinic.access_reason||'Acceso suspendido por el propietario');suspend?.classList.toggle('hidden-panel',!active);enable?.classList.toggle('hidden-panel',active)}
async function loadOwnerClinicDetail(clinicId){if(!clinicId)return;state.ownerSelectedClinicId=clinicId;const clinic=state.ownerClinics.find(c=>String(c.id)===String(clinicId));updateOwnerClinicAccessUI(clinic||null);try{const [{data:keys,error:kerr},{data:sps,error:serr}]=await Promise.all([supabaseClient.rpc('owner_section_access',{p_clinic_id:clinicId}),supabaseClient.rpc('owner_list_specialties',{p_clinic_id:clinicId})]);if(kerr)throw kerr;if(serr)throw serr;const map=new Map((keys||[]).map(x=>[x.section_code,x]));['ecografias','consultas','panel','agenda','historial'].forEach(code=>{const row=map.get(code);const el=$(`#ownerKey_${code}`);if(el)el.value='';const badge=$(`#ownerKeyState_${code}`);if(badge)badge.textContent=row?.configured?'Configurada':'Sin configurar'});const box=$('#ownerSpecialtiesBody');if(box)box.innerHTML=(sps||[]).map(sp=>`<tr><td><b>${esc(sp.name)}</b><span class="owner-mini">${esc(sp.professional_name||'Especialista no configurado')}</span></td><td>${sp.active?'Activa':'Inactiva'}</td><td><button class="btn ghost" type="button" onclick="window.ownerChooseSpecialtyKey('${esc(sp.id)}','${esc(sp.name)}')">Cambiar clave</button></td></tr>`).join('')||'<tr><td colspan="3">No hay especialidades.</td></tr>';await loadOwnerUsers(clinicId);}catch(e){console.error(e);const box=$('#ownerSpecialtiesBody');if(box)box.innerHTML=`<tr><td colspan="3"><b>Error:</b> ${esc(e?.message||e)}</td></tr>`;toast('No se pudo cargar la configuración de la clínica: '+(e?.message||e))}}

async function invokeOwnerAdmin(action,payload={}){
  if(!state.isPlatformOwner)throw new Error('Acceso exclusivo del propietario.');
  if(!supabaseClient||!currentUser)throw new Error('Debes iniciar sesión.');
  const {data,error}=await supabaseClient.functions.invoke('owner-admin',{body:{action,...payload}});
  if(error)throw error;
  if(data?.error)throw new Error(data.error);
  return data;
}

function openOwnerNewClinicModal(){
  if(!state.isPlatformOwner)return toast('Acceso exclusivo del propietario.');
  openModal('Nueva clínica',`<p class="form-help">Crea la clínica y su primer usuario administrador en un solo paso. La contraseña será temporal y debe entregarse de forma segura.</p><div class="form-grid"><label>Nombre de la clínica<input id="onClinicName" placeholder="Clínica Nueva" required></label><label>Dirección<input id="onClinicAddress" placeholder="Dirección"></label><label>Teléfono<input id="onClinicPhone" placeholder="Teléfono"></label><label>Profesional principal<input id="onClinicProfessional" placeholder="Nombre del ecografista o médico"></label><label class="full">Correo del administrador<input id="onAdminEmail" type="email" placeholder="admin@clinica.com" required></label><label>Contraseña temporal<input id="onAdminPassword" type="password" minlength="8" placeholder="Mínimo 8 caracteres" required></label></div><div id="onClinicStatus" class="form-help"></div><div class="quick-actions"><button class="btn primary" id="createOwnerClinicBtn" type="button">Crear clínica</button><button class="btn ghost" id="cancelOwnerClinicBtn" type="button">Cancelar</button></div>`);
  $('#createOwnerClinicBtn').onclick=async()=>{
    const btn=$('#createOwnerClinicBtn');const name=$('#onClinicName').value.trim(),address=$('#onClinicAddress').value.trim(),phone=$('#onClinicPhone').value.trim(),professional=$('#onClinicProfessional').value.trim(),email=$('#onAdminEmail').value.trim().toLowerCase(),password=$('#onAdminPassword').value;
    if(!name)return toast('Indica el nombre de la clínica.');if(!email||!email.includes('@'))return toast('Indica un correo válido.');if(password.length<8)return toast('La contraseña temporal debe tener al menos 8 caracteres.');
    try{btn.disabled=true;btn.textContent='Creando…';const result=await invokeOwnerAdmin('onboard_clinic',{clinic_name:name,address,phone,sonographer_name:professional,admin_email:email,admin_password:password});closeModal();toast(`Clínica creada: ${result?.clinic_name||name}`);state.ownerSelectedClinicId=result?.clinic_id||null;await loadOwnerPanel();if(result?.clinic_id){const sel=$('#ownerClinicSelect');if(sel)sel.value=result.clinic_id;await loadOwnerClinicDetail(result.clinic_id);}}catch(e){console.error(e);$('#onClinicStatus').textContent=e?.message||'No se pudo crear la clínica.';btn.disabled=false;btn.textContent='Crear clínica';}
  };
  $('#cancelOwnerClinicBtn').onclick=closeModal;
}

async function loadOwnerUsers(clinicId){
  const body=$('#ownerUsersBody');if(body)body.innerHTML='<tr><td colspan="5">Cargando usuarios…</td></tr>';
  try{const {data,error}=await supabaseClient.rpc('owner_list_clinic_members',{p_clinic_id:clinicId});if(error)throw error;renderOwnerUsers(Array.isArray(data)?data:[]);}catch(e){console.error('EcoReport owner users:',e);if(body)body.innerHTML=`<tr><td colspan="5"><b>No se pudieron cargar los usuarios.</b><br><small>${esc(e?.message||e)}</small></td></tr>`;}
}

function roleLabel(role){return ({admin:'Administrador',doctor:'Médico',ecografista:'Ecografista',recepcion:'Recepción',assistant:'Asistente'}[String(role||'').toLowerCase()]||role||'Usuario')}
function renderOwnerUsers(users){
  const body=$('#ownerUsersBody');if(!body)return;
  body.innerHTML=users.length?users.map(u=>`<tr><td><b>${esc(u.email||u.user_id)}</b><span class="owner-mini">${esc(u.user_id)}</span></td><td><span class="pill">${esc(roleLabel(u.role))}</span></td><td><span class="owner-table-status ${u.active?'active':'suspended'}">${u.active?'Activo':'Inactivo'}</span></td><td>${u.last_sign_in_at?esc(formatDateLocal(u.last_sign_in_at)):'Nunca'}</td><td><div class="owner-user-actions"><button class="btn ghost" type="button" onclick="window.ownerEditUser('${esc(u.user_id)}','${esc(u.email||'')}','${esc(u.role||'')}')">Rol</button><button class="btn ghost" type="button" onclick="window.ownerToggleUser('${esc(u.user_id)}',${u.active?'false':'true'})">${u.active?'Suspender':'Activar'}</button><button class="btn ghost" type="button" onclick="window.ownerResetUserPassword('${esc(u.user_id)}','${esc(u.email||'')}')">Clave</button>${String(u.user_id)!==String(currentUser?.id||'')?`<button class="btn danger ghost" type="button" onclick="window.ownerRemoveUser('${esc(u.user_id)}','${esc(u.email||'')}')">Quitar</button>`:''}</div></td></tr>`).join(''):'<tr><td colspan="5">No hay usuarios en esta clínica.</td></tr>';
}

function openOwnerNewUserModal(){
  const clinicId=$('#ownerClinicSelect')?.value;if(!clinicId)return toast('Selecciona una clínica.');
  openModal('Nuevo usuario de la clínica',`<p class="form-help">El usuario se crea con una contraseña temporal y queda asociado únicamente a la clínica seleccionada.</p><div class="form-grid"><label>Nombre completo<input id="ouFullName" placeholder="Nombre del profesional"></label><label>Correo<input id="ouEmail" type="email" placeholder="usuario@clinica.com"></label><label>Rol<select id="ouRole"><option value="admin">Administrador</option><option value="doctor">Médico</option><option value="ecografista" selected>Ecografista</option><option value="recepcion">Recepción</option><option value="assistant">Asistente</option></select></label><label>Contraseña temporal<input id="ouPassword" type="password" minlength="8" placeholder="Mínimo 8 caracteres"></label></div><div id="ouStatus" class="form-help"></div><div class="quick-actions"><button class="btn primary" id="createOwnerUserBtn" type="button">Crear usuario</button><button class="btn ghost" id="cancelOwnerUserBtn" type="button">Cancelar</button></div>`);
  $('#createOwnerUserBtn').onclick=async()=>{const btn=$('#createOwnerUserBtn'),email=$('#ouEmail').value.trim().toLowerCase(),password=$('#ouPassword').value,role=$('#ouRole').value,fullName=$('#ouFullName').value.trim();if(!email||!email.includes('@'))return toast('Indica un correo válido.');if(password.length<8)return toast('La contraseña temporal debe tener al menos 8 caracteres.');try{btn.disabled=true;btn.textContent='Creando…';await invokeOwnerAdmin('add_user',{clinic_id:clinicId,email,password,role,full_name:fullName});closeModal();toast('Usuario creado correctamente.');await loadOwnerUsers(clinicId);}catch(e){console.error(e);$('#ouStatus').textContent=e?.message||'No se pudo crear el usuario.';btn.disabled=false;btn.textContent='Crear usuario';}};
  $('#cancelOwnerUserBtn').onclick=closeModal;
}

window.ownerEditUser=(id,email,currentRole)=>{const clinicId=$('#ownerClinicSelect')?.value;if(!clinicId)return;openModal('Cambiar rol de usuario',`<p class="form-help">${esc(email)}</p><label>Rol<select id="ownerRoleEdit"><option value="admin">Administrador</option><option value="doctor">Médico</option><option value="ecografista">Ecografista</option><option value="recepcion">Recepción</option><option value="assistant">Asistente</option></select></label><div class="quick-actions"><button class="btn primary" id="ownerRoleSave">Guardar</button><button class="btn ghost" id="ownerRoleCancel">Cancelar</button></div>`);$('#ownerRoleEdit').value=currentRole||'doctor';$('#ownerRoleSave').onclick=async()=>{try{const {error}=await supabaseClient.rpc('owner_set_clinic_member',{p_clinic_id:clinicId,p_user_id:id,p_role:$('#ownerRoleEdit').value,p_active:null});if(error)throw error;closeModal();toast('Rol actualizado.');await loadOwnerUsers(clinicId);}catch(e){toast(e?.message||'No se pudo actualizar el rol.')}};$('#ownerRoleCancel').onclick=closeModal;};
window.ownerToggleUser=async(id,active)=>{const clinicId=$('#ownerClinicSelect')?.value;if(!clinicId)return;try{const {error}=await supabaseClient.rpc('owner_set_clinic_member',{p_clinic_id:clinicId,p_user_id:id,p_role:null,p_active:!!active});if(error)throw error;toast(active?'Usuario activado.':'Usuario suspendido.');await loadOwnerUsers(clinicId);}catch(e){toast(e?.message||'No se pudo cambiar el estado del usuario.')}};
window.ownerRemoveUser=async(id,email)=>{const clinicId=$('#ownerClinicSelect')?.value;if(!clinicId)return;if(!confirm(`¿Quitar a ${email||'este usuario'} de la clínica? La cuenta de Supabase no se elimina.`))return;try{const {error}=await supabaseClient.rpc('owner_remove_clinic_member',{p_clinic_id:clinicId,p_user_id:id});if(error)throw error;toast('Usuario retirado de la clínica.');await loadOwnerUsers(clinicId);}catch(e){toast(e?.message||'No se pudo quitar el usuario.')}};
window.ownerResetUserPassword=async(id,email)=>{openModal('Restablecer contraseña',`<p class="form-help">Usuario: ${esc(email||id)}</p><label>Nueva contraseña<input id="ownerResetPassword" type="password" minlength="8" placeholder="Mínimo 8 caracteres"></label><div class="quick-actions"><button class="btn primary" id="ownerResetPasswordSave">Guardar</button><button class="btn ghost" id="ownerResetPasswordCancel">Cancelar</button></div>`);$('#ownerResetPasswordSave').onclick=async()=>{const password=$('#ownerResetPassword').value;if(password.length<8)return toast('Usa al menos 8 caracteres.');try{await invokeOwnerAdmin('reset_password',{user_id:id,password});closeModal();toast('Contraseña actualizada.');}catch(e){toast(e?.message||'No se pudo actualizar la contraseña.')}};$('#ownerResetPasswordCancel').onclick=closeModal;};

async function downloadOwnerClinicBackup(){const clinicId=$('#ownerClinicSelect')?.value;if(!clinicId)return toast('Selecciona una clínica.');if(!window.JSZip)return toast('No se pudo cargar el módulo de copias ZIP.');const status=$('#ownerBackupStatus');try{if(status)status.textContent='Preparando copia de seguridad…';const {data,error}=await supabaseClient.rpc('owner_backup_clinic',{p_clinic_id:clinicId});if(error)throw error;const zip=new JSZip();zip.file('database.json',JSON.stringify(data,null,2));const storageFolder=zip.folder('storage');const files=Array.isArray(data?.storage_files)?data.storage_files:[];for(let i=0;i<files.length;i++){const name=String(files[i]);if(status)status.textContent=`Copiando archivos ${i+1} de ${files.length}…`;const r=await supabaseClient.storage.from(cfg.STORAGE_BUCKET||'reports').download(`${clinicId}/${name}`);if(r.error)throw r.error;if(r.data)storageFolder.file(name,r.data);}const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`EcoReport_Backup_${String(data?.clinic?.name||'Clinica').replace(/[^a-z0-9_-]+/gi,'_')}_${new Date().toISOString().slice(0,10)}.zip`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);if(status)status.textContent=`Copia descargada. Registros clínicos: ${Object.values(data?.tables||{}).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0)} · Archivos: ${files.length}.`;toast('Copia de seguridad descargada.');}catch(e){console.error('EcoReport backup:',e);if(status)status.textContent='No se pudo crear la copia: '+(e?.message||e);toast('No se pudo crear la copia de seguridad.')}}

async function restoreOwnerClinicBackup(file){const clinicId=$('#ownerClinicSelect')?.value;if(!clinicId)return toast('Selecciona una clínica.');if(!window.JSZip)return toast('No se pudo cargar el módulo de copias ZIP.');if(!confirm('La restauración agregará o actualizará los datos de la copia seleccionada. No elimina datos nuevos automáticamente. ¿Continuar?'))return;const status=$('#ownerBackupStatus');try{if(status)status.textContent='Leyendo copia…';const zip=await JSZip.loadAsync(file);const dbEntry=zip.file('database.json');if(!dbEntry)throw new Error('La copia no contiene database.json.');const backup=JSON.parse(await dbEntry.async('text'));if(String(backup?.clinic?.id)!==String(clinicId))throw new Error('La copia pertenece a otra clínica. Selecciona la clínica correcta.');const tables=backup?.tables||{};if(backup?.clinic) {const {error}=await supabaseClient.from('clinics').upsert([backup.clinic],{onConflict:'id'});if(error)throw error;}const order=['patients','sonographers','templates','consultation_templates','specialties','appointments','consultations','reports','prescriptions','prescription_items','specialty_members','report_access_log','consultation_access_log'];for(const table of order){const rows=Array.isArray(tables[table])?tables[table]:[];for(let i=0;i<rows.length;i+=200){const chunk=rows.slice(i,i+200);if(status)status.textContent=`Restaurando ${table}…`;const {error}=await supabaseClient.from(table).upsert(chunk,{onConflict:'id'});if(error)throw new Error(`${table}: ${error.message}`);}}const storageObj=zip.folder('storage');if(storageObj){const entries=[];storageObj.forEach((path,obj)=>entries.push([path,obj]));for(let i=0;i<entries.length;i++){const [name,obj]=entries[i];if(status)status.textContent=`Restaurando archivos ${i+1} de ${entries.length}…`;const blob=await obj.async('blob');const {error}=await supabaseClient.storage.from(cfg.STORAGE_BUCKET||'reports').upload(`${clinicId}/${name}`,blob,{upsert:true,contentType:'application/pdf'});if(error)throw error;}}await loadPatients();await loadRemoteHistory();renderUnifiedHistory();await loadOwnerUsers(clinicId);if(status)status.textContent='Copia restaurada correctamente. Los datos nuevos no incluidos en la copia se conservaron.';toast('Copia restaurada correctamente.');}catch(e){console.error('EcoReport restore:',e);if(status)status.textContent='No se pudo restaurar la copia: '+(e?.message||e);toast('No se pudo restaurar la copia.')}}

async function setOwnerClinicAccess(enable){const clinicId=$('#ownerClinicSelect')?.value;if(!clinicId)return;const clinic=state.ownerClinics.find(c=>String(c.id)===String(clinicId));if(!clinic)return;if(!enable){const reason=prompt(`Escribe un motivo para suspender el acceso de ${clinic.name}:`,'Suscripción pendiente de renovación');if(reason===null)return;if(!reason.trim()){toast('Debes indicar un motivo.');return}if(!confirm(`¿Suspender el acceso de ${clinic.name}? Sus usuarios quedarán bloqueados hasta reactivarla.`))return;try{const {data,error}=await supabaseClient.rpc('owner_set_clinic_access',{p_clinic_id:clinicId,p_access_enabled:false,p_reason:reason.trim()});if(error)throw error;if(!data)throw new Error('No se pudo suspender la clínica.');toast('Acceso de la clínica suspendido.');await loadOwnerPanel()}catch(e){console.error(e);toast(e?.message||'No se pudo suspender la clínica.')}return}if(!confirm(`¿Activar nuevamente el acceso de ${clinic.name}?`))return;try{const {data,error}=await supabaseClient.rpc('owner_set_clinic_access',{p_clinic_id:clinicId,p_access_enabled:true,p_reason:null});if(error)throw error;if(!data)throw new Error('No se pudo activar la clínica.');toast('Acceso de la clínica activado.');await loadOwnerPanel()}catch(e){console.error(e);toast(e?.message||'No se pudo activar la clínica.')}}

function renderHome(){
  const countPatients=state.patients.length;
  const todayCount=state.appointments.filter(a=>dateKeyLocal(new Date(a.startAt))===todayKey()&&!appointmentIsClosedForWork(a)).length;
  const consultCount=state.consultations.length;
  const reportCount=state.reports.length;
  const map=[['homePatientCount',countPatients],['homeTodayCount',todayCount],['homeConsultCount',consultCount],['homeReportCount',reportCount]];
  map.forEach(([id,val])=>{const el=$('#'+id);if(el)el.textContent=String(val)});
}

function adminPeriodStart(){const v=$('#dashPeriod')?.value||'month',now=new Date();if(v==='all')return null;if(v==='year')return new Date(now.getFullYear(),0,1);if(v==='3months')return new Date(now.getFullYear(),now.getMonth()-2,1);return new Date(now.getFullYear(),now.getMonth(),1)}
function inAdminPeriod(value){const start=adminPeriodStart();if(!start)return true;const d=new Date(value);return !Number.isNaN(d.getTime())&&d>=start}
function setAdminMode(mode){state.adminMode=mode;['overview','ecografias','consultas'].forEach(k=>{$('#admin'+(k.charAt(0).toUpperCase()+k.slice(1))+'Tab')?.classList.toggle('active',k===mode);});$('#adminOverviewPanel')?.classList.toggle('hidden-panel',mode!=='overview');$('#adminEcoPanel')?.classList.toggle('hidden-panel',mode!=='ecografias');$('#adminConsultPanel')?.classList.toggle('hidden-panel',mode!=='consultas');renderDashboard();}
async function loadDashboardData(){if(!supabaseClient||!currentUser||!state.clinicId)return;try{await loadAppointments();await loadRemoteTemplates();if(state.currentSpecialtyId&&state.specialtySessionAccess.has(String(state.currentSpecialtyId)))await loadConsultationData();renderDashboard();}catch(e){console.error('EcoReport dashboard load error:',e)}}
function renderDashboard(){
  const rs=state.reports.filter(r=>inAdminPeriod(r.date));
  const cs=state.consultations.filter(c=>inAdminPeriod(c.performedAt));
  const apps=state.appointments||[];
  const today=apps.filter(a=>dateKeyLocal(a.startAt)===todayKey()&&!appointmentIsClosedForWork(a));
  const pendingToday=today.filter(a=>a.status==='pending'||a.status==='confirmed');
  const uniquePatients=new Set([...rs.map(r=>r.patient.patientId||`${r.patient.firstName} ${r.patient.lastName}`),...cs.map(c=>{const p=patientById(c.patientId)||{};return p.patientId||`${p.firstName||''} ${p.lastName||''}`.trim()})].filter(Boolean));
  $('#adminKpiTotal')?.replaceChildren(document.createTextNode(String(rs.length+cs.length)));
  $('#adminKpiEco')?.replaceChildren(document.createTextNode(String(rs.length)));
  $('#adminKpiConsult')?.replaceChildren(document.createTextNode(String(cs.length)));
  $('#adminKpiToday')?.replaceChildren(document.createTextNode(String(today.length)));
  $('#adminKpiPending')?.replaceChildren(document.createTextNode(String(pendingToday.length)));
  $('#adminKpiPatients')?.replaceChildren(document.createTextNode(String(uniquePatients.size)));
  $('#adminKpiEcoTemplates')?.replaceChildren(document.createTextNode(String(state.templates.length)));
  $('#adminKpiConsultTemplates')?.replaceChildren(document.createTextNode(String(state.consultationTemplates.length)));
  $('#adminTodayBadge')?.replaceChildren(document.createTextNode(String(today.length)));
  const recurring={};rs.forEach(r=>{const k=r.patient.patientId||`${r.patient.firstName} ${r.patient.lastName}`;recurring[k]=(recurring[k]||0)+1});
  const months={};[...rs.map(r=>({d:r.date,t:'eco'})),...cs.map(c=>({d:c.performedAt,t:'consult'}))].forEach(x=>{const d=new Date(x.d);if(Number.isNaN(d.getTime()))return;const k=d.toLocaleDateString('es-ES',{month:'short'});months[k]=(months[k]||0)+1});
  if(state.adminCharts.monthly)state.adminCharts.monthly.destroy();
  if(window.Chart&&$('#adminMonthlyChart'))state.adminCharts.monthly=new Chart($('#adminMonthlyChart'),{type:'line',data:{labels:Object.keys(months),datasets:[{label:'Atenciones',data:Object.values(months),tension:.35}]},options:{responsive:true,plugins:{legend:{display:false}}}});
  const dist={Ecografías:rs.length,Consultas:cs.length};if(state.adminCharts.dist)state.adminCharts.dist.destroy();if(window.Chart&&$('#adminDistributionChart'))state.adminCharts.dist=new Chart($('#adminDistributionChart'),{type:'doughnut',data:{labels:Object.keys(dist),datasets:[{data:Object.values(dist)}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});
  $('#adminTodayList').innerHTML=today.length?today.slice(0,12).map(a=>{const p=patientById(a.patientId)||{firstName:'Paciente',lastName:''};return `<div class="admin-list-item"><div><b>${esc(p.firstName+' '+p.lastName)}</b><small>${esc(a.type)} · ${esc(appointmentStatusLabel(a.status))}</small></div><span>${esc(formatTimeLocal(a.startAt))}</span></div>`}).join(''):'<div class="admin-list-item"><div><b>No hay citas hoy.</b><small>La agenda está libre.</small></div></div>';
  const recent=[...rs.map(r=>({date:r.date,label:'📡 '+r.template,patient:`${r.patient.firstName} ${r.patient.lastName}`})),...cs.map(c=>({date:c.performedAt,label:'🩺 '+(specialtyById(c.specialtyId)?.name||'Consulta'),patient:consultationPatientName(c.patientId)}))].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,10);
  $('#adminRecentList').innerHTML=recent.length?recent.map(r=>`<div class="admin-list-item"><div><b>${esc(r.patient)}</b><small>${esc(r.label)}</small></div><span>${esc(formatDateLocal(r.date))}</span></div>`).join(''):'<div class="admin-list-item"><div><b>Sin actividad reciente.</b></div></div>';
  // Eco tab
  $('#ecoKpiTotal')?.replaceChildren(document.createTextNode(String(rs.length)));$('#ecoKpiNormal')?.replaceChildren(document.createTextNode(String(rs.filter(r=>r.status==='Normal').length)));$('#ecoKpiFindings')?.replaceChildren(document.createTextNode(String(rs.filter(r=>r.status!=='Normal').length)));$('#ecoKpiRecurring')?.replaceChildren(document.createTextNode(String(Object.values(recurring).filter(n=>n>1).length)));$('#ecoKpiToday')?.replaceChildren(document.createTextNode(String(rs.filter(r=>dateKeyLocal(r.date)===todayKey()).length)));$('#ecoKpiTemplates')?.replaceChildren(document.createTextNode(String(state.templates.length)));
  const ecoTypes={};rs.forEach(r=>{ecoTypes[r.template]=(ecoTypes[r.template]||0)+1});$('#ecoTopStudies').innerHTML=Object.entries(ecoTypes).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,n])=>`<div class="admin-list-item"><div><b>${esc(k)}</b><small>Ecografía</small></div><span>${n}</span></div>`).join('')||'<div class="admin-list-item"><div><b>Sin datos.</b></div></div>';
  if(state.adminCharts.ecoMonthly)state.adminCharts.ecoMonthly.destroy();const em={};rs.forEach(r=>{const d=new Date(r.date),k=d.toLocaleDateString('es-ES',{month:'short'});em[k]=(em[k]||0)+1});if(window.Chart&&$('#ecoMonthlyChart'))state.adminCharts.ecoMonthly=new Chart($('#ecoMonthlyChart'),{type:'bar',data:{labels:Object.keys(em),datasets:[{label:'Ecografías',data:Object.values(em)}]},options:{responsive:true,plugins:{legend:{display:false}}}});
  // Consultas tab
  $('#consultKpiTotal')?.replaceChildren(document.createTextNode(String(cs.length)));$('#consultKpiCompleted')?.replaceChildren(document.createTextNode(String(cs.filter(c=>c.status==='completed').length)));$('#consultKpiDraft')?.replaceChildren(document.createTextNode(String(cs.filter(c=>c.status==='draft').length)));$('#consultKpiToday')?.replaceChildren(document.createTextNode(String(cs.filter(c=>dateKeyLocal(c.performedAt)===todayKey()).length)));$('#consultKpiSpecialties')?.replaceChildren(document.createTextNode(String(new Set(cs.map(c=>c.specialtyId).filter(Boolean)).size)));$('#consultKpiTemplates')?.replaceChildren(document.createTextNode(String(state.consultationTemplates.length)));
  const spCounts={};cs.forEach(c=>{const k=specialtyById(c.specialtyId)?.name||'Especialidad';spCounts[k]=(spCounts[k]||0)+1});if(state.adminCharts.consultSpecialty)state.adminCharts.consultSpecialty.destroy();if(window.Chart&&$('#consultSpecialtyChart'))state.adminCharts.consultSpecialty=new Chart($('#consultSpecialtyChart'),{type:'doughnut',data:{labels:Object.keys(spCounts),datasets:[{data:Object.values(spCounts)}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});
  $('#consultRecentList').innerHTML=cs.slice().sort((a,b)=>new Date(b.performedAt)-new Date(a.performedAt)).slice(0,10).map(c=>`<div class="admin-list-item"><div><b>${esc(consultationPatientName(c.patientId))}</b><small>${esc(specialtyById(c.specialtyId)?.name||'Especialidad')} · ${esc(consultationStatusLabel(c.status))}</small></div><span>${esc(formatDateLocal(c.performedAt))}</span></div>`).join('')||'<div class="admin-list-item"><div><b>Autoriza una especialidad para ver sus indicadores.</b></div></div>';
}
function resetReport(){['firstName','lastName','birthDate','age','patientId','reason'].forEach(id=>$('#'+id).value='');$('#sex').value='';$$('.conditions input').forEach(x=>x.checked=false);state.images=[];state.currentRemoteReportId=null;state.currentReportToken=null;state.currentReportAppointmentId=null;renderImages();if(state.templates.length)applyTemplateSelection(state.templates[0].id);renderTemplateSelect();toast('Formulario reiniciado')}
function loadSettings(){
  const s=state.settings;
  ['clinicName','clinicAddress','clinicPhone','doctorName','baseFontSize','fontFamily','letterheadWidth','letterheadHeight','topMargin','bottomMargin','publicReportBase'].forEach(id=>{if($('#'+id))$('#'+id).value=s[id]??''});
  if(state.letterhead){
    const isPdf=/^data:application\/pdf/i.test(state.letterhead);
    $('#letterheadPreview').innerHTML=isPdf
      ? `<div style="padding:10px"><b>Membrete PDF cargado</b><br><small>Se utilizará como fondo de la primera página del informe.</small></div>`
      : `<img src="${state.letterhead}">`;
  }
  if(state.signature)$('#signaturePreview').innerHTML=`<img src="${state.signature}">`;
  updateConnectionUI();
}
function saveSettings(){
  ['clinicName','clinicAddress','clinicPhone','doctorName','baseFontSize','fontFamily','letterheadWidth','letterheadHeight','topMargin','bottomMargin','publicReportBase'].forEach(id=>{state.settings[id]=$('#'+id).value});
  state.clinicId=$('#clinicId').value.trim();
  $('#clinicBadge').textContent=state.settings.clinicName||'Clínica';
  updateConnectionUI();
  toast('Configuración actualizada en esta sesión');
}
function handleAsset(e,type){
  const f=e.target.files[0];if(!f)return;
  if(type==='letterhead' && f.type!=='application/pdf' && !/^image\/(png|jpeg|jpg)$/i.test(f.type))return toast('El membrete debe ser PDF, PNG o JPG.');
  const r=new FileReader();
  r.onload=()=>{state[type]=r.result;loadSettings()};
  r.readAsDataURL(f);
}

function addFooter(doc,s,token){
  doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(135,146,160);
  doc.text(s.clinicName||'EcoReport Pro',14,288);
  doc.text(`Código: ${token}`,196,288,{align:'right'});
}

async function imageForPdf(src){
  return await new Promise((resolve,reject)=>{
    const im=new Image();
    im.onload=()=>{
      try{
        const c=document.createElement('canvas');
        const max=1800,scale=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
        c.width=Math.max(1,Math.round(im.naturalWidth*scale));
        c.height=Math.max(1,Math.round(im.naturalHeight*scale));
        const ctx=c.getContext('2d');ctx.drawImage(im,0,0,c.width,c.height);
        resolve(c.toDataURL('image/jpeg',.9));
      }catch(e){reject(e)}
    };
    im.onerror=reject;im.src=src;
  });
}

async function pdfLetterheadImage(){
  if(!state.letterhead)return null;
  if(/^data:image\//i.test(state.letterhead))return state.letterhead;
  if(!/^data:application\/pdf/i.test(state.letterhead))return null;
  if(!window.pdfjsLib)throw new Error('No se pudo cargar el lector de membretes PDF.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const raw=atob(state.letterhead.split(',')[1]);
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const pdf=await window.pdfjsLib.getDocument({data:bytes}).promise;
  const page=await pdf.getPage(1);
  const viewport=page.getViewport({scale:2.2});
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  return canvas.toDataURL('image/jpeg',.92);
}

async function getQrDataUrl(token,resourceType='report'){
  const base=(cfg.DOWNLOAD_FUNCTION_URL||state.settings.publicReportBase||'').trim().replace(/\/?$/,'');
  if(!base)throw new Error('No hay URL de descarga configurada en config.js.');
  if(!token)throw new Error('El informe no tiene public_token.');
  const qrEndpoint=`${base}?format=qr&resource=${encodeURIComponent(resourceType)}&token=${encodeURIComponent(token)}`;
  const response=await fetch(qrEndpoint,{method:'GET',headers:{'Accept':'application/json'},cache:'no-store'});
  if(!response.ok){const body=await response.text().catch(()=> '');throw new Error(`El servidor QR respondió ${response.status}${body?': '+body.slice(0,180):'.'}`)}
  const payload=await response.json();
  if(!payload?.dataUrl)throw new Error('El servidor devolvió un QR vacío.');
  return payload.dataUrl;
}

function drawLetterhead(doc,letterheadImage,s){
  if(letterheadImage){
    try{
      doc.addImage(letterheadImage,'JPEG',0,0,210,297);
      return true;
    }catch(e){console.warn('Membrete no pudo dibujarse:',e)}
  }
  doc.setFillColor(255,255,255);doc.rect(0,0,210,297,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(19,43,72);
  doc.text(s.clinicName||'CLÍNICA',14,16);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(91,106,125);
  if(s.clinicAddress)doc.text(s.clinicAddress,14,22);
  if(s.clinicPhone)doc.text(s.clinicPhone,14,27);
  return false;
}

function drawReportHeader(doc,s){
  doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(23,87,160);
  doc.text('INFORME ECOGRÁFICO',14,18);
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(112,128,150);
}

function drawImagesHeader(doc,y=58){
  const left=14,right=196;
  doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.setTextColor(23,87,160);doc.text('ANEXO DE CAPTURAS ECOGRÁFICAS',left,y);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(112,128,150);doc.text('Imágenes del estudio',right,y,{align:'right'});
}

function drawSignatureAndQr(doc,s,qrDataUrl,startY){
  const left=14,right=196;
  const signatureX=left,qrX=158,qrY=startY;
  const sigY=startY+6;
  if(state.signature&&state.signature.startsWith('data:image')){try{doc.addImage(state.signature,'PNG',signatureX,sigY,43,20)}catch(e){}}
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(39,53,70);
  doc.text(s.doctorName||'Ecografista',signatureX,sigY+25);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(120,132,147);
  doc.text('Firma digital',signatureX,sigY+30);
  if(qrDataUrl){
    doc.addImage(qrDataUrl,'PNG',qrX,qrY,28,28);
    doc.setFont('helvetica','bold');doc.setFontSize(6.2);doc.setTextColor(84,98,116);
    doc.text('ESCANEAR PARA',qrX+1,qrY+31);doc.text('DESCARGAR PDF',qrX+1,qrY+35);
  }else{
    doc.setFont('helvetica','normal');doc.setFontSize(6.2);doc.setTextColor(150,100,60);
    doc.text('QR no disponible',qrX,qrY+15);doc.text('Revise URL QR',qrX,qrY+20);
  }
}

function drawPatientGrid(doc,p,left,top){
  const w=182,h=32;
  doc.setFillColor(250,252,255);doc.setDrawColor(218,226,235);doc.setLineWidth(.4);doc.roundedRect(left,top,w,h,2.5,2.5,'FD');
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(24,88,167);doc.text('DATOS DEL PACIENTE',left+5,top+5.5);
  const x=[left+5,left+67,left+105,left+137],y1=top+14.5,y2=top+25;
  const vals=[['PACIENTE',`${p.firstName} ${p.lastName}`],['ID / CÉDULA',p.patientId||'—'],['EDAD',p.age?`${p.age} años`:'—'],['SEXO',p.sex||'—'],['F. NACIMIENTO',p.birthDate?new Date(p.birthDate+'T00:00:00').toLocaleDateString('es-ES'):'—'],['CONDICIONES',p.conditions.length?p.conditions.join(', '):'Ninguna referida']];
  const rows=[[vals[0],vals[1],vals[2],vals[3]],[vals[4],vals[5]]];
  rows.forEach((row,ri)=>row.forEach((c,i)=>{
    const xx=ri===0?x[i]:(i===0?x[0]:x[1]),ww=ri===0?[57,35,28,45][i]:i===0?57:110,yy=ri===0?y1:y2;
    doc.setFont('helvetica','bold');doc.setFontSize(6.1);doc.setTextColor(126,140,158);doc.text(c[0],xx,yy);
    doc.setFontSize(8);doc.setTextColor(29,43,61);doc.text(doc.splitTextToSize(c[1],ww).slice(0,1),xx,yy+4);
  }));
}

function drawSectionTitle(doc,title,y){
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(23,87,160);doc.text(title,14,y);
}


function preparePdfContentPage(doc,letterheadImage,s,title,yStart=42){
  drawLetterhead(doc,letterheadImage,s);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(90,105,122);
  if(title){doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.setTextColor(23,87,160);doc.text(title,14,35);}
  return yStart;
}

async function buildPdfBlob(token){
  const {jsPDF}=window.jspdf;
  const p=patient(),s=state.settings;
  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
  const left=14,right=196;
  const firstContentTop=58;
  const firstContentBottom=242;
  const pageBottom=270;
  let y=firstContentTop;

  let letterheadImage=null;
  try{letterheadImage=await pdfLetterheadImage()}catch(e){console.warn('Membrete PDF:',e)}

  // ===== Página 1: portada clínica =====
  drawLetterhead(doc,letterheadImage,s);
  // En la portada no superponemos texto sobre el membrete: el PDF configurado ocupa la hoja completa.
  // El título del informe se coloca inmediatamente debajo del área reservada al membrete.
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(24,44,70);
  doc.text('INFORME ECOGRÁFICO',left,52);
  y=firstContentTop;

  drawPatientGrid(doc,p,left,y);
  y+=40;

  const t=state.templates.find(x=>String(x.id)===String(state.currentTemplate))||state.templates[0];
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(24,44,70);
  doc.text(t?.name||'Ecografía',left,y);
  y+=5;
  doc.setFontSize(8);doc.setTextColor(75,88,105);
  const motivo=doc.splitTextToSize(`Indicación: ${p.reason||'No especificada'}`,182);
  doc.text(motivo.slice(0,2),left,y);y+=9;

  drawSectionTitle(doc,'HALLAZGOS ECOGRÁFICOS',y);y+=10;

  const plain=$('#reportEditor').innerText.trim();
  const paragraphs=plain.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  doc.setFont('helvetica','normal');doc.setFontSize(8.6);doc.setTextColor(47,58,72);

  // Reservamos un bloque fijo al final de la primera página para firma + QR.
  const reservedBottom=firstContentBottom;
  let movedToContinuation=false;
  for(const para of paragraphs){
    const lines=doc.splitTextToSize(para,182);
    for(const line of lines){
      if(!movedToContinuation && y+5>reservedBottom){
        addFooter(doc,s,token);doc.addPage();y=preparePdfContentPage(doc,letterheadImage,s,'INFORME ECOGRÁFICO · CONTINUACIÓN',42);
        movedToContinuation=true;
      }
      if(movedToContinuation && y>258){
        addFooter(doc,s,token);doc.addPage();y=preparePdfContentPage(doc,letterheadImage,s,'INFORME ECOGRÁFICO · CONTINUACIÓN',42);
      }
      doc.text(line,left,y);y+=4.7;
    }
    y+=1.8;
  }

  const imp=extractImpression(plain)||'Ver hallazgos descritos en el presente informe.';
  const impLines=doc.splitTextToSize(imp,172).slice(0,3);
  if(!movedToContinuation){
    const conclusionH=Math.max(24,16+impLines.length*4.2);
    if(y+conclusionH>reservedBottom){
      addFooter(doc,s,token);doc.addPage();y=preparePdfContentPage(doc,letterheadImage,s,'INFORME ECOGRÁFICO · CONTINUACIÓN',42);movedToContinuation=true;
    }
  }
  if(movedToContinuation){
    if(y+28>258){addFooter(doc,s,token);doc.addPage();y=preparePdfContentPage(doc,letterheadImage,s,'INFORME ECOGRÁFICO · CONTINUACIÓN',42);}
  }
  const conclusionH=Math.max(24,16+impLines.length*4.2);
  doc.setFillColor(248,251,255);doc.setDrawColor(211,222,234);doc.setLineWidth(.4);
  doc.roundedRect(left,y,182,conclusionH,2.5,2.5,'FD');
  doc.setFont('helvetica','bold');doc.setFontSize(7.2);doc.setTextColor(23,89,168);
  doc.text('IMPRESIÓN / CONCLUSIÓN',left+5,y+7);
  doc.setFont('helvetica','normal');doc.setFontSize(8.3);doc.setTextColor(43,55,70);
  doc.text(impLines,left+5,y+14);
  y+=conclusionH+6;

  let qrDataUrl=null;try{qrDataUrl=await getQrDataUrl(token)}catch(e){console.error('QR EcoReport:',e)}

  // Firma y QR SIEMPRE en la primera página.
  // Si el texto fue muy extenso, la firma se coloca en el bloque reservado de la portada,
  // sin depender de la página donde haya terminado el texto.
  const firstPageIndex=1;
  if(doc.getNumberOfPages()>firstPageIndex){
    doc.setPage(firstPageIndex);
    drawSignatureAndQr(doc,s,qrDataUrl,246);
    doc.setPage(doc.getNumberOfPages());
  }else{
    drawSignatureAndQr(doc,s,qrDataUrl,246);
  }

  // ===== Anexo de imágenes =====
  if(state.images.length){
    addFooter(doc,s,token);
    doc.addPage();
    drawLetterhead(doc,letterheadImage,s);
    drawImagesHeader(doc,58);

    const imgW=82,imgH=52,colGap=12,rowStep=60;
    const imageXs=[left,left+imgW+colGap];
    let imageY=70;

    for(let i=0;i<state.images.length;i++){
      const im=state.images[i],col=i%2;
      if(i>0&&col===0)imageY+=rowStep;
      if(imageY+imgH+8>258){
        addFooter(doc,s,token);doc.addPage();drawLetterhead(doc,letterheadImage,s);drawImagesHeader(doc,58);imageY=70;
      }
      const x=imageXs[col];
      try{
        const data=await imageForPdf(im.src);
        const img=new Image();
        await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=data});
        const scale=Math.min(imgW/img.width,imgH/img.height);
        const drawW=img.width*scale,drawH=img.height*scale;
        doc.addImage(data,'JPEG',x+(imgW-drawW)/2,imageY+(imgH-drawH)/2,drawW,drawH);
      }catch(e){console.warn('Imagen omitida',e)}
    }
  }

  // El pie se agrega una sola vez a la página final.
  addFooter(doc,s,token);
  return doc.output('blob');
}

async function uploadPdf(reportId,token){const blob=await buildPdfBlob(token);const path=`${state.clinicId}/${reportId}.pdf`;const {error:uploadError}=await supabaseClient.storage.from(cfg.STORAGE_BUCKET||'reports').upload(path,blob,{contentType:'application/pdf',upsert:true,cacheControl:'3600'});if(uploadError)throw uploadError;const {error:updateError}=await supabaseClient.from('reports').update({pdf_storage_path:path,public_download_enabled:true,updated_at:new Date().toISOString()}).eq('id',reportId).eq('clinic_id',state.clinicId);if(updateError)throw updateError;return {path,blob}}

async function downloadPdf(){
  const button=$('#downloadPdf');if(button?.disabled)return;
  try{if(button){button.disabled=true;button.textContent='Generando…'}const r=await ensureRemoteReport();toast('Generando PDF y guardándolo en Storage…');const result=await uploadPdf(r.id,r.public_token);const localUrl=URL.createObjectURL(result.blob);const a=document.createElement('a');a.href=localUrl;a.download=`Informe_${patient().lastName||'Paciente'}_${patient().firstName||''}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(localUrl),30000);await loadRemoteHistory();toast('PDF guardado en Supabase y descargado.')}
  catch(e){console.error('EcoReport PDF:',e);toast(e?.message||'No se pudo generar o subir el PDF')}
  finally{if(button){button.disabled=false;button.textContent='Descargar PDF'}}
}


// ============================================================
// EcoReport Pro V5.8 — Consultas + Especialidades seguras
// ============================================================
function nowLocalInput(){
  const d=new Date();
  const off=d.getTimezoneOffset()*60000;
  return new Date(d.getTime()-off).toISOString().slice(0,16);
}
function consultationStatusLabel(s){return ({draft:'Borrador',completed:'Completada',cancelled:'Cancelada'})[s]||'Borrador'}
function consultationStatusClass(s){return s==='completed'?'consultation-status-completed':s==='cancelled'?'consultation-status-cancelled':'consultation-status-draft'}
function consultationById(id){return state.consultations.find(c=>String(c.id)===String(id))||null}
function consultationPatientName(id){const p=patientById(id);return p?`${p.firstName} ${p.lastName}`:'Paciente'}
function consultationTemplateById(id){return state.consultationTemplates.find(t=>String(t.id)===String(id))||null}
function specialtyById(id){return state.specialties.find(s=>String(s.id)===String(id))||null}
function currentSpecialty(){return specialtyById(state.currentSpecialtyId)}
function currentUserIsSpecialtyMember(id){return state.specialtyMemberIds.has(String(id))}

async function loadSpecialties(){
  if(!supabaseClient||!currentUser||!state.clinicId)return;
  try{
    const [sr,mr]=await Promise.all([
      supabaseClient.from('specialties').select('id,clinic_id,name,description,professional_name,active').eq('clinic_id',state.clinicId).eq('active',true).order('name'),
      supabaseClient.from('specialty_members').select('specialty_id,active').eq('user_id',currentUser.id).eq('active',true)
    ]);
    if(sr.error)throw sr.error;if(mr.error)throw mr.error;
    state.specialties=(sr.data||[]).map(x=>({...x,professionalName:x.professional_name||''}));
    state.specialtyMemberIds=new Set((mr.data||[]).map(x=>String(x.specialty_id)));
    if(state.currentSpecialtyId && !state.specialties.some(s=>String(s.id)===String(state.currentSpecialtyId))) state.currentSpecialtyId=null;
    renderSpecialtySelect();
    updateConsultationGate();
  }catch(e){console.error('EcoReport specialties load error:',e);toast('No se pudieron cargar las especialidades: '+(e?.message||e))}
}
function renderSpecialtySelect(){
  const select=$('#consultSpecialty');if(!select)return;
  select.innerHTML='<option value="">Seleccionar especialidad…</option>'+state.specialties.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  select.value=state.currentSpecialtyId||'';
  updateConsultationGate();
}
function updateConsultationGate(){
  const locked=$('#consultationLockedState'),workspace=$('#consultationWorkspace'),badge=$('#specialtyAccessBadge'),hint=$('#specialtySecurityHint');
  const sp=currentSpecialty();
  const authorized=!!sp&&currentUserIsSpecialtyMember(sp.id)&&state.specialtySessionAccess.has(String(sp.id));
  if(locked)locked.classList.toggle('hidden-panel',authorized);
  if(workspace)workspace.classList.toggle('hidden-panel',!authorized);
  if(badge){badge.textContent=sp?(authorized?'🔓 Acceso autorizado':'🔐 Requiere clave'):'Sin seleccionar';badge.className='pill '+(authorized?'ok':'')}
  if(hint)hint.textContent=sp?(authorized?'🔒 Esta especialidad tiene acceso activo para tu usuario. Las consultas quedan separadas por especialidad.':'🔑 Esta especialidad requiere la clave de acceso la primera vez que la utilices.'):'🔒 Las consultas nuevas quedan protegidas por la especialidad seleccionada.';
}
async function handleSpecialtyChange(){
  const selected=$('#consultSpecialty')?.value||'';
  if(!selected){state.currentSpecialtyId=null;state.consultationTemplates=[];state.consultations=[];renderConsultationTemplateSelect();renderConsultations();updateConsultationGate();return}
  const sp=specialtyById(selected);if(!sp)return;
  if(!currentUserIsSpecialtyMember(selected)||!state.specialtySessionAccess.has(String(selected))){
    const ok=await requestSpecialtyAccess(sp);
    if(!ok){$('#consultSpecialty').value=state.currentSpecialtyId||'';return}
  }
  state.currentSpecialtyId=selected;
  clearConsultationForm(false);
  await loadConsultationData();
  toast(`Especialidad seleccionada: ${sp.name}`);
}
async function requestSpecialtyAccess(sp){
  return await new Promise(resolve=>{
    openModal(`Acceso a ${esc(sp.name)}`,`<p class="form-help">Esta especialidad está protegida. Introduce su clave de acceso para habilitarla en tu cuenta.</p><label>Clave de especialidad<input id="specialtyAccessKey" type="password" autocomplete="off" placeholder="Clave de acceso"></label><div class="quick-actions"><button class="btn primary" id="confirmSpecialtyAccess">Abrir especialidad</button><button class="btn ghost" id="cancelSpecialtyAccess">Cancelar</button></div>`);
    $('#cancelSpecialtyAccess').onclick=()=>{closeModal();resolve(false)};
    $('#confirmSpecialtyAccess').onclick=async()=>{
      const key=$('#specialtyAccessKey').value.trim();if(!key){toast('Introduce la clave de la especialidad.');return}
      try{
        $('#confirmSpecialtyAccess').disabled=true;
        const {data,error}=await supabaseClient.rpc('verify_specialty_access',{p_specialty_id:sp.id,p_access_key:key});
        if(error)throw error;
        if(!data)throw new Error('La clave no es válida o el acceso no está disponible.');
        closeModal();state.specialtySessionAccess.add(String(sp.id));state.currentSpecialtyId=sp.id;renderSpecialtySelect();updateConsultationGate();resolve(true);toast(`Acceso concedido: ${sp.name}`);
      }catch(e){console.error(e);toast(e?.message||'No se pudo validar la clave.');$('#confirmSpecialtyAccess').disabled=false}
    };
  });
}
async function manageSpecialties(){
  if(!requireConnection()||!requireSession())return;
  await loadSpecialties();
  const activeSpecs=state.specialties.filter(s=>s.active!==false);
  if(!activeSpecs.length){createSpecialtyModal();return;}
  openModal('Acceso a especialidades',`<p class="form-help">🔒 Por privacidad, debes autorizar una especialidad cada vez que abras esta sección. El acceso visual no se recuerda automáticamente.</p><label>Especialidad<select id="specialtyGateSelect">${activeSpecs.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></label><label>Clave de acceso<input id="specialtyGateKey" type="password" autocomplete="off" placeholder="Clave de la especialidad"></label><div class="quick-actions"><button type="button" class="btn primary" id="specialtyGateOpen">Abrir especialidad</button><button type="button" class="btn secondary" id="specialtyGateCreate">＋ Crear especialidad</button><button type="button" class="btn ghost" id="specialtyGateCancel">Cancelar</button></div>`);
  $('#specialtyGateCancel').onclick=closeModal;
  $('#specialtyGateCreate').onclick=createSpecialtyModal;
  $('#specialtyGateOpen').onclick=async()=>{
    const id=$('#specialtyGateSelect').value,key=$('#specialtyGateKey').value.trim(),sp=specialtyById(id);if(!id||!sp){toast('Selecciona una especialidad.');return}if(!key){toast('Introduce la clave.');return}
    const btn=$('#specialtyGateOpen');try{btn.disabled=true;btn.textContent='Verificando…';const {data,error}=await supabaseClient.rpc('verify_specialty_access',{p_specialty_id:id,p_access_key:key});if(error)throw error;if(!data)throw new Error('La clave no es válida.');state.specialtySessionAccess.add(String(id));state.currentSpecialtyId=id;closeModal();renderSpecialtySelect();await loadConsultationData();toast(`Especialidad autorizada: ${sp.name}`)}catch(e){console.error(e);toast(e?.message||'No se pudo validar la clave.')}finally{if(btn){btn.disabled=false;btn.textContent='Abrir especialidad'}}
  };
}

function createSpecialtyModal(){
  openModal('Crear especialidad',`<p class="form-help">La especialidad tendrá su propia clave y el nombre del especialista se utilizará en la firma de los informes de consulta.</p><label>Nombre de la especialidad<input id="newSpecialtyName" placeholder="Ej. Cardiología"></label><label>Nombre del especialista<input id="newSpecialtyProfessional" placeholder="Ej. Dr. Juan Pérez"></label><label>Descripción<input id="newSpecialtyDesc" placeholder="Descripción breve"></label><label>Clave de acceso<input id="newSpecialtyKey" type="password" autocomplete="new-password" placeholder="Define una clave segura"></label><label>Confirmar clave<input id="newSpecialtyKey2" type="password" autocomplete="new-password" placeholder="Repite la clave"></label><div id="specialtyCreateStatus" class="form-help"></div><div class="quick-actions"><button type="button" class="btn primary" id="saveSpecialtyModal">Crear especialidad</button><button type="button" class="btn ghost" id="cancelNewSpecialty">Cancelar</button></div>`);
  $('#cancelNewSpecialty').onclick=manageSpecialties;
  $('#saveSpecialtyModal').onclick=async()=>{
    const btn=$('#saveSpecialtyModal');const status=$('#specialtyCreateStatus');const name=$('#newSpecialtyName').value.trim(),professional=$('#newSpecialtyProfessional').value.trim(),desc=$('#newSpecialtyDesc').value.trim(),key=$('#newSpecialtyKey').value.trim(),key2=$('#newSpecialtyKey2').value.trim();
    if(!name||!key){toast('Completa el nombre y la clave.');return}
    if(key!==key2){toast('Las claves no coinciden.');return}
    if(key.length<8){toast('La clave debe tener al menos 8 caracteres.');return}
    if(!supabaseClient||!currentUser||!state.clinicId){toast('La sesión o la clínica no están disponibles.');return}
    try{
      btn.disabled=true;btn.textContent='Creando…';if(status)status.textContent='Guardando especialidad…';
      const {data,error}=await supabaseClient.rpc('create_specialty',{p_clinic_id:state.clinicId,p_name:name,p_description:desc,p_access_key:key,p_professional_name:professional||null});
      if(error)throw error;
      if(!data)throw new Error('Supabase no devolvió el identificador de la especialidad.');
      state.currentSpecialtyId=data;state.specialtySessionAccess.add(String(data));await loadSpecialties();renderSpecialtySelect();await loadConsultationData();closeModal();toast('Especialidad creada correctamente.');
    }catch(e){console.error('EcoReport specialty creation error:',e);if(status)status.textContent=e?.message||'No se pudo crear la especialidad.';toast('No se pudo crear la especialidad: '+(e?.message||e));btn.disabled=false;btn.textContent='Crear especialidad';}
  };
}
function renderConsultationTemplateSelect(){
  const s=$('#consultTemplate');if(!s)return;
  s.innerHTML='<option value="">Seleccionar plantilla…</option>'+state.consultationTemplates.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
}
function renderConsultationTemplatePreview(){
  const box=$('#consultTemplatePreview');if(!box)return;
  const t=consultationTemplateById($('#consultTemplate')?.value);
  box.innerHTML=t?`<b>${esc(t.name)}</b><span class="consultation-mini">${esc(t.description||'')}</span><div style="margin-top:12px">${t.content||'<span style="color:#8a96a8">Sin contenido de plantilla.</span>'}</div>`:'Selecciona una plantilla para ver su contenido.';
}
function normalizeTemplateLabel(value){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s\u00a0]+/g,' ').trim();
}
function templateToConsultationFields(html){
  const map={
    reason:['motivo de consulta','motivo / motivo de consulta','motivo / evolucion','motivo','motivo de consulta clinica'],
    history:['antecedentes relevantes','antecedentes gineco-obstetricos','antecedentes gineco obstetricos','antecedentes'],
    physicalExam:['examen fisico','hallazgos del examen fisico','hallazgos relevantes'],
    assessment:['evaluacion clinica','evaluacion','valoracion'],
    diagnosis:['diagnostico','impresion','impresion diagnostica'],
    plan:['plan / indicaciones','plan / indicaciones o tratamiento','plan','tratamiento'],
    observations:['observaciones','observaciones adicionales']
  };
  const reverse=new Map();Object.entries(map).forEach(([k,labels])=>labels.forEach(label=>reverse.set(label,k)));
  const doc=document.createElement('div');doc.innerHTML=html||'';
  const blocks=[...doc.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div,li')].filter(el=>el.textContent.trim());
  const fields={reason:'',history:'',physicalExam:'',assessment:'',diagnosis:'',plan:'',observations:''};
  const extra=[];let current=null;
  const pushExtra=(el)=>{const txt=el.textContent.replace(/\s+/g,' ').trim();if(txt&&!/^\s*($)/.test(txt))extra.push(el.outerHTML)};
  blocks.forEach(el=>{
    const text=el.textContent.replace(/\s+/g,' ').trim();
    const normalized=normalizeTemplateLabel(text.replace(/\s*[:：]\s*$/,''));
    let key=reverse.get(normalized);
    let remainder='';
    if(!key){
      const m=normalized.match(/^([^:：]+)\s*[:：]\s*(.*)$/);
      if(m){key=reverse.get(normalizeTemplateLabel(m[1]));remainder=m[2]||'';}
    }
    if(key){current=key;if(remainder)fields[key]=remainder;return;}
    if(current){
      const clean=text.trim();if(clean)fields[current]=fields[current]?`${fields[current]}\n${clean}`:clean;
      return;
    }
    if(!/^consulta|^\s*especialidad/i.test(text))pushExtra(el);
  });
  return {fields,extraHtml:extra.join('')};
}
function applyConsultationTemplate(){
  const t=consultationTemplateById($('#consultTemplate')?.value);
  renderConsultationTemplatePreview();
  if(!t)return;
  const parsed=templateToConsultationFields(t.content||'');
  $('#consultReason').value=parsed.fields.reason;
  $('#consultHistory').value=parsed.fields.history;
  $('#consultPhysicalExam').value=parsed.fields.physicalExam;
  $('#consultAssessment').value=parsed.fields.assessment;
  $('#consultDiagnosis').value=parsed.fields.diagnosis;
  $('#consultPlan').value=parsed.fields.plan;
  $('#consultObservations').value=parsed.fields.observations;
  $('#consultEditor').innerHTML=parsed.extraHtml||'<p>Información adicional de la consulta.</p>';
}
function refreshConsultationAppointments(){
  const patientId=$('#consultPatient')?.value;const s=$('#consultAppointment');if(!s)return;
  const selected=s.value;
  const rows=state.appointments.filter(a=>String(a.patientId)===String(patientId)&&!appointmentIsClosedForWork(a)).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt));
  s.innerHTML='<option value="">Sin cita previa</option>'+rows.map(a=>`<option value="${esc(a.id)}">${esc(formatDateLocal(a.startAt))} · ${esc(formatTimeLocal(a.startAt))} · ${esc(a.type)}</option>`).join('');
  s.value=rows.some(a=>String(a.id)===String(selected))?selected:'';
}
function fillConsultationPatientFields(p){
  p=p||{};
  if($('#consultPatientFirstName'))$('#consultPatientFirstName').value=p.firstName||'';
  if($('#consultPatientLastName'))$('#consultPatientLastName').value=p.lastName||'';
  if($('#consultPatientBirthDate'))$('#consultPatientBirthDate').value=p.birthDate||'';
  if($('#consultPatientId'))$('#consultPatientId').value=p.patientId||'';
  if($('#consultPatientSex'))$('#consultPatientSex').value=p.sex||'';
  if($('#consultPatientPhone'))$('#consultPatientPhone').value=p.phone||'';
  if($('#consultPatientEmail'))$('#consultPatientEmail').value=p.email||'';
  if($('#consultPatientAddress'))$('#consultPatientAddress').value=p.address||'';
}
function onConsultationPatientSelected(){
  const p=patientById($('#consultPatient')?.value||'');
  fillConsultationPatientFields(p||{});
  refreshConsultationAppointments();
}
function renderConsultationPatientSelect(selected=''){
  const s=$('#consultPatient');if(!s)return;
  s.innerHTML='<option value="">Nuevo paciente / completar datos abajo…</option>'+state.patients.map(p=>`<option value="${esc(p.id)}">${esc(p.firstName+' '+p.lastName)}${p.patientId?' · '+esc(p.patientId):''}</option>`).join('');
  s.value=selected||'';
  if(selected)fillConsultationPatientFields(patientById(selected)||{});
  refreshConsultationAppointments();
}
async function loadConsultationData(){
  if(!supabaseClient||!currentUser||!state.clinicId)return;
  try{
    const specialtyId=state.currentSpecialtyId;
    if(!specialtyId || !state.specialtySessionAccess.has(String(specialtyId))){
      state.consultationTemplates=[];state.consultations=[];renderConsultationTemplateSelect();renderConsultations();updateConsultationGate();return;
    }
    let templateQuery=supabaseClient.from('consultation_templates').select('id,name,description,content_html,active,specialty_id').eq('clinic_id',state.clinicId).eq('active',true).order('name');
    let consultationQuery=supabaseClient.from('consultations').select('id,clinic_id,patient_id,appointment_id,template_id,professional_id,specialty_id,performed_at,status,reason,history,physical_exam,assessment,diagnosis,plan,observations,content_html,impression,public_token,public_download_enabled,pdf_storage_path,created_at,updated_at').eq('clinic_id',state.clinicId).order('performed_at',{ascending:false}).limit(500);
    if(specialtyId){templateQuery=templateQuery.or(`specialty_id.eq.${specialtyId},specialty_id.is.null`);consultationQuery=consultationQuery.or(`specialty_id.eq.${specialtyId}`)}
    const [tr,cr]=await Promise.all([templateQuery,consultationQuery]);
    if(tr.error)throw tr.error;if(cr.error)throw cr.error;
    const remoteTemplates=tr.data||[];
    state.consultationTemplates=remoteTemplates.length?remoteTemplates.map(t=>({id:t.id,name:t.name,description:t.description||'',content:t.content_html||'',specialtyId:t.specialty_id||''})):(specialtyId?demoConsultationTemplates.map(t=>({...t,specialtyId})):[]);
    state.consultations=(cr.data||[]).map(r=>({id:r.id,clinicId:r.clinic_id,patientId:r.patient_id,appointmentId:r.appointment_id||'',templateId:r.template_id||'',professionalId:r.professional_id||'',specialtyId:r.specialty_id||'',performedAt:r.performed_at,status:r.status||'completed',reason:r.reason||'',history:r.history||'',physicalExam:r.physical_exam||'',assessment:r.assessment||'',diagnosis:r.diagnosis||'',plan:r.plan||'',observations:r.observations||'',content:r.content_html||'',impression:r.impression||'',publicToken:r.public_token||'',publicDownloadEnabled:!!r.public_download_enabled,pdfStoragePath:r.pdf_storage_path||''}));
    renderConsultationTemplateSelect();renderConsultations();renderConsultationPatientSelect($('#consultPatient')?.value||'');updateConsultationGate();
  }catch(e){console.error('EcoReport consultation load error:',e);toast('No se pudieron cargar las consultas: '+(e?.message||e))}
}
function renderConsultations(){
  const body=$('#consultationsBody');if(!body)return;
  const q=($('#consultationSearch')?.value||'').trim().toLowerCase();
  const rows=state.consultations.filter(c=>{const t=consultationTemplateById(c.templateId),sp=specialtyById(c.specialtyId);return (!state.currentSpecialtyId||String(c.specialtyId)===String(state.currentSpecialtyId))&&(`${consultationPatientName(c.patientId)} ${sp?.name||''} ${t?.name||''} ${c.reason||''} ${c.diagnosis||''}`).toLowerCase().includes(q)});
  if(!rows.length){body.innerHTML='<tr><td colspan="6" class="patient-empty">No hay consultas guardadas para esta especialidad.</td></tr>';return}
  body.innerHTML=rows.map(c=>{const t=consultationTemplateById(c.templateId),sp=specialtyById(c.specialtyId);return `<tr><td>${esc(formatDateLocal(c.performedAt))}<span class="consultation-mini">${esc(formatTimeLocal(c.performedAt))}</span></td><td><b>${esc(consultationPatientName(c.patientId))}</b></td><td>${esc(sp?.name||'—')}</td><td>${esc(t?.name||'Consulta')}</td><td><span class="pill ${consultationStatusClass(c.status)}">${esc(consultationStatusLabel(c.status))}</span></td><td><div class="consultation-row-actions"><button class="btn ghost" onclick="window.openConsultation('${esc(c.id)}')">Abrir</button><button class="btn secondary" onclick="window.downloadConsultationById('${esc(c.id)}')">PDF</button></div></td></tr>`}).join('');
}
function clearConsultationForm(showLocked=true){
  state.currentConsultationId=null;
  $('#consultationState').textContent='Nueva';
  renderConsultationPatientSelect('');
  fillConsultationPatientFields({});
  if($('#consultTemplate'))$('#consultTemplate').value='';
  refreshConsultationAppointments();
  $('#consultPerformedAt').value=nowLocalInput();
  ['consultReason','consultHistory','consultPhysicalExam','consultAssessment','consultDiagnosis','consultPlan','consultObservations'].forEach(id=>$('#'+id).value='');
  $('#consultEditor').innerHTML='<p>Use este espacio para añadir información adicional que forme parte de la consulta.</p>';
  renderConsultationTemplatePreview();
  updateConsultationGate();
}
function resetConsultation(){clearConsultationForm();showView('consultations');toast(currentSpecialty()?`Nueva consulta de ${currentSpecialty().name} lista.`:'Selecciona una especialidad para comenzar.')}
async function ensureConsultationTemplate(t){
  if(!supabaseClient||!currentUser||!state.clinicId)return null;
  if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(t.id)))return t.id;
  if(!state.currentSpecialtyId)throw new Error('Selecciona una especialidad antes de guardar la plantilla.');
  const {data:existing,error:qerr}=await supabaseClient.from('consultation_templates').select('id').eq('clinic_id',state.clinicId).eq('specialty_id',state.currentSpecialtyId).eq('name',t.name).maybeSingle();
  if(qerr)throw qerr;
  if(existing){const {error}=await supabaseClient.from('consultation_templates').update({description:t.description,content_html:t.content,updated_at:new Date().toISOString()}).eq('id',existing.id).eq('clinic_id',state.clinicId);if(error)throw error;t.id=existing.id;return existing.id}
  const {data,error}=await supabaseClient.from('consultation_templates').insert({clinic_id:state.clinicId,specialty_id:state.currentSpecialtyId,name:t.name,description:t.description,content_html:t.content,created_by:currentUser.id}).select('id').single();
  if(error)throw error;t.id=data.id;return data.id;
}
function createConsultationTemplate(){
  if(!currentSpecialty()){toast('Selecciona una especialidad antes de crear la plantilla.');return}
  openModal(`Nueva plantilla · ${esc(currentSpecialty().name)}`,`<label>Nombre<input id="ctName" placeholder="Ej. Consulta de seguimiento"></label><label>Descripción<input id="ctDesc" placeholder="Descripción breve"></label><label>Contenido<div id="ctEditor" class="editor" contenteditable="true"><h3>${esc(currentSpecialty().name).toUpperCase()}</h3><p><b>Motivo de consulta:</b></p><p><b>Antecedentes:</b></p><p><b>Examen físico:</b></p><p><b>Evaluación:</b></p><p><b>Diagnóstico:</b></p><p><b>Plan / indicaciones:</b></p><p><b>Observaciones:</b></p></div></label><div class="quick-actions"><button class="btn primary" id="saveConsultationTemplateModal">Guardar plantilla</button></div>`);
  $('#saveConsultationTemplateModal').onclick=async()=>{
    const t={id:'demo-'+Date.now(),name:$('#ctName').value.trim()||'Nueva consulta',description:$('#ctDesc').value.trim(),content:$('#ctEditor').innerHTML,specialtyId:state.currentSpecialtyId};
    try{const id=await ensureConsultationTemplate(t);if(id)t.id=id;t.specialtyId=state.currentSpecialtyId;state.consultationTemplates.push(t);renderConsultationTemplateSelect();$('#consultTemplate').value=t.id;applyConsultationTemplate();closeModal();toast('Plantilla de consulta guardada en la especialidad.')}catch(e){console.error(e);toast('No se pudo guardar la plantilla: '+(e?.message||e))}
  };
}
async function ensureConsultationPatient(){
  const selectedId=$('#consultPatient').value||'';
  const p={firstName:$('#consultPatientFirstName').value.trim(),lastName:$('#consultPatientLastName').value.trim(),birthDate:$('#consultPatientBirthDate').value,patientId:$('#consultPatientId').value.trim(),sex:$('#consultPatientSex').value,phone:$('#consultPatientPhone').value.trim(),email:$('#consultPatientEmail').value.trim(),address:$('#consultPatientAddress').value.trim(),notes:''};
  if(!p.firstName||!p.lastName)throw new Error('Completa nombre y apellido del paciente.');
  if(selectedId){
    const {data,error}=await supabaseClient.from('patients').update({first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,patient_identifier:p.patientId||null,sex:p.sex||null,phone:p.phone||null,email:p.email||null,address:p.address||null,updated_at:new Date().toISOString()}).eq('id',selectedId).eq('clinic_id',state.clinicId).select('id').single();if(error)throw error;return data.id;
  }
  if(p.patientId){const {data:existing,error:qerr}=await supabaseClient.from('patients').select('id').eq('clinic_id',state.clinicId).eq('patient_identifier',p.patientId).maybeSingle();if(qerr)throw qerr;if(existing){const {data,error}=await supabaseClient.from('patients').update({first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,sex:p.sex||null,phone:p.phone||null,email:p.email||null,address:p.address||null,updated_at:new Date().toISOString()}).eq('id',existing.id).select('id').single();if(error)throw error;return data.id;}}
  const {data,error}=await supabaseClient.from('patients').insert({clinic_id:state.clinicId,first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,patient_identifier:p.patientId||null,sex:p.sex||null,phone:p.phone||null,email:p.email||null,address:p.address||null}).select('id').single();if(error)throw error;return data.id;
}
function collectConsultation(){return {patientId:$('#consultPatient').value,appointmentId:$('#consultAppointment').value||null,templateId:$('#consultTemplate').value||null,performedAt:$('#consultPerformedAt').value,reason:$('#consultReason').value.trim(),history:$('#consultHistory').value.trim(),physicalExam:$('#consultPhysicalExam').value.trim(),assessment:$('#consultAssessment').value.trim(),diagnosis:$('#consultDiagnosis').value.trim(),plan:$('#consultPlan').value.trim(),observations:$('#consultObservations').value.trim(),content:$('#consultEditor').innerHTML,status:'completed',impression:$('#consultDiagnosis').value.trim()||$('#consultAssessment').value.trim()}}
async function saveConsultation(){
  if(!requireConnection()||!requireSession())return;
  if(!currentSpecialty()||!currentUserIsSpecialtyMember(state.currentSpecialtyId)){toast('Selecciona y autoriza una especialidad.');return}
  const c=collectConsultation();
  if(!c.templateId){toast('Selecciona una plantilla de consulta.');return}
  if(!c.performedAt){toast('Completa la fecha y hora.');return}
  try{
    const patientId=await ensureConsultationPatient();c.patientId=patientId;
    let template=consultationTemplateById(c.templateId);if(template)c.templateId=await ensureConsultationTemplate({...template});
    const professionalId=await ensureSonographer();
    const payload={clinic_id:state.clinicId,patient_id:c.patientId,appointment_id:c.appointmentId,template_id:c.templateId,professional_id:professionalId,specialty_id:state.currentSpecialtyId,performed_at:new Date(c.performedAt).toISOString(),status:c.status,reason:c.reason||null,history:c.history||null,physical_exam:c.physicalExam||null,assessment:c.assessment||null,diagnosis:c.diagnosis||null,plan:c.plan||null,observations:c.observations||null,content_html:c.content||'',impression:c.impression||null,updated_at:new Date().toISOString()};
    let result;if(state.currentConsultationId){result=await supabaseClient.from('consultations').update(payload).eq('id',state.currentConsultationId).eq('clinic_id',state.clinicId).eq('specialty_id',state.currentSpecialtyId).select('id,public_token,public_download_enabled,pdf_storage_path').single()}else{result=await supabaseClient.from('consultations').insert({...payload,created_by:currentUser.id}).select('id,public_token,public_download_enabled,pdf_storage_path').single()}
    if(result.error)throw result.error;state.currentConsultationId=result.data.id;const local=state.consultations.find(x=>String(x.id)===String(result.data.id));if(local){local.publicToken=result.data.public_token||local.publicToken;local.publicDownloadEnabled=!!result.data.public_download_enabled;local.pdfStoragePath=result.data.pdf_storage_path||local.pdfStoragePath;}$('#consultationState').textContent='Guardada';await loadPatients();await loadConsultationData();toast('Consulta guardada correctamente.');
  }catch(e){console.error(e);toast('No se pudo guardar la consulta: '+(e?.message||e))}
}
window.openConsultation=async id=>{
  const c=consultationById(id);if(!c)return;
  if(!c.specialtyId){toast('Esta consulta es anterior al control por especialidad.');return}
  if(!currentUserIsSpecialtyMember(c.specialtyId)){toast('Tu cuenta no tiene acceso a esta especialidad.');return}
  state.currentSpecialtyId=c.specialtyId;renderSpecialtySelect();updateConsultationGate();showView('consultations');state.currentConsultationId=c.id;renderConsultationPatientSelect(c.patientId);fillConsultationPatientFields(patientById(c.patientId)||{});if($('#consultTemplate'))$('#consultTemplate').value=c.templateId||'';renderConsultationTemplatePreview();$('#consultAppointment').value=c.appointmentId||'';$('#consultPerformedAt').value=c.performedAt?(()=>{const d=new Date(c.performedAt),off=d.getTimezoneOffset()*60000;return new Date(d.getTime()-off).toISOString().slice(0,16)})():nowLocalInput();$('#consultReason').value=c.reason;$('#consultHistory').value=c.history;$('#consultPhysicalExam').value=c.physicalExam;$('#consultAssessment').value=c.assessment;$('#consultDiagnosis').value=c.diagnosis;$('#consultPlan').value=c.plan;$('#consultObservations').value=c.observations;$('#consultEditor').innerHTML=c.content||'<p>Sin contenido adicional.</p>';$('#consultationState').textContent='Editando';};
function consultationAge(p){if(!p?.birthDate)return '';const b=new Date(p.birthDate+'T00:00:00');const now=new Date();let a=now.getFullYear()-b.getFullYear();const m=now.getMonth()-b.getMonth();if(m<0||(m===0&&now.getDate()<b.getDate()))a--;return a>=0?String(a):''}
function consultationProfessionalName(c){
  const sp=specialtyById(c.specialtyId);
  const configured=String(sp?.professionalName||'').trim();
  if(configured)return configured;
  const clinicConfigured=String(state.settings.doctorName||'').trim();
  if(clinicConfigured && !/ecografista/i.test(clinicConfigured))return clinicConfigured;
  return sp?.name?`Especialista en ${sp.name}`:'Especialista';
}
async function uploadConsultationPdf(c){
  if(!c?.id)throw new Error('La consulta no tiene identificador.');
  let token=c.publicToken||'';
  if(!token){
    const {data,error}=await supabaseClient.from('consultations').select('public_token').eq('id',c.id).eq('clinic_id',state.clinicId).single();
    if(error)throw error;token=data.public_token;c.publicToken=token;
  }
  const blob=await buildConsultationPdfBlob(c);
  const path=`${state.clinicId}/consultations/${c.id}.pdf`;
  const {error:uploadError}=await supabaseClient.storage.from(cfg.STORAGE_BUCKET||'reports').upload(path,blob,{contentType:'application/pdf',upsert:true,cacheControl:'3600'});
  if(uploadError)throw uploadError;
  const {error:updateError}=await supabaseClient.from('consultations').update({pdf_storage_path:path,public_download_enabled:true,updated_at:new Date().toISOString()}).eq('id',c.id).eq('clinic_id',state.clinicId);
  if(updateError)throw updateError;
  c.pdfStoragePath=path;c.publicDownloadEnabled=true;c.publicToken=token;return {blob,path,token};
}
async function buildConsultationPdfBlob(c){
  const {jsPDF}=window.jspdf,s=state.settings,p=patientById(c.patientId)||{},sp=specialtyById(c.specialtyId);
  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});let letterheadImage=null;try{letterheadImage=await pdfLetterheadImage()}catch(e){console.warn('Membrete consulta:',e)}
  const left=14,right=196,firstTop=66,normalTop=58,firstBottom=232,normalBottom=268;let pageIndex=1,y=firstTop;
  const qrToken=c.publicToken||'';
  let qrDataUrl=null;try{if(qrToken)qrDataUrl=await getQrDataUrl(qrToken,'consultation')}catch(e){console.warn('QR consulta:',e)}
  const addPage=()=>{addFooter(doc,s,qrToken||'');doc.addPage();pageIndex++;drawLetterhead(doc,letterheadImage,s);y=normalTop};
  drawLetterhead(doc,letterheadImage,s);
  // El título empieza después del membrete. Nunca se dibuja sobre el área superior del formato.
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(24,44,70);doc.text(`CONSULTA MÉDICA · ${sp?.name||'Especialidad'}`,left,58);
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(112,128,150);doc.text(new Date(c.performedAt).toLocaleDateString('es-ES'),right,58,{align:'right'});
  doc.setFillColor(250,252,255);doc.setDrawColor(218,226,235);doc.roundedRect(left,y,182,38,2.5,2.5,'FD');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(24,88,167);doc.text('DATOS DEL PACIENTE',left+5,y+6);
  const patientName=`${p.firstName||'Paciente'} ${p.lastName||''}`.trim();const vals=[['PACIENTE',patientName||'—'],['ID / CÉDULA',p.patientId||'—'],['EDAD',consultationAge(p)?consultationAge(p)+' años':'—'],['SEXO',p.sex||'—'],['TELÉFONO',p.phone||'—'],['CORREO',p.email||'—'],['DIRECCIÓN',p.address||'—']];
  const xs=[left+5,left+67,left+112];[[0,1,2],[3,4,5]].forEach((row,ri)=>row.forEach((ix,ci)=>{const xx=xs[ci],yy=y+15+ri*10;doc.setFont('helvetica','bold');doc.setFontSize(6.1);doc.setTextColor(126,140,158);doc.text(vals[ix][0],xx,yy);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(29,43,61);doc.text(doc.splitTextToSize(vals[ix][1],ci===0?57:45).slice(0,1),xx,yy+4)}));
  doc.setFont('helvetica','bold');doc.setFontSize(6.1);doc.setTextColor(126,140,158);doc.text('DIRECCIÓN',left+5,y+35);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(29,43,61);doc.text(doc.splitTextToSize(p.address||'—',150).slice(0,1),left+32,y+35);y+=46;
  const t=consultationTemplateById(c.templateId);doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(23,87,160);doc.text(t?.name||'Consulta',left,y);y+=8;
  const sections=[['MOTIVO DE CONSULTA',c.reason],['ANTECEDENTES',c.history],['EXAMEN FÍSICO',c.physicalExam],['EVALUACIÓN',c.assessment],['DIAGNÓSTICO',c.diagnosis],['PLAN / INDICACIONES',c.plan],['OBSERVACIONES',c.observations]];
  const bottom=()=>pageIndex===1?firstBottom:normalBottom;
  const drawText=(title,textValue)=>{if(!textValue)return;doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(23,87,160);if(y+10>bottom())addPage();doc.text(title,left,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(47,58,72);const lines=doc.splitTextToSize(String(textValue),182);for(const line of lines){if(y+5>bottom())addPage();doc.text(line,left,y);y+=4.6}y+=3};for(const [title,val] of sections)drawText(title,val);
  if(c.content){if(y+10>bottom())addPage();doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(23,87,160);doc.text('CONTENIDO ADICIONAL',left,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(47,58,72);const tmp=document.createElement('div');tmp.innerHTML=c.content;for(const line of doc.splitTextToSize(tmp.innerText.trim(),182)){if(y+5>bottom())addPage();doc.text(line,left,y);y+=4.6}}
  // Firma + QR siempre en la primera página para las consultas, igual que en ecografías.
  doc.setPage(1);const signY=246;doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(39,53,70);doc.text(consultationProfessionalName(c),left,signY+25);if(state.signature&&state.signature.startsWith('data:image')){try{doc.addImage(state.signature,'PNG',left,signY+6,43,20)}catch(e){}}
  if(qrDataUrl){try{doc.addImage(qrDataUrl,'PNG',158,244,28,28);doc.setFont('helvetica','bold');doc.setFontSize(6.2);doc.setTextColor(84,98,116);doc.text('ESCANEAR PARA',158,275);doc.text('DESCARGAR PDF',158,279)}catch(e){}}
  doc.setPage(doc.getNumberOfPages());addFooter(doc,s,qrToken||'');return doc.output('blob');
}
async function downloadConsultationPdf(){const id=state.currentConsultationId;if(!id){await saveConsultation();if(!state.currentConsultationId)return}const c=consultationById(state.currentConsultationId);if(!c)return;try{const result=await uploadConsultationPdf(c);const url=URL.createObjectURL(result.blob);const p=patientById(c.patientId)||{};const a=document.createElement('a');a.href=url;a.download=`Consulta_${p.lastName||'Paciente'}_${p.firstName||''}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);await loadConsultationData();toast('Consulta PDF guardada, descargada y QR generado.')}catch(e){console.error(e);toast('No se pudo generar o guardar el PDF de la consulta: '+(e?.message||e))}}
window.downloadConsultationById=async id=>{const c=consultationById(id);if(!c)return;if(c.specialtyId&&!currentUserIsSpecialtyMember(c.specialtyId)){toast('Tu cuenta no tiene acceso a esta especialidad.');return}try{const result=await uploadConsultationPdf(c);const url=URL.createObjectURL(result.blob);const p=patientById(c.patientId)||{};const a=document.createElement('a');a.href=url;a.download=`Consulta_${p.lastName||'Paciente'}_${p.firstName||''}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('PDF descargado y actualizado con QR.')}catch(e){console.error(e);toast('No se pudo generar el PDF de la consulta: '+(e?.message||e))}};

// ============================================================
// EcoReport Pro V5.5 — Pacientes + Agenda
// ============================================================
function patientInitials(p){
  const a=(p.firstName||'').trim().charAt(0),b=(p.lastName||'').trim().charAt(0);
  return (a+b||'P').toUpperCase();
}
function formatDateLocal(value){
  if(!value)return '—';
  const d=value instanceof Date?value:new Date(value);
  if(Number.isNaN(d.getTime()))return '—';
  return d.toLocaleDateString('es-ES');
}
function formatTimeLocal(value){
  if(!value)return '—';
  const d=value instanceof Date?value:new Date(value);
  if(Number.isNaN(d.getTime()))return '—';
  return d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
}
function dateKeyLocal(d){
  const x=new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
}
function todayKey(){return dateKeyLocal(new Date())}
function monthTitle(d){return d.toLocaleDateString('es-ES',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())}

async function loadPatients(){
  if(!supabaseClient||!currentUser||!state.clinicId)return;
  try{
    state.patientLoadError='';let data=[];
    try{const rpc=await supabaseClient.rpc('history_list_patients_secure',{p_clinic_id:state.clinicId});if(rpc.error)throw rpc.error;data=rpc.data||[]}
    catch(rpcErr){console.warn('EcoReport patient RPC fallback:',rpcErr?.message||rpcErr);const direct=await supabaseClient.from('patients').select('id,first_name,last_name,birth_date,patient_identifier,sex,phone,email,address,notes').eq('clinic_id',state.clinicId).order('last_name').order('first_name').limit(2000);if(direct.error)throw direct.error;data=direct.data||[]}
    state.patients=(data||[]).map(p=>({id:p.id,firstName:p.first_name||'',lastName:p.last_name||'',birthDate:p.birth_date||'',patientId:p.patient_identifier||'',sex:p.sex||'',phone:p.phone||'',email:p.email||'',address:p.address||'',notes:p.notes||''}));
    renderHistory();renderPatients();refreshPatientSelectors();
  }catch(e){console.error('EcoReport patients load error:',e);state.patientLoadError=e?.message||String(e);state.patients=[];renderPatients();refreshPatientSelectors();renderHistory();toast('No se pudo cargar Pacientes: '+(e?.message||e))}
}
function patientById(id){return state.patients.find(p=>String(p.id)===String(id))||null}
function renderPatients(){
  const body=$('#patientsBody');if(!body)return;
  const q=($('#patientSearch')?.value||'').trim().toLowerCase();
  const rows=state.patients.filter(p=>(`${p.firstName} ${p.lastName} ${p.patientId} ${p.sex}`).toLowerCase().includes(q));
  if(!rows.length){body.innerHTML='<tr><td colspan="7" class="patient-empty">No hay pacientes que coincidan con la búsqueda.</td></tr>';return}
  const counts={};state.appointments.forEach(a=>{counts[a.patientId]=(counts[a.patientId]||0)+1});
  const studies={};state.reports.forEach(r=>{const id=r.patient.patientId||`${r.patient.firstName}|${r.patient.lastName}`;studies[id]=(studies[id]||0)+1});
  body.innerHTML=rows.map(p=>{
    const key=p.patientId||`${p.firstName}|${p.lastName}`;
    return `<tr><td><div class="patient-mini"><span class="patient-avatar">${esc(patientInitials(p))}</span><div><b>${esc(p.firstName)} ${esc(p.lastName)}</b><span style="display:block;color:#8895a7;font-size:10px">${esc(p.email||p.phone||'')}</span></div></div></td><td>${esc(p.patientId||'—')}</td><td>${esc(formatDateLocal(p.birthDate))}</td><td>${esc(p.sex||'—')}</td><td>${counts[p.id]||0}</td><td>${studies[key]||0}</td><td><div class="patient-table-actions"><button class="btn ghost" onclick="window.editPatient('${esc(p.id)}')">Editar</button><button class="btn secondary" onclick="window.schedulePatient('${esc(p.id)}')">Agendar</button></div></td></tr>`
  }).join('');
}

function refreshPatientSelectors(){
  const selects=$$('.appointment-patient-select');
  selects.forEach(s=>{
    const selected=s.value;
    s.innerHTML='<option value="">Seleccionar paciente…</option>'+state.patients.map(p=>`<option value="${esc(p.id)}">${esc(p.firstName+' '+p.lastName)}${p.patientId?' · '+esc(p.patientId):''}</option>`).join('');
    s.value=selected;
  });
}

function patientFormHtml(p={}){
  return `<div class="form-grid"><label>Nombre<input id="pmFirstName" value="${esc(p.firstName||'')}"></label><label>Apellido<input id="pmLastName" value="${esc(p.lastName||'')}"></label><label>Fecha de nacimiento<input id="pmBirthDate" type="date" value="${esc(p.birthDate||'')}"></label><label>Sexo<select id="pmSex"><option value="">Seleccionar</option><option value="Femenino" ${p.sex==='Femenino'?'selected':''}>Femenino</option><option value="Masculino" ${p.sex==='Masculino'?'selected':''}>Masculino</option><option value="Otro" ${p.sex==='Otro'?'selected':''}>Otro</option></select></label><label>Cédula / ID<input id="pmPatientId" value="${esc(p.patientId||'')}"></label><label>Teléfono<input id="pmPhone" value="${esc(p.phone||'')}"></label><label>Correo electrónico<input id="pmEmail" type="email" value="${esc(p.email||'')}"></label><label class="full">Dirección<input id="pmAddress" value="${esc(p.address||'')}"></label><label class="full">Observaciones<textarea id="pmNotes" rows="3">${esc(p.notes||'')}</textarea></label></div>`;
}
function collectPatientModal(id){
  return {id:id||null,firstName:$('#pmFirstName').value.trim(),lastName:$('#pmLastName').value.trim(),birthDate:$('#pmBirthDate').value,patientId:$('#pmPatientId').value.trim(),sex:$('#pmSex').value,phone:$('#pmPhone').value.trim(),email:$('#pmEmail').value.trim(),address:$('#pmAddress').value.trim(),notes:$('#pmNotes').value.trim()};
}
function openPatientModal(existing=null){
  openModal(existing?'Editar paciente':'Nuevo paciente',`${patientFormHtml(existing||{})}<div class="quick-actions"><button class="btn primary" id="savePatientModal">${existing?'Guardar cambios':'Guardar paciente'}</button></div>`);
  $('#savePatientModal').onclick=async()=>{
    const p=collectPatientModal(existing?.id);
    if(!p.firstName||!p.lastName){toast('Completa nombre y apellido.');return}
    if(!supabaseClient||!currentUser||!state.clinicId){toast('Debes iniciar sesión con una clínica activa.');return}
    try{
      let result;
      if(p.id){
        result=await supabaseClient.from('patients').update({first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,patient_identifier:p.patientId||null,sex:p.sex||null,phone:p.phone||null,email:p.email||null,address:p.address||null,notes:p.notes||null,updated_at:new Date().toISOString()}).eq('id',p.id).eq('clinic_id',state.clinicId);
      }else{
        result=await supabaseClient.from('patients').insert({clinic_id:state.clinicId,first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,patient_identifier:p.patientId||null,sex:p.sex||null,phone:p.phone||null,email:p.email||null,address:p.address||null,notes:p.notes||null}).select('id').single();
      }
      if(result.error)throw result.error;
      closeModal();await loadPatients();toast(existing?'Paciente actualizado.':'Paciente guardado.');
    }catch(e){console.error(e);toast('No se pudo guardar el paciente: '+(e?.message||e))}
  };
}
window.editPatient=id=>{const p=patientById(id);if(p)openPatientModal(p)};
window.schedulePatient=id=>{openAppointmentModal(null,id)};

function appointmentStatusLabel(s){return ({pending:'Pendiente',confirmed:'Confirmada',attended:'Atendida',cancelled:'Cancelada','no-show':'No asistió'})[s]||'Pendiente'}
function appointmentClass(s){return s||'pending'}
function appointmentToRow(row){return {id:row.id,clinicId:row.clinic_id,patientId:row.patient_id,professionalId:row.professional_id,startAt:row.start_at,endAt:row.end_at,type:row.appointment_type||'Consulta',status:row.status||'pending',reason:row.reason||'',notes:row.notes||'',paid:!!row.paid,patientNotified:!!row.patient_notified,attendanceStatus:row.attendance_status||'pending'}}
function appointmentIsClosedForWork(a){return ['cancelled','no-show'].includes(a?.status)||['cancelled','no-show'].includes(a?.attendanceStatus)}


function todaysUltrasoundAppointments(){
  const key=todayKey();
  return state.appointments.filter(a=>dateKeyLocal(a.startAt)===key&&appointmentServiceKind(a.type)==='ecografia'&&!appointmentIsClosedForWork(a)).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt));
}
function renderTodayUltrasoundAppointments(){
  const box=$('#todayUltrasoundAppointments'),count=$('#todayUltrasoundCount');if(!box)return;
  const rows=todaysUltrasoundAppointments();if(count)count.textContent=String(rows.length);
  if(!rows.length){box.innerHTML='<div class="today-ultrasound-empty">No hay pacientes agendados para ecografía hoy.</div>';return}
  box.innerHTML=rows.map(a=>{const p=patientById(a.patientId)||{firstName:'Paciente',lastName:'',patientId:'',phone:''};return `<button type="button" class="today-ultrasound-row" onclick="window.useScheduledUltrasound('${esc(a.id)}')"><span class="today-ultrasound-time">${esc(formatTimeLocal(a.startAt))}</span><span class="today-ultrasound-patient"><b>${esc(p.firstName+' '+p.lastName)}</b><small>${esc(p.patientId||'Sin ID')} · ${esc(a.type)}</small></span><span class="today-ultrasound-status">${esc(appointmentStatusLabel(a.status))} · ${a.paid?'💳':'⏳'}</span><span class="today-ultrasound-action">Usar paciente →</span></button>`}).join('');
}
window.useScheduledUltrasound=async id=>{
  if(!await ensureSectionAccess('ecografias'))return;
  const a=state.appointments.find(x=>String(x.id)===String(id));if(!a)return;
  const p=patientById(a.patientId)||{};state.currentReportAppointmentId=id;
  showView('report');
  $('#firstName').value=p.firstName||'';$('#lastName').value=p.lastName||'';$('#birthDate').value=p.birthDate||'';$('#patientId').value=p.patientId||'';$('#sex').value=p.sex||'';$('#age').value=consultationAge(p)||'';$('#reason').value=a.reason||'';
  const typeName=String(a.type||'').replace(/^Ecografía\s*·\s*/i,'').trim();const t=state.templates.find(x=>String(x.name).toLowerCase()===typeName.toLowerCase())||state.templates.find(x=>typeName&&String(x.name).toLowerCase().includes(typeName.toLowerCase()));if(t){applyTemplateSelection(t.id);renderTemplateSelect();}
  toast(`Paciente cargado desde Agenda: ${p.firstName||''} ${p.lastName||''}`);
};

async function loadAppointments(){
  if(!supabaseClient||!currentUser||!state.clinicId)return;
  try{
    const from=new Date(state.agendaDate.getFullYear(),state.agendaDate.getMonth()-1,1).toISOString();
    const to=new Date(state.agendaDate.getFullYear(),state.agendaDate.getMonth()+2,1).toISOString();
    const {data,error}=await supabaseClient.from('appointments').select('id,clinic_id,patient_id,professional_id,start_at,end_at,appointment_type,status,reason,notes,paid,patient_notified,attendance_status').eq('clinic_id',state.clinicId).gte('start_at',from).lt('start_at',to).order('start_at').limit(2000);
    if(error)throw error;
    state.appointments=(data||[]).map(appointmentToRow);renderPatients();renderAgenda();renderTodayUltrasoundAppointments();renderAgendaFollowUp();
  }catch(e){
    console.error('EcoReport appointments load error:',e);state.appointments=[];renderAgenda();renderTodayUltrasoundAppointments();
    const n=$('#agendaNotice');if(n)n.textContent='Ejecuta la migración SQL de V5.5 para activar la agenda.';
  }
}

function getPastUnresolvedAppointments(){
  const now=Date.now();
  const cutoff=now-30*86400000;
  return (state.appointments||[])
    .filter(a=>{
      const t=new Date(a.startAt).getTime();
      return Number.isFinite(t)&&t<now&&t>=cutoff&&['pending','confirmed'].includes(a.status)&&!['present','cancelled','no-show'].includes(a.attendanceStatus||'pending');
    })
    .sort((a,b)=>new Date(b.startAt)-new Date(a.startAt));
}
function renderAgendaFollowUp(){
  const box=$('#agendaFollowUp');
  if(!box)return;
  const rows=getPastUnresolvedAppointments();
  if(!rows.length){
    box.innerHTML='<div class="followup-empty"><b>✅ No hay citas pendientes de cierre.</b><span>Las citas anteriores están registradas o no requieren seguimiento.</span></div>';
    return;
  }
  const count=rows.length;
  const content=rows.slice(0,15).map(a=>{
    const p=patientById(a.patientId)||{firstName:'Paciente',lastName:'',patientId:''};
    return `<div class="agenda-followup-row"><div class="agenda-followup-date"><b>${esc(formatDateLocal(a.startAt))}</b><span>${esc(formatTimeLocal(a.startAt))}</span></div><div class="agenda-followup-patient"><b>${esc(`${p.firstName||''} ${p.lastName||''}`.trim())}</b><small>${esc(p.patientId||'Sin ID')} · ${esc(a.type)}</small></div><div class="agenda-followup-status"><span class="followup-badge">Pendiente de cierre</span><small>${a.paid?'💳 Pagado':'⏳ Pago pendiente'} · ${a.patientNotified?'🔔 Avisado':'🔕 No avisado'}</small></div><div class="agenda-followup-actions"><button type="button" class="btn secondary" onclick="window.markAppointmentOutcome('${esc(a.id)}','attended')">✅ Atendida</button><button type="button" class="btn ghost" onclick="window.markAppointmentOutcome('${esc(a.id)}','no-show')">⚠️ No asistió</button><button type="button" class="btn ghost" onclick="window.markAppointmentOutcome('${esc(a.id)}','cancelled')">✖️ Canceló</button></div></div>`;
  }).join('');
  const extra=count>15?`<div class="editor-hint">Hay ${count-15} citas adicionales pendientes de cierre.</div>`:'';
  box.innerHTML=`<div class="agenda-followup-head"><div><h3>⚠️ Citas pendientes de cierre</h3><p>Estas citas ya pasaron y todavía no tienen un resultado registrado. Elige qué ocurrió para mantener la agenda al día.</p></div><span class="pill">${count}</span></div><div class="agenda-followup-list">${content}</div>${extra}`;
}
window.markAppointmentOutcome=async function(id,outcome){
  if(!supabaseClient||!currentUser||!state.clinicId)return toast('Necesitas una sesión activa.');
  const map={attended:{status:'attended',attendance_status:'present',label:'atendida'},'no-show':{status:'no-show',attendance_status:'no-show',label:'marcada como no asistió'},cancelled:{status:'cancelled',attendance_status:'cancelled',label:'cancelada'}};
  const next=map[outcome];if(!next)return;
  const ok=confirm(`¿Quieres ${next.label} esta cita?`);if(!ok)return;
  try{
    const {error}=await supabaseClient.from('appointments').update({status:next.status,attendance_status:next.attendance_status,updated_at:new Date().toISOString()}).eq('id',id).eq('clinic_id',state.clinicId);
    if(error)throw error;
    await loadAppointments();
    renderAgendaFollowUp();
    checkOverdueAppointmentsModal(true);
    toast(`Cita ${next.label}.`);
  }catch(e){console.error('EcoReport appointment outcome:',e);toast('No se pudo actualizar la cita: '+(e?.message||e));}
};
function showOverdueAppointmentsModal(rows){
  if(!rows.length||!$('#modal')?.classList.contains('hidden'))return;
  const content=rows.slice(0,8).map(a=>{const p=patientById(a.patientId)||{firstName:'Paciente',lastName:''};return `<div class="admin-list-item"><div><b>${esc(`${p.firstName||''} ${p.lastName||''}`.trim())}</b><small>${esc(formatDateLocal(a.startAt))} · ${esc(formatTimeLocal(a.startAt))} · ${esc(a.type)}</small></div><span>⚠️ Pendiente</span></div>`}).join('');
  const extra=rows.length>8?`<p class="form-help">Hay ${rows.length-8} citas adicionales pendientes de cierre.</p>`:'';
  openModal('⚠️ Citas anteriores sin cerrar',`<p class="form-help">Hay citas cuyo horario ya pasó y todavía aparecen como pendientes. Regístralas como atendidas, no asistió o canceladas para cerrar correctamente la agenda.</p><div class="admin-list">${content}</div>${extra}<div class="quick-actions"><button class="btn primary" id="closeOverdueNotice">Revisar en agenda</button></div>`);
  $('#closeOverdueNotice').onclick=()=>{closeModal();void navigateToSection('agenda')};
}
function checkOverdueAppointmentsModal(force=false){
  const rows=getPastUnresolvedAppointments();
  if(!rows.length)return;
  const now=Date.now();
  if(!force&&now-state.overdueModalLastShown<30*60000)return;
  if(!$('#modal')?.classList.contains('hidden'))return;
  state.overdueModalLastShown=now;
  showOverdueAppointmentsModal(rows);
}

function shiftAgenda(delta){
  if(state.agendaMode==='month'){
    const now=new Date();
    const currentMonth=new Date(now.getFullYear(),now.getMonth(),1);
    const nextMonth=new Date(state.agendaDate.getFullYear(),state.agendaDate.getMonth()+delta,1);
    if(nextMonth<currentMonth)return;
    state.agendaDate=nextMonth;
  }else{
    state.agendaDate=new Date(state.agendaDate.getTime()+delta*86400000);
  }
  loadAppointments();
  renderAgenda();
}
function renderAgendaModeButtons(){
  $('#agendaMonthBtn')?.classList.toggle('secondary',state.agendaMode==='month');$('#agendaMonthBtn')?.classList.toggle('ghost',state.agendaMode!=='month');
  $('#agendaListBtn')?.classList.toggle('secondary',state.agendaMode==='list');$('#agendaListBtn')?.classList.toggle('ghost',state.agendaMode!=='list');
}
function appointmentsForKey(key){return state.appointments.filter(a=>dateKeyLocal(a.startAt)===key).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt))}
function renderAgenda(){
  const cal=$('#agendaCalendar'),list=$('#agendaList');if(!cal)return;
  const title=$('#agendaTitle');if(title)title.textContent=state.agendaMode==='month'?monthTitle(state.agendaDate):`Agenda · ${formatDateLocal(state.agendaDate)}`;
  renderAgendaModeButtons();
  const prevBtn=$('#agendaPrev');
  const now=new Date();
  const currentMonth=new Date(now.getFullYear(),now.getMonth(),1);
  if(prevBtn){
    const shownMonth=new Date(state.agendaDate.getFullYear(),state.agendaDate.getMonth(),1);
    prevBtn.disabled=state.agendaMode==='month'&&shownMonth<=currentMonth;
    prevBtn.title=prevBtn.disabled?'No hay meses anteriores en la vista de calendario.':'Mes anterior';
  }
  if(state.agendaMode==='list'){
    cal.style.display='none';list.classList.remove('hidden-panel');renderAgendaList();return;
  }
  cal.style.display='grid';list.classList.add('hidden-panel');

  const y=state.agendaDate.getFullYear(),m=state.agendaDate.getMonth();
  const first=new Date(y,m,1);
  const last=new Date(y,m+1,0);
  const todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const showingCurrentMonth=y===currentMonth.getFullYear()&&m===currentMonth.getMonth();

  // En el mes actual empezamos en la semana de hoy, no en la primera
  // semana del mes. Así desaparecen las filas completas de días pasados.
  // Para meses futuros empezamos en la semana que contiene el día 1.
  const anchor=showingCurrentMonth && todayStart>first?todayStart:first;
  const anchorMondayOffset=(anchor.getDay()+6)%7;
  const start=new Date(anchor);
  start.setDate(anchor.getDate()-anchorMondayOffset);

  const endBase=new Date(last);
  const endOffset=(7-(endBase.getDay()+6)%7-1+7)%7;
  const end=new Date(last);
  end.setDate(last.getDate()+endOffset);

  const parts=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  let html=parts.map(d=>`<div class="agenda-weekday">${d}</div>`).join('');
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const day=new Date(d);
    const key=dateKeyLocal(day);
    const outside=day.getMonth()!==m;
    const isPast=day<todayStart;
    const isToday=key===todayKey();
    if(isPast){
      // Solo dejamos una celda vacía de alineación cuando el primer día
      // visible de la semana todavía no coincide con lunes. Estas celdas
      // no tienen altura propia y por tanto nunca generan filas vacías.
      html+=`<div class="agenda-day-spacer" aria-hidden="true"></div>`;
      continue;
    }
    const aps=appointmentsForKey(key).slice(0,4);
    html+=`<div class="agenda-day ${outside?'outside':''} ${isToday?'today':''}"><div class="agenda-day-head"><span class="agenda-day-number">${day.getDate()}</span><button class="agenda-add" onclick="window.quickAppointment('${key}')">＋</button></div>${aps.map(a=>{const p=patientById(a.patientId)||{firstName:'Paciente',lastName:''};return `<div class="appt-chip ${appointmentClass(a.status)}" onclick="window.editAppointment('${esc(a.id)}')"><b>${formatTimeLocal(a.startAt)} · ${esc(p.firstName)} ${esc(p.lastName)}</b><span>${esc(a.type)}</span></div>`}).join('')}${appointmentsForKey(key).length>4?`<div style="font-size:9px;color:#77869a;margin-top:5px">+${appointmentsForKey(key).length-4} más</div>`:''}</div>`;
  }
  cal.innerHTML=html;
  const n=$('#agendaNotice');if(n)n.textContent='El calendario muestra únicamente hoy y los días futuros. Los días anteriores están disponibles en Lista.';
  renderAgendaFollowUp();
}
function renderAgendaList(){
  const list=$('#agendaList');if(!list)return;
  const today=todayKey();
  const all=[...state.appointments];
  const past=all.filter(a=>dateKeyLocal(a.startAt)<today).sort((a,b)=>new Date(b.startAt)-new Date(a.startAt));
  const todayRows=all.filter(a=>dateKeyLocal(a.startAt)===today).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt));
  const upcoming=all.filter(a=>dateKeyLocal(a.startAt)>today).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt));
  if(!all.length){list.innerHTML='<div class="patient-empty">No hay citas registradas en el periodo mostrado.</div>';return}
  const rowHtml=a=>{const p=patientById(a.patientId)||{firstName:'Paciente',lastName:''};return `<div class="agenda-list-row"><div class="agenda-list-time"><div>${formatDateLocal(a.startAt)}</div><div>${formatTimeLocal(a.startAt)} – ${formatTimeLocal(a.endAt)}</div></div><div class="agenda-list-patient"><b>${esc(p.firstName)} ${esc(p.lastName)}</b><span>${esc(p.patientId||'Sin ID')}</span></div><div>${esc(a.type)}<span style="display:block;color:#8b98a9;font-size:10px">${esc(a.reason||'')}</span></div><div><span class="pill status-select">${appointmentStatusLabel(a.status)}</span><small style="display:block;color:#7c8a9b;margin-top:4px">${a.paid?'💳 Pagado':'⏳ Pago pendiente'} · ${a.patientNotified?'🔔 Avisado':'🔕 No avisado'} · ${a.attendanceStatus==='present'?'✅ Presente':a.attendanceStatus==='cancelled'?'✖️ Canceló':a.attendanceStatus==='no-show'?'⚠️ No asistió':'🕒 Pendiente'}</small></div><div class="agenda-list-actions"><button class="btn ghost" onclick="window.editAppointment('${esc(a.id)}')">Editar</button></div></div>`};
  const section=(title,subtitle,rows,kind,emptyText)=>`<section class="agenda-list-section ${kind||''}"><div class="agenda-list-section-head"><div><h3>${title} <span class="agenda-section-count">${rows.length}</span></h3><p>${subtitle}</p></div></div>${rows.length?rows.map(rowHtml).join(''):`<div class="agenda-list-empty">${emptyText}</div>`}</section>`;
  list.innerHTML=section('📌 Hoy','Citas del día actual.',todayRows,'today','No hay citas para hoy.')+section('🔜 Próximas citas','Citas de días futuros, ordenadas desde la más cercana.',upcoming,'upcoming','No hay citas próximas en el periodo mostrado.')+section('🗂️ Citas pasadas','Citas correspondientes a días anteriores. Se mantienen aquí separadas de la agenda activa.',past,'past','No hay citas de días pasados en el periodo mostrado.');
}
function appointmentTypeLabel(value){
  return value||'Seleccionar ecografía o consulta…';
}
function appointmentServiceKind(value){const v=String(value||'');if(v.startsWith('Ecografía'))return 'ecografia';if(v.startsWith('Consulta'))return 'consulta';if(v.startsWith('MAPA'))return 'mapa';if(v.startsWith('Holter'))return 'holter';return 'otro';}
function fillAppointmentPatientFields(p={}){
  const map=[['apFirstName','firstName'],['apLastName','lastName'],['apBirthDate','birthDate'],['apPatientId','patientId'],['apSex','sex'],['apPhone','phone'],['apEmail','email'],['apAddress','address']];
  map.forEach(([id,k])=>{const el=$('#'+id);if(el)el.value=p[k]||''});
}
function appointmentPatientFromForm(){
  return {
    firstName:$('#apFirstName')?.value.trim()||'',
    lastName:$('#apLastName')?.value.trim()||'',
    birthDate:$('#apBirthDate')?.value||'',
    patientId:$('#apPatientId')?.value.trim()||'',
    sex:$('#apSex')?.value||'',
    phone:$('#apPhone')?.value.trim()||'',
    email:$('#apEmail')?.value.trim()||'',
    address:$('#apAddress')?.value.trim()||''
  };
}
function refreshAppointmentServiceLabel(){
  const label=$('#apServiceLabel');const hidden=$('#apType');if(!label||!hidden)return;
  const value=hidden.value||'';label.textContent=value||'Seleccionar ecografía o consulta…';
}
async function openAppointmentServicePicker(kind){
  try{if(kind==='ecografia' && supabaseClient&&currentUser&&state.clinicId){await loadRemoteTemplates();}if(kind==='consulta'&&supabaseClient&&currentUser&&state.clinicId){await loadSpecialties();}}catch(e){console.error('EcoReport service picker load:',e)}
  const existing=$('#appointmentServicePicker');if(existing)existing.remove();
  const overlay=document.createElement('div');overlay.id='appointmentServicePicker';overlay.className='appointment-picker-overlay';
  let content='';
  if(kind==='ecografia'){
    const rows=state.templates.map(t=>`<button type="button" class="service-option" data-service="${esc('Ecografía · '+t.name)}"><span>📡</span><div><b>${esc(t.name)}</b><small>Ecografía</small></div></button>`).join('');
    content=`<div class="appointment-picker-box"><div class="appointment-picker-head"><div><b>Seleccionar ecografía</b><span>Elige el tipo de estudio que se va a realizar.</span></div><button type="button" class="icon-btn" id="closeAppointmentPicker">×</button></div><div class="service-option-list">${rows||'<div class="patient-empty">No hay plantillas de ecografía disponibles.</div>'}</div></div>`;
  }else if(kind==='consulta'){
    const rows=state.specialties.map(sp=>`<button type="button" class="service-option" data-service="${esc('Consulta · '+sp.name)}"><span>🩺</span><div><b>${esc(sp.name)}</b><small>Consulta médica</small></div></button>`).join('');
    content=`<div class="appointment-picker-box"><div class="appointment-picker-head"><div><b>Seleccionar consulta</b><span>Elige la especialidad de la consulta.</span></div><button type="button" class="icon-btn" id="closeAppointmentPicker">×</button></div><div class="service-option-list">${rows||'<div class="patient-empty">No hay especialidades creadas todavía.</div>'}</div></div>`;
  }else{
    content=`<div class="appointment-picker-box"><div class="appointment-picker-head"><div><b>Otro tipo de cita</b><span>Selecciona una opción.</span></div><button type="button" class="icon-btn" id="closeAppointmentPicker">×</button></div><div class="service-option-list"><button type="button" class="service-option" data-service="MAPA de presión arterial"><span>🩸</span><div><b>MAPA de presión arterial</b><small>Colocación y control</small></div></button><button type="button" class="service-option" data-service="Holter de ritmo"><span>💓</span><div><b>Holter de ritmo</b><small>Colocación y control</small></div></button><button type="button" class="service-option" data-service="Control"><span>📋</span><div><b>Control</b><small>Seguimiento</small></div></button><button type="button" class="service-option" data-service="Otro"><span>🗂️</span><div><b>Otro</b><small>Otro servicio</small></div></button></div></div>`;
  }
  overlay.innerHTML=content;
  $('#modal').appendChild(overlay);
  $('#closeAppointmentPicker').onclick=()=>overlay.remove();
  overlay.addEventListener('click',e=>{
    if(e.target===overlay){overlay.remove();return}
    const option=e.target.closest('.service-option');if(!option)return;
    const hidden=$('#apType');if(hidden)hidden.value=option.dataset.service||'';
    refreshAppointmentServiceLabel();overlay.remove();
  });
}
function appointmentFormHtml(a={},prefillPatientId=''){
  const start=a.startAt?new Date(a.startAt):new Date();const defaultDate=a.startAt?dateKeyLocal(start):dateKeyLocal(state.agendaDate);const defaultTime=a.startAt?`${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}`:'09:00';
  const p=prefillPatientId?(patientById(prefillPatientId)||{}):(a.patientId?(patientById(a.patientId)||{}):{});
  const currentType=a.type||'';
  return `<div class="appointment-patient-copy"><div class="appointment-patient-head"><div><b>Paciente</b><span>Selecciona un paciente existente para copiar sus datos automáticamente, o completa los campos para crear uno nuevo.</span></div></div><label>Paciente existente<select id="apPatient" class="appointment-patient-select"><option value="">Nuevo paciente / copiar datos manualmente…</option></select></label><div class="form-grid appointment-patient-fields"><label>Nombre<input id="apFirstName" placeholder="Nombre"></label><label>Apellido<input id="apLastName" placeholder="Apellido"></label><label>Fecha de nacimiento<input id="apBirthDate" type="date"></label><label>Cédula / ID<input id="apPatientId" placeholder="Identificación"></label><label>Sexo<select id="apSex"><option value="">Seleccionar</option><option>Femenino</option><option>Masculino</option><option>Otro</option></select></label><label>Teléfono<input id="apPhone" placeholder="Teléfono"></label><label>Correo<input id="apEmail" type="email" placeholder="correo@ejemplo.com"></label><label class="full">Dirección<input id="apAddress" placeholder="Dirección"></label></div></div><div class="appointment-service-card"><div><b>Tipo de atención</b><span id="apServiceLabel">${esc(appointmentTypeLabel(currentType))}</span></div><input id="apType" type="hidden" value="${esc(currentType)}"><div class="appointment-service-actions"><button type="button" class="btn secondary" id="pickAppointmentUltrasound">📡 Ecografía</button><button type="button" class="btn secondary" id="pickAppointmentConsult">🩺 Consulta</button><button type="button" class="btn secondary" id="pickAppointmentMapa">🩸 MAPA</button><button type="button" class="btn secondary" id="pickAppointmentHolter">💓 Holter</button><button type="button" class="btn ghost" id="pickAppointmentOther">Otros</button></div></div><div class="form-grid"><label>Fecha<input id="apDate" type="date" value="${defaultDate}"></label><label>Hora<input id="apTime" type="time" value="${defaultTime}"></label><label>Duración<select id="apDuration"><option value="15">15 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></select></label><label>Estado<select id="apStatus"><option value="pending">Pendiente</option><option value="confirmed">Confirmada</option><option value="attended">Atendida</option><option value="cancelled">Cancelada</option><option value="no-show">No asistió</option></select></label><label>Asistencia<select id="apAttendance"><option value="pending">Pendiente</option><option value="present">Se presentó</option><option value="cancelled">Canceló</option><option value="no-show">No asistió</option></select></label><label class="checkbox-inline"><input id="apPaid" type="checkbox"> Paciente pagó</label><label class="checkbox-inline"><input id="apNotified" type="checkbox"> Paciente avisado</label><label class="full">Motivo<input id="apReason" value="${esc(a.reason||'')}"></label><label class="full">Notas<textarea id="apNotes" rows="3">${esc(a.notes||'')}</textarea></label></div></div><div class="form-help">No existe un límite diario de citas. El sistema solo evita que dos citas activas se crucen exactamente en el mismo intervalo.</div>`;
}
async function checkAppointmentConflict(startIso,endIso,excludeId=null){
  const start=new Date(startIso),end=new Date(endIso);
  return state.appointments.some(a=>String(a.id)!==String(excludeId)&&a.status!=='cancelled'&&new Date(a.startAt)<end&&new Date(a.endAt)>start);
}
function bindAppointmentPatientFields(){
  $('#apPatient')?.addEventListener('change',()=>{
    const p=patientById($('#apPatient').value||'');fillAppointmentPatientFields(p||{});
  });
  $('#pickAppointmentUltrasound')?.addEventListener('click',()=>openAppointmentServicePicker('ecografia'));
  $('#pickAppointmentConsult')?.addEventListener('click',()=>openAppointmentServicePicker('consulta'));
  $('#pickAppointmentMapa')?.addEventListener('click',()=>{const h=$('#apType');if(h)h.value='MAPA de presión arterial';refreshAppointmentServiceLabel()});
  $('#pickAppointmentHolter')?.addEventListener('click',()=>{const h=$('#apType');if(h)h.value='Holter de ritmo';refreshAppointmentServiceLabel()});
  $('#pickAppointmentOther')?.addEventListener('click',()=>openAppointmentServicePicker('otro'));
}
function openAppointmentModal(existing=null,prefillPatientId=''){
  openModal(existing?'Editar cita':'Nueva cita',`${appointmentFormHtml(existing||{},prefillPatientId)}<div class="quick-actions"><button class="btn primary" id="saveAppointmentModal">${existing?'Guardar cambios':'Guardar cita'}</button>${existing?'<button class="btn danger ghost" id="deleteAppointmentModal">Eliminar cita</button>':''}</div>`);
  refreshPatientSelectors();
  $('#apPatient').value=existing?.patientId||prefillPatientId||'';
  fillAppointmentPatientFields(existing?.patientId?patientById(existing.patientId)||{}:(prefillPatientId?patientById(prefillPatientId)||{}:{}));
  bindAppointmentPatientFields();
  refreshAppointmentServiceLabel();
  if(existing){$('#apStatus').value=existing.status||'pending';$('#apAttendance').value=existing.attendanceStatus||'pending';$('#apPaid').checked=!!existing.paid;$('#apNotified').checked=!!existing.patientNotified;}
  $('#saveAppointmentModal').onclick=()=>saveAppointmentModal(existing?.id||null);
  if(existing)$('#deleteAppointmentModal').onclick=()=>deleteAppointment(existing.id);
}
async function ensureAppointmentPatient(){
  const selectedId=$('#apPatient').value||'';
  const p=appointmentPatientFromForm();
  if(!p.firstName||!p.lastName)throw new Error('Completa nombre y apellido del paciente.');
  if(selectedId){
    const {data,error}=await supabaseClient.from('patients').update({first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,patient_identifier:p.patientId||null,sex:p.sex||null,phone:p.phone||null,email:p.email||null,address:p.address||null,updated_at:new Date().toISOString()}).eq('id',selectedId).eq('clinic_id',state.clinicId).select('id').single();
    if(error)throw error;return data.id;
  }
  if(p.patientId){
    const {data:existing,error:qerr}=await supabaseClient.from('patients').select('id').eq('clinic_id',state.clinicId).eq('patient_identifier',p.patientId).maybeSingle();
    if(qerr)throw qerr;
    if(existing){const {data,error}=await supabaseClient.from('patients').update({first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,sex:p.sex||null,phone:p.phone||null,email:p.email||null,address:p.address||null,updated_at:new Date().toISOString()}).eq('id',existing.id).select('id').single();if(error)throw error;return data.id;}
  }
  const {data,error}=await supabaseClient.from('patients').insert({clinic_id:state.clinicId,first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,patient_identifier:p.patientId||null,sex:p.sex||null,phone:p.phone||null,email:p.email||null,address:p.address||null}).select('id').single();
  if(error)throw error;return data.id;
}
async function saveAppointmentModal(id=null){
  const btn=$('#saveAppointmentModal');const date=$('#apDate').value,time=$('#apTime').value;if(!date||!time){toast('Completa fecha y hora.');return}
  const type=$('#apType').value.trim();if(!type){toast('Selecciona si es ecografía, consulta u otro tipo de atención.');return}
  if(!requireConnection()||!requireSession()||!state.clinicId){return}
  const start=new Date(`${date}T${time}:00`);if(Number.isNaN(start.getTime())){toast('Fecha u hora no válidas.');return}
  const duration=Number($('#apDuration').value||30);const end=new Date(start.getTime()+duration*60000);
  const startIso=start.toISOString(),endIso=end.toISOString();
  if(await checkAppointmentConflict(startIso,endIso,id)){toast('Ya existe una cita que se cruza con ese horario. Puedes elegir otro horario.');return}
  try{
    if(btn){btn.disabled=true;btn.textContent=id?'Guardando…':'Creando…';}
    const patientId=await ensureAppointmentPatient();
    const payload={clinic_id:state.clinicId,patient_id:patientId,professional_id:null,start_at:startIso,end_at:endIso,appointment_type:type,status:$('#apStatus').value,attendance_status:$('#apAttendance')?.value||'pending',paid:!!$('#apPaid')?.checked,patient_notified:!!$('#apNotified')?.checked,reason:$('#apReason').value.trim()||null,notes:$('#apNotes').value.trim()||null,updated_at:new Date().toISOString()};
    let result;if(id){result=await supabaseClient.from('appointments').update(payload).eq('id',id).eq('clinic_id',state.clinicId).select('id').single();}else{result=await supabaseClient.from('appointments').insert({...payload,created_by:currentUser.id}).select('id').single();}
    if(result.error)throw result.error;if(!result.data?.id&&!id)throw new Error('Supabase no devolvió la cita creada.');
    state.agendaDate=new Date(start.getFullYear(),start.getMonth(),start.getDate());closeModal();await loadPatients();await loadAppointments();renderTodayUltrasoundAppointments();toast(id?'Cita actualizada.':'Cita creada.');checkUpcomingAppointments(true);
  }catch(e){console.error('EcoReport appointment save:',e);toast('No se pudo guardar la cita: '+(e?.message||e));if(btn){btn.disabled=false;btn.textContent=id?'Guardar cambios':'Guardar cita';}}
}
window.quickAppointment=key=>{state.agendaDate=new Date(`${key}T12:00:00`);openAppointmentModal(null)};
window.editAppointment=id=>{const a=state.appointments.find(x=>String(x.id)===String(id));if(a)openAppointmentModal(a)};
async function deleteAppointment(id){
  if(!confirm('¿Eliminar esta cita?'))return;
  try{const {error}=await supabaseClient.from('appointments').delete().eq('id',id).eq('clinic_id',state.clinicId);if(error)throw error;closeModal();await loadAppointments();toast('Cita eliminada.')}catch(e){toast('No se pudo eliminar la cita: '+(e?.message||e))}
}

const upcomingModalLastShown=new Map();
function showUpcomingAppointmentModal(rows){
  if(!rows.length||!$('#modal')?.classList.contains('hidden'))return;
  const content=rows.map(a=>{const p=patientById(a.patientId)||{firstName:'Paciente',lastName:''};const hours=((new Date(a.startAt).getTime()-Date.now())/3600000).toFixed(1);return `<div class="admin-list-item"><div><b>${esc(p.firstName+' '+p.lastName)}</b><small>${esc(a.type)} · ${esc(formatTimeLocal(a.startAt))} · faltan ${esc(hours)} h</small></div><span>${a.paid?'💳 Pagado':'⏳ Pago'}</span></div>`}).join('');
  openModal('🔔 Aviso de próxima cita',`<p class="form-help">Hay citas programadas entre 4 y 6 horas a partir de este momento.</p><div class="admin-list">${content}</div><div class="quick-actions"><button class="btn primary" id="closeUpcomingNotice">Entendido</button><button class="btn secondary" id="openAgendaFromNotice">Abrir agenda</button></div>`);
  $('#closeUpcomingNotice').onclick=closeModal;$('#openAgendaFromNotice').onclick=()=>{closeModal();void navigateToSection('agenda')};
}
function checkUpcomingAppointments(force=false){
  const now=Date.now(),min=4*3600000,max=6*3600000,repeat=15*60000;
  const rows=state.appointments.filter(a=>!['cancelled','attended','no-show'].includes(a.status)).filter(a=>{const delta=new Date(a.startAt).getTime()-now;return delta>=min&&delta<=max});
  const due=rows.filter(a=>{const last=upcomingModalLastShown.get(String(a.id))||0;return force||now-last>=repeat});
  if(!due.length)return;
  due.forEach(a=>upcomingModalLastShown.set(String(a.id),now));
  showUpcomingAppointmentModal(due.slice(0,8));
}
function requestBrowserNotifications(){/* EcoReport usa notificaciones modales dentro de la plataforma. */}
function prescriptionPatient(sourceType){
  if(sourceType==='consultation'){
    const c=consultationById(state.currentConsultationId)||{};
    const p=patientById(c.patientId)||{};
    return {firstName:p.firstName||'',lastName:p.lastName||'',patientId:p.patientId||'',birthDate:p.birthDate||'',sex:p.sex||'',phone:p.phone||'',email:p.email||''};
  }
  const p=patient();
  return {firstName:p.firstName||'',lastName:p.lastName||'',patientId:p.patientId||'',birthDate:p.birthDate||'',sex:p.sex||''};
}
function prescriptionProfessional(sourceType){
  if(sourceType==='consultation')return consultationProfessionalName(consultationById(state.currentConsultationId)||{});
  return state.settings.doctorName||'Ecografista';
}
function prescriptionSpecialty(sourceType){
  if(sourceType==='consultation'){const c=consultationById(state.currentConsultationId);return specialtyById(c?.specialtyId)?.name||'';}
  return 'Ecografía';
}
function prescriptionRowHtml(i,item={}){return `<div class="prescription-row" data-prescription-row="${i}"><div class="prescription-row-head"><b>Medicamento / indicación ${i+1}</b><button type="button" class="btn danger ghost" onclick="removePrescriptionRow(${i})">Eliminar</button></div><div class="prescription-row-grid"><label class="full">Medicamento<input id="rxMedication${i}" value="${esc(item.medication||'')}" placeholder="Nombre del medicamento"></label><label>Presentación<input id="rxPresentation${i}" value="${esc(item.presentation||'')}" placeholder="Tabletas, jarabe…"></label><label>Concentración<input id="rxStrength${i}" value="${esc(item.strength||'')}" placeholder="Ej. 500 mg"></label><label>Dosis<input id="rxDose${i}" value="${esc(item.dose||'')}" placeholder="Dosis indicada"></label><label>Vía<input id="rxRoute${i}" value="${esc(item.route||'')}" placeholder="Oral, tópica…"></label><label>Frecuencia<input id="rxFrequency${i}" value="${esc(item.frequency||'')}" placeholder="Según indicación"></label><label>Duración<input id="rxDuration${i}" value="${esc(item.duration||'')}" placeholder="Duración"></label><label>Cantidad<input id="rxQuantity${i}" value="${esc(item.quantity||'')}" placeholder="Cantidad"></label><label class="full">Indicaciones específicas<textarea id="rxInstructions${i}" rows="2" placeholder="Indicaciones redactadas por el profesional">${esc(item.instructions||'')}</textarea></label></div></div>`}
function collectPrescriptionItems(){return state.prescriptionItems.map((_,i)=>({medication:$(`#rxMedication${i}`)?.value.trim()||'',presentation:$(`#rxPresentation${i}`)?.value.trim()||'',strength:$(`#rxStrength${i}`)?.value.trim()||'',dose:$(`#rxDose${i}`)?.value.trim()||'',route:$(`#rxRoute${i}`)?.value.trim()||'',frequency:$(`#rxFrequency${i}`)?.value.trim()||'',duration:$(`#rxDuration${i}`)?.value.trim()||'',quantity:$(`#rxQuantity${i}`)?.value.trim()||'',instructions:$(`#rxInstructions${i}`)?.value.trim()||''})).filter(x=>x.medication||x.instructions)}
function renderPrescriptionRows(){const box=$('#prescriptionRows');if(!box)return;box.innerHTML=state.prescriptionItems.map((x,i)=>prescriptionRowHtml(i,x)).join('');}
window.removePrescriptionRow=i=>{state.prescriptionItems.splice(i,1);if(!state.prescriptionItems.length)state.prescriptionItems=[{}];renderPrescriptionRows()};
function addPrescriptionRow(){state.prescriptionItems.push({});renderPrescriptionRows();}
function prescriptionModalHtml(sourceType){const p=prescriptionPatient(sourceType);return `<div class="prescription-disclaimer">La receta es editable y debe ser revisada y firmada por el profesional antes de su uso. EcoReport no sugiere tratamientos ni medicamentos automáticamente.</div><div class="form-grid" style="margin-top:12px"><label>Paciente<input id="rxPatientName" value="${esc(`${p.firstName||''} ${p.lastName||''}`.trim())}" readonly></label><label>Identificación<input id="rxPatientId" value="${esc(p.patientId||'')}" readonly></label><label>Fecha<input id="rxDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Profesional<input id="rxProfessional" value="${esc(prescriptionProfessional(sourceType))}"></label><label class="full">Especialidad / servicio<input id="rxSpecialty" value="${esc(prescriptionSpecialty(sourceType))}"></label><label class="full">Indicaciones generales<textarea id="rxGeneralNotes" rows="3" placeholder="Indicaciones generales redactadas por el profesional."></textarea></label></div><div class="card-divider"></div><div class="card-head"><div><h3>Medicamentos / indicaciones</h3><p>Agrega cada indicación de forma independiente.</p></div><button type="button" class="btn secondary" id="addPrescriptionItem">＋ Agregar</button></div><div id="prescriptionRows" class="prescription-items"></div>`}
async function openPrescriptionComposer(sourceType){
  if(!requireConnection()||!requireSession())return;
  try{
    if(sourceType==='consultation'){
      if(!state.currentConsultationId){
        await saveConsultation();
        if(!state.currentConsultationId)return;
      }
      const c=consultationById(state.currentConsultationId);
      if(!c){toast('No se encontró la consulta.');return}
      if(c.specialtyId&&!state.specialtySessionAccess.has(String(c.specialtyId))){toast('Autoriza primero la especialidad.');return}
    }
    if(sourceType==='report'&&!state.currentRemoteReportId){
      await ensureRemoteReport();
      await loadRemoteHistory();
      if(!state.currentRemoteReportId)return;
    }
    state.prescriptionSource=sourceType;
    state.prescriptionItems=[{}];
    const savedFormat=localStorage.getItem('ecoreport.prescriptionFormat')||state.prescriptionFormat||'a6';
    state.prescriptionFormat=savedFormat;
    openModal('Receta médica',`${prescriptionModalHtml(sourceType)}<div class="card-divider"></div><div class="prescription-format-box"><div><b>Formato de impresión</b><small>Selecciona el tamaño del papel que usará el profesional.</small></div><div class="prescription-format-grid"><label>Tamaño<select id="rxPaperFormat"><option value="a6">Pequeña · A6 vertical (105 × 148 mm)</option><option value="a6-landscape">Pequeña · A6 horizontal (148 × 105 mm)</option><option value="a5">A5 vertical (148 × 210 mm)</option><option value="a4">A4 vertical (210 × 297 mm)</option><option value="custom">Personalizado</option></select></label><label id="rxCustomWidthWrap" class="hidden-panel">Ancho (mm)<input id="rxPaperWidth" type="number" min=70 max=500 step=1 value=105></label><label id="rxCustomHeightWrap" class="hidden-panel">Alto (mm)<input id="rxPaperHeight" type="number" min=70 max=500 step=1 value=148></label></div><p id="rxFormatHint" class="editor-hint"></p></div><div class="quick-actions"><button type="button" class="btn secondary" id="savePrescription">Guardar receta</button><button type="button" class="btn primary" id="downloadPrescription">Descargar receta</button><button type="button" class="btn ghost" id="cancelPrescription">Cancelar</button></div>`);
    renderPrescriptionRows();
    const fmt=$('#rxPaperFormat');
    const w=$('#rxPaperWidth'),h=$('#rxPaperHeight');
    if(fmt)fmt.value=savedFormat;
    const syncFormat=()=>{
      state.prescriptionFormat=fmt?.value||'a6';
      localStorage.setItem('ecoreport.prescriptionFormat',state.prescriptionFormat);
      const custom=state.prescriptionFormat==='custom';
      $('#rxCustomWidthWrap')?.classList.toggle('hidden-panel',!custom);
      $('#rxCustomHeightWrap')?.classList.toggle('hidden-panel',!custom);
      const hint=$('#rxFormatHint');
      if(hint)hint.textContent=custom?'El tamaño personalizado se guardará para esta impresión.':'El PDF se adaptará automáticamente al tamaño seleccionado.';
    };
    fmt?.addEventListener('change',syncFormat);
    syncFormat();
    $('#addPrescriptionItem').onclick=addPrescriptionRow;
    $('#cancelPrescription').onclick=closeModal;
    $('#savePrescription').onclick=()=>savePrescription(false);
    $('#downloadPrescription').onclick=()=>savePrescription(true);
  }catch(e){
    console.error('EcoReport open prescription:',e);
    toast('No se pudo abrir la receta: '+(e?.message||e));
  }
}
async function savePrescription(downloadNow=false){
  const sourceType=state.prescriptionSource;const items=collectPrescriptionItems();if(!items.length){toast('Agrega al menos una indicación o medicamento.');return}
  if(!requireConnection()||!requireSession()||!state.clinicId)return;
  const btn=downloadNow?$('#downloadPrescription'):$('#savePrescription');try{if(btn){btn.disabled=true;btn.textContent=downloadNow?'Generando…':'Guardando…'}
    const c=sourceType==='consultation'?consultationById(state.currentConsultationId):null;const reportId=sourceType==='report'?state.currentRemoteReportId:null;
    const specialtyId=c?.specialtyId||null;const professionalId=c?.professionalId||null;
    const format=getPrescriptionFormatFromModal();
    const payload={clinic_id:state.clinicId,patient_id:sourceType==='consultation'?c.patientId:await ensurePatient(patient()) ,consultation_id:c?.id||null,report_id:reportId||null,professional_id:professionalId,specialty_id:specialtyId,issued_at:new Date($('#rxDate').value+'T12:00:00').toISOString(),professional_name:$('#rxProfessional').value.trim()||null,specialty_name:$('#rxSpecialty').value.trim()||null,general_notes:$('#rxGeneralNotes').value.trim()||null,paper_format:format.code,page_width_mm:format.width,page_height_mm:format.height,status:'active',updated_at:new Date().toISOString()};
    let pr;const id=$('#rxExistingId')?.value||'';if(id){pr=await supabaseClient.from('prescriptions').update(payload).eq('id',id).eq('clinic_id',state.clinicId).select('id').single()}else{pr=await supabaseClient.from('prescriptions').insert({...payload,created_by:currentUser.id}).select('id').single()}
    if(pr.error)throw pr.error;const prescriptionId=pr.data.id;
    const del=await supabaseClient.from('prescription_items').delete().eq('prescription_id',prescriptionId);
    if(del.error)throw del.error;
    const rows=items.map((item,i)=>({...item,prescription_id:prescriptionId,sort_order:i}));const ins=await supabaseClient.from('prescription_items').insert(rows);if(ins.error)throw ins.error;
    const prescription={...payload,id:prescriptionId,items,sourceType};state.prescriptionItems=items;
    if(downloadNow){const result=await uploadPrescriptionPdf(prescription);const url=URL.createObjectURL(result.blob);const p=prescriptionPatient(sourceType);const a=document.createElement('a');a.href=url;a.download=`Receta_${p.lastName||'Paciente'}_${p.firstName||''}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('Receta guardada y descargada.');}
    else toast('Receta guardada correctamente.');
    closeModal();
  }catch(e){console.error('EcoReport prescription:',e);toast('No se pudo guardar la receta: '+(e?.message||e));if(btn){btn.disabled=false;btn.textContent=downloadNow?'Descargar receta':'Guardar receta'}}
}
async function uploadPrescriptionPdf(rx){const blob=await buildPrescriptionPdfBlob(rx);const path=`${state.clinicId}/prescriptions/${rx.id}.pdf`;const up=await supabaseClient.storage.from(cfg.STORAGE_BUCKET||'reports').upload(path,blob,{contentType:'application/pdf',upsert:true,cacheControl:'3600'});if(up.error)throw up.error;const r=await supabaseClient.from('prescriptions').update({pdf_storage_path:path,updated_at:new Date().toISOString()}).eq('id',rx.id).eq('clinic_id',state.clinicId);if(r.error)throw r.error;return {blob,path}}
function getPrescriptionFormatFromModal(){
  const code=$('#rxPaperFormat')?.value||state.prescriptionFormat||'a6';
  const presets={
    a6:{code:'a6',width:105,height:148,label:'A6 vertical'},
    'a6-landscape':{code:'a6-landscape',width:148,height:105,label:'A6 horizontal'},
    a5:{code:'a5',width:148,height:210,label:'A5 vertical'},
    a4:{code:'a4',width:210,height:297,label:'A4 vertical'}
  };
  if(presets[code])return presets[code];
  const width=Math.max(70,Math.min(500,Number($('#rxPaperWidth')?.value)||105));
  const height=Math.max(70,Math.min(500,Number($('#rxPaperHeight')?.value)||148));
  return {code:'custom',width,height,label:`Personalizado ${width} × ${height} mm`};
}
function prescriptionFormatFromRecord(rx){
  const code=rx.paper_format||state.prescriptionFormat||'a6';
  const presets={a6:[105,148], 'a6-landscape':[148,105], a5:[148,210], a4:[210,297]};
  if(rx.page_width_mm&&rx.page_height_mm)return {code,width:Number(rx.page_width_mm),height:Number(rx.page_height_mm),label:code};
  const pair=presets[code]||presets.a6;return {code,width:pair[0],height:pair[1],label:code};
}
function drawPrescriptionPageHeader(doc,rx,p,format){
  const s=state.settings,left=8,right=format.width-8,small=format.width<190;
  doc.setFillColor(255,255,255);doc.rect(0,0,format.width,format.height,'F');
  if(format.code==='a4'){
    try{
      return pdfLetterheadImage().then(img=>{if(img)doc.addImage(img,'JPEG',0,0,format.width,format.height);return true;}).catch(()=>false);
    }catch(e){}
  }
  doc.setFont('helvetica','bold');doc.setFontSize(small?11:13);doc.setTextColor(22,42,65);doc.text(s.clinicName||'EcoReport Pro',left,10);
  doc.setFont('helvetica','normal');doc.setFontSize(small?6.5:7.5);doc.setTextColor(96,112,133);
  const sub=[s.clinicAddress,s.clinicPhone].filter(Boolean).join(' · ');
  if(sub)doc.text(sub,left,15);
  doc.setDrawColor(205,216,228);doc.setLineWidth(.5);doc.line(left,20,right,20);
  return Promise.resolve(false);
}
function drawPrescriptionFooter(doc,format){
  const left=8,right=format.width-8,s=state.settings;
  doc.setDrawColor(218,226,235);doc.setLineWidth(.35);doc.line(left,format.height-7,right,format.height-7);
  doc.setFont('helvetica','normal');doc.setFontSize(5.6);doc.setTextColor(120,132,147);doc.text(s.clinicName||'EcoReport Pro',left,format.height-3);
}
function drawPrescriptionSignature(doc,rx,format){
  const left=8,compact=format.height<180;
  const sigHeight=compact?15:20, sigWidth=38;
  const y=format.height-(compact?31:40);
  if(state.signature?.startsWith('data:image')){try{doc.addImage(state.signature,'PNG',left,y,sigWidth,sigHeight)}catch(e){}}
  doc.setFont('helvetica','bold');doc.setFontSize(compact?6.8:8);doc.setTextColor(39,53,70);doc.text(rx.professional_name||prescriptionProfessional(rx.sourceType||state.prescriptionSource)||'Profesional',left,y+sigHeight+3);
  doc.setFont('helvetica','normal');doc.setFontSize(compact?5.8:6.5);doc.setTextColor(120,132,147);doc.text('Firma',left,y+sigHeight+7);
  drawPrescriptionFooter(doc,format);
}
async function buildPrescriptionPdfBlob(rx){
  const {jsPDF}=window.jspdf,p=prescriptionPatient(rx.sourceType||state.prescriptionSource)||{};
  const format=prescriptionFormatFromRecord(rx);
  const orientation=format.width>=format.height?'landscape':'portrait';
  const doc=new jsPDF({unit:'mm',format:[format.width,format.height],orientation,compress:true});
  const left=8,right=format.width-8,compact=format.height<180;
  const fontBody=compact?7.2:(format.height<230?8:8.5);
  await drawPrescriptionPageHeader(doc,rx,p,format);
  let y=format.code==='a4'?58:27;
  doc.setFont('helvetica','bold');doc.setFontSize(compact?10:12);doc.setTextColor(24,44,70);doc.text('RECETA MÉDICA',left,y);
  doc.setFont('helvetica','normal');doc.setFontSize(compact?6.4:7.5);doc.setTextColor(112,128,150);doc.text(new Date(rx.issued_at).toLocaleDateString('es-ES'),right,y,{align:'right'});
  y+=6;
  doc.setFillColor(250,252,255);doc.setDrawColor(218,226,235);
  const patientBoxH=compact?25:30;doc.roundedRect(left,y,right-left,patientBoxH,2.2,2.2,'FD');
  doc.setFont('helvetica','bold');doc.setFontSize(compact?5.8:6.5);doc.setTextColor(126,140,158);doc.text('PACIENTE',left+4,y+6);
  doc.setFontSize(compact?8:9);doc.setTextColor(29,43,61);doc.text(`${p.firstName||'Paciente'} ${p.lastName||''}`.trim(),left+28,y+6);
  doc.setFontSize(compact?5.8:6.5);doc.setTextColor(126,140,158);doc.text('ID',left+4,y+14);
  doc.setFontSize(compact?7:8);doc.setTextColor(29,43,61);doc.text(p.patientId||'—',left+14,y+14);
  doc.setFontSize(compact?5.8:6.5);doc.setTextColor(126,140,158);doc.text('PROFESIONAL',left+Math.min(68,(right-left)*.48),y+14);
  doc.setFontSize(compact?7:8);doc.setTextColor(29,43,61);doc.text(rx.professional_name||prescriptionProfessional(rx.sourceType||state.prescriptionSource)||'Profesional',left+Math.min(96,(right-left)*.68),y+14);
  if(!compact){
    doc.setFontSize(6.5);doc.setTextColor(126,140,158);doc.text('ESPECIALIDAD',left+88,y+23);
    doc.setFontSize(8);doc.setTextColor(29,43,61);doc.text(rx.specialty_name||prescriptionSpecialty(rx.sourceType||state.prescriptionSource)||'—',left+118,y+23);
  }
  y+=patientBoxH+7;
  doc.setFont('helvetica','bold');doc.setFontSize(compact?6.8:8);doc.setTextColor(23,87,160);doc.text('INDICACIONES / PRESCRIPCIÓN',left,y);y+=5;
  const addPage=async()=>{drawPrescriptionFooter(doc,format);doc.addPage();await drawPrescriptionPageHeader(doc,rx,p,format);y=format.code==='a4'?58:27;};
  const bottomReserve=compact?33:(format.height<230?39:48);
  for(let i=0;i<rx.items.length;i++){
    const it=rx.items[i];
    const meta=[it.presentation,it.strength,it.dose,it.route,it.frequency,it.duration,it.quantity].filter(Boolean).join(' · ');
    const titleLines=doc.splitTextToSize(`${i+1}. ${it.medication||'Indicación'}`,right-left);
    const metaLines=meta?doc.splitTextToSize(meta,right-left):[];
    const instLines=it.instructions?doc.splitTextToSize(`Indicaciones: ${it.instructions}`,right-left):[];
    const needed=titleLines.length*4.2+metaLines.length*3.9+instLines.length*3.9+5;
    if(y+needed>format.height-bottomReserve)await addPage();
    doc.setFont('helvetica','bold');doc.setFontSize(compact?7.8:9);doc.setTextColor(29,43,61);
    for(const ln of titleLines){doc.text(ln,left,y);y+=4.2;}
    doc.setFont('helvetica','normal');doc.setFontSize(fontBody);doc.setTextColor(47,58,72);
    for(const ln of metaLines){doc.text(ln,left,y);y+=3.9;}
    if(instLines.length){doc.setFont('helvetica','italic');for(const ln of instLines){if(y+4>format.height-bottomReserve)await addPage();doc.text(ln,left,y);y+=3.9;}}
    y+=2.7;
    doc.setDrawColor(233,237,242);doc.setLineWidth(.25);doc.line(left,y,right,y);y+=3.5;
  }
  if(rx.general_notes){
    if(y+10>format.height-bottomReserve)await addPage();
    doc.setFont('helvetica','bold');doc.setFontSize(compact?6.8:8);doc.setTextColor(23,87,160);doc.text('INDICACIONES GENERALES',left,y);y+=5;
    doc.setFont('helvetica','normal');doc.setFontSize(fontBody);doc.setTextColor(47,58,72);
    for(const ln of doc.splitTextToSize(rx.general_notes,right-left)){if(y+4>format.height-bottomReserve)await addPage();doc.text(ln,left,y);y+=3.9;}
  }
  drawPrescriptionSignature(doc,rx,format);
  return doc.output('blob');
}


// Extend init behavior without changing V5.4 features.
const __ecoInit=init;
init=function(){
  __ecoInit();
  requestBrowserNotifications();
  renderAgenda();renderConsultations();clearConsultationForm();renderTodayUltrasoundAppointments();renderUnifiedHistory();
  setInterval(()=>{if(currentUser){checkUpcomingAppointments(false);checkOverdueAppointmentsModal(false)}},60000);
};

function openModal(title,body){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden')}
$('#closeModal').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

init();
