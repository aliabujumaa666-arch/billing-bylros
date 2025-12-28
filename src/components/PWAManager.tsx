import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function PWAManager() {
  useEffect(() => {
    const updatePWASettings = async () => {
      try {
        const { data } = await supabase
          .from('brand_settings')
          .select('setting_value')
          .eq('setting_key', 'brand')
          .maybeSingle();

        if (data?.setting_value?.pwa) {
          const pwa = data.setting_value.pwa;

          const themeColorMeta = document.querySelector('meta[name="theme-color"]');
          if (themeColorMeta) {
            themeColorMeta.setAttribute('content', pwa.themeColor || '#0ea5e9');
          }

          const manifest = {
            name: pwa.appName || 'BYLROS Customer Operations Platform',
            short_name: pwa.shortName || 'BYLROS',
            description: pwa.description || 'Complete customer operations and business management platform',
            start_url: '/',
            display: 'standalone',
            background_color: pwa.backgroundColor || '#ffffff',
            theme_color: pwa.themeColor || '#0ea5e9',
            orientation: 'portrait-primary',
            icons: [
              {
                src: pwa.icon192 || '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: pwa.icon512 || '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ],
            categories: ['business', 'productivity'],
            screenshots: [],
            shortcuts: [
              {
                name: 'Dashboard',
                short_name: 'Dashboard',
                description: 'View business dashboard',
                url: '/',
                icons: [{ src: pwa.icon192 || '/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Customers',
                short_name: 'Customers',
                description: 'Manage customers',
                url: '/?page=customers',
                icons: [{ src: pwa.icon192 || '/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Quotes',
                short_name: 'Quotes',
                description: 'Manage quotes',
                url: '/?page=quotes',
                icons: [{ src: pwa.icon192 || '/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Orders',
                short_name: 'Orders',
                description: 'Manage orders',
                url: '/?page=orders',
                icons: [{ src: pwa.icon192 || '/icon-192.png', sizes: '192x192' }]
              }
            ]
          };

          const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
          const manifestURL = URL.createObjectURL(manifestBlob);

          const existingLink = document.querySelector('link[rel="manifest"]');
          if (existingLink) {
            existingLink.setAttribute('href', manifestURL);
          }
        }
      } catch (error) {
        console.error('Failed to update PWA settings:', error);
      }
    };

    updatePWASettings();
  }, []);

  return null;
}
