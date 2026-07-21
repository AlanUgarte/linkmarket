import Script from 'next/script';
import { META_PIXEL_ID } from '@/lib/constants';

/**
 * Meta Pixel (Facebook/Instagram Ads). Se carga una sola vez a nivel global
 * desde el layout raíz. Dispara el evento PageView inicial; como el sitio es
 * una SPA con App Router, ver AnalyticsTracker para los cambios de ruta.
 * Si META_PIXEL_ID está vacío, no renderiza nada.
 */
export default function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      {/*
        Solo inicializa el pixel. El primer PageView (y los de cada navegación)
        los dispara AnalyticsTracker con un event_id compartido, para deduplicar
        con la Conversions API y evitar doble conteo.
      */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
