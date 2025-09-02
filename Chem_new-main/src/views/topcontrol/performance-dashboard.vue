<template>
  <div class="performance-dashboard">
    <!-- 性能监控看板标题 -->
    <div class="dashboard-header">
      <h3>🚀 TopControl 性能监控</h3>
      <div class="dashboard-controls">
        <button 
          @click="refreshData" 
          :disabled="isRefreshing"
          class="refresh-btn"
        >
          <span v-if="isRefreshing">🔄</span>
          <span v-else>刷新</span>
        </button>
        <button 
          @click="toggleAutoRefresh" 
          :class="{ 'active': autoRefresh }"
          class="auto-refresh-btn"
        >
          自动刷新
        </button>
      </div>
    </div>

    <!-- 系统健康度概览 -->
    <div class="health-overview">
      <div class="health-card" :class="getHealthClass(monitoringData.systemHealth.overall)">
        <div class="health-score">{{ monitoringData.systemHealth.overall }}%</div>
        <div class="health-label">系统健康度</div>
      </div>
      
      <div class="health-components">
        <div 
          v-for="(score, component) in monitoringData.systemHealth.components"
          :key="component"
          class="component-health"
          :class="getHealthClass(score)"
        >
          <div class="component-score">{{ score }}%</div>
          <div class="component-label">{{ getComponentLabel(component) }}</div>
        </div>
      </div>
    </div>

    <!-- 连接质量监控 -->
    <div class="monitoring-section">
      <h4>🔗 连接质量监控</h4>
      <div class="connection-metrics">
        <div class="metric-card">
          <div class="metric-value" :class="getQualityClass(monitoringData.connectionQuality.status)">
            {{ monitoringData.connectionQuality.score }}%
          </div>
          <div class="metric-label">连接质量</div>
          <div class="metric-status">{{ getQualityStatusText(monitoringData.connectionQuality.status) }}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">{{ monitoringData.connectionQuality.responseTime }}ms</div>
          <div class="metric-label">响应时间</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">{{ monitoringData.connectionQuality.stability }}%</div>
          <div class="metric-label">连接稳定性</div>
        </div>
      </div>
      
      <!-- 连接质量历史图表 -->
      <div class="chart-container">
        <canvas ref="connectionChart" width="400" height="200"></canvas>
      </div>
    </div>

    <!-- 性能监控 -->
    <div class="monitoring-section">
      <h4>📊 性能监控</h4>
      <div class="performance-metrics">
        <div class="metric-card">
          <div class="metric-value">{{ monitoringData.performance.operations.total }}</div>
          <div class="metric-label">总操作数</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value success">{{ monitoringData.performance.operations.successful }}</div>
          <div class="metric-label">成功操作</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value error">{{ monitoringData.performance.operations.failed }}</div>
          <div class="metric-label">失败操作</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value" :class="getSuccessRateClass(monitoringData.performance.operations.successRate)">
            {{ monitoringData.performance.operations.successRate }}%
          </div>
          <div class="metric-label">成功率</div>
        </div>
      </div>
      
      <div class="performance-details">
        <div class="latency-info">
          <h5>延迟信息</h5>
          <div class="latency-metrics">
            <span>平均: {{ monitoringData.performance.latency.avg }}ms</span>
            <span>最小: {{ monitoringData.performance.latency.min }}ms</span>
            <span>最大: {{ monitoringData.performance.latency.max }}ms</span>
          </div>
        </div>
        
        <div class="throughput-info">
          <h5>吞吐量</h5>
          <div class="throughput-metrics">
            <span>{{ monitoringData.performance.throughput.messagesPerMinute }} 消息/分钟</span>
            <span>峰值: {{ monitoringData.performance.throughput.peakThroughput }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态同步监控 -->
    <div class="monitoring-section">
      <h4>🔄 状态同步监控</h4>
      <div class="sync-metrics">
        <div class="metric-card">
          <div class="metric-value">{{ monitoringData.stateSync.devices.total }}</div>
          <div class="metric-label">设备总数</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value success">{{ monitoringData.stateSync.devices.synced }}</div>
          <div class="metric-label">已同步</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value warning">{{ monitoringData.stateSync.devices.outdated }}</div>
          <div class="metric-label">过期</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">{{ monitoringData.stateSync.operations.pending }}</div>
          <div class="metric-label">待处理</div>
        </div>
      </div>
      
      <div class="sync-status">
        <div class="consistency-score" :class="getConsistencyClass(monitoringData.stateSync.consistency.score)">
          <span class="score-value">{{ monitoringData.stateSync.consistency.score }}%</span>
          <span class="score-label">一致性评分</span>
        </div>
        
        <div class="sync-info">
          <div class="sync-time">
            最后同步: {{ formatTime(monitoringData.stateSync.consistency.lastCheck) }}
          </div>
          <div class="sync-issues" v-if="monitoringData.stateSync.consistency.issues.length > 0">
            <span class="issues-count">{{ monitoringData.stateSync.consistency.issues.length }} 个问题</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误监控 -->
    <div class="monitoring-section">
      <h4>❌ 错误监控</h4>
      <div class="error-overview">
        <div class="error-stats">
          <div class="error-total">总错误数: {{ monitoringData.performance.errors.total }}</div>
          <div class="error-rate">错误率: {{ calculateErrorRate() }}%</div>
        </div>
        
        <div class="error-types">
          <div 
            v-for="[type, count] in monitoringData.performance.errors.byType"
            :key="type"
            class="error-type"
          >
            <span class="type-name">{{ type }}</span>
            <span class="type-count">{{ count }}</span>
          </div>
        </div>
      </div>
      
      <div class="recent-errors">
        <h5>最近错误</h5>
        <div class="error-list">
          <div 
            v-for="error in monitoringData.performance.errors.recentErrors"
            :key="error.id"
            class="error-item"
          >
            <div class="error-timestamp">{{ formatTime(error.timestamp) }}</div>
            <div class="error-type">{{ error.type }}</div>
            <div class="error-message">{{ error.message || error.error }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统警告和建议 -->
    <div class="monitoring-section">
      <h4>⚠️ 系统警告</h4>
      <div class="alerts-container">
        <div 
          v-for="alert in monitoringData.systemHealth.alerts"
          :key="alert.type"
          class="alert-item"
          :class="alert.severity"
        >
          <div class="alert-icon">{{ getAlertIcon(alert.severity) }}</div>
          <div class="alert-content">
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
          </div>
        </div>
        
        <div v-if="monitoringData.systemHealth.alerts.length === 0" class="no-alerts">
          ✅ 暂无系统警告
        </div>
      </div>
    </div>

    <!-- 优化建议 -->
    <div class="monitoring-section">
      <h4>💡 优化建议</h4>
      <div class="recommendations-container">
        <div 
          v-for="recommendation in monitoringData.systemHealth.recommendations"
          :key="recommendation.type"
          class="recommendation-item"
          :class="recommendation.priority"
        >
          <div class="recommendation-priority">{{ getPriorityIcon(recommendation.priority) }}</div>
          <div class="recommendation-content">
            <div class="recommendation-message">{{ recommendation.message }}</div>
            <div class="recommendation-type">{{ recommendation.type }}</div>
          </div>
        </div>
        
        <div v-if="monitoringData.systemHealth.recommendations.length === 0" class="no-recommendations">
          ✅ 系统运行良好，暂无优化建议
        </div>
      </div>
    </div>

    <!-- 操作历史 -->
    <div class="monitoring-section">
      <h4>📋 操作历史</h4>
      <div class="operation-history">
        <div class="history-controls">
          <button @click="clearHistory" class="clear-btn">清除历史</button>
          <button @click="exportHistory" class="export-btn">导出历史</button>
        </div>
        
        <div class="history-list">
          <div 
            v-for="operation in operationHistory"
            :key="operation.id"
            class="history-item"
            :class="operation.status"
          >
            <div class="operation-time">{{ formatTime(operation.timestamp) }}</div>
            <div class="operation-type">{{ operation.type }}</div>
            <div class="operation-device">{{ operation.deviceId }}</div>
            <div class="operation-status">{{ operation.status }}</div>
            <div class="operation-duration">{{ operation.duration }}ms</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import enhancedStatusMonitor from './enhanced-status-monitor.js';
import topControlWebSocketManager from './optimized-websocket.js';

export default {
  name: 'PerformanceDashboard',
  setup() {
    // 响应式数据
    const isRefreshing = ref(false);
    const autoRefresh = ref(true);
    const monitoringData = reactive({
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
      },
      connectionQuality: {
        score: 100,
        status: 'excellent',
        responseTime: 0,
        stability: 100,
        history: []
      },
      performance: {
        operations: {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 100
        },
        latency: {
          min: 0,
          max: 0,
          avg: 0
        },
        throughput: {
          messagesPerMinute: 0,
          peakThroughput: 0
        },
        errors: {
          total: 0,
          byType: new Map(),
          recentErrors: []
        }
      },
      stateSync: {
        devices: {
          total: 0,
          synced: 0,
          outdated: 0
        },
        operations: {
          pending: 0
        },
        consistency: {
          score: 100,
          issues: [],
          lastCheck: Date.now()
        }
      }
    });
    
    const operationHistory = ref([]);
    
    // 定时器
    let refreshTimer = null;
    
    // 图表引用
    const connectionChart = ref(null);
    
    // 方法
    const refreshData = async () => {
      isRefreshing.value = true;
      
      try {
        // 获取监控数据
        const data = enhancedStatusMonitor.getMonitoringData();
        
        // 更新响应式数据
        Object.assign(monitoringData, data);
        
        // 更新图表
        updateConnectionChart();
        
      } catch (error) {
        console.error('刷新数据失败:', error);
      } finally {
        isRefreshing.value = false;
      }
    };
    
    const toggleAutoRefresh = () => {
      autoRefresh.value = !autoRefresh.value;
      
      if (autoRefresh.value) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    };
    
    const startAutoRefresh = () => {
      if (refreshTimer) clearInterval(refreshTimer);
      
      refreshTimer = setInterval(() => {
        refreshData();
      }, 5000); // 每5秒刷新一次
    };
    
    const stopAutoRefresh = () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    };
    
    const updateConnectionChart = () => {
      if (!connectionChart.value) return;
      
      const ctx = connectionChart.value.getContext('2d');
      const history = monitoringData.connectionQuality.history;
      
      // 清除画布
      ctx.clearRect(0, 0, connectionChart.value.width, connectionChart.value.height);
      
      if (history.length < 2) return;
      
      // 绘制连接质量历史图表
      ctx.beginPath();
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      
      const width = connectionChart.value.width;
      const height = connectionChart.value.height;
      const maxPoints = 50;
      const recentHistory = history.slice(-maxPoints);
      
      recentHistory.forEach((point, index) => {
        const x = (index / (recentHistory.length - 1)) * width;
        const y = height - (point.score / 100) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    };
    
    // 工具方法
    const getHealthClass = (score) => {
      if (score >= 90) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'fair';
      return 'poor';
    };
    
    const getQualityClass = (status) => {
      return status;
    };
    
    const getSuccessRateClass = (rate) => {
      if (rate >= 95) return 'excellent';
      if (rate >= 85) return 'good';
      if (rate >= 70) return 'fair';
      return 'poor';
    };
    
    const getConsistencyClass = (score) => {
      if (score >= 95) return 'excellent';
      if (score >= 85) return 'good';
      if (score >= 70) return 'fair';
      return 'poor';
    };
    
    const getComponentLabel = (component) => {
      const labels = {
        connection: '连接',
        performance: '性能',
        sync: '同步',
        stability: '稳定性'
      };
      return labels[component] || component;
    };
    
    const getQualityStatusText = (status) => {
      const statusTexts = {
        excellent: '优秀',
        good: '良好',
        fair: '一般',
        poor: '较差'
      };
      return statusTexts[status] || status;
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
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      
      return date.toLocaleString();
    };
    
    const calculateErrorRate = () => {
      const total = monitoringData.performance.operations.total;
      const errors = monitoringData.performance.errors.total;
      
      if (total === 0) return 0;
      
      return ((errors / total) * 100).toFixed(2);
    };
    
    const clearHistory = () => {
      operationHistory.value = [];
    };
    
    const exportHistory = () => {
      const data = {
        timestamp: new Date().toISOString(),
        history: operationHistory.value,
        monitoring: monitoringData
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-history-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    
    // 生命周期
    onMounted(() => {
      // 初始化数据
      refreshData();
      
      // 开始自动刷新
      if (autoRefresh.value) {
        startAutoRefresh();
      }
    });
    
    onUnmounted(() => {
      stopAutoRefresh();
    });
    
    return {
      // 状态
      isRefreshing,
      autoRefresh,
      monitoringData,
      operationHistory,
      connectionChart,
      
      // 方法
      refreshData,
      toggleAutoRefresh,
      getHealthClass,
      getQualityClass,
      getSuccessRateClass,
      getConsistencyClass,
      getComponentLabel,
      getQualityStatusText,
      getAlertIcon,
      getPriorityIcon,
      formatTime,
      calculateErrorRate,
      clearHistory,
      exportHistory
    };
  }
};
</script>

<style scoped>
.performance-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.dashboard-header h3 {
  margin: 0;
  color: #333;
}

.dashboard-controls {
  display: flex;
  gap: 10px;
}

.refresh-btn, .auto-refresh-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn:hover, .auto-refresh-btn:hover {
  background: #f0f0f0;
}

.auto-refresh-btn.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.health-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.health-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  min-width: 150px;
}

.health-score {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 10px;
}

.health-label {
  color: #666;
  font-size: 0.9em;
}

.health-components {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.component-health {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  text-align: center;
  min-width: 100px;
}

.component-score {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 5px;
}

.component-label {
  color: #666;
  font-size: 0.8em;
}

.monitoring-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.monitoring-section h4 {
  margin: 0 0 20px 0;
  color: #333;
}

.connection-metrics, .performance-metrics, .sync-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.metric-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
}

.metric-value {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 5px;
}

.metric-label {
  color: #666;
  font-size: 0.9em;
}

.metric-status {
  color: #888;
  font-size: 0.8em;
  margin-top: 5px;
}

.chart-container {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  text-align: center;
}

.performance-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.latency-info, .throughput-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.latency-info h5, .throughput-info h5 {
  margin: 0 0 10px 0;
  color: #333;
}

.latency-metrics, .throughput-metrics {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.latency-metrics span, .throughput-metrics span {
  font-size: 0.9em;
  color: #666;
}

.sync-status {
  display: flex;
  gap: 20px;
  align-items: center;
}

.consistency-score {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  min-width: 120px;
}

.score-value {
  font-size: 1.5em;
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

.score-label {
  color: #666;
  font-size: 0.9em;
}

.sync-info {
  flex: 1;
}

.sync-time, .sync-issues {
  margin-bottom: 5px;
  color: #666;
}

.error-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.error-stats {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.error-types {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.error-type {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.error-list {
  max-height: 200px;
  overflow-y: auto;
}

.error-item {
  display: grid;
  grid-template-columns: 120px 100px 1fr;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #eee;
  font-size: 0.9em;
}

.error-timestamp {
  color: #666;
}

.error-type {
  color: #e74c3c;
  font-weight: bold;
}

.alerts-container, .recommendations-container {
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
}

.alert-item.warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.alert-item.error {
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
  font-weight: bold;
  margin-bottom: 5px;
}

.alert-time, .recommendation-type {
  color: #666;
  font-size: 0.9em;
}

.no-alerts, .no-recommendations {
  text-align: center;
  padding: 20px;
  color: #666;
}

.operation-history {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
}

.history-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.clear-btn, .export-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-btn:hover, .export-btn:hover {
  background: #f0f0f0;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: grid;
  grid-template-columns: 120px 100px 100px 80px 80px;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  font-size: 0.9em;
}

.history-item.success {
  color: #28a745;
}

.history-item.error {
  color: #dc3545;
}

/* 健康度状态颜色 */
.excellent {
  color: #28a745;
}

.good {
  color: #17a2b8;
}

.fair {
  color: #ffc107;
}

.poor {
  color: #dc3545;
}

.success {
  color: #28a745;
}

.error {
  color: #dc3545;
}

.warning {
  color: #ffc107;
}
</style> 