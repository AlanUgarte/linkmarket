import { Category } from '@/lib/types';
import CategoryButton from './CategoryButton';

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {categories.map((c, i) => (
        <CategoryButton key={c.slug} category={c} index={i} />
      ))}
    </div>
  );
}
