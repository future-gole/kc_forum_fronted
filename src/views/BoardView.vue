<template>
  <div class="board-container">
    <div class="board-header">
      <div class="board-title">
        <h1>{{ boardTitle }}</h1>
        <div class="board-stats">
          <span>{{ totalArticles }} 篇文章</span>
          <span>{{ activeUsers }} 活跃用户</span>
        </div>
      </div>
      <div class="board-actions">
        <el-switch
            v-model="showOnlyTop"
            active-color="#13ce66"
            inactive-color="#409EFF"
            active-text="只看置顶"
            inactive-text="全部文章"
        />
        <el-button type="primary" @click="createNewArticle">
          <el-icon><Plus /></el-icon>发布新文章
        </el-button>
      </div>
    </div>

    <el-skeleton :loading="loading" animated :count="4" :throttle="500">
      <template #template>
        <div class="skeleton-grid">
          <div v-for="i in 4" :key="i" class="skeleton-card">
            <el-skeleton-item variant="h3" style="width: 80%" />
            <div class="skeleton-user">
              <el-skeleton-item variant="circle" style="width: 40px; height: 40px" />
              <el-skeleton-item variant="text" style="width: 30%" />
            </div>
            <div class="skeleton-stats">
              <el-skeleton-item variant="text" style="width: 20%" />
              <el-skeleton-item variant="text" style="width: 20%" />
              <el-skeleton-item variant="text" style="width: 20%" />
            </div>
          </div>
        </div>
      </template>

      <template #default>
        <div class="articles-grid">
          <el-card
              v-for="article in displayedArticles"
              :key="article.id"
              class="article-card"
              :class="{ 'top-article': article.isTop === 1 }"
              shadow="hover"
              @click="viewArticle(article.id)"
          >
            <div class="article-header">
              <div class="article-title">
                <el-tag v-if="article.isTop === 1" type="danger" size="small" effect="dark">置顶</el-tag>
                {{ article.title }}
              </div>
              <div class="article-time">{{ formatTime(article.createTime) }}</div>
            </div>

            <div class="article-content-preview">
              {{ article.content ? article.content.substring(0, 60) + (article.content.length > 60 ? '...' : '') : '' }}
            </div>

            <div class="article-user" v-if="article.user">
              <el-avatar :src="getFullAvatarUrl(article.user.avatarUrl)" :size="40"></el-avatar>
              <span class="user-name">{{ article.user.nickName }}</span>
            </div>
            <div class="article-user" v-else>
              <el-avatar :src="defaultAvatarUrl" :size="40"></el-avatar>
              <span class="user-name">未知用户</span>
            </div>

            <div class="article-stats">
              <div class="stat-item">
                <el-icon><View /></el-icon>
                <span>{{ article.visitCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ article.replyCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <span><i class="heart-icon">❤</i>{{ article.likeCount || 0 }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </template>
    </el-skeleton>

    <div class="pagination-container" v-if="totalArticles > 0">
      <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next, jumper"
          :total="totalArticles"
          @current-change="handlePageChange"
          background
      />
    </div>

    <el-empty v-if="!loading && totalArticles === 0" description="暂无文章" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { View, ChatDotRound, Plus } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import request from "@/utils/request.js";

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const avatarBaseURL = 'http://localhost:58080/avatars';
const defaultAvatarUrl = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// Route and router
const route = useRoute();
const router = useRouter();

// Component state
const currentBoardId = ref(Number(route.params.boardId) || null);
const articles = ref([]);
const allBoardArticles = ref([]); // Store all articles for the board for client-side filtering
const loading = ref(true);
const showOnlyTop = ref(false);
const currentPage = ref(1);
const pageSize = ref(12);
const totalArticles = ref(0);
const activeUsers = ref(0);

const boardTitle = computed(() => route.query.title || '板块');

const getFullAvatarUrl = (path) => {
    return path
      ? avatarBaseURL + path
      : defaultAvatarUrl;
};

// This computed property now handles client-side filtering and pagination
const displayedArticles = computed(() => {
  let filtered = allBoardArticles.value;

  if (showOnlyTop.value) {
    filtered = filtered.filter(article => article.isTop === 1);
  }
  
  // Sort articles: top articles first, then by create time
  filtered.sort((a, b) => {
    if (a.isTop === 1 && b.isTop !== 1) return -1;
    if (a.isTop !== 1 && b.isTop === 1) return 1;
    return new Date(b.createTime) - new Date(a.createTime);
  });
  
  totalArticles.value = filtered.length;

  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filtered.slice(startIndex, endIndex);
});

// Fetching all articles for a board
const fetchAllArticlesForBoard = async () => {
  if (!currentBoardId.value) return;
  loading.value = true;
  try {
    // Assuming the backend has an endpoint to get ALL articles, not paginated.
    // If not, this logic would need to change to fetch all pages.
    // For now, we use the paginated endpoint and fetch a large number to simulate getting all.
    const response = await request.get('/article/getArticlesPageByBoardId', {
      params: {
        boardId: currentBoardId.value,
        currentPage: 1,
        pageSize: 1000, // Fetch a large number of articles
      },
    });

    if (response.data.code === 200) {
      const responseData = response.data.data;
      allBoardArticles.value = Array.isArray(responseData.record) ? responseData.record.map(article => ({
        ...article,
        content: article.content || '',
        user: article.user || { nickName: '未知用户', avatarUrl: null },
      })) : [];
      countActiveUsers();
    } else {
      ElMessage.error(response.data.message || '获取文章列表失败');
      allBoardArticles.value = [];
    }
  } catch (error) {
    console.error('获取文章列表出错:', error);
    ElMessage.error('网络错误，请稍后重试');
    allBoardArticles.value = [];
  } finally {
    loading.value = false;
  }
};


const countActiveUsers = () => {
  const uniqueUsers = new Set(allBoardArticles.value.map(article => article.user?.id).filter(id => id));
  activeUsers.value = uniqueUsers.size;
};

// Navigation
const viewArticle = (articleId) => {
  if (articleId) {
    router.push(`/home/article/${articleId}?title=${encodeURIComponent(boardTitle.value)}`);
  }
};

const createNewArticle = () => {
  if (currentBoardId.value) {
    router.push(`/home/create-article/${currentBoardId.value}?title=${encodeURIComponent(boardTitle.value)}`);
  } else {
    ElMessage.error('板块ID不存在');
  }
};

// Event handlers
const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Utility
const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time).fromNow();
};

// Lifecycle hooks and watchers
onMounted(() => {
    if (route.params.boardId) {
        currentBoardId.value = Number(route.params.boardId);
        fetchAllArticlesForBoard();
    }
});

watch(
  () => route.params.boardId,
  (newBoardId) => {
    const newId = Number(newBoardId);
    if (newId && newId !== currentBoardId.value) {
      currentBoardId.value = newId;
      currentPage.value = 1; // Reset to first page when board changes
      allBoardArticles.value = []; // Clear old data
      fetchAllArticlesForBoard();
    }
  }
);

watch(showOnlyTop, () => {
    currentPage.value = 1; // Reset to page 1 when filter changes
});
</script>


<style scoped>
.board-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px;
  color: #2c3e50;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(235, 238, 245, 0.6);
}

.board-title {
  display: flex;
  flex-direction: column;
}

.board-title h1 {
  margin: 0 0 12px 0;
  font-size: 32px;
  color: #1a2a3a;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.board-stats {
  color: #606266;
  font-size: 14px;
  display: flex;
  gap: 16px;
  font-weight: 500;
}

.board-stats span {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.board-stats span:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -8px;
  height: 12px;
  width: 1px;
  background-color: rgba(144, 147, 153, 0.3);
}

.board-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
  margin-bottom: 48px;
  position: relative;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

.skeleton-card {
  padding: 24px;
  border-radius: 16px;
  background-color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.skeleton-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0;
}

.skeleton-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
}

/* 小红书风格卡片设计 */
.article-card {
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  will-change: transform, box-shadow;
}

.article-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08), 0 6px 16px rgba(0, 0, 0, 0.06);
  background-color: rgba(252, 253, 255, 1);
}

.top-article {
  border: none;
  position: relative;
  box-shadow: 0 6px 24px rgba(245, 108, 108, 0.12);
  background-color: rgba(255, 252, 252, 0.5);
}

.top-article::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #f56c6c, #ff9a9e);
  z-index: 1;
}

.article-header {
  margin-bottom: 16px;
  padding: 24px 24px 0;
  position: relative;
}

.article-title {
  font-size: 19px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #1a2a3a;
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-title :deep(.el-tag) {
  border-radius: 4px;
  padding: 0 6px;
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  margin-top: 2px;
}

.article-time {
  font-size: 13px;
  color: #8c9aab;
  font-weight: 400;
  margin-bottom: 16px;
}

.article-content-preview {
  color: #5a6a7f;
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 24px;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  padding: 0 24px;
  font-weight: 400;
  min-height: 72px; /* 确保内容区域有一定高度，即使内容很少 */
}

.article-user {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 24px;
  position: relative;
}

.article-user::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 24px;
  right: 24px;
  height: 1px;
  background-color: rgba(240, 242, 245, 0.6);
}

.article-user :deep(.el-avatar) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #ffffff;
  transition: transform 0.2s ease;
}

.article-card:hover .article-user :deep(.el-avatar) {
  transform: scale(1.05);
}

.user-name {
  margin-left: 12px;
  font-size: 14px;
  color: #3a4a5a;
  font-weight: 500;
}

/* 小红书风格的互动数据栏 */
.article-stats {
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  background-color: rgba(250, 251, 253, 0.7);
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 13px;
  color: #8c9aab;
  padding: 6px 10px;
  border-radius: 20px;
}

.stat-item:hover {
  background-color: rgba(64, 158, 255, 0.08);
  transform: translateY(-2px);
}

/* 观看数样式 */
.stat-item:nth-child(1) {
  color: #409EFF;
}

.stat-item:nth-child(1) :deep(svg) {
  font-size: 18px;
  opacity: 0.9;
}

.stat-item:nth-child(1):hover {
  color: #66b1ff;
}

/* 评论数样式 */
.stat-item:nth-child(2) {
  color: #67C23A;
}

.stat-item:nth-child(2) :deep(svg) {
  font-size: 18px;
  opacity: 0.9;
}

.stat-item:nth-child(2):hover {
  color: #85ce61;
}

/* 点赞数样式 */
.stat-item:nth-child(3) {
  color: #f56c6c;
}

.stat-item:nth-child(3) span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item:nth-child(3):hover {
  color: #ff7c7c;
}

/* 心形图标样式 */
.heart-icon {
  display: inline-flex;
  font-size: 18px;
  transition: transform 0.3s ease;
}

.stat-item:nth-child(3):hover .heart-icon {
  transform: scale(1.2);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  margin-bottom: 20px;
}

.pagination-container :deep(.el-pagination) {
  padding: 0;
  font-weight: 500;
}

.pagination-container :deep(.el-pagination .el-pagination__total) {
  font-weight: 500;
  color: #606266;
}

.pagination-container :deep(.el-pagination button) {
  background-color: transparent;
  border: none;
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 4px;
}

.pagination-container :deep(.el-pagination .btn-next),
.pagination-container :deep(.el-pagination .btn-prev) {
  background-color: #f4f6f8;
  margin: 0 4px;
  transition: all 0.2s ease;
}

.pagination-container :deep(.el-pagination .btn-next:hover),
.pagination-container :deep(.el-pagination .btn-prev:hover) {
  background-color: #e9ecf2;
}

.pagination-container :deep(.el-pagination .el-pager li) {
  background-color: transparent;
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  font-weight: 500;
  border-radius: 4px;
  margin: 0 2px;
  transition: all 0.2s ease;
}

.pagination-container :deep(.el-pagination .el-pager li:not(.active):hover) {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
}

.pagination-container :deep(.el-pagination .el-pager li.active) {
  background-color: #409EFF;
  color: #ffffff;
  font-weight: 600;
}

@media (max-width: 768px) {
  .board-container {
    padding: 16px;
  }
  
  .board-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 16px;
  }

  .board-title h1 {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .board-actions {
    margin-top: 16px;
    width: 100%;
    justify-content: space-between;
  }

  .articles-grid {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }
  
  .skeleton-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .article-header {
    padding: 20px 20px 0;
  }
  
  .article-content-preview {
    padding: 0 20px;
    margin-bottom: 20px;
    min-height: 60px;
  }
  
  .article-user {
    padding: 0 20px;
  }
  
  .article-user::after {
    left: 20px;
    right: 20px;
  }
  
  .article-stats {
    padding: 14px 20px;
  }
}
</style>