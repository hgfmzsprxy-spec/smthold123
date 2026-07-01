const http = require('http');
const fs = require('fs');
const path = require('path');

const sessionId = 'loader-launch-blocked';
const host = '127.0.0.1';
const startPort = 17777;
const maxAttempts = 10;
const outdir = path.resolve(__dirname);
const logFile = path.join(outdir, `trae-debug-log-${sessionId}.ndjson`);
const envFile = path.join(outdir, `${sessionId}.env`);

fs.mkdirSync(outdir, { recursive: true });
fs.writeFileSync(logFile, '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store'
};

const writeEnvFile = (port) => {
  fs.writeFileSync(envFile, `DEBUG_SERVER_URL=http://${host}:${port}/event\nDEBUG_SESSION_ID=${sessionId}\n`);
};

const createServer = () => http.createServer((req, res) => {
  if (req.method === 'OPTIONS' && req.url === '/event') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/event') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        if (!payload.ts) payload.ts = Date.now();
        fs.appendFileSync(logFile, `${JSON.stringify(payload)}\n`);
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('ok');
      } catch (error) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(error.message || 'invalid json');
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/logs') {
    const content = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/x-ndjson; charset=utf-8' });
    res.end(content);
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    const content = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
    const count = content ? content.trim().split(/\r?\n/).filter(Boolean).length : 0;
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', sessionId, count, logFile }));
    return;
  }

  res.writeHead(404, { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('not found');
});

const tryListen = (attempt = 0) => {
  const port = startPort + attempt;
  const server = createServer();

  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempt + 1 < maxAttempts) {
      tryListen(attempt + 1);
      return;
    }
    throw error;
  });

  server.listen(port, host, () => {
    writeEnvFile(port);
    const info = {
      api_url: `http://${host}:${port}/event`,
      session_id: sessionId,
      log_dir: outdir,
      log_file: logFile,
      env_file: envFile
    };
    console.log('@@DEBUG_SERVER_INFO');
    console.log(JSON.stringify(info, null, 2));
    console.log('@@END_DEBUG_SERVER_INFO');
  });
};

tryListen();
