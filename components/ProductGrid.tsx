import { Product } from '@/lib/types';
import V2ProductCard from './v2/V2ProductCard';

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => (
        <V2ProductCard key={p.id} product={p} priority={i < 5} />
      ))}
    </div>
  );
}
