-- Execute once in the Supabase SQL Editor as the project database administrator.
-- The role intentionally starts without a password; set it separately and store it securely.
DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'epi_manager_app') THEN
    CREATE ROLE epi_manager_app LOGIN NOINHERIT;
  END IF;
END
$role$;

GRANT CONNECT ON DATABASE postgres TO epi_manager_app;
GRANT epi_manager_runtime TO epi_manager_app;

-- Then set a strong password in the SQL Editor (do not commit the real value):
-- ALTER ROLE epi_manager_app PASSWORD '<REPLACE_WITH_A_RANDOM_SECRET>';
