/**
 * 🚀 增强状态监控器 - TopControl专用
 * 提供连接质量监控、性能监控和状态同步优化的可视化界面
 */
import { ref, reactive, computed } from 'vue';
import topControlWebSocketManager from './optimized-websocket.js';
import enhancedWebSocketManager from '@/utils/enhanced-websocket-manager.js';

export class EnhancedStatusMonitor {
  constructor() {
    // 监控数据
    this.monitoringData = reactive({
      // 连接质量监控
      connectionQuality: {
        score: 100,
        status: 'excellent',
        responseTime: 0,
        stability: 100,
        lastUpdate: Date.now(),
        history: []
      },
      
      // 性能监控
      performance: {
        operations: {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 100
        },
        throughput: {
          messagesPerMinute: 0,
          bytesPerSecond: 0,
          peakThroughput: 0
        },
        latency: {
          min: Infinity,
          max: 0,
          avg: 0,
          current: 0
        },
        errors: {
          total: 0,
          byType: new Map(),
          recentErrors: []
        }
      },
      
      // 状态同步监控
      stateSync: {
        devices: {
          total: 0,
          synced: 0,
          outdated: 0,
          failed: 0
        },
        operations: {
          pending: 0,
          queued: 0,
          processing: 0
        },
        consistency: {
          score: 100,
          issues: [],
          lastCheck: Date.now()
        }
      },
      
      // 系统健康度
      systemHealth: {
        overall: 100,
        components: {
          connection: 100,
          performance: 100,
          sync: 100,
          stability: 100
        },
        alerts: [],
        recommendations: []
      }
    });
    
    // 监控配置
    this.monitoringConfig = {
      updateInterval: 5000,       // 5秒更新间隔
      historySize: 100,           // 保持100个历史记录
      alertThresholds: {
        connectionQuality: 70,    // 连接质量警告阈值
        performanceScore: 80,     // 性能评分警告阈值
        errorRate: 5,            // 错误率警告阈值（%）
        responseTime: 2000       // 响应时间警告阈值（ms）
      }
    };
    
    // 计算属性
    this.computedMetrics = {
      // 连接质量等级
      connectionQualityLevel: computed(() => {
        const score = this.monitoringData.connectionQuality.score;
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'fair';
        return 'poor';
      }),
      
      // 性能等级
      performanceLevel: computed(() => {
        const rate = this.monitoringData.performance.operations.successRate;
        if (rate >= 95) return 'excellent';
        if (rate >= 85) return 'good';
        if (rate >= 70) return 'fair';
        return 'poor';
      }),
      
      // 状态同步健康度
      syncHealthLevel: computed(() => {
        const score = this.monitoringData.stateSync.consistency.score;
        if (score >= 95) return 'excellent';
        if (score >= 85) return 'good';
        if (score >= 70) return 'fair';
        return 'poor';
      })
    };
    
    // 定时器
    this.timers = {
      monitoring: null,
      dataCollection: null,
      alertCheck: null
    };
    
    this.init();
  }
  
  /**
   * 初始化监控器
   */
  init() {
    // 启动监控定时器
    this.startMonitoring();
    
    // 监听增强WebSocket管理器事件
    enhancedWebSocketManager.on('performanceReport', this.handlePerformanceReport.bind(this));
    enhancedWebSocketManager.on('error', this.handleEnhancedError.bind(this));
    
    console.log('🚀 增强状态监控器已初始化');
  }
  
  /**
   * 启动监控
   */
  startMonitoring() {
    // 主监控循环
    this.timers.monitoring = setInterval(() => {
      this.collectMonitoringData();
      this.updateMetrics();
      this.checkAlerts();
    }, this.monitoringConfig.updateInterval);
    
    // 数据收集
    this.timers.dataCollection = setInterval(() => {
      this.collectPerformanceData();
      this.updateConnectionQuality();
      this.checkStateSync();
    }, 2000); // 每2秒收集一次
    
    // 警告检查
    this.timers.alertCheck = setInterval(() => {
      this.performHealthCheck();
      this.generateRecommendations();
    }, 10000); // 每10秒检查一次
    
    console.log('📊 监控服务已启动');
  }
  
  /**
   * 收集监控数据
   */
  collectMonitoringData() {
    const enhancedStatus = enhancedWebSocketManager.getSystemStatus();
    const topControlStatus = topControlWebSocketManager.getEnhancedStatus();
    
    // 更新连接质量
    this.updateConnectionQualityData(enhancedStatus);
    
    // 更新性能数据
    this.updatePerformanceData(topControlStatus);
    
    // 更新状态同步数据
    this.updateStateSyncData(topControlStatus);
  }
  
  /**
   * 更新连接质量数据
   */
  updateConnectionQualityData(enhancedStatus) {
    const connection = enhancedStatus.connection;
    const quality = enhancedStatus.quality;
    
    // 计算连接质量评分
    let score = 100;
    
    // 基于响应时间评分
    if (quality.responseTime > 2000) score -= 30;
    else if (quality.responseTime > 1000) score -= 20;
    else if (quality.responseTime > 500) score -= 10;
    
    // 基于稳定性评分
    score = Math.min(score, quality.stabilityScore);
    
    // 基于丢包率评分
    if (quality.packetLoss > 5) score -= 20;
    else if (quality.packetLoss > 2) score -= 10;
    
    // 更新数据
    this.monitoringData.connectionQuality = {
      score: Math.max(0, score),
      status: this.evaluateConnectionStatus(score),
      responseTime: quality.responseTime,
      stability: quality.stabilityScore,
      lastUpdate: Date.now(),
      history: this.updateHistory(
        this.monitoringData.connectionQuality.history,
        { score, timestamp: Date.now() }
      )
    };
  }
  
  /**
   * 更新性能数据
   */
  updatePerformanceData(topControlStatus) {
    const performance = topControlStatus.performance;
    
    // 计算成功率
    const total = performance.deviceOperations;
    const successful = performance.successfulOperations;
    const failed = performance.failedOperations;
    const successRate = total > 0 ? (successful / total) * 100 : 100;
    
    // 更新性能数据
    this.monitoringData.performance = {
      operations: {
        total,
        successful,
        failed,
        successRate: Math.round(successRate * 100) / 100
      },
      throughput: {
        messagesPerMinute: this.calculateThroughput(total),
        bytesPerSecond: 0, // 可以根据需要计算
        peakThroughput: Math.max(this.monitoringData.performance.throughput.peakThroughput, total)
      },
      latency: {
        min: Math.min(this.monitoringData.performance.latency.min, performance.averageResponseTime),
        max: Math.max(this.monitoringData.performance.latency.max, performance.averageResponseTime),
        avg: performance.averageResponseTime,
        current: performance.averageResponseTime
      },
      errors: {
        total: topControlStatus.errors.total,
        byType: this.categorizeErrors(topControlStatus.errors.recent),
        recentErrors: topControlStatus.errors.recent.slice(-10)
      }
    };
  }
  
  /**
   * 更新状态同步数据
   */
  updateStateSyncData(topControlStatus) {
    const sync = topControlStatus.sync;
    const operations = topControlStatus.operations;
    
    // 计算同步一致性评分
    const consistencyScore = this.calculateConsistencyScore(sync, operations);
    
    this.monitoringData.stateSync = {
      devices: {
        total: topControlStatus.basic.deviceCount,
        synced: sync.cachedDevices,
        outdated: Math.max(0, topControlStatus.basic.deviceCount - sync.cachedDevices),
        failed: 0 // 可以根据需要计算
      },
      operations: {
        pending: operations.pending,
        queued: operations.active,
        processing: 0 // 可以根据需要计算
      },
      consistency: {
        score: consistencyScore,
        issues: this.detectConsistencyIssues(sync, operations),
        lastCheck: Date.now()
      }
    };
  }
  
  /**
   * 计算吞吐量
   */
  calculateThroughput(totalOperations) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // 这里应该基于时间窗口计算，简化实现
    return Math.round(totalOperations / 60); // 假设平均分布
  }
  
  /**
   * 分类错误
   */
  categorizeErrors(errors) {
    const categories = new Map();
    
    errors.forEach(error => {
      const type = error.type || 'unknown';
      categories.set(type, (categories.get(type) || 0) + 1);
    });
    
    return categories;
  }
  
  /**
   * 计算一致性评分
   */
  calculateConsistencyScore(sync, operations) {
    let score = 100;
    
    // 基于同步时间
    const timeSinceSync = Date.now() - sync.lastSyncTime;
    if (timeSinceSync > 60000) score -= 20; // 超过1分钟
    else if (timeSinceSync > 30000) score -= 10; // 超过30秒
    
    // 基于待处理操作
    if (operations.pending > 10) score -= 15;
    else if (operations.pending > 5) score -= 10;
    
    // 基于活动操作
    if (operations.active > 20) score -= 15;
    else if (operations.active > 10) score -= 10;
    
    return Math.max(0, score);
  }
  
  /**
   * 检测一致性问题
   */
  detectConsistencyIssues(sync, operations) {
    const issues = [];
    
    // 检查同步时间
    const timeSinceSync = Date.now() - sync.lastSyncTime;
    if (timeSinceSync > 60000) {
      issues.push({
        type: 'sync_delay',
        message: '设备状态同步延迟过长',
        severity: 'warning'
      });
    }
    
    // 检查待处理操作
    if (operations.pending > 10) {
      issues.push({
        type: 'pending_operations',
        message: '待处理操作过多',
        severity: 'warning'
      });
    }
    
    return issues;
  }
  
  /**
   * 评估连接状态
   */
  evaluateConnectionStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }
  
  /**
   * 更新历史记录
   */
  updateHistory(history, newRecord) {
    const updatedHistory = [...history, newRecord];
    
    // 保持历史记录在指定大小内
    if (updatedHistory.length > this.monitoringConfig.historySize) {
      updatedHistory.shift();
    }
    
    return updatedHistory;
  }
  
  /**
   * 更新指标
   */
  updateMetrics() {
    // 更新系统健康度
    this.updateSystemHealth();
    
    // 记录指标历史
    this.recordMetricsHistory();
  }
  
  /**
   * 更新系统健康度
   */
  updateSystemHealth() {
    const { connectionQuality, performance, stateSync } = this.monitoringData;
    
    // 计算组件健康度
    const components = {
      connection: connectionQuality.score,
      performance: performance.operations.successRate,
      sync: stateSync.consistency.score,
      stability: Math.min(connectionQuality.stability, 100)
    };
    
    // 计算总体健康度
    const overall = Object.values(components).reduce((sum, score) => sum + score, 0) / Object.keys(components).length;
    
    this.monitoringData.systemHealth = {
      overall: Math.round(overall),
      components,
      alerts: this.monitoringData.systemHealth.alerts,
      recommendations: this.monitoringData.systemHealth.recommendations
    };
  }
  
  /**
   * 记录指标历史
   */
  recordMetricsHistory() {
    const timestamp = Date.now();
    
    // 记录性能历史
    this.monitoringData.performance.history = this.updateHistory(
      this.monitoringData.performance.history || [],
      {
        timestamp,
        successRate: this.monitoringData.performance.operations.successRate,
        responseTime: this.monitoringData.performance.latency.avg
      }
    );
  }
  
  /**
   * 检查警告
   */
  checkAlerts() {
    const alerts = [];
    const { alertThresholds } = this.monitoringConfig;
    
    // 检查连接质量
    if (this.monitoringData.connectionQuality.score < alertThresholds.connectionQuality) {
      alerts.push({
        type: 'connection_quality',
        severity: 'warning',
        message: `连接质量较低: ${this.monitoringData.connectionQuality.score}%`,
        timestamp: Date.now()
      });
    }
    
    // 检查性能
    if (this.monitoringData.performance.operations.successRate < alertThresholds.performanceScore) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `操作成功率较低: ${this.monitoringData.performance.operations.successRate}%`,
        timestamp: Date.now()
      });
    }
    
    // 检查响应时间
    if (this.monitoringData.performance.latency.avg > alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `响应时间过长: ${this.monitoringData.performance.latency.avg}ms`,
        timestamp: Date.now()
      });
    }
    
    // 更新警告列表
    this.monitoringData.systemHealth.alerts = alerts;
  }
  
  /**
   * 执行健康检查
   */
  performHealthCheck() {
    const health = this.monitoringData.systemHealth;
    
    // 根据健康度生成警告
    if (health.overall < 70) {
      console.warn('⚠️ 系统健康度较低:', health.overall + '%');
    }
    
    // 检查各组件
    Object.entries(health.components).forEach(([component, score]) => {
      if (score < 70) {
        console.warn(`⚠️ ${component}组件健康度较低:`, score + '%');
      }
    });
  }
  
  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    // 基于连接质量生成建议
    if (this.monitoringData.connectionQuality.score < 70) {
      recommendations.push({
        type: 'connection',
        message: '建议检查网络连接或重启WebSocket连接',
        priority: 'high'
      });
    }
    
    // 基于性能生成建议
    if (this.monitoringData.performance.operations.successRate < 85) {
      recommendations.push({
        type: 'performance',
        message: '建议减少并发操作或增加超时时间',
        priority: 'medium'
      });
    }
    
    // 基于状态同步生成建议
    if (this.monitoringData.stateSync.consistency.score < 80) {
      recommendations.push({
        type: 'sync',
        message: '建议手动刷新设备状态或重启同步服务',
        priority: 'medium'
      });
    }
    
    this.monitoringData.systemHealth.recommendations = recommendations;
  }
  
  /**
   * 处理性能报告
   */
  handlePerformanceReport(report) {
    console.log('📊 收到性能报告:', report);
    
    // 可以在这里处理增强WebSocket管理器的性能报告
    // 用于更新监控数据
  }
  
  /**
   * 处理增强错误
   */
  handleEnhancedError(error) {
    console.error('❌ 收到增强错误:', error);
    
    // 更新错误统计
    this.monitoringData.performance.errors.total++;
    this.monitoringData.performance.errors.recentErrors.push(error);
    
    // 保持最近错误列表不超过10个
    if (this.monitoringData.performance.errors.recentErrors.length > 10) {
      this.monitoringData.performance.errors.recentErrors.shift();
    }
  }
  
  /**
   * 获取监控数据
   */
  getMonitoringData() {
    return {
      ...this.monitoringData,
      computed: {
        connectionQualityLevel: this.computedMetrics.connectionQualityLevel.value,
        performanceLevel: this.computedMetrics.performanceLevel.value,
        syncHealthLevel: this.computedMetrics.syncHealthLevel.value
      }
    };
  }
  
  /**
   * 生成监控报告
   */
  generateMonitoringReport() {
    const data = this.getMonitoringData();
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        systemHealth: data.systemHealth.overall,
        connectionQuality: data.connectionQuality.score,
        performanceScore: data.performance.operations.successRate,
        syncHealth: data.stateSync.consistency.score
      },
      details: data,
      recommendations: data.systemHealth.recommendations
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
    
    // 移除事件监听
    enhancedWebSocketManager.off('performanceReport', this.handlePerformanceReport);
    enhancedWebSocketManager.off('error', this.handleEnhancedError);
    
    console.log('🧹 增强状态监控器已清理');
  }
}

// 创建监控器实例
export const enhancedStatusMonitor = new EnhancedStatusMonitor();
export default enhancedStatusMonitor; 