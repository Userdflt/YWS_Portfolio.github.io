import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
const root = resolve('.');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.mp4':'video/mp4','.woff2':'font/woff2','.xml':'application/xml'};
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname.replace(/^\/YWS_Portfolio\.github\.io(?=\/)/, '');
    let file = resolve(root, '.' + decodeURIComponent(pathname));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    const headers = {'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache', 'Accept-Ranges':'bytes'};
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]); const end = Math.min(range[2] ? Number(range[2]) : body.length - 1, body.length - 1);
      if (start > end) { res.writeHead(416, {'Content-Range':`bytes */${body.length}`}).end(); return; }
      res.writeHead(206, {...headers, 'Content-Range':`bytes ${start}-${end}/${body.length}`, 'Content-Length':end-start+1});
      res.end(req.method === 'HEAD' ? undefined : body.subarray(start,end+1));
    } else {
      const compress=/\b gzip\b|^gzip\b|,gzip\b/.test(req.headers['accept-encoding']||'') && /\.(html|css|js|json|svg|xml)$/.test(file);
      const payload=compress?gzipSync(body):body;
      res.writeHead(200, {...headers,'Content-Length':payload.length,...(compress?{'Content-Encoding':'gzip','Vary':'Accept-Encoding'}:{})});
      res.end(req.method === 'HEAD' ? undefined : payload);
    }
  } catch { res.writeHead(404, {'Content-Type':'text/plain'}).end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Portfolio preview: http://localhost:4173'));
