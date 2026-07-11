import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-32 text-center flex flex-col items-center gap-4">
      <span className="text-5xl" aria-hidden="true">
        🔎
      </span>
      <h1 className="text-2xl font-bold text-ink">Esta página no existe</h1>
      <p className="text-ink-faint text-sm">
        Puede que la categoría que buscás haya cambiado de nombre o ya no esté disponible.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-ml-yellow px-5 py-3 text-sm font-bold text-base-950 transition-all duration-200 ease-smooth hover:brightness-95 active:scale-95"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
