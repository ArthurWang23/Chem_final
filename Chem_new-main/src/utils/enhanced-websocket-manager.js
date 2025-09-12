/**
 * 🚀 增强版WebSocket管理器 - 第二阶段优化
 * 提供超时检测、错误处理、连接质量监控、性能监控和状态同步优化
 */
import { ref, reactive, computed } from 'vue';
import sharedConnectionManager from './sharedConnectionManager.js';

class EnhancedWebSocketManager {
  constructor() {
    // 基础状态
    this.isConnected = ref(false);
    this.connectionQuality = ref('unknown');
    this.lastActivity = ref(Date.now());
    
    // 超时检测配置
    this.timeoutConfig = {
      heartbeatInterval: 30000, // 30秒心跳间隔
      operationTimeout: 10000,  // 10秒操作超时
      statusCheckTimeout: 5000, // 5秒状态检查超时
      maxRetries: 3,            // 最大重试次数
      retryDelay: 2000          // 重试延迟
    };
    
    // 错误处理系统
    this.errorSystem = {
      errorTypes: {
        TIMEOUT: 'timeout',
        CONNECTION_LOST: 'connection_lost',
        DEVICE_ERROR: 'device_error',
        PARAMETER_ERROR: 'parameter_error',
        HARDWARE_ERROR: 'hardware_error'
      },
      errorHistory: [],
      maxHistorySize: 100
    };
    
    // 连接质量监控
    this.qualityMetrics = reactive({
      responseTime: 0,
      packetLoss: 0,
      reconnectCount: 0,
      lastPing: 0,
      pingHistory: [],
      stabilityScore: 100
    });
    
    // 性能监控
    this.performanceMetrics = reactive({
      messagesSent: 0,
      messagesReceived: 0,
      successRate: 100,
      averageResponseTime: 0,
      operationStats: new Map(),
      failureCount: 0
    });
    
    // 状态同步优化
    this.stateSync = {
      deviceCache: new Map(),
      pendingOperations: new Map(),
      consistencyChecks: new Map(),
      syncQueue: [],
      lastSyncTime: 0
    };
    
    // 定时器管理
    this.timers = {
      heartbeat: null,
      qualityCheck: null,
      performanceReport: null,
      stateConsistencyCheck: null
    };
    
    // 操作追踪
    this.operationTracker = new Map();
    
    // 事件系统
    this.eventListeners = new Map();
    
    this.init();
  }
  
  /**
   * 初始化增强管理器
   */
  init() {
    // 监听共享连接管理器事件
    sharedConnectionManager.on('connected', this.handleConnection.bind(this));
    sharedConnectionManager.on('disconnected', this.handleDisconnection.bind(this));
    sharedConnectionManager.on('message', this.handleMessage.bind(this));
    sharedConnectionManager.on('error', this.handleError.bind(this));
    
    // 启动监控定时器
    this.startMonitoring();
    
    console.log('🚀 增强WebSocket管理器已初始化');
  }
  
  /**
   * 🔧 启动监控服务
   */
  startMonitoring() {
    // 心跳检测
    this.timers.heartbeat = setInterval(() => {
      this.performHeartbeat();
    }, this.timeoutConfig.heartbeatInterval);
    
    // 连接质量检查
    this.timers.qualityCheck = setInterval(() => {
      this.checkConnectionQuality();
    }, 15000); // 每15秒检查一次
    
    // 性能报告
    this.timers.performanceReport = setInterval(() => {
      this.generatePerformanceReport();
    }, 60000); // 每分钟生成一次
    
    // 状态一致性检查
    this.timers.stateConsistencyCheck = setInterval(() => {
      this.checkStateConsistency();
    }, 30000); // 每30秒检查一次
    
    console.log('📊 监控服务已启动');
  }
  
  /**
   * 💓 执行心跳检测
   */
  performHeartbeat() {
    if (!this.isConnected.value) return;
    
    const pingTime = Date.now();
    const heartbeatId = `heartbeat_${pingTime}`;
    
    // 使用增强发送（自动附带 operationId 与超时检测），避免重复手动追踪和定时器
    this.sendEnhanced(
      {
        type: 'heartbeat',
        timestamp: pingTime
      },
      {
        type: 'heartbeat',
        operationId: heartbeatId,
        timeout: this.timeoutConfig.operationTimeout
      }
    );
  }
  
  /**
   * ⏰ 检查操作超时
   */
  checkOperationTimeout(operationId) {
    const operation = this.operationTracker.get(operationId);
    if (!operation) return;
    
    const now = Date.now();
    const elapsed = now - operation.startTime;
    
    if (elapsed >= operation.timeout) {
      console.warn(`⚠️ 操作超时: ${operation.type} (${elapsed}ms)`);
      
      // 记录错误
      this.recordError({
        type: this.errorSystem.errorTypes.TIMEOUT,
        operation: operation.type,
        elapsed: elapsed,
        threshold: operation.timeout
      });
      
      // 处理超时
      this.handleOperationTimeout(operationId, operation);
    }
  }
  
  /**
   * 🔧 处理操作超时
   */
  handleOperationTimeout(operationId, operation) {
    // 清除已超时的操作
    this.operationTracker.delete(operationId);
    
    // 根据操作类型处理超时
    switch (operation.type) {
      case 'heartbeat':
        this.handleHeartbeatTimeout();
        break;
      case 'device_command':
        this.handleDeviceCommandTimeout(operation);
        break;
      case 'status_check':
        this.handleStatusCheckTimeout(operation);
        break;
      default:
        console.warn(`未知的操作类型超时: ${operation.type}`);
    }
    
    // 更新性能指标
    this.performanceMetrics.failureCount++;
    this.updateSuccessRate();
  }
  
  /**
   * 💓 处理心跳超时
   */
  handleHeartbeatTimeout() {
    console.warn('💓 心跳超时，检查连接状态');
    
    // 降低连接质量评分
    this.qualityMetrics.stabilityScore = Math.max(0, this.qualityMetrics.stabilityScore - 10);
    this.connectionQuality.value = this.evaluateConnectionQuality();
    
    // 如果连接质量过低，尝试重连
    if (this.qualityMetrics.stabilityScore < 30) {
      console.warn('⚠️ 连接质量过低，启动重连');
      this.initiateReconnection();
    }
  }
  
  /**
   * 🔧 处理设备命令超时
   */
  handleDeviceCommandTimeout(operation) {
    console.warn(`🔧 设备命令超时: ${operation.deviceId} - ${operation.command}`);
    
    // 检查是否需要重试
    if (operation.retryCount < this.timeoutConfig.maxRetries) {
      console.log(`🔄 重试设备命令 (${operation.retryCount + 1}/${this.timeoutConfig.maxRetries})`);
      
      setTimeout(() => {
        this.retryDeviceCommand(operation);
      }, this.timeoutConfig.retryDelay);
    } else {
      console.error('❌ 设备命令重试次数已达上限');
      this.recordError({
        type: this.errorSystem.errorTypes.DEVICE_ERROR,
        deviceId: operation.deviceId,
        command: operation.command,
        reason: 'max_retries_exceeded'
      });
    }
  }
  
  /**
   * 🔄 重试设备命令
   */
  retryDeviceCommand(operation) {
    const newOperationId = `retry_${Date.now()}`;
    const retryOperation = {
      ...operation,
      id: newOperationId,
      retryCount: (operation.retryCount || 0) + 1,
      startTime: Date.now()
    };
    
    this.operationTracker.set(newOperationId, retryOperation);
    
    // 重新发送命令
    sharedConnectionManager.send({
      type: 'updateDeviceParameters',
      payload: [{
        id: operation.deviceId,
        type: operation.deviceType,
        action: operation.command,
        parameters: operation.parameters
      }],
      operationId: newOperationId
    });
  }
  
  /**
   * 📊 检查连接质量
   */
  checkConnectionQuality() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity.value;
    
    // 检查活动时间
    if (timeSinceLastActivity > this.timeoutConfig.heartbeatInterval * 2) {
      console.warn('⚠️ 长时间无活动，可能存在连接问题');
      this.qualityMetrics.stabilityScore = Math.max(0, this.qualityMetrics.stabilityScore - 5);
    }
    
    // 计算连接质量
    this.connectionQuality.value = this.evaluateConnectionQuality();
    
    // 更新质量指标
    this.updateQualityMetrics();
  }
  
  /**
   * 🎯 评估连接质量
   */
  evaluateConnectionQuality() {
    const { responseTime, packetLoss, reconnectCount, stabilityScore } = this.qualityMetrics;
    
    let quality = 'excellent';
    
    // 基于响应时间
    if (responseTime > 1000) quality = 'poor';
    else if (responseTime > 500) quality = 'fair';
    else if (responseTime > 200) quality = 'good';
    
    // 基于丢包率
    if (packetLoss > 10) quality = 'poor';
    else if (packetLoss > 5) quality = 'fair';
    
    // 基于重连次数
    if (reconnectCount > 10) quality = 'poor';
    else if (reconnectCount > 5) quality = 'fair';
    
    // 基于稳定性评分
    if (stabilityScore < 30) quality = 'poor';
    else if (stabilityScore < 60) quality = 'fair';
    else if (stabilityScore < 80) quality = 'good';
    
    return quality;
  }
  
  /**
   * 📊 更新质量指标
   */
  updateQualityMetrics() {
    // 计算平均响应时间
    if (this.qualityMetrics.pingHistory.length > 0) {
      const avgPing = this.qualityMetrics.pingHistory.reduce((a, b) => a + b, 0) / this.qualityMetrics.pingHistory.length;
      this.qualityMetrics.responseTime = Math.round(avgPing);
    }
    
    // 保持历史记录不超过100个
    if (this.qualityMetrics.pingHistory.length > 100) {
      this.qualityMetrics.pingHistory.shift();
    }
    
    // 计算丢包率
    const totalOperations = this.performanceMetrics.messagesSent;
    const failedOperations = this.performanceMetrics.failureCount;
    this.qualityMetrics.packetLoss = totalOperations > 0 ? (failedOperations / totalOperations) * 100 : 0;
  }
  
  /**
   * 📈 生成性能报告
   */
  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      connection: {
        quality: this.connectionQuality.value,
        stability: this.qualityMetrics.stabilityScore,
        responseTime: this.qualityMetrics.responseTime,
        packetLoss: this.qualityMetrics.packetLoss
      },
      performance: {
        messagesSent: this.performanceMetrics.messagesSent,
        messagesReceived: this.performanceMetrics.messagesReceived,
        successRate: this.performanceMetrics.successRate,
        averageResponseTime: this.performanceMetrics.averageResponseTime,
        failureCount: this.performanceMetrics.failureCount
      },
      devices: {
        cached: this.stateSync.deviceCache.size,
        pendingOperations: this.stateSync.pendingOperations.size,
        lastSync: this.stateSync.lastSyncTime
      }
    };
    
    console.log('📊 性能报告:', report);
    
    // 可以在这里添加报告发送逻辑
    this.emit('performanceReport', report);
  }
  
  /**
   * 🔍 检查状态一致性
   */
  checkStateConsistency() {
    const now = Date.now();
    const staleThreshold = 60000; // 1分钟
    
    // 检查设备缓存是否过期
    for (const [deviceId, device] of this.stateSync.deviceCache.entries()) {
      if (now - device.lastUpdate > staleThreshold) {
        console.warn(`⚠️ 设备状态可能过期: ${deviceId}`);
        this.requestDeviceStatusUpdate(deviceId);
      }
    }
    
    // 检查待处理操作
    for (const [operationId, operation] of this.stateSync.pendingOperations.entries()) {
      if (now - operation.startTime > this.timeoutConfig.operationTimeout) {
        console.warn(`⚠️ 待处理操作超时: ${operationId}`);
        this.handlePendingOperationTimeout(operationId, operation);
      }
    }
  }
  
  /**
   * 🔄 请求设备状态更新
   */
  requestDeviceStatusUpdate(deviceId) {
    const operationId = `status_update_${deviceId}_${Date.now()}`;
    
    this.operationTracker.set(operationId, {
      type: 'status_check',
      deviceId: deviceId,
      startTime: Date.now(),
      timeout: this.timeoutConfig.statusCheckTimeout
    });
    
    sharedConnectionManager.send({
      type: 'getDeviceInfo',
      payload: { id: deviceId },
      operationId: operationId
    });
  }
  
  /**
   * 📝 记录错误
   */
  recordError(error) {
    const errorRecord = {
      ...error,
      timestamp: new Date().toISOString(),
      id: `error_${Date.now()}`
    };
    
    this.errorSystem.errorHistory.push(errorRecord);
    
    // 保持错误历史记录不超过最大大小
    if (this.errorSystem.errorHistory.length > this.errorSystem.maxHistorySize) {
      this.errorSystem.errorHistory.shift();
    }
    
    console.error('❌ 错误记录:', errorRecord);
    
    // 触发错误事件
    this.emit('error', errorRecord);
  }
  
  /**
   * 📤 增强发送方法
   */
  sendEnhanced(message, options = {}) {
    const operationId = options.operationId || `op_${Date.now()}`;
    const timeout = options.timeout || this.timeoutConfig.operationTimeout;
    const retryCount = options.retryCount || 0;
    
    // 记录操作
    this.operationTracker.set(operationId, {
      type: options.type || 'general',
      startTime: Date.now(),
      timeout: timeout,
      retryCount: retryCount,
      ...options
    });
    
    // 发送消息
    const messageWithId = {
      ...message,
      operationId: operationId
    };
    
    const success = sharedConnectionManager.send(messageWithId);
    
    if (success) {
      this.performanceMetrics.messagesSent++;
      
      // 设置超时检测
      setTimeout(() => {
        this.checkOperationTimeout(operationId);
      }, timeout);
    } else {
      this.performanceMetrics.failureCount++;
      this.updateSuccessRate();
    }
    
    return success;
  }
  
  /**
   * 📊 更新成功率
   */
  updateSuccessRate() {
    const total = this.performanceMetrics.messagesSent + this.performanceMetrics.failureCount;
    if (total > 0) {
      this.performanceMetrics.successRate = ((this.performanceMetrics.messagesSent / total) * 100).toFixed(2);
    }
  }
  
  /**
   * 🔌 处理连接事件
   */
  handleConnection(event) {
    console.log('🎉 增强管理器：连接已建立');
    this.isConnected.value = true;
    this.lastActivity.value = Date.now();
    this.qualityMetrics.stabilityScore = Math.min(100, this.qualityMetrics.stabilityScore + 10);
  }
  
  /**
   * 🔌 处理断开连接事件
   */
  handleDisconnection(event) {
    console.log('🔌 增强管理器：连接已断开');
    this.isConnected.value = false;
    this.qualityMetrics.reconnectCount++;
    this.qualityMetrics.stabilityScore = Math.max(0, this.qualityMetrics.stabilityScore - 15);
  }
  
  /**
   * 📨 处理消息事件
   */
  handleMessage(data) {
    this.lastActivity.value = Date.now();
    this.performanceMetrics.messagesReceived++;
    
    // 处理操作响应
    if (data.operationId && this.operationTracker.has(data.operationId)) {
      const operation = this.operationTracker.get(data.operationId);
      const responseTime = Date.now() - operation.startTime;
      
      // 更新响应时间
      this.qualityMetrics.pingHistory.push(responseTime);
      this.performanceMetrics.averageResponseTime = this.qualityMetrics.pingHistory.reduce((a, b) => a + b, 0) / this.qualityMetrics.pingHistory.length;
      
      // 移除已完成的操作
      this.operationTracker.delete(data.operationId);
      
      console.log(`✅ 操作完成: ${operation.type} (${responseTime}ms)`);
    }
  }
  
  /**
   * 🔧 处理错误事件
   */
  handleError(error) {
    console.error('❌ 增强管理器：错误事件', error);
    this.recordError({
      type: this.errorSystem.errorTypes.CONNECTION_LOST,
      error: error.message
    });
  }
  
  /**
   * 🔄 启动重连
   */
  initiateReconnection() {
    console.log('🔄 启动增强重连机制');
    sharedConnectionManager.manualReconnect();
  }
  
  /**
   * 📊 获取系统状态
   */
  getSystemStatus() {
    return {
      connection: {
        connected: this.isConnected.value,
        quality: this.connectionQuality.value,
        lastActivity: this.lastActivity.value
      },
      performance: this.performanceMetrics,
      quality: this.qualityMetrics,
      errors: this.errorSystem.errorHistory.slice(-10), // 最近10个错误
      operations: {
        active: this.operationTracker.size,
        pending: this.stateSync.pendingOperations.size
      }
    };
  }
  
  /**
   * 📝 添加事件监听器
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  /**
   * 🔇 移除事件监听器
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * 📢 触发事件
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) return;
    
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件回调错误 (${event}):`, error);
      }
    });
  }
  
  /**
   * 🧹 清理资源
   */
  destroy() {
    // 清理所有定时器
    Object.values(this.timers).forEach(timer => {
      if (timer) clearInterval(timer);
    });
    
    // 清理操作追踪
    this.operationTracker.clear();
    this.stateSync.deviceCache.clear();
    this.stateSync.pendingOperations.clear();
    
    // 清理事件监听器
    this.eventListeners.clear();
    
    console.log('🧹 增强WebSocket管理器已清理');
  }
}

// 创建增强管理器实例
export const enhancedWebSocketManager = new EnhancedWebSocketManager();
export default enhancedWebSocketManager;