const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(PUBLIC_DIR, 'data');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Configuración de encabezados CORS globales y acceso a red privada local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURI(urlObj.pathname);

  // Endpoint para guardar CSV directamente en el disco duro físico
  if (req.method === 'POST' && pathname === '/api/save-csv') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { file, content } = JSON.parse(body);
        const allowedFiles = ['cuentas.csv', 'transacciones.csv', 'servicios.csv'];
        if (!allowedFiles.includes(file)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Archivo no permitido' }));
          return;
        }

        const targetPath = path.join(DATA_DIR, file);
        fs.writeFileSync(targetPath, content.trim() + '\n', 'utf8');
        console.log(`[CSV ACTUALIZADO EN DISCO]: ${file} (${content.trim().split('\n').length} filas)`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, file, message: 'Archivo modificado correctamente en disco.' }));
      } catch (e) {
        console.error('[ERROR GUARDANDO CSV]:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Endpoint para leer CSV directamente del disco
  if (req.method === 'GET' && pathname === '/api/read-csv') {
    const file = urlObj.searchParams.get('file');
    const allowedFiles = ['cuentas.csv', 'transacciones.csv', 'servicios.csv'];
    if (!allowedFiles.includes(file)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Archivo no permitido' }));
      return;
    }
    const targetPath = path.join(DATA_DIR, file);
    if (fs.existsSync(targetPath)) {
      const data = fs.readFileSync(targetPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8' });
      res.end(data);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Archivo no encontrado' }));
    }
    return;
  }

  // Servir archivos estáticos
  let reqUrl = pathname;
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  }

  const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Recurso no encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});
