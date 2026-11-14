import http from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { ENV } from './config/env.js';
import { initWebSocketServer } from './websocket/socketServer.js';

async function bootstrap() {
  try {
    const app = createApp();
    const server = http.createServer(app);

    // Initialize WebSockets & WebRTC Signaling
    initWebSocketServer(server);

    // Attempt DB connection (non-fatal if offline during local scaffolding)
    try {
      await connectDatabase();
    } catch (dbErr) {
      console.warn('[FLOXA Work] Running with local standalone mock/offline DB fallback.');
    }

    server.listen(ENV.PORT, () => {
      console.log(`[FLOXA Work Backend] Server listening at http://localhost:${ENV.PORT}`);
      console.log(`[FLOXA Work Backend] WebSockets live at ws://localhost:${ENV.PORT}/ws`);
    });
  } catch (error) {
    console.error('[FLOXA Work] Fatal startup error:', error);
    process.exit(1);
  }
}

bootstrap();

