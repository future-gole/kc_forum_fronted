<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-cover"></div>
      <div class="profile-info">
        <div class="avatar-container">
          <img
              :src="avatarImage"
              :alt="userData.nickName"
              class="avatar"
          />
          <div
              v-if="isCurrentUser"
              class="avatar-overlay"
              @click="openFileDialog"
          >
            <input
                type="file"
                style="display: none"
                ref="fileInput"
                accept="image/*"
                @change="uploadAvatar"
            />
          </div>
        </div>
        <div class="user-details">
          <div class="name-and-actions">
            <div class="user-name-container">
              <h1 class="username">{{ userData.nickName }}</h1>
              <p class="user-id">@{{ userData.userName }}</p>
            </div>
            <div v-if="isCurrentUser" class="edit-actions">
              <button class="edit-profile-btn" @click="showEditProfileModal = true">
                编辑个人资料
              </button>
              <button class="change-pwd-btn" @click="showChangePasswordModal = true">
                修改密码
              </button>
<!--              <button class="edit-email-btn" @click="showEditEmailModal = true">-->
<!--                修改邮箱-->
<!--              </button>-->
            </div>
          </div>
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
            <div v-for="article in paginatedArticles" :key="article.id" class="article-item" @click="viewArticle(article.id)">
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

    <!-- 编辑个人资料悬浮窗 -->
    <div v-if="showEditProfileModal" class="modal-overlay" @click.self="showEditProfileModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>编辑个人资料</h2>
          <button class="close-button" @click="showEditProfileModal = false">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label for="userName">用户名</label>
              <input type="text" id="userName" v-model="editForm.userName" required />
            </div>
            <div class="form-group">
              <label for="nickName">昵称</label>
              <input type="text" id="nickName" v-model="editForm.nickName" required />
            </div>
            <div class="form-group">
              <label for="phone">电话</label>
              <input type="text" id="phone" v-model="editForm.phone" />
            </div>
            <div class="form-group">
              <label>性别</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" v-model="editForm.gender" :value="1" /> 男
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="editForm.gender" :value="2" /> 女
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="editForm.gender" :value="0" /> 保密
                </label>
              </div>
            </div>
            <div class="form-group">
              <label for="remark">留言</label>
              <textarea id="remark" v-model="editForm.remark"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="showEditProfileModal = false">取消</button>
          <button class="btn btn-primary" @click="updateProfile" :disabled="isSubmitting">
            {{ isSubmitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改密码悬浮窗 -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click.self="showChangePasswordModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>修改密码</h2>
          <button class="close-button" @click="showChangePasswordModal = false">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updatePassword">
            <div class="form-group">
              <label for="password">新密码</label>
              <input type="password" id="password" v-model="passwordForm.password" required />
            </div>
            <div class="form-group">
              <label for="repeatPassword">确认密码</label>
              <input type="password" id="repeatPassword" v-model="passwordForm.repeatPassword" required />
            </div>
            <div v-if="passwordError" class="error-message">
              {{ passwordError }}
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="showChangePasswordModal = false">取消</button>
          <button class="btn btn-primary" @click="updatePassword" :disabled="isSubmitting">
            {{ isSubmitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

<!--    &lt;!&ndash; 修改邮箱弹窗 &ndash;&gt;-->
<!--    <div v-if="showEditEmailModal" class="modal-overlay" @click.self="showEditEmailModal = false">-->
<!--      <div class="modal-content">-->
<!--        <div class="modal-header">-->
<!--          <h2>修改邮箱</h2>-->
<!--          <button class="close-button" @click="showEditEmailModal = false">&times;</button>-->
<!--        </div>-->
<!--        <div class="modal-body">-->
<!--          <div class="form-group">-->
<!--            <label for="code">验证码</label>-->
<!--            <input type="text" id="code" v-model="emailForm.code" placeholder="请输入验证码" />-->
<!--            <button @click="sendVerificationCode">发送验证码</button>-->
<!--          </div>-->
<!--          <div class="form-group">-->
<!--            <label for="email">新邮箱地址</label>-->
<!--            <input type="email" id="email" v-model="emailForm.email" placeholder="请输入新的邮箱地址" />-->
<!--          </div>-->
<!--        </div>-->
<!--        <div class="modal-footer">-->
<!--          <button class="btn btn-cancel" @click="showEditEmailModal = false">取消</button>-->
<!--          <button class="btn btn-primary" @click="updateEmail">保存</button>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useUserStore } from "@/stores/user.js";
import {useRoute, useRouter} from 'vue-router';
import request from "@/utils/request.js";
import { ElMessage } from 'element-plus';
import {jwtDecode} from "jwt-decode";

const route = useRoute();
const router = useRouter();
const userData = ref({});
const userArticles = ref([]);
const isLoading = ref(true);
const activeTab = ref('info');
// 头像的 baseURL，需要和后端配置的 avatar-base-url 对应
const avatarBaseURL = 'http://localhost:58080/avatars';
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
//获取userStore实例
const userStore = useUserStore();

// 1.  统一的当前用户 ID 获取 (从 token 中获取，并处理 token 不存在的情况)
const currentUserId = computed(() => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token, { header: false });
      return decoded.Id ? String(decoded.Id) : null; // 确保返回字符串或 null
    } catch (error) {
      console.error("JWT decode error:", error);
      return null;
    }
  }
  return null;
});

// 2.  简化 isCurrentUser (直接比较 currentUserId 和路由参数)
const isCurrentUser = computed(() => {
  //console.log("currentUserId.value",currentUserId.value)
  //console.log("route.params.userId",route.params.userId)
  return currentUserId.value === String(route.params.userId);  // 确保类型一致
});


// Computed properties
const avatarImage = computed(() => {
  return userData.value.avatarUrl
      ? avatarBaseURL + userData.value.avatarUrl
      : defaultAvatar;
});

// Refs
const fileInput = ref(null); // 用于触发文件选择框

// Methods
const openFileDialog = () => {
  //console.log(isCurrentUser.value)
  if(isCurrentUser.value) // 确保是当前用户
    fileInput.value.click(); // 触发文件选择框
};

const uploadAvatar = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return; // 用户未选择文件
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await request.post(`/user/uploadAvatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.code === 200) {
      // 更新头像 URL
      userData.value.avatarUrl = response.data.message.replace(avatarBaseURL, ''); // 后端返回完整的 URL，需要处理一下
      ElMessage.success('头像上传成功！');
    } else {
      ElMessage.success(`头像上传失败: ${response.data.message}`);
    }
  } catch (error) {
    console.error('头像上传出错:', error);
    ElMessage.error('头像上传出错，请稍后再试。');
  } finally {
    // 清空 input[type="file"] 的值，防止选择相同文件时无法触发 change 事件
    fileInput.value.value = '';
  }
};




// 编辑个人资料相关状态
const showEditProfileModal = ref(false);
const showChangePasswordModal = ref(false);
const showEditEmailModal = ref(false);
const isSubmitting = ref(false);
const passwordError = ref('');

// 编辑表单数据
const editForm = ref({
  userName: '',
  nickName: '',
  phone: '',
  gender: 0,
  remark: '',
  email: userStore.getCurrentUserEmail()
});

// 密码表单数据
const passwordForm = ref({
  password: '',
  repeatPassword: ''
});

// 邮箱编辑表单
const emailForm = ref({
  code: '',
  email: ''
});

// // 初始化邮箱表单
// const initEmailForm = () => {
//   emailForm.value.email = userData.value.email;
// };

// 监听用户数据变化，更新基本信息表单
watchEffect(() => {
  if (userData.value) {
    editForm.value = {
      userName: userData.value.userName || '',
      nickName: userData.value.nickName || '',
      phone: userData.value.phone || '',
      gender: userData.value.gender || 0,
      remark: userData.value.remark || '',
      email: userStore.getCurrentUserEmail()
    };
  }
});

// 更新个人资料
const updateProfile = async () => {
  try {
    console.log(1)
    isSubmitting.value = true;
    const response = await request.post('/user/modifyInfo', editForm.value);

    if (response.data.code === 200) {
      // 更新成功，刷新用户数据
      await fetchUserData(currentUserId.value); // 使用 currentUserId.value
      showEditProfileModal.value = false;
      ElMessage.success('个人资料更新成功');
    } else {
      ElMessage.error('更新失败: ' + response.data.message);
    }
  } catch (error) {
    console.error('更新个人资料失败:', error);
    ElMessage.error('更新失败，请稍后再试');
  } finally {
    isSubmitting.value = false;
  }
};

// 发送验证码
const sendVerificationCode = async () => {
  if (!userStore.getCurrentUserEmail()) {
    ElMessage.warning('请输入邮箱地址');
    return;
  }

  try {
    const response = await request.post(
        `/email/sendVerificationCode?email=${userStore.getCurrentUserEmail()}`
    );

    if (response.data.code === 200) {
      ElMessage.success('验证码已发送');
      // startCountdown();
    } else {
      ElMessage.error('验证码发送失败');
    }
  } catch (error) {
    ElMessage.error('发送验证码失败');
    console.error('Error:', error);
  }
};

// 更新邮箱
const updateEmail = async () => {
  //先验证code
  try {
    const verifyResponse = await request.post(
        `/email/verifyEmail?email=${userStore.getCurrentUserEmail()}&code=${emailForm.value.code}`
    );
    if (verifyResponse.data.code !== 200) {
      ElMessage.error(verifyResponse.data.message);
      return;
    }
    // 调用API更新邮箱
    const response = await request.post(`/user/modifyEmail?email=${emailForm.value.email}`);
    // 更新成功后关闭弹窗
    showEditEmailModal.value = false;
    // 刷新用户数据
    await fetchUserData(currentUserId.value);  // 使用 currentUserId.value
    ElMessage.success("更新邮箱成功");
  } catch (error) {
    console.error('更新邮箱失败', error);
  }
};

// 更新密码
const updatePassword = async () => {
  // 验证两次密码是否一致
  if (passwordForm.value.password !== passwordForm.value.repeatPassword) {
    ElMessage.error( '两次输入的密码不一致');
    return;
  }

  passwordError.value = '';

  try {
    isSubmitting.value = true;
    const response = await request.post('/user/modifyPassword', null, {
      params: {
        password: passwordForm.value.password,
        repeatPassword: passwordForm.value.repeatPassword
      }
    });

    if (response.data.code === 200) {
      showChangePasswordModal.value = false;
      passwordForm.value = { password: '', repeatPassword: '' };
      ElMessage.success('密码修改成功');
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('修改密码失败:', error);
    passwordError.value = '修改密码失败，请稍后再试';
  } finally {
    isSubmitting.value = false;
  }
};

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
    default: return '保密哦~';
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

//获取用户信息
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

const viewArticle = (articleId) => {
  if (articleId) {
    router.push(`/home/article/${articleId}`);
  }
}
//监听路由参数变化
watchEffect(() => {
  const userId = route.params.userId; // 保持原始类型
  if (userId) { // 检查 userId 是否存在
    fetchUserData(userId);
  }
})

</script>

<style scoped>

.avatar-container {
  margin-top: -50px;
  position: relative;
  z-index: 2;
  cursor: pointer; /* 鼠标悬停时显示手型 */
  transition: transform 0.2s ease-in-out; /* 添加过渡效果 */
  border-radius: 50%; /* 添加圆角 */
  border: 4px solid white; /* 添加边框 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  width: 120px;
  height: 120px;
}

.avatar {
  width: 100%; /* 继承 .avatar-container 的宽度 */
  height: 100%; /* 继承 .avatar-container 的高度 */
  border-radius: 50%;
  object-fit: cover;
  border: none; /* 移除 .avatar 的边框 */
  box-shadow: none; /* 移除 .avatar 的阴影 */
  background-color: transparent; /* 移除 .avatar 的背景颜色 */
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%; /* 继承 .avatar-container 的宽度 */
  height: 100%; /* 继承 .avatar-container 的高度 */
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3); /* 半透明黑色背景，调整透明度 */
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0; /* 初始状态下隐藏 */
  transition: opacity 0.3s ease;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1; /* 鼠标悬停时显示 */
}

.avatar-container:active {
  transform: scale(0.95); /* 点击时缩小到 95% */
}


/* 用户名和操作按钮布局 */
.name-and-actions {
  display: flex;
  flex-direction: column; /* 小屏幕：垂直排列 */
  gap: 15px;
  margin-bottom: 15px;
}

.user-name-container {
  text-align: center; /* 确保用户名居中 */
}

/* 编辑按钮样式 */
.edit-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; /* 小屏幕：居中对齐 */
  gap: 10px;
}

/* 媒体查询 - 平板和桌面端 */
@media (min-width: 768px) {
  .name-and-actions {
    flex-direction: row; /* 大屏幕：水平排列 */
    justify-content: space-between; /* 大屏幕：两端对齐 */
    align-items: center;
  }

  .user-name-container {
    text-align: left;
  }

  .edit-actions {
    justify-content: flex-end; /* 大屏幕：右对齐 */
  }
}
.edit-profile-btn,
.edit-email-btn,
.change-pwd-btn {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap; /* 避免按钮文字换行 */
}

.edit-profile-btn {
  background-color: #1890ff;
  color: white;
}

.edit-profile-btn:hover {
  background-color: #40a9ff;
}

.change-pwd-btn {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #d9d9d9;
}

.change-pwd-btn:hover {
  background-color: #e0e0e0;
}

/* 悬浮表单的基础样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  animation: fadeIn 0.2s ease-out;
  will-change: opacity;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-content {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 450px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0;
  position: relative;
  transform: translateY(0);
  animation: slideUp 0.3s ease-out;
  will-change: transform;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 表单头部样式 */
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f5f5f5;
  color: #666;
}

/* 表单内容样式 */
.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
}

.form-group input,
.form-group textarea {
  width: 95%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  background-color: #fff;
}

.form-group input:hover,
.form-group textarea:hover {
  border-color: #40a9ff;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

/* 单选按钮组样式 */
.radio-group {
  display: flex;
  gap: 24px;
}

.radio-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  accent-color: #1890ff;
}

/* 表单底部操作区 */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #595959;
}

.btn-cancel:hover {
  background-color: #e8e8e8;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-primary:disabled {
  background-color: #bae7ff;
  cursor: not-allowed;
}


/* 错误信息样式 */
.error-message {
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 8px;
}

/* 优化滚动条样式 */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

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