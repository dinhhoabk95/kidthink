ALTER TABLE "consent_logs" DROP CONSTRAINT IF EXISTS "consent_logs_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" DROP CONSTRAINT IF EXISTS "payment_orders_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_credit_ledger" DROP CONSTRAINT IF EXISTS "ai_credit_ledger_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "ai_credit_ledger" ADD CONSTRAINT "ai_credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_insert_only_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'BR-DM-05 / BR-SIB-06: Table % is INSERT-only; UPDATE and DELETE are forbidden', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE OR REPLACE TRIGGER trg_prevent_consent_logs_mutation
  BEFORE UPDATE OR DELETE ON consent_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_insert_only_mutation();--> statement-breakpoint

CREATE OR REPLACE TRIGGER trg_prevent_audit_logs_mutation
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_insert_only_mutation();
