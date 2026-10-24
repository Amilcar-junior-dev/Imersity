import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    {
      name: 'save-glb-endpoint',
      configureServer(server) {
        server.middlewares.use('/api/save-glb', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const { url, filename = 'master_base_head.glb' } = JSON.parse(body);
                const dir = path.resolve(__dirname, 'public/models');
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }

                const targetPath = path.join(dir, filename);
                let buffer: Buffer;

                if (url.startsWith('data:')) {
                  const base64Data = url.split(',')[1];
                  buffer = Buffer.from(base64Data, 'base64');
                } else {
                  const response = await fetch(url);
                  buffer = Buffer.from(await response.arrayBuffer());
                }

                fs.writeFileSync(targetPath, buffer);
                const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
                console.log(`[Vite] Modelo 3D salvo localmente em: ${targetPath} (${sizeMb} MB)`);

                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    localUrl: `/models/${filename}`,
                    sizeMb,
                  })
                );
              } catch (err: any) {
                console.error('[Vite] Erro ao salvar GLB localmente:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end('Method Not Allowed');
          }
        });
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
  },
});
