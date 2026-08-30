#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
local_api_pid=""

cleanup() {
  if [ -n "$local_api_pid" ]; then
    kill "$local_api_pid" 2>/dev/null || true
  fi
}

wait_for_api() {
  for _ in {1..30}; do
    if curl -fsS "$health_url" >/dev/null; then
      return
    fi

    sleep 1
  done

  curl -fsS "$health_url" >/dev/null
}

cd "$repo_root"

[ -f api/.env ] || cp api/.env.sample api/.env
[ -f mobile/.env ] || cp mobile/.env.example mobile/.env

api_port="${API_PORT:-3000}"
health_url="http://127.0.0.1:${api_port}/api/v1"

pnpm install --config.confirmModulesPurge=false

read -r -p "Run api in docker? [Y/n] " run_api_in_docker
case "${run_api_in_docker:-y}" in
  y|Y|yes|YES)
    docker compose up --build -d api
    wait_for_api
    docker compose exec -T api pnpm run db:seed
    ;;
  n|N|no|NO)
    trap cleanup EXIT
    cd "$repo_root/api"
    pnpm run db:generate
    pnpm run db:migrate
    pnpm run db:seed
    pnpm run dev &
    local_api_pid="$!"
    wait_for_api
    ;;
  *)
    echo "Please answer yes or no."
    exit 1
    ;;
esac

cd "$repo_root/mobile"
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

pnpm run ios
