const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.pdf':  'application/pdf',
};

http.createServer(function (req, res) {
  var url  = req.url.split('?')[0];
  try { url = decodeURIComponent(url); } catch (e) { /* keep raw */ }
  if (url === '/') url = '/index.html';
  var rel  = url.replace(/^\/+/, '');
  if (rel.indexOf('..') !== -1) { res.writeHead(403); res.end('Forbidden'); return; }
  var file = path.join(ROOT, rel);

  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    var ext  = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, function () {
  process.stdout.write('Server running at http://localhost:' + PORT + '\n');
});
