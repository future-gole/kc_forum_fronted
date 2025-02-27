<template>
  <div id="app" class="app-container">
    <!-- 始终渲染 router-view，由路由守卫控制显示哪个组件 -->
      <router-view />
  </div>
</template>

<script setup>
//跳转逻辑在各自组件中判断，这里判断会有些冲突

</script>

<style >
html {
  height: 100%;
  lang: "zh-CN";
}
</style>