#!/usr/bin/env bash
# Create Postgres roles + databases for Postyim (prod + dev).
# Usage: sudo -u postgres bash scripts/pg-create-local-postyimdb.sh
set -euo pipefail

PROD_DB="postyim"
PROD_ROLE="postyim_app"
DEV_DB="postyim_dev"
DEV_ROLE="postyim_dev_app"
PROD_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
DEV_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"

psql -d postgres -v ON_ERROR_STOP=1 <<-EOSQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${PROD_ROLE}') THEN
    EXECUTE format('CREATE ROLE ${PROD_ROLE} LOGIN PASSWORD %L', '${PROD_PASS//\'/\'\'}');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DEV_ROLE}') THEN
    EXECUTE format('CREATE ROLE ${DEV_ROLE} LOGIN PASSWORD %L', '${DEV_PASS//\'/\'\'}');
  END IF;
END
\$\$;

SELECT format('CREATE DATABASE ${PROD_DB} OWNER ${PROD_ROLE}')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${PROD_DB}')\gexec

SELECT format('CREATE DATABASE ${DEV_DB} OWNER ${DEV_ROLE}')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${DEV_DB}')\gexec
EOSQL

for spec in "${PROD_DB}:${PROD_ROLE}" "${DEV_DB}:${DEV_ROLE}"; do
  DB="${spec%%:*}"
  ROLE="${spec##*:}"
  psql -d "$DB" -v ON_ERROR_STOP=1 <<-EOSQL
GRANT ALL ON SCHEMA public TO ${ROLE};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${ROLE};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${ROLE};
EOSQL
done

echo ""
echo "Production (.env on /var/www/postyim/prod/current/.env):"
echo "DATABASE_URL=\"postgresql://${PROD_ROLE}:${PROD_PASS}@127.0.0.1:5432/${PROD_DB}\""
echo ""
echo "Development (.env on /var/www/postyim/dev/current/.env):"
echo "DATABASE_URL=\"postgresql://${DEV_ROLE}:${DEV_PASS}@127.0.0.1:5432/${DEV_DB}\""
echo ""
