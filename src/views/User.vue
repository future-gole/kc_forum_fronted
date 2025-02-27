<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-cover"></div>
      <div class="profile-info">
        <div class="avatar-container">
          <img :src="defaultAvatar" :alt="userData.nickName" class="avatar" />
        </div>
        <div class="user-details">
          <h1 class="username">{{ userData.nickName }}</h1>
          <p class="user-id">@{{ userData.userName }}</p>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-value">{{ userData.articleCount }}</span>
              <span class="stat-label">文章</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formatDate(userData.createTime) }}</span>
              <span class="stat-label">加入时间</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-tabs">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="tab-content">
        <!-- 个人信息标签页 -->
        <div v-if="activeTab === 'info'" class="info-tab">
          <div class="info-item">
            <div class="info-label">邮箱</div>
            <div class="info-value">{{ email }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">电话</div>
            <div class="info-value">{{ phone }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">性别</div>
            <div class="info-value">{{ genderText }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">留言</div>
            <div class="info-value">{{ remark }}</div>
          </div>
        </div>

        <!--文章标签页 with pagination -->
        <div v-else-if="activeTab === 'articles'" class="articles-tab">
          <div v-if="userArticles.length > 0" class="articles-list">
            <div v-for="article in paginatedArticles" :key="article.id" class="article-item">
              <h3 class="article-title">{{ article.title }}</h3>
              <div class="article-meta">
                <span class="article-date">{{ formatDateTime(article.createTime) }}</span>
                <span class="article-views">👁️{{ article.visitCount }} </span>
                <span class="article-views">💬{{ article.replyCount }}</span>
                <span class="article-views">❤️{{ article.likeCount }}</span>
              </div>
            </div>

            <!-- Pagination controls -->
            <div class="pagination-container">
              <button
                  class="pagination-button"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
              >
                上一页
              </button>

              <div class="pagination-info">
                {{ currentPage }} / {{ totalPages }}
              </div>

              <button
                  class="pagination-button"
                  :disabled="currentPage === totalPages"
                  @click="currentPage++"
              >
                下一页
              </button>
            </div>
          </div>
          <div v-else class="no-articles">
            <p>暂无文章</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, watchEffect} from 'vue';
import { useRoute } from 'vue-router';
import request from "@/utils/request.js";
const route = useRoute();
const userData = ref({});
const userArticles = ref([]);
const isLoading = ref(true);
const activeTab = ref('info');
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// Pagination variables
const currentPage = ref(1);
const pageSize = ref(5); // Number of articles per page

// Computed property for paginated articles
const paginatedArticles = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return userArticles.value.slice(startIndex, endIndex);
});

// Computed property for total pages
const totalPages = computed(() => {
  return Math.ceil(userArticles.value.length / pageSize.value) || 1;
});

// Watch for tab changes to reset pagination
watchEffect(() => {
  if (activeTab.value === 'articles') {
    currentPage.value = 1;
  }
});

const tabs = [
  { id: 'info', name: '个人信息' },
  { id: 'articles', name: '发布的文章' }
];

const email = computed(() => {
  if (userData.value.email == null) {
    return '没有留下邮箱哦~';
  }
  return userData.value.email
});
const genderText = computed(() => {
  switch (userData.value.gender) {
    case 1: return '男';
    case 2: return '女';
    default: return '未设置';
  }
});

const phone = computed(() => {
  if (userData.value.phone == null) {
    return '没有留下电话号码哦~';
  }
  return userData.value.phone
});

const remark = computed(() => {
  if (userData.value.remark == null) {
    return '什么都没有留下哦~';
  }
  return userData.value.remark
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${formatDate(dateString)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};


const fetchUserData = async (userId) => {
  try {
    isLoading.value = true;
    const response = await request.get(`/user/info?id=${userId}`);

    if (response.data.code === 200) {
      userData.value = response.data.data;
      await fetchUserArticles(userData.value.id);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchUserArticles = async (userId) => {
  try {
    // 这里获取用户文章的API
    console.log(userId);
    const response = await request.get(`/article/getAllArticlesByUserId?userId=${userId}`);

    if (response.data.code === 200) {
      userArticles.value = response.data.data || [];
    }
  } catch (error) {
    console.error('获取用户文章失败:', error);
    userArticles.value = [];
  }
};

// 监听路由参数变化
watchEffect(() => {
  const userId = Number(route.params.userId)
  fetchUserData(userId);
})

// onMounted(() => {
//   fetchUserData();
// });
</script>

<style scoped>
/* Add these styles for pagination */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0;
}

.pagination-button {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  margin: 0 15px;
  font-size: 14px;
}

.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.profile-header {
  position: relative;
}

.profile-cover {
  height: 200px;
  background: linear-gradient(135deg, #1a73e8, #3f51b5);
}

.profile-info {
  display: flex;
  padding: 0 30px 20px;
  position: relative;
  background-color: white;
  border-radius: 0 0 12px 12px;
}

.avatar-container {
  margin-top: -50px;
  position: relative;
  z-index: 2;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #e0e0e0;
  object-fit: cover;
}

.user-details {
  padding: 20px 0 0 30px;
  flex: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 5px;
  color: #333;
}

.user-id {
  font-size: 16px;
  color: #666;
  margin: 0 0 15px;
}

.stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1a73e8;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.profile-content {
  padding: 20px 30px 30px;
}

.profile-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.tab-button {
  padding: 12px 20px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.tab-button.active {
  color: #1a73e8;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #1a73e8;
  border-radius: 3px 3px 0 0;
}

.tab-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-tab {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.info-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.info-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.info-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.articles-tab {
  min-height: 200px;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.article-item {
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.article-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.article-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px;
}

.article-summary {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px;
  line-height: 1.5;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
}

.no-articles {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #888;
  font-size: 16px;
}

@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-details {
    padding: 20px 0 0;
  }

  .stats {
    justify-content: center;
  }

  .info-tab {
    grid-template-columns: 1fr;
  }
}
</style>