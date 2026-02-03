import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchStopStatus, DeliveryRequestStatus } from '@prisma/client';

@Injectable()
export class DriverOperationsService {
    private readonly logger = new Logger(DriverOperationsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get the current active batch assignment for a driver.
     */
    async getActiveAssignment(driverId: string) {
        // Logic: Find a batch assignment where the batch is NOT completed
        // and return the stops.
        const assignment = await this.prisma.batchAssignment.findFirst({
            where: {
                driver_id: driverId,
                delivery_batch: {
                    status: { in: ['ready', 'in_progress'] } // Assuming 'scheduled' moves to 'ready'/'in_progress'
                }
            },
            include: {
                delivery_batch: {
                    include: {
                        stops: {
                            orderBy: { stop_order: 'asc' },
                            include: {
                                delivery_request: true
                            }
                        }
                    }
                }
            }
        });

        return assignment;
    }

    /**
     * Update the status of a batch stop.
     */
    async updateStopStatus(driverId: string, stopId: string, status: BatchStopStatus, failureReason?: string) {
        // 1. Verify driver owns this stop (via batch assignment)
        const stop = await this.prisma.batchStop.findUnique({
            where: { id: stopId },
            include: {
                delivery_batch: {
                    include: {
                        assignments: true
                    }
                },
                delivery_request: true
            }
        });

        if (!stop) {
            throw new NotFoundException('Stop not found');
        }

        const isAssigned = stop.delivery_batch.assignments.some(a => a.driver_id === driverId);
        if (!isAssigned) {
            throw new BadRequestException('Driver not assigned to this batch');
        }

        // 2. State transition validation could go here
        // e.g., cannot go from delivered to pending

        // 3. Update stop status
        const updatedStop = await this.prisma.batchStop.update({
            where: { id: stopId },
            data: {
                status,
                failure_reason: failureReason || null,
                arrival_time: status === 'arrived' ? new Date() : stop.arrival_time,
                completed_at: ['delivered', 'failed'].includes(status) ? new Date() : stop.completed_at
            }
        });

        // 4. Update parent Delivery Request status if stop is terminal
        if (status === 'delivered') {
            await this.prisma.deliveryRequest.update({
                where: { id: stop.delivery_request_id },
                data: { status: DeliveryRequestStatus.delivered } // Use enum
            });
        } else if (status === 'failed') {
            await this.prisma.deliveryRequest.update({
                where: { id: stop.delivery_request_id },
                data: { status: DeliveryRequestStatus.failed } // Use enum
            });
        } else if (status === 'en_route') {
            await this.prisma.deliveryRequest.update({
                where: { id: stop.delivery_request_id },
                data: { status: DeliveryRequestStatus.in_transit } // Use enum
            });
        }

        this.logger.log(`Driver ${driverId} updated stop ${stopId} to ${status}`);
        return updatedStop;
    }
}
