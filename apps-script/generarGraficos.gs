/**
 * Genera los 10 gráficos del Dashboard con estilo profesional, leyendo las
 * tablas ya calculadas en la hoja _Calc. Es idempotente: borra los gráficos
 * previos y los vuelve a crear. Ejecutable directamente (sin guion bajo final).
 *
 * Ejecutar cuando ya haya datos (después de rebuildDashboard).
 */
function generarGraficos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dash = ss.getSheetByName('Dashboard');
  var calc = ss.getSheetByName('_Calc');
  if (!dash || !calc) throw new Error('Faltan las hojas Dashboard/_Calc. Corré setup() primero.');

  // Los gráficos no dibujan datos de una hoja oculta: nos aseguramos que _Calc
  // esté visible.
  calc.showSheet();

  // Paleta (estilo Mercado Libre + acentos). El 1er color manda en series simples;
  // en tortas se reparte por porción.
  var PAL = ['#3483FA', '#00A650', '#FFB800', '#F23D4F', '#8E44AD', '#FF7733', '#16A085', '#2D3277', '#E67E22', '#5DADE2'];
  var CT = Charts.ChartType;

  // Borra gráficos existentes para no duplicar.
  dash.getCharts().forEach(function (c) { dash.removeChart(c); });

  // Cuenta filas de datos bajo el encabezado (columna `col` de _Calc).
  function nRows(col) {
    var vals = calc.getRange(2, col, 300, 1).getValues();
    var n = 0;
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i][0];
      if (v === '' || v === null) break;
      n++;
    }
    return n;
  }

  // [colEn_Calc, tipo, título, filaAncla, colAncla, leyenda]
  var specs = [
    [1, CT.LINE, 'Clics por día', 2, 4, 'none'],
    [4, CT.BAR, 'Top 20 productos (vistas)', 2, 13, 'none'],
    [7, CT.BAR, 'Top categorías', 22, 4, 'none'],
    [10, CT.PIE, 'Fuentes de tráfico', 22, 13, 'right'],
    [13, CT.PIE, 'Dispositivos', 42, 4, 'right'],
    [16, CT.LINE, 'Eventos por hora', 42, 13, 'none'],
    [19, CT.COLUMN, 'Campañas con más clics', 62, 4, 'none'],
    [22, CT.AREA, 'Usuarios por día', 62, 13, 'none'],
    [25, CT.BAR, 'Scroll promedio por producto', 82, 4, 'none'],
    [28, CT.COLUMN, 'Embudo: PageView → ViewContent → Clic', 82, 13, 'none'],
  ];

  specs.forEach(function (s) {
    var col = s[0], type = s[1], title = s[2], row = s[3], anchor = s[4], legend = s[5];
    var n = nRows(col);
    if (n < 1) return; // sin datos, no dibuja

    // Las tablas con etiquetas largas (productos) van más altas para que entren.
    var isBarLong = type === CT.BAR;
    var height = isBarLong ? 340 : 280;

    var range = calc.getRange(1, col, n + 1, 2);
    try {
      var chart = dash
        .newChart()
        .setChartType(type)
        .addRange(range)
        .setPosition(row, anchor, 0, 0)
        .setOption('title', title)
        .setOption('titleTextStyle', { color: '#1f2430', fontSize: 15, bold: true })
        .setOption('width', 520)
        .setOption('height', height)
        .setOption('backgroundColor', '#ffffff')
        .setOption('colors', PAL)
        .setOption('legend', legend === 'none' ? { position: 'none' } : { position: 'right', textStyle: { fontSize: 11 } })
        .setOption('hAxis', { textStyle: { fontSize: 11 }, gridlines: { color: '#eef0f4' } })
        .setOption('vAxis', { textStyle: { fontSize: 11 }, gridlines: { color: '#eef0f4' } });

      if (type === CT.PIE) {
        chart.setOption('pieHole', 0.4); // dona
        chart.setOption('pieSliceText', 'percentage');
      }
      if (type === CT.AREA) {
        chart.setOption('areaOpacity', 0.25);
      }
      if (type === CT.LINE) {
        chart.setOption('curveType', 'function'); // línea suavizada
        chart.setOption('pointSize', 4);
      }

      dash.insertChart(chart.build());
    } catch (err) {
      // Si un gráfico puntual falla, seguimos con el resto.
      Logger.log('Error en gráfico "' + title + '": ' + err);
    }
  });

  try {
    SpreadsheetApp.getUi().alert('Gráficos generados', 'Se crearon los gráficos en la pestaña Dashboard.', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    // sin UI (por trigger): ignorar
  }
}
