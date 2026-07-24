import { NextRequest, NextResponse } from 'next/server';

// DEBUG TEMPORAL — borrar tras diagnosticar.
export async function GET(req: NextRequest) {
  const catalogId = req.nextUrl.searchParams.get('id');
  if (!catalogId) return NextResponse.json({ error: 'falta ?id=' }, { status: 400 });

  const id = process.env.ML_CLIENT_ID;
  const secret = process.env.ML_CLIENT_SECRET;
  if (!id || !secret) return NextResponse.json({ error: 'sin credenciales' });

  const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${id}&client_secret=${encodeURIComponent(secret)}`,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) return NextResponse.json({ tokenError: tokenJson });

  const auth = { headers: { Authorization: `Bearer ${tokenJson.access_token}` } };
  const prodRes = await fetch(`https://api.mercadolibre.com/products/${catalogId}`, auth);
  const prodJson = await prodRes.json();
  const itemsRes = await fetch(`https://api.mercadolibre.com/products/${catalogId}/items`, auth);
  const itemsJson = await itemsRes.json();

  return NextResponse.json({
    productStatus: prodRes.status,
    buy_box_winner: prodJson?.buy_box_winner,
    itemsStatus: itemsRes.status,
    itemsPaging: itemsJson?.paging,
    allItems: (itemsJson?.results || []).map((r: { item_id: string; price: number; official_store_id?: number; seller_id: number; tags?: string[] }) => ({
      item_id: r.item_id, price: r.price, official_store_id: r.official_store_id, seller_id: r.seller_id, tags: r.tags,
    })),
  });
}
