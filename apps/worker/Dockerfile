FROM node:24.15.0-alpine AS builder

RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages ./packages
COPY apps/worker ./apps/worker

# --ignore-scripts để lefthook không cố cài git hook trong container.
RUN pnpm install --frozen-lockfile --ignore-scripts

# BR-SUP-09 (process-supervision.md): tiến trình chạy mã đã build, cấm chạy
# TypeScript qua loader trên máy chủ. Bước này từng bị comment lại kèm ghi chú
# dở dang, nên `dist/index.js` chưa bao giờ tồn tại và ảnh này không khởi động
# được — CMD bên dưới trỏ vào một file không có.
RUN pnpm --filter @mindkid/worker build

FROM node:24.15.0-alpine AS runner
RUN corepack enable
# pg_dump / psql cho backup:postgres và backup:verify.
RUN apk add --no-cache postgresql-client

WORKDIR /app
COPY --from=builder /app /app

ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@mindkid/worker", "run", "start"]
