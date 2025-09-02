/**
 * 🔧 TopControl界面优化WebSocket通信模块 - 第二阶段增强版
 * 使用共享连接管理器，解决双重连接和状态同步问题
 * 增加超时检测、错误处理、连接质量监控、性能监控和状态同步优化
 */
import sharedConnectionManager from '@/utils/sharedConnectionManager.js';
import enhancedWebSocketManager from '@/utils/enhanced-websocket-manager.js';
import { ref, reactive } from 'vue';

export class TopControlWebSocketManager {
  constructor() {
    // 基础连接状态（响应式）
    this.wsConnected = ref(false);
    this.isHardwareConnected = ref(false);
    this.hardwareIP = ref('192.168.1.14');
    this.hardwareErrorMessage = ref('');
    this.isHardwareConnecting = ref(false);
    
    // 设备数据存储
    this.globalDevices = ref(new Map());
    this.deviceUpdateCallbacks = new Set();
    
    // 消息处理器
    this.messageHandlers = new Map();
    
    // 🚀 第二阶段增强功能
    this.enhancedFeatures = {
      // 超时检测配置
      timeoutConfig: {
        deviceOperationTimeout: 15000, // 15秒设备操作超时
        parameterUpdateTimeout: 8000,  // 8秒参数更新超时
        statusCheckTimeout: 5000,      // 5秒状态检查超时
        maxRetries: 3,                 // 最大重试次数
        retryDelay: 2000              // 重试延迟
      },
      
      // 错误处理增强
      errorHandling: {
        errorCategories: {
          DEVICE_TIMEOUT: 'device_timeout',
          PARAMETER_FAILED: 'parameter_failed',
          CONNECTION_UNSTABLE: 'connection_unstable',
          HARDWARE_ERROR: 'hardware_error',
          SYNC_ERROR: 'sync_error'
        },
        errorHistory: [],
        maxHistorySize: 50,
        recoveryStrategies: new Map()
      },
      
      // 性能监控
      performanceMonitor: reactive({
        deviceOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageResponseTime: 0,
        operationHistory: [],
        lastReportTime: Date.now()
      }),
      
      // 状态同步优化
      stateSync: {
        deviceStateCache: new Map(),
        pendingUpdates: new Map(),
        lastSyncTime: 0,
        syncInterval: 10000, // 10秒同步间隔
        staleThreshold: 30000 // 30秒过期阈值
      }
    };
    
    // 操作追踪器
    this.operationTracker = new Map();
    
    // 定时器管理
    this.timers = {
      stateSync: null,
      performanceReport: null,
      operationCleanup: null
    };
    
    this.init();
  }
  
  /**
   * 初始化WebSocket管理器
   */
  init() {
    // 监听共享连接管理器的事件
    sharedConnectionManager.on('connected', this.handleConnectionOpen.bind(this));
    sharedConnectionManager.on('disconnected', this.handleConnectionClose.bind(this));
    sharedConnectionManager.on('message', this.handleMessage.bind(this));
    sharedConnectionManager.on('error', this.handleConnectionError.bind(this));
    sharedConnectionManager.on('reconnecting', this.handleReconnecting.bind(this));
    
    // 🚀 监听增强WebSocket管理器的事件
    enhancedWebSocketManager.on('performanceReport', this.handlePerformanceReport.bind(this));
    enhancedWebSocketManager.on('error', this.handleEnhancedError.bind(this));
    
    // 同步连接状态
    this.wsConnected.value = sharedConnectionManager.isConnected.value;
    this.isHardwareConnected.value = sharedConnectionManager.hardwareStatus.connected;
    this.hardwareIP.value = sharedConnectionManager.hardwareStatus.ip || '192.168.1.14';
    
    // 🚀 启动增强功能
    this.initializeEnhancedFeatures();
  }
  
  /**
   * 🚀 初始化增强功能
   */
  initializeEnhancedFeatures() {
    // 启动状态同步定时器
    this.timers.stateSync = setInterval(() => {
      this.performStateSync();
    }, this.enhancedFeatures.stateSync.syncInterval);
    
    // 启动性能报告定时器
    this.timers.performanceReport = setInterval(() => {
      this.generateTopControlPerformanceReport();
    }, 60000); // 每分钟生成一次
    
    // 启动操作清理定时器
    this.timers.operationCleanup = setInterval(() => {
      this.cleanupStaleOperations();
    }, 30000); // 每30秒清理一次
    
    // 初始化错误恢复策略
    this.initializeRecoveryStrategies();
    
    console.log('🚀 TopControl增强功能已初始化');
  }
  
  /**
   * 🔧 初始化错误恢复策略
   */
  initializeRecoveryStrategies() {
    const strategies = this.enhancedFeatures.errorHandling.recoveryStrategies;
    
    // 设备超时恢复策略
    strategies.set('DEVICE_TIMEOUT', {
      maxRetries: 3,
      retryDelay: 2000,
      escalationDelay: 5000,
      recover: async (error, retryCount) => {
        if (retryCount < 3) {
          console.log(`🔄 设备超时恢复策略: 重试 ${retryCount + 1}/3`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
          return this.retryDeviceOperation(error.deviceId, error.operation);
        } else {
          console.log('⚠️ 设备超时恢复策略: 请求用户干预');
          return this.requestUserIntervention(error);
        }
      }
    });
    
    // 参数更新失败恢复策略
    strategies.set('PARAMETER_FAILED', {
      maxRetries: 2,
      retryDelay: 1000,
      recover: async (error, retryCount) => {
        if (retryCount < 2) {
          console.log(`🔄 参数更新失败恢复策略: 重试 ${retryCount + 1}/2`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.retryParameterUpdate(error.deviceId, error.parameters);
        } else {
          console.log('⚠️ 参数更新失败恢复策略: 回滚到上一个已知状态');
          return this.rollbackToLastKnownState(error.deviceId);
        }
      }
    });
    
    // 连接不稳定恢复策略
    strategies.set('CONNECTION_UNSTABLE', {
      maxRetries: 5,
      retryDelay: 3000,
      recover: async (error, retryCount) => {
        if (retryCount < 5) {
          console.log(`🔄 连接不稳定恢复策略: 重连 ${retryCount + 1}/5`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return sharedConnectionManager.manualReconnect();
        } else {
          console.log('⚠️ 连接不稳定恢复策略: 切换到离线模式');
          return this.switchToOfflineMode();
        }
      }
    });
  }
  
  /**
   * 连接打开处理
   */
  handleConnectionOpen(event) {
    console.log('🎉 TopControl WebSocket连接已建立');
    this.wsConnected.value = true;
    this.isHardwareConnecting.value = false;
    
    // 请求当前硬件状态
    setTimeout(() => {
      this.requestHardwareStatus();
    }, 500);
  }
  
  /**
   * 连接关闭处理
   */
  handleConnectionClose(event) {
    console.log('🔌 TopControl WebSocket连接已关闭');
    this.wsConnected.value = false;
    this.isHardwareConnected.value = false;
  }
  
  /**
   * 连接错误处理
   */
  handleConnectionError(error) {
    console.error('❌ TopControl WebSocket错误:', error);
    this.hardwareErrorMessage.value = '连接错误: ' + error.message;
    this.isHardwareConnecting.value = false;
  }
  
  /**
   * 重连处理
   */
  handleReconnecting(retryCount) {
    console.log(`🔄 TopControl重连中... (第${retryCount}次)`);
    this.isHardwareConnecting.value = true;
  }
  
  /**
   * 消息处理中心
   */
  handleMessage(data) {
    if (!data || !data.type) return;
    
    try {
      switch (data.type) {
        case 'connection':
          this.handleConnectionMessage(data);
          break;
          
        case 'devices':
          this.handleDevicesMessage(data);
          break;
          
        case 'deviceInfo':
          this.handleDeviceInfoMessage(data);
          break;
          
        case 'parameterUpdateResults':
          this.handleParameterUpdateResults(data);
          break;
          
        case 'hardwareStatus':
          this.handleHardwareStatusMessage(data);
          break;
          
        case 'deviceStatus':
          this.handleDeviceStatusMessage(data);
          break;
          
        case 'error':
          this.handleErrorMessage(data);
          break;
          
        default:
          console.log('🔍 TopControl未处理的消息类型:', data.type);
          break;
      }
      
      // 执行自定义消息处理器
      if (this.messageHandlers.has(data.type)) {
        this.messageHandlers.get(data.type).forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`自定义消息处理器错误 (${data.type}):`, error);
          }
        });
      }
      
    } catch (error) {
      console.error('TopControl消息处理错误:', error);
    }
  }
  
  /**
   * 处理设备列表消息
   */
  handleDevicesMessage(data) {
    if (data.data && Array.isArray(data.data)) {
      console.log(`📋 TopControl收到设备列表: ${data.data.length}个设备`);
      
      // 更新全局设备仓库
      data.data.forEach(device => {
        this.globalDevices.value.set(device.id, device);
      });
      
      console.log(`🔧 TopControl全局设备仓库已更新，共 ${this.globalDevices.value.size} 个设备`);
      
      // 触发设备更新回调
      this.triggerDeviceUpdateCallbacks();
    }
  }
  
  /**
   * 处理设备信息消息
   */
  handleDeviceInfoMessage(data) {
    if (data.data && data.data.id) {
      console.log(`📡 TopControl收到设备信息: ${data.data.id}`);
      
      // 更新设备到全局仓库
      this.updateDeviceInStorage(data.data);
    }
  }
  
  /**
   * 处理参数更新结果
   */
  handleParameterUpdateResults(data) {
    if (data.data) {
      const { results, successCount, failedCount } = data.data;
      
      console.log(`✅ TopControl参数更新完成: ${successCount}成功, ${failedCount}失败`);
      
      results.forEach(result => {
        if (result.success) {
          console.log(`✅ 设备 ${result.id} 参数更新成功`);
        } else {
          console.error(`❌ 设备 ${result.id} 参数更新失败: ${result.error}`);
        }
      });
    }
  }
  
  /**
   * 处理硬件状态消息
   */
  handleHardwareStatusMessage(data) {
    if (data.data) {
      const { connected, ip, error } = data.data;
      
      console.log(`🔧 TopControl硬件状态更新: ${connected ? '已连接' : '未连接'}`);
      
      this.isHardwareConnected.value = connected;
      this.isHardwareConnecting.value = false;
      
      if (connected) {
        this.hardwareIP.value = ip || this.hardwareIP.value;
        this.hardwareErrorMessage.value = '';
      } else {
        this.hardwareErrorMessage.value = error || '硬件未连接';
      }
    }
  }
  
  /**
   * 处理设备状态消息
   */
  handleDeviceStatusMessage(data) {
    if (data.devices && Array.isArray(data.devices)) {
      console.log(`📊 TopControl收到设备状态更新: ${data.devices.length}个设备`);
      
      data.devices.forEach(device => {
        this.updateDeviceStatus(device);
      });
    }
  }
  
  /**
   * 处理错误消息
   */
  handleErrorMessage(data) {
    if (data.data && data.data.message) {
      console.error('❌ TopControl服务器错误:', data.data.message);
      this.hardwareErrorMessage.value = data.data.message;
    }
  }
  
  /**
   * 处理连接消息
   */
  handleConnectionMessage(data) {
    console.log('🔌 TopControl连接消息:', data);
  }
  
  /**
   * 🎯 发送WebSocket消息（统一接口）
   */
  sendMessage(message) {
    return sharedConnectionManager.send(message);
  }
  
  /**
   * 🎯 发送设备命令（兼容原TopControl接口）
   */
  sendWsMessage(message) {
    return this.sendMessage(message);
  }
  
  /**
   * 🚀 增强发送设备命令（带超时检测和重试）
   */
  sendEnhancedDeviceCommand(deviceId, deviceType, action, parameters = {}) {
    const operationId = `enhanced_${deviceId}_${action}_${Date.now()}`;
    const startTime = Date.now();
    
    // 记录操作
    this.operationTracker.set(operationId, {
      deviceId,
      deviceType,
      action,
      parameters,
      startTime,
      timeout: this.enhancedFeatures.timeoutConfig.deviceOperationTimeout,
      retryCount: 0,
      type: 'device_command'
    });
    
    // 更新性能监控
    this.enhancedFeatures.performanceMonitor.deviceOperations++;
    
    // 发送命令
    const command = {
      id: deviceId,
      type: deviceType,
      action: action,
      parameters: parameters
    };
    
    const success = this.sendMessage({
      type: 'updateDeviceParameters',
      payload: [command],
      operationId: operationId
    });
    
    // 设置超时检测
    if (success) {
      setTimeout(() => {
        this.checkEnhancedOperationTimeout(operationId);
      }, this.enhancedFeatures.timeoutConfig.deviceOperationTimeout);
    } else {
      this.enhancedFeatures.performanceMonitor.failedOperations++;
      this.operationTracker.delete(operationId);
    }
    
    return success;
  }
  
  /**
   * 🎯 发送单个设备命令
   */
  sendDeviceCommand(deviceId, deviceType, action, parameters = {}) {
    const command = {
      id: deviceId,
      type: deviceType,
      action: action,
      parameters: parameters
    };
    
    return this.sendMessage({
      type: 'updateDeviceParameters',
      payload: [command]
    });
  }
  
  /**
   * 🎯 发送批量设备命令
   */
  sendBatchDeviceCommands(commands) {
    return this.sendMessage({
      type: 'updateDeviceParameters',
      payload: commands
    });
  }
  
  /**
   * 📊 更新设备状态到全局仓库
   */
  updateDeviceStatus(deviceData) {
    if (deviceData.id) {
      this.updateDeviceInStorage(deviceData);
    }
  }
  
  /**
   * 🔧 更新设备到存储
   */
  updateDeviceInStorage(deviceData) {
    if (this.globalDevices.value.has(deviceData.id)) {
      const existingDevice = this.globalDevices.value.get(deviceData.id);
      const updatedDevice = { ...existingDevice, ...deviceData };
      this.globalDevices.value.set(deviceData.id, updatedDevice);
    } else {
      this.globalDevices.value.set(deviceData.id, deviceData);
    }
    
    console.log(`🔧 TopControl设备 ${deviceData.id} 状态已更新`);
    
    // 触发设备更新回调
    this.triggerDeviceUpdateCallbacks();
  }
  
  /**
   * 📊 请求硬件状态
   */
  requestHardwareStatus() {
    return this.sendMessage({ type: 'getHardwareStatus' });
  }
  
  /**
   * 📊 请求设备列表
   */
  requestDevices() {
    return this.sendMessage({ type: 'getDevices' });
  }
  
  /**
   * 📊 请求设备信息
   */
  requestDeviceInfo(deviceId) {
    return this.sendMessage({
      type: 'getDeviceInfo',
      payload: { id: deviceId }
    });
  }
  
  /**
   * 🔌 连接WebSocket
   */
  connect() {
    this.isHardwareConnecting.value = true;
    return sharedConnectionManager.connect();
  }
  
  /**
   * 🔄 手动重连
   */
  manualReconnect() {
    this.isHardwareConnecting.value = true;
    return sharedConnectionManager.manualReconnect();
  }
  
  /**
   * 📝 添加消息处理器
   */
  addMessageHandler(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    this.messageHandlers.get(messageType).add(handler);
  }
  
  /**
   * 🔇 移除消息处理器
   */
  removeMessageHandler(messageType, handler) {
    if (this.messageHandlers.has(messageType)) {
      this.messageHandlers.get(messageType).delete(handler);
    }
  }
  
  /**
   * 📝 添加设备更新回调
   */
  addDeviceUpdateCallback(callback) {
    this.deviceUpdateCallbacks.add(callback);
  }
  
  /**
   * 🔇 移除设备更新回调
   */
  removeDeviceUpdateCallback(callback) {
    this.deviceUpdateCallbacks.delete(callback);
  }
  
  /**
   * 📢 触发设备更新回调
   */
  triggerDeviceUpdateCallbacks() {
    this.deviceUpdateCallbacks.forEach(callback => {
      try {
        callback(this.globalDevices.value);
      } catch (error) {
        console.error('设备更新回调错误:', error);
      }
    });
  }
  
  /**
   * 📊 获取连接信息
   */
  getConnectionInfo() {
    return {
      ...sharedConnectionManager.getConnectionInfo(),
      topControlSpecific: {
        hardwareConnected: this.isHardwareConnected.value,
        hardwareIP: this.hardwareIP.value,
        errorMessage: this.hardwareErrorMessage.value,
        deviceCount: this.globalDevices.value.size
      }
    };
  }
  
  /**
   * 🔌 断开连接
   */
  disconnect() {
    // 不直接断开共享连接，只清理TopControl相关的状态
    this.wsConnected.value = false;
    this.isHardwareConnected.value = false;
    this.messageHandlers.clear();
    this.deviceUpdateCallbacks.clear();
  }
  
  /**
   * 🚀 检查增强操作超时
   */
  checkEnhancedOperationTimeout(operationId) {
    const operation = this.operationTracker.get(operationId);
    if (!operation) return;
    
    const now = Date.now();
    const elapsed = now - operation.startTime;
    
    if (elapsed >= operation.timeout) {
      console.warn(`⚠️ TopControl操作超时: ${operation.action} (${elapsed}ms)`);
      
      // 记录错误
      this.recordEnhancedError({
        type: this.enhancedFeatures.errorHandling.errorCategories.DEVICE_TIMEOUT,
        deviceId: operation.deviceId,
        operation: operation.action,
        elapsed: elapsed,
        threshold: operation.timeout
      });
      
      // 尝试恢复
      this.attemptErrorRecovery('DEVICE_TIMEOUT', operation);
    }
  }
  
  /**
   * 🔧 尝试错误恢复
   */
  async attemptErrorRecovery(errorType, operation) {
    const strategy = this.enhancedFeatures.errorHandling.recoveryStrategies.get(errorType);
    if (!strategy) {
      console.error(`❌ 未找到错误恢复策略: ${errorType}`);
      return;
    }
    
    const retryCount = operation.retryCount || 0;
    
    try {
      await strategy.recover(operation, retryCount);
      console.log(`✅ 错误恢复成功: ${errorType}`);
    } catch (error) {
      console.error(`❌ 错误恢复失败: ${errorType}`, error);
      this.recordEnhancedError({
        type: 'RECOVERY_FAILED',
        originalError: errorType,
        recoveryError: error.message
      });
    }
  }
  
  /**
   * 🔄 重试设备操作
   */
  async retryDeviceOperation(deviceId, operation) {
    const device = this.globalDevices.value.get(deviceId);
    if (!device) {
      console.error(`❌ 设备不存在: ${deviceId}`);
      return false;
    }
    
    console.log(`🔄 重试设备操作: ${deviceId} - ${operation.action}`);
    
    return this.sendEnhancedDeviceCommand(
      deviceId,
      device.type,
      operation.action,
      operation.parameters
    );
  }
  
  /**
   * 🔄 重试参数更新
   */
  async retryParameterUpdate(deviceId, parameters) {
    const device = this.globalDevices.value.get(deviceId);
    if (!device) {
      console.error(`❌ 设备不存在: ${deviceId}`);
      return false;
    }
    
    console.log(`🔄 重试参数更新: ${deviceId}`);
    
    return this.sendMessage({
      type: 'updateDeviceParameters',
      payload: [{
        id: deviceId,
        type: device.type,
        action: 'update',
        parameters: parameters
      }]
    });
  }
  
  /**
   * 🔄 回滚到上一个已知状态
   */
  async rollbackToLastKnownState(deviceId) {
    const cachedState = this.enhancedFeatures.stateSync.deviceStateCache.get(deviceId);
    if (!cachedState) {
      console.error(`❌ 没有找到设备的缓存状态: ${deviceId}`);
      return false;
    }
    
    console.log(`🔄 回滚设备状态: ${deviceId}`);
    
    return this.sendMessage({
      type: 'updateDeviceParameters',
      payload: [{
        id: deviceId,
        type: cachedState.type,
        action: 'restore',
        parameters: cachedState.lastKnownState
      }]
    });
  }
  
  /**
   * 🆘 请求用户干预
   */
  async requestUserIntervention(error) {
    console.log(`🆘 请求用户干预: ${error.type}`);
    
    // 这里可以触发用户界面提示
    this.hardwareErrorMessage.value = `设备 ${error.deviceId} 需要用户干预: ${error.operation}`;
    
    return false;
  }
  
  /**
   * 🌐 切换到离线模式
   */
  async switchToOfflineMode() {
    console.log('🌐 切换到离线模式');
    
    this.isHardwareConnected.value = false;
    this.hardwareErrorMessage.value = '已切换到离线模式，部分功能不可用';
    
    return true;
  }
  
  /**
   * 🔄 执行状态同步
   */
  performStateSync() {
    const now = Date.now();
    const { deviceStateCache, staleThreshold } = this.enhancedFeatures.stateSync;
    
    // 检查过期的设备状态
    for (const [deviceId, cachedState] of deviceStateCache.entries()) {
      if (now - cachedState.lastUpdate > staleThreshold) {
        console.log(`🔄 刷新过期的设备状态: ${deviceId}`);
        this.requestDeviceInfo(deviceId);
      }
    }
    
    // 更新同步时间
    this.enhancedFeatures.stateSync.lastSyncTime = now;
  }
  
  /**
   * 🧹 清理过期操作
   */
  cleanupStaleOperations() {
    const now = Date.now();
    const maxAge = 300000; // 5分钟
    
    for (const [operationId, operation] of this.operationTracker.entries()) {
      if (now - operation.startTime > maxAge) {
        console.log(`🧹 清理过期操作: ${operationId}`);
        this.operationTracker.delete(operationId);
      }
    }
  }
  
  /**
   * 📊 生成TopControl性能报告
   */
  generateTopControlPerformanceReport() {
    const monitor = this.enhancedFeatures.performanceMonitor;
    const now = Date.now();
    
    const report = {
      timestamp: new Date().toISOString(),
      timeFrame: now - monitor.lastReportTime,
      operations: {
        total: monitor.deviceOperations,
        successful: monitor.successfulOperations,
        failed: monitor.failedOperations,
        successRate: monitor.deviceOperations > 0 
          ? ((monitor.successfulOperations / monitor.deviceOperations) * 100).toFixed(2) + '%'
          : '100%'
      },
      devices: {
        connected: this.globalDevices.value.size,
        cached: this.enhancedFeatures.stateSync.deviceStateCache.size,
        pending: this.enhancedFeatures.stateSync.pendingUpdates.size
      },
      errors: {
        total: this.enhancedFeatures.errorHandling.errorHistory.length,
        recent: this.enhancedFeatures.errorHandling.errorHistory.slice(-5)
      }
    };
    
    console.log('📊 TopControl性能报告:', report);
    
    // 重置监控计数器
    monitor.lastReportTime = now;
    
    return report;
  }
  
  /**
   * 📝 记录增强错误
   */
  recordEnhancedError(error) {
    const errorRecord = {
      ...error,
      timestamp: new Date().toISOString(),
      id: `tc_error_${Date.now()}`,
      source: 'TopControl'
    };
    
    this.enhancedFeatures.errorHandling.errorHistory.push(errorRecord);
    
    // 保持错误历史记录不超过最大大小
    if (this.enhancedFeatures.errorHandling.errorHistory.length > 
        this.enhancedFeatures.errorHandling.maxHistorySize) {
      this.enhancedFeatures.errorHandling.errorHistory.shift();
    }
    
    console.error('❌ TopControl增强错误记录:', errorRecord);
  }
  
  /**
   * 📊 处理性能报告事件
   */
  handlePerformanceReport(report) {
    console.log('📊 收到增强WebSocket性能报告:', report);
    
    // 可以在这里根据报告调整TopControl的行为
    if (report.connection.quality === 'poor') {
      console.warn('⚠️ 连接质量较差，调整超时设置');
      this.enhancedFeatures.timeoutConfig.deviceOperationTimeout = 20000; // 增加到20秒
    } else if (report.connection.quality === 'excellent') {
      this.enhancedFeatures.timeoutConfig.deviceOperationTimeout = 10000; // 恢复到10秒
    }
  }
  
  /**
   * 🔧 处理增强错误事件
   */
  handleEnhancedError(error) {
    console.error('❌ 收到增强WebSocket错误:', error);
    
    // 根据错误类型调整TopControl行为
    if (error.type === 'timeout') {
      this.recordEnhancedError({
        type: this.enhancedFeatures.errorHandling.errorCategories.CONNECTION_UNSTABLE,
        enhancedError: error
      });
    }
  }
  
  /**
   * 📊 获取增强状态信息
   */
  getEnhancedStatus() {
    return {
      basic: {
        connected: this.wsConnected.value,
        hardwareConnected: this.isHardwareConnected.value,
        deviceCount: this.globalDevices.value.size
      },
      performance: this.enhancedFeatures.performanceMonitor,
      operations: {
        active: this.operationTracker.size,
        pending: this.enhancedFeatures.stateSync.pendingUpdates.size
      },
      errors: {
        total: this.enhancedFeatures.errorHandling.errorHistory.length,
        recent: this.enhancedFeatures.errorHandling.errorHistory.slice(-3)
      },
      sync: {
        lastSyncTime: this.enhancedFeatures.stateSync.lastSyncTime,
        cachedDevices: this.enhancedFeatures.stateSync.deviceStateCache.size
      }
    };
  }
  
  /**
   * 🧹 清理资源
   */
  destroy() {
    // 清理增强功能定时器
    Object.values(this.timers).forEach(timer => {
      if (timer) clearInterval(timer);
    });
    
    // 清理操作追踪
    this.operationTracker.clear();
    this.enhancedFeatures.stateSync.deviceStateCache.clear();
    this.enhancedFeatures.stateSync.pendingUpdates.clear();
    
    // 移除事件监听
    sharedConnectionManager.off('connected', this.handleConnectionOpen);
    sharedConnectionManager.off('disconnected', this.handleConnectionClose);
    sharedConnectionManager.off('message', this.handleMessage);
    sharedConnectionManager.off('error', this.handleConnectionError);
    sharedConnectionManager.off('reconnecting', this.handleReconnecting);
    
    // 移除增强事件监听
    enhancedWebSocketManager.off('performanceReport', this.handlePerformanceReport);
    enhancedWebSocketManager.off('error', this.handleEnhancedError);
    
    this.disconnect();
    
    console.log('🧹 TopControl增强WebSocket管理器已清理');
  }
}

// 创建TopControl专用的WebSocket管理器实例
export const topControlWebSocketManager = new TopControlWebSocketManager();

export default topControlWebSocketManager; 