// Revisión automática de precios link por link.
// Uso:  node scripts/revisar-precios.mjs            (todo el catálogo)
//       LIMIT=10 node scripts/revisar-precios.mjs   (prueba con 10)
//
// Qué hace: baja la planilla, resuelve cada link meli.la (precio actual,
// precio anterior, descuento) y ESCRIBE los precios directo en la app:
//   1) `lib/precios.json` { link: [precio, precioAnterior, descuento] } — la app
//      lo lee como precio base (sin tocar la planilla). Hacer commit + deploy.
//   2) Actualiza `lib/linkMap.json` con los links de producto nuevos/cambiados.
//   3) Reporte en consola de lo que cambió y de los links rotos.
// No se toca la planilla (Google Sheets) ni hace falta pegar nada a mano.

import fs from 'fs';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '141ZAPiVP_K6tRZYzXoWC6_1NXtmppN-8mzJJEvdfZHo';
const GID = process.env.GOOGLE_SHEET_GID || '404928457';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MAP_PATH = new URL('../lib/linkMap.json', import.meta.url);
const PRECIOS_PATH = new URL('../lib/precios.json', import.meta.url);
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
  // Catálogo actual desde el sitio en vivo (/api/products) para tomar siempre
  // los productos vigentes. Si falla, cae al backup del repo.
  process.stderr.write('Leyendo catálogo del sitio...\n');
  let catalogo;
  try {
    const res = await fetch('https://mercado-afiliados.vercel.app/api/products');
    const j = await res.json();
    catalogo = Array.isArray(j) ? j : (j.products || []);
    if (catalogo.filter((p) => /meli\.la\//.test(p.linkAfiliado || '')).length < 200) throw new Error('pocos');
  } catch {
    process.stderr.write('(usando backup del repo)\n');
    catalogo = JSON.parse(fs.readFileSync(new URL('../lib/catalogo-backup.json', import.meta.url), 'utf8'));
  }
  const dataRows = catalogo
    .filter((p) => /meli\.la\//.test(p.linkAfiliado || ''))
    .map((p) => { const r = []; r[1] = p.nombre || ''; r[C.link] = p.linkAfiliado; return r; });
  const targets = dataRows.slice(0, LIMIT);
  process.stderr.write(`Revisando ${targets.length} productos (${CONCURRENCY} en paralelo)`);

  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const results = await pool(targets, (r) => resolveCard((r[C.link] || '').trim()), CONCURRENCY);
  process.stderr.write('\n');

  // Precios frescos que lee la app directamente: { link: [precio, precioAnterior, descuento] }.
  const precios = JSON.parse(fs.existsSync(PRECIOS_PATH) ? fs.readFileSync(PRECIOS_PATH, 'utf8') : '{}');
  const changes = { precio: [], descuento: [], rotos: [], mapNuevo: 0, actualizados: 0 };
  targets.forEach((r, i) => {
    const res = results[i];
    const nombre = (r[1] || '').slice(0, 34);
    const link = (r[C.link] || '').trim();
    if (!res) { if (link) changes.rotos.push(`${nombre}  ${link}`); return; }

    const prev = precios[link] || [];
    const oldP = prev[0] || parseFloat((r[C.precio] || '').replace(/[^0-9.]/g, '')) || 0;
    if (Math.abs(oldP - res.price) >= 1) changes.precio.push(`${nombre}: $${oldP} -> $${res.price}`);
    const newD = disc(res.price, res.prev);
    const oldD = prev[2] ?? (parseInt(r[C.descuento] || '0', 10) || 0);
    if (oldD !== newD) changes.descuento.push(`${nombre}: ${oldD}% -> ${newD}%`);

    // Escribe el precio directo en la app (no se toca la planilla).
    precios[link] = [res.price, res.prev || 0, newD];
    changes.actualizados++;
    if (res.prodUrl && map[link] !== res.prodUrl) { map[link] = res.prodUrl; changes.mapNuevo++; }
  });

  fs.writeFileSync(PRECIOS_PATH, JSON.stringify(precios, null, 0));
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 0));

  const R = [];
  R.push(`\n===== REVISIÓN DE PRECIOS =====`);
  R.push(`Revisados: ${targets.length} | precios escritos en la app: ${changes.actualizados} | precios cambiados: ${changes.precio.length} | descuentos: ${changes.descuento.length} | links rotos: ${changes.rotos.length} | mapa actualizado: ${changes.mapNuevo}`);
  const show = (t, arr, n = 40) => { if (arr.length) { R.push(`\n-- ${t} (${arr.length}) --`); arr.slice(0, n).forEach((x) => R.push('  ' + x)); if (arr.length > n) R.push(`  ...y ${arr.length - n} más`); } };
  show('PRECIOS CAMBIADOS', changes.precio);
  show('DESCUENTOS CAMBIADOS', changes.descuento);
  show('LINKS ROTOS (revisar/regenerar)', changes.rotos);
  R.push(`\nPrecios escritos en lib/precios.json (la app los usa directo). Hacer commit + deploy.`);
  console.log(R.join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
