# LinkMarket — Plataforma de afiliados de Mercado Libre

Landing premium tipo "Linktree evolucionado" para poner como único link de tu bio de TikTok. Vos administrás todo el catálogo desde **Google Sheets**, sin tocar código.

Stack: **Next.js 15 (App Router)** · **React 19** · **TypeScript** · **Tailwind CSS** · **Google Sheets API** · pensado para **Vercel**.

---

## 1. Cómo funciona

1. Cargás/editás productos en una fila de Google Sheets.
2. El sitio lee esa planilla en el servidor (Google Sheets API) y regenera las páginas cada 60 segundos (ISR), o al instante si llamás al endpoint de revalidación.
3. Cada producto tiene un botón que abre **tu link de afiliado tal cual lo pegaste**, en una pestaña nueva, sin modificarlo ni perder parámetros.

No hay base de datos ni panel de admin propio: la planilla **es** el panel de admin.

---

## 2. Preparar la Google Sheet

1. Creá una planilla nueva en Google Sheets.
2. En la fila 1, poné exactamente estos encabezados, en este orden:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Categoria | Nombre | Descripcion | Precio | PrecioAnterior | Descuento | Imagen | LinkAfiliado | Activo | Orden | Destacado | MasVendido | FechaAgregado | EnvioGratis | ItemId | CatalogId |

**Detalle de cada columna:**

- **Categoria**: debe ser una de: `Auto`, `Hogar`, `Tecnologia`, `Celulares`, `Gadgets`, `Cocina`, `Mascotas`, `Herramientas`, `Gaming`, `Bebes`, `Deportes`, `Perfumes`. (Mayúsculas/tildes no importan, el sitio normaliza el texto).
- **Nombre**: nombre del producto.
- **Descripcion**: descripción corta (1-2 líneas).
- **Precio**: precio actual. Podés escribir `45000` o `$45.000`.
- **PrecioAnterior**: precio tachado (opcional). Dejalo vacío si no aplica.
- **Descuento**: número entero, ej `20` (para 20%). Si lo dejás vacío pero cargaste `PrecioAnterior`, el sitio lo calcula solo.
- **Imagen**: URL directa de la imagen del producto (formato vertical recomendado, ej 800x1000px).
- **LinkAfiliado**: tu link de afiliado completo de Mercado Libre. Se usa tal cual, sin modificar.
- **Activo**: `TRUE` o `FALSE` (o `SI`/`NO`). Solo se muestran los productos en `TRUE`.
- **Orden**: número para ordenar manualmente (menor = aparece primero).
- **Destacado**: `TRUE`/`FALSE`. Muestra el badge ⭐ Destacado.
- **MasVendido**: `TRUE`/`FALSE`. El producto aparece en la categoría virtual "Más vendidos" 🔥.
- **FechaAgregado**: fecha en formato `AAAA-MM-DD`. Se usa para el filtro "Más recientes".
- **EnvioGratis**: `TRUE`/`FALSE`. Muestra "Envío gratis 🚚" en verde en la tarjeta.
- **ItemId**: ID del artículo en ML (ej `MLA1234567890`). Informativo.
- **CatalogId**: ID de producto de catálogo de ML (el `MLAnnn` de la URL `/p/MLAnnn`). **Habilita el precio en vivo**: con esto el sitio ignora Precio/PrecioAnterior/Descuento/EnvioGratis de la planilla y muestra los datos actuales de ML (los del ganador del catálogo, que es adonde llega el comprador). Si está vacío, se usan los valores de la planilla.

> Tip: la categoría **"Ofertas del día"** se arma sola con todos los productos que tengan `Descuento > 0`, ordenados de mayor a menor descuento. No hace falta que hagas nada extra.

---

## 3. Conectar la planilla (sin credenciales)

No hace falta Google Cloud ni cuentas de servicio: el sitio lee la planilla como CSV público.

1. En tu planilla: **Compartir → Acceso general → "Cualquier persona con el enlace"** como **Lector**.
2. Copiá el ID de la planilla desde la URL:
   `https://docs.google.com/spreadsheets/d/`**`ESTE-ES-EL-ID`**`/edit` → va en `GOOGLE_SHEET_ID`.
3. Copiá el `gid` de la pestaña de productos (está al final de la URL: `#gid=NÚMERO`) → va en `GOOGLE_SHEET_GID`.

> No pongas en esa planilla datos que no quieras públicos (comisiones, notas, etc.).

## 3b. Precios en vivo desde Mercado Libre (opcional)

Con una aplicación gratuita de ML (developers.mercadolibre.com.ar → crear app con negocio "Mercado Libre", flujo Client Credentials y permiso "Publicación y sincronización: Lectura"), el sitio actualiza solo precio, precio anterior, % OFF y envío gratis de cada producto que tenga `CatalogId`:

- `ML_CLIENT_ID` → el App ID de tu aplicación.
- `ML_CLIENT_SECRET` → el Client Secret (cargalo directo en Vercel, no lo compartas).

Si falta cualquiera de las dos, el sitio simplemente usa los precios de la planilla.

---

## 4. Configurar variables de entorno

1. Copiá `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Completá todos los valores (ver sección anterior para las de Google).
3. `NEXT_PUBLIC_SITE_URL` debe ser la URL final de tu sitio (importante para el SEO, el sitemap y los Open Graph tags).

---

## 5. Correr en local

Requiere **Node.js 18.18 o superior**.

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

---

## 6. Imágenes de productos

- Si tus imágenes vienen de Mercado Libre (`mlstatic.com`), ya están permitidas en `next.config.mjs`.
- Si usás otro hosting de imágenes (Cloudinary, Google Drive, etc.), agregá el dominio en `next.config.mjs → images.remotePatterns`.
- Usá imágenes en **formato vertical** (proporción 4:5, por ejemplo 800×1000px) para que se vean prolijas en las tarjetas.

---

## 7. Actualización automática del contenido

El sitio usa **ISR (Incremental Static Regeneration)**: cada página se revalida sola cada **60 segundos** (`REVALIDATE_SECONDS` en `lib/constants.ts`). Es decir, como máximo un minuto después de editar el Sheet, el cambio ya está online, sin que vos hagas nada.

### Actualización instantánea (opcional)

Si no querés esperar el minuto, podés forzar una actualización inmediata pegándole a:

```
POST https://tusitio.vercel.app/api/revalidate?secret=TU_REVALIDATE_SECRET
```

Para automatizarlo desde el propio Google Sheet:

1. En tu planilla: **Extensiones → Apps Script**.
2. Pegá este script y guardalo:

```javascript
function onEditRevalidate() {
  UrlFetchApp.fetch(
    'https://tusitio.vercel.app/api/revalidate?secret=TU_REVALIDATE_SECRET'
  );
}
```

3. En el reloj/ícono de "Activadores" (Triggers), creá un activador para `onEditRevalidate` en el evento **"Al editar"**.

Así, cada vez que agregues o modifiques una fila, el sitio se actualiza al instante.

---

## 8. Despliegue en Vercel

1. Subí este proyecto a un repo de GitHub/GitLab.
2. Entrá a [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo.
3. En **Environment Variables**, cargá las mismas variables que tenés en `.env.local` (incluida `GOOGLE_PRIVATE_KEY`, pegando la clave completa).
4. Deploy. Listo — Vercel te da la URL de producción.
5. Actualizá `NEXT_PUBLIC_SITE_URL` con esa URL definitiva y volvé a hacer deploy (para que el SEO, sitemap y Open Graph usen la URL correcta).
6. Poné esa URL como el único link de tu bio de TikTok.

---

## 9. SEO incluido, ya configurado

- `Title`, `description`, Open Graph y Twitter Cards dinámicos por categoría (`app/[category]/page.tsx` y `app/layout.tsx`).
- `app/sitemap.ts` → genera `/sitemap.xml` automáticamente con todas las categorías.
- `app/robots.ts` → genera `/robots.txt` automáticamente.
- Datos estructurados **Schema.org** (`WebSite` en la home, `CollectionPage` + `Product`/`Offer` en cada categoría).
- Reemplazá `/public/og-image.png`, `/public/favicon.ico`, `/public/icon-192.png` e `/public/icon-512.png` por tus propios assets (ver `public/README-images.txt`).

---

## 10. Rendimiento

- Todas las imágenes usan `next/image` con lazy loading, `sizes` correctos y formatos `avif`/`webp` automáticos.
- ISR evita golpear la Google Sheets API en cada visita.
- Sin JavaScript pesado: los filtros y la búsqueda corren en un componente cliente chico (`ProductExplorer`), el resto es Server Components.
- Para verificar tu Lighthouse: `npm run build && npm run start` y corré Lighthouse contra ese build de producción (el modo `dev` siempre da peor puntaje).

---

## 11. Estructura del proyecto

```
app/
  layout.tsx              Layout raíz, metadata global, fuente Inter
  page.tsx                Home: hero + ofertas del día + categorías
  globals.css
  sitemap.ts               /sitemap.xml
  robots.ts                 /robots.txt
  manifest.ts                /manifest.webmanifest
  not-found.tsx             404 personalizado
  [category]/
    page.tsx                Página de cada categoría (o "ofertas-del-dia" / "mas-vendidos")
    loading.tsx              Skeleton mientras carga
  api/
    products/route.ts        JSON con todos los productos
    revalidate/route.ts       Webhook de revalidación instantánea
components/                 Todos los bloques de UI (ProductCard, Header, SearchBar, etc.)
hooks/                       useFavorites, useProducts, useDebounce
lib/
  googleSheets.ts             Cliente de la Google Sheets API
  categories.ts                Definición de las 12 categorías
  types.ts                      Tipos TypeScript
  utils.ts                       Parseo de precios, slugs, normalización de filas
  constants.ts                    Nombre del sitio, URL, tiempos de revalidación
```

---

## 12. Favoritos y compartir

- **Favoritos**: se guardan en `localStorage` del navegador (no requieren login). Tocando el ❤️ de cualquier producto se guarda/quita.
- **Compartir**: usa la Web Share API nativa en celulares (abre el menú de compartir del sistema); en desktop copia el link al portapapeles.

---

## 13. Preparado para el futuro

La arquitectura ya deja lugar para, sin romper nada de lo existente:

- **Login de administrador**: agregar `middleware.ts` + una tabla de usuarios (ej. con Vercel Postgres o Clerk/Auth.js) para proteger una futura ruta `/admin`.
- **Panel de estadísticas / clics / visitas**: el botón "VER EN MERCADO LIBRE" en `components/ProductCard.tsx` es el lugar exacto para agregar un `onClick` que registre el evento (por ejemplo, contra una API route propia o directamente a Analytics).
- **Google Analytics / Meta Pixel / TikTok Pixel**: se agregan como `<Script>` de `next/script` dentro de `app/layout.tsx`, dentro del `<body>`, con `strategy="afterInteractive"`.

---

## 14. Personalización rápida

- **Nombre y colores de marca**: `lib/constants.ts` (nombre, URL, descripción) y `tailwind.config.ts` (paleta `ml.yellow`, `base.*`).
- **Categorías**: `lib/categories.ts` — agregar/quitar/renombrar categorías desde un solo archivo.
- **Tiempo de revalidación**: `REVALIDATE_SECONDS` en `lib/constants.ts`.

---

Hecho para vender rápido, cargar rápido y no requerir que toques una línea de código para el uso diario. Éxitos con las ventas 🚀
