# Despliegue del sitio web en servidor propio

**Guía para el área de TI de Fiberlux.** Preparada por Twin Studios (proveedor de
desarrollo del sitio).

Este documento contiene únicamente lo que se ejecuta dentro del servidor de Fiberlux.
Lo que ocurre del lado del repositorio y del gestor de contenido lo administra el
proveedor y no requiere ninguna acción de TI.

---

## El modelo en una frase

El servidor de Fiberlux **consulta el repositorio cada minuto**; cuando detecta un
cambio publicado, construye el sitio y lo deja en su propio docroot.

```
Cambios del proveedor ──┐
                        ├─▶ repositorio (GitHub)
Cambios de contenido ───┘              ▲
del cliente                            │ git fetch cada minuto
                                       │ TCP 443 SALIENTE
                           ┌───────────┼──────────────────────┐
                           │  RED DE FIBERLUX                 │
                           │  servidor → build → docroot      │
                           └──────────────────────────────────┘
```

La flecha sube: la iniciativa parte siempre del servidor. **Ninguna conexión cruza el
borde hacia adentro**, ni siquiera por VPN.

Esto reemplaza el esquema actual, en el que una máquina externa (GitHub Actions)
entra al servidor por SFTP para dejar el sitio.

**Rama a desplegar: `main`.** El sitio se publica en la raíz del docroot.

---

## Resumen de seguridad

| Pregunta | Respuesta |
|---|---|
| ¿Qué se ejecuta en el servidor? | `git fetch` → `npm ci` → `npm run build` → `rsync`, disparado por cron cada minuto |
| ¿Con qué usuario? | Un usuario dedicado sin privilegios (`deploy`). No requiere `sudo` en operación |
| ¿Qué puertos entrantes abre? | **Ninguno.** Todo el tráfico es saliente TCP 443 |
| ¿Requiere VPN o exponer el servidor? | No. Ese es precisamente el problema que elimina |
| ¿Qué credenciales de Fiberlux salen de la red? | Ninguna. Las credenciales SFTP que hoy están cargadas en GitHub se eliminan |
| ¿Qué credenciales entran al servidor? | Una llave de solo lectura del repositorio y dos tokens de lectura del gestor de contenido. Todos revocables de inmediato |
| ¿Alguien externo accede al servidor? | No. El servidor solo lee del repositorio; el proveedor nunca necesita acceso a la máquina |
| ¿Qué escribe en disco? | Solo `/opt/fiberlux/**` y el docroot del sitio. Nada más |
| ¿Qué pasa si el build falla? | No se publica nada. `rsync` es el último paso y el proceso aborta antes: el sitio en línea queda intacto y el error queda en el log |
| ¿Cómo se detiene todo el proceso? | `crontab -r` del usuario `deploy`. Efecto inmediato, sin coordinación con nadie |
| ¿Ejecuta código de terceros? | Sí: las dependencias del proyecto, como cualquier build de frontend. Mitigado por `npm ci`, que instala exactamente el listado de versiones fijado en el repositorio sin resolver versiones nuevas, y por correr como usuario sin privilegios |

---

## Requisitos del servidor

| Requisito | Detalle |
|---|---|
| Sistema operativo | Linux — Ubuntu 22.04, Rocky 9 o equivalente |
| Node.js | **20 LTS.** El build no está probado en otras versiones |
| Paquetes | `git`, `rsync`, `cron` (o systemd timers) |
| Disco | **≥ 8 GB libres.** Medido: dependencias ≈ 3 GB, repositorio con historial ≈ 0.7 GB, sitio compilado ≈ 140 MB, más el caché de paquetes |
| RAM | **4 GB recomendado.** La compilación es el pico de consumo. Con 2 GB conviene añadir swap y fijar `NODE_OPTIONS=--max-old-space-size=3072` |
| Docroot | Permiso de escritura sobre el directorio que sirve el sitio |

### Salidas de red requeridas — todas TCP 443

| Destino | Para qué |
|---|---|
| `github.com`, `codeload.github.com` | Clonar el repositorio y consultar la rama |
| `registry.npmjs.org` | Instalar las dependencias del proyecto |
| `*.tinajs.io`, `*.tina.io` | Descargar el contenido publicado del gestor de contenido |

No hace falta ninguna regla de entrada.

> **Si el puerto 22 saliente está bloqueado:** avisar al proveedor. En lugar de una
> llave SSH se entrega un token de solo lectura y el repositorio se clona por HTTPS.
> GitHub también acepta SSH sobre el 443 vía `ssh.github.com`.
>
> **Si no se permite el acceso directo a `registry.npmjs.org`:** sirve igual un
> proxy interno (Verdaccio, Nexus, Artifactory) declarado en `.npmrc`. Lo que el
> build no puede es prescindir de un origen de paquetes.

---

## Coordinación con el proveedor

Solo hay tres intercambios. El resto es autónomo.

| # | Momento | TI | Proveedor |
|---|---|---|---|
| 1 | Paso 3 | Envía la clave **pública** SSH generada en el servidor | La registra como llave de solo lectura del repositorio y confirma |
| 2 | Antes del paso 5 | Recibe las variables de build | Las entrega por canal seguro (gestor de contraseñas o enlace de un solo uso) |
| 3 | Paso 8 | Avisa que la primera publicación fue correcta | Retira el despliegue por SFTP y elimina las credenciales del servidor de GitHub |

Las variables que entrega el proveedor (intercambio 2) son cinco: `TINA_CLIENT_ID`,
`TINA_TOKEN`, `TINA_BRANCH`, `PUBLIC_TURNSTILE_SITE_KEY` y `DEPLOY_BASE`. Se usan en
el paso 5.

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

### 3. Llave de acceso al repositorio — *intercambio 1*

```bash
ssh-keygen -t ed25519 -C "deploy-fiberlux-server" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Se envía al proveedor **solo la salida de ese `cat`**: la clave pública. La clave
privada nunca sale del servidor. Esperar la confirmación de registro antes de clonar.

La llave que el proveedor registra es de **solo lectura** y da acceso a ese
repositorio y a ningún otro. TI no necesita cuenta de GitHub.

### 4. Clonar el repositorio

```bash
git clone -b main git@github.com:sagarkishnani/fiberlux-corp.git /opt/fiberlux/app
```

### 5. Variables de build — *usa el intercambio 2*

Fuera del repositorio, legible solo por el usuario `deploy`:

```bash
cat > /opt/fiberlux/deploy.env <<'EOF'
TINA_CLIENT_ID=<entregado por el proveedor>
TINA_TOKEN=<entregado por el proveedor>
TINA_BRANCH=main
PUBLIC_TURNSTILE_SITE_KEY=<entregado por el proveedor>
DEPLOY_BASE=
EOF
chmod 600 /opt/fiberlux/deploy.env
```

`DEPLOY_BASE` va **vacío**: el sitio se publica en la raíz del docroot. Solo lleva
valor si el sitio colgara de un subdirectorio, y en ese caso lo indica el proveedor.

Estas son variables de *compilación*. Los secretos del backend de correo son otra
cosa y se cargan en el paso 6.

### 6. Secretos del backend de correo

Los formularios del sitio (contacto, reclamos, libro de reclamaciones) los procesa un
backend PHP que necesita credenciales SMTP y las del panel de leads. Viven en un
archivo llamado `fiberlux-config.php` **dentro del docroot**, nunca en el repositorio.

Si el docroot es nuevo y aún no lo tiene, se crea a partir de la plantilla
`public/config.example.php` del repositorio, con las credenciales de Fiberlux. El
despliegue está configurado para **no sobrescribirlo jamás**.

### 7. Instalar el script de despliegue

El script viene versionado en el repositorio. Se copia fuera del clon porque cada
despliegue reescribe el árbol de trabajo:

```bash
cp /opt/fiberlux/app/scripts/server-deploy.sh /opt/fiberlux/deploy.sh
chmod +x /opt/fiberlux/deploy.sh
sudo touch /var/log/fiberlux-deploy.log
sudo chown deploy:deploy /var/log/fiberlux-deploy.log
```

Ajustar las tres rutas de la cabecera de `/opt/fiberlux/deploy.sh`:

```bash
BRANCH="main"                              # el valor por defecto del archivo es "staging"
REPO_DIR="/opt/fiberlux/app"
DOCROOT="<ruta real del docroot del sitio>"
```

> **`DOCROOT` es el parámetro más delicado de toda la instalación.** El script
> publica con `rsync --delete`: todo lo que haya en ese directorio y no provenga del
> sitio compilado **se borra**, con tres únicas excepciones (`data/`, `uploads/` y
> `fiberlux-config.php`). Debe apuntar a un directorio que contenga exclusivamente
> este sitio. Si ahí todavía vive otro contenido —por ejemplo un WordPress— la
> primera corrida lo eliminaría. Verificar el valor antes del paso 8.

### 8. Primera corrida manual — *intercambio 3*

Antes de automatizar nada. `FORCE=1` es imprescindible: recién clonado, el repositorio
ya está en el último cambio, así que sin forzar el script terminaría con "sin cambios"
y el docroot quedaría vacío.

```bash
sudo -iu deploy env FORCE=1 /opt/fiberlux/deploy.sh
tail -30 /var/log/fiberlux-deploy.log
```

Si termina con `publicado <sha>` y el sitio se ve correctamente, avisar al proveedor:
ese aviso habilita el retiro del despliegue por SFTP.

### 9. Cron

```bash
sudo -iu deploy crontab -e
```

```cron
* * * * * /usr/bin/flock -n /tmp/fiberlux-deploy.lock /opt/fiberlux/deploy.sh
```

`flock -n` es obligatorio: sin él, dos compilaciones simultáneas escribirían el
docroot a la vez. Con él, mientras un despliegue corre, las ejecuciones siguientes se
descartan.

### 10. Rotación de log

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

### 11. Alertas

Ver la sección **Monitoreo**.

---

## Qué hace el script

`/opt/fiberlux/deploy.sh`, en orden. Corre con `set -euo pipefail`: cualquier paso que
falle aborta el resto.

1. `git fetch` y compara la copia local con la rama remota. Si son iguales y no hay
   `FORCE=1`, termina sin hacer nada — el caso del 99 % de las corridas, que por eso
   son de milisegundos.
2. `git reset --hard` sobre la rama. No `pull`: la compilación escribe sobre archivos
   versionados y un `pull` fallaría por árbol sucio.
3. Carga `/opt/fiberlux/deploy.env`.
4. `npm ci`, **solo** si cambió el listado de dependencias o no existe `node_modules`.
   Es lo que mantiene el ciclo típico en uno o dos minutos.
5. `npm run build` — compila el sitio estático completo.
6. `rsync -a --delete` del sitio compilado al docroot.

### Lo que `rsync` nunca toca

| Ruta | Por qué se preserva |
|---|---|
| `data/**` | Envíos de formularios y contador de tickets |
| `uploads/**` | Adjuntos subidos por los usuarios del sitio |
| `fiberlux-config.php` | Credenciales SMTP y del panel de leads |

Los `.htaccess` de `data/` y `uploads/` sí se sincronizan: son los que bloquean el
acceso web a esas carpetas y viajan con el sitio compilado.

Como `rsync` es el último paso, **una compilación fallida nunca llega a publicarse**:
el sitio anterior sigue servido y el error queda en el log.

---

## Si el servidor de build no es el servidor web

Es una variante válida y preferible si el servidor web es una máquina endurecida
donde no se quiere instalar Node ni abrir egreso a internet. Se cambia el paso de
publicación del script por un `rsync` sobre SSH dentro de la red, con las mismas
exclusiones:

```bash
rsync -a --delete -e ssh \
  --include='/data/.htaccess'    --exclude='/data/**' \
  --include='/uploads/.htaccess' --exclude='/uploads/**' \
  --exclude='/fiberlux-config.php' \
  ./dist/ deploy@servidor-web:<ruta del docroot>/
```

Requiere una clave SSH del usuario `deploy` autorizada en el servidor web. El
servidor web solo recibe archivos estáticos; no necesita Node, ni git, ni salida a
internet.

---

## Monitoreo

El modo de falla de este esquema no es una caída: es que **deje de publicar en
silencio**. El sitio seguiría en línea con la última versión publicada, y el cliente
seguiría editando contenido creyendo que sale. Dos chequeos bastan, ambos sobre el log.

**¿Sigue vivo el cron?** El script escribe una línea en cada corrida, haya cambios o
no. Si el log no se ha tocado en diez minutos, algo se detuvo:

```bash
# alerta si el log lleva más de 10 min sin escribirse
[ -z "$(find /var/log/fiberlux-deploy.log -mmin -10)" ] && echo "ALERTA: despliegue Fiberlux detenido"
```

**¿Está fallando la compilación?** Un despliegue sano abre con `nuevo commit <sha>` y
cierra con `publicado <sha>`. Un `nuevo commit` sin su `publicado` es una compilación
rota:

```bash
tail -100 /var/log/fiberlux-deploy.log | grep -c 'nuevo commit'   # comparar contra…
tail -100 /var/log/fiberlux-deploy.log | grep -c 'publicado'      # …este número
```

Cualquiera de los dos se engancha al sistema de alertas que ya use Fiberlux (Zabbix,
Nagios, un cron con `mail`).

---

## Operación y escalamiento

| Situación | Es de… | Acción |
|---|---|---|
| El log muestra `publicado <sha>` y el sitio se ve bien | — | Operación normal |
| El log no se actualiza | **TI** | Revisar cron, el usuario `deploy` y el espacio en disco |
| Falla `git fetch` | **TI** | Revisar egreso 443 y la llave SSH. Si la llave fue revocada, escalar al proveedor |
| Falla `npm ci` | **TI** | Revisar egreso a `registry.npmjs.org` o al proxy interno |
| `npm run build` falla | **Proveedor** | Enviar las últimas 40 líneas del log. El problema está en el código, no en el servidor. El sitio en línea no se ve afectado |
| El sitio no refleja un cambio de contenido | **Proveedor** | Verificar primero que el log esté corriendo sin errores |
| Hay que volver a una versión anterior | **Proveedor** | Se revierte en el repositorio y el servidor lo aplica solo. **No se toca el servidor para hacer rollback** |
| Mantenimiento o migración del servidor | **TI** | Al volver, el primer cron republica el estado actual. No requiere aviso |
| Rotar la llave o los tokens | Ambos | TI genera la llave nueva; el proveedor registra la nueva y revoca la anterior |

---

## Puntos críticos

**`DOCROOT` mal apuntado borra contenido.** Ver la advertencia del paso 7. Es el único
riesgo de pérdida de datos de todo el esquema, y solo existe en la primera corrida.

**No editar el script dentro del clon.** Cron debe apuntar a `/opt/fiberlux/deploy.sh`,
la copia fuera del árbol de trabajo. `git reset --hard` reescribe el archivo del clon
en caliente y bash, que lee el script por partes, se rompe a mitad de ejecución.

**El primer `npm ci` es el más lento.** Descarga cerca de 3 GB de dependencias; en una
conexión corporativa normal toma varios minutos. Las corridas siguientes lo saltan
salvo que cambie el listado de dependencias.

**El script por defecto apunta a `staging`.** La cabecera del archivo versionado trae
`BRANCH="${DEPLOY_BRANCH:-staging}"`. Hay que fijarlo en `main` (paso 7) y que
coincida con `TINA_BRANCH=main` de `deploy.env` (paso 5). Si no coinciden, el sitio
deja de recibir los cambios de contenido sin ningún error visible.

---

## Checklist de puesta en marcha

- [ ] Servidor aprovisionado: Linux, Node 20, `git`, `rsync`, `cron`
- [ ] 8 GB de disco libres y 4 GB de RAM (o swap configurado)
- [ ] Egreso TCP 443 habilitado a GitHub, npm y el gestor de contenido
- [ ] Usuario `deploy` creado y `/opt/fiberlux` con su propiedad
- [ ] Clave pública SSH enviada al proveedor y registro confirmado
- [ ] Repositorio clonado en `/opt/fiberlux/app` sobre la rama `main`
- [ ] `deploy.env` creado con las cinco variables y permisos `600`
- [ ] `fiberlux-config.php` presente en el docroot
- [ ] `deploy.sh` copiado a `/opt/fiberlux/`, con `BRANCH="main"` y **`DOCROOT` verificado**
- [ ] Primera corrida con `FORCE=1` exitosa y sitio visible
- [ ] Aviso enviado al proveedor
- [ ] Cron activo con `flock`
- [ ] `logrotate` configurado
- [ ] Alertas de log enganchadas al monitoreo de Fiberlux
