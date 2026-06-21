const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime'
};

const send = (res, statusCode, body, headers = {}) => {
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
};

const fetchText = (targetUrl) => new Promise((resolve, reject) => {
  const request = https.get(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml'
    }
  }, (response) => {
    if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      fetchText(response.headers.location).then(resolve).catch(reject);
      return;
    }
    if (!response.statusCode || response.statusCode >= 400) {
      reject(new Error(`MyVouch request failed with status ${response.statusCode || 0}`));
      return;
    }
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
  request.on('error', reject);
  request.setTimeout(20000, () => request.destroy(new Error('MyVouch request timed out.')));
});

const resolveFilePath = (pathname) => {
  let normalizedPath = decodeURIComponent(pathname || '/');
  if (normalizedPath === '/') normalizedPath = '/index.html';
  if (normalizedPath === '/loader') normalizedPath = '/loader.html';
  if (normalizedPath === '/admin') normalizedPath = '/admin.html';
  if (normalizedPath === '/dashboard') normalizedPath = '/loader.html';
  if (normalizedPath === '/panel') normalizedPath = '/admin.html';

  let filePath = path.join(ROOT, normalizedPath.replace(/^\/+/, ''));
  if (!path.extname(filePath) && fs.existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }
  return filePath;
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (requestUrl.pathname === '/api/myvouch') {
      const profile = String(requestUrl.searchParams.get('profile') || 'varp').trim() || 'varp';
      const page = Math.max(1, Number(requestUrl.searchParams.get('page') || 1));
      const remoteUrl = new URL(`https://myvouch.es/${encodeURIComponent(profile)}`);
      if (page > 1) remoteUrl.searchParams.set('page', String(page));
      remoteUrl.searchParams.set('_verify', String(Date.now()));

      try {
        const html = await fetchText(remoteUrl.toString());
        send(res, 200, html, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
      } catch (error) {
        send(res, 502, JSON.stringify({ error: error.message || 'MyVouch proxy failed.' }), {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
      }
      return;
    }

    const filePath = resolveFilePath(requestUrl.pathname);
    const normalizedRoot = `${path.resolve(ROOT)}${path.sep}`;
    const normalizedFilePath = path.resolve(filePath);
    if (!normalizedFilePath.startsWith(normalizedRoot) && normalizedFilePath !== path.resolve(ROOT)) {
      send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.stat(filePath, (statError, stats) => {
      if (statError) {
        send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
      }

      const rangeHeader = req.headers['range'];
      if (rangeHeader && /^bytes=\d*-\d*$/.test(rangeHeader)) {
        const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
        const fileSize = stats.size;
        const start = startStr ? parseInt(startStr, 10) : 0;
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'no-store'
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (error) {
    send(res, 500, error.message || 'Server error', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

server.listen(PORT, () => {
  console.log(`Dev server running on http://localhost:${PORT}`);
});
