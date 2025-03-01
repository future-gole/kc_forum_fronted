<template>
  <div class="article-detail-container">
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
        <button @click="fetchArticle">重试</button>
      </div>
    </div>

    <!-- 文章内容 -->
    <div v-else-if="article" class="article-content">
      <!-- 文章头部 -->
      <div class="article-header">
        <h1 class="title">{{ article.title }}</h1>

        <div class="author-card">
          <div class="author-info">
            <div class="avatar-link" @click="navigateToUserProfile(article.user.id)">
              <el-avatar
                  :size="40"
                  :src="article.user.avatarUrl ? `${avatarBaseURL}${article.user.avatarUrl}` : defaultAvatar"
              />
              <div class="author-details">
                <span class="user-name-link">{{ article.user.nickName }}</span>
                <span class="post-time">{{ formatDate(article.createTime) }}</span>
              </div>
            </div>
          </div>

          <div class="stats">
            <div class="stat-item">
              <span class="stat-icon">👁️</span>
              <span>{{ article.viewCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">❤️</span>
              <span>{{ article.likeCount }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="article.own" class="action-buttons">
          <button class="edit-btn" @click="editArticle">
            <span class="btn-icon">✏️</span>编辑
          </button>
          <button class="delete-btn" @click="confirmDelete">
            <span class="btn-icon">❌</span>删除
          </button>
        </div>
      </div>

      <!-- 文章正文 -->
      <div class="article-body">
        <div class="content" v-html="article.content"></div>
      </div>

      <!-- 评论区 -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>评论</h3>
          <span class="comment-count">{{ replies.length }}</span>
        </div>

        <div v-if="replies.length === 0" class="no-comments">
          暂无评论，快来发表第一条评论吧！
        </div>

        <div v-else class="comments-list">
          <div v-for="reply in replies" :key="reply.id" class="comment-item">
            <div class="comment-header">
              <div class="commenter-info">
                <el-avatar
                    :size="32"
                    :src="reply.user.avatarUrl ? `${avatarBaseURL}${reply.user.avatarUrl}` : defaultAvatar"
                    @click="navigateToUserProfile(reply.user.id)"
                />
                <div class="commenter-details">
                  <span class="commenter-name">{{ reply.user.nickName }}</span>
                  <span class="comment-time">{{ formatDate(reply.createTime) }}</span>
                </div>
              </div>
              <div class="comment-actions">
                <button class="like-btn" @click="likeComment(reply.id)">
                  <span class="like-icon">❤️</span>
                  <span>{{ reply.likeCount }}</span>
                </button>
              </div>
            </div>
            <div class="comment-content">{{ reply.content }}</div>
          </div>
        </div>

        <!-- 评论输入框 -->
        <div class="comment-form">
          <textarea
              v-model="newComment"
              placeholder="写下你的评论..."
              rows="3"
          ></textarea>
          <button @click="submitComment" :disabled="!newComment.trim()">
            发表评论
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
  import { ref, watchEffect,computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import {useUserStore} from "@/stores/user.js";
  import request from '@/utils/request'
  import dayjs from 'dayjs';
  import 'dayjs/locale/zh-cn';
  import { ElMessage } from 'element-plus';

  // 头像的 baseURL，需要和后端配置的 avatar-base-url 对应
  const avatarBaseURL = 'http://localhost:58080/avatars';
  
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  // 响应式数据
  const article = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const replies = ref([]);
  const newComment = ref('');
  const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
  
  // // 处理401未授权
  // const handleUnauthorized = () => {
  //   localStorage.removeItem('token')
  //   router.push('/login')
  // }

  // 导航到用户个人页面的函数
  const navigateToUserProfile = (userId) => {
    if (userId) {
      router.push(`/home/user-profile/${userId}`);
    }
  };



  // // 格式化日期
  // const formatTime = (time) => {
  //   if (!time) return '';
  //   return dayjs(time).fromNow();
  // };

  // 格式化日期
  const formatDate = (dateString) => {
    return dayjs(dateString).locale('zh-cn').format('YYYY年MM月DD日 HH:mm');
  };
  
  // 获取文章详情
  const fetchArticle = async (articleId) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await request.get(`/article/getArticleDetailById?articleId=${articleId}`)
      
      if (response && response.data) {
        article.value = response.data.data;
        // 确保own字段存在，如果不存在则默认为false
        if (article.value.own === undefined) {
          article.value.own = false
        }
        console.log(111)
        fetchReplies(articleId);
      } else {
        error.value = '获取文章详情失败'
      }
    } catch (err) {
      error.value = err.message || '获取文章详情失败'
    } finally {
      loading.value = false
    }
  }

  // 获取文章回复
  const fetchReplies = async (articleId) => {
    console.log(articleId)
    if (!articleId) return;

    try {
      const response = await request.get(`/articleReply/getArticleReplies?articleId=${articleId}`);
      if (response.data.code === 200) {
        replies.value = response.data.data;
      } else {
        console.error('获取评论失败:', response.message);
      }
    } catch (err) {
      console.error('获取评论失败:', err);
    }
  };

  // 点赞评论
  const likeComment = async (replyId) => {
    try {
      const response = await request.post('/articleReply/like', { replyId });
      if (response.code === 200) {
        // 点赞成功后刷新评论列表
        fetchReplies();
      } else {
        alert(response.message || '点赞失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
      console.error('点赞失败:', err);
    }
  };

  // 提交评论
  const submitComment = async () => {
    if (!newComment.value.trim()) return;

    try {
      const response = await request.post('/articleReply/createArticleReply', {
        articleId: article.value.id,
        postUserId: article.value.user.id,
        content: newComment.value
      });

      if (response.data.code === 200) {
        // 评论成功后刷新评论列表
        fetchReplies(article.value.id);
        newComment.value = ''; // 清空输入框
        ElMessage.success("发表成功~");
      } else {
        alert(response.data.message || '评论失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
      console.error('提交评论失败:', err);
    }
  };

  // 监听路由参数变化
  watchEffect(() => {
    const articleId = Number(route.params.articleId)
    if (articleId) {
      article.value = null
      fetchArticle(articleId)
    }
  })
  
  // 删除文章
  const handleDelete = async () => {
    if (confirm('确定要删除这篇文章吗？')) {
      try {
        loading.value = true
        const response = await request.delete('/article/delete', {
          params: { articleId: route.params.articleId }
        })
        
        if (response && response.code === 200) {
          router.push('/home')
        } else {
          error.value = response?.message || '删除失败'
        }
      } catch (err) {
        error.value = err.message || '删除失败'
      } finally {
        loading.value = false
      }
    }
  }
  
  // 编辑文章
  const handleEdit = () => {
    if (article.value && article.value.id) {
      router.push(`/article/edit/${article.value.id}`)
    }
  }
  </script>
  
  <style scoped>
  /* 文章详情页样式 - 蓝色主题 */
  .article-detail-container {
    /* 颜色变量 */
    --ad-primary-color: #3498db;
    --ad-primary-dark: #2980b9;
    --ad-primary-light: #ebf5fb;
    --ad-text-primary: #2c3e50;
    --ad-text-secondary: #7f8c8d;
    --ad-background-color: #f9fbfd;
    --ad-card-background: #ffffff;
    --ad-border-color: #e0e6ed;
    --ad-shadow-color: rgba(52, 152, 219, 0.1);
    --ad-error-color: #e74c3c;
    --ad-success-color: #2ecc71;

    /* 基础样式 */
    max-width: 900px;
    margin: 0 auto;
    padding: 1.5rem;
    background-color: var(--ad-background-color);
    color: var(--ad-text-primary);
    font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
    line-height: 1.6;
  }

  /* 加载状态样式 */
  .article-detail-container .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--ad-primary-color);
  }

  .article-detail-container .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--ad-primary-light);
    border-top-color: var(--ad-primary-color);
    border-radius: 50%;
    animation: ad-spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes ad-spin {
    to { transform: rotate(360deg); }
  }

  /* 错误提示样式 */
  .article-detail-container .error-container {
    display: flex;
    align-items: center;
    padding: 1.5rem;
    background-color: rgba(231, 76, 60, 0.1);
    border-left: 4px solid var(--ad-error-color);
    border-radius: 4px;
    margin: 1.5rem 0;
  }

  .article-detail-container .error-icon {
    margin-right: 1rem;
    font-size: 1.2rem;
  }

  /* 文章内容区样式 */
  .article-detail-container .article-content {
    background-color: var(--ad-card-background);
    border-radius: 12px;
    box-shadow: 0 4px 20px var(--ad-shadow-color);
    overflow: hidden;
  }

  /* 文章头部样式 */
  .article-detail-container .article-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--ad-border-color);
  }

  .article-detail-container .title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--ad-text-primary);
    margin-bottom: 1.5rem;
    line-height: 1.3;
  }

  /* 作者卡片样式 */
  .article-detail-container .author-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1.5rem 0;
  }

  .article-detail-container .author-info {
    display: flex;
    align-items: center;
  }

  .article-detail-container .avatar-link {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .article-detail-container .avatar-link:hover {
    opacity: 0.8;
  }

  .article-detail-container .user-name {
    margin-left: 0.5rem;
    font-weight: 500;
    color: var(--ad-text-primary);
  }

  .article-detail-container .author-details {
    display: flex;
    flex-direction: column;
    margin-left: 1rem;
  }

  .article-detail-container .user-name-link {
    font-weight: 600;
    color: var(--ad-primary-color);
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .article-detail-container .user-name-link:hover {
    color: var(--ad-primary-dark);
    text-decoration: underline;
  }

  .article-detail-container .post-time {
    font-size: 0.85rem;
    color: var(--ad-text-secondary);
  }

  /* 统计信息样式 */
  .article-detail-container .stats {
    display: flex;
    gap: 1.5rem;
  }

  .article-detail-container .stat-item {
    display: flex;
    align-items: center;
    color: var(--ad-text-secondary);
    font-size: 0.9rem;
  }

  .article-detail-container .stat-icon {
    margin-right: 4px;
    font-size: 1rem;
  }

  /* 操作按钮样式 */
  .article-detail-container .action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .article-detail-container .action-buttons button {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .article-detail-container .edit-btn {
    background-color: var(--ad-primary-light);
    color: var(--ad-primary-color);
  }

  .article-detail-container .edit-btn:hover {
    background-color: var(--ad-primary-color);
    color: white;
  }

  .article-detail-container .delete-btn {
    background-color: rgba(231, 76, 60, 0.1);
    color: var(--ad-error-color);
  }

  .article-detail-container .delete-btn:hover {
    background-color: var(--ad-error-color);
    color: white;
  }

  .article-detail-container .btn-icon {
    margin-right: 6px;
  }

  /* 文章正文样式 */
  .article-detail-container .article-body {
    padding: 2rem;
  }

  .article-detail-container .content {
    font-size: 1.05rem;
    line-height: 1.8;
  }

  /* 让文章内容中的图片响应式显示 */
  .article-detail-container .content img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1.5rem 0;
  }

  /* 文章内容中的代码块样式 */
  .article-detail-container .content pre {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1.5rem 0;
  }

  /* 文章内容中的引用样式 */
  .article-detail-container .content blockquote {
    border-left: 4px solid var(--ad-primary-color);
    padding-left: 1.5rem;
    color: var(--ad-text-secondary);
    font-style: italic;
    margin: 1.5rem 0;
  }

  /* 评论区整体样式 */
  .comments-section {
    margin-top: 3rem;
    padding: 2rem;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }

  /* 评论区标题样式 */
  .comments-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eaeaea;
  }

  .comments-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin: 0;
  }

  .comment-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #3498db;
    color: white;
    font-size: 0.9rem;
    font-weight: 500;
    height: 24px;
    min-width: 24px;
    padding: 0 8px;
    border-radius: 12px;
    margin-left: 10px;
  }

  /* 无评论提示 */
  .no-comments {
    text-align: center;
    padding: 2rem 0;
    color: #999;
    font-style: italic;
  }

  /* 评论列表样式 */
  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* 单条评论样式 */
  .comment-item {
    padding: 1.25rem;
    border-radius: 10px;
    background-color: #f8f9fa;
    border-left: 3px solid #3498db;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .comment-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  /* 评论头部信息 */
  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .commenter-info {
    display: flex;
    align-items: center;
  }

  .commenter-details {
    margin-left: 12px;
  }

  .commenter-name {
    display: block;
    font-weight: 600;
    color: #3498db;
    font-size: 1rem;
    margin-bottom: 2px;
  }

  .comment-time {
    font-size: 0.85rem;
    color: #999;
  }

  /* 评论内容 */
  .comment-content {
    color: #333;
    line-height: 1.6;
    margin-top: 0.5rem;
    word-break: break-word;
    white-space: pre-wrap;
  }

  /* 评论操作按钮 */
  .comment-actions {
    display: flex;
    gap: 10px;
  }

  .like-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.9rem;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .like-btn:hover {
    background-color: #f0f8ff;
    border-color: #3498db;
    color: #3498db;
  }

  .like-btn.active {
    background-color: #ebf5fb;
    border-color: #3498db;
    color: #3498db;
  }

  .like-icon {
    font-size: 1rem;
  }

  /* 评论输入框 */
  .comment-form {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eaeaea;
  }

  .comment-form textarea {
    width: 100%;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
    font-size: 1rem;
    transition: border-color 0.2s ease;
    margin-bottom: 1rem;
  }

  .comment-form textarea:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }

  .comment-form button {
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .comment-form button:hover {
    background-color: #2980b9;
  }

  .comment-form button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  /* 头像样式 */
  .el-avatar {
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
  }

  .el-avatar:hover {
    transform: scale(1.05);
  }

  /* 点赞按钮样式 */
  .like-btn {
    position: relative;
    overflow: hidden;
  }

  .like-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background-color: rgba(52, 152, 219, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .like-btn:active::after {
    transform: translate(-50%, -50%) scale(2);
    opacity: 1;
  }
  </style>