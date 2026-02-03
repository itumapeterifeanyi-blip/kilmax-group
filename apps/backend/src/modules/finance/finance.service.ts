import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class FinanceService {
    private readonly logger = new Logger(FinanceService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Reconcile financials for a completed delivery batch.
     * Calculates gross, costs, and net profit.
     */
    async reconcileBatch(batchId: string) {
        const batch = await this.prisma.deliveryBatch.findUnique({
            where: { id: batchId },
            include: {
                stops: {
                    include: {
                        delivery_request: true
                    }
                }
            }
        });

        if (!batch) return;

        // 1. Calculate Revenue (Gross Amount from accepted deliveries)
        let totalGross = 0;
        const deliveredStops = batch.stops.filter(s => s.status === 'delivered');

        for (const stop of deliveredStops) {
            // use Decimal -> number conversion carefully
            totalGross += Number(stop.delivery_request.total_amount || 0);
        }

        // 2. Calculate Costs (Mock logic: Driver Fee + Fuel)
        // In real system, this comes from complex rates
        const DRIVER_BASE_FEE = 2000;
        const PER_STOP_FEE = 500;
        const costAmount = DRIVER_BASE_FEE + (deliveredStops.length * PER_STOP_FEE);

        // 3. Platform Fee (e.g. 10% of gross)
        const platformFee = totalGross * 0.10;

        // 4. Owner Share (Net - Platform Fee)
        const netAmount = totalGross - costAmount - platformFee;
        const ownerShare = netAmount > 0 ? netAmount : 0;

        // 5. Create Transaction Record
        const transaction = await this.prisma.transaction.create({
            data: {
                related_delivery_batch_id: batch.id,
                transaction_type: TransactionType.payout, // or 'settlement'
                transaction_status: TransactionStatus.reconciled,
                gross_amount: totalGross,
                cost_amount: costAmount,
                platform_fee: platformFee,
                owner_share: ownerShare,
                net_amount: netAmount,
                currency: 'NGN',
                reconciled: true,
                reconciled_at: new Date(),
                metadata: {
                    note: 'Batch reconciliation auto-generated'
                }
            }
        });

        this.logger.log(`Reconciled Batch ${batchId}: Net Profit ${netAmount}`);
        return transaction;
    }
}
