-- Ensure users.email is globally unique to support email-only login.
DO $$
BEGIN
  IF EXISTS (
    SELECT email
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot apply global users.email uniqueness: duplicate emails exist.';
  END IF;
END $$;

DROP INDEX IF EXISTS users_tenant_email_idx;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
