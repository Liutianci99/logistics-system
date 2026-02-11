# ===== Stage 1: Build =====
FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production=false

# 复制源代码并构建
COPY . .
RUN npm run build

# ===== Stage 2: Production =====
FROM node:18-alpine AS production

WORKDIR /app

# 仅安装生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist

# 非 root 用户运行
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
