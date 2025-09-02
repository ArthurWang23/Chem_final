/**
 * 🔧 Task界面专用WebSocket适配器 - 简化重构版
 * 基于sharedConnectionManager，专注于Task界面特有的业务逻辑
 * 移除重复的连接管理功能，提高代码复用性和维护性
 */
import sharedConnectionManager from './sharedConnectionManager.js';
import { ref, computed } from 'vue';

export class TaskWebSocketManager {
  constructor() {
    // 🔧 直接使用共享连接状态，避免状态重复
    this.wsConnected = sharedConnectionManager.isConnected;
    this.isHardwareConnected = computed(() => sharedConnectionManager.hardwareStatus.connected);
    this.hardwareIP = computed(() => sharedConnectionManager.hardwareStatus.ip || '192.168.1.14');
    this.serverHardwareConnected = computed(() => sharedConnectionManager.hardwareStatus.connected);
    
    // 🎯 Task界面特有的业务状态
    this.taskMessageHandlers = new Map();
    this.workflowExecutions = new Map();
    this.concurrentGroups = new Map();
    this.queueResults = new Map();
    
    // 🤖 AI WebSocket管理已移至Task界面直接管理，避免重复连接
    // 这里不再管理AI连接，由Task界面统一处理
    
    // 📊 Task界面特有的监控数据
    this.taskMetrics = {
      workflowsExecuted: 0,
      tasksCompleted: 0,
      averageExecutionTime: 0,
      lastWorkflowTime: null
    };
    
    this.init();
  }
  
  /**
   * 初始化Task专用WebSocket适配器
   */
  init() {
    // 监听共享连接管理器的事件
    sharedConnectionManager.on('connected', this.handleConnectionOpen.bind(this));
    sharedConnectionManager.on('disconnected', this.handleConnectionClose.bind(this));
    sharedConnectionManager.on('message', this.handleSharedMessage.bind(this));
    sharedConnectionManager.on('error', this.handleConnectionError.bind(this));
    
    // AI WebSocket由Task界面直接管理，此处不再初始化
    
    console.log('🚀 Task WebSocket适配器已初始化（基于共享连接管理器）');
  }
  
  /**
   * 连接打开处理 - 简化版
   */
  handleConnectionOpen(event) {
    console.log('🎉 Task界面：WebSocket连接已建立');
    
    // Task界面特有的初始化操作
    setTimeout(() => {
      this.requestInitialData();
    }, 500);
  }
  
  /**
   * 连接关闭处理 - 简化版
   */
  handleConnectionClose(event) {
    console.log('🔌 Task界面：WebSocket连接已关闭');
    
    // 清理Task相关的临时状态
    this.workflowExecutions.clear();
    this.concurrentGroups.clear();
  }
  
  /**
   * 连接错误处理
   */
  handleConnectionError(error) {
    console.error('❌ Task界面：WebSocket连接错误:', error);
  }
  
  /**
   * 🎯 处理共享连接管理器的消息 - 只处理Task相关消息
   */
  handleSharedMessage(data) {
    if (!data || !data.type) return;
    
    // 只处理Task界面关心的消息类型
    switch (data.type) {
      // 工作流相关消息
      case 'workflowStarted':
        this.handleWorkflowStarted(data);
        break;
      case 'stepStarted':
        this.handleStepStarted(data);
        break;
      case 'stepCompleted':
        this.handleStepCompleted(data);
        break;
      case 'stepFailed':
        this.handleStepFailed(data);
        break;
      case 'workflowCompleted':
        this.handleWorkflowCompleted(data);
        break;
      case 'taskSwitched':
        this.handleTaskSwitched(data);
        break;
        
      // 任务队列相关消息
      case 'queueTaskCompleted':
        this.handleQueueTaskCompleted(data);
        break;
      case 'queueTaskFailed':
        this.handleQueueTaskFailed(data);
        break;
        
      // 并发工作流相关消息
      case 'concurrentGroupStarted':
        this.handleConcurrentGroupStarted(data);
        break;
      case 'concurrentGroupCompleted':
        this.handleConcurrentGroupCompleted(data);
        break;
      case 'concurrentGroupError':
        this.handleConcurrentGroupError(data);
        break;
        
      // 其他Task相关消息可以在这里添加
      default:
        // 调用自定义消息处理器
        this.callCustomHandlers(data.type, data);
        break;
    }
  }
  
  /**
   * 🎯 Task界面特有的消息处理方法
   */
  handleWorkflowStarted(data) {
    console.log('🚀 工作流已启动:', data.data);
    const { workflowId } = data.data || {};
    if (workflowId) {
      this.workflowExecutions.set(workflowId, {
        startTime: Date.now(),
        status: 'running',
        steps: []
      });
      this.taskMetrics.workflowsExecuted++;
    }
    this.callCustomHandlers('workflowStarted', data);
  }
  
  handleStepStarted(data) {
    console.log('📝 步骤已开始:', data.data);
    this.callCustomHandlers('stepStarted', data);
  }
  
  handleStepCompleted(data) {
    console.log('✅ 步骤已完成:', data.data);
    this.callCustomHandlers('stepCompleted', data);
  }
  
  handleStepFailed(data) {
    console.error('❌ 步骤失败:', data.data);
    this.callCustomHandlers('stepFailed', data);
  }
  
  handleWorkflowCompleted(data) {
    console.log('🎉 工作流已完成:', data.data);
    const { workflowId } = data.data || {};
    if (workflowId && this.workflowExecutions.has(workflowId)) {
      const execution = this.workflowExecutions.get(workflowId);
      execution.endTime = Date.now();
      execution.status = 'completed';
      execution.duration = execution.endTime - execution.startTime;
      
      // 更新平均执行时间
      this.updateAverageExecutionTime(execution.duration);
      this.taskMetrics.lastWorkflowTime = execution.endTime;
    }
    this.callCustomHandlers('workflowCompleted', data);
  }
  
  handleTaskSwitched(data) {
    console.log('🔄 任务已切换:', data.data);
    this.callCustomHandlers('taskSwitched', data);
  }
  
  handleQueueTaskCompleted(data) {
    console.log('🎯 队列任务完成:', data.data);
    this.taskMetrics.tasksCompleted++;
    this.callCustomHandlers('queueTaskCompleted', data);
  }
  
  handleQueueTaskFailed(data) {
    console.error('❌ 队列任务失败:', data.data);
    this.callCustomHandlers('queueTaskFailed', data);
  }
  
  handleConcurrentGroupStarted(data) {
    console.log('🚀 并发组已启动:', data.data);
    const { groupId } = data.data || {};
    if (groupId) {
      this.concurrentGroups.set(groupId, {
        startTime: Date.now(),
        status: 'running'
      });
    }
    this.callCustomHandlers('concurrentGroupStarted', data);
  }
  
  handleConcurrentGroupCompleted(data) {
    console.log('✅ 并发组已完成:', data.data);
    this.callCustomHandlers('concurrentGroupCompleted', data);
  }
  
  handleConcurrentGroupError(data) {
    console.error('❌ 并发组错误:', data.data);
    this.callCustomHandlers('concurrentGroupError', data);
  }
  
  /**
   * 📤 发送消息 - 直接使用共享连接管理器
   */
  sendMessage(message) {
    return sharedConnectionManager.send(message);
  }
  
  /**
   * 📤 发送硬件消息 - 直接使用共享连接管理器
   */
  sendHardwareMessage(message) {
    return sharedConnectionManager.send(message);
  }
  
  /**
   * 🎯 请求初始数据 - Task界面特有
   */
  requestInitialData() {
    // 请求任务相关的初始数据
    this.sendMessage({ type: 'getRunningTasks' });
    this.sendMessage({ type: 'getTaskQueue' });
    this.sendMessage({ type: 'getWorkflowStatus' });
  }
  
  /**
   * 📊 更新平均执行时间
   */
  updateAverageExecutionTime(newDuration) {
    const currentAvg = this.taskMetrics.averageExecutionTime;
    const count = this.taskMetrics.workflowsExecuted;
    
    if (count === 1) {
      this.taskMetrics.averageExecutionTime = newDuration;
    } else {
      this.taskMetrics.averageExecutionTime = 
        (currentAvg * (count - 1) + newDuration) / count;
    }
  }
  
  /**
   * 🔧 自定义消息处理器管理
   */
  addMessageHandler(type, handler) {
    if (!this.taskMessageHandlers.has(type)) {
      this.taskMessageHandlers.set(type, []);
    }
    this.taskMessageHandlers.get(type).push(handler);
  }
  
  removeMessageHandler(type, handler) {
    if (this.taskMessageHandlers.has(type)) {
      const handlers = this.taskMessageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  callCustomHandlers(type, data) {
    if (this.taskMessageHandlers.has(type)) {
      this.taskMessageHandlers.get(type).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`处理消息 ${type} 时出错:`, error);
        }
      });
    }
  }
  
    // 🤖 AI WebSocket相关方法已移除，由Task界面直接管理AI连接
  
  /**
   * 📊 获取Task界面的连接和性能信息
   */
  getTaskConnectionInfo() {
    return {
      // 基础连接信息（来自共享管理器）
      ...sharedConnectionManager.getConnectionInfo(),
      
      // Task界面特有信息（AI连接信息已移至Task界面管理）
      activeWorkflows: this.workflowExecutions.size,
      activeConcurrentGroups: this.concurrentGroups.size,
      taskMetrics: { ...this.taskMetrics },
      customHandlers: this.taskMessageHandlers.size
    };
  }
  
  /**
   * 🧹 清理资源
   */
  destroy() {
    // 清理事件监听器（AI WebSocket已由Task界面管理）
    this.taskMessageHandlers.clear();
    this.workflowExecutions.clear();
    this.concurrentGroups.clear();
    this.queueResults.clear();
    
    console.log('🧹 Task WebSocket适配器已销毁');
  }
}

// 导出类，让Task界面可以创建实例
export default TaskWebSocketManager; 