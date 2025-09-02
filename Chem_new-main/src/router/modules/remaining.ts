const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/monitor-standalone",
    name: "MonitorStandalone",
    component: () => import("@/views/monitor-standalone/index.vue"),
    meta: {
      title: "硬件监控"
    }
  },
  {
    path: "/topcontrol/index",
    name: "Topcontrol",
    component: () => import("@/views/topcontrol/index.vue"),
    meta: {
      title: "结构控制2"
    }
  },
  {
    path: "/viewInformation/index",
    name: "viewInformation",
    component: () => import("@/views/viewInformation/index.vue"),
    meta: {
      title: "视图界面"
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: "加载中...",
      showLink: false,
      rank: 102
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;