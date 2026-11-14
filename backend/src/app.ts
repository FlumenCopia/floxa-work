import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ENV } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeadersMiddleware, apiRateLimiter } from './middleware/security.middleware.js';

export function createApp(): express.Application {
  const app = express();

  // Apply Security Headers (XSS, FrameGuard, SniffGuard, HSTS)
  app.use(securityHeadersMiddleware);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || ENV.CORS_ORIGIN.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Dev permissive
        }
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());

  // Apply API-wide rate limiting
  app.use('/api', apiRateLimiter);

  // Serve static media
  app.use('/media', express.static(path.resolve(process.cwd(), ENV.MEDIA_ROOT)));

  // Mount API
  app.use('/api', apiRoutes);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
