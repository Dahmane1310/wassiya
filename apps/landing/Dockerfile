# syntax=docker/dockerfile:1
#
# Static image for the Astro landing site (apps/landing).
# Astro builds to plain HTML/CSS/JS (no Node runtime) — served by nginx.
# Build from the REPO ROOT so the pnpm workspace resolves:
#
#   docker build -f apps/landing/Dockerfile -t landing .
#
# No env vars: the landing site is fully static.

# --- base: pnpm + turbo on Node 20 -----------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm i -g pnpm@10.33.4 turbo@2
WORKDIR /app

# --- pruner: isolate landing + its workspace deps (e.g. @workspace/ui) ------
FROM base AS pruner
COPY . .
RUN turbo prune landing --docker

# --- builder: install + astro build → apps/landing/dist --------------------
FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=landing

# --- runner: static files on nginx -----------------------------------------
FROM nginx:alpine AS runner
# Astro static output is a multi-page site; nginx's default config serves it as-is.
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html
EXPOSE 80
