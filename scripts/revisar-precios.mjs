// Revisión automática de precios link por link.
// Uso:  node scripts/revisar-precios.mjs            (todo el catálogo)
//       LIMIT=10 node scripts/revisar-precios.mjs   (prueba con 10)
//
// Qué hace: baja la planilla, resuelve cada link meli.la (precio actual,
// precio anterior, descuento, envío gratis, "más vendido" y link de producto),
// compara con lo cargado, y genera:
//   1) Un reporte en consola de todo lo que cambió o está roto.
//   2) `Desktop/precios-corregidos.txt`: el catálogo corregido para PEGAR en A2.
//   3) Actualiza `lib/linkMap.json` con los links de producto nuevos/cambiados.
// El sitio ya sincroniza el precio en vivo desde la tarjeta; esto además deja la
// PLANILLA (la base) al día y detecta links rotos.

import fs from 'fs';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '141ZAPiVP_K6tRZYzXoWC6_1NXtmppN-8mzJJEvdfZHo';
const GID = process.env.GOOGLE_SHEET_GID || '404928457';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MAP_PATH = new URL('../lib/linkMap.json', import.meta.url);
const OUT_TSV = process.env.OUT_TSV || 'C:/Users/Tyna/Desktop/precios-corregidos.txt';
const AFFIL = '?matt_tool=98604370&matt_word=ugartestore';
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);

// Columnas (0-based) de la planilla.
const C = { precio: 3, precioAnt: 4, descuento: 5, link: 7, masVendido: 11, envio: 13 };

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function resolveCard(link) {
  let h;
  try {
    const res = await fetch(link, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    h = await res.text();
  } catch { return null; }
  const i = h.indexOf('rl-card-featured');
  if (i < 0) return null; // link roto: cae en la lista general
  const seg = h.slice(i, i + 9000).replace(/&amp;/g, '&');
  let price = null;
  const cm = seg.match(/poly-price__current[\s\S]{0,400}?aria-label="(?:Ahora: )?(\d+) pesos/);
  if (cm) price = +cm[1];
  else {
    const pre = seg.split(/poly-price__installments|installments|cuotas/i)[0];
    const s = pre.match(/aria-label="(\d+) pesos/);
    if (s) price = +s[1];
  }
  if (!price) return null;
  const am = seg.match(/aria-label="Antes: (\d+) pesos/);
  const prev = am ? +am[1] : null;
  const free = /poly-shipping--(free|full|same_day)|Env[ií]o gratis/i.test(seg);
  const masVendido = /m[aá]s vendido/i.test(seg);
  const m = seg.match(/href="(https:\/\/www\.mercadolibre\.com\.ar\/[^"]*?\/(?:p\/MLA\d+|up\/MLAU\d+))/)
        || seg.match(/href="(https:\/\/articulo\.mercadolibre\.com\.ar\/MLA-\d+[^"?#]*)/);
  const prodUrl = m ? m[1].split('#')[0].split('?')[0] + AFFIL : null;
  return { price, prev, free, masVendido, prodUrl };
}

async function pool(items, worker, concurrency) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await worker(items[idx], idx);
      if (idx % 25 === 0) process.stderr.write('.');
    }
  }));
  return out;
}

const disc = (p, prev) => (prev && prev > p ? Math.round(((prev - p) / prev) * 100) : 0);
const bool = (v) => (String(v).trim().toUpperCase() === 'TRUE');

async function main() {
  process.stderr.write('Bajando planilla...\n');
  const csv = await (await fetch(CSV_URL)).text();
  const rows = parseCsv(csv);
  const header = rows[0];
  const width = header.length;
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c && c.trim()));
  const targets = dataRows.slice(0, LIMIT);
  process.stderr.write(`Revisando ${targets.length} productos (${CONCURRENCY} en paralelo)`);

  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const results = await pool(targets, (r) => resolveCard((r[C.link] || '').trim()), CONCURRENCY);
  process.stderr.write('\n');

  const changes = { precio: [], descuento: [], masVendido: [], rotos: [], mapNuevo: 0 };
  const corrected = dataRows.map((r, i) => {
    const row = r.slice(); while (row.length < width) row.push('');
    if (i >= targets.length) return row;
    const res = results[i];
    const nombre = (row[1] || '').slice(0, 34);
    const link = (row[C.link] || '').trim();
    if (!res) { if (link) changes.rotos.push(`${nombre}  ${link}`); return row; }

    const oldP = parseFloat((row[C.precio] || '').replace(/[^0-9.]/g, '')) || 0;
    if (Math.abs(oldP - res.price) >= 1) changes.precio.push(`${nombre}: $${oldP} -> $${res.price}`);
    row[C.precio] = String(res.price);
    row[C.precioAnt] = res.prev ? String(res.prev) : '';
    const oldD = parseInt(row[C.descuento] || '0', 10) || 0;
    const newD = disc(res.price, res.prev);
    if (oldD !== newD) changes.descuento.push(`${nombre}: ${oldD}% -> ${newD}%`);
    row[C.descuento] = newD ? String(newD) : '';
    // Envío gratis NO se toca: la tarjeta no lo reporta de forma confiable, así
    // que se preserva el valor de la planilla para no borrarlo por error.
    if (bool(row[C.masVendido]) !== res.masVendido) changes.masVendido.push(`${nombre}: más vendido ${res.masVendido ? 'sí' : 'no'}`);
    row[C.masVendido] = res.masVendido ? 'TRUE' : '';

    if (res.prodUrl && map[link] !== res.prodUrl) { map[link] = res.prodUrl; changes.mapNuevo++; }
    return row;
  });

  fs.writeFileSync(OUT_TSV, corrected.map((r) => r.join('\t')).join('\n'));
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 0));

  const R = [];
  R.push(`\n===== REVISIÓN DE PRECIOS =====`);
  R.push(`Revisados: ${targets.length} | precios cambiados: ${changes.precio.length} | descuentos: ${changes.descuento.length} | más vendido: ${changes.masVendido.length} | links rotos: ${changes.rotos.length} | mapa actualizado: ${changes.mapNuevo}`);
  const show = (t, arr, n = 40) => { if (arr.length) { R.push(`\n-- ${t} (${arr.length}) --`); arr.slice(0, n).forEach((x) => R.push('  ' + x)); if (arr.length > n) R.push(`  ...y ${arr.length - n} más`); } };
  show('PRECIOS CAMBIADOS', changes.precio);
  show('DESCUENTOS CAMBIADOS', changes.descuento);
  show('MÁS VENDIDO CAMBIADO', changes.masVendido);
  show('LINKS ROTOS (revisar/regenerar)', changes.rotos);
  R.push(`\nArchivo para pegar en la planilla (celda A2): ${OUT_TSV}`);
  console.log(R.join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
