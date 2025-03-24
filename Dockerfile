# Stage 1
FROM node:20-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# RUN corepack enable
RUN corepack disable && npm install -g pnpm@latest
RUN apk add openssl
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json ./
COPY . .
RUN pnpm install

# Stage 2
FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN NODE_ENV=production pnpm build

# Stage 3
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
# RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1
CMD ["node", "server.js"]