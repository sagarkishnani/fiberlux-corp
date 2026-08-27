<?php
/**
 * Fiberlux - Unified Form Handler v3
 * - Reads recipient config from form-config.json (managed by TinaCMS)
 * - Saves submissions to data/submissions/
 * - Sends email via Office 365 SMTP
 */

// Zona horaria de Perú: deja el campo `date` de los registros nuevos en hora local (SPEC 87).
date_default_timezone_set('America/Lima');

// ─── Secrets (fiberlux-config.php subido por FTP, fuera del repo y de dist/ — SPEC 85) ───
$CONFIG_PATH = __DIR__ . '/fiberlux-config.php';
if (!file_exists($CONFIG_PATH)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Configuración no disponible.']);
    exit;
}
$cfg = require $CONFIG_PATH;
if (!is_array($cfg)) $cfg = [];

// ─── SMTP Config (sin fallbacks literales; los secretos viven en fiberlux-config.php) ───
$SMTP_HOST     = $cfg['smtp_host'] ?? 'smtp.office365.com';   // no sensible
$SMTP_PORT     = $cfg['smtp_port'] ?? 587;                    // no sensible
$SMTP_USER     = $cfg['smtp_user'] ?? '';
$SMTP_PASS     = $cfg['smtp_pass'] ?? '';
$UPLOAD_DIR    = __DIR__ . '/uploads';
$COUNTER_FILE  = __DIR__ . '/data/counter.json';
$SUBMISSIONS_DIR = __DIR__ . '/data/submissions';
$CONFIG_FILE   = __DIR__ . '/form-config.json';

// ─── Fallback recipient (usado si form-config.json no trae recipients) ───
$FALLBACK_EMAIL = $cfg['fallback_email'] ?? '';

// ─── Base absoluta de imágenes de correo (public/mail) ───
// Derivada del host en runtime: /mail en producción, /staging/mail en staging.
$mailProto = $_SERVER['HTTP_X_FORWARDED_PROTO']
    ?? ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http');
$mailHost  = $_SERVER['HTTP_HOST'] ?? '';
$mailDir   = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
$ASSET_BASE = "$mailProto://$mailHost$mailDir/mail";

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

// ─── Captcha (Cloudflare Turnstile) — verificación server-side (SPEC 79) ───
// El token nunca debe llegar al correo ni al registro: se extrae de $input aquí.
$captchaToken = $input['captchaToken'] ?? '';
unset($input['captchaToken']);
$TURNSTILE_SECRET = $cfg['turnstile_secret'] ?? '';   // clave migrada a fiberlux-config.php (SPEC 85)
// Solo se exige captcha si hay secret configurada (se despliega junto a la site
// key). Con secret presente: token ausente/inválido o verificación no completable
// → se rechaza sin enviar correo (fail-closed).
if ($TURNSTILE_SECRET !== '') {
    if (!verifyTurnstile($TURNSTILE_SECRET, $captchaToken, $_SERVER['REMOTE_ADDR'] ?? '')) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.']);
        exit;
    }
}

// ─── Validate form type ───
$formType = $input['formType'] ?? '';
// Permite guion bajo y guion (corp usa 'libro_reclamaciones' y 'derechos-arco').
if (empty($formType) || !preg_match('/^[a-z0-9_-]+$/', $formType)) {
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
    $mail->Body    = buildEmailBody($formType, $input, $correlativo, $uploadedFiles, $ASSET_BASE);
    $mail->AltBody = buildPlainText($formType, $input, $correlativo);

    $mail->send();

        // ─── Confirmation copy to lead ───
        $leadEmail = $input['email'] ?? $input['correo'] ?? '';
        $leadName  = trim(($input['nombre'] ?? '') . ' ' . ($input['apellido'] ?? $input['apellidos'] ?? ''));
        if ($leadName === '') $leadName = trim($input['nombreCompleto'] ?? '');
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
                $confirm->isHTML(true);

                // Grupo A (plantilla rica): contacto / soluciones. Resto → Grupo B (simple + logo).
                $richTypes = ['contacto', 'servicios'];
                if (in_array($formType, $richTypes, true)) {
                    $confirm->Subject = 'Gracias por contactarnos — Fiberlux';
                    $confirm->Body    = buildConfirmRich($leadName, $ASSET_BASE);
                    $confirm->AltBody = 'Hola' . ($leadName ? " $leadName" : '') . ', hemos recibido tus datos. Un ejecutivo de ventas se comunicará muy pronto contigo. — Fiberlux';
                } else {
                    $confirm->Subject = "Recibimos tu mensaje [$correlativo] — Fiberlux";
                    $confirm->Body    = buildConfirmSimple($leadName, $correlativo, $ASSET_BASE);
                    $confirm->AltBody = "Hola $leadName, recibimos tu solicitud [$correlativo]. Nos comunicaremos contigo en las próximas 24 horas.";
                }
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
        'data'        => array_diff_key($data, array_flip(['formType', 'website', 'captchaToken'])),
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
    $prefixes = ['contacto'=>'CON','servicios'=>'SER','reclamo'=>'REC','apelacion'=>'APE','queja'=>'QUE','derechos-arco'=>'ARC','libro_reclamaciones'=>'LIB'];
    $prefix = $prefixes[$type] ?? 'GEN';
    $current = ($counters[$type] ?? 0) + 1;
    $counters[$type] = $current;
    file_put_contents($COUNTER_FILE, json_encode($counters, JSON_PRETTY_PRINT));
    return $prefix . '-' . str_pad($current, 6, '0', STR_PAD_LEFT);
}

function sanitizeFilename(string $name): string {
    return substr(preg_replace('/_+/', '_', preg_replace('/[^a-zA-Z0-9._-]/', '_', $name)), 0, 200);
}

/**
 * Verifica un token de Cloudflare Turnstile contra el endpoint siteverify.
 * Devuelve true solo si Cloudflare responde success:true. Cualquier fallo
 * (token vacío, error de red/timeout, respuesta no parseable) → false (fail-closed).
 */
function verifyTurnstile(string $secret, string $token, string $remoteIp): bool {
    if ($token === '') return false;

    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    $fields = ['secret' => $secret, 'response' => $token];
    if ($remoteIp !== '') $fields['remoteip'] = $remoteIp;

    $resp = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($fields),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $resp = curl_exec($ch);
        $failed = ($resp === false) || curl_errno($ch) !== 0;
        curl_close($ch);
        if ($failed) return false;
    } else {
        // Fallback sin cURL.
        $ctx = stream_context_create(['http' => [
            'method'  => 'POST',
            'header'  => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query($fields),
            'timeout' => 10,
        ]]);
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp === false) return false;
    }

    $data = json_decode($resp, true);
    return is_array($data) && !empty($data['success']);
}

function getSubjectPrefix(string $type): string {
    $map = ['contacto'=>'Nuevo contacto web','servicios'=>'Nuevo lead de servicios','reclamo'=>'Nuevo reclamo OSIPTEL','apelacion'=>'Nuevo recurso de apelación','queja'=>'Nueva queja OSIPTEL','derechos-arco'=>'Nueva solicitud Derechos ARCO','libro_reclamaciones'=>'Nuevo registro Libro de Reclamaciones'];
    return $map[$type] ?? 'Nuevo formulario web';
}

function h(string $val): string { return htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8'); }

// Checkbox opcional -> etiqueta legible. El front manda "true"/"false" (string);
// si el campo no vino, devuelve '' y buildEmailBody omite la fila.
function boolLabel($val): string {
    $v = is_string($val) ? strtolower(trim($val)) : '';
    if ($v === 'true' || $v === '1' || $v === 'on') return 'Sí';
    if ($v === 'false' || $v === '0') return 'No';
    return '';
}

function buildEmailBody(string $type, array $data, string $correlativo, array $files, string $assetBase = ''): string {
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
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0a0a0a;padding:24px 32px;"><img src="'.h($assetBase).'/logoFiberlux-blanco.png" alt="Fiberlux" width="141" style="display:block;width:141px;height:auto;border:0;"><p style="margin:10px 0 0;color:#7686BC;font-size:13px;">'.h($typeName).'</p></td></tr><tr><td style="padding:20px 32px 0;"><span style="display:inline-block;background:#96237A;color:#fff;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;">'.h($correlativo).'</span></td></tr><tr><td style="padding:24px 32px 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="color:#333;">'.$tableRows.$fileRows.'</table></td></tr><tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee;"><p style="margin:0;color:#aaa;font-size:11px;text-align:center;">Correo generado desde fiberlux.pe</p></td></tr></table></td></tr></table></body></html>';
}

function buildPlainText(string $type, array $data, string $correlativo): string {
    $rows = getFieldRows($type, $data);
    $text = getSubjectPrefix($type)." [$correlativo]\n\n";
    foreach ($rows as $l => $v) { if ($v !== '') $text .= "$l: $v\n"; }
    return $text;
}

function getFieldRows(string $type, array $data): array {
    switch ($type) {
        case 'contacto': return ['Nombre'=>trim(($data['nombre']??'').' '.($data['apellido']??'')),'Empresa'=>$data['empresa']??'','RUC'=>$data['ruc']??'','Servicio'=>$data['servicio']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['correo']??'','Mensaje'=>$data['comentario']??'','Acepta info. comercial'=>boolLabel($data['infoComercial']??'')];
        case 'servicios': return ['Empresa'=>$data['empresa']??'','RUC'=>$data['ruc']??'','Nombre'=>trim(($data['nombre']??'').' '.($data['apellidos']??'')),'Servicio'=>$data['servicio']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['correo']??'','Acepta info. comercial'=>boolLabel($data['infoComercial']??'')];
        case 'reclamo': return ['Nombre / Razón Social'=>trim(($data['nombre']??'').' '.($data['apellido']??'')),'Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['correo']??'','Servicio'=>trim(($data['servicioSelec']??'').' '.($data['otroServicio']??'')),'Dirección'=>$data['direccion']??'','Distrito'=>$data['distrito']??'','Ciudad'=>$data['ciudad']??'','Nombre de contacto'=>$data['contactNombre']??'','Nombre rep.'=>trim(($data['repNombre']??'').' '.($data['repApellido']??'')),'Doc. rep.'=>trim(($data['repTipoDoc']??'').' '.($data['repNumDoc']??'')),'Materia reclamable'=>$data['materiaReclamo']??'','Monto'=>$data['montoReclamo']??'','Observaciones'=>$data['observaciones']??''];
        case 'apelacion': return ['Nombre / Razón Social'=>$data['nombre']??'','Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','N° de abonado'=>$data['numAbonado']??'','Servicio'=>$data['servicio']??'','Dirección'=>$data['direccion']??'','Distrito'=>$data['distrito']??'','Provincia'=>$data['provincia']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['correo']??'','Nombre rep.'=>trim(($data['repNombre']??'').' '.($data['repApellido']??'')),'Doc. rep.'=>trim(($data['repTipoDoc']??'').' '.($data['repNumDoc']??'')),'Resolución N°'=>$data['resolucionNum']??'','Fecha resolución'=>($data['resDia']??'').'/'.($data['resMes']??'').'/'.($data['resAnio']??''),'Fecha notificación'=>($data['notifDia']??'').'/'.($data['notifMes']??'').'/'.($data['notifAnio']??''),'Mensaje'=>$data['mensaje']??''];
        case 'queja': return ['Nombre / Razón Social'=>$data['nombre']??'','Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','Teléfono'=>$data['telefono']??'','Email'=>$data['correo']??'','Servicio'=>$data['servicioSelec']??'','N° de abonado'=>$data['numAbonado']??'','Dirección'=>$data['direccion']??'','Distrito'=>$data['distrito']??'','Ciudad'=>$data['ciudad']??'','Nombre rep.'=>trim(($data['repNombre']??'').' '.($data['repApellido']??'')),'Doc. rep.'=>trim(($data['repTipoDoc']??'').' '.($data['repNumDoc']??'')),'Motivo de queja'=>$data['motivoQueja']??'','Mensaje'=>$data['mensaje']??''];
        case 'derechos-arco': return ['Nombre'=>trim(($data['nombre']??'').' '.($data['apellido']??'')),'Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','Correo'=>$data['correo']??'','Teléfono'=>$data['telefono']??'','Domicilio'=>$data['direccion']??'','Representante'=>$data['repNombre']??'','Doc. rep.'=>$data['repDoc']??'','Tipo de solicitud'=>$data['tipoSolicitud']??'','Detalle'=>$data['detalle']??''];
        case 'libro_reclamaciones': return ['Nombre completo'=>$data['nombreCompleto']??'','Dirección'=>$data['direccionCons']??'','Tipo de documento'=>$data['tipoDoc']??'','Nro. de documento'=>$data['numDoc']??'','Correo'=>$data['correo']??'','Teléfono'=>$data['telefono']??'','Tipo de bien'=>$data['tipoBien']??'','Monto reclamado'=>$data['montoReclamado']??'','Descripción'=>$data['descripcionBien']??'','Tipo de solicitud'=>$data['tipoSolicitud']??'','Detalle'=>$data['detalle']??'','Pedido'=>$data['pedido']??''];
        default: return $data;
    }
}

// ══════════════════════════════════════════════════
//  CONFIRMATION EMAIL TEMPLATES (to the lead)
// ══════════════════════════════════════════════════

// Grupo B (reclamos/legales): confirmación simple con el logo en el header negro.
function buildConfirmSimple(string $leadName, string $correlativo, string $assetBase): string {
    $b    = htmlspecialchars($assetBase, ENT_QUOTES, 'UTF-8');
    $name = $leadName !== '' ? ' <strong>' . htmlspecialchars($leadName, ENT_QUOTES, 'UTF-8') . '</strong>' : '';
    $cor  = htmlspecialchars($correlativo, ENT_QUOTES, 'UTF-8');
    $year = date('Y');
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0a0a0a;padding:24px 32px;"><img src="' . $b . '/logoFiberlux-blanco.png" alt="Fiberlux" width="141" style="display:block;width:141px;height:auto;border:0;"></td></tr><tr><td style="padding:32px;"><p style="color:#333;font-size:15px;margin:0 0 16px;">Hola' . $name . ',</p><p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px;">Hemos recibido tu solicitud con el código <strong style="color:#96237A;">' . $cor . '</strong>. Nuestro equipo se comunicará contigo en las próximas 24 horas.</p><p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px;">Si tienes alguna consulta adicional, no dudes en contactarnos al <strong>(01) 748-0606</strong> o por WhatsApp.</p><p style="color:#aaa;font-size:12px;margin:0;">Este es un mensaje automático, por favor no respondas a este correo.</p></td></tr><tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee;text-align:center;"><p style="margin:0;color:#aaa;font-size:11px;">© ' . $year . ' Fiberlux</p></td></tr></table></td></tr></table></body></html>';
}

// Grupo A (contacto/soluciones): plantilla rica "Gracias por contactarnos".
function buildConfirmRich(string $leadName, string $assetBase): string {
    $b        = htmlspecialchars($assetBase, ENT_QUOTES, 'UTF-8');
    $greeting = 'Hola' . ($leadName !== '' ? ' ' . htmlspecialchars($leadName, ENT_QUOTES, 'UTF-8') : '');
    return '<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Gracias por contactarnos - Fiberlux</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body, table, td { font-family: Poppins, Arial, Helvetica, sans-serif; }
  body { margin:0; padding:0; background-color:#ffffff; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table { border-collapse:collapse; }
  img { border:0; display:block; line-height:100%; -ms-interpolation-mode:bicubic; }
  a { text-decoration:none; }
  @media only screen and (max-width:620px) {
    .email-container { width:100% !important; }
    .fluid-img { width:100% !important; height:auto !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#ffffff;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#000000;">Gracias por registrarte en nuestro formulario. Un ejecutivo de ventas se comunicará muy pronto contigo.</div>
  <center style="width:100%; background-color:#ffffff;">
  <div style="max-width:600px; margin:0 auto;" class="email-container">
  <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; margin:0 auto; background-color:#F3E4EF;">
    <tr>
      <td style="background-color:#000000; padding:12px 64px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;"><img src="' . $b . '/logoFiberlux-blanco.png" width="141" alt="Fiberlux" style="display:block; width:141px; height:auto;"></td>
          <td style="vertical-align:middle; text-align:right;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right"><tr>
              <td style="padding-left:10px;"><a href="https://www.linkedin.com/company/fiberlux-peru/" target="_blank"><img src="' . $b . '/linkedin-blanco.png" width="22" alt="LinkedIn Fiberlux" style="display:block; height:auto;"></a></td>
              <td style="padding-left:10px;"><a href="https://www.facebook.com/fiberluxsac" target="_blank"><img src="' . $b . '/facebook-blanco.png" width="22" alt="Facebook Fiberlux" style="display:block; height:auto;"></a></td>
              <td style="padding-left:10px;"><a href="https://www.youtube.com/@fiberlux_peru" target="_blank"><img src="' . $b . '/youtube-blanco.png" width="22" alt="YouTube Fiberlux" style="display:block; height:auto;"></a></td>
              <td style="padding-left:10px;"><a href="https://www.instagram.com/fiberlux_peru" target="_blank"><img src="' . $b . '/instagram-blanco.png" width="22" alt="Instagram Fiberlux" style="display:block; height:auto;"></a></td>
            </tr></table>
          </td>
        </tr></table>
      </td>
    </tr>
    <tr>
      <td style="background-color:#F3E4EF; padding:0;"><img src="' . $b . '/header-contact-mail.png" alt="Contacto - Gracias por contactarnos" width="600" class="fluid-img" style="width:100%; max-width:600px; height:auto; display:block;"></td>
    </tr>
    <tr>
      <td style="background-color:#F3E4EF; padding:36px 60px 28px 60px; text-align:center;">
        <p style="margin:0 0 16px 0; font-family:Poppins,Arial,sans-serif; font-size:20px; font-weight:600; color:#252525;">' . $greeting . '</p>
        <p style="margin:0 0 16px 0; font-family:Poppins,Arial,sans-serif; font-size:15px; font-weight:400; line-height:1.45; color:#4a4a4a;">Hemos recibido tus datos, un ejecutivo de ventas se comunicará muy pronto contigo para enviarte más información del servicio requerido.</p>
        <p style="margin:0; font-family:Poppins,Arial,sans-serif; font-size:15px; font-weight:400; line-height:1.45; color:#4a4a4a;">En <strong style="font-weight:600;">Fiberlux</strong> te ayudaremos a ser parte del proceso de Transformación Digital de tu empresa.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#96237a; padding:32px 70px; text-align:center;">
        <p style="margin:0; font-family:Poppins,Arial,sans-serif; font-size:16px; line-height:1.2; color:#ffffff;"><strong style="font-weight:600;">¿Tienes una consulta urgente?</strong><br>Escríbenos respondiendo este correo.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f0f0f0; padding:16px 70px 0 70px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;"><img src="' . $b . '/logoFiberlux-full.png" width="110" alt="Fiberlux" style="display:block; width:110px; height:auto;"></td>
          <td style="vertical-align:middle; text-align:right;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right"><tr>
              <td style="padding-left:8px;"><a href="https://www.linkedin.com/company/fiberlux-peru/" target="_blank"><img src="' . $b . '/linkedin-gris.png" width="24" alt="LinkedIn Fiberlux" style="display:block; height:auto;"></a></td>
              <td style="padding-left:8px;"><a href="https://www.facebook.com/fiberluxsac" target="_blank"><img src="' . $b . '/facebook-gris.png" width="24" alt="Facebook Fiberlux" style="display:block; height:auto;"></a></td>
              <td style="padding-left:8px;"><a href="https://www.youtube.com/@fiberlux_peru" target="_blank"><img src="' . $b . '/youtube-gris.png" width="24" alt="YouTube Fiberlux" style="display:block; height:auto;"></a></td>
              <td style="padding-left:8px;"><a href="https://www.instagram.com/fiberlux_peru" target="_blank"><img src="' . $b . '/instagram-gris.png" width="24" alt="Instagram Fiberlux" style="display:block; height:auto;"></a></td>
            </tr></table>
          </td>
        </tr></table>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f0f0f0; padding:10px 70px 27px 70px;">
        <p style="margin:0 0 8px 0; font-family:Poppins,Arial,sans-serif; font-size:12px; line-height:1.15; color:#5e5e5e; text-align:justify;">AVISO DE CONFIDENCIALIDAD: Este correo y sus anexos son para uso exclusivo del destinatario y pueden contener información confidencial o privilegiada. Su uso no autorizado está prohibido por la ley. Si usted no es el destinatario, por favor, notifíquelo al remitente y elimínelo. Queda prohibido revisarlo, retransmitirlo o usarlo por personas no autorizadas.</p>
        <p style="margin:0; font-family:Poppins,Arial,sans-serif; font-size:12px; line-height:1.15; color:#5e5e5e; text-align:justify;">Sus datos personales indicados quedan incorporados en el Banco de Datos denominados &ldquo;Usuarios de Medios Digitales&rdquo; (RNPDP-PJP-N N&deg; 10531) y/o &ldquo;Clientes actuales y Potenciales&rdquo; (RNPDP-PJP-N N&deg; 10534) de conformidad con las disposiciones legales sobre protección de datos personales. Usted puede ejercer sus derechos de acceso, rectificación, cancelación y oposición enviando un correo a <a href="mailto:atencionalcliente@fiberlux.pe" style="color:#5e5e5e; text-decoration:underline;">atencionalcliente@fiberlux.pe</a>. Si no desea recibir más correos, por favor responda a este mensaje con el asunto "REMOVER".</p>
      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
  </div>
  </center>
</body>
</html>';
}
?>
