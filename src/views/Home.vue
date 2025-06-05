<template>
  <div class="home-container" :class="{ 'mobile': isMobile, 'sidebar-expanded': isSidebarExpanded && !isMobile, 'sidebar-collapsed': !isSidebarExpanded && !isMobile }">
    <!-- 电脑端侧边栏 -->
    <Sidebar v-if="!isMobile" class="sidebar-component" @toggle-sidebar="updateSidebarState" />
    
    <!-- 移动端导航栏 -->
    <MobileNavbar v-if="isMobile" :unread-mail-count="unreadMailCount" @open-mail-modal="openMailModal" />
    
    <div class="main-content-wrapper" :class="{ 'mobile-content': isMobile }">
      <div class="main-content-inner">
        <!-- Desktop-only top-right buttons -->
        <div class="top-right-actions desktop-only" v-if="!isMobile">
            <el-tooltip content="用户设置" placement="bottom">
              <el-button :icon="User" circle @click="goToUserPage"></el-button>
            </el-tooltip>
            <el-tooltip content="站内信" placement="bottom">
              <el-badge :value="unreadMailCount" :hidden="unreadMailCount < 1" class="mail-badge" type="danger">
                <el-button :icon="Message" circle @click="openMailModal"></el-button>
              </el-badge>
            </el-tooltip>
        </div>

        <!-- Conditionally render homepage content based on route -->
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
          
          <transition name="fade-slide" appear>
            <div class="section-title">
              <el-icon><Star /></el-icon>
              <h2>热门推荐</h2>
            </div>
          </transition>
          <transition-group tag="el-row" :gutter="20" name="fade-slide-list" class="recommendation-row" appear>
            <el-col :xs="24" :sm="12" :md="8" v-for="i in 3" :key="i" class="recommendation-col">
              <el-card class="box-card recommendation-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>推荐内容 {{i}}</span>
                    <el-button class="button" text>详情</el-button>
                  </div>
                </template>
                <div class="recommendation-content">
                  这里是一些推荐内容的简介，吸引用户点击查看更多详情。
                  <img :src="`https://picsum.photos/300/150?random=${i}`" alt="Recommendation Image" class="recommendation-image">
                </div>
              </el-card>
            </el-col>
          </transition-group>
        </template> <!-- End of v-if="isBaseHomeRoute" -->

        <router-view v-slot="{ Component }">
          <transition name="route-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>

      </div>
    </div>
    <MailModal v-model:visible="mailModalVisible" :current-user-id="currentUserId" />
  </div>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue';
import MobileNavbar from '../components/MobileNavbar.vue';
import MailModal from '../components/MailModal.vue';
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Message, List, Star, ArrowRight } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const isMobile = ref(false);
const mailModalVisible = ref(false);
const unreadMailCount = ref(0);
const currentUserId = ref(null);
const isSidebarExpanded = ref(true);

const isBaseHomeRoute = computed(() => {
  return route.path === '/home' || route.path === '/'; 
});

const carouselItems = ref([
  { id: 1, image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Scenic Landscape' },
  { id: 2, image: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Mountain Lake' },
  { id: 3, image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Forest Path' },
  { id: 4, image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Coastal View' },
]);

const announcements = ref([
  { title: '公告标题 1：系统维护通知', content: '我们将在X月X日进行系统维护，期间服务可能会短暂中断，敬请谅解。', date: '2024-03-10' },
  { title: '公告标题 2：新功能上线', content: '令人兴奋的新功能已经上线，包括用户自定义主题和增强的搜索功能，快来体验吧！', date: '2024-03-08' },
  { title: '公告标题 3：节假日活动预告', content: '为庆祝传统佳节，我们将举办一系列线上活动，丰厚奖品等您拿！', date: '2024-03-05' },
]);
const activeNames = ref(['1']);

const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
      isSidebarExpanded.value = false;
  } else {
      const storedSidebarState = localStorage.getItem('sidebarExpanded');
      isSidebarExpanded.value = storedSidebarState !== null ? JSON.parse(storedSidebarState) : true;
  }
};

const handleResize = () => checkIsMobile();

const goToUserPage = () => router.push('/user');
const openMailModal = () => mailModalVisible.value = true;
const viewMoreAnnouncements = () => router.push('/announcements');

const getCurrentUserId = async () => {
  const storedId = localStorage.getItem('userId');
  if (storedId) return parseInt(storedId, 10);
  return new Promise(resolve => setTimeout(() => resolve(123), 100)); 
};

const getUnreadMail = async () => {
  return new Promise(resolve => setTimeout(() => {
    const count = Math.floor(Math.random() * 6);
    resolve(count);
  }, 500));
};

const updateSidebarState = (isExpanded) => {
  isSidebarExpanded.value = isExpanded;
  localStorage.setItem('sidebarExpanded', JSON.stringify(isExpanded));
  console.log("Sidebar state updated in Home:", isExpanded);
};

onMounted(async () => {
  checkIsMobile();
  window.addEventListener('resize', handleResize);
  currentUserId.value = await getCurrentUserId();
  unreadMailCount.value = await getUnreadMail();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* Import a nice Google Font */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');

.home-container {
  display: flex;
  min-height: 100vh;
  background-color: #f4f6f8; /* Lightened background */
  overflow-x: hidden;
  font-family: 'Noto Sans SC', sans-serif; /* Apply modern font */
  transition: padding-left 0.3s ease-in-out; /* For sidebar adjustment */
}

.sidebar-component {
  flex-shrink: 0;
  /* Sidebar should manage its own width via props or internal state */
  /* transition: width 0.3s ease-in-out; */
}

/* Adjustments for when sidebar is present and its state */
.home-container.sidebar-collapsed .main-content-wrapper {
   /* Adjust based on your collapsed sidebar width */
  /* This might not be needed if sidebar is absolutely positioned or flex item correctly shrinks */
}

.home-container.sidebar-expanded .main-content-wrapper {
  /* Adjust based on your expanded sidebar width */
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
   .home-carousel :deep(.el-carousel__indicators--outside) {
    /* Hide indicators on mobile if they are too obtrusive, or style them smaller */
    /* display: none; */ 
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
.recommendation-row {
  /* This class is for the transition-group tag */
}
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