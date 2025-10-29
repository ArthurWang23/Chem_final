# 化学反应上位机软件 - 硬件通信模块说明

## 代码结构

本软件采用前后端分离的架构，硬件通信部分分为以下几个主要组件：

# 运行与操作说明

本章汇总项目结构与运行方式，覆盖本地开发、Docker 一键部署与生产构建，同时说明关键端口、环境变量、前后端与 WebSocket 的交互入口以及常见排查建议。

## 架构概览

- 前端父应用：`pure_admin_antv_g6_phar_2025_04_07`（Vue3 + Vite）
  - 提供主界面（任务管理、监控容器、流程操作）
  - 通过代理统一访问后端与子应用
- 前端子应用：`Chem_new-main`（Vue3 + Vite）
  - 提供监控与结构控制界面
  - 生产环境下以 `/child` 路由挂载到同一站点
- AI WebSocket聚合：`chemistry-back`（Node WebSocket 服务器，端口 `3004`）
  - 接收前端的 WS 文本消息，依据 `serve` 字段转发到远端 AI/调度服务（single/multi/graph/queue）
- 业务后端：`pure-admin-backend`（REST + WS，端口 `3000`，路径 `/chem-api`）
  - 当前仓库目录为空，需使用你们的后端实现或镜像
- 统一反代：Nginx（前后端统一站点，代理 `/chem-api`、`/api`、`/ws-ai`）

## 关键端口与路径

- 父应用开发端口：`8848`（`VITE_PORT` 可调）
- 子应用开发端口：`8850`
- 业务后端端口：`3000`（REST + WS，`/chem-api`）
- AI WebSocket聚合端口：`3004`（由 Nginx 反代为 `/ws-ai`）
- 统一站点（Docker）：`http://localhost`（父应用根 `/`，子应用前缀 `/child`）

## 环境要求

- Node.js `>= 18.18`（推荐 Node 20）
- pnpm `>= 9`（建议 `corepack enable`）
- Docker 与 Docker Compose（用于一键部署）
- Windows 开发环境（PowerShell/CMD）

## 本地开发（分进程运行）

- 启用 Corepack（一次性）
```bash
corepack enable
```

- 父应用（主界面）
```bash
pnpm install --dir d:\Chem_final\pure_admin_antv_g6_phar_2025_04_07
```
```bash
pnpm --dir d:\Chem_final\pure_admin_antv_g6_phar_2025_04_07 dev
```
访问：`http://localhost:8848`

- 子应用（监控与结构控制）
```bash
pnpm install --dir d:\Chem_final\Chem_new-main
```
```bash
pnpm --dir d:\Chem_final\Chem_new-main dev
```
访问：`http://localhost:8850/monitor-standalone`（监控独立页）

- AI WebSocket聚合（chemistry-back）
```bash
pnpm install --dir d:\Chem_final\chemistry-back
``]
```bash
pnpm --dir d:\Chem_final\chemistry-back dev
```
说明：
  - 监听 `3004`，根据 `serve` 将消息转发至：
    - `single` → `ws://219.228.149.80:3010/single_retro`
    - `multi` → `ws://219.228.149.80:3010/multi_retro`
    - `graph`/`queue` → `ws://219.228.149.131:3300`

- 业务后端（/chem-api）
  - 当前 `d:\Chem_final\pure-admin-backend` 为空，需接入你们的后端代码或镜像。
  - 启动（示例，按你们后端实现为准）：
```bash
pnpm --dir d:\Chem_final\pure-admin-backend dev
```

## 前端代理与环境变量

- 父应用 `vite.config.ts` 代理：
  - `/chem-api` → `process.env.VITE_BACKEND_URL || http://localhost:3000`
  - `/api` → `process.env.VITE_API_TARGET || http://219.228.149.131:8080`
  - `/child` → `process.env.VITE_CHILD_ORIGIN || http://localhost:8850`
  - `/ws-ai` → `process.env.VITE_WS_AI_URL || ws://localhost:3004`
- 建议在父/子应用 `.env.development` 或系统环境中设置（示例）：
```bash
set VITE_BACKEND_URL=http://localhost:3000
```
```bash
set VITE_CHILD_ORIGIN=http://localhost:8850
```
```bash
set VITE_WS_AI_URL=ws://localhost:3004
```
```bash
set VITE_IFRAME_ALLOWED_ORIGINS=http://localhost:8848,http://localhost
```
- 子应用基础路径：`/child`（生产部署）

## Docker 一键部署（前后端集成）

- 构建并启动（自动打包父/子前端并启用 Nginx、chemistry-back、backend）
```bash
docker-compose -f d:\Chem_final\docker-compose.yml up -d --build
```

- 访问站点
```bash
start http://localhost
```

- 说明
  - Nginx 静态目录：
    - 父应用：`/usr/share/nginx/html/parent`
    - 子应用：`/usr/share/nginx/html/child`
  - 反向代理：
    - `/chem-api` → `backend:3000/chem-api`
    - `/api` → `219.228.149.131:8080`
    - `/ws-ai` → `chemistry-back:3004`
  - 注意：`pure-admin-backend` 目录为空将导致后端构建失败。可暂时注释 compose 的 `backend` 服务或改用现有后端镜像。

## 生产构建（不使用 Docker）

- 父应用构建
```bash
pnpm --dir d:\Chem_final\pure_admin_antv_g6_phar_2025_04_07 build
```
- 子应用构建
```bash
pnpm --dir d:\Chem_final\Chem_new-main build
```
- 部署建议
  - 将父应用 `dist` 部署为站点根。
  - 将子应用 `dist` 挂载为 `/child`。
  - 使用 `d:\Chem_final\Chem_new-main\deploy\nginx\default.conf` 作为参考配置（含 `/chem-api`、`/ws-ai` 代理）。

## 主要操作入口

- 任务与监控（父应用）
  - 任务列表与状态：
    - `GET /chem-api/tasks/running`
    - `GET /chem-api/tasks/:taskId`
    - `POST /chem-api/tasks/start`（工作流启动上报）
    - `POST /chem-api/tasks/sync`（任务状态同步）
  - 监控容器：父应用将加载子应用的独立页 `http://localhost:8850/monitor-standalone`

- 子应用（直接访问）
  - 监控独立页：`/monitor-standalone`
  - 结构控制页：`/topcontrol/index`

- AI合成/调度（WebSocket）
  - 前端通过 `/ws-ai` 与 `chemistry-back:3004` 通信，消息需包含 `serve` 字段（`single`/`multi`/`graph`/`queue`），由后端转发并回传结果。

## 常见问题与排查

- `/chem-api` 404 或 CORS：
  - 启动实际后端（`3000`），或设置 `VITE_BACKEND_URL` 指向可用后端。
- `/ws-ai` 连接失败：
  - 确认 `chemistry-back` 运行中（端口 `3004`）、网络与防火墙允许 WS。
- 子应用路径 404：
  - 生产下子应用基础路径为 `/child`，请以 `/child/...` 访问。
- 监控 iframe 不显示：
  - 父应用会检查 `http://localhost:8850/monitor-standalone`；确保子应用开发服务已启动。

## 运行验证清单

- 父应用可打开并加载菜单与任务页。
- 子应用可在独立端口访问监控页，并在父应用中以 iframe 打开。
- `/chem-api` 接口可用；任务列表、启动与同步调用正常。
- `/ws-ai` 能建立 WS；在合成/调度页面能收到结果与图谱回传。

> 如需，我可进一步补充截图、接口示例或将本节拆分为 `docs/运行与操作说明.md` 并在 README 添加链接。

## 使用说明

1. 在Task界面的表格中，每行任务都有一个"参数"按钮
2. 点击"参数"按钮查看该任务的设备参数设置
3. 如果任务还没有设置参数，可以点击"去设置参数"按钮跳转到编辑界面
4. 在参数查看界面，也可以点击"编辑参数"按钮进行修改
5. 所有参数修改都会自动保存到数据库，确保数据持久化

## 开发环境

- Node.js >= 16
- pnpm
- TypeScript

## 启动方式

```bash
# 前端
cd pure_admin_antv_g6_phar_2025_04_07
pnpm install
pnpm dev

# 后端
cd pure-admin-backend
pnpm install
pnpm dev
```
