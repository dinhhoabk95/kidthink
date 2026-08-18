FROM node:24.15.0-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Copy root workspace config and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy all packages and apps
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install dependencies without running postinstall scripts (avoids lefthook git errors)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the worker
# RUN pnpm --filter @mindkid/worker build
# Wait, we might not have a build step if we run via tsx. But standard is ts-node or tsx for dev.
# We should probably run it with tsx or build it. For smoke, let's just use tsx in production for now or build with tsc.
# Actually, the task says "cần có Dockerfile cho worker". Let's install pg_dump in the final image since we need it for postgres backup!

FROM node:24.15.0-alpine AS runner
RUN corepack enable
RUN apk add --no-cache postgresql-client

WORKDIR /app
COPY --from=builder /app /app

ENV NODE_ENV=production
# Run via tsx since we haven't set up a bundler (esbuild/tsdown) for worker yet.
# We will use the start script which we should map to tsx. Wait, actually we can just run tsx.
CMD ["pnpm", "--filter", "@mindkid/worker", "run", "start"]
