你是一个全栈 DevOps 工程师，正在为毕业设计《电商物流管理系统》构建一个**生产级可部署的 Docker 化应用**。系统需支持四类用户：**顾客（Customer）**、**商家（Merchant）**、**配送员（Delivery）**、**管理员（Admin）**。

请严格按照以下要求输出完整方案：

---

### 🔧 技术栈约束
- **前端**：Vue 3 + TypeScript + Pinia + Vue Router + Element Plus（或 Naive UI）
- **后端**：NestJS（优先）或 Express + TypeScript，使用 TypeORM 或 Prisma 连接数据库
- **数据库**：MySQL 8.0+
- **容器化**：前后端分别构建独立 Docker 镜像，通过 Docker Compose 编排
- **CI/CD**：提供 GitHub Actions 配置，实现测试 → 构建 → 部署自动化

---

### 📦 输出内容（必须全部包含）

#### 1. **项目整体目录结构**
清晰展示 `frontend/`、`backend/`、根目录配置文件的位置。

#### 2. **前端 Dockerfile（frontend/Dockerfile）**
- 基于多阶段构建（multi-stage build）
- 使用 Nginx 托管静态资源
- 监听 80 端口
- 支持通过环境变量配置 API 地址（如 `VITE_API_BASE_URL`）

#### 3. **后端 Dockerfile（backend/Dockerfile）**
- 基于 `node:18-alpine`
- 安装依赖、构建、运行
- 监听 3000 端口
- 从环境变量读取数据库连接信息

#### 4. **docker-compose.yml（根目录）**
- 启动三个服务：`db`（MySQL）、`backend`、`frontend`
- 正确设置网络、依赖、端口映射
- 数据库使用 volume 持久化
- 环境变量通过 `.env` 文件注入（提供 `.env.example`）

#### 5. **核心环境变量说明（.env.example）**
包括：
  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
  - JWT_SECRET
  - FRONTEND_API_BASE_URL（用于 Nginx proxy 或构建时注入）

#### 6. **GitHub Actions CI/CD 配置（.github/workflows/ci-cd.yml）**
- 所有分支：运行前后端测试和构建（验证 Docker 能否 build）
- main 分支：额外执行 `docker-compose up --build -d` 部署到远程服务器（通过 SSH）
- 使用 `appleboy/ssh-action` 安全部署
- 在 CI 中启动临时 MySQL 服务用于测试

#### 7. **部署安全建议**
- 如何在 GitHub Secrets 中存储 SSH 密钥、服务器 IP
- 如何在服务器上创建非 root 部署用户
- 如何限制 Docker 权限

#### 8. **本地开发与生产一致性说明**
- 开发时如何用 `docker-compose.dev.yml` 启用热重载
- 生产镜像不包含 devDependencies

---

### 🎯 功能范围（确保 Docker 镜像支持以下流程）
1. 顾客下单 → 商家确认 → 系统分配配送员 → 配送员更新状态 → 顾客签收
2. 管理员可查看所有订单、用户、异常日志
3. 所有 API 受 JWT + 角色权限保护

---

### 🚫 禁止行为
- 不要使用 localhost 作为服务间通信地址（应使用 service name，如 `http://backend:3000`）
- 不要在 Dockerfile 中硬编码密码
- 不要忽略 .dockerignore

---

请以 **清晰、结构化、可直接复制到项目中使用** 的方式输出上述所有内容。优先使用 NestJS，若用 Express 需说明理由。