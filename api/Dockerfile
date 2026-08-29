FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json api/pnpm-lock.yaml ./api/

RUN pnpm install --filter ./api --frozen-lockfile

COPY api ./api

WORKDIR /app/api

RUN pnpm run db:generate && pnpm run build

EXPOSE 3000

CMD ["sh", "-c", "pnpm run db:deploy && node dist/src/index.js"]
