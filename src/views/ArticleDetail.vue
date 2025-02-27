<template>
    <div class="article-detail-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="error" class="error-container">
        <i class="error-icon">⚠️</i>
        <span>{{ error }}</span>
      </div>
  
      <!-- 内容展示区 -->
      <div v-if="article" class="article-content">
        <!-- 文章头部 -->
        <div class="article-header">
          <h1 class="title">{{ article.title }}</h1>
          
          <div class="author-card">
            <div class="author-info">
              <div class="avatar-link" @click="navigateToUserProfile(article.user.id)">
                <img :src=" defaultAvatar" class="avatar" alt="作者头像">
              </div>
              <div class="author-details">
                <span class="user-name-link" @click="navigateToUserProfile(article.user.id)">
                  {{ article.user.nickName }}
                </span>
                <span class="post-time">{{ formatTime(article.createTime) }}</span>
              </div>
            </div>
            
            <div class="stats">
              <div class="stat-item">
                <i class="stat-icon">👁️</i>
                <span>{{ article.visitCount }}</span>
              </div>
              <div class="stat-item">
                <i class="stat-icon">💬</i>
                <span>{{ article.replyCount }}</span>
              </div>
              <div class="stat-item">
                <i class="stat-icon">❤️</i>
                <span>{{ article.likeCount }}</span>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮（权限控制） -->
          <div v-if="article.own" class="action-buttons">
            <button @click="handleEdit" class="edit-btn">
              <i class="btn-icon">✏️</i>编辑
            </button>
            <button @click="handleDelete" class="delete-btn">
              <i class="btn-icon">🗑️</i>删除
            </button>
          </div>
        </div>

        <!-- detail.vue 修改内容区 -->
        <div class="article-body">
          <!-- 使用 v-html 渲染富文本 -->
          <div class="content" v-html="article.content"></div>
        </div>
  
        <!-- 评论区 -->
        <div class="comments-section">
          <div class="comments-header">
            <h3>评论</h3>
            <span class="comment-count">{{ article.replyCount }}</span>
          </div>
          <div class="comment-list">
            <div v-if="article.replyCount === 0" class="no-comments">
              暂无评论，快来发表第一条评论吧！
            </div>
            <!-- 此处可添加评论组件 -->
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watchEffect } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import request from '@/utils/request'
  import dayjs from 'dayjs';
  import 'dayjs/locale/zh-cn';
  
  const route = useRoute()
  const router = useRouter()
  
  // 响应式数据
  const article = ref(null)
  const loading = ref(false)
  const error = ref(null)
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

  // 格式化日期
  const formatTime = (time) => {
    if (!time) return '';
    return dayjs(time).fromNow();
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
      } else {
        error.value = '获取文章详情失败'
      }
    } catch (err) {
      error.value = err.message || '获取文章详情失败'
    } finally {
      loading.value = false
    }
  }
  
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
  .avatar-link {
    display: inline-block;
    width: 40px;  /* 设置固定宽度 */
    height: 40px; /* 设置固定高度 */
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .avatar-link:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .user-name-link {
    color: #100f0f;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.2s ease;
  }
  .user-name-link:hover {
    color: #0d47a1;
    text-decoration: underline;
  }
  .article-detail-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
  
  /* 加载状态 */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: #666;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 123, 255, 0.2);
    border-radius: 50%;
    border-top-color: #007bff;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* 错误提示 */
  .error-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: #fff5f5;
    border-radius: 8px;
    color: #e53e3e;
    margin: 20px 0;
  }
  
  .error-icon {
    margin-right: 10px;
    font-size: 20px;
  }
  
  /* 文章头部 */
  .article-header {
    margin-bottom: 30px;
    position: relative;
  }
  
  .title {
    font-size: 28px;
    font-weight: 700;
    color: #333;
    margin-bottom: 20px;
    line-height: 1.3;
  }
  
  .author-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  
  .author-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  
  .author-details {
    display: flex;
    flex-direction: column;
  }
  
  .nickname {
    font-weight: 600;
    color: #333;
    font-size: 16px;
    margin-bottom: 4px;
  }
  
  .post-time {
    font-size: 12px;
    color: #909399;
  }
  
  .stats {
    display: flex;
    gap: 15px;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    color: #666;
  }
  
  .stat-icon {
    margin-right: 5px;
    font-size: 16px;
  }
  
  /* 操作按钮 */
  .action-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .edit-btn, .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .edit-btn {
    background-color: #007bff;
    color: white;
  }
  
  .edit-btn:hover {
    background-color: #0069d9;
  }
  
  .delete-btn {
    background-color: #dc3545;
    color: white;
  }
  
  .delete-btn:hover {
    background-color: #c82333;
  }
  
  .btn-icon {
    margin-right: 6px;
  }
  
  /* 文章内容 */
  .article-body {
    margin-bottom: 40px;
  }
  
  .content {
    line-height: 1.8;
    color: #333;
    font-size: 16px;
    white-space: pre-wrap;
    word-break: break-word;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    border-left: 4px solid #007bff;
  }
  
  /* 评论区 */
  .comments-section {
    border-top: 1px solid #eee;
    padding-top: 30px;
  }
  
  .comments-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .comments-header h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    margin-right: 10px;
  }
  
  .comment-count {
    background-color: #007bff;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 14px;
  }
  
  .no-comments {
    text-align: center;
    padding: 30px 0;
    color: #666;
    font-style: italic;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .article-detail-container {
      padding: 15px;
      border-radius: 0;
      box-shadow: none;
    }
    
    .title {
      font-size: 22px;
    }
    
    .author-card {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .stats {
      margin-top: 10px;
      align-self: flex-end;
    }
    
    .action-buttons {
      position: static;
      margin-top: 15px;
    }
  }
  </style>