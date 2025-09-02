import { defineStore } from "pinia";
import { ref, reactive } from "vue";

/**
 * 页面状态管理Store - 解决页面切换时状态丢失问题
 */
export const usePageStateStore = defineStore("pageState", () => {
  // ========== Task页面状态 ==========
  const taskPageState = reactive({
    selectedRows: [], // 选中的任务行
    isScheduling: false, // 是否正在调度
    isExecutingWorkflow: false, // 是否正在执行工作流
    schedulingResults: null, // 调度结果
    concurrentGroups: [], // 并发分组结果
    lastScheduleTime: null, // 最后调度时间
    tableData: [], // 表格数据
    currentTab: 'task-list', // 当前选中的标签页
    searchFilter: '', // 搜索过滤条件
    sortOrder: 'desc', // 排序方式
    paginationConfig: { // 分页配置
      currentPage: 1,
      pageSize: 20,
      total: 0
    },
    scrollPosition: 0, // 滚动位置
    expandedRows: [], // 展开的行
    workflowExecutionHistory: [], // 工作流执行历史
    lastOperationTime: null // 最后操作时间
  });

  // ========== Monitor页面状态 ==========
  const monitorPageState = reactive({
    isIframeLoaded: false, // iframe是否已加载
    currentStructureId: null, // 当前加载的结构ID
    graphInitialized: false, // 图形是否已初始化
    autoLoadCompleted: false, // 自动加载是否完成
    iframeInitialized: false, // iframe是否已初始化
    lastLoadTime: 0, // 最后加载时间
    selectedDevices: [], // 选中的设备
    monitorFilters: {}, // 监控过滤条件
    realTimeDataEnabled: true, // 是否启用实时数据
    viewportSettings: { // 视图设置
      zoom: 1,
      pan: { x: 0, y: 0 },
      showLabels: true,
      showConnections: true
    },
    deviceStatusHistory: [], // 设备状态历史
    alertsConfig: { // 告警配置
      enabled: true,
      level: 'warning'
    },
    layoutMode: 'auto', // 布局模式
    refreshInterval: 5000, // 刷新间隔
    lastRefreshTime: null // 最后刷新时间
  });

  // ========== Synthesis页面状态 ==========  
  const synthesisPageState = reactive({
    searchQuery: '', // 搜索查询
    activeTab: 'Single-Step', // 活跃标签
    configOptions: {
      tag1: 'Templete',
      condition1: 'with conditions',
      rank1: '10',
      tag2: 'Templete', 
      condition2: 'with conditions',
      rank2: '10',
      tag3: 'Templete',
      condition3: 'with conditions', 
      rank3: '10'
    },
    treeList: [], // 树列表
    currentSlide: 0, // 当前幻灯片
    graphContainer: null, // 图形容器
    uploadedFiles: [], // 上传的文件
    analysisResults: [], // 分析结果
    lastAnalysisTime: null // 最后分析时间
  });

  // ========== 全局页面状态 ==========
  const globalPageState = reactive({
    lastVisitedPages: [], // 最后访问的页面
    pageTransitionHistory: [], // 页面转换历史
    userPreferences: {}, // 用户偏好设置
    sessionStartTime: new Date().toISOString() // 会话开始时间
  });

  // ========== Task页面操作方法 ==========
  const updateTaskSelectedRows = (rows: any[]) => {
    taskPageState.selectedRows = [...rows];
    taskPageState.lastOperationTime = new Date().toISOString();
  };

  const updateTaskSchedulingStatus = (isScheduling: boolean) => {
    taskPageState.isScheduling = isScheduling;
    if (isScheduling) {
      taskPageState.lastScheduleTime = new Date().toISOString();
    }
  };

  const updateTaskExecutionStatus = (isExecuting: boolean) => {
    taskPageState.isExecutingWorkflow = isExecuting;
    taskPageState.lastOperationTime = new Date().toISOString();
  };

  const updateTaskSchedulingResults = (results: any) => {
    taskPageState.schedulingResults = results;
    taskPageState.lastScheduleTime = new Date().toISOString();
  };

  const updateTaskConcurrentGroups = (groups: any[]) => {
    taskPageState.concurrentGroups = [...groups];
  };

  const updateTaskTableData = (data: any[]) => {
    taskPageState.tableData = [...data];
  };

  const updateTaskCurrentTab = (tab: string) => {
    taskPageState.currentTab = tab;
  };

  const updateTaskPaginationConfig = (config: any) => {
    Object.assign(taskPageState.paginationConfig, config);
  };

  const updateTaskScrollPosition = (position: number) => {
    taskPageState.scrollPosition = position;
  };

  const updateTaskExpandedRows = (rows: any[]) => {
    taskPageState.expandedRows = [...rows];
  };

  const addTaskWorkflowHistory = (execution: any) => {
    taskPageState.workflowExecutionHistory.unshift({
      ...execution,
      timestamp: new Date().toISOString()
    });
    // 保留最近50条记录
    if (taskPageState.workflowExecutionHistory.length > 50) {
      taskPageState.workflowExecutionHistory = taskPageState.workflowExecutionHistory.slice(0, 50);
    }
  };

  const clearTaskPageState = () => {
    Object.assign(taskPageState, {
      selectedRows: [],
      isScheduling: false,
      isExecutingWorkflow: false,
      schedulingResults: null,
      concurrentGroups: [],
      lastScheduleTime: null,
      tableData: [],
      currentTab: 'task-list',
      searchFilter: '',
      sortOrder: 'desc',
      paginationConfig: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      },
      scrollPosition: 0,
      expandedRows: [],
      workflowExecutionHistory: [],
      lastOperationTime: null
    });
  };

  // ========== Monitor页面操作方法 ==========
  const updateMonitorIframeStatus = (loaded: boolean) => {
    monitorPageState.isIframeLoaded = loaded;
    if (loaded) {
      monitorPageState.lastLoadTime = Date.now();
    }
  };

  const updateMonitorCurrentStructure = (structureId: string | null) => {
    monitorPageState.currentStructureId = structureId;
  };

  const updateMonitorGraphStatus = (initialized: boolean) => {
    monitorPageState.graphInitialized = initialized;
  };

  const updateMonitorAutoLoadStatus = (completed: boolean) => {
    monitorPageState.autoLoadCompleted = completed;
  };

  const updateMonitorIframeInitialized = (initialized: boolean) => {
    monitorPageState.iframeInitialized = initialized;
    if (initialized) {
      monitorPageState.lastLoadTime = Date.now();
    }
  };

  const updateMonitorSelectedDevices = (devices: any[]) => {
    monitorPageState.selectedDevices = [...devices];
  };

  const updateMonitorViewportSettings = (settings: any) => {
    Object.assign(monitorPageState.viewportSettings, settings);
  };

  const updateMonitorRealTimeStatus = (enabled: boolean) => {
    monitorPageState.realTimeDataEnabled = enabled;
  };

  const updateMonitorRefreshTime = () => {
    monitorPageState.lastRefreshTime = new Date().toISOString();
  };

  const addMonitorDeviceStatusHistory = (status: any) => {
    monitorPageState.deviceStatusHistory.unshift({
      ...status,
      timestamp: new Date().toISOString()
    });
    // 保留最近100条记录
    if (monitorPageState.deviceStatusHistory.length > 100) {
      monitorPageState.deviceStatusHistory = monitorPageState.deviceStatusHistory.slice(0, 100);
    }
  };

  const clearMonitorPageState = () => {
    Object.assign(monitorPageState, {
      isIframeLoaded: false,
      currentStructureId: null,
      graphInitialized: false,
      autoLoadCompleted: false,
      iframeInitialized: false,
      lastLoadTime: 0,
      selectedDevices: [],
      monitorFilters: {},
      realTimeDataEnabled: true,
      viewportSettings: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        showLabels: true,
        showConnections: true
      },
      deviceStatusHistory: [],
      alertsConfig: {
        enabled: true,
        level: 'warning'
      },
      layoutMode: 'auto',
      refreshInterval: 5000,
      lastRefreshTime: null
    });
  };

  // ========== Synthesis页面操作方法 ==========
  const updateSynthesisSearchQuery = (query: string) => {
    synthesisPageState.searchQuery = query;
  };

  const updateSynthesisActiveTab = (tab: string) => {
    synthesisPageState.activeTab = tab;
  };

  const updateSynthesisConfigOptions = (options: any) => {
    Object.assign(synthesisPageState.configOptions, options);
  };

  const updateSynthesisTreeList = (list: any[]) => {
    synthesisPageState.treeList = [...list];
  };

  const updateSynthesisCurrentSlide = (slide: number) => {
    synthesisPageState.currentSlide = slide;
  };

  const addSynthesisAnalysisResult = (result: any) => {
    synthesisPageState.analysisResults.unshift({
      ...result,
      timestamp: new Date().toISOString()
    });
    synthesisPageState.lastAnalysisTime = new Date().toISOString();
  };

  // ========== 全局状态操作方法 ==========
  const addVisitedPage = (pagePath: string) => {
    const visited = {
      path: pagePath,
      timestamp: new Date().toISOString()
    };
    
    // 移除重复的页面记录
    globalPageState.lastVisitedPages = globalPageState.lastVisitedPages.filter(
      (page: any) => page.path !== pagePath
    );
    
    // 添加到最前面
    globalPageState.lastVisitedPages.unshift(visited);
    
    // 保留最近10个页面
    if (globalPageState.lastVisitedPages.length > 10) {
      globalPageState.lastVisitedPages = globalPageState.lastVisitedPages.slice(0, 10);
    }
  };

  const updateUserPreferences = (preferences: any) => {
    Object.assign(globalPageState.userPreferences, preferences);
  };

  // ========== 完整状态重置 ==========
  const resetAllPageStates = () => {
    clearTaskPageState();
    clearMonitorPageState();
    globalPageState.lastVisitedPages = [];
    globalPageState.pageTransitionHistory = [];
  };

  // ========== 状态持久化 ==========
  const saveStateToLocalStorage = () => {
    try {
      const stateToSave = {
        taskPageState: { ...taskPageState },
        monitorPageState: { ...monitorPageState },
        synthesisPageState: { ...synthesisPageState },
        globalPageState: { ...globalPageState },
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('pageStateBackup', JSON.stringify(stateToSave));
      console.log('✅ 页面状态已保存到本地存储');
    } catch (error) {
      console.warn('❌ 保存页面状态到本地存储失败:', error);
    }
  };

  const loadStateFromLocalStorage = () => {
    try {
      const savedState = localStorage.getItem('pageStateBackup');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // 检查是否是当天的数据（避免过时数据）
        const savedDate = new Date(parsed.savedAt);
        const now = new Date();
        const timeDiff = now.getTime() - savedDate.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        
        if (hoursDiff < 24) { // 只恢复24小时内的状态
          Object.assign(taskPageState, parsed.taskPageState);
          Object.assign(monitorPageState, parsed.monitorPageState);
          Object.assign(synthesisPageState, parsed.synthesisPageState);
          Object.assign(globalPageState, parsed.globalPageState);
          console.log('✅ 页面状态已从本地存储恢复');
          return true;
        } else {
          console.log('⏰ 本地存储的状态已过期，跳过恢复');
        }
      }
    } catch (error) {
      console.warn('❌ 从本地存储加载页面状态失败:', error);
    }
    return false;
  };

  // 返回所有状态和方法
  return {
    // 状态
    taskPageState,
    monitorPageState,
    synthesisPageState,
    globalPageState,
    
    // Task页面方法
    updateTaskSelectedRows,
    updateTaskSchedulingStatus,
    updateTaskExecutionStatus,
    updateTaskSchedulingResults,
    updateTaskConcurrentGroups,
    updateTaskTableData,
    updateTaskCurrentTab,
    updateTaskPaginationConfig,
    updateTaskScrollPosition,
    updateTaskExpandedRows,
    addTaskWorkflowHistory,
    clearTaskPageState,
    
    // Monitor页面方法
    updateMonitorIframeStatus,
    updateMonitorCurrentStructure,
    updateMonitorGraphStatus,
    updateMonitorAutoLoadStatus,
    updateMonitorIframeInitialized,
    updateMonitorSelectedDevices,
    updateMonitorViewportSettings,
    updateMonitorRealTimeStatus,
    updateMonitorRefreshTime,
    addMonitorDeviceStatusHistory,
    clearMonitorPageState,
    
    // Synthesis页面方法
    updateSynthesisSearchQuery,
    updateSynthesisActiveTab,
    updateSynthesisConfigOptions,
    updateSynthesisTreeList,
    updateSynthesisCurrentSlide,
    addSynthesisAnalysisResult,
    
    // 全局方法
    addVisitedPage,
    updateUserPreferences,
    resetAllPageStates,
    saveStateToLocalStorage,
    loadStateFromLocalStorage
  };
}); 