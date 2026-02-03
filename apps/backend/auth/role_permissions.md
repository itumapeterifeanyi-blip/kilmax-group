# Role → Permission Matrix

Permission keys (short):
- `auth.login`, `auth.refresh`
- `profile.read`, `profile.update.own`

- Delivery Requests:
  - `delivery_request.create`
  - `delivery_request.view.own`
  - `delivery_request.view.any`
  - `delivery_request.update.own`
  - `delivery_request.update.internal`
  - `delivery_request.cancel.own`
  - `delivery_request.refund`

- Delivery Batches:
  - `delivery_batch.create`
  - `delivery_batch.view.any`
  - `delivery_batch.view.assigned`
  - `delivery_batch.update.status`
  - `delivery_batch.assign`
  - `delivery_batch.split`

- Batch Stops:
  - `batch_stop.update.status`
  - `batch_stop.reorder`

- Drivers & Vehicles:
  - `driver.view`, `driver.manage`
  - `vehicle.view`, `vehicle.manage`

- Branches / Zones:
  - `branch.view`, `branch.manage`

- Pricing:
  - `price.view`, `price.manage`

- Transactions:
  - `transaction.create`, `transaction.view`, `transaction.reconcile`

- Feedback:
  - `feedback.create`, `feedback.view`

- Admin / Audit / Reports:
  - `admin_user.manage`, `audit.view`, `reports.view`, `reports.export`

---

Role mappings (allowed permission keys)

- `customer`:
  - `auth.login`, `auth.refresh`
  - `profile.read`, `profile.update.own`
  - `delivery_request.create`, `delivery_request.view.own`, `delivery_request.cancel.own`
  - `feedback.create`, `feedback.view`

- `driver`:
  - `auth.login`, `auth.refresh`
  - `profile.read`, `profile.update.own`
  - `delivery_request.view.assigned`, `delivery_batch.view.assigned`
  - `delivery_batch.update.status`, `batch_stop.update.status`
  - `driver.view` (self), `vehicle.view` (assigned)
  - `feedback.create` (for deliveries)

- `staff`:
  - All `auth.*` and `profile.*`
  - `delivery_request.create` (on behalf), `delivery_request.view.any`, `delivery_request.update.internal`, `delivery_request.refund`
  - `delivery_batch.create`, `delivery_batch.view.any`, `delivery_batch.split`, `delivery_batch.update.status`
  - `batch_stop.reorder`, `batch_stop.update.status`
  - `driver.manage` (day-to-day), `vehicle.manage`
  - `price.view`, `transaction.create`, `transaction.view`
  - `feedback.view`, `reports.view` (operational)

- `manager`:
  - All `staff` permissions plus:
  - `delivery_batch.assign`, `branch.manage`, `price.manage`
  - `transaction.reconcile`, `audit.view` (limited), `reports.export`

- `owner`:
  - Full access to all keys above, including `admin_user.manage`, full `audit.view`, and `reports.export`.

---

Notes:
- The matrix restricts `view` and `update` operations to `own` or `assigned` where appropriate (enforced at policy/runtime).
- Implement permission checks as boolean permission keys attached to JWT or enforced by middleware/guards referencing user role and resource ownership.
