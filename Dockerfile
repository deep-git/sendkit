FROM oven/bun:1.3

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/remote-mcp/package.json ./apps/remote-mcp/
COPY packages/core/package.json ./packages/core/
COPY packages/cli/package.json ./packages/cli/
COPY packages/local-mcp/package.json ./packages/local-mcp/

RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY packages/core ./packages/core
COPY apps/remote-mcp ./apps/remote-mcp

RUN bun run build:core

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "apps/remote-mcp/src/index.ts"]
