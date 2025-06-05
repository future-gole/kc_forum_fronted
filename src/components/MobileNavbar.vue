<template>
  <div class="mobile-navbar">
    <div class="mobile-header">
      <div class="mobile-logo" @click="goHome">
        <img src="../assets/kc1.png" alt="Logo">
        <span>wwelcome!</span>
      </div>
      <div class="header-actions">
        <el-badge :value="unreadMailCount" :hidden="unreadMailCount === 0" class="action-badge">
          <div class="action-icon" @click="handleOpenMailModal" title="站内信">
            <el-icon><Message /></el-icon>
          </div>
        </el-badge>
        <div class="action-icon" @click="goToUserPage" title="用户设置">
          <el-icon><User /></el-icon>
        </div>
        <div class="menu-toggle action-icon" @click="toggleMenu">
          <el-icon v-if="!isMenuOpen"><Menu /></el-icon>
          <el-icon v-else><Close /></el-icon>
        </div>
      </div>
    </div>
    
    <transition name="slide-down">
      <div class="mobile-menu" v-if="isMenuOpen">
        <ul class="nav-items">
          <li v-for="board in boards" :key="board.id" :class="{ active: isActive(`/home/board/${board.id}`) }">
            <router-link :to="`/home/board/${board.id}?title=${encodeURIComponent(board.name)}`" @click="closeMenu">
              <el-icon><Folder /></el-icon>
              <span>{{ board.name }}</span>
            </router-link>
          </li>
          <li>
            <a @click="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </a>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import request from '@/utils/request';
// Import Element Plus icons
import { User, Message, Menu, Close, Folder, SwitchButton } from '@element-plus/icons-vue';

const props = defineProps({
  unreadMailCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['open-mail-modal']);

const router = useRouter();
const route = useRoute();
const isMenuOpen = ref(false);
const boards = ref([]);

const isActive = (path) => {
  return route.path.startsWith(path);
};

const goHome = () => {
  router.push('/home');
  closeMenu();
};

const goToUserPage = () => {
  router.push('/user');
  closeMenu(); // Close menu if open after navigation
};

const handleOpenMailModal = () => {
  emit('open-mail-modal');
  closeMenu(); // Close menu if open when opening modal
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeMenu = () => {
  isMenuOpen.value = false;
  document.body.style.overflow = '';
};

const fetchBoards = async () => {
  try {
    const res = await request.get('/board/topBoard');
    boards.value = res.data.data;
  } catch (error) {
    console.error('获取板块列表失败:', error.message);
  }
};

const logout = () => {
  localStorage.removeItem('token');
  router.push('/');
  closeMenu();
};

onMounted(() => {
  fetchBoards();
});
</script>

<style scoped>
.mobile-navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background-color: #fff; /* Changed from linear gradient for consistency with menu */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px; /* Adjusted padding */
  height: 60px;
  /* background: linear-gradient(to right, #3182ce, #63b3ed); Reverted to simpler bg */
  background-color: #3b82f6; /* Example: A nice blue */
  color: white;
}

.mobile-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.mobile-logo img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
  border: 2px solid white;
}

.mobile-logo span {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 5px; /* spacing between icons */
}

.action-icon {
  font-size: 22px; /* Slightly smaller icons */
  cursor: pointer;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease-in-out;
}

.action-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.action-badge {
  display: flex; /* For badge alignment with icon */
  align-items: center;
  justify-content: center;
}

.action-badge :deep(.el-badge__content) {
  transform: translate(50%, -30%); /* Fine-tune badge position */
  z-index: 1;
}

.menu-toggle { /* menu-toggle is now also an action-icon */
  /* Styles inherited from .action-icon */
}

.mobile-menu {
  background-color: #fff;
  border-top: 1px solid #eee;
  max-height: calc(100vh - 60px - env(safe-area-inset-bottom, 0px)); /* Account for safe area */
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.nav-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-items li {
  border-bottom: 1px solid #eee;
}

.nav-items li a {
  display: flex;
  align-items: center;
  padding: 15px 20px; /* Increased padding */
  color: #333;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.nav-items li.active a {
  background-color: #ebf8ff;
  color: #3b82f6;
  /* border-left: 4px solid #3b82f6; */ /* Optional: can remove for cleaner look */
}

.nav-items li a .el-icon {
  margin-right: 15px;
  font-size: 20px;
  color: #3b82f6;
}

.nav-items li:hover a {
  background-color: #f0f9ff; /* Lighter hover */
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out; /* Smoother transition */
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%); /* Slide from top fully */
}

/* Removed custom icon overrides as we are using official El-Plus icons now */
</style> 