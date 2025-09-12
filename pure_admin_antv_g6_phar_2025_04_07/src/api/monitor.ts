import { http } from "@/utils/http";

// 获取活跃任务列表
export const getActiveTasks = () => {
  return http.request("get", "/chem-api/tasks/running");
};

// 获取任务详情
export const getTaskDetail = (taskId: string) => {
  return http.request("get", `/chem-api/tasks/${taskId}`);
};

// 获取设备信息
export const getDeviceInfo = (deviceId: string) => {
  return http.request("get", `/chem-api/devices/${deviceId}`);
};

// 获取所有设备列表
export const getAllDevices = () => {
  return http.request("get", "/chem-api/devices");
};
