<template>
  <div class="article-detail-container">
    <!-- 返回按钮 -->
    <div class="back-button-container">
      <button class="back-button" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <span class="error-icon">⚠️</span>
      <div>
        <p>{{ error }}</p>
        <button @click="fetchArticle(articleIdFromRoute)" class="edit-btn">重试</button>
      </div>
    </div>

    <!-- 文章内容 -->
    <div v-else-if="article" class="article-content">
      <!-- 文章头部 -->
      <div class="article-header">
        <h1 class="title">{{ article.title }}</h1>
        <div class="article-meta-info">
          <span class="post-time">{{ formatDate(article.createTime) }}</span>
          <span class="meta-divider">·</span>
          <span class="stat-item">
            <span class="stat-icon">访问量</span>
            <span>{{ article.visitCount }}</span>
          </span>
        </div>
        <div class="author-like-row">
          <div class="author-info">
            <div class="avatar-link" @click="navigateToUserProfile(article.user.id)">
              <el-avatar :size="80" :src="getFullAvatarUrl(article.user.avatarUrl)" />
              <div class="author-details">
                <span class="user-name-link">{{ article.user.nickName }}</span>
              </div>
            </div>
          </div>
          <LikeButton :targetId="article.id" targetType="article" :initialLikeCount="article.likeCount" class="article-like-button" />
        </div>
        <div v-if="article.own" class="action-buttons">
          <button class="edit-btn" @click="handleEdit">
            <span class="btn-icon">✏️</span>编辑
          </button>
          <button class="delete-btn" @click="handleDelete">
            <span class="btn-icon">❌</span>删除
          </button>
        </div>
        <div v-else class="action-buttons">
          <button class="send-btn" @click="handleOpenPrivateMessage(article.user.id, article.user.nickName, article.user.avatarUrl)">
              <span class="btn-icon">➔</span>私信
          </button>
        </div>
      </div>

      <!-- 文章正文 -->
      <div class="article-body">
        <div class="tiptap-content" v-html="article.content"></div>
      </div>

      <!-- 评论区 -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>评论</h3>
          <span class="comment-count">{{ article.replyCount }}</span>
        </div>

        <CommentInput @submit="handleTopLevelSubmit" :is-submitting="isSubmittingComment" />

        <div v-if="loadingReplies && topLevelReplies.length === 0" class="loading-container">
            <div class="loading-spinner small"></div>
            <span>正在加载评论...</span>
        </div>
        <div v-else-if="!loadingReplies && topLevelReplies.length === 0" class="no-comments">
          暂无评论，快来抢占沙发吧！
        </div>
        <transition-group v-else name="list-anim" tag="div" class="comments-list">
          <CommentItem
            v-for="reply in topLevelReplies"
            :key="reply.id"
            :comment="reply"
            :article-id="article.id"
            @request-refresh="refreshTopLevelReplies"
          />
        </transition-group>

        <div class="load-more-container" v-if="hasMoreTopLevel">
          <button @click="fetchTopLevelReplies()" :disabled="loadingReplies">
            {{ loadingReplies ? '加载中...' : '加载更多评论' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from "@/stores/user.js";
import { useMailStore } from '@/stores/mailStore';
import { getArticleDetailById, deleteArticle as apiDeleteArticle } from '@/api/article.js';
import { getArticleReplies, createArticleReply } from '@/api/articleReply.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import CommentItem from '@/components/CommentItem.vue';
import CommentInput from '@/components/CommentInput.vue';
import LikeButton from '@/components/LikeButton.vue';
import {getFullAvatarUrl} from '@/api/user'
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const mailStore = useMailStore();
const article = ref(null);
const loading = ref(true);
const error = ref(null);
const articleIdFromRoute = computed(() => Number(route.params.articleId));
const topLevelReplies = ref([]);
const loadingReplies = ref(false);
const isSubmittingComment = ref(false);
const topTotal = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const hasMoreTopLevel = ref(true);
const boardTitle = computed(() => route.query.title || '板块');


const fetchArticle = async (articleId) => {
  if (!articleId) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await getArticleDetailById(articleId);
    if (res.data.code === 200) {
      article.value = res.data.data;
      if (article.value.own === undefined) article.value.own = false;
      await fetchTopLevelReplies(true);
    } else {
      error.value = res.data.message || '获取文章详情失败';
    }
  } catch (err) {
    error.value = '网络错误，获取文章详情失败';
  } finally {
    loading.value = false;
  }
};
const fetchTopLevelReplies = async (isReset = false) => {
  if (loadingReplies.value && !isReset) return;
  loadingReplies.value = true;
  const pageToFetch = isReset ? 1 : currentPage.value;
  try {
    const params = { articleId: article.value.id, currentPage: pageToFetch, pageSize: pageSize.value };
    const res = await getArticleReplies(params);
    const data = res.data.data || {}; 
    const newReplies = data.record || []; 
    const newTotal = data.topTotal || 0;
    topTotal.value = newTotal;
    if (isReset) topLevelReplies.value = newReplies;
    else topLevelReplies.value.push(...newReplies);
    if (newReplies.length < pageSize.value || topLevelReplies.value.length >= newTotal) hasMoreTopLevel.value = false;
    else { currentPage.value = pageToFetch + 1; hasMoreTopLevel.value = true; }
  } catch (err) {
    console.error("加载评论失败:", err); ElMessage.error('网络错误，加载评论失败');
  } finally {
    loadingReplies.value = false;
  }
};
const refreshTopLevelReplies = () => fetchTopLevelReplies(true);
const handleTopLevelSubmit = async (content, onSubmitted) => {
  isSubmittingComment.value = true;
  try {
    const payload = { articleId: article.value.id, replyId: 0, postUserId: article.value.user.id, content };
    await createArticleReply(payload);
    ElMessage.success('评论发表成功！');
    onSubmitted();
    await refreshTopLevelReplies();
  } catch (err) {
     ElMessage.error(err.response?.data?.message || '评论失败');
  } finally {
    isSubmittingComment.value = false;
  }
};
const goBack = () => router.push({ name: `Board`, params: { boardId: article.value.boardId }, query: { title: boardTitle.value } });
const navigateToUserProfile = (userId) => { if (userId) router.push(`/home/user-profile/${userId}`); };
const formatDate = (dateString) => dayjs(dateString).locale('zh-cn').format('YYYY年MM月DD日 HH:mm');
const handleDelete = () => {
  ElMessageBox.confirm('确定要删除这篇帖子吗? 这将一并删除所有评论。', '警告', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
  }).then(async () => {
    try {
      await apiDeleteArticle({ articleId: article.value.id, boardId: article.value.boardId });
      ElMessage.success("删除成功~");
      goBack();
    } catch (err) {
      ElMessage.error(err.response?.data?.message || '删除失败');
    }
  }).catch(() => ElMessage.info('已取消删除'));
};
const handleEdit = () => { if (article.value?.id) router.push( {
      name: "EditArticle", 
      params: {
        boardId: article.value.boardId,
        articleId: article.value.id
      },
      query:{
        title: boardTitle.value
      }
    }
  ) 
};
const handleOpenPrivateMessage = (targetUserId, targetUsername, targetAvatar) => {
  if (!userStore.currentUserId) { ElMessage.warning("请先登录再发送私信"); return; }
  if (!targetUserId) { ElMessage.error('无法发送私信：未获取到文章作者信息。'); return; }
  mailStore.openMailModalWithTarget(targetUserId, targetUsername, targetAvatar);
};
watchEffect(() => {
  const newArticleId = articleIdFromRoute.value;
  if (newArticleId && (!article.value || article.value.id !== newArticleId)) {
    fetchArticle(newArticleId);
  }
});
</script>

<style scoped>
/* **【修复核心】** 以下是唯一被修改的部分 */

/* 1. 根容器样式调整 */
.article-detail-container {
  /* 保持最大宽度和水平居中 */
  max-width: 960px; /* 可以稍微加宽一点 */
  
  /* 其他基础样式保持不变 */
  position: relative;
  background-color: #f9fbfd;
  color: #2c3e50;
  font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
  line-height: 1.6;
}

/* 2. 内容卡片样式调整 */
.article-content {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); /* 阴影调柔和一些 */
  word-break: break-word;
  overflow: hidden;
}

/* 3. 为不同部分增加更舒适的内边距 */
.article-header {
  padding: 2rem 2.5rem; /* 上下2rem，左右2.5rem */
  border-bottom: 1px solid #e0e6ed;
}

.article-body {
  padding: 1.5rem 2.5rem; /* 左右与头部对齐 */
  line-height: 1.8;
}

.comments-section {
  margin-top: 2rem;
  padding: 1.5rem 2.5rem; /* 左右与头部对齐 */
  background-color: #fff;
}

/* 4. 响应式调整，确保移动端体验 */
@media (max-width: 768px) {
  .article-detail-container {
    padding: 0; /* 在移动端，让内部卡片自己控制padding */
  }
  .article-header,
  .article-body,
  .comments-section {
    padding: 1.5rem; /* 移动端内边距统一为1.5rem */
  }
}

@media (max-width: 480px) {
  .article-header,
  .article-body,
  .comments-section {
    padding: 1rem; /* 更小的手机屏幕，内边距更小 */
  }
  .title {
    font-size: 1.5rem; /* 移动端标题小一点 */
  }
}


/* --- 以下是其他未作修改的样式，保持原样即可 --- */
.back-button-container {
    position: absolute;
    top: 10px;
    left: 20px;
    z-index: 10
}

.back-button {
    background-color: transparent;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #333
}

.back-button:hover {
    background-color: rgba(0, 0, 0, .05)
}

.el-icon {
    margin-right: 5px;
    font-size: 16px
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #3498db;
    font-size: 14px
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #ebf5fb;
    border-top-color: #3498db;
    border-radius: 50%;
    animation: ad-spin 1s linear infinite;
    margin-bottom: 1rem
}

.loading-spinner.small {
    width: 24px;
    height: 24px;
    border-width: 2px
}

@keyframes ad-spin {
    to {
        transform: rotate(360deg)
    }
}

.error-container {
    display: flex;
    align-items: center;
    padding: 1.5rem;
    background-color: rgba(231, 76, 60, .1);
    border-left: 4px solid #e74c3c;
    border-radius: 4px;
    margin: 1.5rem 0
}

.error-icon {
    margin-right: 1rem;
    font-size: 1.2rem
}

.title {
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 1.5rem;
    line-height: 1.3
}

.author-like-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem
}

.author-info {
    display: flex;
    align-items: center
}

.avatar-link {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: opacity .2s ease
}

.avatar-link:hover {
    opacity: .8
}

.author-details {
    display: flex;
    flex-direction: column;
    margin-left: 1rem
}

.user-name-link {
    font-weight: 600;
    color: #3498db;
    cursor: pointer;
    transition: color .2s ease
}

.user-name-link:hover {
    color: #2980b9;
    text-decoration: underline
}

.article-like-button {
    background-color: #ffebeb;
    color: #ff3b30;
    border: 1px solid #ffbeb9;
    border-radius: 15px;
    padding: 5px 12px;
    font-size: .85rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all .2s ease
}

.article-like-button:hover {
    background-color: #ffddd9
}

:deep(.article-like-button.liked) {
    background-color: #ff3b30;
    color: #fff;
    border-color: #ff3b30
}

.article-meta-info {
    display: flex;
    align-items: center;
    font-size: .9rem;
    color: #7f8c8d;
    margin-bottom: 1rem
}

.meta-divider {
    margin: 0 .5em
}

.stat-item {
    display: inline-flex;
    align-items: center
}

.stat-icon {
    margin-right: 4px;
    font-size: .9rem
}

.post-time {
    font-size: .85rem;
    color: #7f8c8d
}

.action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem
}

.action-buttons button {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all .2s ease
}

.edit-btn {
    background-color: #ebf5fb;
    color: #3498db
}

.edit-btn:hover {
    background-color: #3498db;
    color: #fff
}

.delete-btn {
    background-color: rgba(231, 76, 60, .1);
    color: #e74c3c
}

.delete-btn:hover {
    background-color: #e74c3c;
    color: #fff
}

.send-btn {
    background-color: rgba(76, 175, 80, .1);
    color: #4caf50
}

.send-btn:hover {
    background-color: #4caf50;
    color: #fff
}

.btn-icon {
    margin-right: 6px
}

.tiptap-content {
    font-size: 1.05rem
}

.comments-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eaeaea
}

.comments-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin: 0
}

.comment-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #3498db;
    color: #fff;
    font-size: .9rem;
    font-weight: 500;
    height: 24px;
    min-width: 24px;
    padding: 0 8px;
    border-radius: 12px;
    margin-left: 10px
}

.no-comments {
    text-align: center;
    padding: 2rem 0;
    color: #999;
    font-style: italic
}

.comments-list {
    position: relative;
    padding: 0 16px
}

.load-more-container {
    text-align: center;
    margin-top: 20px;
    padding: 10px 0
}

.load-more-container button {
    background-color: #f0f2f5;
    color: #555;
    padding: 10px 20px;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background-color .2s ease
}

.load-more-container button:hover:not(:disabled) {
    background-color: #e4e6e9
}

.load-more-container button:disabled {
    cursor: not-allowed;
    opacity: .7
}

.el-avatar {
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, .1);
    transition: transform .2s ease
}

.el-avatar:hover {
    transform: scale(1.05)
}</style>