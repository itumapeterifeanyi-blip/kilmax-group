import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BatchEngineService {
  private readonly logger = new Logger(BatchEngineService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run batch creation for pending delivery requests whose cut_off_time <= now
   * Groups by branch, zone, scheduled_date and creates batches enforcing vehicle capacity.
   */
  async run(now: Date = new Date()) {
    // 1. select pending requests eligible for batching
    const requests = await this.prisma.deliveryRequest.findMany({
      where: {
        status: 'pending'
      },
      orderBy: [
        { cut_off_time: 'asc' },
        { delivery_window_start: 'asc' },
        { requested_at: 'asc' },
        { id: 'asc' }
      ]
    });

    // filter by cutoff time <= now (if cut_off_time null, include)
    const eligible = requests.filter((r) => !r.cut_off_time || new Date(r.cut_off_time) <= now);
    if (eligible.length === 0) {
      this.logger.log('No eligible delivery requests found for batching.');
      return { createdBatches: 0 };
    }

    // group by branch_id, zone_id, scheduled_date (use delivery_window_start date or requested_at date)
    const groups = new Map<string, any[]>();
    for (const r of eligible) {
      const scheduled = r.delivery_window_start ? new Date(r.delivery_window_start) : new Date(r.requested_at);
      const dateKey = scheduled.toISOString().slice(0, 10); // YYYY-MM-DD
      const key = `${r.branch_id || 'null'}::${r.zone_id || 'null'}::${dateKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ ...r, scheduled_date: dateKey });
    }

    let createdBatches = 0;

    for (const [key, items] of groups.entries()) {
      // deterministic sort already ensured; compute branch and zone
      const [branch_id, zone_id, scheduled_date] = key.split('::');

      // determine vehicle capacity: max capacity_units among vehicles in branch
      const vehicles = await this.prisma.vehicle.findMany({ where: { branch_id: branch_id === 'null' ? null : branch_id } });
      const maxCapacity = vehicles.length ? Math.max(...vehicles.map((v) => v.capacity_units || 0)) : 100; // default

      // iterate and split into batches by capacity
      let currentBatch = {
        branch_id: branch_id === 'null' ? null : branch_id,
        zone_id: zone_id === 'null' ? null : zone_id,
        scheduled_date,
        cutoff_time: now,
        capacity_units: maxCapacity,
        used_units: 0,
        stops: [] as any[],
      };

      for (const req of items) {
        const units = req.quantity || 1;
        if (currentBatch.used_units + units > currentBatch.capacity_units) {
          // persist current batch
          await this.createBatchFrom(currentBatch);
          createdBatches++;
          // start new batch
          currentBatch = {
            branch_id: branch_id === 'null' ? null : branch_id,
            zone_id: zone_id === 'null' ? null : zone_id,
            scheduled_date,
            cutoff_time: now,
            capacity_units: maxCapacity,
            used_units: 0,
            stops: [] as any[],
          };
        }

        currentBatch.stops.push(req);
        currentBatch.used_units += units;
      }

      // persist last batch if it has stops
      if (currentBatch.stops.length > 0) {
        await this.createBatchFrom(currentBatch);
        createdBatches++;
      }
    }

    this.logger.log(`Batch engine created ${createdBatches} batches.`);
    return { createdBatches };
  }

  private async createBatchFrom(batchData: any) {
    // transactional creation of delivery_batch and batch_stops and update delivery_requests status
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.deliveryBatch.create({
        data: {
          batch_ref: `BATCH-${Date.now()}`,
          branch_id: batchData.branch_id,
          zone_id: batchData.zone_id,
          scheduled_date: new Date(batchData.scheduled_date),
          delivery_window_start: null,
          delivery_window_end: null,
          cutoff_time: new Date(batchData.cutoff_time),
          capacity_units: batchData.capacity_units,
          used_units: batchData.used_units,
          status: 'ready'
        }
      });

      let order = 1;
      for (const stopReq of batchData.stops) {
        await tx.batchStop.create({
          data: {
            delivery_batch_id: batch.id,
            delivery_request_id: stopReq.id,
            stop_order: order++,
            status: 'pending'
          }
        });

        // update delivery request status to 'scheduled'
        await tx.deliveryRequest.update({ where: { id: stopReq.id }, data: { status: 'scheduled' } });
      }

      return batch;
    });
  }
}
