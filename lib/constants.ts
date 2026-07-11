export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'LinkMarket',
  tagline: 'Los mejores productos de Mercado Libre, elegidos por vos.',
  description:
    'Selección curada de productos en Mercado Libre Argentina: tecnología, hogar, gaming, mascotas y mucho más. Comprá seguro al mejor precio.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tusitio.vercel.app',
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@tumarca',
  themeColor: '#0A0A0B',
};

/**
 * Segundos entre cada re-validación automática (ISR).
 * Al pasar este tiempo, la próxima visita dispara una regeneración en
 * segundo plano con los datos más recientes de Google Sheets.
 * También podés forzar una actualización inmediata pegándole a /api/revalidate.
 */
export const REVALIDATE_SECONDS = 60;

// gid de la pestaña de productos (está en la URL de la planilla: #gid=NNN).
export const SHEET_GID = process.env.GOOGLE_SHEET_GID || '0';
