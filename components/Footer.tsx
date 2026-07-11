import { SITE } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-faint">
        <p>
          © {new Date().getFullYear()} {SITE.name}. Todos los derechos reservados.
        </p>
        <p className="text-center sm:text-right max-w-md">
          Como afiliados de Mercado Libre, podemos recibir una comisión por las compras que
          califiquen realizadas a través de los enlaces de este sitio, sin costo extra para vos.
        </p>
      </div>
    </footer>
  );
}
