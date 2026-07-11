import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Permite forzar una actualización inmediata del sitio (sin esperar los
 * `REVALIDATE_SECONDS` de ISR) después de editar el Google Sheet.
 *
 * Uso:
 *   POST /api/revalidate?secret=TU_SECRETO
 *
 * Podés llamarlo manualmente, desde un Apps Script "onEdit" en el propio
 * Sheet, o desde cualquier automatización (Zapier, Make, etc). El detalle
 * está documentado en el README.
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false, message: 'Secreto inválido' }, { status: 401 });
  }

  revalidatePath('/', 'layout');

  return NextResponse.json({ revalidated: true, now: Date.now() });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
