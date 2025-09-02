# 化学反应上位机软件 - 硬件通信模块说明

## 代码结构

本软件采用前后端分离的架构，硬件通信部分分为以下几个主要组件：

### 前端部分

1. **硬件通信模块** (`src/utils/hardwareCommunication.ts`)
   - 负责前端与硬件的直接WebSocket通信
   - 提供命令帧格式化和状态帧解析功能
   - 主要用于开发和测试环境

2. **硬件API服务** (`src/utils/api/hardware.ts`)
   - 提供调用后端硬件API的接口
   - 封装HTTP请求，简化前端组件对后端的调用

3. **设备控制组件** (`src/views/topcontrol/index.vue`)
   - 提供用户图形界面进行设备控制
   - 使用硬件API服务和WebSocket与后端通信

### 后端部分

1. **硬件服务** (`services/hardwareService.ts`)
   - 负责与硬件的WebSocket通信
   - 实现命令帧构造和发送
   - 处理状态帧接收和解析

2. **硬件控制器** (`controllers/hardwareController.ts`)
   - 提供REST API接口
   - 处理前端的硬件命令请求

3. **硬件路由** (`router/hardwareRoutes.ts`)
   - 定义API路径
   - 连接控制器和HTTP请求

## 通信协议

### 基本结构

通信协议采用二进制帧格式，主要包括：

1. **上位机发送命令帧**：
   - 校验数据 (6字节)
   - 包头 (8字节)
   - 10个子控制器时隙包头 (每个8字节)
   - 10个子控制器设备控制数据 (每个16*8字节)

2. **下位机返回状态帧**：
   - 22字节包头 (包含子控制器ID)
   - 设备状态数据 (Data1-Data10，每部分8字节)

### 设备数据格式

每种设备在命令帧中的位置是固定的：

- **泵**：占用Data1-Data4，每个泵6个参数（速度、位置、类型、ID、初始化状态、停止状态、端口）
- **阀门**：占用Data5-Data6前半部分，每个阀门2个参数（类型+ID、孔位）
- **MFC**：占用Data6中部，参数包括类型、ID、流量
- **光照**：占用Data6末尾到Data7开头，参数包括类型、ID、光强
- **加热**：占用Data7-Data10，每个加热器4个参数（类型、ID、速度、温度）

## 改进

1. **职责明确**：
   - 前端硬件通信模块只负责直接的WebSocket通信
   - 后端硬件服务负责与硬件的完整交互和状态管理

2. **代码优化**：
   - 去除重复代码
   - 前后端通信逻辑分离
   - 类型和接口定义标准化

3. **错误处理**：
   - 增强了错误捕获和日志记录
   - 添加了超时处理
   - 多级回退机制确保系统稳定性

## 使用说明

### 发送设备命令

```typescript
// 前端组件中
import hardwareApi from "@/utils/api/hardware";

// 构造命令
const command = {
  id: "module-1-pump-2", // 模块1的泵2
  type: DeviceType.PUMP,
  action: "start",
  parameters: {
    speed: 1000,
    position: 5000
  }
};

// 调用API发送命令
const result = await hardwareApi.sendHardwareCommand(command);
```

### 直接WebSocket通信 (测试用)

```typescript
import hardwareCommunication from "@/utils/hardwareCommunication";

// 连接
await hardwareCommunication.connect("ws://192.168.1.14:2020");

// 发送命令
await hardwareCommunication.sendCommand({
  moduleId: 1,
  localId: 2,
  type: DeviceType.PUMP,
  action: "start",
  parameters: {
    speed: 1000,
    position: 5000
  }
});
```

## 注意事项

1. 确保网络连接稳定，WebSocket需要持续连接
2. 硬件命令格式必须符合协议要求
3. 在高负载情况下，优先使用后端API而非直接WebSocket通信
4. 通信错误会记录到日志，请定期检查

# 化学上位机软件平台

基于pure admin框架开发的化学上位机软件平台，用于与下位机硬件进行通信和控制。

## 主要功能

### Task界面功能

#### 1. Scheduling（调度）功能
- 选择多个任务后点击"scheduling"按钮
- 系统自动构建调度数据并发送给AI调度服务
- 支持下载调度数据为JSON文件
- 调度结果会更新到任务的queueResult字段

#### 2. Edit编辑反应路径参数功能
- 点击Edit按钮打开全屏编辑界面
- 可以修改设备参数（泵流速、加热温度、反应时间等）
- 支持保存参数并自动返回任务页面
- 参数会同步保存到数据库

#### 3. Run执行工作流功能
- 检查任务是否已完成调度
- 生成执行计划并发送到硬件系统
- 自动跳转到监控界面查看执行状态
- 支持单个任务和批量任务执行

#### 4. 🆕 参数显示功能
- **新增功能**: 在任务表格中添加了"参数"列
- 点击"参数"按钮可以查看该任务之前设置并保存的参数
- 支持从数据库加载参数数据
- 显示设备类型、参数设置等详细信息
- 如果没有参数，提供快速跳转到编辑界面的按钮
- 支持从参数查看界面直接跳转到编辑模式

##### 参数显示功能特点：
- **智能数据源**: 优先从本地数据加载，如果本地没有则从数据库获取
- **详细信息展示**: 显示任务基本信息和设备参数详情
- **设备类型识别**: 自动识别设备类型并显示对应的图标和颜色
- **参数格式化**: 自动为参数添加合适的单位（如温度°C、流速mL/min等）
- **加载状态**: 显示加载动画，提升用户体验
- **错误处理**: 完善的错误处理机制，确保系统稳定性

## 技术架构

- **前端**: Vue3 + Element Plus + AntV G6
- **后端**: Node.js + Express + TypeScript
- **通信**: WebSocket实时通信
- **数据存储**: JSON文件存储 + 数据库

## API接口

### 新增参数相关接口

#### 获取任务参数
```
GET /api/tasks/:taskId/parameters?taskKey=<taskKey>
```

#### 保存任务参数
```
POST /api/tasks/:taskId/parameters
Body: {
  taskKey: string,
  parameters: object,
  reactTime: number
}
```

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