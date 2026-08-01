<?php
// Cookie de sesión endurecida: HttpOnly + SameSite=Strict (SPEC 86).
session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict']);
session_start();

// Secrets (fiberlux-config.php subido por FTP, fuera del repo y de dist/ — SPEC 85/86)
$cfg = file_exists(__DIR__ . '/fiberlux-config.php') ? (require __DIR__ . '/fiberlux-config.php') : [];
if (!is_array($cfg)) $cfg = [];

$VALID_USER = $cfg['panel_user'] ?? '';
$PASS_HASH  = $cfg['panel_pass_hash'] ?? '';   // hash bcrypt; nunca en claro
$SUBMISSIONS_DIR = __DIR__ . '/data/submissions';
$PER_PAGE = 15;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    if ($_POST['action'] === 'login') {
        if ($VALID_USER === '' || $PASS_HASH === '') {
            // Credenciales no configuradas (falta fiberlux-config.php): nunca autenticar.
            echo json_encode(['success' => false, 'error' => 'Panel no configurado']);
            exit;
        }
        $user = $_POST['user'] ?? '';
        $pass = $_POST['pass'] ?? '';
        if (hash_equals($VALID_USER, $user) && password_verify($pass, $PASS_HASH)) {
            session_regenerate_id(true);   // evita fijación de sesión
            $_SESSION['panel_auth'] = true;
            $_SESSION['csrf'] = bin2hex(random_bytes(32));   // token para acciones destructivas
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Usuario o contraseña incorrectos']);
        }
        exit;
    }
    if ($_POST['action'] === 'logout') {
        unset($_SESSION['panel_auth']);
        echo json_encode(['success' => true]);
        exit;
    }
}

if (isset($_GET['export']) && $_GET['export'] === 'csv' && !empty($_SESSION['panel_auth'])) {
    $submissions = loadSubmissions($SUBMISSIONS_DIR);
    $type = $_GET['type'] ?? '';
    if ($type) $submissions = array_filter($submissions, fn($s) => $s['formType'] === $type);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="leads-' . date('Y-m-d') . ($type ? "-$type" : '') . '.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
    fputcsv($out, ['Correlativo','Tipo','Fecha','Nombre','Email/Celular','Empresa','RUC','Distrito','Servicio','Mensaje']);
    foreach ($submissions as $s) {
        $d = $s['data'] ?? [];
        $name = trim(($d['nombre'] ?? $d['nombreCompleto'] ?? '') . ' ' . ($d['apellido'] ?? ''));
        fputcsv($out, [$s['correlativo']??'',$s['formType']??'',$s['date']??'',
            $name,$d['email']??$d['correo']??$d['celular']??'',$d['empresa']??'',$d['ruc']??'',
            $d['distrito']??'',$d['servicio']??'',$d['mensaje']??'']);
    }
    fclose($out); exit;
}

$isLoggedIn = !empty($_SESSION['panel_auth']);
// Los datos SOLO se cargan y serializan con sesión válida: sin login, el HTML
// no lleva ningún lead (cierra la fuga por curl al panel — SPEC 86).
$submissions = $isLoggedIn ? loadSubmissions($SUBMISSIONS_DIR) : [];
$submissionsJson = json_encode($submissions, JSON_UNESCAPED_UNICODE);

function loadSubmissions($dir) {
    $subs = [];
    if (is_dir($dir)) {
        foreach (glob($dir.'/*.json') as $f) {
            $d = json_decode(file_get_contents($f), true);
            if ($d) $subs[] = $d;
        }
        usort($subs, fn($a,$b) => ($b['timestamp']??0) - ($a['timestamp']??0));
    }
    return $subs;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panel Leads — Fiberlux</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Poppins',sans-serif;background:#f5f2f4;background-image:radial-gradient(ellipse at 20% 0%,rgba(150,35,122,.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(118,134,188,.06) 0%,transparent 60%);color:#1a1a1a;min-height:100vh}
.login-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;transition:opacity .4s,visibility .4s}
.login-overlay.hidden{opacity:0;visibility:hidden;pointer-events:none}
.login-blur{position:absolute;inset:0;background:rgba(245,242,244,.85);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
.login-card{position:relative;z-index:1;background:rgba(255,255,255,.75);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(150,35,122,.1);border-radius:24px;padding:48px 40px;width:100%;max-width:400px;box-shadow:0 8px 32px rgba(150,35,122,.08)}
.login-card .logo{text-align:center;margin-bottom:32px}
.login-card .logo img{height:36px;margin-bottom:12px}
.login-card .logo p{font-size:12px;color:#999}
.login-card label{display:block;font-size:11px;font-weight:600;color:#96237A;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.login-card input{width:100%;padding:12px 16px;background:rgba(255,255,255,.6);border:1px solid #e8e1e5;border-radius:12px;color:#1a1a1a;font-size:14px;font-family:'Poppins',sans-serif;outline:none;transition:all .2s}
.login-card input:focus{border-color:#96237A;box-shadow:0 0 0 3px rgba(150,35,122,.08)}
.login-field{margin-bottom:20px}
.login-btn{width:100%;padding:14px;background:linear-gradient(135deg,#96237A,#7a1d65);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer;transition:all .2s;margin-top:8px;box-shadow:0 4px 16px rgba(150,35,122,.25)}
.login-btn:hover{transform:translateY(-1px)}
.login-error{color:#ef4444;font-size:12px;text-align:center;margin-top:12px;min-height:18px}
.header{background:rgba(255,255,255,.6);backdrop-filter:blur(16px);border-bottom:1px solid rgba(150,35,122,.06);padding:16px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.header-logo{height:32px}
.header-right{display:flex;align-items:center;gap:12px}
.header .badge{background:rgba(150,35,122,.1);color:#96237A;font-size:11px;padding:5px 14px;border-radius:20px;font-weight:600}
.logout-btn,.export-btn{background:none;border:1px solid #e0d8dd;color:#999;padding:6px 14px;border-radius:10px;font-size:11px;font-family:'Poppins',sans-serif;cursor:pointer;transition:all .2s;text-decoration:none}
.logout-btn:hover,.export-btn:hover{border-color:#96237A;color:#96237A}
.export-btn{border-color:#96237A;color:#96237A;font-weight:500}
.container{max-width:1100px;margin:0 auto;padding:32px 24px}
.stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.stat{background:rgba(255,255,255,.55);backdrop-filter:blur(12px);border:1px solid rgba(150,35,122,.06);border-radius:16px;padding:20px 24px;min-width:130px;flex:1;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.02)}
.stat:hover{border-color:rgba(150,35,122,.15)}
.stat .number{font-size:28px;font-weight:700;color:#1a1a1a}
.stat .label{font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;align-items:center}
.filters{display:flex;gap:8px;flex-wrap:wrap;flex:1}
.filters button{padding:7px 18px;border-radius:20px;font-size:12px;font-weight:500;font-family:'Poppins',sans-serif;cursor:pointer;transition:all .2s;border:none}
.filters button.active{background:linear-gradient(135deg,#96237A,#7a1d65);color:#fff;box-shadow:0 2px 8px rgba(150,35,122,.2)}
.filters button:not(.active){background:rgba(255,255,255,.5);color:#888;border:1px solid rgba(150,35,122,.08)}
.filters button:hover:not(.active){border-color:#96237A;color:#96237A}
.search-box{padding:8px 16px;border:1px solid rgba(150,35,122,.1);border-radius:12px;font-size:12px;font-family:'Poppins',sans-serif;outline:none;background:rgba(255,255,255,.5);min-width:200px;transition:border .2s}
.search-box:focus{border-color:#96237A}
.date-input{padding:7px 12px;border:1px solid rgba(150,35,122,.1);border-radius:12px;font-size:12px;font-family:'Poppins',sans-serif;outline:none;background:rgba(255,255,255,.5);transition:border .2s}
.date-input:focus{border-color:#96237A}
.table-wrap{background:rgba(255,255,255,.55);backdrop-filter:blur(12px);border-radius:16px;border:1px solid rgba(150,35,122,.06);overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.02)}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:rgba(150,35,122,.03);padding:14px 16px;text-align:left;color:#999;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid rgba(150,35,122,.06)}
td{padding:14px 16px;border-top:1px solid rgba(0,0,0,.03)}
tr{transition:background .15s;cursor:pointer}
tr:hover td{background:rgba(150,35,122,.02)}
.correlativo{color:#96237A;font-weight:600;font-size:12px}
.type-badge{display:inline-block;padding:3px 12px;border-radius:10px;font-size:10px;font-weight:600}
.type-badge.contacto{background:rgba(118,134,188,.12);color:#5a6aa0}
.type-badge.hero_contacto{background:rgba(150,35,122,.1);color:#96237A}
.type-badge.reclamo{background:rgba(220,50,50,.08);color:#c43c3c}
.type-badge.apelacion{background:rgba(200,150,20,.1);color:#a08010}
.type-badge.queja{background:rgba(220,120,30,.1);color:#b06820}
.type-badge.arco{background:rgba(34,160,80,.1);color:#1a8a48}
.type-badge.libro_reclamaciones{background:rgba(90,90,200,.1);color:#5a5ac8}
.contact-name{font-weight:500;color:#1a1a1a;font-size:13px}
.contact-email{font-size:11px;color:#999;margin-top:2px}
.date{color:#bbb;font-size:12px}
.view-link{color:#96237A;text-decoration:none;font-weight:500;font-size:12px;opacity:0;transition:opacity .15s}
tr:hover .view-link{opacity:1}
.detail{background:rgba(255,255,255,.6);backdrop-filter:blur(12px);border:1px solid rgba(150,35,122,.06);border-radius:20px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.02)}
.detail h2{font-size:18px;font-weight:600;color:#1a1a1a;margin-bottom:6px}
.detail .meta{font-size:12px;color:#999;margin-bottom:28px}
.detail .meta span{color:#96237A;font-weight:600}
.detail-row{display:grid;grid-template-columns:180px 1fr;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.04);gap:16px}
.detail-row:last-child{border-bottom:none}
.detail-label{color:#999;font-size:12px;font-weight:500}
.detail-value{color:#1a1a1a;font-size:13px;line-height:1.6;word-break:break-word}
.back-btn{display:inline-flex;align-items:center;gap:6px;color:#96237A;background:none;border:none;font-size:13px;font-weight:500;cursor:pointer;font-family:'Poppins',sans-serif;margin-bottom:24px;padding:0}
.back-btn:hover{text-decoration:underline}
.pagination{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:20px}
.pagination button{width:36px;height:36px;border-radius:10px;border:1px solid rgba(150,35,122,.1);background:rgba(255,255,255,.5);color:#888;font-family:'Poppins',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.pagination button.active{background:linear-gradient(135deg,#96237A,#7a1d65);color:#fff;border-color:transparent;box-shadow:0 2px 8px rgba(150,35,122,.2)}
.pagination button:hover:not(.active):not(:disabled){border-color:#96237A;color:#96237A}
.pagination button:disabled{opacity:.3;cursor:not-allowed}
.pagination .page-info{font-size:12px;color:#999;margin:0 8px}
@media(max-width:768px){.stats{flex-direction:column}.detail-row{grid-template-columns:1fr;gap:4px}td:nth-child(4),th:nth-child(4){display:none}.login-card{margin:16px;padding:36px 28px}.header{padding:14px 20px}.container{padding:24px 16px}.toolbar{flex-direction:column}.search-box{min-width:100%}}
</style>
</head>
<body>

<div class="login-overlay<?= $isLoggedIn ? ' hidden' : '' ?>" id="loginOverlay">
    <div class="login-blur"></div>
    <div class="login-card">
        <div class="logo">
            <img src="/images/logo/fiberlux.svg" alt="Fiberlux" onerror="this.style.display='none'">
            <p>Panel de leads</p>
        </div>
        <div class="login-field"><label>Usuario</label><input type="text" id="loginUser" placeholder="Usuario" autocomplete="off"></div>
        <div class="login-field"><label>Contraseña</label><input type="password" id="loginPass" placeholder="Contraseña" autocomplete="off"></div>
        <button class="login-btn" id="loginBtn">Ingresar</button>
        <div class="login-error" id="loginError"></div>
    </div>
</div>

<div class="header">
    <img src="/images/logo/fiberlux.svg" class="header-logo" alt="Fiberlux" onerror="this.outerHTML='<span style=\'font-size:16px;font-weight:700\'>FIBERLUX <span style=\'color:#96237A\'>Corporativo</span></span>'">
    <div class="header-right">
        <span class="badge" id="totalBadge"><?= count($submissions) ?> leads</span>
        <a href="?export=csv" class="export-btn" id="exportBtn">⬇ CSV</a>
        <button class="logout-btn" id="logoutBtn">Cerrar sesión</button>
    </div>
</div>

<div class="container">
    <div class="stats" id="statsBar"></div>
    <div class="toolbar">
        <div class="filters" id="filtersBar"></div>
        <input type="text" class="search-box" id="searchBox" placeholder="Buscar nombre, email, RUC...">
        <input type="date" class="date-input" id="dateFrom" title="Desde">
        <input type="date" class="date-input" id="dateTo" title="Hasta">
    </div>
    <div class="table-wrap" id="tableWrap">
        <table><thead><tr><th>Correlativo</th><th>Tipo</th><th>Contacto</th><th>Fecha</th><th></th></tr></thead><tbody id="tableBody"></tbody></table>
    </div>
    <div class="pagination" id="pagination"></div>
    <div id="detailView" style="display:none;"></div>
</div>

<script>
const submissions = <?= $submissionsJson ?>;
const CSRF = <?= $isLoggedIn ? json_encode($_SESSION['csrf'] ?? '') : "''" ?>;
const PER_PAGE = <?= $PER_PAGE ?>;
let currentFilter = '';
let searchQuery = '';
let dateFrom = '';
let dateTo = '';
let currentPage = 1;

// Auth
document.getElementById('loginBtn').addEventListener('click', async () => {
    const u=document.getElementById('loginUser').value.trim(), p=document.getElementById('loginPass').value.trim();
    const fd=new FormData(); fd.append('action','login'); fd.append('user',u); fd.append('pass',p);
    const res=await fetch('',{method:'POST',body:fd}); const data=await res.json();
    if(data.success){location.reload();}
    else{document.getElementById('loginError').textContent=data.error;document.getElementById('loginPass').value='';}
});
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('loginBtn').click();});
document.getElementById('loginUser').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('loginPass').focus();});
document.getElementById('logoutBtn').addEventListener('click',async()=>{
    const fd=new FormData();fd.append('action','logout');await fetch('',{method:'POST',body:fd});
    document.getElementById('loginOverlay').classList.remove('hidden');
});

// Stats
const counts={};submissions.forEach(s=>{counts[s.formType]=(counts[s.formType]||0)+1;});
document.getElementById('statsBar').innerHTML=
    `<div class="stat"><div class="number">${submissions.length}</div><div class="label">Total</div></div>`+
    Object.entries(counts).map(([t,c])=>`<div class="stat"><div class="number">${c}</div><div class="label">${t.replace('_',' ')}</div></div>`).join('');

// Filters
document.getElementById('filtersBar').innerHTML=
    `<button class="active" data-type="">Todos</button>`+
    Object.keys(counts).map(t=>`<button data-type="${t}">${t.replace('_',' ')}</button>`).join('');
document.getElementById('filtersBar').addEventListener('click',e=>{
    if(e.target.tagName!=='BUTTON')return;
    currentFilter=e.target.dataset.type||'';currentPage=1;
    document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById('exportBtn').href='?export=csv'+(currentFilter?'&type='+currentFilter:'');
    renderTable();
});

document.getElementById('searchBox').addEventListener('input',e=>{searchQuery=e.target.value.toLowerCase();currentPage=1;renderTable();});
document.getElementById('dateFrom').addEventListener('change',e=>{dateFrom=e.target.value;currentPage=1;renderTable();});
document.getElementById('dateTo').addEventListener('change',e=>{dateTo=e.target.value;currentPage=1;renderTable();});

function getFiltered(){
    return submissions.filter(s=>{
        if(currentFilter&&s.formType!==currentFilter)return false;
        if(searchQuery){const d=s.data||{};const h=[d.nombre,d.apellido,d.nombreCompleto,d.email,d.correo,d.celular,d.ruc,d.empresa,s.correlativo].filter(Boolean).join(' ').toLowerCase();if(!h.includes(searchQuery))return false;}
        if(dateFrom&&(s.date||'')<dateFrom)return false;
        if(dateTo&&(s.date||'').slice(0,10)>dateTo)return false;
        return true;
    });
}

function renderTable(){
    const all=getFiltered();
    const totalPages=Math.max(1,Math.ceil(all.length/PER_PAGE));
    if(currentPage>totalPages)currentPage=totalPages;
    const start=(currentPage-1)*PER_PAGE;
    const page=all.slice(start,start+PER_PAGE);

    document.getElementById('detailView').style.display='none';
    document.getElementById('tableWrap').style.display='block';
    document.getElementById('pagination').style.display='flex';

    const tb=document.getElementById('tableBody');
    if(!page.length){tb.innerHTML='<tr><td colspan="5" style="text-align:center;padding:60px;color:#ccc">Sin resultados</td></tr>';document.getElementById('pagination').innerHTML='';return;}

    tb.innerHTML=page.map(s=>{
        const d=s.data||{};let nm=d.nombre||d.nombreCompleto||d.ruc||'-';if(d.apellido)nm+=' '+d.apellido;
        const em=d.email||d.correo||d.celular||'-';
        return `<tr onclick="showDetail('${s.correlativo}')">
            <td><span class="correlativo">${s.correlativo}</span></td>
            <td><span class="type-badge ${s.formType}">${(s.formType||'').replace('_',' ')}</span></td>
            <td><div class="contact-name">${esc(nm)}</div><div class="contact-email">${esc(em)}</div></td>
            <td class="date">${s.date||''}</td>
            <td><span class="view-link">Ver →</span></td></tr>`;
    }).join('');

    // Pagination
    let pg='';
    pg+=`<button onclick="goPage(${currentPage-1})" ${currentPage<=1?'disabled':''}>&lsaquo;</button>`;
    const maxVisible=5;let startP=Math.max(1,currentPage-Math.floor(maxVisible/2));let endP=Math.min(totalPages,startP+maxVisible-1);
    if(endP-startP<maxVisible-1)startP=Math.max(1,endP-maxVisible+1);
    if(startP>1){pg+=`<button onclick="goPage(1)">1</button>`;if(startP>2)pg+=`<span class="page-info">…</span>`;}
    for(let i=startP;i<=endP;i++)pg+=`<button class="${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
    if(endP<totalPages){if(endP<totalPages-1)pg+=`<span class="page-info">…</span>`;pg+=`<button onclick="goPage(${totalPages})">${totalPages}</button>`;}
    pg+=`<button onclick="goPage(${currentPage+1})" ${currentPage>=totalPages?'disabled':''}>&rsaquo;</button>`;
    pg+=`<span class="page-info">${start+1}-${Math.min(start+PER_PAGE,all.length)} de ${all.length}</span>`;
    document.getElementById('pagination').innerHTML=pg;
}

function goPage(p){currentPage=p;renderTable();window.scrollTo({top:document.getElementById('tableWrap').offsetTop-100,behavior:'smooth'});}

function showDetail(id){
    const s=submissions.find(x=>x.correlativo===id);if(!s)return;
    document.getElementById('tableWrap').style.display='none';
    document.getElementById('pagination').style.display='none';
    const dv=document.getElementById('detailView');dv.style.display='block';
    const rows=Object.entries(s.data||{}).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>
        `<div class="detail-row"><div class="detail-label">${esc(k)}</div><div class="detail-value">${esc(String(v))}</div></div>`).join('');
    const fhtml=(s.files&&s.files.length)?`<div class="detail-row"><div class="detail-label">Archivos</div><div class="detail-value">${s.files.map(f=>esc(f.name)+' ('+Math.round(f.size/1024)+'KB)').join('<br>')}</div></div>`:'';
    dv.innerHTML=`<button class="back-btn" onclick="renderTable()">← Volver</button>
        <div class="detail"><h2>${esc(s.label||s.formType)}</h2><div class="meta"><span>${esc(s.correlativo)}</span> · ${esc(s.date||'')}</div><div class="detail-grid">${rows}${fhtml}</div></div>`;
}

function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
renderTable();
</script>
</body>
</html>
