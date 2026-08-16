DO $$ BEGIN
 CREATE TYPE "recurring_subscription_status" AS ENUM('active', 'past_due', 'cancelled', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  provider varchar(30) NOT NULL,
  provider_event_id varchar(120) NOT NULL,
  order_id bigint REFERENCES payment_orders(id) ON DELETE SET NULL,
  order_uuid uuid NOT NULL,
  amount_vnd bigint NOT NULL,
  status varchar(30) NOT NULL,
  raw_payload jsonb,
  reconciled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_provider_event 
  ON payment_transactions (provider, provider_event_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_uuid 
  ON payment_transactions (order_uuid);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at 
  ON payment_transactions (created_at);

CREATE TABLE IF NOT EXISTS recurring_subscriptions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_code varchar(40) NOT NULL REFERENCES packages(code),
  offer_code varchar(40) NOT NULL,
  billing_period varchar(20) NOT NULL,
  price_vnd bigint NOT NULL,
  auto_renew boolean NOT NULL DEFAULT true,
  status recurring_subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamp with time zone NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  next_billing_at timestamp with time zone,
  dunning_attempts integer NOT NULL DEFAULT 0,
  last_dunning_at timestamp with time zone,
  consent_terms_version varchar(40) NOT NULL,
  consent_snapshot jsonb,
  cancelled_at timestamp with time zone,
  cancelled_by varchar(30),
  cancel_reason text,
  cancel_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_subscriptions_user_status 
  ON recurring_subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_recurring_subscriptions_next_billing 
  ON recurring_subscriptions (next_billing_at);
