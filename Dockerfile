FROM node:20-alpine
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && apk add --no-cache openssl

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/queue/package.json ./packages/queue/
COPY packages/scoring/package.json ./packages/scoring/
COPY packages/whatsapp/package.json ./packages/whatsapp/

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm db:generate
RUN pnpm build

ENV NODE_ENV=production
ENV API_PORT=3001
ENV API_HOST=0.0.0.0
EXPOSE 3001

CMD ["pnpm", "--filter", "@carequeue/api", "start"]
