import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/googleSheets';
import { REVALIDATE_SECONDS } from '@/lib/constants';

// Ver nota sobre este literal en app/page.tsx
export const revalidate = 60;

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(
    { count: products.length, products },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS * 5}`,
      },
    }
  );
}
