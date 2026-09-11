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

                allCards.sort((a: any, b: any) =>
                  (a.name || a.id).localeCompare(b.name || b.id)
                );

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

          next();
        });
      },
    },
  ],
  base: command === 'serve' ? '/' : '/artimine/',
  server: {
    watch: {
      // Avoid full reloads when the event editor writes this file.
      ignored: ['**/src/data/sim/events.json'],
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
