# Despliegue desde servidor propio (modelo pull)

Guía de configuración para el equipo de infraestructura de Fiberlux.

## Qué resuelve

Hoy el despliegue lo hace GitHub Actions por SFTP, lo que exige exponer el servidor
o pasar por VPN, y guardar credenciales del servidor en GitHub. Con este modelo se
invierte la dirección: **el servidor consulta el repositorio**, y cuando detecta un
commit nuevo en la rama, construye y publica él mismo.

- **Cero puertos entrantes.** Todo el tráfico es saliente HTTPS.
- **Cero credenciales del servidor en GitHub.** GitHub no conoce ni alcanza al servidor.
- **Un solo disparador para todo.** Un `git push` del desarrollador y un guardado en
  TinaCMS producen ambos un commit en la rama; el servidor no distingue entre ellos.

```
push del dev ─────┐
                  ├─▶ commit en rama `staging` ─▶ [GitHub]
Tina: editor      │                                   ▲
guarda ───────────┘                                   │ git fetch cada minuto (443 saliente)
                                                      │
                                              [Servidor Fiberlux]
                                              build → rsync → docroot
```

---

## Requisitos del servidor

| Requisito | Detalle |
|---|---|
| SO | Linux (Ubuntu 22.04 / Rocky 9 o equivalente) |
| Node.js | **20 LTS** (el build no está probado en otras versiones) |
| Paquetes | `git`, `rsync`, `cron` (o systemd timers) |
| Disco | ~2 GB (repo + `node_modules` + build) |
| RAM | 2 GB mínimo — `astro build` es el pico de consumo |
| Acceso al docroot | Escritura sobre el directorio que sirve el sitio |

### Salidas de red que deben estar permitidas (todas TCP 443)

| Destino | Para qué |
|---|---|
| `github.com`, `codeload.github.com` | clonar y consultar la rama |
| `registry.npmjs.org` | instalar dependencias |
| `*.tinajs.io`, `*.tina.io` | el build descarga el contenido publicado desde TinaCMS Cloud |

> Si la política de egreso bloquea SSH (22), usar el repositorio por **HTTPS** con un
> token de solo lectura en vez de una deploy key SSH. GitHub también acepta SSH sobre
> 443 vía `ssh.github.com`.

---

## Instalación

### 1. Usuario y estructura

```bash
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /opt/fiberlux
sudo chown deploy:deploy /opt/fiberlux
sudo -iu deploy
```

### 2. Node 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git rsync
node -v    # debe imprimir v20.x
```

### 3. Acceso de solo lectura al repositorio

**Opción A — Deploy key SSH (recomendada).** Da acceso de solo lectura a este repo
y a ningún otro:

```bash
ssh-keygen -t ed25519 -C "deploy-fiberlux-server" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

La clave **pública** se registra en GitHub → repo → *Settings* → *Deploy keys* →
*Add deploy key*, **sin** marcar "Allow write access".

**Opción B — HTTPS con token de solo lectura**, si el egreso por 22 está bloqueado.
Se usa un fine-grained PAT con permiso *Contents: Read* únicamente, guardado en
`~/.git-credentials` con permisos `600`.

### 4. Clonar el repositorio

```bash
git clone -b staging git@github.com:sagarkishnani/fiberlux-corp.git /opt/fiberlux/app
```

### 5. Variables de build

Fuera del repo, solo legible por el usuario `deploy`:

```bash
cat > /opt/fiberlux/deploy.env <<'EOF'
TINA_CLIENT_ID=<client id de TinaCMS Cloud>
TINA_TOKEN=<read-only token de TinaCMS Cloud>
TINA_BRANCH=staging
PUBLIC_TURNSTILE_SITE_KEY=<site key PÚBLICA de Cloudflare Turnstile>
DEPLOY_BASE=/staging
EOF
chmod 600 /opt/fiberlux/deploy.env
```

> `DEPLOY_BASE` define el subdirectorio bajo el que se sirve el sitio. Mientras
> staging viva en `fiberlux.pe/staging/` debe valer `/staging`. En el paso a
> producción en la raíz del dominio, se deja **vacío**.
>
> Estas variables son de *build*. Los secretos del backend PHP (SMTP, panel,
> Turnstile secret) viven aparte, en `fiberlux-config.php` dentro del docroot, y
> este proceso nunca los toca ni los sobrescribe.

### 6. Instalar el script de despliegue

El script vive versionado en `scripts/server-deploy.sh`. Se copia fuera del repo
porque cada despliegue reescribe el árbol de trabajo:

```bash
cp /opt/fiberlux/app/scripts/server-deploy.sh /opt/fiberlux/deploy.sh
chmod +x /opt/fiberlux/deploy.sh
sudo touch /var/log/fiberlux-deploy.log
sudo chown deploy:deploy /var/log/fiberlux-deploy.log
```

Ajustar en `/opt/fiberlux/deploy.sh` las tres rutas de la cabecera: `BRANCH`,
`REPO_DIR` y sobre todo **`DOCROOT`**.

### 7. Primera corrida manual

Antes de automatizar nada. `FORCE=1` es imprescindible aquí: recién clonado, el repo
ya está en el último commit, así que sin forzar el script saldría con "sin cambios" y
el docroot quedaría vacío.

```bash
sudo -iu deploy env FORCE=1 /opt/fiberlux/deploy.sh
tail -30 /var/log/fiberlux-deploy.log
```

### 8. Cron

```bash
sudo -iu deploy crontab -e
```

```cron
* * * * * /usr/bin/flock -n /tmp/fiberlux-deploy.lock /opt/fiberlux/deploy.sh
```

`flock -n` es obligatorio: sin él, dos builds simultáneos escribirían el docroot a la
vez. Con él, mientras un despliegue corre las ejecuciones siguientes se descartan.

### 9. Rotación de log

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

---

## Si el servidor de build NO es el servidor web

Cambiar el paso 6 del script por un `rsync` sobre SSH dentro de la red, con las
mismas exclusiones:

```bash
rsync -a --delete -e ssh \
  --include='/data/.htaccess'    --exclude='/data/**' \
  --include='/uploads/.htaccess' --exclude='/uploads/**' \
  --exclude='/fiberlux-config.php' \
  ./dist/ deploy@servidor-web:/var/www/fiberlux.pe/staging/
```

Requiere una clave SSH del usuario `deploy` autorizada en el servidor web.

---

## Verificación

| Prueba | Resultado esperado |
|---|---|
| Push de un cambio menor a `staging` | En ≤ 2 min el cambio está online; el log muestra `publicado <sha>` |
| Guardar un texto en Tina | Mismo resultado — Tina commitea a la rama y el ciclo es idéntico |
| Enviar un formulario del sitio | Llega el correo y el registro aparece en el panel de leads |
| Desplegar tras un envío de formulario | Los envíos anteriores y los adjuntos **siguen ahí** |
| `ls` del docroot tras desplegar | `fiberlux-config.php` sigue presente |

Las tres últimas verifican lo único que puede causar pérdida de datos en este
esquema; conviene correrlas la primera vez.

---

## Puntos de atención

**`TINA_BRANCH` y la rama del cron deben coincidir.** Si Tina commitea a `main` y el
servidor observa `staging`, los editores guardarán y nada se publicará, sin error
visible. Hoy el valor por defecto en `tina/config.ts` es `main`; para staging hay que
fijarlo explícitamente a `staging` **tanto en `deploy.env` como en el proyecto de
tina.io**.

**`DOCROOT` debe apuntar al subdirectorio exacto.** El script usa `rsync --delete`.
Apuntado a la raíz del dominio mientras ahí viva el WordPress, lo borraría.

**Fallos silenciosos.** Si el servidor se apaga o el cron se detiene, no falla nada:
simplemente deja de publicar, y el cliente seguirá editando en Tina creyendo que
publicó. Conviene una alerta sobre `/var/log/fiberlux-deploy.log` o un chequeo de
antigüedad del último despliegue.

**Rollback.** Volver a un estado anterior es revertir el commit en la rama; el
servidor lo aplica en el siguiente minuto. Para una emergencia, en el servidor:
`git reset --hard <sha>` seguido de `FORCE=1 /opt/fiberlux/deploy.sh` — pero atención:
el siguiente cron detectará el commit de la rama y volverá a publicarlo. El rollback
real es siempre revertir en la rama.

---

## Qué cambia en GitHub Actions

Con este modelo, el workflow deja de desplegar. Una vez que el servidor esté
verificado y publicando:

1. Eliminar el paso `Deploy via SFTP` de `.github/workflows/deploy.yml`.
2. Borrar los secretos `FTP_HOST`, `FTP_USER`, `FTP_PASS` y `FTP_SERVER_DIR` del
   repositorio.
3. Conservar el workflow como verificación de build (`npm ci && npm run build`) para
   que un commit que rompa la compilación se detecte en GitHub y no en el servidor.
   Requiere mantener `TINA_CLIENT_ID`, `TINA_TOKEN` y `TURNSTILE_SITE_KEY`.

> No hacer estos tres pasos antes de la primera publicación exitosa del servidor: es
> lo que mantiene el camino de despliegue actual funcionando mientras tanto.
