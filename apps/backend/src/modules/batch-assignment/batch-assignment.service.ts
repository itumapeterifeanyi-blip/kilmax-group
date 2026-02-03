import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LockService } from '../../queue/lock.service';
import { NotificationService } from '../../notifications/notification.service';

@Injectable()
export class BatchAssignmentService {
  private readonly logger = new Logger(BatchAssignmentService.name);
  constructor(private prisma: PrismaService, private lock: LockService, private notifier: NotificationService) {}

  /**
   * Assign available drivers to ready batches.
   * Returns number of assignments created.
   */
  async run(assignedBy: any = { system: true }) {
    const readyBatches = await this.prisma.deliveryBatch.findMany({
      where: { status: 'ready' },
      include: { assignments: true }
    });

    let created = 0;

    // acquire distributed lock to avoid concurrent assignment runs
    const lockKey = 'batch_assignment_lock';
    const token = await this.lock.acquire(lockKey, 30_000);
    if (!token) {
      this.logger.log('Batch assignment skipped: another process holds the lock');
      return { assigned: 0, reason: 'locked' };
    }

    try {
      for (const batch of readyBatches) {
        if (batch.assignments && batch.assignments.length > 0) continue; // already assigned

        // find an available driver whose current vehicle belongs to the same branch (if branch specified)
        const driver = await this.prisma.driver.findFirst({
          where: {
            is_available: true,
            status: 'active',
            current_vehicle: batch.branch_id ? { branch_id: batch.branch_id } : undefined
          },
          include: { current_vehicle: true }
        });

        if (!driver) {
          this.logger.log(`No available driver found for batch ${batch.id}`);
          continue;
        }

        await this.prisma.$transaction(async (tx) => {
          const assignment = await tx.batchAssignment.create({
            data: {
              delivery_batch_id: batch.id,
              driver_id: driver.id,
              vehicle_id: driver.current_vehicle_id,
              assigned_by: assignedBy
            }
          });

          await tx.deliveryBatch.update({ where: { id: batch.id }, data: { vehicle_id: driver.current_vehicle_id, status: 'scheduled' } });

          await tx.driver.update({ where: { id: driver.id }, data: { is_available: false } });

          // notify driver (best-effort)
          try {
            await this.notifier.sendDriverAssignment(driver, batch);
          } catch (notifyErr) {
            this.logger.error('Failed to notify driver', notifyErr as any);
          }

          this.logger.log(`Assigned driver ${driver.id} to batch ${batch.id}`);
        });

        created++;
      }

      return { assigned: created };
    } finally {
      await this.lock.release(lockKey, token);
    }
  }

  async getBatchesForDriver(driverId: string) {
    if (!driverId) return [];
    const assignments = await this.prisma.batchAssignment.findMany({
      where: { driver_id: driverId },
      include: { delivery_batch: { include: { stops: true, vehicle: true } } },
      orderBy: { assigned_at: 'desc' }
    });

    return assignments.map((a) => ({ assignment: a, batch: a.delivery_batch }));
  }
}
