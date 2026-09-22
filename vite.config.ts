import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    svelte(),
    {
      name: 'save-data-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const sendJson = (status: number, payload: unknown) => {
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(payload));
          };

          const readBody = (): Promise<string> =>
            new Promise((resolve, reject) => {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk.toString();
              });
              req.on('end', () => resolve(body));
              req.on('error', reject);
            });

          if (req.method === 'POST' && req.url === '/api/save-card') {
            readBody()
              .then((body) => {
                const newCard = JSON.parse(body);
                const filePath = path.resolve(__dirname, 'src/data/_all_cards.json');
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                let allCards = JSON.parse(fileContent);

                const existingIndex = allCards.findIndex((c: any) => c.id === newCard.id);
                if (existingIndex !== -1) {
                  allCards[existingIndex] = newCard;
                } else {
                  allCards.push(newCard);
                }

                allCards.sort((a: any, b: any) => (a.name || a.id).localeCompare(b.name || b.id));

                fs.writeFileSync(filePath, JSON.stringify(allCards, null, 2), 'utf-8');
                sendJson(200, { success: true });
              })
              .catch((error) => {
                console.error('Error saving card:', error);
                sendJson(500, { error: 'Failed to save card' });
              });
            return;
          }

          if (req.method === 'GET' && req.url === '/api/events') {
            try {
              const filePath = path.resolve(__dirname, 'src/data/sim/events.json');
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              const events = JSON.parse(fileContent);
              sendJson(200, events);
            } catch (error) {
              console.error('Error reading events:', error);
              sendJson(500, { error: 'Failed to read events' });
            }
            return;
          }

          if (req.method === 'POST' && req.url === '/api/save-event') {
            readBody()
              .then((body) => {
                const newEvent = JSON.parse(body);
                if (!newEvent?.key || typeof newEvent.key !== 'string') {
                  sendJson(400, { error: 'Event key is required' });
                  return;
                }

                const filePath = path.resolve(__dirname, 'src/data/sim/events.json');
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const events = JSON.parse(fileContent);

                if (!Array.isArray(events)) {
                  sendJson(500, { error: 'events.json is not an array' });
                  return;
                }

                const existingIndex = events.findIndex((e: any) => e.key === newEvent.key);
                if (existingIndex !== -1) {
                  events[existingIndex] = newEvent;
                } else {
                  events.push(newEvent);
                }

                fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n', 'utf-8');
                sendJson(200, { success: true, event: newEvent });
              })
              .catch((error) => {
                console.error('Error saving event:', error);
                sendJson(500, { error: 'Failed to save event' });
              });
            return;
          }

          if (req.method === 'POST' && req.url === '/api/save-flavor') {
            readBody()
              .then((body) => {
                const newFlavor = JSON.parse(body);
                if (!newFlavor?.imageName || typeof newFlavor.imageName !== 'string') {
                  sendJson(400, { error: 'imageName is required' });
                  return;
                }

                const filePath = path.resolve(
                  __dirname,
                  'src/data/sim/card_flavor_templates.json'
                );
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const flavors = JSON.parse(fileContent);

                if (!Array.isArray(flavors)) {
                  sendJson(500, { error: 'card_flavor_templates.json is not an array' });
                  return;
                }

                const existingIndex = flavors.findIndex(
                  (f: any) => f.imageName === newFlavor.imageName
                );
                if (existingIndex !== -1) {
                  flavors[existingIndex] = newFlavor;
                } else {
                  flavors.push(newFlavor);
                }

                flavors.sort((a: any, b: any) =>
                  (a.name || a.imageName).localeCompare(b.name || b.imageName)
                );

                fs.writeFileSync(filePath, JSON.stringify(flavors, null, 2) + '\n', 'utf-8');
                sendJson(200, { success: true, flavor: newFlavor });
              })
              .catch((error) => {
                console.error('Error saving flavor:', error);
                sendJson(500, { error: 'Failed to save flavor' });
              });
            return;
          }

          if (req.method === 'POST' && req.url === '/api/save-card-image') {
            readBody()
              .then((body) => {
                const payload = JSON.parse(body) as {
                  imageName?: string;
                  imageBase64?: string;
                };
                if (!payload.imageName || typeof payload.imageName !== 'string') {
                  sendJson(400, { error: 'imageName is required' });
                  return;
                }
                if (!payload.imageBase64 || typeof payload.imageBase64 !== 'string') {
                  sendJson(400, { error: 'imageBase64 is required' });
                  return;
                }

                const safeName = payload.imageName.replace(/[^a-zA-Z0-9_-]/g, '_');
                const dir = path.resolve(__dirname, 'public/assets/images/cards');
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                const filePath = path.join(dir, `${safeName}.jpg`);
                const buffer = Buffer.from(payload.imageBase64, 'base64');
                fs.writeFileSync(filePath, buffer);
                sendJson(200, { success: true, path: filePath });
              })
              .catch((error) => {
                console.error('Error saving card image:', error);
                sendJson(500, { error: 'Failed to save card image' });
              });
            return;
          }

          next();
        });
      },
    },
  ],
  base: command === 'serve' ? '/' : '/artimine/',
  server: {
    watch: {
      // Avoid full reloads when editors / flavor pipeline write these files.
      ignored: [
        '**/src/data/sim/events.json',
        '**/src/data/sim/card_flavor_templates.json',
      ],
    },
    proxy: {
      '/mistral-api': {
        target: 'https://api.mistral.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mistral-api/, ''),
      },
      '/comfy-api': {
        target: process.env.VITE_COMFY_URL || 'http://127.0.0.1:8188',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/comfy-api/, ''),
        // ComfyUI rejects cross-origin POSTs when Origin host != Host (403).
        // Strip browser Origin / Sec-Fetch-* so the loopback CSRF check is skipped.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('sec-fetch-site');
            proxyReq.removeHeader('sec-fetch-mode');
            proxyReq.removeHeader('sec-fetch-dest');
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@data': path.resolve(__dirname, './src/data'),
    },
  },
}));
