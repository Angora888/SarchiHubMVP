-- Existing local directory admin accounts remain supported.
-- A Sin Filas account must already exist AND be active to authenticate.
ALTER TABLE directory.admin_accounts
  ADD COLUMN IF NOT EXISTS auth_provider varchar(20) NOT NULL DEFAULT 'Local';
ALTER TABLE directory.admin_accounts
  ADD CONSTRAINT directory_admin_auth_provider_check CHECK (auth_provider IN ('Local', 'SinFilas'));
-- Upsert for the verified owner ONLY; no password/hash is copied from Sin Filas.
INSERT INTO directory.admin_accounts (email, password_hash, auth_provider, is_active)
VALUES ('angora88@gmail.com', 'SIN_FILAS_AUTH_NO_LOCAL_PASSWORD', 'SinFilas', TRUE)
ON CONFLICT (email) DO UPDATE
  SET auth_provider = 'SinFilas', password_hash = 'SIN_FILAS_AUTH_NO_LOCAL_PASSWORD', is_active = TRUE;
