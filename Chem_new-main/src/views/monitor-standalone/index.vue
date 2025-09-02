<template>
  <div class="main-container">

    <!-- 工具栏 - 始终显示，包含创建模式和反应路径按钮 -->
    <div class="toolbar">
      
      <!-- 🎯 运行状态指示器 - 新增 -->
      <div v-if="runningTasks.length > 0 || isWorkflowRunning" class="running-tasks-indicator">
        <div class="indicator-header">
          <span class="indicator-title">
            <span v-if="isWorkflowRunning" class="workflow-badge">工作流执行中</span>
            正在运行 ({{ runningTasks.length }})
          </span>
          <button class="toggle-details-btn" @click="showRunningDetails = !showRunningDetails">
            {{ showRunningDetails ? '隐藏' : '详情' }}
          </button>
        </div>
        <div v-if="showRunningDetails" class="running-tasks-details">
          <!-- 🎯 工作流状态信息 -->
          <div v-if="isWorkflowRunning && runningTasksStore.getCurrentWorkflowInfo" class="workflow-status">
            <div class="workflow-info">
              <span class="workflow-id">工作流: {{ runningTasksStore.getCurrentWorkflowInfo.id }}</span>
              <span class="workflow-progress">
                {{ runningTasksStore.getCurrentWorkflowInfo.currentTaskIndex + 1 }}/{{ runningTasksStore.getCurrentWorkflowInfo.totalTasks }}
              </span>
            </div>
            <div class="workflow-metrics">
              <span class="expected-devices">期望设备状态: {{ runningTasksStore.getExpectedStates.size }}</span>
              <span class="actual-devices">实际设备状态: {{ runningTasksStore.getActualStates.size }}</span>
            </div>
          </div>
          
          <!-- 任务列表 -->
          <div v-for="task in runningTasks" :key="`${task.taskId}-${task.taskKey}`" class="running-task-item">
            <div class="task-info">
              <span class="task-name">{{ task.taskName }}</span>
              <span class="task-progress">{{ task.progress || 0 }}%</span>
            </div>
            <div class="task-status">
              <span class="current-device" v-if="task.currentDevice">当前: {{ task.currentDevice }}</span>
              <span class="task-time">{{ formatRunTime(task.startedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 创建反应路径按钮 - 非编辑模式显示 -->
      <button 
        v-if="isAdmin && !isEditMode"
        class="tool-button" 
        :class="{ 'active': isCreateMode }"
        @click="isCreateMode ? exitCreateMode() : enterCreateMode()"
      >
        {{ isCreateMode ? '退出创建模式' : '创建硬件结构' }}
      </button>
      
      <!-- 保存反应路径按钮，仅在创建模式下显示 -->
      <button 
        v-if="isAdmin && isCreateMode && !isEditMode" 
        class="tool-button save-button"
        @click="openSaveDialog"
      >
        保存硬件结构
      </button>
      
      <!-- 撤销操作按钮，仅在创建模式下显示 -->
      <button 
        v-if="isAdmin && isCreateMode && !isEditMode" 
        class="tool-button undo-button"
        @click="undoLastOperation"
        :disabled="operationHistory.length === 0"
        title="撤销上一步操作 (Ctrl+Z)"
      >
        撤销上一步 <span v-if="operationHistory.length > 0" class="operation-count">({{ operationHistory.length }})</span>
      </button>

    </div>

    <!-- 创建模式侧边栏 - 仅在创建模式下显示 -->
    <div
      v-if="isAdmin && isCreateMode"
      class="sidebar create-mode-sidebar"
      :class="{
        'sidebar-collapsed': !appSidebarOpened,
        'sidebar-hidden': !isSidebarOpen
      }"
    >
      <h3>创建硬件结构</h3>
      
      <!-- 设备图标拖拽区 -->
      <div class="icons-container">
        <h4>可用设备</h4>
        <div
          v-for="(icon, index) in nodeIcons"
          :key="index"
          class="icon-item"
          draggable="true"
          :data-type="icon.type"
          @dragstart="e => handleDragStart(e, icon)"
          @dragend="handleDragEnd"
        >
          <img :src="icon.src" class="icon-image" />
          <span>{{ icon.label }}</span>
        </div>
      </div>

      <!-- 连线模式按钮 - 仅在创建模式中显示 -->
      <div class="edge-mode-container">
        <button
          class="edge-mode-button"
          :class="{ active: isEdgeMode }"
          title="连线模式"
          @click="toggleEdgeMode"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M3,3 L9,9 M15,15 L21,21"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            />
            <circle cx="8" cy="8" r="4" fill="currentColor" />
            <circle cx="16" cy="16" r="4" fill="currentColor" />
          </svg>
          <span>连线模式</span>
        </button>
      </div>
    </div>

    <!-- 选择反应路径侧边栏 - 在非创建模式下显示 -->
    <div
      v-if="!isCreateMode"
      class="sidebar path-selector-sidebar"
      :class="{
        'sidebar-collapsed': !appSidebarOpened,
        'sidebar-hidden': !isSidebarOpen
      }"
    >
      <h3>选择硬件结构</h3>
      
      <!-- 用户保存的硬件结构 -->
      <div v-if="savedPaths.length > 0" class="path-section">
        <h4>自定义结构</h4>
        <div class="path-options">
          <div 
            v-for="path in savedPaths" 
            :key="path.name"
            class="path-option custom-path"
            :class="{ 'selected': selectedPath && selectedPath.name === path.name }"
          >
            <span @click="loadStructureFromFile(path)">{{ path.name }}</span>
            <button 
              class="delete-path-btn" 
              title="删除此路径"
              @click.stop="openDeletePathDialog(path)"
            >×</button>
          </div>
        </div>
      </div>
      
      <!-- 图标说明区域 -->
      <div class="icons-legend-section">
        <h4>设备图标说明</h4>
        <div class="icons-legend">
          <div class="legend-item">
            <img :src="pump" class="legend-icon" />
            <span>泵 - 用于精确控制液体流动</span>
          </div>
          <div class="legend-item">
            <img :src="valve" class="legend-icon" />
            <span>阀门 - 控制流体通道的开关</span>
          </div>
          <div class="legend-item">
            <img :src="chip" class="legend-icon" />
            <span>加热芯片 - 控制反应温度</span>
          </div>
          <div class="legend-item">
            <img :src="bottle" class="legend-icon" />
            <span>瓶 - 存储反应物或产物</span>
          </div>
          <div class="legend-item">
            <img :src="mfc" class="legend-icon" />
            <span>MFC控制器 - 控制气体流量</span>
          </div>
          <div class="legend-item">
            <img :src="light" class="legend-icon" />
            <span>光照控制 - 提供光催化条件</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
      <button class="close-error-btn" @click="errorMessage = ''">×</button>
    </div>

    <!-- G6 画布容器 -->
    <div
      ref="container"
      class="graph-container"
      :class="{
        'graph-container-full': !isSidebarOpen,
        'graph-container-collapsed': !appSidebarOpened && isSidebarOpen,
        'drag-disabled': !isDragEnabled,
        'create-mode': isCreateMode
      }"
      @dragover.prevent="isCreateMode ? $event.preventDefault() : null"
      @drop="isCreateMode ? handleDrop($event) : null"
    />

    <!-- 设备控制面板 -->
    <div v-if="showControlPanel" class="device-control-panel">
      <div class="panel-content">
        <!-- 设备ID和状态 -->
        <div class="device-info">
          <div class="device-header">
            <div class="device-title">设备控制: {{ deviceData.id }}</div>
            <div class="data-source-indicator" :class="{ 'connected': isHardwareConnected, 'disconnected': !isHardwareConnected }">
              {{ isHardwareConnected ? '已连接到硬件设备' : '硬件设备未连接' }}
            </div>
          <button class="close-btn" @click="closeControlPanel">×</button>
          </div>
          <div class="device-status" :class="deviceData.status">
            状态: {{ translateStatus(deviceData.status) }}
          </div>
        </div>

        <!-- 泵控制 -->
        <div v-if="deviceData.type === 'pump'" class="device-controls">
          <!-- 当前状态区域 -->
          <div class="current-status-section">
            <div class="section-title">当前状态</div>
            <div class="status-row">
              <span class="status-label">当前速度:</span>
              <span class="status-value">{{ deviceData.speed }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">当前位置:</span>
              <span class="status-value">{{ deviceData.position }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">吸取端口:</span>
              <span class="status-value">{{ deviceData.aspiratePort }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">输送端口:</span>
              <span class="status-value">{{ deviceData.dispensePort }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">流速:</span>
              <span class="status-value">{{ deviceData.flowRate }}</span>
            </div>
          </div>
        </div>

        <!-- 阀门控制 -->
        <div v-if="deviceData.type === 'valve'" class="device-controls">
          <!-- 当前状态区域 -->
          <div class="current-status-section">
            <div class="section-title">当前状态</div>
            <div class="status-row">
              <span class="status-label">当前孔位:</span>
              <span class="status-value">{{ deviceData.position }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">产品收集阀:</span>
              <span class="status-value">{{ deviceData.isProductValve ? '是' : '否' }}</span>
            </div>
          </div>
        </div>

        <!-- 加热芯片控制 -->
        <div v-if="deviceData.type === 'chip'" class="device-controls">
          <!-- 当前状态区域 -->
          <div class="current-status-section">
            <div class="section-title">当前状态</div>
            <div class="status-row">
              <span class="status-label">当前温度:</span>
              <span class="status-value">{{ deviceData.currentTemp }}°C</span>
            </div>
            <div class="status-row">
              <span class="status-label">目标温度:</span>
              <span class="status-value">{{ deviceData.targetTemp }}°C</span>
            </div>
            <div class="status-row">
              <span class="status-label">加热速度:</span>
              <span class="status-value">{{ deviceData.heatingSpeed }}</span>
            </div>
          </div>
        </div>

        <!-- MFC控制 -->
        <div v-if="deviceData.type === 'mfc'" class="device-controls">
          <!-- 当前状态区域 -->
          <div class="current-status-section">
            <div class="section-title">当前状态</div>
            <div class="status-row">
              <span class="status-label">当前流速:</span>
              <span class="status-value">{{ deviceData.flowRate }}</span>
            </div>
          </div>
        </div>

        <!-- 光照控制 -->
        <div v-if="deviceData.type === 'light'" class="device-controls">
          <!-- 当前状态区域 -->
          <div class="current-status-section">
            <div class="section-title">当前状态</div>
            <div class="status-row">
              <span class="status-label">当前光强:</span>
              <span class="status-value">{{ deviceData.intensity }}</span>
            </div>
          </div>
        </div>

        <!-- 瓶控制 -->
        <div v-if="deviceData.type === 'bottle'" class="device-controls">
          <!-- 当前状态区域 -->
          <div class="current-status-section">
            <div class="section-title">当前状态</div>
            <div class="status-row">
              <span class="status-label">反应物:</span>
              <span class="status-value">{{ deviceData.reactant || '未设置' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存路径名称对话框 -->
    <div v-if="isShowPathNameDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h3>保存硬件结构</h3>
        <div class="dialog-form">
          <label for="pathName">名称</label>
          <input 
            id="pathName"
            v-model="pathName"
            type="text"
            placeholder="请输入硬件结构名称"
            @keyup.enter="saveCurrentPath"
          />
        </div>
        <div class="dialog-buttons">
          <button @click="isShowPathNameDialog = false">取消</button>
          <button class="primary-button" @click="saveCurrentPath">保存</button>
        </div>
      </div>
    </div>

    <!-- 删除路径确认对话框 -->
    <div v-if="isShowDeletePathDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h3>删除硬件结构</h3>
        <div class="dialog-form">
          <p>确定要删除硬件结构 "{{ pathToDelete?.name }}" 吗？此操作不可恢复。</p>
          <p class="warning-text">此操作不可恢复！</p>
        </div>
        <div class="dialog-buttons">
          <button @click="isShowDeletePathDialog = false">取消</button>
          <button class="danger-button" @click="deleteReactionPath">删除</button>
        </div>
      </div>
    </div>

    <!-- WebSocket连接状态 -->
    <div class="ws-status" :class="{ 'connected': wsConnected }">
      <span v-if="wsConnected">已连接到服务器</span>
      <span v-else>未连接到服务器</span>
    </div>

    <!-- 添加硬件连接控制面板 -->
    <div class="hardware-control-container" 
         :class="{
           'sidebar-collapsed': !appSidebarOpened && isSidebarOpen,
           'sidebar-hidden': !isSidebarOpen
         }">
      <el-card class="hardware-control-card">
        <template #header>
          <div class="hardware-card-header">
            <span>硬件设备连接</span>
            <el-tag :type="isHardwareConnected ? 'success' : 'danger'" size="small">
              {{ isHardwareConnected ? '已连接' : '未连接' }}
            </el-tag>
          </div>
        </template>
        <div class="hardware-card-content">
          <el-form :inline="true">
            <el-form-item label="硬件IP地址">
              <el-input v-model="hardwareIP" placeholder="例如：192.168.1.14" :disabled="isHardwareConnected"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button 
                :type="isHardwareConnected ? 'danger' : 'primary'" 
                :loading="isHardwareConnecting" 
                @click="isHardwareConnected ? disconnectHardware() : connectHardware()">
                {{ isHardwareConnected ? '断开连接' : '连接硬件' }}
              </el-button>
            </el-form-item>
          </el-form>
          <div v-if="hardwareErrorMessage" class="hardware-error-message">
            <el-alert :title="hardwareErrorMessage" type="error" show-icon></el-alert>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 设备选择对话框 -->
    <div v-if="showDeviceSelectionDialog" class="dialog-overlay">
      <div class="dialog-content device-selection-dialog">
        <h3>选择{{ getDeviceTypeName(dropPosition.type) }}</h3>
        
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            v-model="deviceSearchQuery" 
            type="text" 
            placeholder="搜索设备ID..."
            @input="filterDevices"
          />
        </div>
        
        <!-- 设备列表 -->
        <div class="device-list">
          <div v-if="filteredDevices.length === 0" class="no-devices">
            没有可用的{{ getDeviceTypeName(dropPosition.type) }}设备
          </div>
          
          <!-- 设备分组显示 -->
          <template v-for="(group, index) in deviceGroups" :key="index">
            <div class="device-group" v-if="group.devices.length > 0">
              <div class="group-title">{{ group.title }}</div>
              <div 
                v-for="device in group.devices" 
                :key="device.id"
                class="device-item"
                @click="selectDeviceAndAddToGraph(device)"
              >
                <div class="device-info">
                  <div class="device-id">{{ device.id }}</div>
                  <div class="device-module-id" v-if="device.moduleMetadata">
                    模块ID: {{ device.moduleMetadata.moduleId }}
                  </div>
                </div>
                <div class="device-status" :class="device.status">
                  {{ translateStatus(device.status) }}
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <div class="dialog-buttons">
          <button @click="showDeviceSelectionDialog = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, reactive } from "vue";
import { Graph } from "@antv/g6";
import { useAppStoreHook } from "@/store/modules/app";
import axios from "axios";
import { saveAs } from 'file-saver'; // 需要安装 file-saver 库用于保存文件
import { ElMessage,ElMessageBox } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
// 🎯 引入runningTasks store
import { useRunningTasksStore } from '@/store/modules/runningTasks'

// 🎯 初始化store
const runningTasksStore = useRunningTasksStore()

// 引入图片文件
import pump from "@/assets/jpg/pump.jpg";
import valve from "@/assets/jpg/valve.jpg";
import chip from "@/assets/jpg/chip.jpg";
import mfc from "@/assets/svg/mfc.svg?url"; // 保留原有mfc图标
import light from "@/assets/svg/light.svg?url"; // 保留原有light图标
import bottle from "@/assets/jpg/bottle.jpg";


defineOptions({
  name:"MonitorStandalone"
})
const isAdmin = ref(true);
const isSidebarOpen = ref(true);
const isLoading = ref(false); // 添加加载状态
const errorMessage = ref(""); // 添加错误信息



// 连线模式相关
const isEdgeMode = ref(false);
const sourceNode = ref(null);

// 拖拽是否启用的计算属性
const isDragEnabled = computed(() => {
  console.log("isDragEnabled", isAdmin.value, isCreateMode.value, isSidebarOpen.value, isEdgeMode.value);
  // 在创建模式下始终允许拖拽节点，但需要是管理员
  if (isAdmin.value && isCreateMode.value) {
    console.log("创建模式下启用拖拽");
    return true;
  }
  // 其他情况下的原始逻辑
  return false;
});

// 获取应用侧边栏状态
const pureApp = useAppStoreHook();
const appSidebarOpened = computed(() => pureApp.getSidebarStatus);

const container = ref(null);
let graph = null;
let draggedIcon = null;

// 可拖拽图标列表
const nodeIcons = ref([
  { type: "pump", src: pump, label: "泵" },
  { type: "valve", src: valve, label: "阀" },
  { type: "chip", src: chip, label: "加热芯片" },
  { type: "mfc", src: mfc, label: "MFC控制器" },
  { type: "light", src: light, label: "光照控制" },
  { type: "bottle", src: bottle, label: "瓶" }
]);

const selectedDevice = ref(null);
const deviceData = ref({}); // 当前设备状态数据（由下位机更新）
const controlParams = ref({}); // 新增：控制参数数据（用于用户调整参数）

// 创建模式状态
const isCreateMode = ref(false);
const pathName = ref(''); // 用于存储新创建的硬件结构名称
const pathDescription = ref(''); // 用于存储硬件结构描述
const isShowPathNameDialog = ref(false); // 控制显示路径名称输入对话框

// 已有的硬件结构列表
const savedPaths = ref([]);

// 当前编辑的路径信息
const currentEditPath = ref(null);

// 删除路径相关变量
const isShowDeletePathDialog = ref(false);
const pathToDelete = ref(null);

const selectedPath = ref(null);
const selectedControllerIndex = ref(1); // 设置默认控制器索引为1

// 操作历史和撤销相关状态
const operationHistory = ref([]); // 操作历史记录
const maxHistoryLength = 20; // 最大历史记录长度


// 添加操作到历史记录
const addToHistory = (operation) => {
  // 添加新操作到历史记录
  operationHistory.value.push(operation);
  
  // 如果历史记录超过最大长度，移除最早的记录
  if (operationHistory.value.length > maxHistoryLength) {
    operationHistory.value.shift();
  }
  
  console.log(`已添加操作到历史记录，当前历史长度: ${operationHistory.value.length}`);
};

// 进入硬件结构创建模式
const enterCreateMode = () => {
  isCreateMode.value = true;
  isSidebarOpen.value = true; // 确保侧边栏打开
  
  // 清空当前图
  graph.clear();
  graph.render();
  
  // 重置拖拽和连线状态
  isEdgeMode.value = false;
  sourceNode.value = null;
  
  // 清空操作历史
  operationHistory.value = [];
  
  // 初始化编辑状态 - 设置默认值
  currentEditPath.value = {
    name: '',
    type: 'custom',
    controllerIndex: 1
  };
  console.log("进入创建模式", isDragEnabled.value);
};

// 退出创建模式
const exitCreateMode = () => {
  isCreateMode.value = false;
  isEdgeMode.value = false;
  sourceNode.value = null;
  
  // 清空当前图
  graph.clear();
  graph.render();
  
  // 如果有选中的自定义路径，重新加载
  if (selectedPath.value && typeof selectedPath.value === 'object') {
    // 自定义路径
    loadStructureFromFile(selectedPath.value);
  }
};

// 从文件加载硬件结构
const loadStructureFromFile = async (path) => {
  try {
    isLoading.value = true;
    console.log("尝试加载硬件结构:", path);
    
    let baseUrl = '';
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000'; // 开发环境下的后端地址
    }
    
    // 1. 首先尝试从新的API路径获取文件内容
    const pathId = path.id || path.name; // 使用ID优先，否则使用name
    console.log("正在从API加载路径ID:", pathId);
    
    try {
      const response = await axios.get(`${baseUrl}/api/devices/path/${encodeURIComponent(pathId)}`);
      
      if (response.data.code !== 0 || !response.data.data) {
        throw new Error("API返回错误或数据为空");
      }
      
      const pathConfig = response.data.data;
      console.log("从API加载的路径数据:", pathConfig);
      
      // 确保图表已初始化
      if (!graph) {
        console.error("图表实例未初始化，无法加载路径");
        errorMessage.value = "图表实例未初始化，请刷新页面重试";
        return;
      }
      
      // 重新初始化图表以解决潜在的渲染问题
      // 1. 获取容器尺寸
      const containerEl = container.value;
      if (!containerEl) {
        errorMessage.value = "找不到图表容器";
        return;
      }
      
      const graphWidth = containerEl.clientWidth || 800;
      const graphHeight = containerEl.clientHeight || 600;
      
      // 2. 销毁旧图表
      if (graph) {
        graph.destroy();
      }
      
      // 3. 创建新图表
      console.log(`重新初始化图形，尺寸: ${graphWidth}x${graphHeight}`);
      graph = new Graph({
        container: containerEl,
        width: graphWidth,
        height: graphHeight,
        behaviors: [
          
          {
            type: 'zoom-canvas',
            sensitivity: 1.5,
            key: 'zoom-canvas',
            enable: true
          },
          {
            type: 'click-select',
            key: 'click-select',
            enable: true
          },
          {
            type: 'drag-element',
            key: 'drag-element',
            enable: true,
            shouldBegin: (e) => {
              return isCreateMode.value && isAdmin.value;
            }
          }
        ],
        node: {
          style: {
            fill: '#91d5ff',
            stroke: '#40a9ff',
            lineWidth: 1,
            radius: 6,
            cursor: 'move'
          }
        },
        edge: {
          style: {
            stroke: '#91d5ff',
            lineWidth: 2,
            endArrow: {
              fill: '#91d5ff',
              stroke: '#91d5ff'
            }
          }
        }
      });
      
      // 重新注册事件
      graph.on('node:click', handleDeviceClick);
      
      // 处理和添加节点
      const nodesData = [];
      if (pathConfig.data && pathConfig.data.nodes && Array.isArray(pathConfig.data.nodes)) {
        for (const node of pathConfig.data.nodes) {
          if (!node.id) continue;
          
          // 创建标准节点数据
          const processedNode = {
            id: node.id,
            type: "image",
            data: {
              deviceType: node.data?.deviceType || node.id.split('-')[0] || 'unknown',
              label: node.data?.label || "设备"
            },
            style: {
              x: node.style?.x || 100 + Math.random() * 300,
              y: node.style?.y || 100 + Math.random() * 200,
              size: node.style?.size || [40, 40],
              label: node.style?.label || `设备 (${node.id})`,
              labelCfg: {
                position: "bottom",
                offset: [0, 5],
                style: {
                  fill: "#333",
                  fontSize: 12
                }
              }
            }
          };
          
          // 设置图标
          const deviceType = processedNode.data.deviceType;
          switch (deviceType) {
            case "pump": 
              processedNode.style.src = pump; // 使用JPG图片
              processedNode.style.label = node.style?.label || `泵 (${node.id})`;
              // 针对JPG格式图片调整尺寸，确保正确显示
              processedNode.style.size = [40, 40];
              break;
            case "valve": 
              processedNode.style.src = valve; // 使用JPG图片
              processedNode.style.label = node.style?.label || `阀 (${node.id})`;
              processedNode.style.size = [40, 40];
              break;
            case "chip": 
              processedNode.style.src = chip; // 使用JPG图片
              processedNode.style.label = node.style?.label || `加热芯片 (${node.id})`;
              processedNode.style.size = [40, 40];
              break;
            case "mfc": 
              processedNode.style.src = mfc; 
              processedNode.style.label = node.style?.label || `MFC控制器 (${node.id})`;
              break;
            case "light": 
              processedNode.style.src = light; 
              processedNode.style.label = node.style?.label || `光照控制 (${node.id})`;
              break;
            case "bottle": 
              processedNode.style.src = bottle; // 使用JPG图片
              processedNode.style.label = node.style?.label || `瓶 (${node.id})`;
              processedNode.style.size = [40, 40];
              break;
            default:
              // 如果没有匹配的图标，使用通用图标
              processedNode.style.src = bottle;
          }
          
          nodesData.push(processedNode);
        }
      }
      
      console.log("处理后的节点数据:", nodesData);
      
      // 添加节点到图表
      if (nodesData.length > 0) {
        graph.addNodeData(nodesData);
      } else {
        console.warn("没有有效的节点数据");
      }
      
      // 处理和添加边
      const edgesData = [];
      if (pathConfig.data && pathConfig.data.edges && Array.isArray(pathConfig.data.edges)) {
        for (const edge of pathConfig.data.edges) {
          if (!edge.source || !edge.target) continue;
          
          // 创建标准边数据
          const processedEdge = {
            id: edge.id || `edge-${Math.random().toString(36).substr(2, 9)}`,
            source: edge.source,
            target: edge.target,
            style: {
              stroke: '#91d5ff',
              lineWidth: 2,
              endArrow: {
                fill: '#91d5ff',
                stroke: '#91d5ff'
              }
            }
          };
          
          // 复制其他属性
          if (edge.style) {
            Object.assign(processedEdge.style, edge.style);
          }
          
          edgesData.push(processedEdge);
        }
      }
      
      console.log("处理后的边数据:", edgesData);
      
      // 添加边到图表
      if (edgesData.length > 0) {
        graph.addEdgeData(edgesData);
      }
      
      // 渲染图表
      try {
        console.log("开始渲染图表...");
        
        // 延迟渲染，等待DOM更新
        setTimeout(() => {
          graph.render();
          console.log("图表渲染完成");
          
          // 自动调整视图以适应所有元素
          if (nodesData.length > 0) {
            graph.fitView();
          }
          
          // 硬件图加载完成，初始化反应路径
          if (typeof onGraphLoaded === 'function') {
            onGraphLoaded();
          } else {
            console.log('✅ 图形加载完成，开始监听实时更新');
            // 图形加载完成后的初始化逻辑
            if (graph) {
              graph.render();
              console.log('📊 图形渲染完成，准备接收高亮数据');
            }
          }
        }, 100);
      } catch (renderError) {
        console.error("图表渲染失败:", renderError);
        errorMessage.value = `图表渲染失败: ${renderError.message}`;
      }
      
      // 更新当前选中的路径
      selectedPath.value = path;
      
      // 设置控制器索引
      if (pathConfig.controllerIndex !== undefined) {
        selectedControllerIndex.value = pathConfig.controllerIndex;
      }
    } catch (apiError) {
      console.error("从API加载路径失败:", apiError);
      errorMessage.value = `加载路径失败: ${apiError.message}`;
    }
  } catch (error) {
    console.error("加载硬件结构失败:", error);
    errorMessage.value = `加载硬件结构失败: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
};


// 向图中添加设备节点
const addDeviceToGraph = (device, iconSrc, label, x, y) => {
  if (!graph) {
    console.error("添加设备失败：图表未初始化");
    return;
  }
  
  console.log("添加设备到图中:", device, "位置:", x, y, "图标:", iconSrc);
  
  try {
    // 检查节点是否已存在
    const existingNode = graph.getNodeData().find(node => node.id === device.id);
    if (existingNode) {
      console.log(`节点 ${device.id} 已存在于图中，不重复添加`);
      
      // 更新节点外观以反映状态
      updateNodeAppearance(device.id, device.status);
      return;
    }
    
    // 要添加的节点数据
    const nodeData = {
      id: device.id,
      type: "image",
      data: {
        label: label,
        deviceType: device.type,
        nodeType: device.type,
        deviceData: device,
        // 记录图片格式信息
        imgFormat: ['pump', 'valve', 'chip', 'bottle'].includes(device.type) ? 'jpg' : 'svg'
      },
      style: {
        src: iconSrc,
        x: x,
        y: y,
        // 调整图片尺寸，确保JPG图片显示正确
        size: ['pump', 'valve', 'chip', 'bottle'].includes(device.type) ? [40, 40] : [40, 40],
        label: device.moduleMetadata 
          ? `${label} (${device.moduleMetadata.moduleName} #${device.moduleMetadata.moduleId})` 
          : `${label} (${device.id})`,
        labelCfg: {
          position: "bottom",
          offset: [0, 5],
          style: {
            fill: "#333",
            fontSize: 12
          }
        },
        cursor: "move",
        // 节点外观
        fill: "rgba(255, 255, 255, 0.9)",
        stroke: "#1890ff",
        lineWidth: 1,
        radius: 6,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowBlur: 5
      }
    };
    
    // 打印完整节点数据用于调试
    console.log("添加节点详细数据:", JSON.stringify(nodeData, null, 2));
    console.log("isDragEnabled", isDragEnabled.value);
    // 添加节点
    graph.addNodeData([nodeData]);
    
    // 确保拖拽行为正确
    updateDragBehavior();
    
    // 如果在创建模式下，记录此操作以支持撤销
    if (isCreateMode.value) {
      addToHistory({
        type: 'addNode',
        nodeId: device.id,
        nodeData: nodeData
      });
    }
    
    // 更新节点外观以反映状态
    updateNodeAppearance(device.id, device.status);
    
    // 确保渲染更新 - 这是关键步骤
    graph.render();
    
    console.log("节点添加成功，已渲染");
  } catch (error) {
    console.error("添加设备到图中失败:", error);
    errorMessage.value = `添加设备到图中失败: ${error.message}`;
  }
};

// 保存当前硬件结构
const saveCurrentPath = async () => {
  try {
    // 检查是否输入了名称
    if (!pathName.value.trim()) {
      errorMessage.value = "请输入硬件结构名称";
      return;
    }
    
    isLoading.value = true;
    
    // 获取当前图的数据
    const nodes = graph.getNodeData();
    const edges = graph.getEdgeData();
    
    console.log("正在保存硬件结构，节点数据:", nodes);
    console.log("正在保存硬件结构，边数据:", edges);
    
    // 修改nodes，保存完整的节点信息以便正确恢复
    const simplifiedNodes = nodes.map(node => {
      const deviceType = node.data?.deviceType || (node.id.split('-')[0]);
      
      // 需要保留的关键样式属性
      const style = {
        x: node.style?.x || 0,
        y: node.style?.y || 0,
        src: node.style?.src,
        size: node.style?.size,
        label: node.style?.label,
        labelCfg: node.style?.labelCfg,
        cursor: node.style?.cursor,
        fill: node.style?.fill,
        stroke: node.style?.stroke,
        lineWidth: node.style?.lineWidth,
        radius: node.style?.radius,
        shadowColor: node.style?.shadowColor,
        shadowBlur: node.style?.shadowBlur
      };
      
      return {
        id: node.id,
        type: node.type,
        data: {
          label: node.data?.label || "",
          deviceType: deviceType,
          nodeType: node.data?.nodeType || deviceType,
          deviceData: node.data?.deviceData
        },
        style: style
      };
    });
    
    // 处理图片路径问题，防止序列化错误
    const serializedNodes = fixImageSrcForSerialization(simplifiedNodes);
    
    console.log("处理后的节点数据:", serializedNodes);
    
    // 创建路径配置对象
    const pathConfig = {
      name: pathName.value,
      description: pathDescription.value || '',
      createdBy: 'user', // 可以从用户系统获取
      type: 'custom', // 使用自定义类型
      controllerIndex: selectedControllerIndex.value || 1,
      data: {
        nodes: serializedNodes,
        edges
      }
    };
    
    console.log("正在保存硬件结构，数据:", pathConfig);
    
    // 使用服务器的完整URL
    // 在开发环境中，需要指定后端服务器地址
    let baseUrl = '';
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000'; // 开发环境下的后端地址
    }
    
    // 调用API保存到服务器 - 使用新的API路径
    const response = await axios.post(`${baseUrl}/api/devices/path`, pathConfig);
    
    console.log("保存路径响应:", response);
    
    if (response.data.code === 0) {
      // 保存成功
      // 1. 更新当前编辑的路径
      const savedPath = response.data.data;
      currentEditPath.value = savedPath;
      selectedPath.value = savedPath;
      
      // 2. 更新路径列表
      let updatedPaths = [...savedPaths.value];
      const existingIndex = updatedPaths.findIndex(p => p.name === savedPath.name);
      
      if (existingIndex >= 0) {
        // 更新现有路径
        updatedPaths[existingIndex] = savedPath;
      } else {
        // 添加新路径
        updatedPaths.push(savedPath);
      }
      
      // 3. 保存到本地存储
      savedPaths.value = updatedPaths;
      localStorage.setItem('savedReactionPaths', JSON.stringify(updatedPaths));
      
      // 提示用户
      alert(`硬件结构 "${pathName.value}" 已保存成功!`);
      
      // 关闭对话框
      isShowPathNameDialog.value = false;
    } else {
      errorMessage.value = response.data.msg || "保存失败，请重试";
    }
  } catch (error) {
    console.error("保存硬件结构失败:", error);
    errorMessage.value = `保存失败: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
};



// 拖拽开始
const handleDragStart = (e, icon) => {
  draggedIcon = icon;
  e.dataTransfer.setData('text/plain', JSON.stringify({ type: icon.type }));
  e.dataTransfer.effectAllowed = 'copy';
};

// 拖拽结束
const handleDragEnd = () => {
  draggedIcon = null;
};

// 处理节点点击，用于连线
const handleNodeClick = e => {
  if (!isEdgeMode.value) return;

  // 打印关键信息而非整个事件对象，避免循环引用问题
  console.log("点击节点事件:", {
    type: e.type,
    target: e.target ? { type: e.target.type } : null,
    item: e.item ? { id: e.item.id, type: e.item.type } : null,
    itemId: e.itemId
  });

  // G6 v5中，节点ID可能在不同位置
  let nodeId = null;

  // 尝试不同路径获取节点ID
  if (e.itemId) {
    nodeId = e.itemId;
  } else if (e.item && e.item.id) {
    nodeId = e.item.id;
  } else if (e.target && e.target.get && typeof e.target.get === "function") {
    try {
      nodeId = e.target.get("id");
    } catch (err) {
      console.log("获取target.id失败:", err);
    }
  } else if (
    e.currentTarget &&
    e.currentTarget.get &&
    typeof e.currentTarget.get === "function"
  ) {
    try {
      nodeId = e.currentTarget.get("id");
    } catch (err) {
      console.log("获取currentTarget.id失败:", err);
    }
  }

  console.log("获取到的节点ID:", nodeId);

  if (!nodeId) {
    console.error("无法获取节点ID");
    // 尝试直接从原始节点数据获取ID
    if (e.item && e.item.getModel) {
      try {
        const model = e.item.getModel();
        nodeId = model.id;
        console.log("从model获取到ID:", nodeId);
      } catch (err) {
        console.log("获取model失败:", err);
      }
    }

    if (!nodeId) return;
  }

  // 若还没选中源节点，则将当前点击节点设为源节点
  if (!sourceNode.value) {
    sourceNode.value = nodeId;
    // 高亮源节点 - 使用G6 v5中的正确方法
    graph.updateNodeData([
      {
        id: nodeId,
        style: {
          fill: "#1890ff",
          stroke: "#096dd9"
        }
      }
    ]);
  } else if (sourceNode.value !== nodeId) {
    // 已选中源节点，且当前点击了不同的节点，创建连线
    const edgeId = `edge-${Date.now()}`;

    // 边数据
    const edgeData = {
      id: edgeId,
      source: sourceNode.value,
      target: nodeId,
      data: {
        label: "", // 可选: 添加边标签
        weight: 1
      },
      style: {
        stroke: "#1890ff",
        lineWidth: 2,
        endArrow: true
      }
    };

    // 添加边 - 按照最新G6文档的方式
    graph.addEdgeData([edgeData]);
    
    // 记录添加边的操作
    if (isCreateMode.value) {
      addToHistory({
        type: 'addEdge',
        edgeId: edgeId,
        edgeData: edgeData
      });
    }

    // 取消源节点的高亮 - 使用G6 v5中的正确方法
    graph.updateNodeData([
      {
        id: sourceNode.value,
        style: {
          fill: "#91d5ff", // 恢复默认颜色
          stroke: "#40a9ff"
        }
      }
    ]);

    // 重置源节点
    sourceNode.value = null;

    // 渲染更新
    graph.render();
  }
};

// 从后端获取设备信息
const fetchDeviceInfo = async (deviceId) => {
  if (!deviceId) {
    console.warn("无效的设备ID");
    return null;
  }
  
  console.log("获取设备信息:", deviceId);
  
  try {
    // 尝试从缓存获取设备类型
    let deviceType = null;
    
    // 从设备ID推断类型
    if (deviceId.includes("pump")) {
      deviceType = "pump";
    } else if (deviceId.includes("valve")) {
      deviceType = "valve";
    } else if (deviceId.includes("chip")) {
      deviceType = "chip";
    } else if (deviceId.includes("mfc")) {
      deviceType = "mfc";
    } else if (deviceId.includes("light")) {
      deviceType = "light";
    }
    
    // 首先尝试通过WebSocket获取设备信息
    if (wsConnected.value) {
      console.log("尝试通过WebSocket获取设备信息");
      const deviceInfoPromise = new Promise((resolve, reject) => {
        // 设置超时
        const timeout = setTimeout(() => {
          console.warn("WebSocket获取设备信息超时");
          resolve(null); // 超时时返回null
        }, 3000);
        
        // 创建一次性的消息监听器
        let messageHandler = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("收到WebSocket消息:", data);
            
            // 如果是设备信息响应或错误响应
            if (data.type === 'deviceInfo' && data.data && data.data.id === deviceId) {
              clearTimeout(timeout);
              ws.value.removeEventListener('message', messageHandler);
              console.log("成功获取到设备信息:", data.data);
              resolve(data.data);
            } else if (data.type === 'error' && data.data && data.data.message && data.data.message.includes(deviceId)) {
              console.warn("WebSocket返回错误:", data.data);
              clearTimeout(timeout);
              ws.value.removeEventListener('message', messageHandler);
              
              // 如果是"设备不存在"错误，尝试注册设备
              if (data.data.message.includes("不存在") && deviceType) {
                console.log(`设备 ${deviceId} 不存在`);
                // 返回默认数据
                resolve(null);
              } else {
                // 其他错误则返回null
                resolve(null);
              }
            }
          } catch (error) {
            console.error("解析WebSocket消息失败:", error);
            ws.value.removeEventListener('message', messageHandler);
            clearTimeout(timeout);
            resolve(null);
          }
        };
        
        // 添加临时消息监听
        if (ws.value) {
          ws.value.addEventListener('message', messageHandler);
        }
        
        // 发送WebSocket消息获取设备信息
        const success = sendWsMessage({
          type: 'getDeviceInfo', // 使用正确的消息类型
          payload: { id: deviceId }
        });
        
        if (!success) {
          console.warn("WebSocket消息发送失败");
          clearTimeout(timeout);
          if (ws.value) {
            ws.value.removeEventListener('message', messageHandler);
          }
          resolve(null);
        }
        
        // 在超时后移除监听器
        setTimeout(() => {
          if (ws.value) {
            ws.value.removeEventListener('message', messageHandler);
          }
        }, 3000);
      });
      
      const deviceInfo = await deviceInfoPromise;
      if (deviceInfo) {
        return deviceInfo;
      }
    }
    // 如果失败，使用默认值
    console.log(`无法从后端获取设备 ${deviceId} 的信息，使用默认值`);
    
    // 如果无法确定设备类型，返回null
    console.warn("无法确定设备类型，无法创建默认信息");
    return null;
  } catch (error) {
    console.error("获取设备信息失败:", error);
    return null;
  }
};

// 处理设备点击事件
const handleDeviceClick = async (e) => {
  try {
    // 连线模式下使用原来的点击逻辑
    if (isEdgeMode.value) {
      handleNodeClick(e);
      return;
    }

    // 获取节点ID
    let nodeId = null;
    if (e.itemId) {
      nodeId = e.itemId;
    } else if (e.item && e.item.id) {
      nodeId = e.item.id;
    } else if (e.target && e.target.get && typeof e.target.get === "function") {
      try {
        nodeId = e.target.get("id");
      } catch (err) {
        console.log("获取target.id失败:", err);
      }
    }

    if (!nodeId) {
      console.warn("无法获取节点ID，取消处理设备点击");
      return;
    }

    // 使用新的selectDevice函数处理设备选择
    selectDevice(nodeId);
  } catch (error) {
    console.error("处理设备点击失败:", error);
    errorMessage.value = `处理设备点击失败: ${error.message}`;
  }
};

// 更新节点外观以反映设备状态
const updateNodeAppearance = (nodeId, status) => {
  console.log('!!!!!!!!!!!!更新节点外观:', nodeId, status);
  if (!graph) return;
  
  // 🔧 过滤掉非设备ID的调用
  if (!nodeId || typeof nodeId !== 'string') {
    console.warn('⚠️ 无效的节点ID:', nodeId);
    return;
  }
  
  // 🔧 过滤掉步骤名称等非设备ID
  if (nodeId.includes('执行步骤') || nodeId.includes(':') || nodeId.length > 50) {
    console.warn('⚠️ 跳过非设备ID的节点更新:', nodeId);
    return;
  }
  
  // 🔧 检查节点是否存在于图中
  try {
    const allNodes = graph.getNodeData();
    const nodeExists = allNodes.some(node => node.id === nodeId);
    
    if (!nodeExists) {
      console.warn('⚠️ 节点在图中不存在，跳过更新:', nodeId);
      return;
    }
  } catch (checkError) {
    console.warn('⚠️ 检查节点存在性失败:', checkError);
    return;
  }
  
  try {
    let strokeColor = "#1890ff"; // 默认边框颜色
    let shadowColor = "rgba(0,0,0,0.1)"; // 默认阴影颜色
    
    // 根据状态设置样式
    switch (status) {
      case "running":
      case "open":
      case "heating":
        strokeColor = "#67c23a"; // 绿色
        shadowColor = "rgba(103, 194, 58, 0.3)";
        break;
      case "stopped":
      case "closed":
      case "idle":
        strokeColor = "#909399"; // 灰色
        shadowColor = "rgba(144, 147, 153, 0.3)";
        break;
      case "error":
        strokeColor = "#f56c6c"; // 红色
        shadowColor = "rgba(245, 108, 108, 0.3)";
        break;
      case "cooling":
        strokeColor = "#1890ff"; // 蓝色
        shadowColor = "rgba(24, 144, 255, 0.3)";
        break;
    }
    
    // 更新节点样式
    graph.updateNodeData([
      {
        id: nodeId,
        style: {
          stroke: strokeColor,
          shadowColor: shadowColor,
          shadowBlur: 10
        }
      }
    ]);
    graph.render();
    console.log('✅ 节点外观更新成功:', nodeId);
  } catch (error) {
    console.error("更新节点外观失败:", error);
  }
};

// 控制面板显示状态
const showControlPanel = ref(false);

// 关闭控制面板
const closeControlPanel = () => {
  showControlPanel.value = false;
  selectedDevice.value = null;
  // 重置控制参数对象
  controlParams.value = {};
};

// 控制拖拽功能启用/禁用
const updateDragBehavior = () => {
  if (!graph) return;

  // 使用计算属性来决定是否启用拖拽
  const enableDrag = isDragEnabled.value;

  try {
    // 更新拖拽节点行为
    graph.updateBehavior({
      key: "drag-node",
      enable: enableDrag
    });

    // 更新节点选择行为
    graph.updateBehavior({
      key: "click-select",
      enable: enableDrag
    });
    
    // 更新鼠标样式提示
    if (container.value) {
      container.value.style.cursor = enableDrag ? "default" : "not-allowed";
    }
    
    console.log(`拖拽行为已${enableDrag ? '启用' : '禁用'}, 创建模式: ${isCreateMode.value}`);
  } catch (err) {
    console.error("更新拖拽行为失败:", err);
  }
};

// 监听拖拽启用状态变化
watch(isDragEnabled, () => {
  updateDragBehavior();
});

// 切换连线模式
const toggleEdgeMode = () => {
  isEdgeMode.value = !isEdgeMode.value;

  if (!isEdgeMode.value) {
    // 退出连线模式时，如果有高亮的节点，取消高亮
    if (sourceNode.value) {
      // 使用G6 v5中的正确方法恢复节点样式
      graph.updateNodeData([
        {
          id: sourceNode.value,
          style: {
            fill: "#91d5ff", // 恢复默认颜色
            stroke: "#40a9ff"
          }
        }
      ]);
    }
    // 清空选中的源节点
    sourceNode.value = null;
  }

  // 更新鼠标样式和拖拽行为
  if (graph) {
    if (isEdgeMode.value) {
      // 进入连线模式，修改画布样式
      container.value.style.cursor = "crosshair";

      // 禁用拖拽节点行为
      graph.updateBehavior({
        key: "drag-node",
        enable: false
      });
    } else {
      // 退出连线模式时，调用updateDragBehavior
      // 这将根据侧边栏状态和管理员状态决定是否启用拖拽
      updateDragBehavior();
    }
  }
};

// 定时刷新设备数据
let refreshInterval = null;

// 启动定时刷新
const startDeviceDataRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(async () => {
    // 如果当前有选中的设备，刷新其数据
    if (selectedDevice.value && showControlPanel.value) {
      try {
        const updatedDevice = await fetchDeviceInfo(selectedDevice.value);
        if (updatedDevice) {
          // 只更新设备状态数据，不影响控制参数
          deviceData.value = updatedDevice;
          // 同时更新节点外观
          updateNodeAppearance(selectedDevice.value, updatedDevice.status);
        }
      } catch (error) {
        console.error("刷新设备数据失败:", error);
      }
    }
  }, 3000); // 每3秒刷新一次
};

// 停止定时刷新
const stopDeviceDataRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};


// WebSocket连接状态
const wsConnected = ref(false);
const ws = ref(null);

// 调整图形大小的函数
const resizeGraph = () => {
  if (!graph || !container.value) return;
  
  const width = container.value.clientWidth;
  const height = container.value.clientHeight || 600;
  
  graph.setSize([width, height]);
  graph.render();
  console.log(`调整图形大小至 ${width}x${height}`);
};

// 修改WebSocket连接成功后的处理
const handleWsOpen = () => {
  console.log('WebSocket连接已建立');
  wsConnected.value = true;
  
  // 发送验证信息
  if (localStorage.token) {
    const authMessage = {
      type: 'authenticate',
      token: localStorage.token
    };
    sendWsMessage(authMessage);
  }
  
  // 连接成功后自动获取硬件状态
  setTimeout(() => {
    sendWsMessage({
      type: 'getHardwareStatus'
    });
    
    // 同时获取所有设备列表
    sendWsMessage({
      type: 'getDevices'
    });
  }, 500);
};

// 连接WebSocket服务器
const connectWebSocket = async () => {
  try {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      console.log('WebSocket已连接');
      return;
    }
    
    // 关闭之前的连接
    if (ws.value) {
      manualClose.value = true;
      ws.value.close();
    }
    
    manualClose.value = false;
    
    console.log("尝试连接WebSocket服务器...");
    // 确定WebSocket连接地址
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'ws://localhost:3000'
      : window.location.origin.replace(/^http/, 'ws');
    const wsUrl = `${baseUrl}/api/devices/realtime`;
    
    ws.value = new WebSocket(wsUrl);
    
    ws.value.onopen = handleWsOpen;
    
    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('收到WebSocket消息:', data);
        handleWsMessage(data);
      } catch (error) {
        console.error('WebSocket消息解析错误:', error);
      }
    };
    
    ws.value.onclose = (event) => {
      console.log('WebSocket连接已关闭', event.code, event.reason);
      wsConnected.value = false;

      // 如果不是用户主动关闭，则尝试重连
      if (!manualClose.value) {
        console.log("尝试重新连接...");
        setTimeout(connectWebSocket, 5000);
      }
    };

    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error);
      wsConnected.value = false;
      errorMessage.value = '无法连接到WebSocket服务器';
    };
  } catch (error) {
    console.error('创建WebSocket实例失败:', error);
    wsConnected.value = false;
    errorMessage.value = `创建WebSocket连接失败: ${error.message}`;
  }
};


// 更新设备状态
const updateDeviceStatus = (deviceData) => {
  // 首先更新全局设备仓库
  if (deviceData.id) {
    // 如果设备已存在，合并数据；否则添加新设备
    if (globalDevices.value.has(deviceData.id)) {
      const existingDevice = globalDevices.value.get(deviceData.id);
      
      // 检查是否有该设备的待发送更改
      const deviceKey = `${deviceData.type}_${deviceData.id}`;
      
      // 合并设备数据，但保留待发送的本地修改
      const updatedDevice = {...existingDevice, ...deviceData};
      
      globalDevices.value.set(deviceData.id, updatedDevice);
    } else {
      globalDevices.value.set(deviceData.id, deviceData);
    }
    
    // 更新图上的设备节点状态
    if (graph) {
      const node = graph.findById(deviceData.id);
      if (node) {
        // 更新节点状态
        graph.updateItem(node, {
          status: deviceData.status,
          ...deviceData
        });
      }
    }
    
    // 如果是当前选中的设备，从全局仓库获取最新数据更新控制面板
    if (selectedDevice.value === deviceData.id) {
      const updatedDeviceData = globalDevices.value.get(deviceData.id);
      // 深拷贝确保控制面板数据独立
      deviceData.value = JSON.parse(JSON.stringify(updatedDeviceData));
    }
  }
};

// 发送WebSocket消息
const sendWsMessage = (message) => {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    try {
      const messageStr = JSON.stringify(message);
      ws.value.send(messageStr);
      console.log("已发送WebSocket消息:", message);
      
      // 如果是设备控制命令，记录到全局设备仓库中以保持UI一致性
      if (message.type === 'updateDeviceParameters' && message.payload) {
        const commands = Array.isArray(message.payload) ? message.payload : [message.payload];
        
        commands.forEach(command => {
          if (command.id && globalDevices.value.has(command.id)) {
            // 根据命令更新全局设备状态
            const device = globalDevices.value.get(command.id);
            const updatedDevice = {...device};
            
            // 根据命令类型预测设备状态变化
            switch (command.action) {
              case 'start':
                updatedDevice.status = 'running';
                break;
              case 'stop':
                updatedDevice.status = 'idle';
                break;
              case 'setPosition':
                if (command.parameters && command.parameters.position !== undefined) {
                  updatedDevice.position = command.parameters.position;
                }
                break;
              case 'setTemp':
                if (command.parameters) {
                  if (command.parameters.temperature !== undefined) {
                    updatedDevice.targetTemp = command.parameters.temperature;
                    updatedDevice.status = 'heating';
                  }
                  if (command.parameters.speed !== undefined) {
                    updatedDevice.heatingSpeed = command.parameters.speed;
                  }
                }
                break;
              case 'setFlowRate':
                if (command.parameters && command.parameters.flowRate !== undefined) {
                  updatedDevice.flowRate = command.parameters.flowRate;
                }
                break;
              case 'setIntensity':
                if (command.parameters && command.parameters.intensity !== undefined) {
                  updatedDevice.intensity = command.parameters.intensity;
                }
                break;
              // 可以添加更多命令类型
            }
            
            // 更新参数
            if (command.parameters) {
              // 将命令参数合并到设备数据中
              Object.assign(updatedDevice, command.parameters);
            }
            
            // 更新全局设备仓库
            globalDevices.value.set(command.id, updatedDevice);
            
            // 如果是当前选中的设备，更新控制面板
            if (selectedDevice.value === command.id) {
              deviceData.value = JSON.parse(JSON.stringify(updatedDevice));
            }
            
            // 更新设备节点外观
            updateNodeAppearance(command.id, updatedDevice.status);
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error("发送WebSocket消息失败:", error);
      return false;
    }
  } else {
    console.warn("WebSocket未连接，无法发送消息，当前状态:", ws.value ? ws.value.readyState : "无WebSocket实例");
    return false;
  }
};



// 是否手动关闭WebSocket连接
const manualClose = ref(false);

// 处理WebSocket消息
const handleWsMessage = (data) => {
  if (!data || !data.type) return;
  
  
  switch (data.type) {
    case 'connection':
      console.log("WebSocket连接成功:", data.data);
      break;
      
    case 'devices':
      // 收到所有设备列表
      if (data.data && Array.isArray(data.data)) {
        // 更新全局设备仓库
        data.data.forEach(device => {
          globalDevices.value.set(device.id, device);
        });
        console.log(`全局设备仓库已更新，共 ${globalDevices.value.size} 个设备`);
        
        // 如果已有选中的路径，加载设备到图中
        if (selectedPath.value) {
          (selectedPath.value);
        }
      }
      break;
      
    case 'deviceInfo':
      // 设备信息响应 - 单个设备的详细信息
      console.log("收到设备信息:", data.data);
      if (data.data && data.data.id) {
        // 更新设备节点外观
        updateDeviceOnGraph(data.data);
        
        // 如果是当前选中设备，更新控制面板
        if (selectedDevice.value === data.data.id) {
          deviceData.value = data.data;
        }
      }
      break;
      
    // 🎯 新增：处理运行任务状态消息
    case 'runningTasks':
      // 收到运行中任务列表
      console.log("收到运行任务列表:", data.data);
      if (data.data && Array.isArray(data.data)) {
        updateRunningTasks(data.data);
      }
      break;
      
    case 'taskStatusUpdate':
      // 收到任务状态更新
      console.log("收到任务状态更新:", data.data);
      if (data.data) {
        updateSingleTaskStatus(data.data);
      }
      break;
      
    case 'deviceStatusUpdate':
      // 收到设备状态更新
      console.log("收到设备状态更新:", data.data);
      if (data.data && data.data.deviceId) {
        updateRunningDeviceStatus(data.data);
      }
      break;
      
    case 'commandResult':
      // 命令执行结果
      console.log("命令执行结果:", data.data);
      if (data.data && data.data.success) {
        // 命令成功，根据命令类型和参数更新本地设备状态
        const command = data.data.command;
        if (command && command.id) {
          // 如果命令中包含了更新后的设备数据，直接使用
          if (data.data.deviceData) {
            updateDeviceOnGraph(data.data.deviceData);
            
            // 如果是当前选中的设备，更新控制面板
            if (selectedDevice.value === command.id) {
              deviceData.value = data.data.deviceData;
            }
          } 
          // 否则，根据命令类型预测状态变化
          else if (command.type && command.action) {
            // 获取当前设备数据的副本
            let updatedDevice = null;
            
            // 如果是当前选中的设备，从deviceData中获取
            if (selectedDevice.value === command.id) {
              updatedDevice = { ...deviceData.value };
            } 
            // 否则尝试从图中获取
            else {
              try {
                const node = graph?.getNodeData?.(command.id);
                if (node && node.data && node.data.deviceData) {
                  updatedDevice = { ...node.data.deviceData };
                }
      } catch (err) {
                console.log("获取node数据失败:", err);
              }
            }
            
            // 如果找到了设备数据，根据命令更新状态
            if (updatedDevice) {
              // 根据命令类型和动作更新设备状态
              switch (command.type) {
                case 'pump':
                  switch (command.action) {
                    case 'start':
                      updatedDevice.status = 'running';
                      break;
                    case 'stop':
                      updatedDevice.status = 'stopped';
                      break;
                    case 'setSpeed':
                      if (command.parameters && command.parameters.speed !== undefined) {
                        updatedDevice.speed = command.parameters.speed;
                        updatedDevice.flowRate = (command.parameters.speed / 100) * 5; // 假设最大流速为5mL/min
                      }
                      break;
                  }
                  break;
                  
                case 'valve':
                  switch (command.action) {
                    case 'open':
                      updatedDevice.status = 'open';
                      updatedDevice.position = 100;
                      break;
                    case 'close':
                      updatedDevice.status = 'closed';
                      updatedDevice.position = 0;
                      break;
                    case 'setPosition':
                      if (command.parameters && command.parameters.position !== undefined) {
                        updatedDevice.position = command.parameters.position;
                        if (updatedDevice.position > 0) {
                          updatedDevice.status = 'open';
                        } else {
                          updatedDevice.status = 'closed';
                        }
                      }
                      break;
                  }
                  break;
                  
                case 'chip':
                  switch (command.action) {
                    case 'powerOn':
                      updatedDevice.status = 'heating';
                      updatedDevice.power = 50; // 默认50%功率
                      break;
                    case 'powerOff':
                      updatedDevice.status = 'idle';
                      updatedDevice.power = 0;
                      break;
                    case 'setTemp':
                      if (command.parameters && command.parameters.temperature !== undefined) {
                        updatedDevice.targetTemp = command.parameters.temperature;
                        if (updatedDevice.targetTemp > updatedDevice.currentTemp) {
                          updatedDevice.status = 'heating';
                        } else if (updatedDevice.targetTemp < updatedDevice.currentTemp) {
                          updatedDevice.status = 'cooling';
                        }
                      }
                      break;
                  }
                  break;
                  
                case 'mfc':
                  switch (command.action) {
                    case 'start':
                      updatedDevice.status = 'running';
                      break;
                    case 'stop':
                      updatedDevice.status = 'stopped';
                      break;
                    case 'setFlow':
                      if (command.parameters && command.parameters.flowRate !== undefined) {
                        updatedDevice.flowRate = command.parameters.flowRate;
                        if (updatedDevice.flowRate > 0) {
                          updatedDevice.status = 'running';
                        } else {
                          updatedDevice.status = 'stopped';
                        }
                      }
                      break;
                  }
                  break;
                  
                case 'light':
                  switch (command.action) {
                    case 'on':
                      updatedDevice.status = 'on';
                      break;
                    case 'off':
                      updatedDevice.status = 'off';
                      break;
                    case 'setIntensity':
                      if (command.parameters && command.parameters.intensity !== undefined) {
                        updatedDevice.intensity = command.parameters.intensity;
                        if (updatedDevice.intensity > 0) {
                          updatedDevice.status = 'on';
                        } else {
                          updatedDevice.status = 'off';
                        }
                      }
                      break;
                  }
                  break;
              }
              
              // 更新图上的设备状态
              updateDeviceOnGraph(updatedDevice);
              
              // 如果是当前选中设备，更新控制面板
              if (selectedDevice.value === command.id) {
                deviceData.value = updatedDevice;
              }
            }
          }
        }
      }
      isLoading.value = false;
      break;
      
    case 'parameterUpdateResults':
      // 批量参数更新结果
      console.log("收到参数更新结果:", data.data);
      
      // 处理批量结果
      if (data.data) {
        // 使用后端提供的统计数据
        const { results, totalCommands, successCount, failedCount, message, actualSentCommands } = data.data;
        
        // 如果有消息字段，说明是特殊情况（如所有参数都是最新状态）
        if (message) {
          console.log(message);
          // 显示信息提示
          ElMessage.info(message);
          isLoading.value = false;
          return;
        }
        
        // 处理每个设备的更新结果
        if (Array.isArray(results)) {
          const errorMessages = [];
          
          // 处理每个设备的更新结果
          results.forEach(result => {
            if (result.success) {
              // 如果包含了更新后的设备数据，直接使用
              if (result.deviceData) {
                // 更新全局设备仓库
                if (result.deviceData.id) {
                  globalDevices.value.set(result.deviceData.id, result.deviceData);
                }
                
                // 更新设备节点外观
                updateDeviceOnGraph(result.deviceData);
                
                // 如果是当前选中的设备，更新控制面板
                if (selectedDevice.value === result.deviceData.id) {
                  deviceData.value = result.deviceData;
                }
              }
              // 否则使用设备ID从全局仓库获取并预测更新
              else if (result.id) {
                // 尝试从全局设备仓库获取设备
                if (globalDevices.value.has(result.id)) {
                  const device = globalDevices.value.get(result.id);
                  
                  // 更新全局设备仓库 - 这里不做具体更改，等待后端推送最新状态
                  // 只是标记设备状态有变化
                  const updatedDevice = { ...device, _updated: true };
                  globalDevices.value.set(result.id, updatedDevice);
                  
                  // 更新设备节点外观
                  updateDeviceOnGraph(updatedDevice);
                  
                  // 如果是当前选中的设备，更新控制面板
                  if (selectedDevice.value === result.id) {
                    deviceData.value = updatedDevice;
                  }
                }
              }
            } else {
              // 更新失败，收集错误消息
              if (result.error) {
                errorMessages.push(`${result.id || '未知设备'}: ${result.error}`);
              }
            }
          });
          
          // 显示结果通知
          if (failedCount === 0) {
            // 全部成功
            if (actualSentCommands < totalCommands) {
              // 有些命令被优化掉了（参数无变化）
              ElMessage.success(`已成功更新${successCount}个设备参数，${totalCommands - actualSentCommands}个无需更新`);
            } else {
              // 所有命令都发送了
              ElMessage.success(`已成功更新${successCount}个设备参数`);
            }
          } else {
            // 有失败的情况
            console.error(`${failedCount}个参数更新失败，${successCount}个成功`);
            
            // 显示详细错误信息
            if (errorMessages.length > 0) {
              const errorMsg = errorMessages.length > 3 
                ? `${errorMessages.slice(0, 3).join('\n')}...等${errorMessages.length}个错误` 
                : errorMessages.join('\n');
              ElMessage.error(`参数更新失败: ${errorMsg}`);
              errorMessage.value = `参数更新失败: ${errorMsg}`;
            } else {
              ElMessage.error(`${failedCount}个参数更新失败，${successCount}个成功`);
              errorMessage.value = `${failedCount}个参数更新失败，${successCount}个成功`;
            }
          }
        }
      }
      
      // 重置加载和发送状态
      isLoading.value = false;
      
      
      break;
      
    case 'error':
      // 错误消息
      console.error("服务器错误:", data.data);
      errorMessage.value = data.data.message;
      isLoading.value = false;
      break;

    case 'hardwareConnection':
      // 硬件连接状态
      isHardwareConnecting.value = false;
      if (data.data.success) {
        console.log("已连接到硬件:", data.data.ipAddress || data.data.portPath);
        isHardwareConnected.value = true;
        hardwareErrorMessage.value = '';
        ElMessage.success('硬件设备连接成功');
      } else {
        const errorMsg = data.data.error || '无法连接硬件设备';
        console.error("硬件连接失败:", errorMsg);
        hardwareErrorMessage.value = errorMsg;
        isHardwareConnected.value = false;
        ElMessage.error(`硬件连接失败: ${errorMsg}`);
      }
      isLoading.value = false;
      break;
      
    case 'serverStatus':
      // 服务器状态信息
      console.log("服务器状态:", data.data);
      isHardwareConnected.value = data.data.connected;
      if (!data.data.connected) {
        hardwareIP.value = data.data.lastIpAddress || '192.168.1.14';
      }
      break;
      
    case 'hardwareStatus':
      // 硬件连接状态信息
      console.log("硬件状态:", data.data);
      isHardwareConnected.value = data.data.connected;
      isHardwareConnecting.value = false;
      
      // 如果已连接到硬件，更新UI状态
      if (data.data.connected) {
        console.log('已成功连接到硬件');
        hardwareErrorMessage.value = '';
        // 如果有IP地址信息，更新显示
        if (data.data.ip) {
          hardwareIP.value = data.data.ip;
        }
        
        // 显示成功通知（但避免频繁通知）
        if (isHardwareConnecting.value) {
          ElMessage.success('成功连接到硬件设备');
        }
      } else {
        console.warn('未连接到硬件');
        // 如果有失败原因，显示
        if (data.data.error) {
          hardwareErrorMessage.value = data.data.error;
          
          // 如果正在连接中，才显示错误通知
          if (isHardwareConnecting.value) {
            ElMessage.error(`连接硬件失败: ${data.data.error}`);
          }
        }
      }
      
      // 无论如何都结束连接状态
      isHardwareConnecting.value = false;
      break;
      
    case 'deviceStatus':
      // 来自硬件的设备状态数据
      console.log(`收到来自控制器${data.controllerId}的设备状态更新:`, data.devices);
      
      // 更新设备状态
      if (data.devices && Array.isArray(data.devices)) {
        data.devices.forEach(device => {
          updateDeviceStatus(device);
        });
      }
      break;
      
    default:
      console.warn("未知的WebSocket消息类型:", data.type);
      break;
  }
};

// 🎯 智能自动加载第一个可用的自定义结构
const autoLoadFirstAvailableStructure = async (forceReload = false) => {
  try {
    console.log('🎯 开始智能加载第一个可用的自定义结构...');
    
    const now = Date.now();
    
    // 🎯 检查是否需要加载
    if (!forceReload && graphInitialized.value && lastStructureLoaded.value) {
      const timeSinceLastLoad = now - structureLoadCooldown.value;
      if (timeSinceLastLoad < STRUCTURE_RELOAD_COOLDOWN) {
        console.log(`📋 图形已初始化且在冷却期内（${Math.round(timeSinceLastLoad/1000)}秒前加载），跳过重复加载`);
        return;
      }
    }
    
    // 确保已经加载了保存的路径列表
    if (savedPaths.value.length === 0) {
      console.log('📋 路径列表为空，重新加载...');
      await loadSavedPaths();
    }
    
    // 检查是否有可用的自定义结构
    if (savedPaths.value.length === 0) {
      console.warn('⚠️ 没有可用的自定义结构');
      errorMessage.value = '没有可用的自定义结构，请先创建硬件结构';
      return;
    }
    
    // 选择第一个自定义结构
    const firstPath = savedPaths.value[0];
    
    // 🎯 检查是否是相同的结构
    if (!forceReload && lastStructureLoaded.value === firstPath.id) {
      console.log(`📋 相同结构已加载（${firstPath.name}），跳过重复加载`);
      return;
    }
    
    console.log('🎯 加载自定义结构:', firstPath.name);
    
    // 加载这个结构
    await loadStructureFromFile(firstPath);
    
    // 🎯 更新状态
    graphInitialized.value = true;
    lastStructureLoaded.value = firstPath.id;
    structureLoadCooldown.value = now;
    
    console.log('✅ 自定义结构加载完成');
    
    // 清除可能的错误信息
    errorMessage.value = '';
    
  } catch (error) {
    console.error('❌ 自动加载第一个自定义结构失败:', error);
    errorMessage.value = `自动加载结构失败: ${error.message}`;
  }
};

// 加载保存的硬件结构列表
const loadSavedPaths = async () => {
  try {
    isLoading.value = true;
    
    // 确定API基础URL
    let baseUrl = '';
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000'; // 开发环境下的后端地址
    }
    
    // 从后端API获取自定义硬件结构列表
    console.log("从后端API获取硬件结构列表...");
    try {
      const response = await axios.get(`${baseUrl}/api/devices/path`);
      
      if (response.data.code === 0 && response.data.data) {
        // 更新保存的路径列表
        savedPaths.value = response.data.data;
        console.log("从API加载了", savedPaths.value.length, "个保存的硬件结构");
        
        // 更新localStorage
        localStorage.setItem('savedReactionPaths', JSON.stringify(savedPaths.value));
      } else {
        console.warn("API返回错误或无效数据:", response.data);
        
        // 尝试从localStorage加载作为备用
        loadFromLocalStorage();
      }
    } catch (apiError) {
      console.error("从API加载路径列表失败:", apiError);
      errorMessage.value = `无法从服务器加载硬件结构列表: ${apiError.message}`;
      
      // 尝试从localStorage加载作为备用
      loadFromLocalStorage();
    }
  } catch (error) {
    console.error("加载保存的硬件结构列表失败:", error);
    
    // 重置为空数组，确保UI不会崩溃
    savedPaths.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 从本地存储加载硬件结构列表
const loadFromLocalStorage = () => {
  // 从localStorage加载
  const savedPathsJson = localStorage.getItem('savedReactionPaths');
  if (savedPathsJson) {
    try {
      savedPaths.value = JSON.parse(savedPathsJson);
      console.log("从本地存储加载了", savedPaths.value.length, "个保存的硬件结构");
    } catch (parseError) {
      console.error("解析本地存储的路径列表失败:", parseError);
      // 如果JSON解析失败，重置为空数组
      savedPaths.value = [];
      localStorage.removeItem('savedReactionPaths');
    }
  } else {
    savedPaths.value = [];
  }
};


// 组件挂载完成后初始化图表
onMounted(async () => {
  try {
    console.log("组件挂载完成");

    
    
    // 初始化G6 v5图
    const graphWidth = container.value.clientWidth;
    const graphHeight = container.value.clientHeight || 600;
    
    console.log(`初始化图形，尺寸: ${graphWidth}x${graphHeight}`);
    console.log("isDragEnabled", isDragEnabled.value);
    
    // 创建图形实例
    graph = new Graph({
      container: container.value,
      width: graphWidth,
      height: graphHeight,
      behaviors: [
        {
          type: 'drag-canvas',
          key: 'drag-canvas',
          enable: false // 禁用画布拖拽，避免与节点拖拽冲突
        },
        {
          type: 'zoom-canvas',
          sensitivity: 1.5, // 配置灵敏度
          key: 'zoom-canvas',
          enable: true
        },
        {
          type: 'click-select',
          key: 'click-select',
          enable: true
        },
        {
          type: 'drag-element', // 节点拖拽行为
          key: 'drag-element',
          enable: true, // 始终启用节点拖拽
          shouldBegin: (e) => {
            // 只在创建模式下允许拖拽节点
            return isCreateMode.value && isAdmin.value;
          },
          shouldUpdate: (e) => {
            // 记录拖拽开始位置
            if (e.type === 'dragstart') {
              const nodeId = e.item.get('id');
              if (nodeId) {
                const nodeData = graph.getNodeData(nodeId);
                if (nodeData && nodeData.style) {
                  dragInfo.isDragging = true;
                  dragInfo.nodeId = nodeId;
                  dragInfo.startPosition = { 
                    x: parseFloat(nodeData.style.x) || 0, 
                    y: parseFloat(nodeData.style.y) || 0 
                  };
                  console.log(`拖拽开始，记录节点 ${nodeId} 初始位置:`, dragInfo.startPosition);
                }
              }
            }
            // 总是允许更新
            return true;
          },
          onEnd: (e) => {
            // 拖拽结束时记录历史
            if (dragInfo.isDragging && dragInfo.nodeId) {
              const nodeData = graph.getNodeData(dragInfo.nodeId);
              if (nodeData && nodeData.style) {
                const finalPosition = {
                  x: parseFloat(nodeData.style.x) || 0,
                  y: parseFloat(nodeData.style.y) || 0
                };
                
                // 如果位置有明显变化
                if (Math.abs(finalPosition.x - dragInfo.startPosition.x) > 1 || 
                    Math.abs(finalPosition.y - dragInfo.startPosition.y) > 1) {
                  
                  console.log(`拖拽结束，节点 ${dragInfo.nodeId} 从`, 
                    dragInfo.startPosition, 
                    "移动到", finalPosition);
                  
                  // 记录到历史
                  addToHistory({
                    type: 'moveNode',
                    nodeId: dragInfo.nodeId,
                    oldPosition: { ...dragInfo.startPosition },
                    newPosition: { ...finalPosition }
                  });
                }
                
                // 重置拖拽状态
                dragInfo.isDragging = false;
                dragInfo.nodeId = null;
              }
            }
          },
          updateEdge: true, // 拖拽时更新关联的边
          delegateStyle: {
            fillOpacity: 0.4,
            fill: '#91d5ff',
            stroke: '#1890ff'
          }
        }
      ],
    });
    
    // 注册节点点击事件
    graph.on('node:click', (e) => {
      // 原有的处理逻辑
      handleDeviceClick(e);
    });
    
    // 注册边更新事件 - 用于反应路径
    graph.on('afteraddedge', () => {
      console.log("图中添加了新边，更新反应路径边数据");
      updateReactionPathEdges();
    });
    
    graph.on('afterremoveedge', () => {
      console.log("图中移除了边，更新反应路径边数据");
      updateReactionPathEdges();
    });
    
    // 加载保存的硬件结构列表和现有设备
    await loadSavedPaths();
    
    
    // 启动设备数据刷新
    startDeviceDataRefresh();
    
    
    // 处理窗口大小变化 - 带防抖
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeGraph();
        
        // 如果当前有选中的反应路径，更新高亮
        if (selectedReactionPathIndex.value !== null) {
          selectReactionPath(selectedReactionPathIndex.value);
        }
      }, 200);
    });
    
    // 延迟建立WebSocket连接，确保其他组件准备就绪
    setTimeout(() => {
      // 建立WebSocket连接
      connectWebSocket();
    }, 500);
    
    // 添加键盘快捷键监听
    window.addEventListener('keydown', handleKeyboardShortcuts);
    
    // 添加消息监听
    window.addEventListener('message', async (event) => {
      try {
        console.log('收到postMessage消息:', event.data);
        
        // 处理来自task页面的EDIT_TASK_DATA消息
        if (event.data && event.data.type === 'EDIT_TASK_DATA') {
          const editData = JSON.parse(event.data.data);
          console.log('收到编辑任务数据:', editData);
          
          if (editData.editMode && editData.editData) {
            // 设置编辑模式
            isEditMode.value = true;
            editTaskData.value = editData.editData;
            
            // 初始化设备参数对象
            if (editTaskData.value.matchedPath && Array.isArray(editTaskData.value.matchedPath)) {
              editTaskData.value.matchedPath.forEach(deviceId => {
                deviceParameters.value[deviceId] = {
                  id: deviceId,
                  // 根据设备类型设置默认参数
                  parameters: getDefaultParametersForDevice(deviceId)
                };
              });
            }
            
            // 如果有反应时间，设置为默认值
            if (editTaskData.value.reactTime) {
              deviceParameters.value.reactTime = editTaskData.value.reactTime;
            }
            
            // monitor-standalone主要用于硬件监控，不需要编辑功能
            // 这里可以添加其他监控相关的逻辑
          }
        }
        
        // 🎯 新增：处理自动加载自定义结构消息
        if (event.data && event.data.type === 'AUTO_LOAD_STRUCTURE') {
          console.log('🎯 收到自动加载自定义结构消息:', event.data);
          
          try {
            const structureData = JSON.parse(event.data.data);
            console.log('🎯 自定义结构加载请求:', structureData);
            
            if (structureData.action === 'loadFirstAvailableStructure') {
              // 🎯 判断是否需要强制重新加载
              const forceReload = structureData.reason === 'first_load' || structureData.forceReload === true;
              
              // 智能自动加载第一个可用的自定义结构
              await autoLoadFirstAvailableStructure(forceReload);
              console.log('✅ 已智能加载自定义结构');
            }
          } catch (parseError) {
            console.error('❌ 解析自定义结构加载数据失败:', parseError);
          }
        }
        
        // 🎯 新增：处理自动加载任务结构图消息
        if (event.data && event.data.type === 'AUTO_LOAD_TASK_GRAPH') {
          console.log('🎯 收到自动加载任务结构图消息:', event.data);
          
          try {
            const autoLoadData = JSON.parse(event.data.data);
            console.log('🎯 自动加载数据:', autoLoadData);
            
            if (autoLoadData.taskData && autoLoadData.taskData.pathGraph) {
              // 加载任务的结构图
              await loadGraphFromData(autoLoadData.taskData.pathGraph);
              console.log('✅ 已自动加载任务结构图');
            }
          } catch (parseError) {
            console.error('❌ 解析自动加载数据失败:', parseError);
          }
        }
        
        // 🎯 新增：处理任务切换高亮事件
        if (event.data && event.data.type === 'REALTIME_HIGHLIGHT') {
          console.log('🎯 收到实时高亮消息:', event.data);
          
          try {
            // 直接调用统一的高亮处理函数
            handleRealTimeHighlight(event);
          } catch (parseError) {
            console.error('❌ 处理实时高亮失败:', parseError);
          }
        }
        
        // 🎯 新增：处理ROW_DATA消息（兼容viewInformation组件）
        if (event.data && event.data.type === 'ROW_DATA') {
          console.log('🎯 收到ROW_DATA消息:', event.data);
          
          try {
            const rowData = JSON.parse(event.data.data);
            console.log('🎯 ROW_DATA数据:', rowData);
            
            if (rowData && typeof rowData === 'object') {
              // 加载图形数据
              await loadGraphFromData(rowData);
              console.log('✅ 已通过ROW_DATA加载结构图');
            }
          } catch (parseError) {
            console.error('❌ 解析ROW_DATA数据失败:', parseError);
          }
        }
        
        // 🔍 处理图形节点信息请求
        if (event.data && event.data.type === 'REQUEST_GRAPH_NODES') {
          console.log('🔍 收到图形节点信息请求');
          
          try {
            let graphNodes = [];
            
            if (graph) {
              // 获取当前图形的所有节点数据
              const allNodes = graph.getNodeData();
              graphNodes = allNodes.map(node => ({
                id: node.id,
                type: node.type || 'unknown',
                deviceType: node.data?.deviceType || node.data?.nodeType || 'unknown',
                label: node.style?.label || node.data?.label || node.id
              }));
              
              console.log(`📋 返回 ${graphNodes.length} 个节点信息:`, graphNodes.slice(0, 3));
            } else {
              console.warn('⚠️ 图形实例不存在');
            }
            
            // 🎯 缓存节点信息并回复
            if (graphNodes.length > 0) {
              // 在monitor-standalone内部也维护一份节点信息缓存
              window.currentGraphNodes = graphNodes;
            }
            
            // 回复节点信息
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'GRAPH_NODES_RESPONSE',
                data: graphNodes,
                timestamp: new Date().toISOString()
              }, '*');
              console.log(`✅ 已回复 ${graphNodes.length} 个图形节点信息`);
            }
          } catch (error) {
            console.error('❌ 处理图形节点请求失败:', error);
          }
        }
        
        // 🎯 处理任务信息显示请求
        if (event.data && event.data.type === 'SHOW_TASK_INFO') {
          console.log('🎯 收到任务信息显示请求:', event.data);
          
          try {
            const taskInfo = JSON.parse(event.data.data);
            console.log('🎯 任务信息:', taskInfo);
            
            // 🎯 显示任务信息通知
            ElMessage.info({
              message: `正在执行任务: ${taskInfo.taskName} (${taskInfo.taskIndex}/${taskInfo.totalTasks})`,
              duration: 3000,
              showClose: true
            });
            
            // 🎯 如果有设备数量信息，也显示出来
            if (taskInfo.deviceCount) {
              setTimeout(() => {
                ElMessage.success({
                  message: `任务路径包含 ${taskInfo.deviceCount} 个设备，预计用时: ${taskInfo.estimatedTime}`,
                  duration: 2000
                });
              }, 500);
            }
            
          } catch (parseError) {
            console.error('❌ 解析任务信息失败:', parseError);
          }
        }
        
        // 🎯 处理iframe准备状态检查
        if (event.data && event.data.type === 'IFRAME_READY_CHECK') {
          console.log('🎯 收到iframe准备状态检查');
          
          // 回复iframe已准备就绪
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'IFRAME_READY_RESPONSE',
              ready: true,
              graphInitialized: !!graph,
              timestamp: new Date().toISOString()
            }, '*');
            console.log('✅ 已回复iframe准备就绪状态');
          }
        }
      } catch (error) {
        console.error('处理postMessage消息失败:', error);
        errorMessage.value = `处理消息失败: ${error.message}`;
      }
    });
    console.log("组件初始化完成");
    
    // 🎯 如果在iframe中，通知父窗口已准备就绪
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'monitor-ready',
        data: { timestamp: new Date().toISOString() }
      }, '*');
      console.log('📡 已发送monitor-ready消息给父窗口');
    }
    
    // 连接WebSocket
    await connectWebSocket();
    
    // 🎯 启动运行任务监控
    startRunningTasksMonitoring();
    
    // 🎯 智能延迟自动加载第一个可用的自定义结构
    setTimeout(async () => {
      try {
        // 🎯 检查是否已经初始化过
        if (graphInitialized.value) {
          console.log('📋 图形已初始化，跳过自动加载');
          return;
        }
        
        if (savedPaths.value.length === 0) {
          console.log('📋 保存的路径为空，重新加载路径列表...');
          await loadSavedPaths();
        }
        
        if (savedPaths.value.length > 0) {
          console.log('🎯 延迟智能加载第一个可用的自定义结构...');
          await autoLoadFirstAvailableStructure(false); // 不强制重新加载
          console.log('✅ 延迟智能加载自定义结构完成');
        } else {
          console.warn('⚠️ 没有可用的自定义结构需要自动加载');
        }
      } catch (error) {
        console.error('❌ 延迟自动加载自定义结构失败:', error);
      }
    }, 2000); // 2秒延迟，确保所有初始化完成
    
    // 🎯 监听工作流完成事件
    window.addEventListener('workflowCompleted', (event) => {
      console.log('🎉 工作流执行完成:', event.detail)
      
      // 显示成功消息
      ElMessage.success(`工作流执行完成！共执行 ${event.detail.totalTasks} 个任务`)
      
      // 清除高亮
      setTimeout(() => {
        clearWorkflowHighlight()
      }, 5000)
    })
    
    // 🎯 添加postMessage监听，接收来自monitor界面的工作流信息
    window.addEventListener('message', (event) => {
      // 验证来源
      if (event.origin !== window.location.origin && event.origin !== 'http://localhost:8851') {
        return
      }
      
      const { type, data } = event.data
      
      switch (type) {
        case 'WORKFLOW_UPDATE':
          console.log('📨 收到工作流更新:', data)
          if (data) {
            // 更新Store状态
            handleWorkflowUpdate(data)
          }
          break
          
        case 'RUNNING_TASKS_UPDATE':
          console.log('📨 收到运行任务更新:', data)
          if (Array.isArray(data)) {
            updateRunningTasksDisplay(data)
          }
          break
          
        default:
          console.log('🔍 未知消息类型:', type, data)
      }
    })
    
  } catch (error) {
    console.error("组件挂载出错:", error);
    errorMessage.value = `初始化出错: ${error.message}`;
  }
});

onBeforeUnmount(() => {
  console.log("销毁G6");
  // 停止定时刷新
  stopDeviceDataRefresh();
  
  // 🎯 停止运行任务监控
  stopRunningTasksMonitoring();
  
  // 销毁图表
  graph?.destroy();

  // 关闭WebSocket连接
  if (ws.value) {
    ws.value.close();
  }
});

// 监听控制面板的显示状态，控制刷新
watch(showControlPanel, (newVal) => {
  if (!newVal) {
    // 面板关闭时，停止刷新
    stopDeviceDataRefresh();
  } else {
    // 面板打开时，启动刷新
    startDeviceDataRefresh();
  }
});



// 放置处理
const handleDrop = (e) => {
  if (!isCreateMode.value) return;
  
  e.preventDefault();
  
  if (!draggedIcon) {
    errorMessage.value = "拖拽数据为空，请重新拖拽设备图标";
    return;
  }
  
  // 计算放置位置
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 打开设备选择对话框
  openDeviceSelectionDialog(x, y, draggedIcon.type);
};

// 选择设备并添加到图中
const selectDeviceAndAddToGraph = (device) => {
  const { x, y } = dropPosition.value;
  
  // 根据设备类型获取图标
  let iconSrc = null;
  let label = "";
  
  switch (device.type) {
    case "pump": iconSrc = pump; label = "泵"; break;
    case "valve": iconSrc = valve; label = "阀"; break;
    case "chip": iconSrc = chip; label = "加热芯片"; break;
    case "mfc": iconSrc = mfc; label = "MFC控制器"; break;
    case "light": iconSrc = light; label = "光照控制"; break;
    case "bottle": iconSrc = bottle; label = "瓶"; break;
  }
  
  // 打印图标信息以帮助调试
  console.log(`设备类型 ${device.type} 的图标:`, iconSrc);
  
  // 添加到图中
  addDeviceToGraph(device, iconSrc, label, x, y);
  
  // 关闭对话框
  showDeviceSelectionDialog.value = false;
};

// 翻译设备状态为中文
const translateStatus = (status) => {
  const statusMap = {
    running: '运行中',
    stopped: '已停止',
    idle: '空闲',
    open: '已打开',
    closed: '已关闭',
    heating: '加热中',
    cooling: '冷却中',
    on: '已开启',
    off: '已关闭',
    error: '错误'
  };
  
  return statusMap[status] || status;
};

// 断开WebSocket连接
const disconnectWebSocket = () => {
  if (ws.value) {
    manualClose.value = true; // 标记为手动关闭
    ws.value.close();
    ws.value = null;
  }
  wsConnected.value = false;
};

// 尝试重新连接WebSocket
const reconnectWebSocket = () => {
  // 如果已有连接，先断开
  if (ws.value) {
    disconnectWebSocket();
  }
  
  // 等待一小段时间后重新连接
  setTimeout(() => {
    connectWebSocket();
  }, 500);
};

// 更新图中的设备节点
const updateDeviceOnGraph = (device) => {
  if (!graph) return;
  
  // 更新节点外观
  updateNodeAppearance(device.id, device.status);
  
  // 如果是当前选中的设备，更新控制面板数据
  if (device.id === selectedDevice.value) {
    deviceData.value = device;
  }
};



// 全局设备仓库
const globalDevices = ref(new Map()); // 存储所有已连接的实际设备
const showDeviceSelectionDialog = ref(false); // 是否显示设备选择对话框
const dropPosition = ref({ x: 0, y: 0, type: '' }); // 拖拽放置位置
const deviceSearchQuery = ref(''); // 设备搜索查询
const filteredDevicesCache = ref([]); // 过滤后的设备缓存

// 根据类型筛选的设备列表
const filteredDevices = computed(() => {
  return filteredDevicesCache.value;
});

// 设备分组
const deviceGroups = computed(() => {
  // 先按模块名称分组
  const moduleGroups = {};
  
  // 对已过滤的设备进行分组
  filteredDevices.value.forEach(device => {
    // 判断设备是否有模块数据
    if (device.moduleMetadata && device.moduleMetadata.moduleName) {
      const moduleName = device.moduleMetadata.moduleName;
      if (!moduleGroups[moduleName]) {
        moduleGroups[moduleName] = [];
      }
      moduleGroups[moduleName].push(device);
    } else {
      // 没有模块数据的设备，按控制器分组
      const groupId = `控制器 ${device.controllerIndex || 1}`;
      if (!moduleGroups[groupId]) {
        moduleGroups[groupId] = [];
      }
      moduleGroups[groupId].push(device);
    }
  });
  
  // 转换为数组形式
  return Object.keys(moduleGroups).map(moduleName => {
    return {
      title: moduleName,
      devices: moduleGroups[moduleName]
    };
  });
});

// 过滤设备
const filterDevices = () => {
  const query = deviceSearchQuery.value.toLowerCase();
  const type = dropPosition.value.type;
  
  // 先按类型过滤
  let devices = Array.from(globalDevices.value.values())
    .filter(device => device.type === type);
  
  // 再按搜索词过滤
  if (query) {
    devices = devices.filter(device => 
      device.id.toLowerCase().includes(query)
    );
  }
  
  // 过滤掉当前图中已存在的设备
  devices = devices.filter(device => {
    return !graph?.getNodeData().some(node => node.id === device.id);
  });
  
  // 更新缓存
  filteredDevicesCache.value = devices;
};

// 打开设备选择对话框
const openDeviceSelectionDialog = (x, y, type) => {
  dropPosition.value = { x, y, type };
  deviceSearchQuery.value = ''; // 清空搜索
  filterDevices(); // 初始化过滤结果
  showDeviceSelectionDialog.value = true;
};


// 获取设备类型名称
const getDeviceTypeName = (type) => {
  const typeNames = {
    pump: "泵",
    valve: "阀",
    chip: "加热芯片",
    mfc: "MFC控制器",
    light: "光照控制",
    bottle: "瓶"
  };
  return typeNames[type] || type;
};


// 撤销上一步操作
const undoLastOperation = () => {
  if (operationHistory.value.length === 0) {
    console.log("没有可撤销的操作");
    return;
  }
  
  const lastOperation = operationHistory.value.pop();
  console.log("撤销操作:", lastOperation);
  
  if (!lastOperation) return;
  
  // 根据操作类型执行撤销
  switch (lastOperation.type) {
    case 'addNode':
      // 移除节点
      if (lastOperation.nodeId) {
        graph.removeNodeData([lastOperation.nodeId]);
        console.log(`已移除节点: ${lastOperation.nodeId}`);
      }
      break;
      
    case 'addEdge':
      // 移除边
      if (lastOperation.edgeId) {
        graph.removeEdgeData([lastOperation.edgeId]);
        console.log(`已移除边: ${lastOperation.edgeId}`);
      }
      break;
      
    case 'removeNode':
      // 恢复节点
      if (lastOperation.nodeData) {
        graph.addNodeData([lastOperation.nodeData]);
        console.log(`已恢复节点: ${lastOperation.nodeData.id}`);
      }
      break;
      
    case 'removeEdge':
      // 恢复边
      if (lastOperation.edgeData) {
        graph.addEdgeData([lastOperation.edgeData]);
        console.log(`已恢复边: ${lastOperation.edgeData.id}`);
      }
      break;
      
    case 'moveNode':
      // 恢复节点位置 - 用最直接的方法
      if (lastOperation.nodeId && lastOperation.oldPosition) {
        try {
          console.log(`准备恢复节点 ${lastOperation.nodeId} 位置到:`, lastOperation.oldPosition);
          
          // 尝试简单直接的方法 - 使用removeNodeData和addNodeData
          // 先获取完整的节点数据
          const nodeData = graph.getNodeData(lastOperation.nodeId);
          if (nodeData) {
            // 删除旧节点
            graph.removeNodeData([lastOperation.nodeId]);
            
            // 创建一个新的节点数据，但使用旧位置
            const newNodeData = JSON.parse(JSON.stringify(nodeData)); // 深拷贝
            
            // 确保style对象存在并设置位置
            newNodeData.style = newNodeData.style || {};
            newNodeData.style.x = parseFloat(lastOperation.oldPosition.x);
            newNodeData.style.y = parseFloat(lastOperation.oldPosition.y);
            
            // 添加新节点并立即渲染
            console.log("添加恢复位置的节点:", newNodeData);
            graph.addNodeData([newNodeData]);
            graph.render();
            
            console.log(`已恢复节点位置: ${lastOperation.nodeId} 到 (${lastOperation.oldPosition.x}, ${lastOperation.oldPosition.y})`);
          } else {
            console.warn(`找不到节点 ${lastOperation.nodeId} 的数据`);
          }
        } catch (error) {
          console.error("恢复节点位置失败:", error);
        }
      } else {
        console.warn("缺少恢复节点位置所需的信息");
      }
      break;
      
    default:
      console.warn(`未知的操作类型: ${lastOperation.type}`);
  }
  
  // 确保渲染更新
  graph.render();
};

// 键盘快捷键处理函数
const handleKeyboardShortcuts = (e) => {
  // 如果不是创建模式，忽略快捷键
  if (!isCreateMode.value) return;
  
  // Ctrl+Z 或 Cmd+Z (Mac) 撤销操作
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault(); // 阻止浏览器默认撤销
    undoLastOperation();
  }
};

// 添加键盘事件监听
window.addEventListener('keydown', handleKeyboardShortcuts);

// 组件卸载时移除键盘事件监听
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardShortcuts);
});

// 处理图片路径序列化问题的辅助函数
const fixImageSrcForSerialization = (nodes) => {
  return nodes.map(node => {
    const nodeCopy = { ...node };
    
    // 如果节点有src属性并且是动态导入的图片对象
    if (nodeCopy.style && nodeCopy.style.src) {
      // 动态导入的图片会是一个对象，直接序列化会有问题
      // 这里我们标记图片类型，在加载时重新添加
      const src = nodeCopy.style.src;
      let imgType = "";
      
      // 判断图片类型，支持jpg格式
      if (src === pump || (typeof src === 'string' && src.includes('pump'))) {
        imgType = 'pump';
      } else if (src === valve || (typeof src === 'string' && src.includes('valve'))) {
        imgType = 'valve';
      } else if (src === chip || (typeof src === 'string' && src.includes('chip'))) {
        imgType = 'chip';
      } else if (src === mfc || (typeof src === 'string' && src.includes('mfc'))) {
        imgType = 'mfc';
      } else if (src === light || (typeof src === 'string' && src.includes('light'))) {
        imgType = 'light';
      } else if (src === bottle || (typeof src === 'string' && src.includes('bottle'))) {
        imgType = 'bottle';
      }
      
      // 记录图片类型及格式信息
      if (imgType) {
        // 删除原始src，并添加标记
        nodeCopy.data = nodeCopy.data || {};
        nodeCopy.data.imgType = imgType;
        
        // 添加图片格式信息(jpg或svg)，以便正确加载
        if (['pump', 'valve', 'chip', 'bottle'].includes(imgType)) {
          nodeCopy.data.imgFormat = 'jpg';
        } else {
          nodeCopy.data.imgFormat = 'svg';
        }
        
        nodeCopy.style = { ...nodeCopy.style };
        delete nodeCopy.style.src;
      }
    }
    return nodeCopy;
  });
};



// 记录当前拖拽状态
const dragInfo = reactive({
  isDragging: false,
  nodeId: null,
  startPosition: { x: 0, y: 0 },
  lastKnownPosition: { x: 0, y: 0 }
});





// 选择设备
const selectDevice = (deviceId) => {
  console.log('选择设备:', deviceId);
  
  // 更新选中的设备
  selectedDevice.value = deviceId;
  
  // 从全局设备仓库获取最新设备数据
  if (globalDevices.value.has(deviceId)) {
    // 深拷贝确保控制面板数据独立
    const device = globalDevices.value.get(deviceId);
    const deviceCopy = JSON.parse(JSON.stringify(device));
    
    // 如果有待发送的参数变更，优先显示这些变更值
    const deviceType = device.type;
    
    deviceData.value = deviceCopy;
    
    // 初始化控制参数对象
    controlParams.value = {};
    
    // 根据设备类型设置默认控制参数
    if (deviceType === 'pump') {
      // 初始化泵的吸取和输送端口参数
      controlParams.value.aspiratePort = deviceCopy.aspiratePort || 1;
      controlParams.value.dispensePort = deviceCopy.dispensePort || 6;
      controlParams.value.speed = deviceCopy.speed || 0;
      controlParams.value.position = deviceCopy.position || 0;
    } else if (deviceType === 'valve') {
      controlParams.value.position = deviceCopy.position || 1;
      controlParams.value.isProductValve = deviceCopy.isProductValve || false;
    } else if (deviceType === 'chip') {
      controlParams.value.targetTemp = deviceCopy.targetTemp || 25;
      controlParams.value.heatingSpeed = deviceCopy.heatingSpeed || 1;
    } else if (deviceType === 'mfc') {
      controlParams.value.flowRate = deviceCopy.flowRate || 0;
    } else if (deviceType === 'light') {
      controlParams.value.intensity = deviceCopy.intensity || 0;
    }
    
  } else {
    // 如果全局仓库中没有该设备数据，创建一个模拟数据
    console.log('没有该设备数据', deviceId);
  }
  
  // 显示控制面板
  showControlPanel.value = true;
};

// 硬件连接状态
const isHardwareConnected = ref(false);

// 硬件连接相关状态
const isHardwareConnecting = ref(false);
const hardwareIP = ref('192.168.1.14'); // 默认硬件IP
const hardwareErrorMessage = ref('');

// 连接硬件设备
const connectHardware = async () => {
  try {
    if (!wsConnected.value) {
      hardwareErrorMessage.value = '后端WebSocket未连接，请先连接WebSocket服务';
      return;
    }
    
    isHardwareConnecting.value = true;
    hardwareErrorMessage.value = '';
    
    // 发送连接硬件的WebSocket消息
    sendWsMessage({
      type: 'connectHardware',
      payload: {
        ipAddress: hardwareIP.value
      }
    });
    
    // 等待连接结果（实际结果会通过WebSocket消息返回）
    console.log(`尝试连接硬件设备: ${hardwareIP.value}`);
    
    // 添加一个连接超时机制
    setTimeout(() => {
      if (isHardwareConnecting.value) {
        isHardwareConnecting.value = false;
        hardwareErrorMessage.value = '连接硬件超时，请检查硬件IP地址和连接状态';
      }
    }, 10000); // 10秒超时
  } catch (error) {
    console.error('连接硬件失败:', error);
    hardwareErrorMessage.value = `连接硬件失败: ${error.message}`;
    isHardwareConnecting.value = false;
  }
};

// 断开硬件连接
const disconnectHardware = () => {
  try {
    if (!wsConnected.value) {
      hardwareErrorMessage.value = '后端WebSocket未连接，无法断开硬件';
      return;
    }
    
    isHardwareConnecting.value = true;
    hardwareErrorMessage.value = '';
    
    // 发送断开硬件的WebSocket消息
    sendWsMessage({
      type: 'disconnectHardware',
      payload: {}
    });
    
    console.log('尝试断开硬件设备连接');
    
    // 断开连接的状态会通过WebSocket消息更新
    setTimeout(() => {
      if (isHardwareConnecting.value) {
        isHardwareConnecting.value = false;
      }
    }, 5000); // 5秒超时
  } catch (error) {
    console.error('断开硬件连接失败:', error);
    hardwareErrorMessage.value = `断开硬件连接失败: ${error.message}`;
    isHardwareConnecting.value = false;
  }
};

// 添加任务编辑模式相关的状态
const isEditMode = ref(false);
const editTaskData = ref(null);
const deviceParameters = ref({});  // 存储设备参数

// 🎯 运行任务监控相关状态 - 新增
const runningTasks = ref([]);
const showRunningDetails = ref(true);
const runningTasksPollingInterval = ref(null);
const highlightedPaths = ref(new Map()); // 存储高亮的反应路径
const currentRunningDevices = ref(new Set()); // 当前正在运行的设备

// 流程模式状态
const isWorkflowMode = ref(false);

// 🎯 图形状态持久化
const graphInitialized = ref(false);
const lastStructureLoaded = ref(null);
const structureLoadCooldown = ref(0);
const STRUCTURE_RELOAD_COOLDOWN = 30000; // 30秒内不重复加载相同结构

// 🎯 运行任务监控相关方法 - 新增

// 获取运行中的任务
const fetchRunningTasks = async () => {
  try {
    // 方法1: 通过WebSocket请求运行任务状态
    if (wsConnected.value) {
      sendWsMessage({
        type: 'getRunningTasks'
      });
    }
    
    // 方法2: 通过HTTP API获取（备用方案）
    // const response = await axios.get('/api/tasks/running');
    // if (response.data && response.data.code === 0) {
    //   updateRunningTasks(response.data.data);
    // }
  } catch (error) {
    console.error('获取运行任务失败:', error);
  }
};

// 更新运行任务列表
const updateRunningTasks = (tasks) => {
  if (!Array.isArray(tasks)) return;
  
  console.log('更新运行任务列表:', tasks);
  runningTasks.value = tasks;
  
  // 更新当前运行的设备集合
  const newRunningDevices = new Set();
  tasks.forEach(task => {
    if (task.matchedPath && Array.isArray(task.matchedPath)) {
      // 🔧 过滤掉边ID和非有效设备ID
      const validDeviceIds = task.matchedPath.filter(deviceId => {
        return deviceId && 
               typeof deviceId === 'string' && 
               !deviceId.startsWith('edge-') && // 过滤掉边ID
               !deviceId.includes('执行步骤') && 
               !deviceId.includes(':') && 
               !deviceId.includes('初始化') && 
               !deviceId.includes('抽吸') && 
               !deviceId.includes('反应') && 
               deviceId.length < 50 &&
               /^[a-zA-Z0-9\-_]+$/.test(deviceId);
      });
      
      validDeviceIds.forEach(deviceId => {
        newRunningDevices.add(deviceId);
      });
    }
    if (task.currentDevice && 
        typeof task.currentDevice === 'string' && 
        !task.currentDevice.startsWith('edge-')) {
      newRunningDevices.add(task.currentDevice);
    }
  });
  
  currentRunningDevices.value = newRunningDevices;
  
  // 高亮显示运行中的反应路径
  highlightRunningPaths(tasks);
  
  // 更新设备节点状态
  updateRunningDeviceNodes();
};

// 高亮显示运行中的反应路径
const highlightRunningPaths = (tasks) => {
  if (!graph) return;
  
  // 清除之前的高亮
  clearPathHighlights();
  
  tasks.forEach((task, index) => {
    if (task.matchedPath && Array.isArray(task.matchedPath)) {
      const pathColor = getTaskColor(index);
      
      // 🔧 过滤出有效的设备ID
      const validDeviceIds = task.matchedPath.filter(deviceId => {
        return deviceId && 
               typeof deviceId === 'string' && 
               !deviceId.startsWith('edge-') && // 过滤掉边ID
               !deviceId.includes('执行步骤') && 
               !deviceId.includes(':') && 
               !deviceId.includes('初始化') && 
               !deviceId.includes('抽吸') && 
               !deviceId.includes('反应') && 
               deviceId.length < 50 &&
               /^[a-zA-Z0-9\-_]+$/.test(deviceId);
      });
      
      console.log(`🔧 任务${index} 过滤前路径:`, task.matchedPath);
      console.log(`🔧 任务${index} 过滤后路径:`, validDeviceIds);
      
      // 高亮路径中的节点
      validDeviceIds.forEach(deviceId => {
        highlightDeviceNode(deviceId, pathColor, 'running');
      });
      
      // 高亮路径中的边
      highlightPathEdges(validDeviceIds, pathColor);
      
      // 存储高亮信息
      highlightedPaths.value.set(`${task.taskId}-${task.taskKey}`, {
        devices: validDeviceIds,
        color: pathColor,
        task: task
      });
    }
  });
  
  graph.render();
};

// 清除路径高亮
const clearPathHighlights = () => {
  if (!graph) return;
  
  // 重置所有节点样式
  const allNodes = graph.getNodeData();
  allNodes.forEach(node => {
    graph.updateNodeData([{
      id: node.id,
      style: {
        ...node.style,
        stroke: '#91d5ff', // 默认边框颜色
        lineWidth: 2,
        shadowBlur: 0,
        shadowColor: 'transparent'
      }
    }]);
  });
  
  // 重置所有边样式
  const allEdges = graph.getEdgeData();
  allEdges.forEach(edge => {
    // 🔧 修复：使用updateEdgeData来更新边的样式，而不是updateNodeData
    graph.updateEdgeData([{
      id: edge.id,
      style: {
        ...edge.style,
        stroke: '#91d5ff', // 默认边颜色
        lineWidth: 2
      }
    }]);
  });
  
  highlightedPaths.value.clear();
};

// 高亮设备节点
const highlightDeviceNode = (deviceId, status = 'running') => {
  console.log('高亮设备节点:', deviceId, status);
  if (!graph || !deviceId || typeof deviceId !== 'string') {
    console.warn('无效的设备ID或图形实例:', deviceId);
    return;
  }
  
  // 🔧 过滤非设备ID（如边ID、步骤描述等）
  if (deviceId.startsWith('edge-') || 
      deviceId.includes('执行步骤') || 
      deviceId.includes(':') || 
      deviceId.length > 50) {
    console.log('跳过非设备ID项:', deviceId);
    return;
  }
  
  // 🔧 检查节点是否存在于图中
  const allNodes = graph.getNodeData();
  const nodeExists = allNodes.some(node => node.id === deviceId);
  
  if (!nodeExists) {
    console.warn('⚠️ 节点在图中不存在，跳过高亮:', deviceId);
    return;
  }
  
  try {
    let strokeColor = "#1890ff";
    let shadowColor = "rgba(0,0,0,0.1)";
    
    switch (status) {
      case "running":
      case "open":
      case "heating":
      case "active":
        strokeColor = "#67c23a"; // 绿色 - 正在运行
        shadowColor = "rgba(103, 194, 58, 0.3)";
        break;
      case "stopped":
      case "closed":
      case "idle":
        strokeColor = "#909399"; // 灰色 - 停止
        shadowColor = "rgba(144, 147, 153, 0.3)";
        break;
      case "error":
        strokeColor = "#f56c6c"; // 红色 - 错误
        shadowColor = "rgba(245, 108, 108, 0.3)";
        break;
      case "cooling":
        strokeColor = "#1890ff"; // 蓝色 - 冷却
        shadowColor = "rgba(24, 144, 255, 0.3)";
        break;
      case "highlighted":
      case "current":
        strokeColor = "#faad14"; // 黄色 - 当前执行
        shadowColor = "rgba(250, 173, 20, 0.4)";
        break;
      default:
        strokeColor = "#1890ff";
        shadowColor = "rgba(24, 144, 255, 0.3)";
    }
    
    // 🎯 更新节点样式
    graph.updateNodeData([{
      id: deviceId,
      style: {
        stroke: strokeColor,
        shadowColor: shadowColor,
        shadowBlur: 12,
        lineWidth: 3
      }
    }]);
    
    console.log(`✅ 节点 ${deviceId} 高亮成功:`, status);
  } catch (error) {
    console.error(`❌ 高亮节点 ${deviceId} 失败:`, error);
  }
};

// 🎯 新增：高亮设备路径（包含边高亮）
const highlightDevicePath = (devicePath, pathColor = '#faad14') => {
  console.log('🎯 开始高亮设备路径:', devicePath, '颜色:', pathColor);
  
  if (!graph || !devicePath || !Array.isArray(devicePath)) {
    console.warn('⚠️ 无效的设备路径或图形实例:', devicePath);
    return;
  }
  
  try {
    // 🔧 过滤有效的设备ID
    const validDeviceIds = devicePath.filter(deviceId => {
      return deviceId && 
             typeof deviceId === 'string' && 
             !deviceId.startsWith('edge-') &&
             !deviceId.includes('执行步骤') && 
             !deviceId.includes(':') && 
             deviceId.length < 50 &&
             /^[a-zA-Z0-9\-_]+$/.test(deviceId);
    });
    
    console.log('🔧 过滤后的有效设备ID:', validDeviceIds);
    
    if (validDeviceIds.length === 0) {
      console.warn('⚠️ 没有有效的设备ID用于高亮');
      return;
    }
    
    // 🎯 步骤1：重置所有边为默认样式
    const allEdges = graph.getEdgeData();
    const resetEdgeUpdates = allEdges.map(edge => ({
      id: edge.id,
      style: {
        stroke: '#91d5ff',
        lineWidth: 2,
        opacity: 0.4, // 降低非路径边的透明度
        shadowBlur: 0,
        shadowColor: null,
        endArrow: {
          fill: '#91d5ff',
          stroke: '#91d5ff'
        }
      }
    }));
    
    if (resetEdgeUpdates.length > 0) {
      graph.updateEdgeData(resetEdgeUpdates);
      console.log('✅ 已重置所有边样式');
    }
    
    // 🎯 移除节点高亮代码，因为图片节点修改边框等样式无效果
    // 设备节点使用图片，所以不需要修改节点样式
    
    // 🎯 步骤2：找出并高亮路径中的连接边
    const pathEdges = [];
    allEdges.forEach(edge => {
      // 检查边的两端是否都在路径设备中
      if (validDeviceIds.includes(edge.source) && validDeviceIds.includes(edge.target)) {
        pathEdges.push(edge.id);
      }
    });
    
    console.log('🔍 找到路径边:', pathEdges.length, '条:', pathEdges);
    
    // 🎯 步骤3：高亮路径边 - 增强视觉效果
    if (pathEdges.length > 0) {
      const pathEdgeUpdates = pathEdges.map(edgeId => ({
        id: edgeId,
        style: {
          stroke: pathColor,
          lineWidth: 6, // 🎯 增加线宽，更明显
          opacity: 1, // 完全不透明
          shadowColor: pathColor,
          shadowBlur: 15, // 增强阴影效果
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          endArrow: {
            fill: pathColor,
            stroke: pathColor,
            lineWidth: 2
          },
          // 🔥 优化动画效果
          animates: [
            {
              iterations: Infinity,
              attribute: 'shadowBlur',
              duration: 2000,
              easing: 'ease-in-out',
              keyframes: [
                { value: 10, time: 0 },
                { value: 20, time: 0.5 },
                { value: 10, time: 1 }
              ]
            },
            {
              iterations: Infinity,
              attribute: 'lineWidth',
              duration: 2000,
              easing: 'ease-in-out',
              keyframes: [
                { value: 6, time: 0 },
                { value: 8, time: 0.5 },
                { value: 6, time: 1 }
              ]
            }
          ]
        }
      }));
      
      graph.updateEdgeData(pathEdgeUpdates);
      console.log('✅ 已高亮路径边:', pathEdges.length, '条');
    }
    
    // 🎯 步骤4：渲染更新
    graph.render();
    
    console.log(`🎉 设备路径高亮完成: ${validDeviceIds.length}个设备, ${pathEdges.length}条连接`);
    
    return {
      highlightedNodes: validDeviceIds,
      highlightedEdges: pathEdges,
      pathColor: pathColor
    };
    
  } catch (error) {
    console.error('❌ 高亮设备路径失败:', error);
  }
};

// 🎯 新增：清除路径高亮
const clearPathHighlight = () => {
  console.log('🧹 清除路径高亮');
  
  if (!graph) {
    console.warn('⚠️ 图形实例不存在');
    return;
  }
  
  try {
    // 🎯 移除节点样式重置代码，因为图片节点不需要修改样式
    // 设备节点使用图片，所以不需要重置节点样式
    
    // 重置所有边样式
    const allEdges = graph.getEdgeData();
    const edgeResetUpdates = allEdges.map(edge => ({
      id: edge.id,
      style: {
        stroke: '#91d5ff',
        lineWidth: 2,
        opacity: 1,
        shadowBlur: 0,
        shadowColor: null,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        endArrow: {
          fill: '#91d5ff',
          stroke: '#91d5ff'
        },
        animates: [] // 清除动画
      }
    }));
    
    // 🎯 只更新边的样式，不更新节点
    if (edgeResetUpdates.length > 0) {
      graph.updateEdgeData(edgeResetUpdates);
    }
    
    graph.render();
    console.log('✅ 路径高亮已清除');
    
  } catch (error) {
    console.error('❌ 清除路径高亮失败:', error);
  }
};

// 高亮路径边
const highlightPathEdges = (pathDevices, color) => {
  if (!graph || !pathDevices || pathDevices.length < 2) return;
  
  const allEdges = graph.getEdgeData();
  
  // 找出路径中设备之间的连接边
  for (let i = 0; i < pathDevices.length - 1; i++) {
    const sourceDevice = pathDevices[i];
    const targetDevice = pathDevices[i + 1];
    
    // 查找连接这两个设备的边
    const connectingEdge = allEdges.find(edge => 
      (edge.source === sourceDevice && edge.target === targetDevice) ||
      (edge.source === targetDevice && edge.target === sourceDevice)
    );
    
    if (connectingEdge) {
      graph.updateEdgeData([{
        id: connectingEdge.id,
        style: {
          stroke: color,
          lineWidth: 4,
          endArrow: {
            fill: color,
            stroke: color
          }
        }
      }]);
    }
  }
};

// 添加脉动效果
const addPulseEffect = (deviceId, color) => {
  // 这里可以添加CSS动画或定时器来实现脉动效果
  // 由于G6的限制，我们使用定时器来模拟脉动
  const pulseInterval = setInterval(() => {
    if (!currentRunningDevices.value.has(deviceId)) {
      clearInterval(pulseInterval);
      return;
    }
    
    try {
      const node = graph.findById(deviceId);
      if (node) {
        const currentOpacity = node.getModel().style?.opacity || 1;
        const newOpacity = currentOpacity > 0.7 ? 0.5 : 1;
        
        graph.updateNodeData([{
          id: deviceId,
          style: {
            opacity: newOpacity
          }
        }]);
        graph.render();
      }
    } catch (error) {
      clearInterval(pulseInterval);
    }
  }, 1000); // 每秒切换一次透明度
};

// 更新运行设备节点状态
const updateRunningDeviceNodes = () => {
  if (!graph) return;
  
  currentRunningDevices.value.forEach(deviceId => {
    updateNodeAppearance(deviceId, 'running');
  });
};

// 获取任务颜色（为不同任务分配不同颜色）
const getTaskColor = (index) => {
  const colors = [
    '#ff4d4f', // 红色
    '#52c41a', // 绿色
    '#1890ff', // 蓝色
    '#fa8c16', // 橙色
    '#722ed1', // 紫色
    '#eb2f96', // 粉色
    '#13c2c2', // 青色
    '#faad14'  // 黄色
  ];
  return colors[index % colors.length];
};

// 格式化运行时间
const formatRunTime = (startTime) => {
  if (!startTime) return '未知';
  
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

// 开始运行任务监控
const startRunningTasksMonitoring = () => {
  // 立即获取一次
  fetchRunningTasks();
  
  // 设置定时轮询
  if (runningTasksPollingInterval.value) {
    clearInterval(runningTasksPollingInterval.value);
  }
  
  runningTasksPollingInterval.value = setInterval(() => {
    fetchRunningTasks();
  }, 5000); // 每5秒更新一次
};

// 停止运行任务监控
const stopRunningTasksMonitoring = () => {
  if (runningTasksPollingInterval.value) {
    clearInterval(runningTasksPollingInterval.value);
    runningTasksPollingInterval.value = null;
  }
};

// 🎯 处理单个任务状态更新
const updateSingleTaskStatus = (taskUpdate) => {
  const { taskId, taskKey, status, progress, currentDevice, currentStep } = taskUpdate;
  
  // 🔧 过滤currentDevice，确保不包含边ID
  let validCurrentDevice = currentDevice;
  if (currentDevice && 
      (typeof currentDevice !== 'string' || 
       currentDevice.startsWith('edge-') || 
       currentDevice.includes('执行步骤') || 
       currentDevice.includes(':') || 
       currentDevice.length > 50 ||
       !/^[a-zA-Z0-9\-_]+$/.test(currentDevice))) {
    console.warn('⚠️ 过滤掉无效的currentDevice ID:', currentDevice);
    validCurrentDevice = null;
  }
  
  // 查找并更新对应的任务
  const taskIndex = runningTasks.value.findIndex(
    task => task.taskId === taskId && task.taskKey === taskKey
  );
  
  if (taskIndex >= 0) {
    // 更新现有任务
    runningTasks.value[taskIndex] = {
      ...runningTasks.value[taskIndex],
      status,
      progress,
      currentDevice: validCurrentDevice,
      currentStep,
      updatedAt: new Date()
    };
    
    console.log(`任务 ${taskId}-${taskKey} 状态更新: ${progress}%, 当前设备: ${currentDevice}`);
    
    // 如果任务完成或失败，从运行列表中移除
    if (status === 2 || status === 3) { // 2=完成, 3=失败
      setTimeout(() => {
        runningTasks.value = runningTasks.value.filter(
          task => !(task.taskId === taskId && task.taskKey === taskKey)
        );
        // 重新高亮剩余的运行任务
        highlightRunningPaths(runningTasks.value);
      }, 3000); // 3秒后移除完成的任务
    } else {
      // 更新高亮显示
      highlightRunningPaths(runningTasks.value);
    }
  } else if (status === 1) { // 1=运行中，新任务开始
    // 这是一个新的运行任务，添加到列表中
    console.log(`发现新的运行任务: ${taskId}-${taskKey}`);
    fetchRunningTasks(); // 重新获取完整的运行任务列表
  }
};

// 🎯 处理设备状态更新
const updateRunningDeviceStatus = (deviceUpdate) => {
  const { deviceId, status, parameters, isActive } = deviceUpdate;
  
  // 🔧 过滤掉边ID和无效设备ID
  if (!deviceId || 
      typeof deviceId !== 'string' || 
      deviceId.startsWith('edge-') || 
      deviceId.includes('执行步骤') || 
      deviceId.includes(':') || 
      deviceId.length > 50 ||
      !/^[a-zA-Z0-9\-_]+$/.test(deviceId)) {
    console.warn('⚠️ 跳过无效的设备ID更新:', deviceId);
    return;
  }
  
  // 更新全局设备仓库
  if (globalDevices.value.has(deviceId)) {
    const device = globalDevices.value.get(deviceId);
    const updatedDevice = {
      ...device,
      status,
      ...parameters,
      isActive,
      lastUpdate: new Date()
    };
    globalDevices.value.set(deviceId, updatedDevice);
    
    // 更新图形中的设备节点外观
    updateNodeAppearance(deviceId, status);
    
    // 如果是当前选中的设备，更新控制面板
    if (selectedDevice.value === deviceId) {
      deviceData.value = updatedDevice;
    }
    
    console.log(`设备 ${deviceId} 状态更新: ${status}, 活跃: ${isActive}`);
    
    // 🎯 同步设备状态到Store以供工作流状态判断
    if (runningTasksStore.isWorkflowRunning) {
      runningTasksStore.updateActualHardwareState(deviceId, {
        status,
        isActive,
        temperature: parameters?.temperature,
        flowRate: parameters?.flowRate,
        position: parameters?.position,
        ...parameters
      });
    }
  }
  
  // 如果设备变为活跃状态，添加到当前运行设备集合
  if (isActive && deviceId && !deviceId.startsWith('edge-')) {
    currentRunningDevices.value.add(deviceId);
  } else {
    currentRunningDevices.value.delete(deviceId);
  }
};

// 🎯 添加工作流相关响应式变量
const currentWorkflowPaths = ref(new Set()) // 当前工作流涉及的设备路径
const workflowHighlightColor = '#ff6b35' // 工作流高亮颜色
const isWorkflowRunning = computed(() => runningTasksStore.isWorkflowRunning)

// 🎯 高亮工作流路径
const highlightWorkflowPaths = () => {
  if (!graph || currentWorkflowPaths.value.size === 0) return
  
  // 高亮节点
  currentWorkflowPaths.value.forEach(deviceId => {
    // 🔧 跳过边ID和无效设备ID
    if (!deviceId || 
        typeof deviceId !== 'string' || 
        deviceId.startsWith('edge-') || 
        deviceId.includes('执行步骤') || 
        deviceId.includes(':')) {
      return;
    }
    const node = graph.findById(deviceId)
    if (node) {
      // 添加工作流高亮样式
      graph.updateItem(node, {
        style: {
          stroke: workflowHighlightColor,
          lineWidth: 4,
          shadowColor: workflowHighlightColor,
          shadowBlur: 10
        }
      })
      
      // 为节点添加呼吸动画效果
      node.animate(
        (ratio) => {
          const opacity = 0.6 + 0.4 * Math.sin(ratio * Math.PI * 2)
          return {
            style: {
              opacity
            }
          }
        },
        {
          duration: 2000,
          repeat: true
        }
      )
    }
  })
  
  // 高亮相关的边
  const edges = graph.getEdges()
  edges.forEach(edge => {
    const sourceId = edge.getSource().getID()
    const targetId = edge.getTarget().getID()
    
    if (currentWorkflowPaths.value.has(sourceId) && currentWorkflowPaths.value.has(targetId)) {
      graph.updateItem(edge, {
        style: {
          stroke: workflowHighlightColor,
          lineWidth: 3,
          shadowColor: workflowHighlightColor,
          shadowBlur: 5
        }
      })
    }
  })
}

// 🎯 清除工作流高亮
const clearWorkflowHighlight = () => {
  if (!graph) return
  
  // 清除节点高亮和动画
  currentWorkflowPaths.value.forEach(deviceId => {
    // 🔧 跳过边ID和无效设备ID
    if (!deviceId || 
        typeof deviceId !== 'string' || 
        deviceId.startsWith('edge-') || 
        deviceId.includes('执行步骤') || 
        deviceId.includes(':')) {
      return;
    }
    const node = graph.findById(deviceId)
    if (node) {
      node.stopAnimate()
      // 恢复原始样式
      graph.updateItem(node, {
        style: {
          stroke: '#333',
          lineWidth: 1,
          shadowColor: null,
          shadowBlur: 0,
          opacity: 1
        }
      })
    }
  })
  
  // 清除边高亮
  const edges = graph.getEdges()
  edges.forEach(edge => {
    graph.updateItem(edge, {
      style: {
        stroke: '#666',
        lineWidth: 1,
        shadowColor: null,
        shadowBlur: 0
      }
    })
  })
}

// 🎯 添加辅助函数
const getTaskStatusClass = (status) => {
  switch (status) {
    case 0: return 'status-pending'
    case 1: return 'status-running'
    case 2: return 'status-completed'
    case 3: return 'status-failed'
    default: return 'status-unknown'
  }
}

const getTaskStatusText = (status) => {
  switch (status) {
    case 0: return '待执行'
    case 1: return '执行中'
    case 2: return '已完成'
    case 3: return '执行失败'
    default: return '未知状态'
  }
}



// 🎯 从数据加载图形
const loadGraphFromData = async (graphData) => {
  if (!graph) {
    console.warn('⚠️ 图形实例未初始化，无法加载数据');
    return;
  }
  
  try {
    console.log('🎯 开始加载图形数据:', graphData);
    
    // 🔧 不要清空图形，保持原有的硬件结构
    // graph.clear();
    
    // 🎯 检查数据格式，兼容多种数据结构
    let nodesData = [];
    let edgesData = [];
    
    // 格式1：标准G6格式 {nodes: [...], edges: [...]}
    if (graphData.nodes && Array.isArray(graphData.nodes)) {
      nodesData = graphData.nodes;
      edgesData = graphData.edges || [];
    }
    // 格式2：直接是节点数组
    else if (Array.isArray(graphData)) {
      nodesData = graphData;
      edgesData = [];
    }
    // 格式3：其他格式，尝试解析
    else if (typeof graphData === 'object') {
      // 查找可能的节点和边数据
      for (const [key, value] of Object.entries(graphData)) {
        if (Array.isArray(value)) {
          if (key.toLowerCase().includes('node') || key.toLowerCase().includes('vertex')) {
            nodesData = value;
          } else if (key.toLowerCase().includes('edge') || key.toLowerCase().includes('link')) {
            edgesData = value;
          }
        }
      }
      
      // 如果没有找到明确的节点/边数组，可能是嵌套结构
      if (nodesData.length === 0 && edgesData.length === 0) {
        console.log('🔍 尝试解析复杂数据结构...');
        
        // 检查是否是pathGraph的H_with_map格式
        if (graphData.nodes || graphData.vertices) {
          nodesData = graphData.nodes || graphData.vertices || [];
        }
        if (graphData.edges || graphData.links) {
          edgesData = graphData.edges || graphData.links || [];
        }
      }
    }
    
    console.log('🔧 解析得到的数据:', { nodesCount: nodesData.length, edgesCount: edgesData.length });
    
    // 🎯 如果没有有效数据，使用默认的硬件结构
    if (nodesData.length === 0 && edgesData.length === 0) {
      console.log('⚠️ 传入的图形数据为空或格式不正确，保持原有图形结构');
      return;
    }
    
    // 🎯 高亮设备路径而不是替换整个图形
    if (nodesData.length > 0) {
      const deviceIds = nodesData.map(node => node.id).filter(id => id && typeof id === 'string');
      if (deviceIds.length > 0) {
        console.log('🎯 高亮设备路径:', deviceIds);
        highlightDevicePath(deviceIds, '#ff4d4f');
      }
    }
    
    console.log('✅ 图形高亮完成');
  } catch (error) {
    console.error('❌ 加载图形数据失败:', error);
    errorMessage.value = `加载图形数据失败: ${error.message}`;
  }
};

// 🎯 注意：highlightDevicePath函数已在上方重新定义，此处删除旧版本

// 🎯 高亮运行任务
const highlightRunningTasks = (tasks) => {
  if (!Array.isArray(tasks)) {
    console.warn('⚠️ 任务数据格式无效');
    return;
  }
  
  try {
    console.log('🎯 高亮运行任务:', tasks.length, '个');
    
    tasks.forEach((task, index) => {
      if (task.devicePath && Array.isArray(task.devicePath)) {
        const color = getTaskColor(index);
        highlightDevicePath(task.devicePath, color); // 使用新的函数签名
      }
    });
    
    console.log('✅ 运行任务高亮完成');
  } catch (error) {
    console.error('❌ 高亮运行任务失败:', error);
  }
};

// 🎯 处理工作流更新
const handleWorkflowUpdate = (workflowData) => {
  const { workflow, status, expectedStates, actualStates } = workflowData
  
  // 使用新的store更新方法
  if (runningTasksStore) {
    // 将对象转换为数组格式，以兼容store的期望格式
    let expectedStatesArray = undefined;
    let actualStatesArray = undefined;
    
    if (expectedStates) {
      if (Array.isArray(expectedStates)) {
        expectedStatesArray = expectedStates;
      } else if (typeof expectedStates === 'object') {
        // 将对象转换为数组
        expectedStatesArray = Object.entries(expectedStates);
      }
    }
    
    if (actualStates) {
      if (Array.isArray(actualStates)) {
        actualStatesArray = actualStates;
      } else if (typeof actualStates === 'object') {
        // 将对象转换为数组
        actualStatesArray = Object.entries(actualStates);
      }
    }
    
    runningTasksStore.updateFromMainProject({
      currentWorkflow: workflow,
      workflowStatus: status,
      expectedStates: expectedStatesArray,
      actualStates: actualStatesArray
    })
    
    console.log('🔄 已通过store同步工作流状态', {
      workflow: !!workflow,
      status,
      expectedStatesCount: expectedStatesArray ? expectedStatesArray.length : 0,
      actualStatesCount: actualStatesArray ? actualStatesArray.length : 0
    })
  }
}

// 🎯 更新运行任务显示
const updateRunningTasksDisplay = (tasks) => {
  // 同时更新local ref和store
  runningTasks.value = tasks
  
  if (runningTasksStore) {
    runningTasksStore.updateFromMainProject({
      runningTasks: tasks
    })
  }
  
  console.log('📋 已更新运行任务显示:', tasks.length, '个任务')
}

// 🎯 监听store中的工作流状态变化
watch(() => runningTasksStore.getCurrentWorkflowInfo, (newWorkflow) => {
  if (newWorkflow && newWorkflow.tasks) {
    // 收集所有任务的设备路径
    const allPaths = new Set()
    newWorkflow.tasks.forEach(task => {
      if (task.devicePath && Array.isArray(task.devicePath)) {
        // 🔧 过滤设备路径，确保只添加有效的设备ID
        const validDeviceIds = task.devicePath.filter(deviceId => {
          return deviceId && 
                 typeof deviceId === 'string' && 
                 !deviceId.startsWith('edge-') && 
                 !deviceId.includes('执行步骤') && 
                 !deviceId.includes(':') && 
                 !deviceId.includes('初始化') && 
                 !deviceId.includes('抽吸') && 
                 !deviceId.includes('反应') && 
                 deviceId.length < 50 &&
                 /^[a-zA-Z0-9\-_]+$/.test(deviceId);
        });
        
        validDeviceIds.forEach(deviceId => allPaths.add(deviceId));
      }
    })
    currentWorkflowPaths.value = allPaths
    
    // 高亮工作流路径
    highlightWorkflowPaths()
    
    console.log('🎯 检测到工作流，高亮设备路径:', allPaths)
  } else {
    // 清除高亮
    currentWorkflowPaths.value = new Set()
    clearWorkflowHighlight()
  }
}, { immediate: true, deep: true })

// 🎯 处理步骤开始高亮
const handleStepStartedHighlight = (data) => {
  console.log('🚀 处理步骤开始高亮:', data);
  
  // 🎯 重点高亮设备路径中的边，而不是节点
  if (data.devicePath && Array.isArray(data.devicePath)) {
    highlightDevicePath(data.devicePath, '#67c23a'); // 绿色表示正在执行
  }
  
  // 从当前任务数据中获取设备路径
  if (data.currentTaskData && data.currentTaskData.devicePath) {
    highlightDevicePath(data.currentTaskData.devicePath, '#67c23a'); // 绿色表示正在执行
  }
  
  // 🔧 可选：如果确实需要高亮节点，先检查节点是否存在
  if (data.currentDevices && Array.isArray(data.currentDevices)) {
    data.currentDevices.forEach(deviceId => {
      // 检查节点是否存在再高亮
      if (graph && graph.getNodeData().some(node => node.id === deviceId)) {
        highlightDeviceNode(deviceId, 'running');
      } else {
        console.log('⚠️ 跳过不存在的节点:', deviceId);
      }
    });
  }
};

// 🎯 处理任务状态更新高亮
const handleTaskStatusHighlight = (data) => {
  console.log('📊 处理任务状态高亮:', data);
  
  // 🎯 重点高亮设备路径中的边
  if (data.devicePath && Array.isArray(data.devicePath)) {
    const pathColor = data.status === 'error' ? '#f56c6c' : '#faad14';
    highlightDevicePath(data.devicePath, pathColor);
  }
  
  // 高亮设备路径
  if (data.currentTaskData && data.currentTaskData.devicePath) {
    const pathColor = data.status === 'error' ? '#f56c6c' : '#faad14';
    highlightDevicePath(data.currentTaskData.devicePath, pathColor);
  }
  
  // 🔧 可选：高亮当前设备（仅当节点存在时）
  if (data.currentDevice) {
    if (graph && graph.getNodeData().some(node => node.id === data.currentDevice)) {
      highlightDeviceNode(data.currentDevice, data.status || 'running');
    } else {
      console.log('⚠️ 跳过不存在的当前设备节点:', data.currentDevice);
    }
  }
};

// 🎯 处理步骤完成高亮
const handleStepCompletedHighlight = (data) => {
  console.log('✅ 处理步骤完成高亮:', data);
  
  // 🎯 重点高亮设备路径中的边
  if (data.devicePath && Array.isArray(data.devicePath)) {
    highlightDevicePath(data.devicePath, '#52c41a'); // 亮绿色表示完成
  }
  
  // 如果有设备路径，以完成状态高亮
  if (data.currentTaskData && data.currentTaskData.devicePath) {
    highlightDevicePath(data.currentTaskData.devicePath, '#52c41a'); // 亮绿色表示完成
  }
  
  // 🔧 可选：高亮完成的设备（仅当节点存在时）
  if (data.completedDevices && Array.isArray(data.completedDevices)) {
    data.completedDevices.forEach(deviceId => {
      if (graph && graph.getNodeData().some(node => node.id === deviceId)) {
        highlightDeviceNode(deviceId, 'stopped');
      } else {
        console.log('⚠️ 跳过不存在的完成设备节点:', deviceId);
      }
    });
  }
};

// 🎯 处理工作流启动高亮
const handleWorkflowStartedHighlight = (data) => {
  console.log('🚀 处理工作流启动高亮:', data);
  
  // 清除之前的高亮
  clearPathHighlight();
  
  // 显示整体工作流状态
  if (data.currentTaskData && data.currentTaskData.devicePath) {
    highlightDevicePath(data.currentTaskData.devicePath, '#1890ff'); // 蓝色表示工作流启动
  }
};

// 🎯 处理并发组高亮
const handleConcurrentGroupHighlight = (data) => {
  console.log('🚀 处理并发组高亮:', data);
  
  // 清除之前的高亮
  clearPathHighlight();
  
  // 高亮所有并发任务的路径
  if (data.concurrentTasksData && Array.isArray(data.concurrentTasksData)) {
    data.concurrentTasksData.forEach((group, groupIndex) => {
      if (group.tasks && Array.isArray(group.tasks)) {
        group.tasks.forEach((task, taskIndex) => {
          if (task.devicePath && Array.isArray(task.devicePath)) {
            // 为不同的并发组使用不同的颜色
            const colors = ['#faad14', '#13c2c2', '#eb2f96', '#722ed1', '#f5222d'];
            const groupColor = colors[groupIndex % colors.length];
            
            highlightDevicePath(task.devicePath, groupColor);
          }
        });
      }
    });
  }
};

// 🎯 处理并发组错误高亮
const handleConcurrentGroupErrorHighlight = (data) => {
  console.log('❌ 处理并发组错误高亮:', data);
  
  // 以红色高亮错误的并发组路径
  if (data.concurrentTasksData && Array.isArray(data.concurrentTasksData)) {
    data.concurrentTasksData.forEach(group => {
      if (group.tasks && Array.isArray(group.tasks)) {
        group.tasks.forEach(task => {
          if (task.devicePath && Array.isArray(task.devicePath)) {
            highlightDevicePath(task.devicePath, '#f56c6c'); // 红色表示错误
          }
        });
      }
    });
  }
};

// 🎯 处理实时高亮消息
const handleRealTimeHighlight = (event) => {
  try {
    console.log('🎯 收到实时高亮消息:', event.data);
    
    // 🎯 检查消息格式，支持两种格式
    let highlightType, highlightData;
    
    if (event.data.highlightType) {
      // 原有格式：{ highlightType, data }
      highlightType = event.data.highlightType;
      highlightData = JSON.parse(event.data.data);
    } else if (event.data.type === 'REALTIME_HIGHLIGHT') {
      // 新格式：{ type: 'REALTIME_HIGHLIGHT', data }
      const data = JSON.parse(event.data.data);
      highlightType = data.action || 'UNKNOWN';
      highlightData = data;
    } else {
      console.warn('⚠️ 未识别的高亮消息格式:', event.data);
      return;
    }
    
    console.log('🔍 解析的高亮数据:', highlightData);
    
    // 🎯 根据不同的高亮类型处理
    switch (highlightType) {
      case 'STEP_STARTED':
        handleStepStartedHighlight(highlightData);
        break;
        
      case 'TASK_STATUS_UPDATE':
        handleTaskStatusHighlight(highlightData);
        break;
        
      case 'STEP_COMPLETED':
        handleStepCompletedHighlight(highlightData);
        break;
        
      case 'WORKFLOW_STARTED':
        handleWorkflowStartedHighlight(highlightData);
        break;
        
      case 'CONCURRENT_GROUP_STARTED':
        handleConcurrentGroupHighlight(highlightData);
        break;
        
      case 'CONCURRENT_GROUP_ERROR':
        handleConcurrentGroupErrorHighlight(highlightData);
        break;
        
      // 🎯 新增：处理工作流任务路径高亮
      case 'highlight_task_path':
        handleWorkflowTaskPathHighlight(highlightData);
        break;
        
      // 🎯 新增：处理清除高亮
      case 'clear_highlights':
        console.log('🎯 清除所有高亮');
        clearPathHighlight();
        currentWorkflowPaths.value.clear();
        break;
        
      default:
        console.log('🔍 未知的高亮类型:', highlightType);
        
        // 🎯 向后兼容：如果有devicePath，尝试传统高亮
        if (highlightData.devicePath && Array.isArray(highlightData.devicePath)) {
          console.log('🎯 使用传统设备路径高亮');
          highlightDevicePath(highlightData.devicePath, highlightData.highlightColor || '#ff6b35');
        }
        break;
    }
    
  } catch (error) {
    console.error('❌ 处理实时高亮消息失败:', error);
  }
};

// 🎯 处理工作流任务路径高亮
const handleWorkflowTaskPathHighlight = (highlightData) => {
  console.log('🎯 处理工作流任务路径高亮:', highlightData);
  
  if (!highlightData.devicePath || !Array.isArray(highlightData.devicePath)) {
    console.warn('⚠️ 工作流高亮数据中没有有效的设备路径');
    return;
  }
  
  const { devicePath, taskInfo, highlightColor } = highlightData;
  
  // 🎯 先清除之前的高亮
  clearPathHighlight();
  
  // 🎯 高亮当前任务路径
  try {
    console.log(`🎯 高亮工作流任务路径: ${taskInfo?.taskName || 'Unknown Task'}`);
    console.log('🎯 设备路径:', devicePath);
    
    highlightDevicePath(devicePath, highlightColor || '#ff6b35');
    
    // 🎯 记录当前工作流路径
    if (taskInfo) {
      currentWorkflowPaths.value.clear();
      devicePath.forEach(deviceId => {
        currentWorkflowPaths.value.add(deviceId);
      });
      
      console.log(`✅ 任务 "${taskInfo.taskName}" 路径高亮完成，包含 ${devicePath.length} 个设备`);
      
      // 🎯 在界面显示任务进度信息
      ElMessage.info({
        message: `正在执行: ${taskInfo.taskName} (${taskInfo.taskIndex}/${taskInfo.totalTasks})`,
        duration: 3000,
        showClose: true
      });
    }
    
  } catch (error) {
    console.error('❌ 工作流任务路径高亮失败:', error);
  }
};

</script>

<style scoped>
.main-container {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

/* 工具栏样式 */
.toolbar {
  position: fixed;
  top: 0px;
  right: 0px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 10%);
}

.tool-button {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 5px;
  color: #666;
  cursor: pointer;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  transition: all 0.3s;
}

.tool-button:hover {
  color: #1890ff;
  background: #f0f0f0;
}

.tool-button.active {
  color: #1890ff;
  background: #e6f7ff;
  border-color: #91d5ff;
}

.tool-button svg {
  margin-right: 5px;
}

/* 保存按钮样式 */
.save-button {
  color: white;
  background-color: #52c41a;
  border-color: #52c41a;
}

.save-button:hover {
  background-color: #73d13d;
  border-color: #73d13d;
}

/* 撤销按钮样式 */
.undo-button {
  color: white;
  background-color: #1890ff;
  border-color: #1890ff;
}

.undo-button:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.undo-button:disabled {
  color: #d9d9d9;
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  cursor: not-allowed;
  opacity: 0.6;
}

.operation-count {
  display: inline-block;
  padding: 0 4px;
  font-size: 12px;
  line-height: 16px;
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  margin-left: 5px;
}

.sidebar {
  position: fixed;
  top: 0px;
  bottom: 0;
  left: 0px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  width: 200px;
  padding: 20px;
  overflow-y: auto;
  background: white;
  box-shadow: 2px 0 10px rgb(0 0 0 / 10%);
  transition: all 0.3s;
  transform: translateX(0);
}

/* 当框架侧边栏折叠时的样式 */
.sidebar-collapsed {
  left: 54px; /* 框架侧边栏折叠后的宽度 */
}

/* 当侧边栏隐藏时的样式 */
.sidebar-hidden {
  transform: translateX(-100%);
}

/* 创建模式侧边栏样式 */
.create-mode-sidebar {
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
}

.create-mode-sidebar h3, .path-selector-sidebar h3 {
  padding: 10px 15px;
  margin-top: 0;
  margin-bottom: 15px;
  color: #1890ff;
  font-size: 18px;
  border-bottom: 1px solid #e0e0e0;
}

.create-mode-sidebar h4, .path-selector-sidebar h4 {
  padding: 0 15px;
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 16px;
}

/* 图标容器，让它可以滚动且占据主要空间 */
.icons-container {
  flex: 1;
  margin-bottom: 80px; /* 为底部按钮预留空间 */
  overflow-y: auto;
}

.icon-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin: 8px 0;
  cursor: move;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 6px;
  transition: all 0.3s;
}

.icon-item:hover {
  background: #f0f9ff;
  box-shadow: 0 2px 6px rgb(0 0 0 / 5%);
  transform: translateY(-2px);
}

.icon-image {
  display: block;
  width: 26px;
  height: 26px;
  margin-right: 10px;
}

/* 连线模式底部容器 */
.edge-mode-container {
  position: absolute;
  right: 0;
  bottom: 20px;
  left: 0;
  padding: 0 20px;
  padding-top: 15px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.edge-mode-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 15px;
  color: #666;
  cursor: pointer;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgb(0 0 0 / 5%);
  transition: all 0.3s;
}

.edge-mode-button:hover {
  color: #1890ff;
  background: #f0f0f0;
  transform: translateY(-2px);
}

.edge-mode-button.active {
  color: #1890ff;
  background: #e6f7ff;
  border-color: #91d5ff;
}

.edge-mode-button svg {
  margin-right: 8px;
}

/* 路径选择器侧边栏样式 */
.path-selector-sidebar {
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}

.path-section {
  margin-bottom: 15px;
  padding: 0 15px;
}

.path-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.path-option {
  padding: 8px 12px;
  cursor: pointer;
  background-color: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  transition: all 0.3s;
}

.path-option:hover {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.path-option.selected {
  color: white;
  background-color: #1890ff;
  border-color: #1890ff;
}

.custom-path {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f0f7ff;
  border-color: #c6e2ff;
}

.custom-path:hover {
  background-color: #e0f0ff;
}

/* 自定义路径选项中的删除按钮 */
.delete-path-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  margin-left: 8px;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 50%;
  transition: all 0.3s;
}

.delete-path-btn:hover {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
}

/* 图标说明区域样式 */
.icons-legend-section {
  margin-top: 20px;
  padding: 0 15px;
  border-top: 1px solid #eaeaea;
  padding-top: 15px;
}

.icons-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
  transition: all 0.3s;
}

.legend-item:hover {
  background-color: #f0f0f0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.legend-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  object-fit: contain;
}

.legend-item span {
  font-size: 13px;
  color: #333;
}

.graph-container {
  position: relative;
  height: 600px;
  left: 200px;
  margin-left: 0; /* 侧边栏宽度 */
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgb(0 0 0 / 5%);
  transition: margin 0.3s, border-color 0.3s;
}

/* 禁用拖拽时的样式 */
.graph-container.drag-disabled::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  content: "";
  background-color: rgb(0 0 0 / 2%);
  border-radius: 8px;
}

/* 当自定义侧边栏关闭时 */
.graph-container-full {
  margin-left: 0;
}

/* 当框架侧边栏折叠时 */
.graph-container-collapsed {
  margin-left: 254px; /* 框架侧边栏折叠宽度(54px) + 自定义侧边栏宽度(200px) */
}

/* 当自定义侧边栏关闭且框架侧边栏折叠时 */
.graph-container-full.graph-container-collapsed {
  margin-left: 54px; /* 仅框架侧边栏折叠宽度 */
}

.graph-container.create-mode {
  border: 2px dashed #1890ff;
  background-color: #fafafa;
}

/* 设备控制面板样式 */
.device-control-panel {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 50%);
}

.panel-content {
  box-sizing: border-box;
  width: 80%;
  max-width: 600px;
  padding: 20px;
  background-color: #fff;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

.device-info {
  display: flex;
  flex-direction: column;
}

/* 设备控制面板标题 */
.device-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.device-title {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.close-btn {
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  background: none;
  border: none;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #f56c6c;
}

.device-status {
  display: inline-block;
  padding: 5px 10px;
  margin-top: 8px;
  font-weight: bold;
  border-radius: 4px;
}

/* 设备状态颜色 */
.device-status.running,
.device-status.open,
.device-status.heating {
  color: #67c23a;
  background-color: #f0f9eb;
}

.device-status.stopped,
.device-status.closed,
.device-status.idle {
  color: #909399;
  background-color: #f4f4f5;
}

.device-status.error {
  color: #f56c6c;
  background-color: #fef0f0;
}

.device-status.cooling {
  color: #1890ff;
  background-color: #e6f7ff;
}

/* 控制面板分区样式 */
.device-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.current-status-section, .control-section {
  padding: 12px;
  border-radius: 6px;
  background-color: #f9f9f9;
  border: 1px solid #e8e8e8;
}

.current-status-section {
  background-color: #f0f7ff;
  border-color: #d0e6ff;
}

.control-section {
  background-color: #f6ffed;
  border-color: #d9f7be;
}

.section-title {
  font-weight: bold;
  font-size: 14px;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.status-label {
  color: #666;
  font-weight: 500;
}

.status-value {
  font-weight: bold;
  color: #1890ff;
}

@media screen and (min-width: 768px) {
  .device-controls {
    flex-direction: row;
  }
  
  .current-status-section, .control-section {
    flex: 1;
  }
}

.data-source-indicator {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
}

.data-source-indicator.connected {
  background-color: #52c41a;
  color: #fff;
}

.data-source-indicator.disconnected {
  background-color: #f56c6c;
  color: #fff;
}

/* 加载指示器样式 */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgb(255 255 255 / 80%);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f0f0f0;
  border-top: 5px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 15px;
  font-size: 16px;
  color: #1890ff;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误提示样式 */
.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  padding: 15px 20px;
  color: white;
  background-color: #f56c6c;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

.close-error-btn {
  margin-left: 10px;
  font-size: 18px;
  color: white;
  cursor: pointer;
  background: none;
  border: none;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  width: 400px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1890ff;
  font-size: 18px;
}

.dialog-form {
  margin-bottom: 20px;
}

.dialog-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.dialog-form input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.dialog-form p {
  margin: 10px 0;
}

.warning-text {
  color: #f56c6c;
  font-weight: bold;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
}

.dialog-buttons button {
  padding: 8px 16px;
  margin-left: 10px;
  cursor: pointer;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  transition: all 0.3s;
}

.dialog-buttons button:hover {
  background-color: #e6e6e6;
}

.primary-button {
  color: white;
  background-color: #1890ff !important;
  border-color: #1890ff !important;
}

.primary-button:hover {
  background-color: #40a9ff !important;
  border-color: #40a9ff !important;
}

/* 删除按钮样式 */
.danger-button {
  color: white !important;
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

.danger-button:hover {
  background-color: #f78989 !important;
  border-color: #f78989 !important;
}

/* WebSocket连接状态 */
.ws-status {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  padding: 5px 10px;
  color: white;
  background-color: #f56c6c;
  border-radius: 4px;
}

.ws-status.connected {
  background-color: #67c23a;
}

/* 硬件连接控制面板 */
.hardware-control-container {
  position: fixed;
  bottom: 20px;
  left: 220px; /* 侧边栏宽度 + 20px 边距 */
  right: 20px;
  z-index: 100;
  transition: left 0.3s;
}

/* 当侧边栏折叠时调整位置 */
.hardware-control-container.sidebar-collapsed {
  left: 74px; /* 框架侧边栏折叠宽度(54px) + 20px 边距 */
}

/* 当侧边栏隐藏时调整位置 */
.hardware-control-container.sidebar-hidden {
  left: 20px;
}

.hardware-control-card {
  margin-bottom: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.hardware-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hardware-card-content {
  padding: 10px 0;
}

.hardware-error-message {
  margin-top: 10px;
}

/* 设备选择对话框 */
.device-selection-dialog {
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.search-box {
  margin-bottom: 15px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.device-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.device-group {
  margin-bottom: 15px;
}

.group-title {
  padding: 5px 10px;
  font-weight: bold;
  background-color: #f5f5f5;
  border-left: 3px solid #1890ff;
  margin-bottom: 8px;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 5px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.device-item:hover {
  background-color: #f0f9ff;
  border-color: #91d5ff;
}

.device-info {
  font-weight: 500;
}

.device-type {
  color: #1890ff;
  font-size: 13px;
}

.device-id {
  font-size: 12px;
  color: #666;
}

.no-devices {
  padding: 20px;
  text-align: center;
  color: #999;
}

/* 启用/禁用按钮样式 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 🎯 运行状态指示器样式 - 新增 */
.running-tasks-indicator {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
  border-radius: 8px;
  padding: 12px 16px;
  margin-right: 15px;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
  min-width: 200px;
}

.indicator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.indicator-title {
  font-weight: 600;
  font-size: 14px;
}

.toggle-details-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-details-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.running-tasks-details {
  max-height: 200px;
  overflow-y: auto;
}

.running-task-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 6px;
  border-left: 3px solid rgba(255, 255, 255, 0.5);
}

.running-task-item:last-child {
  margin-bottom: 0;
}

.task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.task-name {
  font-weight: 500;
  font-size: 13px;
  flex: 1;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-progress {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.task-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  opacity: 0.9;
}

.current-device {
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 4px;
  border-radius: 3px;
}

.task-time {
  font-style: italic;
}

/* 运行中设备的脉动动画 */
@keyframes devicePulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
  }
}

.running-device {
  animation: devicePulse 2s infinite;
}

/* 高亮路径的样式 */
.highlighted-path {
  filter: drop-shadow(0 0 8px currentColor);
}
</style>
      