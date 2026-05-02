// frontend/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chronoa',
    short_name: 'Chronoa',
    description: 'Your personal workspace for productivity, focus, and reflection.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f5f0',
    theme_color: '#c2956e',
    icons: [
      {
        src: '/apple-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}