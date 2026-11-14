import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import crypto from 'crypto';
import { ENV } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeadersMiddleware, apiRateLimiter } from './middleware/security.middleware.js';
import { getDatabaseHealth } from './config/database.js';
import { getStorageProvider } from './services/storage/index.js';

export function createApp(): express.Application {
  const app = express();

  if (ENV.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  // Request ID & Correlation Tracking Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // Apply Security Headers (XSS, FrameGuard, SniffGuard, HSTS)
  app.use(securityHeadersMiddleware);

  // Hardened Production CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server) or in CORS_ORIGIN
        if (!origin || ENV.CORS_ORIGIN.includes(origin)) {
          callback(null, true);
        } else if (ENV.IS_PRODUCTION) {
          callback(new Error(`CORS policy violation: Origin ${origin} not permitted.`));
        } else {
          callback(null, true); // Permissive only in non-production local development
        }
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());

  // Liveness Probe (Indicates whether the process is alive)
  app.get(['/health', '/health/live'], (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'floxa-work-backend',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date(),
    });
  });

  // Readiness Probe (Verifies dependencies: MongoDB cluster and Storage Vault)
  app.get('/health/ready', async (_req: Request, res: Response) => {
    const dbHealth = await getDatabaseHealth();
    const storageProvider = getStorageProvider();
    const storageHealth = await storageProvider.getHealth();

    const isReady = dbHealth.status === 'connected';

    const payload = {
      status: isReady ? 'ready' : 'unready',
      database: dbHealth,
      storage: storageHealth,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date(),
    };

    if (isReady) {
      res.json(payload);
    } else {
      res.status(503).json(payload);
    }
  });

  // Apply API-wide rate limiting
  app.use('/api', apiRateLimiter);

  // Serve static public media (avatars, icons)
  app.use('/media', express.static(path.resolve(process.cwd(), ENV.MEDIA_ROOT)));

  // Mount Primary API
  app.use('/api', apiRoutes);

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
}
