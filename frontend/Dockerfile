# ===== Stage 1: Build =====
FROM node:18-alpine AS builder

WORKDIR /app

# 接收构建参数
ARG VITE_API_BASE_URL=/api

# 设置环境变量供 Vite 构建使用
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# ===== Stage 2: Nginx =====
FROM nginx:alpine AS production

# 从构建阶段复制静态文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
