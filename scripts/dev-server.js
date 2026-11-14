import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import handler from '../api/videos.js';
const root = path.resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
http.createServer(async (req, res) => {
  if (new URL(req.url, 'http://localhost').pathname === '/api/videos') {
    res.status = code => {res.statusCode=code;return res;};
    res.json = data => {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
    return handler(req,res);
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const data = await readFile(file);
    res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');res.end(data);
  } catch {res.statusCode=404;res.end('Not found');}
}).listen(5173,'127.0.0.1',()=>console.log('Hudalipi preview: http://127.0.0.1:5173'));
