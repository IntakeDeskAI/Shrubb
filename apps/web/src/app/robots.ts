import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/start/', '/chat/'],
      },
    ],
    sitemap: 'https://www.shrubb.com/sitemap.xml',
  };
}
