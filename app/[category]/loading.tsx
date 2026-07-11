import { ProductGridSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <div className="mb-6 flex flex-col gap-2">
        <div className="skeleton h-9 w-56 rounded-lg" />
        <div className="skeleton h-4 w-72 rounded-md" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="skeleton h-12 flex-1 rounded-xl" />
        <div className="skeleton h-12 w-48 rounded-xl" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
