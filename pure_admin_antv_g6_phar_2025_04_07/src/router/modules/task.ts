// 最简代码，也就是这些字段必须有
export default {
  path: "/task",
  meta: {
    title: "Task List"
  },
  redirect: "/task/index",
  children: [
    {
      path: "/task/index",
      name: "Task",
      component: () => import("@/views/task/index.vue"),
      meta: {
        title: "Task List",
        keepAlive: true, // ✅ 启用页面缓存
        showLink: true,
        icon: "ep:list"
      }
    }
  ]
}