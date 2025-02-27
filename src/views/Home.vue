<template>
  <div class="home-container">
    <Sidebar />
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue';
</script>

<style scoped>
.home-container {
  display: flex;
}

.main-content {
  flex-grow: 1;
  padding: 20px;
  margin-left: 84px; /* 默认边距，对应折叠状态 */
  transition: margin-left 0.5s; /* 平滑过渡 */
}

/* 当侧边栏展开时，增加 main-content 的左边距 */
.shell.expanded + .main-content {
  margin-left: 300px;
}
</style>