import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { initRealtime } from './lib/realtime';

const app = createApp();
const httpServer = createServer(app);
initRealtime(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`Backend listening on port ${env.PORT}`);
});
