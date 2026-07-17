import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProducts } from '@/lib/googleSheets';
import { CATEGORIES, getCategoryBySlug } from '@/lib/categories';
import { SITE } from '@/lib/constants';
import { Product, SortOption } from '@/lib/types';
import ProductExplorer from '@/components/ProductExplorer';

// Ver nota sobre este literal en app/page.tsx
export const revalidate = 60;
// Margen para la sincronizacion de precios con muchos productos (Vercel).
export const maxDuration = 60;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  const title = `${category.emoji} ${category.nombre}`;
  const description = category.descripcion;
  const url = `${SITE.url}/${category.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/${category.slug}` },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${SITE.name}`,
      description,
    },
  };
}

function selectCategoryProducts(products: Product[], slug: string): { items: Product[]; sort: SortOption } {
  const category = getCategoryBySlug(slug);
  if (!category) return { items: [], sort: 'relevancia' };

  if (category.virtual === 'ofertas') {
    return {
      items: products.filter((p) => p.descuento > 0),
      sort: 'mayor-descuento',
    };
  }

  if (category.virtual === 'masVendidos') {
    return {
      items: products.filter((p) => p.masVendido),
      sort: 'mas-vendidos',
    };
  }

  return {
    items: products.filter((p) => p.categoriaSlug === category.slug),
    sort: 'relevancia',
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const allProducts = await getProducts();
  const { items, sort } = selectCategoryProducts(allProducts, slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.nombre,
    description: category.descripcion,
    url: `${SITE.url}/${category.slug}`,
    hasPart: items.slice(0, 24).map((p) => ({
      '@type': 'Product',
      name: p.nombre,
      image: p.imagen || undefined,
      offers: {
        '@type': 'Offer',
        price: p.precio,
        priceCurrency: 'ARS',
        url: p.linkAfiliado,
        availability: 'https://schema.org/InStock',
      },
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-display-md text-ink flex items-center gap-2.5">
          <span aria-hidden="true">{category.emoji}</span>
          {category.nombre}
        </h1>
        <p className="text-ink-faint text-sm">{category.descripcion}</p>
      </header>

      <ProductExplorer products={items} initialSort={sort} />
    </div>
  );
}
