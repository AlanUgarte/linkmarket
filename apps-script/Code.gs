/**
 * LinkMarket · Analytics — Google Apps Script (Web App)
 * =====================================================================
 * Recibe los eventos de la web (vía /api/track de Next.js) y los guarda en
 * Google Sheets, que funciona como base de datos propia. Además arma y refresca
 * un Dashboard ejecutivo con KPIs, gráficos y tablas, sin depender de Meta ni
 * de Looker Studio.
 *
 * INSTALACIÓN (resumen — ver apps-script/README.md para el paso a paso):
 *   1. En tu planilla: Extensiones → Apps Script. Pegá este archivo.
 *   2. Editá CONFIG.WEBHOOK_TOKEN con un secreto tuyo (el mismo que pondrás en
 *      Vercel como APPS_SCRIPT_WEBHOOK_TOKEN).
 *   3. Ejecutá una vez la función setup() y autorizá los permisos.
 *   4. Implementar → Nueva implementación → Aplicación web:
 *        - Ejecutar como: Yo
 *        - Quién tiene acceso: Cualquier persona
 *      Copiá la URL /exec y ponela en Vercel como APPS_SCRIPT_WEBHOOK_URL.
 * =====================================================================
 */

// ------------------------------------------------------------------ CONFIG
var CONFIG = {
  // Secreto compartido con Vercel (APPS_SCRIPT_WEBHOOK_TOKEN). Vacío = sin validar.
  WEBHOOK_TOKEN: 'CAMBIA_ESTE_TOKEN',
  // Cada cuántos minutos se refresca el Dashboard.
  REFRESH_MINUTES: 5,
};

var SHEETS = {
  EVENTOS: 'Eventos',
  PRODUCTOS: 'Productos',
  CAMPANAS: 'Campañas',
  DASHBOARD: 'Dashboard',
  CONFIG: 'Configuración',
  CALC: '_Calc', // datos de los gráficos (oculta)
  LOGS: '_Logs', // errores/logs (oculta)
};

// Encabezados de la pestaña Eventos (el orden define las columnas).
var HEADERS = [
  'ID', 'Fecha', 'Hora', 'Timestamp', 'Evento', 'Producto', 'Categoría', 'Precio',
  'URL actual', 'URL destino Mercado Libre', 'Usuario (ID anónimo)', 'Session ID',
  'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term',
  'fbclid', 'gclid', 'Referrer', 'Dispositivo', 'Sistema Operativo', 'Navegador',
  'Resolución', 'Idioma', 'País', 'Ciudad', 'Región', 'IP anonimizada',
  'Tiempo en página', 'Scroll %', 'Click Mercado Libre', 'Extra',
];

// =====================================================================
// ENDPOINT WEB APP
// =====================================================================

/** Recibe cada evento por POST, valida, deduplica e inserta una fila. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'lock timeout' });
  }
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'empty body' });
    }
    var data = JSON.parse(e.postData.contents);

    // Validación de token.
    if (CONFIG.WEBHOOK_TOKEN && String(data.token || '') !== CONFIG.WEBHOOK_TOKEN) {
      return jsonOut_({ ok: false, error: 'unauthorized' });
    }
    // Validación mínima de datos.
    if (!data.id || !data.evento) {
      return jsonOut_({ ok: false, error: 'missing id or evento' });
    }

    // Deduplicación por event_id (cache de 6 h; el mismo id no se repite).
    var cache = CacheService.getScriptCache();
    var key = 'evt_' + data.id;
    if (cache.get(key)) {
      return jsonOut_({ ok: true, dedup: true });
    }
    cache.put(key, '1', 21600);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.EVENTOS);
    if (!sheet) {
      ensureSheets_(ss);
      sheet = ss.getSheetByName(SHEETS.EVENTOS);
    }
    sheet.appendRow(buildRow_(data, ss));
    return jsonOut_({ ok: true });
  } catch (err) {
    logError_('doPost', err);
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Health-check simple por GET. */
function doGet() {
  return jsonOut_({ ok: true, service: 'linkmarket-analytics' });
}

/** Arma la fila en el orden de HEADERS a partir del JSON recibido. */
function buildRow_(d, ss) {
  var tz = ss.getSpreadsheetTimeZone() || 'America/Argentina/Buenos_Aires';
  var ts = Number(d.timestamp) || Date.now();
  var date = new Date(ts);
  return [
    d.id || '',
    Utilities.formatDate(date, tz, 'yyyy-MM-dd'),
    Utilities.formatDate(date, tz, 'HH:mm:ss'),
    date, // Timestamp como datetime real → habilita hour()/día en los cálculos
    d.evento || '',
    d.producto || '',
    d.categoria || '',
    d.precio === '' || d.precio == null ? '' : Number(d.precio),
    d.urlActual || '',
    d.urlDestino || '',
    d.usuario || '',
    d.sessionId || '',
    d.utmSource || '',
    d.utmMedium || '',
    d.utmCampaign || '',
    d.utmContent || '',
    d.utmTerm || '',
    d.fbclid || '',
    d.gclid || '',
    d.referrer || '',
    d.dispositivo || '',
    d.so || '',
    d.navegador || '',
    d.resolucion || '',
    d.idioma || '',
    d.pais || '',
    d.ciudad || '',
    d.region || '',
    d.ipAnon || '',
    d.tiempoEnPagina === '' || d.tiempoEnPagina == null ? '' : Number(d.tiempoEnPagina),
    d.scrollPct === '' || d.scrollPct == null ? '' : Number(d.scrollPct),
    d.clickML || 'No',
    d.extra || '',
  ];
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// =====================================================================
// SETUP (ejecutar una vez a mano)
// =====================================================================

/** Crea pestañas, dashboard, gráficos y el trigger de refresco. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets_(ss);
  seedConfig_(ss);
  buildDashboardLayout_(ss);
  rebuildDashboard();
  generarGraficos(); // gráficos con estilo (ver generarGraficos.gs)
  installTrigger_();
  SpreadsheetApp.getUi &&
    tryUi_('LinkMarket Analytics', 'Setup completado. Ya podés implementar la Web App.');
}

/** Crea las pestañas que falten con sus encabezados. */
function ensureSheets_(ss) {
  Object.keys(SHEETS).forEach(function (k) {
    var name = SHEETS[k];
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });

  var ev = ss.getSheetByName(SHEETS.EVENTOS);
  if (ev.getLastRow() === 0) {
    ev.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    ev.setFrozenRows(1);
    ev.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#111111').setFontColor('#FFE600');
  }

  // Ocultar hojas auxiliares.
  [SHEETS.CALC, SHEETS.LOGS].forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s) s.hideSheet();
  });
}

/** Valores iniciales de la pestaña Configuración. */
function seedConfig_(ss) {
  var c = ss.getSheetByName(SHEETS.CONFIG);
  if (c.getLastRow() > 0) return;
  var rows = [
    ['LinkMarket · Configuración', ''],
    ['Zona horaria', ss.getSpreadsheetTimeZone()],
    ['Refresco del dashboard (min)', CONFIG.REFRESH_MINUTES],
    ['Última actualización', ''],
    ['Total de eventos', ''],
    ['Versión', '1.0.0'],
  ];
  c.getRange(1, 1, rows.length, 2).setValues(rows);
  c.getRange(1, 1, 1, 2).setFontWeight('bold');
  c.setColumnWidth(1, 240);
}

/** Instala (o reemplaza) el trigger time-driven que refresca el dashboard. */
function installTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'rebuildDashboard') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('rebuildDashboard')
    .timeBased()
    .everyMinutes(nearestAllowed_(CONFIG.REFRESH_MINUTES))
    .create();
}

/** Apps Script sólo permite 1,5,10,15,30 minutos para everyMinutes. */
function nearestAllowed_(m) {
  var allowed = [1, 5, 10, 15, 30];
  for (var i = 0; i < allowed.length; i++) if (m <= allowed[i]) return allowed[i];
  return 30;
}

// =====================================================================
// DASHBOARD: KPIs + tablas + datos de gráficos (refresco cada 5 min)
// =====================================================================

/**
 * Recalcula todo el dashboard leyendo la pestaña Eventos una sola vez y
 * agregando en memoria. Es lo que dispara el trigger cada 5 minutos.
 */
function rebuildDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets_(ss);
  var ev = ss.getSheetByName(SHEETS.EVENTOS);
  var lastRow = ev.getLastRow();
  var rows = lastRow > 1 ? ev.getRange(2, 1, lastRow - 1, HEADERS.length).getValues() : [];
  // Fallback: en algunas planillas getSpreadsheetTimeZone() viene vacío y
  // Utilities.formatDate exige un string válido (si no, tira "Invalid timeZone").
  var tz = ss.getSpreadsheetTimeZone() || 'America/Argentina/Buenos_Aires';

  var agg = aggregate_(rows, tz);

  writeKpis_(ss, agg);
  writeCalcTables_(ss, agg);
  writeProductos_(ss, agg);
  writeCampanas_(ss, agg);

  // Metadatos en Configuración.
  var c = ss.getSheetByName(SHEETS.CONFIG);
  setConfigValue_(c, 'Última actualización', Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss'));
  setConfigValue_(c, 'Total de eventos', rows.length);
}

/** Índice de columna (0-based) por nombre de encabezado. */
var COL = (function () {
  var m = {};
  HEADERS.forEach(function (h, i) {
    m[h] = i;
  });
  return m;
})();

/** Recorre las filas una vez y calcula todos los agregados. */
function aggregate_(rows, tz) {
  var a = {
    total: rows.length,
    porEvento: {},
    usersByDay: {}, // dia -> Set
    clicksByDay: {}, // dia -> n
    usersToday: new Set(),
    users7: new Set(),
    users30: new Set(),
    eventsByHour: new Array(24).fill(0),
    sources: {}, // utm_source -> clicks
    devices: {}, // device -> count
    categories: {}, // categoria -> views
    campaigns: {}, // campaign -> {pv, clicks, users:Set}
    productos: {}, // nombre -> {cat, views, clicks, scrollSum, scrollN}
    tiempoSum: 0,
    tiempoN: 0,
    scrollSum: 0,
    scrollN: 0,
    pv: 0,
    vc: 0,
    clicks: 0,
  };

  var today = dayKey_(new Date(), tz);
  var d7 = offsetDay_(today, -6);
  var d30 = offsetDay_(today, -29);

  rows.forEach(function (r) {
    var evento = r[COL['Evento']];
    var user = r[COL['Usuario (ID anónimo)']];
    var ts = r[COL['Timestamp']] instanceof Date ? r[COL['Timestamp']] : new Date(r[COL['Timestamp']]);
    var day = dayKey_(ts, tz);
    var hour = Number(Utilities.formatDate(ts, tz, 'H'));
    var producto = r[COL['Producto']];
    var categoria = r[COL['Categoría']];
    var source = r[COL['UTM Source']] || '(directo)';
    var campaign = r[COL['UTM Campaign']] || '(sin campaña)';
    var device = r[COL['Dispositivo']] || '(desconocido)';
    var tiempo = Number(r[COL['Tiempo en página']]);
    var scroll = Number(r[COL['Scroll %']]);

    a.porEvento[evento] = (a.porEvento[evento] || 0) + 1;
    if (!isNaN(hour) && hour >= 0 && hour < 24) a.eventsByHour[hour]++;

    if (user) {
      if (day === today) a.usersToday.add(user);
      if (day >= d7) a.users7.add(user);
      if (day >= d30) a.users30.add(user);
      if (!a.usersByDay[day]) a.usersByDay[day] = new Set();
      a.usersByDay[day].add(user);
    }

    if (!isNaN(tiempo) && tiempo > 0) {
      a.tiempoSum += tiempo;
      a.tiempoN++;
    }
    if (!isNaN(scroll) && scroll > 0) {
      a.scrollSum += scroll;
      a.scrollN++;
    }

    // Campaña
    if (!a.campaigns[campaign]) a.campaigns[campaign] = { pv: 0, clicks: 0, users: new Set() };
    if (user) a.campaigns[campaign].users.add(user);

    if (evento === 'PageView') {
      a.pv++;
      a.campaigns[campaign].pv++;
    }
    if (evento === 'ViewContent') {
      a.vc++;
      if (producto) {
        if (!a.productos[producto]) a.productos[producto] = { cat: categoria, views: 0, clicks: 0, scrollSum: 0, scrollN: 0 };
        a.productos[producto].views++;
        if (!isNaN(scroll) && scroll > 0) {
          a.productos[producto].scrollSum += scroll;
          a.productos[producto].scrollN++;
        }
      }
      if (categoria) a.categories[categoria] = (a.categories[categoria] || 0) + 1;
    }
    if (evento === 'ClickCategoria' && categoria) {
      a.categories[categoria] = (a.categories[categoria] || 0) + 1;
    }
    if (evento === 'ClickMercadoLibre') {
      a.clicks++;
      a.clicksByDay[day] = (a.clicksByDay[day] || 0) + 1;
      a.sources[source] = (a.sources[source] || 0) + 1;
      a.campaigns[campaign].clicks++;
      if (producto) {
        if (!a.productos[producto]) a.productos[producto] = { cat: categoria, views: 0, clicks: 0, scrollSum: 0, scrollN: 0 };
        a.productos[producto].clicks++;
      }
    }

    a.devices[device] = (a.devices[device] || 0) + 1;
  });

  return a;
}

/** Escribe el bloque de KPIs en el Dashboard. */
function writeKpis_(ss, a) {
  var dash = ss.getSheetByName(SHEETS.DASHBOARD);
  var ctr = a.pv > 0 ? a.clicks / a.pv : 0;
  var tiempoProm = a.tiempoN > 0 ? a.tiempoSum / a.tiempoN : 0;
  var scrollProm = a.scrollN > 0 ? a.scrollSum / a.scrollN : 0;

  var kpis = [
    ['Usuarios hoy', a.usersToday.size],
    ['Usuarios 7 días', a.users7.size],
    ['Usuarios 30 días', a.users30.size],
    ['Eventos totales', a.total],
    ['PageViews', a.pv],
    ['Clicks Mercado Libre', a.clicks],
    ['CTR (Clicks/PageViews)', ctr],
    ['Tiempo promedio (s)', Math.round(tiempoProm)],
    ['Scroll promedio (%)', Math.round(scrollProm)],
    ['Productos vistos (únicos)', Object.keys(a.productos).filter(function (p) { return a.productos[p].views > 0; }).length],
    ['Productos clickeados (únicos)', Object.keys(a.productos).filter(function (p) { return a.productos[p].clicks > 0; }).length],
    ['Categoría más vista', topKey_(a.categories)],
    ['Campaña más efectiva (clicks)', topCampaign_(a.campaigns)],
    ['Fuente top (UTM Source)', topKey_(a.sources)],
  ];

  // Grilla de 2 columnas (label + valor) x 7 filas, empezando en A3.
  dash.getRange(3, 1, kpis.length, 2).clearContent();
  dash.getRange(3, 1, kpis.length, 2).setValues(kpis);
  dash.getRange(3, 1, kpis.length, 1).setFontWeight('bold');
  // CTR como porcentaje.
  dash.getRange(9, 2).setNumberFormat('0.00%');
}

/** Escribe las tablas que alimentan los gráficos en la hoja _Calc. */
function writeCalcTables_(ss, a) {
  var calc = ss.getSheetByName(SHEETS.CALC);
  calc.clear();

  // 1) Clicks por día
  putTable_(calc, 1, 1, ['Día', 'Clicks'], sortByKeyAsc_(a.clicksByDay));
  // 2) Top 20 productos (por vistas)
  putTable_(calc, 1, 4, ['Producto', 'Vistas'], topN_(mapField_(a.productos, 'views'), 20));
  // 3) Top categorías
  putTable_(calc, 1, 7, ['Categoría', 'Vistas'], topN_(a.categories, 15));
  // 4) Fuentes de tráfico (clicks por UTM Source)
  putTable_(calc, 1, 10, ['Fuente', 'Clicks'], topN_(a.sources, 12));
  // 5) Dispositivos
  putTable_(calc, 1, 13, ['Dispositivo', 'Eventos'], topN_(a.devices, 10));
  // 6) Eventos por hora
  putTable_(calc, 1, 16, ['Hora', 'Eventos'], a.eventsByHour.map(function (n, h) { return [h + ':00', n]; }));
  // 7) Campañas por clicks
  putTable_(calc, 1, 19, ['Campaña', 'Clicks'], topN_(mapCampaignField_(a.campaigns, 'clicks'), 12));
  // 8) Usuarios por día
  putTable_(calc, 1, 22, ['Día', 'Usuarios'], sortByKeyAsc_(setSizes_(a.usersByDay)));
  // 9) Scroll promedio por producto (top 20 por vistas)
  putTable_(calc, 1, 25, ['Producto', 'Scroll %'], scrollAvgTable_(a.productos, 20));
  // 10) Embudo
  putTable_(calc, 1, 28, ['Etapa', 'Cantidad'], [
    ['PageView', a.pv],
    ['ViewContent', a.vc],
    ['Click Mercado Libre', a.clicks],
  ]);
}

/** Pestaña Productos: tabla completa producto → vistas, clicks, CTR, scroll. */
function writeProductos_(ss, a) {
  var sh = ss.getSheetByName(SHEETS.PRODUCTOS);
  sh.clear();
  var header = ['Producto', 'Categoría', 'Vistas', 'Clicks', 'CTR', 'Scroll promedio %'];
  var data = Object.keys(a.productos).map(function (name) {
    var p = a.productos[name];
    var ctr = p.views > 0 ? p.clicks / p.views : 0;
    var scroll = p.scrollN > 0 ? Math.round(p.scrollSum / p.scrollN) : 0;
    return [name, p.cat || '', p.views, p.clicks, ctr, scroll];
  });
  data.sort(function (x, y) { return y[2] - x[2]; }); // por vistas desc
  sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#111111').setFontColor('#FFE600');
  if (data.length) {
    sh.getRange(2, 1, data.length, header.length).setValues(data);
    sh.getRange(2, 5, data.length, 1).setNumberFormat('0.00%');
  }
  sh.setFrozenRows(1);
}

/** Pestaña Campañas: campaña → pageviews, clicks, usuarios, CTR. */
function writeCampanas_(ss, a) {
  var sh = ss.getSheetByName(SHEETS.CAMPANAS);
  sh.clear();
  var header = ['Campaña', 'PageViews', 'Clicks', 'Usuarios', 'CTR'];
  var data = Object.keys(a.campaigns).map(function (name) {
    var c = a.campaigns[name];
    var ctr = c.pv > 0 ? c.clicks / c.pv : 0;
    return [name, c.pv, c.clicks, c.users.size, ctr];
  });
  data.sort(function (x, y) { return y[2] - x[2]; }); // por clicks desc
  sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#111111').setFontColor('#FFE600');
  if (data.length) {
    sh.getRange(2, 1, data.length, header.length).setValues(data);
    sh.getRange(2, 5, data.length, 1).setNumberFormat('0.00%');
  }
  sh.setFrozenRows(1);
}

// =====================================================================
// GRÁFICOS (se crean una vez en setup; leen rangos fijos de _Calc)
// =====================================================================

/** Crea los 10 gráficos en el Dashboard. Idempotente: borra los previos. */
function buildCharts_(ss) {
  var dash = ss.getSheetByName(SHEETS.DASHBOARD);
  var calc = ss.getSheetByName(SHEETS.CALC);
  dash.getCharts().forEach(function (ch) { dash.removeChart(ch); });

  var T = SpreadsheetApp.ChartType;
  // [tipo, colInicioEnCalc, título, filaAnclaEnDashboard, colAnclaEnDashboard]
  var specs = [
    [T.LINE, 1, 'Clicks por día', 2, 4],
    [T.COLUMN, 4, 'Top 20 productos', 2, 12],
    [T.BAR, 7, 'Top categorías', 20, 4],
    [T.PIE, 10, 'Fuentes de tráfico', 20, 12],
    [T.PIE, 13, 'Dispositivos', 38, 4],
    [T.LINE, 16, 'Eventos por hora', 38, 12],
    [T.COLUMN, 19, 'Campañas con más clicks', 56, 4],
    [T.AREA, 22, 'Usuarios por día', 56, 12],
    [T.BAR, 25, 'Scroll promedio por producto', 74, 4],
    [T.COLUMN, 28, 'Embudo: PageView → ViewContent → Click', 74, 12],
  ];

  specs.forEach(function (s) {
    try {
      var range = calc.getRange(1, s[1], 1000, 2);
      var chart = dash
        .newChart()
        .setChartType(s[0])
        .addRange(range)
        .setPosition(s[3], s[4], 0, 0)
        .setOption('title', s[2])
        .setOption('width', 460)
        .setOption('height', 260)
        .setOption('legend', { position: s[0] === T.PIE ? 'right' : 'none' })
        .build();
      dash.insertChart(chart);
    } catch (err) {
      logError_('buildCharts:' + s[2], err);
    }
  });
}

/** Encabezado visual del Dashboard. */
function buildDashboardLayout_(ss) {
  var dash = ss.getSheetByName(SHEETS.DASHBOARD);
  dash.getRange(1, 1).setValue('📊 LinkMarket · Dashboard').setFontSize(16).setFontWeight('bold');
  dash.setColumnWidth(1, 240);
  dash.setColumnWidth(2, 140);
}

// =====================================================================
// UTILIDADES
// =====================================================================

function dayKey_(date, tz) {
  return Utilities.formatDate(date, tz, 'yyyy-MM-dd');
}

function offsetDay_(dayStr, deltaDays) {
  var parts = dayStr.split('-');
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + deltaDays);
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var da = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + da;
}

/** Convierte {clave: Set} en {clave: size}. */
function setSizes_(obj) {
  var out = {};
  Object.keys(obj).forEach(function (k) { out[k] = obj[k].size; });
  return out;
}

/** {clave: valor} → filas [[clave, valor]] ordenadas por clave ascendente. */
function sortByKeyAsc_(obj) {
  return Object.keys(obj).sort().map(function (k) { return [k, obj[k]]; });
}

/** {clave: valor} → top N filas [[clave, valor]] por valor descendente. */
function topN_(obj, n) {
  return Object.keys(obj)
    .map(function (k) { return [k, obj[k]]; })
    .sort(function (x, y) { return y[1] - x[1]; })
    .slice(0, n);
}

/** {nombre: {campo}} → {nombre: valorDelCampo}. */
function mapField_(objs, field) {
  var out = {};
  Object.keys(objs).forEach(function (k) { out[k] = objs[k][field]; });
  return out;
}

function mapCampaignField_(camps, field) {
  var out = {};
  Object.keys(camps).forEach(function (k) { out[k] = camps[k][field]; });
  return out;
}

function scrollAvgTable_(productos, n) {
  return Object.keys(productos)
    .map(function (k) {
      var p = productos[k];
      var avg = p.scrollN > 0 ? Math.round(p.scrollSum / p.scrollN) : 0;
      return [k, avg, p.views];
    })
    .sort(function (x, y) { return y[2] - x[2]; }) // por vistas
    .slice(0, n)
    .map(function (r) { return [r[0], r[1]]; });
}

function topKey_(obj) {
  var best = '';
  var bestV = -1;
  Object.keys(obj).forEach(function (k) {
    if (obj[k] > bestV) { bestV = obj[k]; best = k; }
  });
  return best || '—';
}

function topCampaign_(camps) {
  var best = '';
  var bestV = -1;
  Object.keys(camps).forEach(function (k) {
    if (camps[k].clicks > bestV) { bestV = camps[k].clicks; best = k; }
  });
  return best || '—';
}

/** Escribe una tabla (encabezado + filas) en una posición, limpiando 1000 filas. */
function putTable_(sheet, row, col, header, rows) {
  sheet.getRange(row, col, 1000, 2).clearContent();
  sheet.getRange(row, col, 1, 2).setValues([header]);
  if (rows && rows.length) {
    sheet.getRange(row + 1, col, rows.length, 2).setValues(rows);
  }
}

function setConfigValue_(sheet, label, value) {
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === label) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
}

function logError_(where, err) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var log = ss.getSheetByName(SHEETS.LOGS);
    if (!log) log = ss.insertSheet(SHEETS.LOGS).hideSheet();
    log.appendRow([new Date(), where, String(err && err.stack ? err.stack : err)]);
  } catch (e) {
    // si ni el log funciona, no hay nada más que hacer
  }
}

function tryUi_(title, msg) {
  try {
    SpreadsheetApp.getUi().alert(title, msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    // sin UI (ejecución por trigger): ignorar
  }
}
