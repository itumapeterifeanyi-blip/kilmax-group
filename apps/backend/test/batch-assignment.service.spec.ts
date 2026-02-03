import { BatchAssignmentService } from '../src/modules/batch-assignment/batch-assignment.service';

class MockPrisma {
  deliveryBatch = { findMany: jest.fn() } as any;
  driver = { findFirst: jest.fn(), update: jest.fn() } as any;
  batchAssignment = { create: jest.fn(), findMany: jest.fn() } as any;
  deliveryBatchUpdate = jest.fn();
  $transaction = jest.fn();

  constructor() {
    // default $transaction to call function
    this.$transaction.mockImplementation(async (fn: any) => fn(this));
  }
}

class MockLock {
  acquire = jest.fn();
  release = jest.fn();
}

class MockNotifier {
  sendDriverAssignment = jest.fn();
}

describe('BatchAssignmentService', () => {
  it('returns 0 when no ready batches', async () => {
    const prisma = new MockPrisma();
    prisma.deliveryBatch.findMany.mockResolvedValue([]);
    const lock = new MockLock();
    lock.acquire.mockResolvedValue('token');
    const notifier = new MockNotifier();
    const svc = new BatchAssignmentService(prisma as any, lock as any, notifier as any);
    const res = await svc.run({ system: true });
    expect(res).toEqual({ assigned: 0 });
  });

  it('assigns a driver when available', async () => {
    const prisma = new MockPrisma();
    const batch = { id: 'b1', assignments: [] };
    prisma.deliveryBatch.findMany.mockResolvedValue([batch]);
    const driver = { id: 'd1', current_vehicle_id: 'v1', phone: '+100' };
    prisma.driver.findFirst.mockResolvedValue(driver);
    prisma.batchAssignment.create.mockResolvedValue({ id: 'a1' });
    prisma.deliveryBatch.update = jest.fn().mockResolvedValue(true);
    prisma.driver.update = jest.fn().mockResolvedValue(true);
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));

    const lock = new MockLock();
    lock.acquire.mockResolvedValue('tok');
    const notifier = new MockNotifier();
    notifier.sendDriverAssignment.mockResolvedValue(true);

    const svc = new BatchAssignmentService(prisma as any, lock as any, notifier as any);
    const res = await svc.run({ system: true });
    expect(res.assigned).toBe(1);
    expect(prisma.batchAssignment.create).toHaveBeenCalled();
    expect(notifier.sendDriverAssignment).toHaveBeenCalledWith(driver, batch);
  });
});
