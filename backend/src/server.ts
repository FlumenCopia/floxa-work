import http from 'http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { ENV } from './config/env.js';
import { initWebSocketServer } from './websocket/socketServer.js';

let server: http.Server | null = null;
let isShuttingDown = false;

async function bootstrap() {
  try {
    const app = createApp();
    server = http.createServer(app);

    // Initialize WebSockets & WebRTC Signaling
    initWebSocketServer(server);

    // Database Connection
    try {
      await connectDatabase();
    } catch (dbErr) {
      if (ENV.IS_PRODUCTION) {
        console.error('[FLOXA Work] FATAL: Production database connection failed. Aborting startup.');
        process.exit(1);
      } else {
        console.warn('[FLOXA Work] Running with local standalone mock/offline DB fallback (development only).');
      }
    }

    server.listen(ENV.PORT, () => {
      console.log(`[FLOXA Work Backend] Server listening at http://localhost:${ENV.PORT} [${ENV.NODE_ENV}]`);
      console.log(`[FLOXA Work Backend] WebSockets live at ws://localhost:${ENV.PORT}/ws`);
    });

    // Graceful Shutdown Registration
    const handleShutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`\n[FLOXA Work] Received ${signal}. Commencing graceful drain and shutdown...`);

      if (server) {
        server.close(async () => {
          console.log('[FLOXA Work] HTTP and WebSocket connections drained.');
          try {
            await disconnectDatabase();
          } catch (e) {
            console.error('[FLOXA Work] Error during database disconnect:', e);
          }
          console.log('[FLOXA Work] Graceful shutdown complete. Exiting.');
          process.exit(0);
        });

        // Force shutdown if connections do not drain in 10s
        setTimeout(() => {
          console.error('[FLOXA Work] Graceful shutdown timed out. Forcing process termination.');
          process.exit(1);
        }, 10000).unref();
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('[FLOXA Work] Fatal startup error:', error);
    process.exit(1);
  }
}

bootstrap();
