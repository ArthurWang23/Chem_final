/**
 * 🔄 状态同步优化器 - TopControl专用
 * 实现设备状态缓存机制、优化状态更新策略、添加状态一致性检查功能
 */
import { ref, reactive, computed } from 'vue';
import topControlWebSocketManager from './optimized-websocket.js';

export class StateSyncOptimizer {
  constructor() {
    // 状态缓存
    this.stateCache = reactive({
      devices: new Map(),              // 设备状态缓存
      operations: new Map(),           // 操作状态缓存
      metadata: new Map(),             // 元数据缓存
      snapshots: new Map(),            // 状态快照
      lastUpdate: 0                    // 最后更新时间
    });
    
    // 同步配置
    this.syncConfig = {
      batchSize: 10,                   // 批量更新大小
      maxRetries: 3,                   // 最大重试次数
      retryDelay: 1000,                // 重试延迟（毫秒）
      cacheExpiration: 30000,          // 缓存过期时间（30秒）
      consistencyCheckInterval: 15000, // 一致性检查间隔（15秒）
      syncInterval: 10000,             // 同步间隔（10秒）
      conflictResolution: 'server',    // 冲突解决策略：'server' | 'client' | 'merge'
      priorityLevels: {
        critical: 0,    // 关键设备（如安全设备）
        high: 1,        // 高优先级设备
        normal: 2,      // 普通设备
        low: 3          // 低优先级设备
      }
    };
    
    // 同步状态
    this.syncStatus = reactive({
      isActive: false,
      lastSync: 0,
      syncCount: 0,
      errorCount: 0,
      pendingOperations: 0,
      conflictCount: 0,
      cacheHitRate: 0,
      performanceMetrics: {
        averageSyncTime: 0,
        syncTimes: [],
        cacheSize: 0,
        memoryUsage: 0
      }
    });
    
    // 一致性检查
    this.consistencyChecker = {
      checks: new Map(),
      violations: [],
      lastCheck: 0,
      checkCount: 0,
      rules: [
        'device_state_integrity',
        'operation_consistency',
        'cache_coherence',
        'timestamp_validity'
      ]
    };
    
    // 冲突解决器
    this.conflictResolver = {
      conflicts: [],
      resolutionStrategies: new Map(),
      statistics: {
        totalConflicts: 0,
        resolvedConflicts: 0,
        pendingConflicts: 0
      }
    };
    
    // 批量操作队列
    this.batchQueue = {
      updates: [],
      deletions: [],
      validations: [],
      processing: false,
      maxSize: 100
    };
    
    // 性能优化器
    this.performanceOptimizer = {
      strategies: new Map(),
      metrics: new Map(),
      optimizations: []
    };
    
    // 定时器
    this.timers = {
      sync: null,
      consistency: null,
      cleanup: null,
      batch: null
    };
    
    this.init();
  }
  
  /**
   * 初始化状态同步优化器
   */
  init() {
    // 初始化冲突解决策略
    this.initConflictResolutionStrategies();
    
    // 初始化性能优化策略
    this.initPerformanceOptimizations();
    
    // 启动同步服务
    this.startSyncServices();
    
    // 监听设备更新事件
    this.listenToDeviceUpdates();
    
    console.log('🔄 状态同步优化器已初始化');
  }
  
  /**
   * 初始化冲突解决策略
   */
  initConflictResolutionStrategies() {
    const strategies = this.conflictResolver.resolutionStrategies;
    
    // 服务器优先策略
    strategies.set('server', {
      name: '服务器优先',
      resolve: (localState, serverState) => {
        console.log('🔄 使用服务器优先策略解决冲突');
        return {
          resolved: serverState,
          reason: 'server_priority',
          timestamp: Date.now()
        };
      }
    });
    
    // 客户端优先策略
    strategies.set('client', {
      name: '客户端优先',
      resolve: (localState, serverState) => {
        console.log('🔄 使用客户端优先策略解决冲突');
        return {
          resolved: localState,
          reason: 'client_priority',
          timestamp: Date.now()
        };
      }
    });
    
    // 合并策略
    strategies.set('merge', {
      name: '智能合并',
      resolve: (localState, serverState) => {
        console.log('🔄 使用智能合并策略解决冲突');
        return {
          resolved: this.mergeStates(localState, serverState),
          reason: 'intelligent_merge',
          timestamp: Date.now()
        };
      }
    });
    
    // 时间戳优先策略
    strategies.set('timestamp', {
      name: '时间戳优先',
      resolve: (localState, serverState) => {
        console.log('🔄 使用时间戳优先策略解决冲突');
        const localTime = localState.timestamp || 0;
        const serverTime = serverState.timestamp || 0;
        
        return {
          resolved: serverTime > localTime ? serverState : localState,
          reason: 'timestamp_priority',
          timestamp: Date.now()
        };
      }
    });
  }
  
  /**
   * 初始化性能优化策略
   */
  initPerformanceOptimizations() {
    const strategies = this.performanceOptimizer.strategies;
    
    // 预加载策略
    strategies.set('preload', {
      name: '预加载优化',
      execute: () => {
        console.log('🚀 执行预加载优化');
        this.preloadCriticalDevices();
      }
    });
    
    // 缓存压缩策略
    strategies.set('compression', {
      name: '缓存压缩',
      execute: () => {
        console.log('🗜️ 执行缓存压缩');
        this.compressCache();
      }
    });
    
    // 延迟加载策略
    strategies.set('lazy_load', {
      name: '延迟加载',
      execute: () => {
        console.log('⏳ 执行延迟加载优化');
        this.optimizeLazyLoading();
      }
    });
    
    // 批量处理策略
    strategies.set('batch_processing', {
      name: '批量处理',
      execute: () => {
        console.log('📦 执行批量处理优化');
        this.processBatchOperations();
      }
    });
  }
  
  /**
   * 启动同步服务
   */
  startSyncServices() {
    // 主同步定时器
    this.timers.sync = setInterval(() => {
      this.performSync();
    }, this.syncConfig.syncInterval);
    
    // 一致性检查定时器
    this.timers.consistency = setInterval(() => {
      this.performConsistencyCheck();
    }, this.syncConfig.consistencyCheckInterval);
    
    // 清理定时器
    this.timers.cleanup = setInterval(() => {
      this.performCleanup();
    }, 60000); // 每分钟清理一次
    
    // 批量处理定时器
    this.timers.batch = setInterval(() => {
      this.processBatchQueue();
    }, 5000); // 每5秒处理一次批量操作
    
    this.syncStatus.isActive = true;
    console.log('🔄 同步服务已启动');
  }
  
  /**
   * 监听设备更新事件
   */
  listenToDeviceUpdates() {
    // 添加设备更新回调
    topControlWebSocketManager.addDeviceUpdateCallback((devices) => {
      this.handleDeviceUpdates(devices);
    });
    
    // 监听消息处理器
    topControlWebSocketManager.addMessageHandler('deviceStatus', (data) => {
      this.handleDeviceStatusUpdate(data);
    });
    
    topControlWebSocketManager.addMessageHandler('parameterUpdateResults', (data) => {
      this.handleParameterUpdateResults(data);
    });
  }
  
  /**
   * 处理设备更新
   */
  handleDeviceUpdates(devices) {
    const updateStart = Date.now();
    
    devices.forEach((device, deviceId) => {
      this.updateDeviceCache(deviceId, device);
    });
    
    // 更新性能指标
    const updateTime = Date.now() - updateStart;
    this.updatePerformanceMetrics('device_update', updateTime);
    
    console.log(`🔄 处理设备更新: ${devices.size}个设备, 用时${updateTime}ms`);
  }
  
  /**
   * 更新设备缓存
   */
  updateDeviceCache(deviceId, deviceData) {
    const now = Date.now();
    const existingData = this.stateCache.devices.get(deviceId);
    
    // 检查是否有冲突
    if (existingData && this.hasConflict(existingData, deviceData)) {
      this.handleConflict(deviceId, existingData, deviceData);
      return;
    }
    
    // 更新缓存
    const cacheEntry = {
      ...deviceData,
      timestamp: now,
      lastUpdate: now,
      version: existingData ? existingData.version + 1 : 1,
      checksum: this.calculateChecksum(deviceData)
    };
    
    this.stateCache.devices.set(deviceId, cacheEntry);
    this.stateCache.lastUpdate = now;
    
    // 更新元数据
    this.updateMetadata(deviceId, {
      lastUpdate: now,
      updateCount: (existingData?.updateCount || 0) + 1,
      size: JSON.stringify(deviceData).length
    });
    
    // 检查是否需要创建快照
    if (this.shouldCreateSnapshot(deviceId, cacheEntry)) {
      this.createSnapshot(deviceId, cacheEntry);
    }
  }
  
  /**
   * 检查是否有冲突
   */
  hasConflict(existingData, newData) {
    // 简单的冲突检测：检查时间戳和版本
    const timeConflict = existingData.timestamp > newData.timestamp;
    const versionConflict = existingData.version > (newData.version || 0);
    const checksumConflict = existingData.checksum !== this.calculateChecksum(newData);
    
    return timeConflict || versionConflict || checksumConflict;
  }
  
  /**
   * 处理冲突
   */
  handleConflict(deviceId, localState, serverState) {
    console.warn(`⚠️ 检测到状态冲突: ${deviceId}`);
    
    const conflict = {
      deviceId,
      localState,
      serverState,
      timestamp: Date.now(),
      type: 'state_conflict',
      resolved: false
    };
    
    // 记录冲突
    this.conflictResolver.conflicts.push(conflict);
    this.conflictResolver.statistics.totalConflicts++;
    this.syncStatus.conflictCount++;
    
    // 尝试解决冲突
    this.resolveConflict(conflict);
  }
  
  /**
   * 解决冲突
   */
  resolveConflict(conflict) {
    const strategy = this.conflictResolver.resolutionStrategies.get(this.syncConfig.conflictResolution);
    
    if (!strategy) {
      console.error('❌ 未找到冲突解决策略:', this.syncConfig.conflictResolution);
      return;
    }
    
    try {
      const resolution = strategy.resolve(conflict.localState, conflict.serverState);
      
      // 应用解决结果
      this.applyConflictResolution(conflict.deviceId, resolution);
      
      // 标记冲突已解决
      conflict.resolved = true;
      conflict.resolution = resolution;
      
      this.conflictResolver.statistics.resolvedConflicts++;
      
      console.log(`✅ 冲突已解决: ${conflict.deviceId} - ${resolution.reason}`);
      
    } catch (error) {
      console.error('❌ 冲突解决失败:', error);
      this.conflictResolver.statistics.pendingConflicts++;
    }
  }
  
  /**
   * 应用冲突解决结果
   */
  applyConflictResolution(deviceId, resolution) {
    const now = Date.now();
    
    // 更新缓存
    const cacheEntry = {
      ...resolution.resolved,
      timestamp: now,
      lastUpdate: now,
      conflictResolved: true,
      resolutionReason: resolution.reason
    };
    
    this.stateCache.devices.set(deviceId, cacheEntry);
    
    // 创建冲突解决快照
    this.createSnapshot(deviceId, cacheEntry, 'conflict_resolution');
  }
  
  /**
   * 合并状态
   */
  mergeStates(localState, serverState) {
    const merged = { ...localState };
    
    // 智能合并逻辑
    Object.keys(serverState).forEach(key => {
      if (key === 'timestamp') {
        merged[key] = Math.max(localState[key] || 0, serverState[key] || 0);
      } else if (key === 'version') {
        merged[key] = Math.max(localState[key] || 0, serverState[key] || 0);
      } else if (serverState[key] !== undefined) {
        // 服务器数据优先，除非本地数据更新
        const localTime = localState.timestamp || 0;
        const serverTime = serverState.timestamp || 0;
        
        if (serverTime >= localTime) {
          merged[key] = serverState[key];
        }
      }
    });
    
    return merged;
  }
  
  /**
   * 执行同步
   */
  async performSync() {
    if (!this.syncStatus.isActive) return;
    
    const syncStart = Date.now();
    
    try {
      // 获取待同步的设备
      const devicesToSync = this.getDevicesToSync();
      
      if (devicesToSync.length === 0) {
        console.log('🔄 没有需要同步的设备');
        return;
      }
      
      // 批量同步
      await this.batchSync(devicesToSync);
      
      // 更新同步状态
      this.syncStatus.lastSync = Date.now();
      this.syncStatus.syncCount++;
      
      const syncTime = Date.now() - syncStart;
      this.updatePerformanceMetrics('sync', syncTime);
      
      console.log(`🔄 同步完成: ${devicesToSync.length}个设备, 用时${syncTime}ms`);
      
    } catch (error) {
      console.error('❌ 同步失败:', error);
      this.syncStatus.errorCount++;
    }
  }
  
  /**
   * 获取待同步的设备
   */
  getDevicesToSync() {
    const now = Date.now();
    const devicesToSync = [];
    
    this.stateCache.devices.forEach((device, deviceId) => {
      // 检查是否需要同步
      if (this.needsSync(device, now)) {
        devicesToSync.push({
          deviceId,
          device,
          priority: this.getDevicePriority(deviceId),
          age: now - device.lastUpdate
        });
      }
    });
    
    // 按优先级和年龄排序
    devicesToSync.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // 优先级低的数字优先
      }
      return b.age - a.age; // 年龄大的优先
    });
    
    return devicesToSync;
  }
  
  /**
   * 检查是否需要同步
   */
  needsSync(device, now) {
    const age = now - device.lastUpdate;
    const expired = age > this.syncConfig.cacheExpiration;
    const dirty = device.dirty === true;
    const conflicted = device.conflictResolved === true;
    
    return expired || dirty || conflicted;
  }
  
  /**
   * 获取设备优先级
   */
  getDevicePriority(deviceId) {
    // 根据设备类型或ID确定优先级
    const device = this.stateCache.devices.get(deviceId);
    if (!device) return this.syncConfig.priorityLevels.normal;
    
    // 安全设备优先级最高
    if (device.type === 'safety' || device.critical === true) {
      return this.syncConfig.priorityLevels.critical;
    }
    
    // 控制设备高优先级
    if (device.type === 'controller' || device.type === 'valve') {
      return this.syncConfig.priorityLevels.high;
    }
    
    // 传感器设备普通优先级
    if (device.type === 'sensor') {
      return this.syncConfig.priorityLevels.normal;
    }
    
    return this.syncConfig.priorityLevels.low;
  }
  
  /**
   * 批量同步
   */
  async batchSync(devicesToSync) {
    const batches = this.createBatches(devicesToSync, this.syncConfig.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(batch);
    }
  }
  
  /**
   * 创建批次
   */
  createBatches(items, batchSize) {
    const batches = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }
  
  /**
   * 处理批次
   */
  async processBatch(batch) {
    const deviceIds = batch.map(item => item.deviceId);
    
    try {
      // 请求设备状态更新
      await topControlWebSocketManager.sendMessage({
        type: 'batchGetDeviceInfo',
        payload: { deviceIds }
      });
      
      console.log(`📦 批量同步请求已发送: ${deviceIds.join(', ')}`);
      
    } catch (error) {
      console.error('❌ 批量同步失败:', error);
      
      // 单个重试
      for (const item of batch) {
        await this.retrySingleDevice(item);
      }
    }
  }
  
  /**
   * 重试单个设备
   */
  async retrySingleDevice(item) {
    let retryCount = 0;
    
    while (retryCount < this.syncConfig.maxRetries) {
      try {
        await topControlWebSocketManager.requestDeviceInfo(item.deviceId);
        console.log(`✅ 设备同步重试成功: ${item.deviceId}`);
        break;
      } catch (error) {
        retryCount++;
        console.warn(`⚠️ 设备同步重试失败 (${retryCount}/${this.syncConfig.maxRetries}): ${item.deviceId}`);
        
        if (retryCount < this.syncConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.syncConfig.retryDelay));
        }
      }
    }
  }
  
  /**
   * 执行一致性检查
   */
  performConsistencyCheck() {
    const checkStart = Date.now();
    
    console.log('🔍 开始一致性检查');
    
    // 执行各种一致性检查
    this.checkDeviceStateIntegrity();
    this.checkOperationConsistency();
    this.checkCacheCoherence();
    this.checkTimestampValidity();
    
    // 更新检查状态
    this.consistencyChecker.lastCheck = Date.now();
    this.consistencyChecker.checkCount++;
    
    const checkTime = Date.now() - checkStart;
    this.updatePerformanceMetrics('consistency_check', checkTime);
    
    console.log(`🔍 一致性检查完成, 用时${checkTime}ms`);
  }
  
  /**
   * 检查设备状态完整性
   */
  checkDeviceStateIntegrity() {
    const violations = [];
    
    this.stateCache.devices.forEach((device, deviceId) => {
      // 检查必要字段
      if (!device.id || !device.type || !device.status) {
        violations.push({
          type: 'missing_required_fields',
          deviceId,
          message: '缺少必要字段',
          severity: 'error'
        });
      }
      
      // 检查时间戳
      if (!device.timestamp || device.timestamp > Date.now()) {
        violations.push({
          type: 'invalid_timestamp',
          deviceId,
          message: '时间戳无效',
          severity: 'warning'
        });
      }
      
      // 检查校验和
      const expectedChecksum = this.calculateChecksum(device);
      if (device.checksum !== expectedChecksum) {
        violations.push({
          type: 'checksum_mismatch',
          deviceId,
          message: '校验和不匹配',
          severity: 'error'
        });
      }
    });
    
    if (violations.length > 0) {
      console.warn(`⚠️ 设备状态完整性检查发现 ${violations.length} 个问题`);
      this.consistencyChecker.violations.push(...violations);
    }
  }
  
  /**
   * 检查操作一致性
   */
  checkOperationConsistency() {
    // 检查待处理操作是否过期
    const now = Date.now();
    const expiredOperations = [];
    
    this.stateCache.operations.forEach((operation, operationId) => {
      const age = now - operation.timestamp;
      if (age > 300000) { // 5分钟
        expiredOperations.push(operationId);
      }
    });
    
    if (expiredOperations.length > 0) {
      console.warn(`⚠️ 发现 ${expiredOperations.length} 个过期操作`);
      expiredOperations.forEach(id => this.stateCache.operations.delete(id));
    }
  }
  
  /**
   * 检查缓存一致性
   */
  checkCacheCoherence() {
    const cacheSize = this.stateCache.devices.size;
    const metadataSize = this.stateCache.metadata.size;
    
    if (cacheSize !== metadataSize) {
      console.warn(`⚠️ 缓存一致性问题: 设备缓存(${cacheSize}) != 元数据(${metadataSize})`);
      
      // 修复不一致
      this.repairCacheCoherence();
    }
  }
  
  /**
   * 检查时间戳有效性
   */
  checkTimestampValidity() {
    const now = Date.now();
    const futureThreshold = now + 300000; // 5分钟后
    const pastThreshold = now - 86400000; // 1天前
    
    this.stateCache.devices.forEach((device, deviceId) => {
      if (device.timestamp > futureThreshold) {
        console.warn(`⚠️ 设备时间戳过于未来: ${deviceId}`);
      }
      
      if (device.timestamp < pastThreshold) {
        console.warn(`⚠️ 设备时间戳过于过去: ${deviceId}`);
      }
    });
  }
  
  /**
   * 修复缓存一致性
   */
  repairCacheCoherence() {
    console.log('🔧 修复缓存一致性');
    
    // 确保每个设备都有对应的元数据
    this.stateCache.devices.forEach((device, deviceId) => {
      if (!this.stateCache.metadata.has(deviceId)) {
        this.updateMetadata(deviceId, {
          created: Date.now(),
          lastUpdate: device.timestamp || Date.now(),
          updateCount: 1,
          size: JSON.stringify(device).length
        });
      }
    });
    
    // 清理没有对应设备的元数据
    this.stateCache.metadata.forEach((metadata, deviceId) => {
      if (!this.stateCache.devices.has(deviceId)) {
        this.stateCache.metadata.delete(deviceId);
      }
    });
  }
  
  /**
   * 执行清理
   */
  performCleanup() {
    const cleanupStart = Date.now();
    
    console.log('🧹 开始清理过期数据');
    
    // 清理过期设备缓存
    this.cleanupExpiredDevices();
    
    // 清理过期操作
    this.cleanupExpiredOperations();
    
    // 清理过期快照
    this.cleanupExpiredSnapshots();
    
    // 清理已解决的冲突
    this.cleanupResolvedConflicts();
    
    // 优化内存使用
    this.optimizeMemoryUsage();
    
    const cleanupTime = Date.now() - cleanupStart;
    this.updatePerformanceMetrics('cleanup', cleanupTime);
    
    console.log(`🧹 清理完成, 用时${cleanupTime}ms`);
  }
  
  /**
   * 清理过期设备缓存
   */
  cleanupExpiredDevices() {
    const now = Date.now();
    const expiredDevices = [];
    
    this.stateCache.devices.forEach((device, deviceId) => {
      const age = now - device.lastUpdate;
      if (age > this.syncConfig.cacheExpiration * 3) { // 3倍过期时间
        expiredDevices.push(deviceId);
      }
    });
    
    expiredDevices.forEach(deviceId => {
      this.stateCache.devices.delete(deviceId);
      this.stateCache.metadata.delete(deviceId);
    });
    
    if (expiredDevices.length > 0) {
      console.log(`🧹 清理了 ${expiredDevices.length} 个过期设备缓存`);
    }
  }
  
  /**
   * 清理过期操作
   */
  cleanupExpiredOperations() {
    const now = Date.now();
    const expiredOperations = [];
    
    this.stateCache.operations.forEach((operation, operationId) => {
      const age = now - operation.timestamp;
      if (age > 600000) { // 10分钟
        expiredOperations.push(operationId);
      }
    });
    
    expiredOperations.forEach(id => this.stateCache.operations.delete(id));
    
    if (expiredOperations.length > 0) {
      console.log(`🧹 清理了 ${expiredOperations.length} 个过期操作`);
    }
  }
  
  /**
   * 清理过期快照
   */
  cleanupExpiredSnapshots() {
    const now = Date.now();
    const expiredSnapshots = [];
    
    this.stateCache.snapshots.forEach((snapshot, snapshotId) => {
      const age = now - snapshot.timestamp;
      if (age > 3600000) { // 1小时
        expiredSnapshots.push(snapshotId);
      }
    });
    
    expiredSnapshots.forEach(id => this.stateCache.snapshots.delete(id));
    
    if (expiredSnapshots.length > 0) {
      console.log(`🧹 清理了 ${expiredSnapshots.length} 个过期快照`);
    }
  }
  
  /**
   * 清理已解决的冲突
   */
  cleanupResolvedConflicts() {
    const resolvedConflicts = this.conflictResolver.conflicts.filter(conflict => 
      conflict.resolved && Date.now() - conflict.timestamp > 3600000 // 1小时
    );
    
    this.conflictResolver.conflicts = this.conflictResolver.conflicts.filter(conflict => 
      !conflict.resolved || Date.now() - conflict.timestamp <= 3600000
    );
    
    if (resolvedConflicts.length > 0) {
      console.log(`🧹 清理了 ${resolvedConflicts.length} 个已解决的冲突`);
    }
  }
  
  /**
   * 优化内存使用
   */
  optimizeMemoryUsage() {
    // 计算内存使用情况
    const memoryUsage = {
      devices: this.calculateMemoryUsage(this.stateCache.devices),
      operations: this.calculateMemoryUsage(this.stateCache.operations),
      metadata: this.calculateMemoryUsage(this.stateCache.metadata),
      snapshots: this.calculateMemoryUsage(this.stateCache.snapshots)
    };
    
    const totalMemory = Object.values(memoryUsage).reduce((sum, usage) => sum + usage, 0);
    
    // 更新性能指标
    this.syncStatus.performanceMetrics.memoryUsage = totalMemory;
    this.syncStatus.performanceMetrics.cacheSize = this.stateCache.devices.size;
    
    console.log(`💾 内存使用情况: ${(totalMemory / 1024 / 1024).toFixed(2)}MB`);
  }
  
  /**
   * 计算内存使用
   */
  calculateMemoryUsage(mapOrObject) {
    return JSON.stringify(Array.from(mapOrObject)).length;
  }
  
  /**
   * 处理批量队列
   */
  processBatchQueue() {
    if (this.batchQueue.processing) return;
    
    this.batchQueue.processing = true;
    
    try {
      // 处理更新队列
      if (this.batchQueue.updates.length > 0) {
        this.processBatchUpdates();
      }
      
      // 处理删除队列
      if (this.batchQueue.deletions.length > 0) {
        this.processBatchDeletions();
      }
      
      // 处理验证队列
      if (this.batchQueue.validations.length > 0) {
        this.processBatchValidations();
      }
      
    } finally {
      this.batchQueue.processing = false;
    }
  }
  
  /**
   * 处理批量更新
   */
  processBatchUpdates() {
    const updates = this.batchQueue.updates.splice(0, this.syncConfig.batchSize);
    
    updates.forEach(update => {
      this.updateDeviceCache(update.deviceId, update.data);
    });
    
    console.log(`📦 处理了 ${updates.length} 个批量更新`);
  }
  
  /**
   * 处理批量删除
   */
  processBatchDeletions() {
    const deletions = this.batchQueue.deletions.splice(0, this.syncConfig.batchSize);
    
    deletions.forEach(deletion => {
      this.stateCache.devices.delete(deletion.deviceId);
      this.stateCache.metadata.delete(deletion.deviceId);
    });
    
    console.log(`📦 处理了 ${deletions.length} 个批量删除`);
  }
  
  /**
   * 处理批量验证
   */
  processBatchValidations() {
    const validations = this.batchQueue.validations.splice(0, this.syncConfig.batchSize);
    
    validations.forEach(validation => {
      this.validateDeviceState(validation.deviceId);
    });
    
    console.log(`📦 处理了 ${validations.length} 个批量验证`);
  }
  
  /**
   * 验证设备状态
   */
  validateDeviceState(deviceId) {
    const device = this.stateCache.devices.get(deviceId);
    if (!device) return;
    
    const checksum = this.calculateChecksum(device);
    if (device.checksum !== checksum) {
      console.warn(`⚠️ 设备状态验证失败: ${deviceId}`);
      
      // 请求重新同步
      this.requestDeviceResync(deviceId);
    }
  }
  
  /**
   * 请求设备重新同步
   */
  requestDeviceResync(deviceId) {
    console.log(`🔄 请求设备重新同步: ${deviceId}`);
    
    // 标记为需要同步
    const device = this.stateCache.devices.get(deviceId);
    if (device) {
      device.dirty = true;
      device.needsResync = true;
    }
  }
  
  /**
   * 计算校验和
   */
  calculateChecksum(data) {
    // 简单的校验和计算（实际应用中应使用更复杂的算法）
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return hash;
  }
  
  /**
   * 更新元数据
   */
  updateMetadata(deviceId, metadata) {
    const existing = this.stateCache.metadata.get(deviceId) || {};
    
    this.stateCache.metadata.set(deviceId, {
      ...existing,
      ...metadata,
      lastMetadataUpdate: Date.now()
    });
  }
  
  /**
   * 检查是否需要创建快照
   */
  shouldCreateSnapshot(deviceId, device) {
    const metadata = this.stateCache.metadata.get(deviceId);
    if (!metadata) return true;
    
    // 每10次更新或每小时创建一次快照
    const updateThreshold = 10;
    const timeThreshold = 3600000; // 1小时
    
    const updatesSinceSnapshot = metadata.updateCount % updateThreshold === 0;
    const timeSinceSnapshot = Date.now() - (metadata.lastSnapshot || 0) > timeThreshold;
    
    return updatesSinceSnapshot || timeSinceSnapshot;
  }
  
  /**
   * 创建快照
   */
  createSnapshot(deviceId, device, type = 'regular') {
    const snapshotId = `${deviceId}_${type}_${Date.now()}`;
    
    const snapshot = {
      id: snapshotId,
      deviceId,
      type,
      data: JSON.parse(JSON.stringify(device)), // 深拷贝
      timestamp: Date.now(),
      version: device.version || 1
    };
    
    this.stateCache.snapshots.set(snapshotId, snapshot);
    
    // 更新元数据
    this.updateMetadata(deviceId, {
      lastSnapshot: Date.now(),
      snapshotCount: (this.stateCache.metadata.get(deviceId)?.snapshotCount || 0) + 1
    });
    
    console.log(`📸 创建快照: ${snapshotId}`);
  }
  
  /**
   * 更新性能指标
   */
  updatePerformanceMetrics(operation, time) {
    const metrics = this.syncStatus.performanceMetrics;
    
    // 更新同步时间
    if (operation === 'sync') {
      metrics.syncTimes.push(time);
      
      // 保持最近100次记录
      if (metrics.syncTimes.length > 100) {
        metrics.syncTimes.shift();
      }
      
      // 计算平均时间
      metrics.averageSyncTime = metrics.syncTimes.reduce((sum, t) => sum + t, 0) / metrics.syncTimes.length;
    }
    
    // 更新缓存命中率
    this.updateCacheHitRate();
  }
  
  /**
   * 更新缓存命中率
   */
  updateCacheHitRate() {
    const totalRequests = this.syncStatus.syncCount;
    const cacheHits = this.stateCache.devices.size;
    
    if (totalRequests > 0) {
      this.syncStatus.cacheHitRate = (cacheHits / totalRequests) * 100;
    }
  }
  
  /**
   * 获取状态同步信息
   */
  getSyncStatus() {
    return {
      ...this.syncStatus,
      cache: {
        devices: this.stateCache.devices.size,
        operations: this.stateCache.operations.size,
        metadata: this.stateCache.metadata.size,
        snapshots: this.stateCache.snapshots.size
      },
      consistency: {
        violations: this.consistencyChecker.violations.length,
        lastCheck: this.consistencyChecker.lastCheck,
        checkCount: this.consistencyChecker.checkCount
      },
      conflicts: {
        total: this.conflictResolver.statistics.totalConflicts,
        resolved: this.conflictResolver.statistics.resolvedConflicts,
        pending: this.conflictResolver.statistics.pendingConflicts
      }
    };
  }
  
  /**
   * 清理资源
   */
  destroy() {
    // 清理定时器
    Object.values(this.timers).forEach(timer => {
      if (timer) clearInterval(timer);
    });
    
    // 清理缓存
    this.stateCache.devices.clear();
    this.stateCache.operations.clear();
    this.stateCache.metadata.clear();
    this.stateCache.snapshots.clear();
    
    // 清理冲突
    this.conflictResolver.conflicts = [];
    
    // 清理批量队列
    this.batchQueue.updates = [];
    this.batchQueue.deletions = [];
    this.batchQueue.validations = [];
    
    this.syncStatus.isActive = false;
    
    console.log('🧹 状态同步优化器已清理');
  }
}

// 创建状态同步优化器实例
export const stateSyncOptimizer = new StateSyncOptimizer();
export default stateSyncOptimizer; 