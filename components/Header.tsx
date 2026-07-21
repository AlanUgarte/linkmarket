import Logo from './Logo';
import HeaderSearch from './HeaderSearch';
import CategoriesMenu from './CategoriesMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-40">
      {/* Barra superior amarilla estilo Mercado Libre */}
      <div className="bg-ml-yellow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center gap-3 sm:gap-5">
            <Logo />
            <HeaderSearch />
          </div>
        </div>
      </div>

      {/* Barra blanca: botón "Categorías" (mega-menú) + accesos rápidos */}
      <div className="bg-base-900 border-b border-line shadow-sm">
        <CategoriesMenu />
      </div>
    </header>
  );
}
