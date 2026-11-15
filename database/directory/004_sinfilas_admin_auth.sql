-- Directory Sarchí admin can reuse an allowlisted, active Sin Filas account.
-- Idempotent migration; existing local accounts keep their passwords.
ALTER TABLE directory.admin_accounts ADD COLUMN IF NOT EXISTS auth_provider varchar(20) NOT NULL DEFAULT 'Local';
DO $migration$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='directory_admin_auth_provider_check' AND conrelid='directory.admin_accounts'::regclass) THEN
  ALTER TABLE directory.admin_accounts ADD CONSTRAINT directory_admin_auth_provider_check CHECK (auth_provider IN ('Local', 'SinFilas'));
 END IF;
END $migration$;
-- The owner account was authorized separately in the production DB.
-- Do not copy restaurant password hashes into this table.
