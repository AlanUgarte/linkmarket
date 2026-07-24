import Link from 'next/link';

const FOOTER_CATS = [
  { label: 'Herramientas', slug: 'herramientas' },
  { label: 'Hogar', slug: 'hogar' },
  { label: 'Tecnología', slug: 'computacion' },
  { label: 'Gaming', slug: 'gaming' },
  { label: 'Belleza', slug: 'maquillaje' },
  { label: 'Celulares', slug: 'celulares' },
];

/** Footer premium del sitio (usado en todo el sitio). */
export default function V2Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 font-black text-slate-900">L</span>
              <span className="text-lg font-extrabold text-white">LinkMarket</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              El mejor lugar para descubrir productos y ofertas de Mercado Libre antes de comprarlos.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">Categorías</h3>
            <ul className="space-y-2 text-sm">
              {FOOTER_CATS.map((c) => (
                <li key={c.slug}><Link href={`/${c.slug}`} className="transition-colors hover:text-white">{c.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">Sitio</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#ofertas" className="transition-colors hover:text-white">Ofertas del día</Link></li>
              <li><Link href="/#tendencia" className="transition-colors hover:text-white">Productos tendencia</Link></li>
              <li><a href="#" className="transition-colors hover:text-white">Contacto</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Política de privacidad</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">Seguinos</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="transition-colors hover:text-white">Instagram</a></li>
              <li><a href="#" className="transition-colors hover:text-white">TikTok</a></li>
              <li><a href="#" className="transition-colors hover:text-white">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            LinkMarket participa en el <strong className="text-slate-300">Programa de Afiliados de Mercado Libre</strong> y
            puede recibir una comisión por las compras que califiquen realizadas a través de los enlaces de este sitio,
            sin ningún costo adicional para vos. Los precios y la disponibilidad pueden variar; el precio final siempre es
            el que figura en Mercado Libre al momento de la compra.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} LinkMarket. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
