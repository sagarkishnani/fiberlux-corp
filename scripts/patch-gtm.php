<?php
/**
 * patch-gtm.php — inyecta Google Tag Manager (GTM-KTV92FNF) en los .html ya
 * desplegados en el servidor, SIN reconstruir el sitio.
 *
 * Contexto: fiberlux.pe sirve un build estático del 27-jul-2026; `main` va muy
 * por delante, así que no se puede regenerar el sitio solo para añadir GTM.
 * Este script parchea los HTML que ya están arriba. Es de UN SOLO USO.
 *
 * USO
 *   1. Subir por SFTP a la raíz del sitio (junto a index.html).
 *   2. Simulacro:  https://fiberlux.pe/patch-gtm.php?key=734e422ad47e19c03b3c889f
 *   3. Aplicar:    https://fiberlux.pe/patch-gtm.php?key=734e422ad47e19c03b3c889f&apply=1
 *   4. BORRAR EL ARCHIVO DEL SERVIDOR.
 *
 * Es idempotente: un .html que ya contenga GTM-KTV92FNF se salta.
 * Con &backup=1 deja un .html.bak junto a cada archivo modificado.
 */

const KEY        = '734e422ad47e19c03b3c889f';
const GTM_ID     = 'GTM-KTV92FNF';
const SKIP_DIRS  = ['admin', 'data', 'uploads', '_astro', 'phpmailer'];

if (!isset($_GET['key']) || !hash_equals(KEY, (string) $_GET['key'])) {
    http_response_code(404);
    exit('Not found');
}

$apply  = isset($_GET['apply'])  && $_GET['apply']  === '1';
$backup = isset($_GET['backup']) && $_GET['backup'] === '1';
$root   = __DIR__;

$headSnippet = "\n<!-- Google Tag Manager -->\n"
    . "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n"
    . "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n"
    . "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n"
    . "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n"
    . "})(window,document,'script','dataLayer','" . GTM_ID . "');</script>\n"
    . "<!-- End Google Tag Manager -->\n";

$bodySnippet = "\n<!-- Google Tag Manager (noscript) -->\n"
    . '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' . GTM_ID . '"' . "\n"
    . 'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>' . "\n"
    . "<!-- End Google Tag Manager (noscript) -->\n";

$patched = $skipped = $failed = 0;
$log = [];

$it = new RecursiveIteratorIterator(
    new RecursiveCallbackFilterIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
        function ($file) {
            return !($file->isDir() && in_array($file->getFilename(), SKIP_DIRS, true));
        }
    )
);

foreach ($it as $file) {
    if (!$file->isFile() || strtolower($file->getExtension()) !== 'html') {
        continue;
    }

    $path = $file->getPathname();
    $rel  = ltrim(str_replace($root, '', $path), '/\\');
    $html = @file_get_contents($path);

    if ($html === false) {
        $failed++;
        $log[] = ['FALLO (no se pudo leer)', $rel];
        continue;
    }

    if (strpos($html, GTM_ID) !== false) {
        $skipped++;
        $log[] = ['ya tenía GTM', $rel];
        continue;
    }

    // Stubs de redirect que genera Astro para las rutas viejas /servicios/**:
    // son <meta http-equiv="refresh"> con noindex y SIN <head>. No se trackean.
    if (!preg_match('/<head\b[^>]*>/i', $html)) {
        $skipped++;
        $log[] = ['omitido (redirect/stub)', $rel];
        continue;
    }

    // <head ...> y <body ...>: solo la PRIMERA ocurrencia de cada uno.
    $out = preg_replace('/(<head\b[^>]*>)/i', '$1' . $headSnippet, $html, 1, $nHead);
    $out = preg_replace('/(<body\b[^>]*>)/i', '$1' . $bodySnippet, $out,  1, $nBody);

    if (!$nHead || !$nBody) {
        $failed++;
        $log[] = ['FALLO (sin <head> o <body>)', $rel];
        continue;
    }

    if ($apply) {
        if ($backup && !@copy($path, $path . '.bak')) {
            $failed++;
            $log[] = ['FALLO (backup)', $rel];
            continue;
        }
        // Escritura atómica: temp + rename, para que un fallo a mitad no deje
        // una página truncada servida en producción. Si el directorio no es
        // escribible por el usuario de Apache, cae a escritura directa sobre el
        // archivo (permisos distintos: dir vs archivo).
        $perms = @fileperms($path);
        $tmp   = @tempnam(dirname($path), '.gtm');
        $ok    = false;

        if ($tmp !== false) {
            if (@file_put_contents($tmp, $out) !== false && @rename($tmp, $path)) {
                if ($perms !== false) {
                    @chmod($path, $perms & 0777);
                }
                $ok = true;
            } else {
                @unlink($tmp);
            }
        }

        if (!$ok) {
            $ok = @file_put_contents($path, $out) !== false;
        }

        if (!$ok) {
            $failed++;
            $log[] = ['FALLO (sin permiso de escritura)', $rel];
            continue;
        }
    }

    $patched++;
    $log[] = [$apply ? 'parcheado' : 'se parchearía', $rel];
}

header('Content-Type: text/plain; charset=utf-8');
echo $apply ? "== APLICADO ==\n" : "== SIMULACRO (añade &apply=1 para escribir) ==\n";
echo "raíz: $root\n\n";
foreach ($log as [$estado, $rel]) {
    printf("%-28s %s\n", $estado, $rel);
}
printf("\n%d parcheados · %d saltados · %d fallidos\n", $patched, $skipped, $failed);
echo $apply ? "\n>>> BORRA patch-gtm.php DEL SERVIDOR AHORA.\n" : '';
