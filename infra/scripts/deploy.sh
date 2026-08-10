#!/usr/bin/env bash
set -eo pipefail

HEALTH_URL=${HEALTH_URL:-"http://localhost:3000/api/guest/health"}
MAX_RETRIES=5
RETRY_DELAY=2

echo "Starting deploy..."

# 1. Restart services (Smoke step)
# docker compose -f docker-compose.smoke.yml up -d

echo "Waiting for health check at $HEALTH_URL..."

check_health() {
  local status_code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
  if [ "$status_code" = "200" ]; then
    return 0
  else
    echo "Health check returned $status_code"
    return 1
  fi
}

# 2. Wait for health check
HEALTH_PASSED=false
for i in $(seq 1 $MAX_RETRIES); do
  if check_health; then
    echo "Deploy successful (health check passed)."
    HEALTH_PASSED=true
    break
  fi
  echo "Retry $i/$MAX_RETRIES in $RETRY_DELAY seconds..."
  sleep "$RETRY_DELAY"
done

# 3. Abort and revert if health check fails
if [ "$HEALTH_PASSED" = false ]; then
  echo "Health check failed after $MAX_RETRIES attempts. Aborting and reverting..."
  
  # Mock revert
  # docker compose -f docker-compose.smoke.yml down
  # git checkout HEAD^
  # docker compose -f docker-compose.smoke.yml up -d
  
  exit 1
fi

exit 0
