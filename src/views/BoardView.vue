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
              <!-- 使用计算属性来拼接完整的头像 URL -->
              <el-avatar :src="article.user.avatarUrl ? avatarBaseURL + article.user.avatarUrl : defaultAvatar" :size="40"></el-avatar>
              <span class="user-name">{{ article.user.nickName }}</span>
            </div>
            <div class="article-user" v-else>
              <el-avatar :src="defaultAvatar" :size="40"></el-avatar>
              <span class="user-name">未知用户</span>
            </div>

            <div class="article-stats">
              <div class="stat-item" style="color: #409EFF;">
                <el-icon><View /></el-icon>
                <span>{{ article.visitCount || 0 }}</span>
              </div>
              <div class="stat-item" style="color: #409EFF;">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ article.replyCount || 0 }}</span>
              </div>
              <div class="stat-item" style="color: #409EFF;">
                <span>❤  {{ article.likeCount || 0 }}</span>
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
import {View, ChatDotRound, Star, Plus, SuccessFilled, Check} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import request from "@/utils/request.js";

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// 头像的 baseURL，需要和后端配置的 avatar-base-url 对应
const avatarBaseURL = 'http://localhost:58080/avatars';

// Route and router
const route = useRoute();
const router = useRouter();

// Data
const currentBoardId = ref(Number(route.params.boardId) || 1); // 确保 boardId 是数字
const articles = ref([]);
const loading = ref(true);
const showOnlyTop = ref(false);
const currentPage = ref(1);
const pageSize = ref(12);
const totalArticles = ref(0);
const activeUsers = ref(0);
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';


// 从 URL 查询参数获取板块标题
const boardTitle = computed(() => {
  return route.query.title || '板块';
});

// Computed properties
const displayedArticles = computed(() => {
  if (!articles.value || articles.value.length === 0) {
    return [];
  }

  let filteredArticles = articles.value;
  if (showOnlyTop.value) {
    filteredArticles = filteredArticles.filter(article => article.isTop === 1);
  }

  // Sort articles: top articles first, then by create time
  filteredArticles = [...filteredArticles].sort((a, b) => {
    if (a.isTop === 1 && b.isTop !== 1) return -1;
    if (a.isTop !== 1 && b.isTop === 1) return 1;
    return new Date(b.createTime) - new Date(a.createTime);
  });

  // Calculate pagination
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredArticles.slice(startIndex, endIndex);
});

// 获取当前板块文章
const fetchArticles = async () => {
  loading.value = true;
  try {
    const { data } = await request.get(
        `/article/getAllArticlesByBoardId?boardId=${currentBoardId.value}`
    );

    if (data.code === 200) {
      // 确保数据格式正确
      articles.value = Array.isArray(data.data) ? data.data.map(article => {
        return {
          ...article,
          // 确保必要的属性存在
          content: article.content || '',
          user: article.user || { nickName: '未知用户', avatarUrl: null },
          visitCount: article.visitCount || 0,
          replyCount: article.replyCount || 0,
          likeCount: article.likeCount || 0
        };
      }) : [];

      totalArticles.value = articles.value.length;

      // Count unique users
      const uniqueUsers = new Set();
      articles.value.forEach(article => {
        if (article.user && article.user.id) {
          uniqueUsers.add(article.user.id);
        }
      });
      activeUsers.value = uniqueUsers.size;
    } else {
      ElMessage.error('获取文章列表失败');
      articles.value = [];
    }
  } catch (error) {
    console.error('获取文章列表出错:', error);
    ElMessage.error('网络错误，请稍后重试');
    articles.value = [];
  } finally {
    loading.value = false;
  }
};

// const fetchBoardInfo = async () => {
//   try {
//     const { data } = await axios.get(
//       `http://localhost:58080/board/getBoardById?id=${currentBoardId.value}`
//     );

//     if (data.code === 200 && data.data) {
//       boardTitle.value = data.data.name || `板块 ${currentBoardId.value}`;
//     } else {
//       boardTitle.value = `板块 ${currentBoardId.value}`;
//     }
//   } catch (error) {
//     console.error('获取板块信息出错:', error);
//     boardTitle.value = `板块 ${currentBoardId.value}`;
//   }
// };

//文章详情页
const viewArticle = (articleId) => {
  if (articleId) {
    router.push(`/home/article/${articleId}?title=${encodeURIComponent(boardTitle.value)}`);
  }
};
//用户界面
const viewUser = (userId) =>{
  if (userId) {
    router.push(`/home/user/${userId}`);
  }
}
const createNewArticle = () => {
  // 确保 currentBoardId 有值
  if (currentBoardId.value) {
    //！！！！js需要传递计算属性的值的时候，需要.value才能传递值
    router.push(`/home/create-article/${currentBoardId.value}?title=${encodeURIComponent(boardTitle.value)}`);
  } else {
    console.error('板块ID不存在');
    // 可以添加错误提示
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time).fromNow();
};

// Lifecycle hooks
onMounted(() => {
  // fetchBoardInfo();  //  父组件已经获取，这里不需要再次获取
  fetchArticles();
});

watch(
    () => route.params.boardId,
    (newBoardId) => {
      currentBoardId.value = Number(newBoardId) || 1;
      fetchArticles();
    },
    { immediate: true }
);

// // 从父组件传递 boardTitle
// defineProps({
//   boardTitle: {
//     type: String,
//     required: true
//   }
// })
</script>

<style scoped>
.board-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.board-title {
  display: flex;
  flex-direction: column;
}

.board-title h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #303133;
}

.board-stats {
  color: #909399;
  font-size: 14px;
}

.board-stats span {
  margin-right: 15px;
}

.board-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.skeleton-card {
  padding: 20px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.skeleton-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
}

.skeleton-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.article-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.article-card:hover {
  transform: translateY(-5px);
}

.top-article {
  border: 1px solid #f56c6c;
}

.article-header {
  margin-bottom: 12px;
}

.article-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 8px;
}

.article-time {
  font-size: 12px;
  color: #909399;
}

.article-content-preview {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 15px;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.article-user {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.user-name {
  margin-left: 8px;
  font-size: 14px;
  color: #606266;
}

.article-stats {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 14px;
  border-top: 1px solid #f0f2f5;
  padding-top: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .board-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .board-actions {
    margin-top: 15px;
    width: 100%;
    justify-content: space-between;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }
}
</style>