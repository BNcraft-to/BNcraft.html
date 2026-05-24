/**
 * BNcraft Cloudflare Worker
 * Uzantısız URL'leri .html dosyalarına yönlendirir
 * ve tüm statik dosyaları doğru şekilde sunar.
 */

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

// Uzantısız URL → HTML dosyası eşlemeleri
const ROUTES = {
  '/':           '/index.html',
  '/mods':       '/Mods.html',
  '/Mods':       '/Mods.html',
  '/links':      '/Links.html',
  '/Links':      '/Links.html',
  '/help':       '/Help-Center.html',
  '/Help-Center':'/Help-Center.html',
  '/other-mods': '/other-mods.html',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Trailing slash temizle (/ hariç)
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Bilinen route varsa map et
    if (ROUTES[pathname]) {
      pathname = ROUTES[pathname];
    }
    // Uzantısız URL → .html dene
    else if (!pathname.includes('.')) {
      pathname = pathname + '.html';
    }

    url.pathname = pathname;

    try {
      const assetRequest = new Request(url.toString(), request);
      const response = await env.ASSETS.fetch(assetRequest);

      if (response.status === 404) {
        // 404 ise index'e dön
        const indexReq = new Request(new URL('/index.html', request.url).toString(), request);
        return env.ASSETS.fetch(indexReq);
      }

      // Content-Type'ı doğru ayarla
      const ext = pathname.match(/\.[^.]+$/)?.[0]?.toLowerCase();
      const contentType = MIME_TYPES[ext];

      if (contentType) {
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Content-Type', contentType);
        // Cache: HTML'leri cache etme, diğerlerini cache et
        if (ext === '.html') {
          newHeaders.set('Cache-Control', 'no-cache, must-revalidate');
        } else {
          newHeaders.set('Cache-Control', 'public, max-age=86400');
        }
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }

      return response;
    } catch (e) {
      return new Response('Sayfa bulunamadı: ' + e.message, { status: 500 });
    }
  },
};
