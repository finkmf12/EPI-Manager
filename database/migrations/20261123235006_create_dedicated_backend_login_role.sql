DO $role$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'epi_manager_app'
  ) THEN
    CREATE ROLE epi_manager_app LOGIN NOINHERIT;
  END IF;
END
$role$;

GRANT CONNECT ON DATABASE postgres TO epi_manager_app;
GRANT epi_manager_runtime TO epi_manager_app;
