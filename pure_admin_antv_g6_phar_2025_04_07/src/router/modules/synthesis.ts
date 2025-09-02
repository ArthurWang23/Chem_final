// 最简代码，也就是这些字段必须有
export default {
  path: "/synthesis",
  meta: {
    title: "Synthesis Analysis"
  },
  redirect: "/synthesis/index",
  children: [
    {
      path: "/synthesis/index",
      name: "Synthesis",
      component: () => import("@/views/synthesis/index.vue"),
      meta: {
        title: "Synthesis Analysis"
      }
    }
  ]
};
