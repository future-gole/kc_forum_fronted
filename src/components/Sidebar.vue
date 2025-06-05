<template>
  <div class="shell" :class="{ 'expanded': isExpanded }" @mouseenter="expand" @mouseleave="collapse">
    <ul class="nav">
      <li :class="{ active: isActive('/home') || isActive('/')}" id="logo" @click="goHome">
        <a href="#">
          <div class="icon">
            <div class="imageBox">
              <img src="../assets/kc1.png" alt="Logo">
            </div>
          </div>
          <div class="text">welcome！</div>
        </a>
      </li>
      <!-- 板块列表 -->
      <li v-for="board in boards" :key="board.id" :class="{ active: isActive(`/home/board/${board.id}`) }">
        <router-link :to="`/home/board/${board.id}?title=${encodeURIComponent(board.name)}`">
          <div class="icon">
            <i class="iconfont icon-zhuti_tiaosepan"></i>
          </div>
          <div class="text">{{ board.name }}</div>
        </router-link>
      </li>
      <li>
        <a @click="logout">
          <div class="icon">
            <i class="iconfont icon-tuichu"></i>
          </div>
          <div class="text">退出登录</div>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import request from '@/utils/request';

const router = useRouter();
const route = useRoute();
const isExpanded = ref(false);
const boards = ref([]);

// 在setup函数的开始就设置token
const setupAxiosToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = token;
  }
};

const isActive = (path) => {
  return route.path.startsWith(path);
};

const goHome = () => {
  router.push('/home'); // 修改为直接跳转到 /home
}

const expand = () => {
  isExpanded.value = true;
};

const collapse = () => {
  isExpanded.value = false;
};

// 确保fetchBoards函数中也有token
const fetchBoards = async () => {
  try {
    // 由于响应拦截器已经处理了code不为200的情况
    // 并且直接返回了res而不是response，所以这里可以直接使用返回数据
    const res = await request.get('/board/topBoard');
    console.log(res);
    boards.value = res.data.data;
    console.log(boards.value);
  } catch (error) {
    console.error('获取板块列表失败:', error.message);
  }
};

// 登出时清除token
const logout = () => {
  localStorage.removeItem('token');
  // 同时也清除axios中的token
  delete axios.defaults.headers.common['Authorization'];
  router.push('/');
};

onMounted(() => {
  setupAxiosToken(); // 先设置token
  fetchBoards();     // 然后获取数据
});
</script>

<style scoped>
:root {
  --primary-blue: #3182ce;
  --primary-light-blue: #ebf8ff;
  --primary-dark-blue: #2c5282;
  --background-blue: #f0f8ff;
  --text-dark: #2d3748;
  --text-medium: #4a5568;
  --text-light: #718096;
  --border-color: #e2e8f0;
  --white: #ffffff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  list-style: none;
  text-decoration: none;
}

.shell {
  position: fixed;
  top: 0;
  left: 0;
  width: 84px;
  height: 100vh;
  background: var(--white);
  z-index: 9999;
  transition: width 0.5s;
  padding-left: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.shell.expanded {
  width: 300px;
}

.shell:hover {
  width: 300px;
}

.imageBox {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
}

.imageBox img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shell ul {
  position: relative;
  height: 100vh;
}

.shell ul li {
  position: relative;
  padding: 5px;
}

.active {
  background: #e4e9f5;
  border-top-left-radius: 50px;
  border-bottom-left-radius: 50px;
}

.active::before {
  content: "";
  position: absolute;
  top: -30px;
  right: 0;
  width: 30px;
  height: 30px;
  border-bottom-right-radius: 25px;
  box-shadow: 5px 5px 0 5px #e4e9f5;
  background: transparent;
}

.active::after {
  content: "";
  position: absolute;
  bottom: -30px;
  right: 0;
  width: 30px;
  height: 30px;
  border-top-right-radius: 25px;
  box-shadow: 5px -5px 0 5px #e4e9f5;
  background: transparent;
}

#logo {
  margin: 40px 0 100px 0;
}

.shell ul li a {
  position: relative;
  display: flex;
  white-space: nowrap;
  cursor: pointer;
  color: var(--text-dark);
  transition: color 0.2s ease;
}

.shell ul li a:hover {
  color: var(--primary-dark-blue);
}

.icon {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 60px;
  padding-left: 10px;
  height: 70px;
  color: #333;
  transition: 0.5s;
  color: rgb(110, 90, 240);
}

.icon i {
  font-size: 30px;
  z-index: 999;
}

.text {
  position: relative;
  height: 70px;
  display: flex;
  align-items: center;
  font-size: 20px;
  color: #333;
  padding-left: 15px;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: 0.5s;
}

.shell ul li:hover a .icon,
.shell ul li:hover a .text {
  color: #ffa117;
}

.active a .icon::before {
  content: "";
  position: absolute;
  inset: 5px;
  width: 60px;
  background: #fff;
  border-radius: 50%;
  transition: 0.5s;
  border: 7px solid rgb(110, 90, 240);
  box-sizing: border-box;
}
</style>