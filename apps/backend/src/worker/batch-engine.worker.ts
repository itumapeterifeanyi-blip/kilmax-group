import 'dotenv/config';
import { Worker } from 'bullmq';
import { NestFactory } from '@nestjs/core';
import { BatchEngineModule } from '../modules/batch-engine/batch-engine.module';
import { BatchEngineService } from '../modules/batch-engine/batch-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('batch-engine-worker');

  // create a lightweight Nest application context to access services
  const app = await NestFactory.createApplicationContext(
    // import BatchEngineModule which exports BatchEngineService and imports PrismaModule
    // ensure PrismaModule is available in the same context
    [BatchEngineModule, PrismaModule] as any,
    { logger: false }
  );

  const batchService = app.get(BatchEngineService);
    const lockService = app.get('LockService' as any);

  const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379)
  } as any;

  const worker = new Worker('batch-engine-queue', async (job) => {
    logger.log(`Processing job ${job.name} id=${job.id}`);
    try {
        // acquire a short lock so multiple workers don't run batch engine simultaneously
        const lockKey = 'batch_engine_lock';
        const token = await lockService.acquire(lockKey, 30_000);
        if (!token) {
          logger.log('Skipping batch-engine run; lock held by another worker');
          return { skipped: true };
        }

        try {
      const res = await batchService.run(new Date());
      logger.log(`Batch run result: ${JSON.stringify(res)}`);
        } finally {
          await lockService.release(lockKey);
        }
    } catch (err) {
      logger.error('Error running batch engine', err as any);
      throw err;
    }
  }, { connection });

  worker.on('error', (err) => logger.error('Worker error', err as any));
  worker.on('failed', (job, err) => logger.error(`Job failed ${job.id}`, err as any));
  logger.log('Batch engine worker started, waiting for jobs...');

  // keep process alive
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Worker bootstrap failed', err);
  process.exit(1);
});
