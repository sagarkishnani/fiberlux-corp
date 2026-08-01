# SPEC 87 — Zona horaria de los leads en America/Lima

> **Estado:** Draft
> **Depende de:** SPEC 86 (panel) y SPEC 85 (backend)
> **Fecha:** 2026-08-01
> **Objetivo:** Que toda fecha de lead que se muestre o se exporte esté en hora de Perú, incluidos los registros ya guardados.

> **Homologación:** porta la SPEC 04 de `fiberlux-negocios`, adaptada a `panel-leads.php` de corp.

---

## Por qué existe esta spec

`send-email.php:252` guarda la fecha con `date('Y-m-d H:i:s')`, que usa la zona horaria del servidor. Si el hosting está en GMT+0, un lead recibido a las 20:00 hora de Perú queda registrado como la 01:00 del día siguiente. El panel y el CSV vuelcan ese campo tal cual, así que las fechas aparecen adelantadas y algunos leads con el día equivocado.

La línea siguiente, `send-email.php:253`, guarda `'timestamp' => time()`, que es epoch e independiente de la zona. Ese campo siempre ha sido correcto, también en los registros antiguos, y ya se usa para ordenar. Es la base de la corrección.

---

## Alcance

**Entra:**

- El panel y el CSV derivan la fecha del campo `timestamp` convertido a `America/Lima`.
- El filtro por rango de fechas compara contra esa fecha local, no contra el `date` crudo.
- `send-email.php` fija `America/Lima` para que el `date` de los registros nuevos quede correcto (y, tras SPEC 86, para que `data/deleted.log` registre en hora de Perú).
- Camino de reserva para registros sin `timestamp`: interpretar `date` como UTC y convertir.

**Fuera de alcance:**

- Reescribir el campo `date` de los JSON ya guardados (no hace falta: al derivar de `timestamp` se muestran bien).
- La hora en el cuerpo de los correos.
- La fecha del nombre de archivo del CSV (`leads-<fecha>.csv`), que es cosmética.
- Zona horaria configurable (queda fija en `America/Lima`).

---

## Modelo de datos

Sin cambios en disco. Cada submission ya guarda ambos campos:

```php
'date'      => date('Y-m-d H:i:s'),   // hora del servidor
'timestamp' => time(),                // epoch, fuente de verdad
```

En el panel, la fecha se calcula al renderizar, en PHP (no en JS, para no depender de la zona del navegador):

```php
function localDate(array $s): string {
    $tz = new DateTimeZone('America/Lima');
    if (!empty($s['timestamp'])) {
        return (new DateTime('@' . $s['timestamp']))->setTimezone($tz)->format('Y-m-d H:i:s');
    }
    if (!empty($s['date'])) {   // reserva: registros sin timestamp
        return (new DateTime($s['date'], new DateTimeZone('UTC')))->setTimezone($tz)->format('Y-m-d H:i:s');
    }
    return '';
}
```

El valor sustituye al campo `date` **antes** de serializar el `$submissionsJson` que consume el front. Así la tabla, el detalle, el buscador y el filtro ven un único valor ya convertido, sin tocar cada punto por separado. El CSV pasa por la misma carga, así que hereda la conversión.

---

## Plan de implementación

1. **`date_default_timezone_set('America/Lima')` en `send-email.php`.** Los registros nuevos quedan con `date` correcto; los viejos no cambian.

2. **`localDate()` en `panel-leads.php`**, aplicada al construir `$submissionsJson`, sustituyendo el `date` de cada registro por su versión local. Verificación: un lead antiguo muestra en la tabla una hora menor que la de su JSON en disco.

3. **Export CSV:** sin cambios de código si la conversión se hace dentro de `loadSubmissions()` (por la que el CSV ya pasa); `$s['date']` llega convertido a `fputcsv`.

4. **Verificar el filtro por rango** (compara cadenas `Y-m-d H:i:s` contra `Y-m-d`): al llegar ya convertido, la comparación sigue válida. Es comprobación, no cambio.

5. **Fijar también `America/Lima` en `panel-leads.php`** para que `data/deleted.log` (SPEC 86) registre en hora de Perú.

6. **Desplegar y comprobar** un lead viejo y uno nuevo en la misma tabla.

---

## Criterios de aceptación

- [ ] Un lead guardado antes de esta spec muestra en el panel una hora menor (según el desfase del servidor) que su campo `date` en el JSON.
- [ ] Un lead enviado después muestra la misma hora en el panel y en su campo `date`.
- [ ] Viejo y nuevo se muestran con el mismo criterio en la misma tabla.
- [ ] Un lead enviado a las 20:00 hora de Perú aparece con fecha de ese día, no del siguiente.
- [ ] El CSV exportado trae las fechas ya convertidas.
- [ ] Filtrar por hoy incluye un lead enviado hace cinco minutos.
- [ ] El orden de la tabla sigue siendo por `timestamp` descendente.
- [ ] Un registro sin `timestamp` sigue mostrando fecha vía el camino de reserva.
- [ ] `data/deleted.log` registra los borrados en hora de Perú.
- [ ] Ningún archivo de `data/submissions/` cambia de contenido al desplegar.

---

## Decisiones

- **Sí:** derivar de `timestamp`. Arregla históricos y nuevos con la misma línea, sin migrar archivos.
- **No:** reescribir el campo `date` de los JSON existentes. Toca datos de producción y no aporta nada que la derivación no dé.
- **No:** convertir en el navegador con `toLocaleString`. Dependería de la zona del equipo que consulte.
- **Sí:** fijar la zona en `send-email.php` y en `panel-leads.php` aunque la derivación ya resuelva la tabla: deja `date` y `deleted.log` coherentes.
- **Sí:** sustituir el campo antes de serializar, no en cada punto de uso. Un solo lugar que cambiar.
- **Sí:** `America/Lima` en vez de `-5` fijo. Correcto si algún día se aplicara horario de verano.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Un registro sin `timestamp` o con `timestamp` a 0 se mostraría con fecha de 1970. | El camino de reserva usa `date`; la condición `!empty` descarta el 0. |
| Si el hosting ya estuviera en `America/Lima`, el paso 1 no cambia nada. | El criterio del lead viejo compara contra el JSON en disco, que revela la zona real con la que se escribió. |
| El filtro compara cadenas `Y-m-d H:i:s` contra `Y-m-d`. | Funciona por el formato ordenable; el paso 4 lo verifica en vez de asumirlo. |

---

## Lo que **no** entra en esta spec

- Reescribir el campo `date` de los JSON existentes.
- Mostrar la hora en el cuerpo de los correos.
- La fecha del nombre de archivo del CSV.
- Hacer la zona horaria configurable.
