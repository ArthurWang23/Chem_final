// 设备监控路由
export default {
  path: "/monitor",
  redirect: "/monitor/index",
  meta: {
    icon: "Monitor", // 图标
    title: "设备监控", // 菜单标题
    rank: 4 // 排序，确保在合适的位置显示
  },
  children: [
    {
      path: "/monitor/index",
      name: "Monitor",
      component: () => import("@/views/monitor/index.vue"),
      meta: {
        title: "实时监控", // 页面标题
        keepAlive: true, // ✅ 启用页面缓存
        showLink: true
      }
    }
  ]
}; 