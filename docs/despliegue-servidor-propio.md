# Despliegue desde servidor propio (modelo pull)

**Preparado por Twin Studios para el área de TI de Fiberlux.**

El documento está dividido en dos partes según quién ejecuta cada acción:

- **Parte A — Twin Studios (desarrollo).** Todo lo que ocurre en la cuenta de GitHub
  que aloja el repositorio y en TinaCMS. Fiberlux no necesita cuenta de GitHub ni
  acceso al código.
- **Parte B — Fiberlux (infraestructura).** Todo lo que ocurre dentro del servidor.
  Twin Studios no necesita acceso al servidor en ningún momento.

Entre ambas hay **tres entregas** y un orden que sí importa; están señaladas.

---

## Qué resuelve

Hoy el despliegue lo hace GitHub Actions por SFTP: una máquina en internet construye
el sitio y entra al servidor a dejarlo. Eso obliga a exponer el servidor o a tender
una VPN, y a guardar credenciales del servidor de Fiberlux en GitHub.

El modelo pull invierte la dirección: **el servidor de Fiberlux consulta el
repositorio**, y cuando detecta un commit nuevo en la rama, construye y publica él
mismo.

- **Cero puertos entrantes.** Todo el tráfico es saliente HTTPS.
- **Cero VPN.** Nada externo necesita alcanzar la red de Fiberlux.
- **Cero credenciales del servidor en GitHub.** GitHub no conoce ni alcanza al servidor.
- **El build corre dentro de la red de Fiberlux**, sobre su propio hardware.
- **Un solo disparador para todo.** Un `git push` de Twin Studios y un guardado del
  cliente en TinaCMS producen ambos un commit en la rama; el servidor no distingue
  entre ellos.

```
Twin Studios: push ────┐
                       ├─▶ commit en la rama ─▶ [GitHub · cuenta Twin Studios]
Cliente: guarda en ────┘                              ▲
Tina                                                  │ git fetch cada minuto
                                                      │ TCP 443 saliente
                                          ┌───────────┼──────────────────────┐
                                          │  RED DE FIBERLUX                 │
                                          │  Servidor → build → docroot      │
                                          └──────────────────────────────────┘
```

La flecha sube: la iniciativa siempre parte del servidor. Ninguna conexión cruza el
borde hacia adentro.

---

## Reparto de responsabilidades

| Ámbito | Responsable |
|---|---|
| Repositorio, ramas, deploy keys, GitHub Actions | Twin Studios |
| Proyecto de TinaCMS y sus tokens | Twin Studios |
| Código del sitio y build | Twin Studios |
| Servidor, sistema operativo, Node, cron | Fiberlux |
| Docroot y servicio web | Fiberlux |
| Secretos del backend PHP (SMTP, panel) | Fiberlux |
| Monitoreo y alertas del despliegue | Fiberlux |
| Contenido del sitio (textos, imágenes) | Cliente, desde TinaCMS |

### Las tres entregas entre equipos

| # | De | A | Qué se entrega | Habilita |
|---|---|---|---|---|
| 1 | Fiberlux | Twin Studios | La clave **pública** SSH generada en el servidor (`id_ed25519.pub`) | Que Twin Studios la registre y el servidor pueda clonar (paso B6) |
| 2 | Twin Studios | Fiberlux | Las variables de build, por canal seguro | Que Fiberlux arme `deploy.env` (paso B7) |
| 3 | Fiberlux | Twin Studios | Aviso de que la primera publicación fue correcta | Que Twin Studios retire el despliegue por SFTP (paso A6) |

> La entrega 2 contiene tokens. No enviarla por correo ni mensajería en texto plano:
> usar un gestor de contraseñas compartido o un enlace de un solo uso.

---

## Resumen para el área de TI

| Pregunta | Respuesta |
|---|---|
| ¿Qué se ejecuta en el servidor? | `git fetch` → `npm ci` → `npm run build` → `rsync`, disparado por cron cada minuto |
| ¿Con qué usuario? | Un usuario dedicado sin privilegios (`deploy`). No requiere `sudo` en operación |
| ¿Qué puertos entrantes abre? | **Ninguno.** Todo el tráfico es saliente TCP 443 |
| ¿Qué credenciales de Fiberlux viven en GitHub? | Ninguna. Las de SFTP que hay hoy se eliminan |
| ¿Qué credenciales viven en el servidor? | Una deploy key de **solo lectura** del repositorio y los tokens de lectura de TinaCMS. Ambos revocables en un clic |
| ¿Alguien de Twin Studios entra al servidor? | No. El servidor solo lee de GitHub; nadie externo necesita acceso |
| ¿Qué escribe en disco? | Solo `/opt/fiberlux/**` y el docroot del sitio. Nada más |
| ¿Qué pasa si el build falla? | No se publica nada. `rsync` es el último paso y el script aborta antes; el sitio en línea queda intacto y el error queda en el log |
| ¿Cómo corta Fiberlux el acceso? | `crontab -r` del usuario `deploy` detiene el ciclo de inmediato. La deploy key la revoca Twin Studios a pedido |
| ¿Ejecuta código de terceros? | Sí: las dependencias npm del proyecto, como cualquier build de frontend. Mitigado por `npm ci` (instala exactamente el lockfile versionado, sin resolver versiones nuevas) y por correr como usuario sin privilegios |

---

# Parte A — Twin Studios (desarrollo)

Se ejecuta desde la cuenta de GitHub que aloja el repositorio
(`sagarkishnani/fiberlux-corp`) y desde tina.io. No requiere acceso al servidor.

### A1. Confirmar la rama de despliegue

Hoy es `staging`, que se publica en `fiberlux.pe/staging/`. Se comunica a Fiberlux
antes de que empiecen: define lo que clonan (B6) y lo que observa el cron.

### A2. Registrar la deploy key que envíe Fiberlux — *entrega 1*

GitHub → repositorio → *Settings* → *Deploy keys* → *Add deploy key*. Se pega la
clave **pública** recibida y **no** se marca «Allow write access».

Una deploy key da acceso de solo lectura a este repositorio y a ningún otro. Nadie de
Fiberlux necesita cuenta de GitHub ni figurar como colaborador.

> **Alternativa si el egreso por el puerto 22 está bloqueado en Fiberlux:** en vez de
> la deploy key, se genera un fine-grained PAT con permiso *Contents: Read* únicamente
> sobre este repositorio, y se entrega junto con las variables del paso A3.

### A3. Entregar las variables de build — *entrega 2*

Por canal seguro. Son las que Fiberlux cargará en `deploy.env` (B7):

| Variable | Valor | Origen |
|---|---|---|
| `TINA_CLIENT_ID` | Client ID del proyecto | tina.io |
| `TINA_TOKEN` | Token de **solo lectura** | tina.io |
| `TINA_BRANCH` | `staging` | Debe coincidir con A1 y A4 |
| `PUBLIC_TURNSTILE_SITE_KEY` | Site key **pública** de Cloudflare Turnstile | Panel de Turnstile |
| `DEPLOY_BASE` | `/staging` | Vacío cuando el sitio pase a la raíz del dominio |

`PUBLIC_TURNSTILE_SITE_KEY` es pública por diseño (viaja en el HTML del sitio). Las
dos de Tina no lo son.

### A4. Alinear la rama en TinaCMS

tina.io → proyecto → *Configuration*: la rama debe ser la misma de A1.

Si Tina commitea a `main` y el servidor observa `staging`, el cliente guardará y
**nada se publicará, sin ningún error visible**. El valor por defecto en
`tina/config.ts` es `main`, así que para staging hay que fijarlo explícitamente aquí
y en `TINA_BRANCH`.

### A5. Entregar la plantilla del backend PHP

Si el docroot es nuevo y no tiene todavía `fiberlux-config.php`, se entrega
`public/config.example.php` como plantilla. Fiberlux la completa con **sus propias**
credenciales de SMTP y del panel de leads (B8). Twin Studios no necesita conocerlas.

### A6. Retirar el despliegue por SFTP — *después de la entrega 3*

Solo cuando Fiberlux confirme que el servidor publicó correctamente:

1. Eliminar el paso `Deploy via SFTP` de `.github/workflows/deploy.yml`.
2. Borrar los secretos `FTP_HOST`, `FTP_USER`, `FTP_PASS` y `FTP_SERVER_DIR`.
3. Conservar el workflow como verificación de build (`npm ci && npm run build`), para
   que un commit que rompa la compilación se detecte en GitHub y no en el servidor.
   Requiere mantener `TINA_CLIENT_ID`, `TINA_TOKEN` y `TURNSTILE_SITE_KEY`.

Hacerlo antes dejaría al sitio sin ningún camino de despliegue funcionando.

### A7. En operación

- **Publicar cambios de código:** `git push` a la rama de despliegue. El servidor lo
  toma en el siguiente minuto.
- **Rollback:** revertir el commit en la rama. El servidor aplica la reversión sola.
  No se toca el servidor para volver atrás.
- **Cambios de dependencias:** un `package-lock.json` modificado dispara un `npm ci`
  en el servidor y alarga ese despliegue en particular. Conviene avisarlo si es grande.

---

# Parte B — Fiberlux (infraestructura)

Se ejecuta dentro del servidor. No requiere cuenta de GitHub ni acceso al código
fuera del clon de solo lectura.

## Requisitos del servidor

| Requisito | Detalle |
|---|---|
| SO | Linux (Ubuntu 22.04 / Rocky 9 o equivalente) |
| Node.js | **20 LTS** (el build no está probado en otras versiones) |
| Paquetes | `git`, `rsync`, `cron` (o systemd timers) |
| Disco | **≥ 8 GB libres.** Medido: `node_modules` ≈ 3 GB, repo + historial ≈ 0.7 GB, `dist/` ≈ 140 MB, más el caché de npm |
| RAM | **4 GB recomendado.** `astro build` es el pico de consumo. Con 2 GB conviene añadir swap y fijar `NODE_OPTIONS=--max-old-space-size=3072` en `deploy.env` |
| Acceso al docroot | Escritura sobre el directorio que sirve el sitio |

### Salidas de red que deben estar permitidas (todas TCP 443)

| Destino | Para qué |
|---|---|
| `github.com`, `codeload.github.com` | clonar y consultar la rama |
| `registry.npmjs.org` | instalar dependencias |
| `*.tinajs.io`, `*.tina.io` | el build descarga el contenido publicado desde TinaCMS Cloud |

> Si la política de egreso bloquea SSH (22), avisar a Twin Studios: se usa el
> repositorio por HTTPS con un token de solo lectura en lugar de la deploy key.
> GitHub también acepta SSH sobre 443 vía `ssh.github.com`.
>
> Si no se permite el acceso directo a `registry.npmjs.org`, sirve igual un
> proxy/mirror interno (Verdaccio, Nexus, Artifactory) declarado en `.npmrc`. Lo que
> el build **no** puede es prescindir de un origen de paquetes.

## Instalación

### B1. Usuario y estructura

```bash
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /opt/fiberlux
sudo chown deploy:deploy /opt/fiberlux
sudo -iu deploy
```

### B2. Node 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git rsync
node -v    # debe imprimir v20.x
```

### B3. Generar la deploy key y enviar la pública — *entrega 1*

```bash
ssh-keygen -t ed25519 -C "deploy-fiberlux-server" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Se envía a Twin Studios **solo** la salida de ese `cat` (la clave pública). La clave
privada nunca sale del servidor. Esperar la confirmación de registro antes de clonar.

### B4. Clonar el repositorio

Con la rama que Twin Studios haya confirmado (A1):

```bash
git clone -b staging git@github.com:sagarkishnani/fiberlux-corp.git /opt/fiberlux/app
```

### B5. Variables de build — *usa la entrega 2*

Fuera del repo, solo legible por el usuario `deploy`:

```bash
cat > /opt/fiberlux/deploy.env <<'EOF'
TINA_CLIENT_ID=<entregado por Twin Studios>
TINA_TOKEN=<entregado por Twin Studios>
TINA_BRANCH=staging
PUBLIC_TURNSTILE_SITE_KEY=<entregado por Twin Studios>
DEPLOY_BASE=/staging
EOF
chmod 600 /opt/fiberlux/deploy.env
```

> Estas son variables de *build*. Los secretos del backend PHP viven aparte, en
> `fiberlux-config.php` dentro del docroot (B6), y este proceso nunca los toca ni los
> sobrescribe.

### B6. Secretos del backend PHP

Si el docroot todavía no tiene `fiberlux-config.php`, se crea a partir de la plantilla
`public/config.example.php` que entrega Twin Studios (A5), con las credenciales de
SMTP y del panel de leads de Fiberlux. Va **dentro del docroot**, nunca en el
repositorio, y el despliegue está configurado para no sobrescribirlo jamás.

### B7. Instalar el script de despliegue

El script viene versionado en el repositorio, en `scripts/server-deploy.sh`. Se copia
fuera del repo porque cada despliegue reescribe el árbol de trabajo:

```bash
cp /opt/fiberlux/app/scripts/server-deploy.sh /opt/fiberlux/deploy.sh
chmod +x /opt/fiberlux/deploy.sh
sudo touch /var/log/fiberlux-deploy.log
sudo chown deploy:deploy /var/log/fiberlux-deploy.log
```

Ajustar en `/opt/fiberlux/deploy.sh` las tres rutas de la cabecera: `BRANCH`,
`REPO_DIR` y sobre todo **`DOCROOT`**.

### B8. Primera corrida manual

Antes de automatizar nada. `FORCE=1` es imprescindible aquí: recién clonado, el repo
ya está en el último commit, así que sin forzar el script saldría con "sin cambios" y
el docroot quedaría vacío.

```bash
sudo -iu deploy env FORCE=1 /opt/fiberlux/deploy.sh
tail -30 /var/log/fiberlux-deploy.log
```

Si termina con `publicado <sha>` y el sitio se ve correctamente, **avisar a Twin
Studios** — es la *entrega 3*, y habilita el retiro del despliegue por SFTP (A6).

### B9. Cron

```bash
sudo -iu deploy crontab -e
```

```cron
* * * * * /usr/bin/flock -n /tmp/fiberlux-deploy.lock /opt/fiberlux/deploy.sh
```

`flock -n` es obligatorio: sin él, dos builds simultáneos escribirían el docroot a la
vez. Con él, mientras un despliegue corre las ejecuciones siguientes se descartan.

### B10. Rotación de log

```bash
sudo tee /etc/logrotate.d/fiberlux-deploy <<'EOF'
/var/log/fiberlux-deploy.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
  copytruncate
}
EOF
```

### B11. Alertas

Ver la sección **Monitoreo**. Es responsabilidad de Fiberlux porque el modo de falla
—que el despliegue se detenga en silencio— solo es visible desde el servidor.

---

## Qué hace el script

`scripts/server-deploy.sh`, en orden. Corre con `set -euo pipefail`: cualquier paso
que falle aborta el resto.

1. `git fetch` y compara `HEAD` con `origin/<rama>`. Si son iguales y no hay `FORCE=1`,
   termina sin hacer nada (es el caso del 99 % de las corridas).
2. `git reset --hard origin/<rama>`. No `pull`: el build escribe sobre archivos
   versionados (`tina/__generated__/`) y un `pull` fallaría por árbol sucio.
3. Carga `deploy.env`.
4. `npm ci` **solo** si cambió `package-lock.json` o no existe `node_modules`. Es lo
   que mantiene el ciclo típico en ~1–2 minutos en vez de varios.
5. `npm run build` (`tinacms build && astro build`).
6. `rsync -a --delete ./dist/ <docroot>/`, preservando:

| Ruta | Por qué se preserva |
|---|---|
| `data/**` | Envíos de formularios y `counter.json` |
| `uploads/**` | Adjuntos subidos por los usuarios |
| `fiberlux-config.php` | Secretos de SMTP y del panel, cargados por Fiberlux |

Los `.htaccess` de `data/` y `uploads/` sí se sincronizan: viajan en `dist/` y son los
que bloquean el acceso web a esas carpetas.

Como `rsync` es el último paso, **un build roto nunca llega a publicarse**: el sitio
anterior sigue servido y el error queda en el log.

---

## Si el servidor de build NO es el servidor web

Cambiar el paso de publicación del script por un `rsync` sobre SSH dentro de la red,
con las mismas exclusiones:

```bash
rsync -a --delete -e ssh \
  --include='/data/.htaccess'    --exclude='/data/**' \
  --include='/uploads/.htaccess' --exclude='/uploads/**' \
  --exclude='/fiberlux-config.php' \
  ./dist/ deploy@servidor-web:/var/www/fiberlux.pe/staging/
```

Requiere una clave SSH del usuario `deploy` autorizada en el servidor web. Es la
variante preferible si el servidor web es una máquina endurecida donde no se quiere
instalar Node ni dar egreso a internet: el build queda en una máquina interna y el
servidor web solo recibe archivos estáticos.

---

## Verificación conjunta

Se corre una vez, con ambos equipos disponibles.

| Prueba | Quién la dispara | Resultado esperado |
|---|---|---|
| Push de un cambio menor a la rama | Twin Studios | En ≤ 2 min el cambio está online; el log muestra `publicado <sha>` |
| Guardar un texto en Tina | Twin Studios o el cliente | Mismo resultado — Tina commitea a la rama y el ciclo es idéntico |
| Enviar un formulario del sitio | Cualquiera | Llega el correo y el registro aparece en el panel de leads |
| Desplegar tras un envío de formulario | Twin Studios | Los envíos anteriores y los adjuntos **siguen ahí** |
| `ls` del docroot tras desplegar | Fiberlux | `fiberlux-config.php` sigue presente |
| Romper el build a propósito y pushear | Twin Studios | El log muestra el error y **el sitio no cambia** |

Las cuatro últimas verifican lo único que puede causar pérdida de datos o caída en
este esquema.

---

## Monitoreo — Fiberlux

El modo de falla de este esquema no es una caída: es que **deje de publicar en
silencio**. El cliente seguiría editando en Tina creyendo que publicó. Dos chequeos
bastan, ambos sobre el log:

**¿Sigue vivo el cron?** El script escribe una línea en cada corrida, haya cambios o
no. Si el log no se ha tocado en 10 minutos, algo se detuvo:

```bash
# alerta si el log lleva más de 10 min sin escribirse
[ -z "$(find /var/log/fiberlux-deploy.log -mmin -10)" ] && echo "ALERTA: despliegue Fiberlux detenido"
```

**¿Está fallando el build?** Un despliegue sano abre con `nuevo commit <sha>` y cierra
con `publicado <sha>`. Un `nuevo commit` sin su `publicado` es un build roto — ahí el
aviso va a Twin Studios, porque el problema está en el código, no en el servidor:

```bash
tail -100 /var/log/fiberlux-deploy.log | grep -c 'nuevo commit'   # comparar contra…
tail -100 /var/log/fiberlux-deploy.log | grep -c 'publicado'      # …este número
```

Cualquiera de los dos se puede enganchar al sistema de alertas que ya use Fiberlux
(Zabbix, Nagios, un cron con `mail`).

---

## Operación en marcha

| Situación | Actúa | Qué ocurre |
|---|---|---|
| Cambio de código | Twin Studios | `git push` a la rama; el servidor publica en ≤ 2 min |
| Cambio de contenido | El cliente, en TinaCMS | Tina commitea a la rama; el ciclo es el mismo |
| Un cambio no aparece en el sitio | Fiberlux revisa el log | Si el cron está detenido, es del servidor; si el build falla, avisa a Twin Studios |
| Hay que volver atrás | Twin Studios | Revierte el commit en la rama; el servidor lo aplica solo |
| Mantenimiento o migración del servidor | Fiberlux | Al volver, el primer cron republica el estado actual de la rama |
| Rotar la deploy key o los tokens de Tina | Ambos | Fiberlux genera la clave nueva; Twin Studios registra y revoca la anterior |
| Paso a producción | Ambos, coordinado | Ver la sección siguiente |

---

## Paso a producción (cutover)

Cuando el dominio deje de servir el WordPress y el sitio pase a la raíz, cambian tres
cosas y ninguna requiere reinstalar nada:

| Acción | Responsable |
|---|---|
| Cambiar la rama del proyecto en tina.io a `main` | Twin Studios |
| Confirmar la nueva rama de despliegue y el `DEPLOY_BASE` vacío | Twin Studios |
| En `deploy.env`: `DEPLOY_BASE=` vacío y `TINA_BRANCH=main` | Fiberlux |
| En `/opt/fiberlux/deploy.sh`: `BRANCH="main"` y `DOCROOT` a la raíz del dominio | Fiberlux |
| Corrida con `FORCE=1` para publicar de inmediato | Fiberlux |

Si se quiere conservar staging en paralelo, se duplica la instalación completa
(`/opt/fiberlux-staging/`, su propio clon, su `deploy.env` y su entrada de cron con
otro `flock`).

---

## Puntos de atención

**`TINA_BRANCH` y la rama del cron deben coincidir.** Es la causa más probable de un
"guardé en Tina y no salió" sin ningún error a la vista. Se fija en tres lugares:
tina.io (A4), `deploy.env` (B5) y la cabecera del script (B7).

**`DOCROOT` debe apuntar al subdirectorio exacto.** El script usa `rsync --delete`.
Apuntado a la raíz del dominio mientras ahí viva el WordPress, lo borraría.

**El primer `npm ci` es el más lento.** Descarga ~3 GB de dependencias; en una
conexión corporativa normal toma varios minutos. Las corridas siguientes lo saltan
salvo que cambie `package-lock.json`.

**Rollback.** Volver a un estado anterior es revertir el commit en la rama; el
servidor lo aplica en el siguiente minuto. Para una emergencia, en el servidor:
`git reset --hard <sha>` seguido de `FORCE=1 /opt/fiberlux/deploy.sh` — pero atención:
el siguiente cron detectará el commit de la rama y volverá a publicarlo. El rollback
real es siempre revertir en la rama.

**No editar el script dentro del repo.** Cron debe apuntar a `/opt/fiberlux/deploy.sh`,
la copia fuera del árbol de trabajo. `git reset --hard` reescribe el archivo en
caliente y bash, que lee el script por partes, se rompe a mitad de ejecución.
