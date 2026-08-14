FROM oven/bun:1.3

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
