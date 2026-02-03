import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import { URL } from 'url';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendDriverAssignment(driver: any, batch: any) {
    const message = `You have been assigned batch ${batch.batch_ref || batch.id} scheduled ${batch.scheduled_date}`;
    // If webhook configured, POST there
    const webhook = process.env.NOTIFY_WEBHOOK;
    if (webhook) {
      try {
        await this.postJson(webhook, { to: driver.phone || driver.id, message, driver, batch });
        this.logger.log(`Sent webhook notification for driver ${driver.id}`);
        return true;
      } catch (err) {
        this.logger.error('Failed to POST notification webhook', err as any);
      }
    }

    // Fallback: log only
    this.logger.log(`Notification (log) -> ${driver.phone || driver.id}: ${message}`);
    return false;
  }

  private postJson(endpoint: string, body: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const payload = JSON.stringify(body);
      const opts: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port ? Number(url.port) : 443,
        path: url.pathname + (url.search || ''),
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      };

      const req = https.request(opts, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}
