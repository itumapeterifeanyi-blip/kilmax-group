-- Final PostgreSQL schema for Gas Filling Shop

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE enum_user_role AS ENUM ('customer','driver','staff','manager','owner');
CREATE TYPE enum_delivery_request_status AS ENUM ('pending','confirmed','scheduled','assigned','in_transit','delivered','failed','cancelled','refunded');
CREATE TYPE enum_delivery_batch_status AS ENUM ('draft','ready','scheduled','in_progress','completed','cancelled');
CREATE TYPE enum_batch_stop_status AS ENUM ('pending','en_route','arrived','delivered','failed','skipped');
CREATE TYPE enum_transaction_type AS ENUM ('payment','refund','payout','fee','adjustment');
CREATE TYPE enum_transaction_status AS ENUM ('pending','posted','reconciled','failed');
CREATE TYPE enum_vehicle_status AS ENUM ('available','assigned','in_service','out_of_service');
CREATE TYPE enum_driver_status AS ENUM ('active','inactive','suspended');
CREATE TYPE enum_price_unit AS ENUM ('per_cylinder','per_kg','flat');

-- branches
CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text,
  state text,
  country text DEFAULT 'NG',
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- zones
CREATE TABLE zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  delivery_fee_multiplier numeric(10,4) DEFAULT 1.0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (branch_id, name)
);

-- customers
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  default_address text,
  default_zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
  password_hash text,
  last_login timestamptz
);

-- vehicles (declared before drivers to allow FK)
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number text UNIQUE,
  vehicle_type text,
  capacity_units integer NOT NULL DEFAULT 0,
  status enum_vehicle_status NOT NULL DEFAULT 'available',
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- drivers
CREATE TABLE drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  license_number text,
  status enum_driver_status NOT NULL DEFAULT 'active',
  current_vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
  password_hash text,
  last_login timestamptz
);

-- prices
CREATE TABLE prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  price_unit enum_price_unit NOT NULL DEFAULT 'per_cylinder',
  unit_amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  CHECK (unit_amount >= 0)
);

CREATE INDEX idx_prices_branch_zone ON prices(branch_id, zone_id);

-- admin_users
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role enum_user_role NOT NULL DEFAULT 'staff',
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- delivery_requests
CREATE TABLE delivery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref text UNIQUE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  price_id uuid REFERENCES prices(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  address text NOT NULL,
  latitude numeric(10,7),
  longitude numeric(10,7),
  contact_name text,
  contact_phone text,
  delivery_window_start timestamptz,
  delivery_window_end timestamptz,
  cut_off_time timestamptz,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status enum_delivery_request_status NOT NULL DEFAULT 'pending',
  payment_status text DEFAULT 'unpaid',
  payment_method text,
  gross_amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  tax_amount numeric(12,2) DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  audit_actor jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX idx_delivery_requests_cutoff ON delivery_requests(cut_off_time);

-- delivery_batches
CREATE TABLE delivery_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_ref text UNIQUE,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  delivery_window_start timestamptz,
  delivery_window_end timestamptz,
  cutoff_time timestamptz,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  capacity_units integer NOT NULL DEFAULT 0,
  used_units integer NOT NULL DEFAULT 0,
  max_stops integer,
  status enum_delivery_batch_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_batches_status_date ON delivery_batches(status, scheduled_date);

-- batch_stops
CREATE TABLE batch_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_batch_id uuid NOT NULL REFERENCES delivery_batches(id) ON DELETE CASCADE,
  delivery_request_id uuid NOT NULL REFERENCES delivery_requests(id) ON DELETE RESTRICT,
  stop_order integer NOT NULL,
  scheduled_time timestamptz,
  arrival_time timestamptz,
  completed_at timestamptz,
  status enum_batch_stop_status NOT NULL DEFAULT 'pending',
  failure_reason text,
  distance_meters integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (delivery_batch_id, stop_order),
  UNIQUE (delivery_batch_id, delivery_request_id)
);

CREATE INDEX idx_batch_stops_batch_order ON batch_stops(delivery_batch_id, stop_order);

-- batch_assignments
CREATE TABLE batch_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_batch_id uuid NOT NULL REFERENCES delivery_batches(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (delivery_batch_id, driver_id),
  UNIQUE (delivery_batch_id, vehicle_id)
);

-- transactions
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  related_delivery_request_id uuid REFERENCES delivery_requests(id) ON DELETE SET NULL,
  related_delivery_batch_id uuid REFERENCES delivery_batches(id) ON DELETE SET NULL,
  transaction_type enum_transaction_type NOT NULL,
  transaction_status enum_transaction_status NOT NULL DEFAULT 'pending',
  gross_amount numeric(12,2) NOT NULL,
  cost_amount numeric(12,2) DEFAULT 0,
  platform_fee numeric(12,2) DEFAULT 0,
  owner_share numeric(12,2) DEFAULT 0,
  net_amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  reconciled boolean NOT NULL DEFAULT false,
  reconciled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_transactions_related ON transactions(related_delivery_batch_id, related_delivery_request_id);

-- feedback
CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id uuid NOT NULL REFERENCES delivery_requests(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_feedback_delivery_request ON feedback(delivery_request_id);

-- Triggers to keep updated_at columns current
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to tables with updated_at
CREATE TRIGGER touch_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_zones_updated_at BEFORE UPDATE ON zones FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_prices_updated_at BEFORE UPDATE ON prices FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_delivery_requests_updated_at BEFORE UPDATE ON delivery_requests FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_delivery_batches_updated_at BEFORE UPDATE ON delivery_batches FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_batch_stops_updated_at BEFORE UPDATE ON batch_stops FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_batch_assignments_updated_at BEFORE UPDATE ON batch_assignments FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
CREATE TRIGGER touch_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();

COMMIT;
