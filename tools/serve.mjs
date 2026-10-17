// Tiny static file server for local checks (screenshots, PDF). No dependencies.
// Usage: import { serve } from './serve.mjs'; const { url, close } = await serve(rootDir);
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.md': 'text/markdown; charset=utf-8',
};

export async function serve(root, { port = 0, base = '/saskia/' } = {}) {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (!path.startsWith(base)) {
        res.writeHead(302, { location: base });
        return res.end();
      }
      path = normalize(path.slice(base.length)).replace(/^(\.\.[/\\])+/, '');
      let file = join(root, path);
      if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}${base}`;
  return { url, close: () => new Promise((resolve) => server.close(resolve)) };
}
