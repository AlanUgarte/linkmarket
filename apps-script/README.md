# LinkMarket · Analítica en Google Sheets (Apps Script)

Esta carpeta contiene `Code.gs`: el webhook que recibe cada evento de la web y lo
guarda en tu Google Sheet, y que además arma un **Dashboard ejecutivo** con KPIs,
gráficos y tablas — todo dentro de la misma planilla, sin Looker Studio y sin
depender de Meta.

## Arquitectura

```
Usuario → Landing (Next.js)
             │  dispara el evento
             ├──► Meta Pixel           (navegador)
             └──► /api/track  (Vercel)
                      ├──► Meta Conversions API   (server-side, dedup por event_id)
                      └──► Apps Script Web App ──► Google Sheets (pestaña Eventos)
                                                        │ trigger cada 5 min
                                                        └──► Dashboard + Productos + Campañas
```

Los tres canales comparten el mismo `event_id`, así Meta deduplica y la planilla
queda como tu base de datos principal.

## Instalación paso a paso

### 1. Pegar el script en tu planilla
1. Abrí tu Google Sheet (la misma de los productos).
2. **Extensiones → Apps Script**.
3. Borrá el contenido de `Code.gs` y pegá el de esta carpeta.
4. Guardá (💾).

### 2. Configurar el token
En el objeto `CONFIG` de arriba del archivo, cambiá:

```js
WEBHOOK_TOKEN: 'CAMBIA_ESTE_TOKEN',   // poné un secreto tuyo, ej: 'lm_9f3k2...'
```

Anotá ese valor: lo vas a usar igual en Vercel.

### 3. Ejecutar el setup (una vez)
1. En el editor de Apps Script, seleccioná la función **`setup`** en el menú desplegable.
2. Clic en **Ejecutar**.
3. Google te va a pedir autorización → **Revisar permisos** → elegí tu cuenta →
   "Configuración avanzada" → "Ir a (proyecto)" → **Permitir**.
4. Al terminar, tu planilla ya tiene las pestañas: **Eventos, Productos, Campañas,
   Dashboard, Configuración** (y dos auxiliares ocultas: `_Calc`, `_Logs`).

### 4. Publicar la Web App
1. **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Configuración:
   - **Ejecutar como**: Yo (tu cuenta).
   - **Quién tiene acceso**: **Cualquier persona**.
4. **Implementar** y **copiá la URL** que termina en `/exec`.

> Cada vez que edites el `Code.gs`, creá una **Nueva versión** de la implementación
> (o "Gestionar implementaciones → editar → Nueva versión") para que los cambios
> tomen efecto en la URL.

### 5. Conectar Vercel
En tu proyecto de Vercel → **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `APPS_SCRIPT_WEBHOOK_URL` | la URL `/exec` del paso 4 |
| `APPS_SCRIPT_WEBHOOK_TOKEN` | el mismo `WEBHOOK_TOKEN` del paso 2 |

Redeploy. Listo: los eventos empiezan a caer en la pestaña **Eventos** y el
**Dashboard** se refresca solo cada 5 minutos.

## Qué crea

- **Eventos**: una fila por evento (33 columnas: fecha, evento, producto, precio,
  UTMs, fbclid/gclid, dispositivo, país/ciudad, IP anonimizada, tiempo, scroll, etc.).
- **Productos**: por producto → vistas, clicks, CTR, scroll promedio.
- **Campañas**: por campaña (UTM) → pageviews, clicks, usuarios, CTR.
- **Dashboard**: KPIs + 10 gráficos (clicks por día, top productos, top categorías,
  fuentes, dispositivos, eventos por hora, campañas, usuarios por día, scroll por
  producto y embudo PageView → ViewContent → Click).
- **Configuración**: zona horaria, última actualización, total de eventos, versión.

## Notas

- **Deduplicación**: si el mismo `event_id` llega dos veces (reintentos), se ignora.
- **Concurrencia**: usa `LockService` para no pisar filas en escrituras simultáneas.
- **Errores**: quedan registrados en la hoja oculta `_Logs`.
- **Refresco**: el Dashboard se recalcula por un trigger time-driven (5 min). Podés
  forzarlo corriendo `rebuildDashboard` a mano.
- **Privacidad**: no se guardan datos personales; el matching usa IDs anónimos,
  cookies de Meta e IP **anonimizada** (último octeto en 0).
