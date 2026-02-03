apps/backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   └── env.schema.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── utils/
│   │   └── constants/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   └── dtos/
│   │   ├── customers/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   └── dtos/
│   │   ├── branches/
│   │   ├── zones/
│   │   ├── pricing/
│   │   ├── delivery-requests/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── validators/
│   │   │   └── dtos/
│   │   ├── delivery-batches/
│   │   ├── batch-stops/
│   │   ├── batch-engine/    # batch-building engine logic (service + worker interfaces)
│   │   ├── batch-assignments/
│   │   ├── drivers/
│   │   ├── vehicles/
│   │   ├── transactions/
│   │   ├── feedback/
│   │   ├── admin/
│   │   └── reports/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── queues/
│   │   ├── producers/
│   │   ├── processors/
│   │   └── consumers/
│   ├── workers/
│   │   ├── batch-engine.worker.ts
│   │   └── reconciliation.worker.ts
│   ├── shared/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── entities/
│   └── tests/
├── scripts/
├── docker/
│   └── (container helpers)
├── docs/
├── package.json
├── tsconfig.json
└── README.md
