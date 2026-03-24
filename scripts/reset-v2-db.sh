#!/usr/bin/env bash
set -euo pipefail

# Breaking v2 bootstrap: clear database and push latest schema.
pnpm prisma migrate reset --force --skip-seed
pnpm prisma generate
