<template>
  <div class="sidebar" :class="{ 'is-open': isSidebarOpen }">
    <div class="sidebar-toggle" @click="toggleSidebar">
      <i v-if="!isSidebarOpen" class="el-icon-arrow-right" />
      <i v-else class="el-icon-arrow-left" />
    </div>
    <div class="sidebar-content">
      <div
        v-for="icon in icons"
        :key="icon.id"
        class="icon-item"
        draggable="true"
        @dragstart="handleDragStart(icon)"
      >
        <img :src="icon.src" alt="icon" class="icon-img" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  icons: Array // 图标列表
});

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const emit = defineEmits(["drag-start"]);

const handleDragStart = icon => {
  emit("drag-start", icon);
};
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 0;
  height: 100%;
  overflow: hidden;
  background: #f5f5f5;
  transition: width 0.3s ease;
}

.sidebar.is-open {
  width: 240px;
}

.sidebar-toggle {
  position: absolute;
  top: 10px;
  left: -30px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  background: #fff;
  border-radius: 4px;
  transition: left 0.3s ease;
}

.sidebar.is-open .sidebar-toggle {
  left: 210px;
}

.sidebar-content {
  padding: 20px;
}

.icon-item {
  padding: 8px;
  margin: 5px;
  cursor: move;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.icon-img {
  width: 32px;
  height: 32px;
}
</style>
