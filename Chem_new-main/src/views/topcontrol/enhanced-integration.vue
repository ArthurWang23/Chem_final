<template>
  <div class="enhanced-integration">
    <!-- 增强功能状态栏 -->
    <div class="enhanced-status-bar">
      <div class="status-group">
        <div class="status-item" :class="getStatusClass(connectionStatus)">
          <span class="status-icon">🔗</span>
          <span class="status-text">{{ connectionStatus }}</span>
        </div>
        
        <div class="status-item" :class="getStatusClass(performanceStatus)">
          <span class="status-icon">📊</span>
          <span class="status-text">{{ performanceStatus }}</span>
        </div>
        
        <div class="status-item" :class="getStatusClass(syncStatus)">
          <span class="status-icon">🔄</span>
          <span class="status-text">{{ syncStatus }}</span>
        </div>
      </div>
      
      <div class="control-group">
        <button @click="togglePerformanceDashboard" class="control-btn">
          {{ showPerformanceDashboard ? '隐藏性能' : '显示性能' }}
        </button>
        <button @click="generateReport" class="control-btn">
          生成报告
        </button>
        <button @click="optimizeNow" class="control-btn" :disabled="isOptimizing">
          {{ isOptimizing ? '优化中...' : '立即优化' }}
        </button>
      </div>
    </div>

    <!-- 性能监控看板 -->
    <div v-if="showPerformanceDashboard" class="performance-dashboard-container">
      <PerformanceDashboard />
    </div>

    <!-- 快速指标 -->
    <div class="quick-metrics">
      <div class="metric-card">
        <div class="metric-value">{{ systemHealthScore }}%</div>
        <div class="metric-label">系统健康度</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value">{{ operationSuccessRate }}%</div>
        <div class="metric-label">操作成功率</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value">{{ responseTime }}ms</div>
        <div class="metric-label">平均响应时间</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value">{{ cacheHitRate }}%</div>
        <div class="metric-label">缓存命中率</div>
      </div>
    </div>

    <!-- 警告和建议 -->
    <div v-if="alerts.length > 0" class="alerts-section">
      <div class="alerts-header">
        <h4>⚠️ 系统警告</h4>
        <button @click="dismissAllAlerts" class="dismiss-btn">全部忽略</button>
      </div>
      
      <div class="alerts-list">
        <div 
          v-for="alert in alerts" 
          :key="alert.id"
          class="alert-item"
          :class="alert.severity"
        >
          <div class="alert-icon">{{ getAlertIcon(alert.severity) }}</div>
          <div class="alert-content">
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
          </div>
          <button @click="dismissAlert(alert.id)" class="alert-dismiss">×</button>
        </div>
      </div>
    </div>

    <!-- 优化建议 -->
    <div v-if="recommendations.length > 0" class="recommendations-section">
      <div class="recommendations-header">
        <h4>💡 优化建议</h4>
        <button @click="applyAllRecommendations" class="apply-btn">应用全部</button>
      </div>
      
      <div class="recommendations-list">
        <div 
          v-for="recommendation in recommendations" 
          :key="recommendation.id"
          class="recommendation-item"
          :class="recommendation.priority"
        >
          <div class="recommendation-priority">{{ getPriorityIcon(recommendation.priority) }}</div>
          <div class="recommendation-content">
            <div class="recommendation-message">{{ recommendation.message }}</div>
            <div class="recommendation-type">{{ recommendation.type }}</div>
          </div>
          <button @click="applyRecommendation(recommendation)" class="apply-btn">应用</button>
        </div>
      </div>
    </div>

    <!-- 实时日志 -->
    <div v-if="showLogs" class="logs-section">
      <div class="logs-header">
        <h4>📋 实时日志</h4>
        <div class="logs-controls">
          <button @click="clearLogs" class="clear-btn">清空</button>
          <button @click="exportLogs" class="export-btn">导出</button>
          <button @click="toggleLogLevel" class="level-btn">{{ logLevel }}</button>
        </div>
      </div>
      
      <div class="logs-container">
        <div 
          v-for="log in filteredLogs" 
          :key="log.id"
          class="log-item"
          :class="log.level"
        >
          <div class="log-time">{{ formatTime(log.timestamp) }}</div>
          <div class="log-level">{{ log.level }}</div>
          <div class="log-message">{{ log.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import PerformanceDashboard from './performance-dashboard.vue';
import topControlWebSocketManager from './optimized-websocket.js';
import enhancedStatusMonitor from './enhanced-status-monitor.js';
import stateSyncOptimizer from './state-sync-optimizer.js';

export default {
  name: 'EnhancedIntegration',
  components: {
    PerformanceDashboard
  },
  setup() {
    // 响应式状态
    const showPerformanceDashboard = ref(false);
    const showLogs = ref(false);
    const isOptimizing = ref(false);
    const logLevel = ref('info');
    
    // 监控数据
    const monitoringData = reactive({
      systemHealth: 100,
      connectionQuality: 'excellent',
      performanceScore: 100,
      syncHealth: 100,
      responseTime: 0,
      successRate: 100,
      cacheHitRate: 100
    });
    
    const alerts = ref([]);
    const recommendations = ref([]);
    const logs = ref([]);
    
    // 定时器
    let updateTimer = null;
    let logCleanupTimer = null;
    
    // 计算属性
    const connectionStatus = computed(() => {
      return monitoringData.connectionQuality;
    });
    
    const performanceStatus = computed(() => {
      const score = monitoringData.performanceScore;
      if (score >= 90) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'fair';
      return 'poor';
    });
    
    const syncStatus = computed(() => {
      const score = monitoringData.syncHealth;
      if (score >= 90) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'fair';
      return 'poor';
    });
    
    const systemHealthScore = computed(() => {
      return Math.round(monitoringData.systemHealth);
    });
    
    const operationSuccessRate = computed(() => {
      return Math.round(monitoringData.successRate);
    });
    
    const responseTime = computed(() => {
      return Math.round(monitoringData.responseTime);
    });
    
    const cacheHitRate = computed(() => {
      return Math.round(monitoringData.cacheHitRate);
    });
    
    const filteredLogs = computed(() => {
      const levelPriorities = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
      };
      
      const currentPriority = levelPriorities[logLevel.value];
      
      return logs.value.filter(log => 
        levelPriorities[log.level] >= currentPriority
      ).slice(-100); // 只显示最近100条
    });
    
    // 方法
    const updateMonitoringData = () => {
      try {
        // 获取监控数据
        const statusData = enhancedStatusMonitor.getMonitoringData();
        const syncStatusData = stateSyncOptimizer.getSyncStatus();
        const enhancedStatusData = topControlWebSocketManager.getEnhancedStatus();
        
        // 更新监控数据
        monitoringData.systemHealth = statusData.systemHealth.overall;
        monitoringData.connectionQuality = statusData.connectionQuality.status;
        monitoringData.performanceScore = statusData.performance.operations.successRate;
        monitoringData.syncHealth = statusData.stateSync.consistency.score;
        monitoringData.responseTime = statusData.performance.latency.avg;
        monitoringData.successRate = statusData.performance.operations.successRate;
        monitoringData.cacheHitRate = syncStatusData.cacheHitRate;
        
        // 更新警告和建议
        alerts.value = statusData.systemHealth.alerts;
        recommendations.value = statusData.systemHealth.recommendations;
        
      } catch (error) {
        console.error('更新监控数据失败:', error);
        addLog('error', '更新监控数据失败: ' + error.message);
      }
    };
    
    const togglePerformanceDashboard = () => {
      showPerformanceDashboard.value = !showPerformanceDashboard.value;
      addLog('info', `${showPerformanceDashboard.value ? '显示' : '隐藏'}性能监控看板`);
    };
    
    const generateReport = async () => {
      try {
        addLog('info', '开始生成性能报告...');
        
        const report = enhancedStatusMonitor.generateMonitoringReport();
        
        // 下载报告
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `topcontrol-performance-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        addLog('info', '性能报告生成成功');
        
      } catch (error) {
        console.error('生成报告失败:', error);
        addLog('error', '生成报告失败: ' + error.message);
      }
    };
    
    const optimizeNow = async () => {
      isOptimizing.value = true;
      addLog('info', '开始系统优化...');
      
      try {
        // 执行各种优化
        await Promise.all([
          performConnectionOptimization(),
          performCacheOptimization(),
          performSyncOptimization()
        ]);
        
        addLog('info', '系统优化完成');
        
      } catch (error) {
        console.error('系统优化失败:', error);
        addLog('error', '系统优化失败: ' + error.message);
      } finally {
        isOptimizing.value = false;
      }
    };
    
    const performConnectionOptimization = async () => {
      // 连接优化逻辑
      addLog('info', '执行连接优化...');
      
      // 检查连接质量
      const connectionQuality = enhancedStatusMonitor.getMonitoringData().connectionQuality.score;
      
      if (connectionQuality < 70) {
        // 尝试重连
        await topControlWebSocketManager.manualReconnect();
        addLog('info', '连接质量较低，已尝试重连');
      }
    };
    
    const performCacheOptimization = async () => {
      // 缓存优化逻辑
      addLog('info', '执行缓存优化...');
      
      // 清理过期缓存
      stateSyncOptimizer.performCleanup();
      
      // 预加载关键设备
      const criticalDevices = ['pump1', 'valve1', 'chip1']; // 示例
      for (const deviceId of criticalDevices) {
        try {
          await topControlWebSocketManager.requestDeviceInfo(deviceId);
        } catch (error) {
          addLog('warn', `预加载设备失败: ${deviceId}`);
        }
      }
    };
    
    const performSyncOptimization = async () => {
      // 同步优化逻辑
      addLog('info', '执行同步优化...');
      
      // 触发一致性检查
      stateSyncOptimizer.performConsistencyCheck();
      
      // 触发同步
      await stateSyncOptimizer.performSync();
    };
    
    const dismissAlert = (alertId) => {
      alerts.value = alerts.value.filter(alert => alert.id !== alertId);
      addLog('info', `已忽略警告: ${alertId}`);
    };
    
    const dismissAllAlerts = () => {
      const count = alerts.value.length;
      alerts.value = [];
      addLog('info', `已忽略所有警告 (${count}个)`);
    };
    
    const applyRecommendation = async (recommendation) => {
      try {
        addLog('info', `应用建议: ${recommendation.message}`);
        
        // 根据建议类型执行相应操作
        switch (recommendation.type) {
          case 'connection':
            await performConnectionOptimization();
            break;
          case 'performance':
            await performCacheOptimization();
            break;
          case 'sync':
            await performSyncOptimization();
            break;
          default:
            addLog('warn', `未知的建议类型: ${recommendation.type}`);
        }
        
        // 移除已应用的建议
        recommendations.value = recommendations.value.filter(r => r.id !== recommendation.id);
        
      } catch (error) {
        console.error('应用建议失败:', error);
        addLog('error', `应用建议失败: ${error.message}`);
      }
    };
    
    const applyAllRecommendations = async () => {
      const count = recommendations.value.length;
      
      for (const recommendation of recommendations.value) {
        await applyRecommendation(recommendation);
      }
      
      addLog('info', `已应用所有建议 (${count}个)`);
    };
    
    const addLog = (level, message) => {
      const log = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        level,
        message
      };
      
      logs.value.push(log);
      
      // 保持日志数量在合理范围内
      if (logs.value.length > 1000) {
        logs.value.shift();
      }
    };
    
    const clearLogs = () => {
      logs.value = [];
      addLog('info', '日志已清空');
    };
    
    const exportLogs = () => {
      const blob = new Blob([JSON.stringify(logs.value, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `topcontrol-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      addLog('info', '日志导出成功');
    };
    
    const toggleLogLevel = () => {
      const levels = ['debug', 'info', 'warn', 'error'];
      const currentIndex = levels.indexOf(logLevel.value);
      const nextIndex = (currentIndex + 1) % levels.length;
      logLevel.value = levels[nextIndex];
      
      addLog('info', `日志级别切换为: ${logLevel.value}`);
    };
    
    const getStatusClass = (status) => {
      return status;
    };
    
    const getAlertIcon = (severity) => {
      const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        critical: '🚨'
      };
      return icons[severity] || '⚠️';
    };
    
    const getPriorityIcon = (priority) => {
      const icons = {
        low: '🔵',
        medium: '🟡',
        high: '🔴',
        critical: '🚨'
      };
      return icons[priority] || '🔵';
    };
    
    const formatTime = (timestamp) => {
      if (!timestamp) return '-';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      
      return date.toLocaleTimeString();
    };
    
    // 生命周期
    onMounted(() => {
      // 初始化数据
      updateMonitoringData();
      
      // 启动定时更新
      updateTimer = setInterval(updateMonitoringData, 5000);
      
      // 启动日志清理定时器
      logCleanupTimer = setInterval(() => {
        if (logs.value.length > 500) {
          logs.value.splice(0, logs.value.length - 500);
        }
      }, 60000); // 每分钟清理一次
      
      // 添加初始日志
      addLog('info', '增强功能集成已启动');
    });
    
    onUnmounted(() => {
      // 清理定时器
      if (updateTimer) clearInterval(updateTimer);
      if (logCleanupTimer) clearInterval(logCleanupTimer);
      
      addLog('info', '增强功能集成已停止');
    });
    
    return {
      // 状态
      showPerformanceDashboard,
      showLogs,
      isOptimizing,
      logLevel,
      monitoringData,
      alerts,
      recommendations,
      logs,
      
      // 计算属性
      connectionStatus,
      performanceStatus,
      syncStatus,
      systemHealthScore,
      operationSuccessRate,
      responseTime,
      cacheHitRate,
      filteredLogs,
      
      // 方法
      togglePerformanceDashboard,
      generateReport,
      optimizeNow,
      dismissAlert,
      dismissAllAlerts,
      applyRecommendation,
      applyAllRecommendations,
      clearLogs,
      exportLogs,
      toggleLogLevel,
      getStatusClass,
      getAlertIcon,
      getPriorityIcon,
      formatTime
    };
  }
};
</script>

<style scoped>
.enhanced-integration {
  padding: 20px;
  background: #f5f5f5;
}

.enhanced-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.status-group {
  display: flex;
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
}

.status-item.excellent {
  background: #d4edda;
  color: #155724;
}

.status-item.good {
  background: #d1ecf1;
  color: #0c5460;
}

.status-item.fair {
  background: #fff3cd;
  color: #856404;
}

.status-item.poor {
  background: #f8d7da;
  color: #721c24;
}

.control-group {
  display: flex;
  gap: 10px;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.control-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.performance-dashboard-container {
  margin-bottom: 20px;
}

.quick-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.metric-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.metric-value {
  font-size: 2em;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.metric-label {
  color: #666;
  font-size: 0.9em;
}

.alerts-section, .recommendations-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.alerts-header, .recommendations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.alerts-header h4, .recommendations-header h4 {
  margin: 0;
  color: #333;
}

.dismiss-btn, .apply-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
}

.dismiss-btn:hover, .apply-btn:hover {
  background: #f0f0f0;
}

.alerts-list, .recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item, .recommendation-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 6px;
  background: #f8f9fa;
  align-items: center;
}

.alert-item.warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.alert-item.error {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.alert-item.critical {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.recommendation-item.high {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.recommendation-item.medium {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.recommendation-item.low {
  background: #d1ecf1;
  border-left: 4px solid #17a2b8;
}

.alert-content, .recommendation-content {
  flex: 1;
}

.alert-message, .recommendation-message {
  font-weight: 500;
  margin-bottom: 5px;
}

.alert-time, .recommendation-type {
  color: #666;
  font-size: 0.9em;
}

.alert-dismiss {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.alert-dismiss:hover {
  background: #f0f0f0;
}

.logs-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.logs-header h4 {
  margin: 0;
  color: #333;
}

.logs-controls {
  display: flex;
  gap: 10px;
}

.clear-btn, .export-btn, .level-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
}

.clear-btn:hover, .export-btn:hover, .level-btn:hover {
  background: #f0f0f0;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  display: grid;
  grid-template-columns: 80px 60px 1fr;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9em;
}

.log-item.debug {
  color: #6c757d;
}

.log-item.info {
  color: #0c5460;
}

.log-item.warn {
  color: #856404;
}

.log-item.error {
  color: #721c24;
}

.log-time {
  color: #666;
  font-size: 0.8em;
}

.log-level {
  text-transform: uppercase;
  font-weight: bold;
  font-size: 0.8em;
}

.log-message {
  word-break: break-word;
}
</style> 