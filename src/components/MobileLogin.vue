<template>
  <div class="mobile-login-page">
    <div class="login-container">
      <div class="login-header">
        <img src="../assets/kc2.png" alt="Logo" class="logo">
        <h1>欢迎使用 kc-forum</h1>
        <p class="subtitle">JOIN US!</p>
      </div>
      
      <div class="tabs">
        <div 
          class="tab" 
          :class="{ active: activeTab === 'login' }" 
          @click="activeTab = 'login'"
        >
          登录
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'register' }" 
          @click="activeTab = 'register'"
        >
          注册
        </div>
      </div>
      
      <!-- 登录表单 -->
      <div v-if="activeTab === 'login'" class="form-container">
        <div class="form-group">
          <div class="input-with-icon">
            <i class="form-icon">📧</i>
            <input type="text" v-model="loginForm.email" placeholder="请输入邮箱">
          </div>
        </div>
        <div class="form-group">
          <div class="input-with-icon">
            <i class="form-icon">🔒</i>
            <input type="password" v-model="loginForm.password" placeholder="请输入密码">
          </div>
        </div>
        <button class="submit-btn" @click="handleLogin">登录</button>
        <p class="switch-hint" @click="activeTab = 'register'">没有账号？去注册</p>
      </div>
      
      <!-- 注册表单 -->
      <div v-if="activeTab === 'register'" class="form-container">
        <div class="form-group">
          <div class="input-with-icon">
            <i class="form-icon">📧</i>
            <input type="text" v-model="registerForm.email" placeholder="请输入邮箱">
          </div>
        </div>
        <div class="form-group verification-group">
          <input type="text" v-model="registerForm.verificationCode" placeholder="验证码">
          <button @click="sendVerificationCode" :disabled="isSending" class="verification-btn">
            {{ sendBtnText }}
          </button>
        </div>
        <div class="form-group">
          <div class="input-with-icon">
            <i class="form-icon">👤</i>
            <input type="text" v-model="registerForm.userName" placeholder="请输入真实姓名">
          </div>
        </div>
        <div class="form-group">
          <div class="input-with-icon">
            <i class="form-icon">😊</i>
            <input type="text" v-model="registerForm.nickName" placeholder="用于帖子名称显示">
          </div>
        </div>
        <div class="form-group">
          <div class="input-with-icon">
            <i class="form-icon">🔒</i>
            <input type="password" v-model="registerForm.password" placeholder="请设置密码">
          </div>
        </div>
        <div class="form-group">
          <div class="input-with-icon">
            <i class="form-icon">🔐</i>
            <input type="password" v-model="registerForm.repeatPassword" placeholder="请确认密码">
          </div>
        </div>
        <button class="submit-btn" @click="handleRegister">注册</button>
        <p class="switch-hint" @click="activeTab = 'login'">已有账号？去登录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import request from "@/utils/request.js";
import { useRouter } from 'vue-router';

const router = useRouter();
const activeTab = ref('login');

// 注册表单数据
const registerForm = reactive({
  email: "",
  userName: '',
  nickName: '',
  password: '',
  repeatPassword: '',
  verificationCode: ''
});

// 登录表单数据
const loginForm = reactive({
  email: '',
  password: ''
});

// 验证码相关状态
const isSending = ref(false);
const sendBtnText = ref("发送验证码");
let countdown = 60;

// 发送验证码
const sendVerificationCode = async () => {
  if (isSending.value) return; // 如果正在发送中，则阻止重复点击

  if (!registerForm.email) {
    ElMessage.warning('请输入邮箱地址');
    return;
  }

  try {
    const response = await request.post(
        `/email/sendVerificationCode?email=${registerForm.email}`
    );

    if (response.data.code === 200) {
      ElMessage.success('验证码已发送');
      startCountdown(); // 启动倒计时
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('发送验证码失败');
    console.error('Error:', error);
  }
};

// 倒计时处理
const startCountdown = () => {
  isSending.value = true;
  let currentCountdown = countdown; // 使用局部变量，避免和全局变量冲突
  sendBtnText.value = `${currentCountdown}秒`;

  const timer = setInterval(() => {
    currentCountdown--;
    sendBtnText.value = `${currentCountdown}秒`;

    if (currentCountdown <= 0) {
      clearInterval(timer);
      isSending.value = false;
      sendBtnText.value = "发送验证码";
      currentCountdown = countdown; // 倒计时结束后重置
    }
  }, 1000);
};

// 注册处理
const handleRegister = async () => {
  if (!registerForm.email) {
    ElMessage.warning('邮箱不能为空');
    return;
  }
  if (!registerForm.nickName) {
    ElMessage.warning('昵称不能为空');
    return;
  }
  if (!registerForm.password) {
    ElMessage.warning('密码不能为空');
    return;
  }
  if (registerForm.password !== registerForm.repeatPassword) {
    ElMessage.warning('两次密码输入不一致');
    return;
  }
  if (!registerForm.verificationCode) {
    ElMessage.warning('请输入验证码');
    return;
  }
  
  //先验证验证码
  try {
    // const verifyResponse = await request.post(
    //     `/email/verifyEmail?email=${registerForm.email}&code=${registerForm.verificationCode}`
    // );
    
    // if (verifyResponse.data.code !== 200) {
    //   ElMessage.error(verifyResponse.data.message);
    //   return;
    // }
    
    // 验证通过后执行注册
    const registerResponse = await request.post(
        '/user/register',
        {
          email: registerForm.email,
          userName: registerForm.userName,
          password: registerForm.password,
          repeatPassword: registerForm.repeatPassword,
          nickName: registerForm.nickName,
          code: registerForm.verificationCode
        },
    )
    ElMessage.success('注册成功~');
    activeTab.value = 'login';
  } catch (error) {
    console.error('注册失败', error);
    ElMessage.error('注册失败');
  }
};

// 登录处理
const handleLogin = async () => {
  if (!loginForm.email) { // 修改为校验 email
    ElMessage.warning('邮箱不能为空'); // 修改为提示邮箱
    return;
  }
  if (!loginForm.password) {
    ElMessage.warning('密码不能为空');
    return;
  }
  try {
    const response = await request.post('/user/login', {
      email: loginForm.email,
      password: loginForm.password
    });
    if (response.data.code === 200) {
      localStorage.setItem('token', response.data.data.authorization);
      ElMessage.success('登录成功~');
    } else {
      ElMessage.error(response.data.message);
    }
    router.push('/home');
  } catch (error) {
    let errorMessage = '登录请求失败，请稍后再试'; // 默认错误消息

    if (error.response) {
      // 有服务器响应 (例如 4xx, 5xx 错误)
      console.log('服务器响应错误:', error.response);
      if (error.response.data && typeof error.response.data.message === 'string') {
        // 后端返回了 { "code": XXX, "message": "...", "data": ... } 这样的结构
        errorMessage = error.response.data.message;
      } else if (typeof error.response.data === 'string') {
        // 有些后端可能在错误时直接返回字符串错误信息
        errorMessage = error.response.data;
      } else if (error.response.statusText) {
        // 如果没有 data.message，尝试使用 HTTP 状态文本
        errorMessage = `错误 ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应 (例如网络错误)
      console.log('请求已发出但无响应:', error.request);
      errorMessage = '网络错误，请检查您的连接';
    } else {
      // 发生了一些在设置请求时触发的错误
      console.log('设置请求时发生错误:', error.message);
      if (error.message) {
        errorMessage = error.message;
      }
    }

    ElMessage.error(errorMessage);
    // 保留这个 console.error 用于详细调试
    console.error('登录完整错误对象:', error);
  }
};

</script>

<style scoped>
.mobile-login-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 25px;
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 15px;
  border: 3px solid #ebf4ff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.login-header h1 {
  font-size: 24px;
  color: #4a5568;
  margin: 10px 0 5px;
  font-weight: 600;
}

.subtitle {
  color: #718096;
  font-size: 16px;
  margin: 0;
}

.tabs {
  display: flex;
  margin-bottom: 25px;
  background-color: #f7fafc;
  border-radius: 8px;
  overflow: hidden;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  font-size: 16px;
  color: #718096;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.tab.active {
  color: white;
  background-color: #4299e1;
  font-weight: 500;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.form-icon {
  position: absolute;
  left: 15px;
  font-style: normal;
  font-size: 16px;
}

.form-group input {
  padding: 14px 15px 14px 45px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  background-color: #f8fafc;
  transition: border-color 0.3s, box-shadow 0.3s;
  width: 100%;
}

.form-group input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

.verification-group {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
}

.verification-group input {
  flex-grow: 1;
  padding: 14px 15px;
}

.verification-btn {
  padding: 14px 10px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
  min-width: 100px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.verification-btn:hover:not(:disabled) {
  background-color: #3182ce;
}

.verification-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.submit-btn {
  margin-top: 10px;
  padding: 15px 0;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.submit-btn:hover {
  background-color: #3182ce;
}

.submit-btn:active {
  transform: scale(0.98);
}

.switch-hint {
  text-align: center;
  color: #4299e1;
  font-size: 14px;
  margin-top: 15px;
  cursor: pointer;
}

.switch-hint:hover {
  text-decoration: underline;
}
</style> 