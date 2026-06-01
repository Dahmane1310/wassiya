# syntax=docker/dockerfile:1
#
# Docker image for apps/admin (Next.js 16, standalone output).
# Build from the REPO ROOT so the pnpm workspace resolves:
#
#   docker build -f apps/admin/Dockerfile \
#     --build-arg NEXT_PUBLIC_CONVEX_URL=https://<prod>.convex.cloud \
#     --build-arg NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://<domain>/callback \
#     -t admin .
#
# NEXT_PUBLIC_* are inlined into the client bundle at build time → build args.
# Runtime secrets (WORKOS_CLIENT_ID / WORKOS_API_KEY / WORKOS_COOKIE_PASSWORD)
# are passed at `docker run` time, NOT baked into the image.

# --- base: pnpm + turbo on Node 20 -----------------------------------------
# Install pnpm directly instead of `corepack enable`: the corepack bundled in
# node:20-alpine often fails the pinned-pnpm download with "Cannot find matching
# keyid" (stale signing keys). A direct global install sidesteps that.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm i -g pnpm@10.33.4 turbo@2
WORKDIR /app

# --- pruner: isolate admin + its workspace deps ----------------------------
FROM base AS pruner
COPY . .
RUN turbo prune admin --docker

# --- installer: install deps, then build the app ---------------------------
FROM base AS installer
# package.json files + lockfile + pnpm-workspace.yaml (good cache layer).
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
# Full pruned source.
COPY --from=pruner /app/out/full/ .
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_WORKOS_REDIRECT_URI
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_WORKOS_REDIRECT_URI=${NEXT_PUBLIC_WORKOS_REDIRECT_URI}
ENV NEXT_TELEMETRY_DISABLED=1
RUN turbo build --filter=admin

# --- runner: minimal standalone server -------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3002

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# standalone bundle (traced node_modules + monorepo layout), then static assets.
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
# NOTE: no `COPY public` — apps/admin has no public/ dir. Add
# `COPY --from=installer /app/apps/admin/public ./apps/admin/public` if one appears.

USER nextjs
EXPOSE 3002
CMD ["node", "apps/admin/server.js"]
