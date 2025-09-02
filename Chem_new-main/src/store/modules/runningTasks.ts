import { defineStore } from "pinia";

// 简化的设备状态接口
interface DeviceState {
  status?: string;
  isActive?: boolean;
  temperature?: number;
  flowRate?: number;
  position?: string;
  taskId?: string;
  taskName?: string;
  timestamp?: Date;
}

// 简化的工作流任务接口
interface WorkflowTask {
  taskId: string;
  taskName: string;
  taskKey: string;
  devicePath: string[];
  parameters: Record<string, any>;
  reactTime: number;
  duration: number;
  status: number;
  progress: number;
}

// 简化的工作流信息接口
interface WorkflowInfo {
  id: string;
  tasks: WorkflowTask[];
  startTime: Date;
  currentTaskIndex: number;
  totalTasks: number;
  endTime?: Date;
}

export const useRunningTasksStore = defineStore("runningTasks", {
  state: () => ({
    runningTasks: [] as WorkflowTask[],
    currentWorkflow: null as WorkflowInfo | null,
    workflowStatus: 'idle' as string,
    expectedStates: new Map<string, DeviceState>(),
    actualStates: new Map<string, DeviceState>(),
    lastUpdate: null as Date | null,
    // 标记这是iframe版本
    isIframeVersion: true
  }),
  
  getters: {
    getRunningTaskById: state => (taskId: string, taskKey: string) => {
      return state.runningTasks.find(
        task => task.taskId === taskId && task.taskKey === taskKey
      );
    },
    hasRunningTasks: state => state.runningTasks.length > 0,
    isWorkflowRunning: state => state.workflowStatus === 'running',
    getCurrentWorkflowInfo: state => state.currentWorkflow,
    getExpectedStates: state => state.expectedStates,
    getActualStates: state => state.actualStates
  },
  
  actions: {
    // 从主项目接收数据的方法
    updateFromMainProject(data: {
      runningTasks?: WorkflowTask[];
      currentWorkflow?: WorkflowInfo;
      workflowStatus?: string;
      expectedStates?: Array<[string, DeviceState]>;
      actualStates?: Array<[string, DeviceState]>;
    }) {
      if (data.runningTasks !== undefined) {
        this.runningTasks = data.runningTasks;
      }
      
      if (data.currentWorkflow !== undefined) {
        this.currentWorkflow = data.currentWorkflow;
      }
      
      if (data.workflowStatus !== undefined) {
        this.workflowStatus = data.workflowStatus;
      }
      
      if (data.expectedStates) {
        this.expectedStates.clear();
        data.expectedStates.forEach(([deviceId, state]) => {
          this.expectedStates.set(deviceId, state);
        });
      }
      
      if (data.actualStates) {
        this.actualStates.clear();
        data.actualStates.forEach(([deviceId, state]) => {
          this.actualStates.set(deviceId, state);
        });
      }
      
      this.lastUpdate = new Date();
      console.log('🔄 iframe store已更新:', {
        runningTasks: this.runningTasks.length,
        workflowStatus: this.workflowStatus,
        expectedStates: this.expectedStates.size,
        actualStates: this.actualStates.size
      });
    },
    
    // 更新实际硬件状态（从硬件监控获取）
    updateActualHardwareState(deviceId: string, actualState: DeviceState) {
      this.actualStates.set(deviceId, {
        ...actualState,
        timestamp: new Date()
      });
      
      // 如果在iframe环境中，向主项目发送状态更新
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'DEVICE_STATE_UPDATE',
          data: {
            deviceId,
            actualState: {
              ...actualState,
              timestamp: new Date()
            }
          }
        }, '*');
      }
    },
    
    // 清空所有数据
    clearAll() {
      this.runningTasks = [];
      this.currentWorkflow = null;
      this.workflowStatus = 'idle';
      this.expectedStates.clear();
      this.actualStates.clear();
      this.lastUpdate = null;
    }
  }
}); 