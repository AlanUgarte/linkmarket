import { getProducts } from '@/lib/googleSheets';

// CSV con los precios EN VIVO, pensado para que la planilla de Google lo
// importe con =IMPORTDATA(...) en la pestaña "PreciosVivos".
export const revalidate = 60;
// Margen para la sincronizacion de precios con muchos productos (Vercel).
export const maxDuration = 60;

export async function GET() {
  const products = await getProducts();
  const rows = [
    ['Producto', 'PrecioActual', 'PrecioAnterior', 'Descuento%', 'EnvioGratis'],
    ...products.map((p) => [
      p.nombre,
      p.precio,
      p.precioAnterior ?? '',
      p.descuento,
      p.envioGratis ? 'SI' : 'NO',
    ]),
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
