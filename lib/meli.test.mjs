// Self-check del parser de precios de la tarjeta destacada.
// Correr: node lib/meli.test.mjs   (sin frameworks)
import assert from 'node:assert';

// Copia de parseFeaturedOffer (lib/meli.ts) — mantener en sync si cambia la lógica.
function parseFeaturedOffer(html) {
  const idx = html.indexOf('rl-card-featured');
  if (idx < 0) return null;
  const seg = html.slice(idx, idx + 15000);
  let price;
  let original = null;
  const ahora = seg.match(/aria-label="Ahora: (\d+) pesos/);
  const antes = seg.match(/aria-label="Antes: (\d+) pesos/);
  if (ahora) {
    price = parseInt(ahora[1], 10);
    original = antes ? parseInt(antes[1], 10) : null;
  } else {
    const pre = seg.split(/installments|cuotas/i)[0];
    const simple = pre.match(/aria-label="(\d+) pesos/);
    if (!simple) return null;
    price = parseInt(simple[1], 10);
  }
  if (!Number.isFinite(price) || price <= 0) return null;
  return { price, original_price: original && original > price ? original : null };
}

// Con descuento: "Antes" viene ANTES que "Ahora" en el DOM; hay que tomar Ahora.
const conDescuento =
  'rl-card-featured ... <s aria-label="Antes: 599000 pesos argentinos">$599.000</s>' +
  ' <span aria-label="Ahora: 201405 pesos argentinos">$201.405</span>' +
  ' installments 6 cuotas de <span aria-label="33567 pesos argentinos">';
assert.deepStrictEqual(parseFeaturedOffer(conDescuento), { price: 201405, original_price: 599000 });

// Sin descuento: solo un precio, seguido de cuotas que NO deben tomarse.
const sinDescuento =
  'rl-card-featured ... <span aria-label="169000 pesos argentinos">$169.000</span>' +
  ' poly-price__installments 6 cuotas de <span aria-label="28166 pesos argentinos">';
assert.deepStrictEqual(parseFeaturedOffer(sinDescuento), { price: 169000, original_price: null });

// Sin tarjeta destacada → null (fallback al precio de la planilla).
assert.strictEqual(parseFeaturedOffer('<html>sin nada</html>'), null);

console.log('meli parser OK');
