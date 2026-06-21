# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /src

# 安装 pnpm
RUN npm install -g pnpm@10

# 安装依赖（利用 Docker 缓存层）
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .
RUN pnpm build

# ============================================
# Stage 2: Runtime (Nginx)
# ============================================
FROM nginx:alpine

# 安装 Node.js 用于运行时生成 env.js
RUN apk add --no-cache nodejs

# 从构建阶段复制产物
COPY --from=builder /src/dist /usr/share/nginx/html

# 复制运行时 env 生成脚本和 nginx 配置
COPY scripts/generate-env.js /docker-entrypoint.d/generate-env.js
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 启动前生成 env.js（nixpacks / docker-entrypoint.d 风格）
RUN echo 'node /docker-entrypoint.d/generate-env.js && nginx -g "daemon off;"' > /start.sh \
 && chmod +x /start.sh

EXPOSE 80

CMD ["sh", "/start.sh"]
