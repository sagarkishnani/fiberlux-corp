<?php
/**
 * Fiberlux - Unified Form Handler v3
 * - Reads recipient config from form-config.json (managed by TinaCMS)
 * - Saves submissions to data/submissions/
 * - Sends email via Office 365 SMTP
 */

// ─── Secrets (config.local.php generado en CI desde GitHub Secrets, NO versionado) ───
$cfg = file_exists(__DIR__ . '/config.local.php') ? (require __DIR__ . '/config.local.php') : [];
if (!is_array($cfg)) $cfg = [];

// ─── SMTP Config ───
$SMTP_HOST     = 'smtp.office365.com';       // no sensible
$SMTP_PORT     = 587;                         // no sensible
$SMTP_USER     = $cfg['SMTP_USER'] ?? '';
$SMTP_PASS     = $cfg['SMTP_PASS'] ?? '';
$UPLOAD_DIR    = __DIR__ . '/uploads';
$COUNTER_FILE  = __DIR__ . '/data/counter.json';
$SUBMISSIONS_DIR = __DIR__ . '/data/submissions';
$CONFIG_FILE   = __DIR__ . '/form-config.json';

// ─── Fallback recipients (used if config file is missing) ───
$FALLBACK_EMAIL = $cfg['FALLBACK_EMAIL'] ?? '';

// ─── CORS & Headers ───
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// ─── Parse input ───
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
} else {
    $input = $_POST;
}

// ─── Honeypot ───
if (!empty($input['website'])) {
    echo json_encode(['success' => true]);
    exit;
}

// ─── Validate form type ───
$formType = $input['formType'] ?? '';
if (empty($formType) || !preg_match('/^[a-z0-9_]+$/', $formType)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Tipo de formulario inválido']);
    exit;
}

// ─── Read config from TinaCMS-generated JSON ───
$config = loadFormConfig($CONFIG_FILE);
$formConfig = findFormConfig($config, $formType);

if (!$formConfig['enabled']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Este formulario está desactivado.']);
    exit;
}

$recipients = !empty($formConfig['recipients']) ? $formConfig['recipients'] : [$FALLBACK_EMAIL];

// ─── Generate correlative ───
$correlativo = generateCorrelative($formType);

// ─── Handle file uploads ───
$uploadedFiles = [];
if (!empty($_FILES)) {
    $fileDir = $UPLOAD_DIR . '/' . $correlativo;
    if (!is_dir($fileDir)) mkdir($fileDir, 0755, true);

    foreach ($_FILES as $fieldName => $fileGroup) {
        if (is_array($fileGroup['name'])) {
            for ($i = 0; $i < count($fileGroup['name']); $i++) {
                if ($fileGroup['error'][$i] === UPLOAD_ERR_OK) {
                    $safeName = sanitizeFilename($fileGroup['name'][$i]);
                    $dest = $fileDir . '/' . $safeName;
                    if (move_uploaded_file($fileGroup['tmp_name'][$i], $dest)) {
                        $uploadedFiles[] = ['field' => $fieldName, 'name' => $safeName, 'path' => $dest, 'size' => $fileGroup['size'][$i]];
                    }
                }
            }
        } else {
            if ($fileGroup['error'] === UPLOAD_ERR_OK) {
                $safeName = sanitizeFilename($fileGroup['name']);
                $dest = $fileDir . '/' . $safeName;
                if (move_uploaded_file($fileGroup['tmp_name'], $dest)) {
                    $uploadedFiles[] = ['field' => $fieldName, 'name' => $safeName, 'path' => $dest, 'size' => $fileGroup['size']];
                }
            }
        }
    }
}

// ─── Save submission ───
saveSubmission($formType, $correlativo, $input, $uploadedFiles);

// ─── Send email ───
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';
require __DIR__ . '/phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = $SMTP_USER;
    $mail->Password   = $SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($SMTP_USER, 'Fiberlux Web');
    foreach ($recipients as $to) {
        $mail->addAddress(trim($to));
    }

    $replyEmail = $input['email'] ?? $input['correo'] ?? '';
    $replyName  = trim(($input['nombre'] ?? '') . ' ' . ($input['apellido'] ?? ''));
    if ($replyEmail && filter_var($replyEmail, FILTER_VALIDATE_EMAIL)) {
        $mail->addReplyTo($replyEmail, $replyName);
    }

    foreach ($uploadedFiles as $file) {
        $mail->addAttachment($file['path'], $file['name']);
    }

    $subjectPrefix = getSubjectPrefix($formType);
    $mail->Subject = "$subjectPrefix [$correlativo]" . ($replyName ? " - $replyName" : "");
    $mail->isHTML(true);
    $mail->Body    = buildEmailBody($formType, $input, $correlativo, $uploadedFiles);
    $mail->AltBody = buildPlainText($formType, $input, $correlativo);

    $mail->send();

        // ─── Confirmation copy to lead ───
        $leadEmail = $input['email'] ?? $input['correo'] ?? '';
        $leadName  = trim(($input['nombre'] ?? '') . ' ' . ($input['apellido'] ?? ''));
        if ($leadEmail && filter_var($leadEmail, FILTER_VALIDATE_EMAIL)) {
            try {
                $confirm = new PHPMailer(true);
                $confirm->isSMTP();
                $confirm->Host       = $SMTP_HOST;
                $confirm->SMTPAuth   = true;
                $confirm->Username   = $SMTP_USER;
                $confirm->Password   = $SMTP_PASS;
                $confirm->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $confirm->Port       = $SMTP_PORT;
                $confirm->CharSet    = 'UTF-8';
                $confirm->setFrom($SMTP_USER, 'Fiberlux');
                $confirm->addAddress($leadEmail, $leadName);
                $confirm->Subject = "Recibimos tu mensaje [$correlativo] — Fiberlux";
                $confirm->isHTML(true);
                $confirm->Body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0a0a0a;padding:24px 32px;"><h1 style="margin:0;color:#fff;font-size:18px;">Fiberlux</h1></td></tr><tr><td style="padding:32px;"><p style="color:#333;font-size:15px;margin:0 0 16px;">Hola' . ($leadName ? " <strong>" . htmlspecialchars($leadName) . "</strong>" : "") . ',</p><p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px;">Hemos recibido tu solicitud con el código <strong style="color:#96237A;">' . $correlativo . '</strong>. Nuestro equipo se comunicará contigo en las próximas 24 horas.</p><p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px;">Si tienes alguna consulta adicional, no dudes en contactarnos al <strong>(01) 748-0606</strong> o por WhatsApp.</p><p style="color:#aaa;font-size:12px;margin:0;">Este es un mensaje automático, por favor no respondas a este correo.</p></td></tr><tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee;text-align:center;"><p style="margin:0;color:#aaa;font-size:11px;">© ' . date('Y') . ' Fiberlux</p></td></tr></table></td></tr></table></body></html>';
                $confirm->AltBody = "Hola $leadName, recibimos tu solicitud [$correlativo]. Nos comunicaremos contigo en las próximas 24 horas. Tel: (01) 748-0606";
                $confirm->send();
            } catch (Exception $e) {
                // Confirmation email failed silently — don't break the main flow
            }
        }

        echo json_encode(['success' => true, 'correlativo' => $correlativo]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'No se pudo enviar el correo.']);
}

// ══════════════════════════════════════════════════
//  CONFIG FUNCTIONS
// ══════════════════════════════════════════════════

function loadFormConfig(string $path): array {
    if (!file_exists($path)) return ['forms' => []];
    $data = json_decode(file_get_contents($path), true);
    return is_array($data) ? $data : ['forms' => []];
}

function findFormConfig(array $config, string $formType): array {
    foreach ($config['forms'] ?? [] as $f) {
        if (($f['formType'] ?? '') === $formType) {
            return [
                'enabled' => $f['enabled'] ?? true,
                'recipients' => $f['recipients'] ?? [],
            ];
        }
    }
    return ['enabled' => true, 'recipients' => []];
}

// ══════════════════════════════════════════════════
//  SUBMISSION STORAGE
// ══════════════════════════════════════════════════

function saveSubmission(string $type, string $correlativo, array $data, array $files): void {
    global $SUBMISSIONS_DIR;
    if (!is_dir($SUBMISSIONS_DIR)) mkdir($SUBMISSIONS_DIR, 0755, true);

    $submission = [
        'correlativo' => $correlativo,
        'formType'    => $type,
        'label'       => getSubjectPrefix($type),
        'date'        => date('Y-m-d H:i:s'),
        'timestamp'   => time(),
        'data'        => array_diff_key($data, array_flip(['formType', 'website'])),
        'files'       => array_map(fn($f) => ['name' => $f['name'], 'size' => $f['size']], $files),
    ];

    $filename = $correlativo . '.json';
    file_put_contents($SUBMISSIONS_DIR . '/' . $filename, json_encode($submission, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// ══════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════════

function generateCorrelative(string $type): string {
    global $COUNTER_FILE;
    $dir = dirname($COUNTER_FILE);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $counters = file_exists($COUNTER_FILE) ? json_decode(file_get_contents($COUNTER_FILE), true) ?: [] : [];
    $prefixes = ['contacto'=>'CON','hero_contacto'=>'HER','reclamo'=>'REC','apelacion'=>'APE','queja'=>'QUE','arco'=>'ARC','libro_reclamaciones'=>'LIB'];
    $prefix = $prefixes[$type] ?? 'GEN';
    $current = ($counters[$type] ?? 0) + 1;
    $counters[$type] = $current;
    file_put_contents($COUNTER_FILE, json_encode($counters, JSON_PRETTY_PRINT));
    return $prefix . '-' . str_pad($current, 6, '0', STR_PAD_LEFT);
}

function sanitizeFilename(string $name): string {
    return substr(preg_replace('/_+/', '_', preg_replace('/[^a-zA-Z0-9._-]/', '_', $name)), 0, 200);
}

function getSubjectPrefix(string $type): string {
    $map = ['contacto'=>'Nuevo contacto web','hero_contacto'=>'Nuevo lead web (Hero)','reclamo'=>'Nuevo reclamo OSIPTEL','apelacion'=>'Nuevo recurso de apelación','queja'=>'Nueva queja OSIPTEL','arco'=>'Nueva solicitud Derechos ARCO','libro_reclamaciones'=>'Nuevo registro Libro de Reclamaciones'];
    return $map[$type] ?? 'Nuevo formulario web';
}

function h(string $val): string { return htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8'); }

function buildEmailBody(string $type, array $data, string $correlativo, array $files): string {
    $rows = getFieldRows($type, $data);
    $fileRows = '';
    if (!empty($files)) {
        $fileRows = '<tr><td style="padding:12px 0;color:#888;vertical-align:top;">Archivos adjuntos</td><td style="padding:12px 0;">';
        foreach ($files as $f) { $size = round($f['size']/1024,1); $fileRows .= h($f['name'])." ({$size} KB)<br>"; }
        $fileRows .= '</td></tr>';
    }
    $tableRows = '';
    foreach ($rows as $label => $value) {
        if ($value === '') continue;
        $tableRows .= '<tr><td style="padding:8px 0;color:#888;width:180px;vertical-align:top;font-size:13px;">'.h($label).'</td><td style="padding:8px 0;font-weight:500;font-size:14px;">'.nl2br(h($value)).'</td></tr>';
    }
    $typeName = getSubjectPrefix($type);
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0a0a0a;padding:24px 32px;"><h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Fiberlux</h1><p style="margin:4px 0 0;color:#7686BC;font-size:13px;">'.h($typeName).'</p></td></tr><tr><td style="padding:20px 32px 0;"><span style="display:inline-block;background:#96237A;color:#fff;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;">'.h($correlativo).'</span></td></tr><tr><td style="padding:24px 32px 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="color:#333;">'.$tableRows.$fileRows.'</table></td></tr><tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee;"><p style="margin:0;color:#aaa;font-size:11px;text-align:center;">Correo generado desde fiberlux.pe</p></td></tr></table></td></tr></table></body></html>';
}

function buildPlainText(string $type, array $data, string $correlativo): string {
    $rows = getFieldRows($type, $data);
    $text = getSubjectPrefix($type)." [$correlativo]\n\n";
    foreach ($rows as $l => $v) { if ($v !== '') $text .= "$l: $v\n"; }
    return $text;
}

function getFieldRows(string $type, array $data): array {
    switch ($type) {
        case 'contacto': return ['Nombre'=>($data['nombre']??'').' '.($data['apellido']??''),'Empresa'=>$data['empresa']??'','RUC'=>$data['ruc']??'','Servicio'=>$data['servicio']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['email']??'','Mensaje'=>$data['mensaje']??''];
        case 'hero_contacto': return ['RUC'=>$data['ruc']??'','Celular'=>$data['celular']??'','Acepta publicidad'=>($data['acceptsAds']??'')==='true'?'Sí':'No'];
        case 'reclamo': return ['Nombre / Razón Social'=>$data['nombre']??'','Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['correo']??'','Servicio'=>$data['servicioSelec']??'','N° de abonado'=>$data['numAbonado']??'','Dirección'=>$data['direccion']??'','Distrito'=>$data['distrito']??'','Provincia'=>$data['provincia']??'','Nombre rep.'=>($data['repNombre']??'').' '.($data['repApellido']??''),'Doc. rep.'=>($data['repTipoDoc']??'').' '.($data['repNumDoc']??''),'Materia reclamable'=>$data['materiaReclamo']??'','Opción de reclamo'=>$data['opcionReclamo']??'','Monto'=>$data['montoReclamo']??'','Observaciones'=>$data['observaciones']??''];
        case 'apelacion': return ['Nombre / Razón Social'=>$data['nombre']??'','Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','N° de abonado'=>$data['numAbonado']??'','Servicio'=>$data['servicio']??'','Dirección'=>$data['direccion']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['correo']??'','Nombre rep.'=>($data['repNombre']??'').' '.($data['repApellido']??''),'Resolución N°'=>$data['resolucionNum']??'','Fecha resolución'=>($data['resDia']??'').'/'.($data['resMes']??'').'/'.($data['resAnio']??''),'Fecha notificación'=>($data['notifDia']??'').'/'.($data['notifMes']??'').'/'.($data['notifAnio']??''),'Mensaje'=>$data['mensaje']??''];
        case 'queja': return ['Nombre / Razón Social'=>$data['nombre']??'','Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['correo']??'','Servicio'=>$data['servicioSelec']??'','N° de abonado'=>$data['numAbonado']??'','Dirección'=>$data['direccion']??'','Distrito'=>$data['distrito']??'','Ciudad'=>$data['ciudad']??'','Nombre rep.'=>($data['repNombre']??'').' '.($data['repApellido']??''),'Motivo de queja'=>$data['motivoQueja']??'','Mensaje'=>$data['mensaje']??''];
        case 'arco': return ['Nombre'=>($data['nombre']??'').' '.($data['apellido']??''),'Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','Correo'=>$data['correo']??'','Domicilio'=>$data['domicilio']??'','Representante'=>($data['repNombre']??'').' '.($data['repApellido']??''),'Tipo de solicitud'=>$data['tipoSolicitud']??'','Detalle'=>$data['detalle']??''];
        case 'libro_reclamaciones': return ['Nombre completo'=>$data['nombreCompleto']??'','Dirección'=>$data['direccionCons']??'','Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','Correo'=>$data['correo']??'','Teléfono'=>$data['telefono']??'','Tipo de bien'=>$data['tipoBien']??'','Monto reclamado'=>$data['montoReclamado']??'','Descripción'=>$data['descripcionBien']??'','Tipo de solicitud'=>$data['tipoSolicitud']??'','Detalle'=>$data['detalle']??'','Pedido'=>$data['pedido']??''];
        default: return $data;
    }
}
?>
