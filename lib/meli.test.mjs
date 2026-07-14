// Self-check del parser de precios de la tarjeta destacada.
// Correr: node lib/meli.test.mjs   (sin frameworks)
import assert from 'node:assert';

// Copia de parseFeaturedOffer (lib/meli.ts) — mantener en sync si cambia la lógica.
function parseFeaturedOffer(html) {
  const idx = html.indexOf('rl-card-featured');
  if (idx < 0) return null;
  const after = html.slice(idx, idx + 40000);
  const t1 = after.indexOf('poly-component__title');
  const t2 = t1 >= 0 ? after.indexOf('poly-component__title', t1 + 10) : -1;
  const seg = t2 > 0 ? after.slice(0, t2) : after.slice(0, 20000);
  let price;
  const curM = seg.match(/poly-price__current[\s\S]{0,400}?aria-label="(?:Ahora: )?(\d+) pesos/);
  if (curM) {
    price = parseInt(curM[1], 10);
  } else {
    const preCuotas = seg.split(/poly-price__installments|installments|cuotas/i)[0];
    const simple = preCuotas.match(/aria-label="(\d+) pesos/);
    if (!simple) return null;
    price = parseInt(simple[1], 10);
  }
  if (!Number.isFinite(price) || price <= 0) return null;
  const antesM = seg.match(/aria-label="Antes: (\d+) pesos/);
  const original = antesM ? parseInt(antesM[1], 10) : null;
  return { price, original_price: original && original > price ? original : null };
}

const card = (inner) => 'rl-card-featured <span class="poly-component__title">Producto destacado</span>' + inner;
const reco = (inner) => '<span class="poly-component__title">Recomendado</span>' + inner;

// Con descuento: "Antes" tachado + "Ahora" dentro de poly-price__current.
assert.deepStrictEqual(
  parseFeaturedOffer(
    card('<s aria-label="Antes: 728419 pesos"></s><div class="poly-price__current"><span aria-label="Ahora: 539999 pesos"></span></div>')
  ),
  { price: 539999, original_price: 728419 }
);

// Sin descuento y SIN poly-price__current (caso Tom Ford): primer precio antes de cuotas.
assert.deepStrictEqual(
  parseFeaturedOffer(card('<span aria-label="91372 pesos"></span><span class="poly-price__installments">6 cuotas de <span aria-label="15228 pesos">')),
  { price: 91372, original_price: null }
);

// Destacado SIN descuento + recomendación CON descuento (poly-price__current) debajo:
// debe tomar 91372 del destacado, NO 582470 de la recomendación (queda fuera del scope).
assert.deepStrictEqual(
  parseFeaturedOffer(
    card('<span aria-label="91372 pesos"></span>') +
      reco('<div class="poly-price__current"><span aria-label="Ahora: 582470 pesos"></span></div>')
  ),
  { price: 91372, original_price: null }
);

// Sin tarjeta destacada → null (fallback al precio de la planilla).
assert.strictEqual(parseFeaturedOffer('<html>sin nada</html>'), null);

console.log('meli parser OK');
