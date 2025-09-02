import { http } from "@/utils/http";

// 获取活跃任务列表
export const getActiveTasks = () => {
  return http.request("get", "/api/tasks/active");
};

// 获取任务详情
export const getTaskDetail = (taskId: string) => {
  return http.request("get", `/api/tasks/${taskId}`);
};

// 获取设备信息
export const getDeviceInfo = (deviceId: string) => {
  return http.request("get", `/api/devices/${deviceId}`);
};

// 获取所有设备列表
export const getAllDevices = () => {
  return http.request("get", "/api/devices");
};

// 模拟数据示例 - 仅在前端开发时使用
export const mockActiveTasks = [
  {
    id: "task-1",
    name: "甲基化反应",
    status: "in-progress",
    runTime: 1230, // 秒
    reactPath: {
      devices: ["pump-1", "valve-2", "chip-1", "valve-3"],
      edges: [
        { source: "pump-1", target: "valve-2" },
        { source: "valve-2", target: "chip-1" },
        { source: "chip-1", target: "valve-3" }
      ]
    }
  },
  {
    id: "task-2",
    name: "氧化反应",
    status: "pending",
    runTime: 0,
    reactPath: {
      devices: ["pump-2", "valve-1", "chip-2"],
      edges: [
        { source: "pump-2", target: "valve-1" },
        { source: "valve-1", target: "chip-2" }
      ]
    }
  }
];

// 模拟设备数据
export const mockDevices = [
  {
    id: "pump-1",
    type: "pump",
    status: "running",
    flowRate: 1.5,
    direction: "forward",
    speed: 75
  },
  {
    id: "pump-2",
    type: "pump",
    status: "stopped",
    flowRate: 0,
    direction: "forward",
    speed: 0
  },
  {
    id: "valve-1",
    type: "valve",
    status: "closed",
    position: 0,
    pressure: 0
  },
  {
    id: "valve-2",
    type: "valve",
    status: "open",
    position: 100,
    pressure: 2.3
  },
  {
    id: "valve-3",
    type: "valve",
    status: "open",
    position: 50,
    pressure: 1.2
  },
  {
    id: "chip-1",
    type: "chip",
    status: "heating",
    currentTemp: 65.2,
    targetTemp: 70.0,
    power: 80
  },
  {
    id: "chip-2",
    type: "chip",
    status: "idle",
    currentTemp: 25.0,
    targetTemp: 25.0,
    power: 0
  }
]; 