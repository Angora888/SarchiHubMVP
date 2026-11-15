-- Only apply to the directory staging branch after reviewing schema.
ALTER TABLE directory.businesses ADD COLUMN IF NOT EXISTS contact_email varchar(254);
