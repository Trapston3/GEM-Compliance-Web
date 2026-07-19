-- Multiple private tenders: preserve legacy data by assigning ownership to Ajay Shelke.
DO $$ BEGIN
  CREATE TYPE tender_status AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tenders ADD COLUMN IF NOT EXISTS owner_id integer;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS status tender_status NOT NULL DEFAULT 'active';

UPDATE tenders
SET owner_id = COALESCE(owner_id, created_by, (SELECT id FROM users WHERE lower(email) = 'ajayshelke@mrpl.co.in' LIMIT 1))
WHERE owner_id IS NULL;

-- Existing rows are now owned by their creator where possible, otherwise Ajay Shelke.
ALTER TABLE tenders ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE tenders ADD CONSTRAINT tenders_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES users(id);

DO $$ BEGIN
  RAISE NOTICE 'Legacy tenders without an owner were backfilled to Ajay Shelke (or created_by). Reassign them in Admin > Tenders after confirming ownership.';
END $$;
