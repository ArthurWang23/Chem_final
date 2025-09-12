import { defineStore } from "pinia";
import axios from "axios";
import { http } from "@/utils/http";
// 🎯 添加类型定义
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

interface WorkflowTask {
  taskId: string;
  taskName: string;
  taskKey: string;
  product?: string; // 🔧 添加产品属性
  devicePath: string[];
  pathGraph: any;
  parameters: Record<string, any>;
  reactTime: number;
  duration: number;
  expectedStates: Record<string, DeviceState>;
}

export const useRunningTasksStore = defineStore("runningTasks", {
  state: () => ({
    runningTasks: [],
    lastUpdate: null,
    pollingInterval: null,
    currentWorkflow: null as any,
    workflowStatus: 'idle' as string,
    expectedStates: new Map<string, DeviceState>(),
    actualStates: new Map<string, DeviceState>(),
    stateCheckInterval: null as any,
    maxExecutionTime: 24 * 60 * 60 * 1000,
    stateCheckFrequency: 5000
  }),
  
  getters: {
    getRunningTaskById: state => (taskId, taskKey) => {
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
    addRunningTask(task) {
      const exists = this.runningTasks.findIndex(
        t => t.taskId === task.taskId && t.taskKey === task.taskKey
      );
      
      if (exists >= 0) {
        this.runningTasks[exists] = { ...task, updatedAt: new Date() };
      } else {
        this.runningTasks.push({ 
          ...task, 
          startedAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      this.lastUpdate = new Date();
      this.syncWithServer();
    },
    
    updateTaskStatus(taskId, taskKey, status, progress, currentDevice) {
      const taskIndex = this.runningTasks.findIndex(
        t => t.taskId === taskId && t.taskKey === taskKey
      );
      
      if (taskIndex >= 0) {
        const prevStatus = this.runningTasks[taskIndex].status; // 记录前一状态
        
        this.runningTasks[taskIndex] = {
          ...this.runningTasks[taskIndex],
          status,
          progress,
          currentDevice,
          updatedAt: new Date()
        };
        
        if (status === 2 || status === 3) {
          setTimeout(() => {
            this.removeRunningTask(taskId, taskKey);
          }, 60000);
        }
        
        this.lastUpdate = new Date();
        this.syncWithServer();

        // 上报 /chem-api/tasks/status
        http
          .request("post", "/chem-api/tasks/status", {
            data: { taskId, taskKey, status, progress, currentDevice }
          })
          .catch(err => console.error("更新任务状态上报失败", err));

        // 若首次进入终态（2=完成，3=失败），上报 /chem-api/tasks/end
        if (
          (status === 2 || status === 3) &&
          prevStatus !== 2 &&
          prevStatus !== 3
        ) {
          http
            .request("post", "/chem-api/tasks/end", {
              data: {
                taskId,
                taskKey,
                status,
                message: status === 2 ? "completed" : "failed"
              }
            })
            .catch(err => console.error("结束任务上报失败", err));
        }
      }
    },
    
    removeRunningTask(taskId, taskKey) {
      this.runningTasks = this.runningTasks.filter(
        t => !(t.taskId === taskId && t.taskKey === taskKey)
      );
      this.lastUpdate = new Date();
      this.syncWithServer();
    },
    
    startWorkflowExecution(executionPlan: WorkflowTask[]) {
      console.log('🚀 Store: 开始工作流执行，任务数量:', executionPlan.length);
      console.log('📋 Store: 任务详情:', executionPlan.map(task => ({
        taskId: task.taskId,
        taskName: task.taskName,
        product: task.product || '未知产品',
        devicePath: task.devicePath
      })));
      
      this.currentWorkflow = {
        id: `workflow_${Date.now()}`,
        tasks: executionPlan,
        startTime: new Date(),
        currentTaskIndex: 0,
        totalTasks: executionPlan.length
      };
      
      this.workflowStatus = 'running';
      
      this.expectedStates.clear();
      executionPlan.forEach(task => {
        Object.entries(task.expectedStates || {}).forEach(([deviceId, expectedState]) => {
          this.expectedStates.set(deviceId, {
            status: expectedState.status,
            isActive: expectedState.isActive,
            temperature: expectedState.temperature,
            flowRate: expectedState.flowRate,
            position: expectedState.position,
            taskId: task.taskId,
            taskName: task.taskName
          });
        });
      });
      
      executionPlan.forEach(task => {
        this.addRunningTask({
          taskId: task.taskId,
          taskKey: task.taskKey,
          taskName: task.taskName,
          product: task.product || '未知产品', // 🔧 确保产品信息传递
          devicePath: task.devicePath,
          status: 1,
          progress: 0
        });
      });

      // 启动工作流时为每个任务上报 /chem-api/tasks/start
      executionPlan.forEach(task => {
        http
          .request("post", "/chem-api/tasks/start", {
            data: {
              taskId: task.taskId,
              taskKey: task.taskKey,
              taskName: task.taskName,
              product: task.product
            }
          })
          .catch(err => console.error("启动任务上报失败", err));
      });
      
      this.startStateChecking();
      
      console.log('🚀 工作流执行已启动:', this.currentWorkflow);
      console.log('📊 Store状态:', {
        workflowStatus: this.workflowStatus,
        runningTasks: this.runningTasks.length,
        expectedStates: this.expectedStates.size
      });
    },
    
    updateActualHardwareState(deviceId: string, actualState: DeviceState) {
      this.actualStates.set(deviceId, {
        status: actualState.status,
        isActive: actualState.isActive,
        temperature: actualState.temperature,
        flowRate: actualState.flowRate,
        position: actualState.position,
        timestamp: new Date()
      });
      
      if (this.expectedStates.has(deviceId)) {
        this.checkDeviceStateMatch(deviceId);
      }
    },
    
    checkDeviceStateMatch(deviceId) {
      const expected = this.expectedStates.get(deviceId);
      const actual = this.actualStates.get(deviceId);
      
      if (!expected || !actual) return false;
      
      const isStatusMatch = expected.status === actual.status;
      const isActiveMatch = expected.isActive === actual.isActive;
      
      let isParameterMatch = true;
      if (expected.temperature !== undefined) {
        isParameterMatch = Math.abs(expected.temperature - (actual.temperature || 0)) <= 5;
      }
      if (expected.flowRate !== undefined) {
        const tolerance = expected.flowRate * 0.1;
        isParameterMatch = Math.abs(expected.flowRate - (actual.flowRate || 0)) <= tolerance;
      }
      
      const isMatched = isStatusMatch && isActiveMatch && isParameterMatch;
      
      if (isMatched) {
        console.log(`✅ 设备 ${deviceId} 状态匹配期望:`, { expected, actual });
        
        const taskId = expected.taskId;
        if (taskId) {
          this.updateTaskStatusBasedOnDevice(taskId, deviceId, 'matched');
        }
      } else {
        console.warn(`⚠️ 设备 ${deviceId} 状态不匹配:`, { expected, actual });
      }
      
      return isMatched;
    },
    
    updateTaskStatusBasedOnDevice(taskId, deviceId, matchStatus) {
      const task = this.runningTasks.find(t => t.taskId === taskId);
      if (!task) return;
      
      if (matchStatus === 'matched') {
        const taskDevices = task.devicePath || [];
        const allMatched = taskDevices.every(devId => {
          const expected = this.expectedStates.get(devId);
          const actual = this.actualStates.get(devId);
          return expected && actual && this.checkDeviceStateMatch(devId);
        });
        
        if (allMatched) {
          console.log(`🎯 任务 ${taskId} 所有设备状态已匹配，任务执行成功`);
          this.updateTaskStatus(taskId, task.taskKey, 2, 100);
          
          this.checkWorkflowCompletion();
        } else {
          const matchedCount = taskDevices.filter(devId => {
            const expected = this.expectedStates.get(devId);
            const actual = this.actualStates.get(devId);
            return expected && actual && this.checkDeviceStateMatch(devId);
          }).length;
          
          const progress = Math.round((matchedCount / taskDevices.length) * 100);
          this.updateTaskStatus(taskId, task.taskKey, 1, progress);
        }
      }
    },
    
    checkWorkflowCompletion() {
      if (!this.currentWorkflow || this.workflowStatus !== 'running') return;
      
      const allCompleted = this.runningTasks.every(task => task.status === 2 || task.status === 3);
      
      if (allCompleted) {
        this.workflowStatus = 'completed';
        this.currentWorkflow.endTime = new Date();
        this.stopStateChecking();
        
        console.log('🎉 工作流执行完成:', this.currentWorkflow);
        
        this.notifyWorkflowCompletion();
      }
    },
    
    startStateChecking() {
      this.stopStateChecking();
      
      this.stateCheckInterval = setInterval(() => {
        this.performStateCheck();
      }, this.stateCheckFrequency);
      
      setTimeout(() => {
        if (this.workflowStatus === 'running') {
          console.warn('⚠️ 工作流执行超时');
          this.workflowStatus = 'failed';
          this.stopStateChecking();
        }
      }, this.maxExecutionTime);
    },
    
    stopStateChecking() {
      if (this.stateCheckInterval) {
        clearInterval(this.stateCheckInterval);
        this.stateCheckInterval = null;
      }
    },
    
    performStateCheck() {
      if (this.workflowStatus !== 'running') return;
      
      this.expectedStates.forEach((expected, deviceId) => {
        if (this.actualStates.has(deviceId)) {
          this.checkDeviceStateMatch(deviceId);
        }
      });
    },
    
    terminateWorkflow(reason = '用户终止') {
      if (this.currentWorkflow && this.workflowStatus === 'running') {
        this.workflowStatus = 'failed';
        this.currentWorkflow.endTime = new Date();
        this.currentWorkflow.terminationReason = reason;
        
        this.runningTasks.forEach(task => {
          if (task.status === 1) {
            this.updateTaskStatus(task.taskId, task.taskKey, 3, task.progress);
          }
        });
        
        this.stopStateChecking();
        console.log('🛑 工作流已终止:', reason);
      }
    },
    
    notifyWorkflowCompletion() {
      window.dispatchEvent(new CustomEvent('workflowCompleted', {
        detail: this.currentWorkflow
      }));
    },

    async fetchRunningTasks() {
      try {
        const response = await axios.get('/chem-api/tasks/running');
        if (response.data && response.data.code === 0) {
          this.runningTasks = response.data.data;
          this.lastUpdate = new Date();
        }
      } catch (error) {
        console.error('获取运行中任务失败', error);
      }
    },
    
    async syncWithServer() {
      try {
        await http.request("post", "/chem-api/tasks/sync", {
          data: {
            // 仅发送必要数据，避免 Map / 复杂对象进入请求体
            runningTasks: this.runningTasks
          }
        });
      } catch (error) {
        console.error('同步任务状态失败', error);
      }
    },
    
    startPolling(interval = 10000) {
      this.stopPolling();
      this.pollingInterval = setInterval(() => {
        this.fetchRunningTasks();
      }, interval);
    },
    
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    }
  }
});