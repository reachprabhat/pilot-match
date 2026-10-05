const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/fonts/inter-regular.ttf': ['fonts/inter-regular.ttf', 'font/ttf'],
  '/fonts/inter-semibold.ttf': ['fonts/inter-semibold.ttf', 'font/ttf'],
};
http.createServer((req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (req.method !== 'GET' || !file) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(root, file[0]), (error, data) => {
    if (error) { res.writeHead(500); res.end('Unable to load page'); return; }
    res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(5173, '0.0.0.0', () => console.log('Preview: http://localhost:5173'));
