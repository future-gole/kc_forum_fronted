<template>
  <div class="home-container" :class="{ 'mobile': isMobile, 'sidebar-expanded': isSidebarExpanded && !isMobile, 'sidebar-collapsed': !isSidebarExpanded && !isMobile }">
    <Sidebar v-if="!isMobile" class="sidebar-component" @toggle-sidebar="updateSidebarState" />
    
    <MobileNavbar v-if="isMobile" :unread-mail-count="unreadMailCount" @open-mail-modal="handleOpenMailModalDefaults" />
    
    <div class="main-content-wrapper" :class="{ 'mobile-content': isMobile }">
      <div class="main-content-inner">
        <div class="top-right-actions desktop-only" v-if="!isMobile">
            <el-tooltip content="用户设置" placement="bottom">
              <el-button :icon="User" circle @click="goToUserPage(userStore.currentUserId)"></el-button>
            </el-tooltip>
            <el-tooltip content="站内信" placement="bottom">
              <el-badge :value="unreadMailCount" :hidden="unreadMailCount < 1" class="mail-badge" type="danger">
                <el-button :icon="Message" circle @click="handleOpenMailModalDefaults"></el-button>
              </el-badge>
            </el-tooltip>
        </div>

        <template v-if="isBaseHomeRoute">
          <transition name="fade-slide" appear>
            <el-carousel :interval="5000" arrow="always" :height="isMobile ? '200px' : '380px'" class="home-carousel" indicator-position="outside">
              <el-carousel-item v-for="item in carouselItems" :key="item.id">
                <img :src="item.image" :alt="item.alt" class="carousel-image"/>
              </el-carousel-item>
            </el-carousel>
          </transition>

          <transition name="fade-slide" appear>
            <div class="section-title">
              <el-icon><List /></el-icon>
              <h2>最新公告</h2>
            </div>
          </transition>
          
          <transition name="fade-slide" appear>
            <div class="announcement-section">
              <el-card class="box-card custom-card announcement-card">
                <el-collapse v-model="activeNames" accordion class="announcement-collapse">
                  <el-collapse-item 
                    v-for="(announcement, index) in announcements" 
                    :key="index" 
                    :title="announcement.title" 
                    :name="(index + 1).toString()"
                  >
                    <div>{{ announcement.content }}</div>
                    <div class="announcement-meta">
                      <span>发布于: {{ announcement.date }}</span>
                    </div>
                  </el-collapse-item>
                </el-collapse>
                <div v-if="announcements.length === 0" class="empty-announcements">
                  <el-empty description="暂无最新公告"></el-empty>
                </div>
                <div v-else class="view-more-link-container">
                    <el-button type="primary" link @click="viewMoreAnnouncements">查看全部公告 <el-icon class="el-icon--right"><ArrowRight /></el-icon></el-button>
                </div>
              </el-card>
            </div>
          </transition>
        </template> <router-view v-slot="{ Component }">
          <transition name="route-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>

      </div>
    </div>
    <MailModal 
      :visible="mailStore.isMailModalVisible" 
      @update:visible="handleMailModalVisibilityUpdate" 
    />
    </div>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue';
import MobileNavbar from '../components/MobileNavbar.vue';
import MailModal from '../components/MailModal.vue'; // 你的 MailModal 组件
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Message, List, Star, ArrowRight } from '@element-plus/icons-vue';
import { useUserStore } from "@/stores/user.js";
import { useMailStore } from '@/stores/mailStore'; // 【修改点】导入 mailStore
import { getUnreadCount } from "@/api/message";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const mailStore = useMailStore(); // 【修改点】使用 mailStore

const isMobile = ref(false);
// const mailModalVisible = ref(false); // 【修改点】移除本地的 mailModalVisible，改用 mailStore.isMailModalVisible
const unreadMailCount = ref(0);
const isSidebarExpanded = ref(true);

const isBaseHomeRoute = computed(() => {
  return route.path === '/home' || route.path === '/'; 
});

const carouselItems = ref([
  // ... (轮播图数据保持不变)
  { id: 1, image: 'https://c-ssl.duitang.com/uploads/blog/202404/07/73S2Q7nAIeB8wqa.jpg', alt: 'Scenic Landscape' },
  { id: 2, image: 'https://c-ssl.duitang.com/uploads/blog/202311/29/OoSzm8nJU6pEDvO.jpg', alt: 'Mountain Lake' },
  { id: 3, image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Forest Path' },
  { id: 4, image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Coastal View' },
]);

const announcements = ref([
  { title: '公告标题 2：kc_forum v1.0上线！！', content: '经过主包不谢努力,基本上完成了论坛第一版的全部功能', date: '2025-06-11' },
  { title: '公告标题 1：kc_forum v0.1上线！！', content: '先上一版试试水', date: '2025-03-03' },
]);
const activeNames = ref(['1']); // 默认展开第一个公告

const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
      isSidebarExpanded.value = false; // 移动端默认折叠侧边栏
      // 电脑端恢复侧边栏状态
      const storedSidebarState = localStorage.getItem('sidebarExpanded');
      isSidebarExpanded.value = storedSidebarState !== null ? JSON.parse(storedSidebarState) : true;
  }
};

const handleResize = () => checkIsMobile();

const goToUserPage = (userId) => {
  if (userId) {
    router.push(`/home/user-profile/${userId}`);
  } else {
    console.error("goToUserPage: userId is undefined or null. Current userStore state:", userStore);
  }
};

/**
 * 打开站内信弹窗到默认视图 (会话列表)
 * 这个方法会被顶部的“站内信”图标和 MobileNavbar 组件调用
 */
const handleOpenMailModalDefaults = () => {
  console.log('[Home.vue] Opening mail modal to default view.');
  mailStore.openMailModal(); // 调用 store action 打开，不指定特定用户
};

const viewMoreAnnouncements = () => router.push('/home/announcements'); // 确保路由路径正确


const getUnreadMail = async () => {
  try {
    const res = await getUnreadCount();
    // console.log('Unread mail count response:', res); // 调试日志
    if (res.data.code === 200 && typeof res.data.data === 'number') { // 确保 data 是数字
      unreadMailCount.value = res.data.data;
    } else if (res.data.code === 200) {
      console.warn('getUnreadCount returned data but not in expected number format:', res.data.data);
      unreadMailCount.value = 0; // 或其他默认处理
    }
  } catch (error) {
    console.error("获取未读消息失败", error);
    unreadMailCount.value = 0; // 出错时设为0
  }
};

const updateSidebarState = (isExpanded) => {
  isSidebarExpanded.value = isExpanded;
  if(!isMobile.value){ // 只在非移动端设备上保存侧边栏状态
    localStorage.setItem('sidebarExpanded', JSON.stringify(isExpanded));
  }
  console.log("Sidebar state updated in Home:", isExpanded);
};

/**
 * 【修改点】处理 MailModal 的 @update:visible 事件
 * 当 MailModal 内部关闭时（例如点击关闭按钮或按 ESC），它会 emit('update:visible', false)
 * 这个函数会捕获这个事件，并调用 store action 来更新全局状态。
 */
const handleMailModalVisibilityUpdate = (isVisible) => {
  if (!isVisible) { // 通常 MailModal 只会 emit false 来请求关闭
    mailStore.closeMailModal();
  }
  // 如果 MailModal 可能会 emit true (虽然在此场景下不太可能)，你也可以处理:
  // else { mailStore.openMailModal(); /* 或者其他逻辑 */ }
};

onMounted(async () => {
  checkIsMobile();
  window.addEventListener('resize', handleResize);
  // 确保 userStore.currentUserId 可用后再调用依赖它的函数
  if (userStore.currentUserId) { // 或者等待 userStore 初始化完毕
      getUnreadMail();
  } else {
      // 如果 currentUserId 可能延迟加载，监听其变化
      watch(() => userStore.currentUserId, (newUserId) => {
          if (newUserId) {
              getUnreadMail();
          }
      }, { immediate: true }); // immediate: true 确保如果值已存在也会立即执行
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>

.home-container {
  display: flex;
  min-height: 100vh;
  background-color: #f4f6f8; /* Lightened background */
  overflow-x: hidden;
  font-family:  sans-serif; 
  transition: padding-left 0.3s ease-in-out; /* For sidebar adjustment */
}

.sidebar-component {
  flex-shrink: 0;
}


.main-content-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  overflow-y: auto; /* Changed from scroll to auto */
  overflow-x: hidden;
  position: relative;
  padding-top: 0; /* Remove if MobileNavbar is fixed and provides its own space */
  transition: margin-left 0.3s ease-in-out; /* Smooth transition for content shift */
}

/* Logic for main content margin based on sidebar state (Desktop) */
.home-container:not(.mobile) .main-content-wrapper {
    margin-left: 84px; /* Default for collapsed sidebar */
}
.home-container.sidebar-expanded:not(.mobile) .main-content-wrapper {
    margin-left: 250px; /* Width of expanded sidebar */
}
/* Mobile: main content wrapper takes full width or has padding for fixed MobileNavbar */
.home-container.mobile .main-content-wrapper {
    margin-left: 0;
}

.main-content-inner {
  max-width: 1200px;
  width: 100%;
  padding: 25px;
  box-sizing: border-box;
  position: relative;
}

.main-content-wrapper.mobile .main-content-inner, /* Typo fix: no such class, should be on home-container */
.home-container.mobile .main-content-inner {
  padding-top: 70px; /* Space for MobileNavbar */
  padding-left: 15px;
  padding-right: 15px;
  padding-bottom: 20px;
}

.top-right-actions { /* Renamed for clarity */
  position: absolute;
  top: 30px; /* Adjusted position */
  right: 30px;
  z-index: 100;
  display: flex;
  gap: 15px; /* Increased gap */
}
.top-right-actions .el-button {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); /* Subtle shadow for buttons */
}

.mail-badge :deep(.el-badge__content) {
  transform: translate(50%, -35%); /* Fine-tune badge position */
}

.home-carousel {
  margin-bottom: 30px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Mobile Carousel Indicator Styling */
.home-carousel :deep(.el-carousel__indicators--outside) {
  bottom: 5px; /* Adjust position if needed */
}
.home-carousel :deep(.el-carousel__indicator .el-carousel__button) {
  background-color: rgba(255, 255, 255, 0.5); /* Semi-transparent dots */
  opacity: 0.7;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.home-carousel :deep(.el-carousel__indicator.is-active .el-carousel__button) {
  background-color: #ffffff; /* Active dot color */
  opacity: 1;
}
@media (max-width: 767px) {
  .home-carousel :deep(.el-carousel__arrow) {
    width: 28px; /* Slightly smaller arrows */
    height: 28px;
  }
  .home-carousel :deep(.el-carousel__arrow i) {
    font-size: 10px;
  }
}

/* Section Title Styling */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  margin-top: 30px; /* Space above titles */
}
.section-title .el-icon {
  font-size: 24px;
  color: #3b82f6; /* Theme color */
}
.section-title h2 {
  font-size: 22px;
  font-weight: 500; /* Slightly bolder */
  color: #333;
  margin: 0;
}

.announcement-section {
  margin-bottom: 30px;
}

.custom-card.announcement-card { /* Specific to announcement card */
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
  padding: 10px 20px 20px 20px; /* Adjusted padding for no header */
}

.announcement-meta {
  font-size: 0.8em;
  color: #888;
  margin-top: 10px;
  text-align: right;
}

.empty-announcements {
  padding: 20px 0;
}

.view-more-link-container {
    text-align: center;
    margin-top: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 500; /* Adjusted weight */
  color: #4A5568; /* Softer black */
}
.card-header .el-icon {
  margin-right: 8px;
  vertical-align: middle;
}

.announcement-collapse {
  border: none; /* Remove all borders from collapse itself */
}
:deep(.announcement-collapse .el-collapse-item) {
  border-bottom: 1px solid #f0f2f5; /* Separator for items */
}
:deep(.announcement-collapse .el-collapse-item:last-child) {
  border-bottom: none;
}
:deep(.announcement-collapse .el-collapse-item__header) {
  font-size: 16px;
  font-weight: 500; /* Header font weight */
  color: #2d3748; /* Darker for header */
  border-bottom: none; /* Remove individual header bottom border */
  padding-left: 0; /* Align with card padding */
  padding-right: 0;
}
:deep(.announcement-collapse .el-collapse-item__header.is-active) {
  color: #3b82f6; /* Theme color for active */
}
:deep(.announcement-collapse .el-collapse-item__wrap) {
  border-bottom: none;
}
:deep(.announcement-collapse .el-collapse-item__content) {
  padding: 15px 0px; /* Adjust padding */
  font-size: 14.5px; /* Slightly larger content text */
  color: #4a5568; 
  line-height: 1.75; 
}

/* Recommendation Section */

.recommendation-col {
  margin-bottom: 20px;
}
.recommendation-card {
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.recommendation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.12); /* Enhanced hover shadow */
}
.recommendation-content {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}
.recommendation-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-top: 15px;
  object-fit: cover;
}

/* Vue Transition Styles */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-list-move,
.fade-slide-list-enter-active,
.fade-slide-list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.fade-slide-list-enter-from,
.fade-slide-list-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}
.fade-slide-list-leave-active {
  position: absolute; /* For smooth list item removal */
}

/* Route transition */
.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity 0.3s ease;
}
.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
}

/* Mobile specific styles */
@media (max-width: 767px) {
  .desktop-only {
    display: none !important;
  }
  .main-content-inner {
    padding: 15px;
  }
  .main-content-wrapper.mobile .main-content-inner {
    padding-top: calc(env(safe-area-inset-top, 0px) + 70px); 
   }

  .carousel-section {
    /* height: 200px; (controlled by :height prop now) */
    border-radius: 12px; /* Consistent radius on mobile */
    margin-bottom: 25px;
  }
  .carousel-section :deep(.el-carousel__arrow) {
    width: 30px;
    height: 30px;
  }
  .carousel-section :deep(.el-carousel__arrow i) {
    font-size: 12px;
  }
  .carousel-section :deep(.el-carousel__indicators--horizontal .el-carousel__button) {
    width: 6px;
    height: 6px;
  }

  .section-title .el-icon { font-size: 20px; }
  .section-title h2 { font-size: 19px; }

  .custom-card.announcement-card {
    padding: 5px 15px 15px 15px;
  }
  :deep(.announcement-collapse .el-collapse-item__header) {
    font-size: 15px;
  }
  :deep(.announcement-collapse .el-collapse-item__content) {
    font-size: 14px;
  }
  .recommendation-card .card-header span {
    font-size: 16px;
  }
}
</style>