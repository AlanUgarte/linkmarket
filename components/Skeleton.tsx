export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-base-900">
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-4 w-4/5 rounded-md" />
        <div className="skeleton h-3 w-3/5 rounded-md" />
        <div className="skeleton h-5 w-2/5 rounded-md mt-1" />
        <div className="skeleton h-11 w-full rounded-xl mt-3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
