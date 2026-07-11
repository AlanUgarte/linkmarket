import { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants';
import { CATEGORIES } from '@/lib/categories';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE.url,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE.url}/${c.slug}`,
    lastModified: now,
    changeFrequency: 'hourly',
    priority: c.virtual ? 0.9 : 0.8,
  }));

  return [...home, ...categoryEntries];
}
