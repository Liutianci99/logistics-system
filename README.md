# 🚚 电商物流管理系统

> 毕业设计项目 — 基于 Docker 的生产级可部署电商物流管理系统

## 📋 系统概述

支持四类用户角色的完整物流管理系统：
- **顾客（Customer）**：浏览商品、下单、签收
- **商家（Merchant）**：管理商品、确认订单
- **配送员（Delivery）**：取件、配送、确认送达
- **管理员（Admin）**：全局监控、用户管理、日志查看

### 核心业务流程
```
顾客下单 → 商家确认 → 系统自动分配配送员 → 配送员取件 → 配送中 → 确认送达 → 顾客签收
```

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Pinia + Vue Router + Element Plus |
| 后端 | NestJS + TypeScript + TypeORM |
| 数据库 | MySQL 8.0 |
| 容器化 | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Web服务器 | Nginx（前端静态资源托管 + API反向代理） |

## 📁 项目结构

```
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # CI/CD 配置
├── backend/
│   ├── src/
│   │   ├── common/              # 公共枚举、工具
│   │   ├── entities/            # TypeORM 数据库实体
│   │   ├── modules/
│   │   │   ├── auth/            # 认证模块（JWT + 角色守卫）
│   │   │   ├── users/           # 用户管理
│   │   │   ├── orders/          # 订单管理（核心业务）
│   │   │   ├── products/        # 商品管理
│   │   │   ├── delivery/        # 配送管理
│   │   │   └── admin/           # 管理员模块
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                    # E2E 测试
│   ├── sql/                     # 数据库初始化脚本
│   ├── Dockerfile               # 生产 Dockerfile
│   ├── Dockerfile.dev           # 开发 Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── views/               # 页面组件
│   │   ├── layouts/             # 布局组件
│   │   ├── stores/              # Pinia 状态管理
│   │   ├── router/              # Vue Router 路由
│   │   ├── types/               # TypeScript 类型定义
│   │   ├── utils/               # 工具函数（axios 封装）
│   │   └── styles/              # 全局样式
│   ├── nginx.conf               # Nginx 配置
│   ├── Dockerfile               # 生产 Dockerfile（多阶段构建）
│   ├── Dockerfile.dev           # 开发 Dockerfile
│   └── .dockerignore
├── docker-compose.yml           # 生产环境编排
├── docker-compose.dev.yml       # 开发环境编排（热重载）
├── .env.example                 # 环境变量模板
└── README.md
```

## 🚀 快速开始

### 前置条件
- Docker >= 20.10
- Docker Compose >= 2.0
- Node.js >= 18（本地开发）

### 1. 克隆项目
```bash
git clone <repository-url>
cd logistics-app
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env，修改数据库密码和 JWT 密钥
```

### 3. 生产环境启动
```bash
docker-compose up --build -d
```
- 前端访问: http://localhost:80
- 后端API: http://localhost:3000/api
- API文档: http://localhost:3000/api/docs

### 4. 开发环境启动（热重载）
```bash
docker-compose -f docker-compose.dev.yml up --build
```
- 前端访问: http://localhost:5173
- 后端API: http://localhost:3000/api
- 修改 `frontend/src/` 或 `backend/src/` 代码会自动热重载

### 5. 本地开发（不使用 Docker）
```bash
# 后端
cd backend
npm install
npm run start:dev

# 前端
cd frontend
npm install
npm run dev
```

## 🔑 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_HOST` | 数据库主机（Docker 中使用 service name `db`） | db |
| `DB_PORT` | 数据库端口 | 3306 |
| `DB_USER` | 数据库用户名 | logistics_user |
| `DB_PASSWORD` | 数据库密码 | **必须修改** |
| `DB_NAME` | 数据库名 | logistics_db |
| `DB_ROOT_PASSWORD` | MySQL root 密码 | **必须修改** |
| `JWT_SECRET` | JWT 签名密钥 | **必须修改** |
| `JWT_EXPIRES_IN` | JWT 过期时间 | 7d |
| `VITE_API_BASE_URL` | 前端 API 地址（构建时注入） | /api |

> ⚠️ **重要**: 生产环境必须修改所有密码和密钥！

## 🐳 Docker 说明

### 前端 Dockerfile（多阶段构建）
1. **构建阶段**: 使用 Node.js 执行 `npm run build`，通过 `ARG` 注入 `VITE_API_BASE_URL`
2. **运行阶段**: 使用 Nginx Alpine 托管静态文件，配置反向代理到后端服务

### 后端 Dockerfile
1. **构建阶段**: 安装所有依赖并执行 TypeScript 编译
2. **运行阶段**: 仅安装生产依赖，以非 root 用户运行

### 开发环境差异
| 特性 | 生产 | 开发 |
|------|------|------|
| 热重载 | ❌ | ✅（通过 volume 挂载） |
| devDependencies | 不包含 | 包含 |
| Nginx | ✅ | ❌（使用 Vite dev server） |
| 日志级别 | 精简 | 详细（含 SQL 日志） |
| TypeORM sync | 关闭 | 开启 |

## 🔄 CI/CD 流程

### 流水线阶段
1. **所有分支**: 运行前后端单元测试 → 构建验证 → Docker 镜像构建验证
2. **main 分支**: 额外执行 Docker Compose 集成测试 → SSH 远程部署

### GitHub Secrets 配置

| Secret | 说明 |
|--------|------|
| `SERVER_HOST` | 服务器 IP 地址 |
| `SERVER_USER` | SSH 登录用户名 |
| `SERVER_PORT` | SSH 端口（默认 22） |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 |
| `DB_USER` | 生产数据库用户名 |
| `DB_PASSWORD` | 生产数据库密码 |
| `DB_NAME` | 生产数据库名 |
| `DB_ROOT_PASSWORD` | 生产 MySQL root 密码 |
| `JWT_SECRET` | 生产 JWT 密钥 |

## 🔒 部署安全建议

### 1. SSH 密钥管理
```bash
# 在本地生成 SSH 密钥对
ssh-keygen -t ed25519 -C "deploy@logistics" -f ~/.ssh/deploy_key

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server

# 将私钥内容添加到 GitHub Secrets → SSH_PRIVATE_KEY
cat ~/.ssh/deploy_key
```

### 2. 创建非 root 部署用户
```bash
# 在服务器上执行
sudo adduser deploy
sudo usermod -aG docker deploy

# 创建项目目录
sudo mkdir -p /opt/logistics-app
sudo chown deploy:deploy /opt/logistics-app

# 限制 sudo 权限（可选）
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose" | sudo tee /etc/sudoers.d/deploy
```

### 3. Docker 权限限制
```bash
# 不要以 root 运行容器（Dockerfile 中已配置非 root 用户）
# 限制容器资源
# 在 docker-compose.yml 中添加：
# deploy:
#   resources:
#     limits:
#       memory: 512M
#       cpus: '0.5'
```

### 4. 网络安全
- 使用防火墙仅开放 80/443 端口
- MySQL 端口（3306）不要暴露到公网
- 使用 HTTPS（建议配置 Let's Encrypt）
- 定期更新 Docker 镜像和依赖

## 📖 API 文档

启动后端后访问: `http://localhost:3000/api/docs`

### 主要接口

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 公开 |
| POST | `/api/auth/login` | 用户登录 | 公开 |
| GET | `/api/auth/profile` | 获取个人信息 | 所有已登录用户 |
| GET | `/api/products` | 商品列表 | 公开 |
| POST | `/api/products` | 创建商品 | 商家 |
| POST | `/api/orders` | 创建订单 | 顾客 |
| PUT | `/api/orders/:id/confirm` | 确认订单 | 商家 |
| PUT | `/api/orders/:id/pickup` | 取件 | 配送员 |
| PUT | `/api/orders/:id/start-delivery` | 开始配送 | 配送员 |
| PUT | `/api/orders/:id/deliver` | 确认送达 | 配送员 |
| PUT | `/api/orders/:id/sign` | 签收 | 顾客 |
| GET | `/api/admin/dashboard` | 管理仪表盘 | 管理员 |
| GET | `/api/admin/logs` | 操作日志 | 管理员 |

## 📄 License

MIT
