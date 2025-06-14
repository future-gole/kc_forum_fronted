<template>
  <div class="login-page">
    <div class="box">
      <div class="pre-box" :style="{ transform: preBoxTransform, backgroundColor: preBoxBackgroundColor }">
        <h1>WELCOME</h1>
        <p>JOIN US!</p>
        <div class="img-box">
          <img :src="imgSrc" alt="切换图片">
        </div>
      </div>
      <div class="register-form">
        <div class="title-box">
          <h1>注册</h1>
        </div>
        <div class="input-box">
          <input type="text" placeholder="邮箱" v-model="registerForm.email">
          <div class="verification-code-box">
            <input type="text" placeholder="验证码" v-model="registerForm.verificationCode" class="verification-code-input">
            <button @click="sendVerificationCode" :disabled="isSending" class="send-code-button">{{ sendBtnText }}</button>
          </div>
          <input type="text" placeholder="用户名" v-model="registerForm.userName">
          <input type="text" placeholder="昵称(用于帖子名称显示~）" v-model="registerForm.nickName">
          <input type="password" placeholder="密码(暂不支持由邮箱找回密码~)" v-model="registerForm.password">
          <input type="password" placeholder="请确认密码" v-model="registerForm.repeatPassword">
        </div>
        <div class="btn-box">
          <button @click="handleRegister">注册</button>
          <p @click="switchForm">已有账号?去登录</p>
        </div>
      </div>
      <div class="login-form">
        <div class="title-box">
          <h1>登录</h1>
        </div>
        <div class="input-box">
          <input type="text" placeholder="邮箱" v-model="loginForm.email">
          <input type="password" placeholder="密码" v-model="loginForm.password">
        </div>
        <div class="btn-box">
          <button @click="handleLogin">登录</button>
          <p @click="switchForm">没有账号?去注册</p>
        </div>
      </div>
    </div>
  </div>
  <!--  <div class="bubble-container"></div>-->
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from "@/utils/request.js";
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  document.body.classList.add('login-page-body');
});

onUnmounted(() => {
  document.body.classList.remove('login-page-body');
});

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

// 切换表单状态
import kc1ImageUrl from '@/assets/kc1.png';
import kc2ImageUrl from '@/assets/kc2.png';

const flag = ref(true);
const imgSrc = ref(kc1ImageUrl); // 初始值是导入的图片 URL

const preBoxTransform = ref('translateX(0%)');
const preBoxBackgroundColor = ref('#F2B8B5');

const switchForm = () => {
  if (flag.value) {
    preBoxTransform.value = 'translateX(100%)';
    preBoxBackgroundColor.value = '#A6D1E6';
    imgSrc.value = kc2ImageUrl; // 直接赋值导入的图片 URL 变量
  } else {
    preBoxTransform.value = 'translateX(0%)';
    preBoxBackgroundColor.value = '#F2B8B5';
    imgSrc.value = kc1ImageUrl; // 直接赋值导入的图片 URL 变量
  }
  flag.value = !flag.value;
};

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
  sendBtnText.value = `${currentCountdown}秒后重发`;

  const timer = setInterval(() => {
    currentCountdown--;
    sendBtnText.value = `${currentCountdown}秒后重发`;

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

  try {
     await request.post(
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
    switchForm();
  } catch (error) {
    console.error('注册失败', error);
    if (error.response) {
      console.error('响应数据:', error.response.data);
      console.error('响应状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
    } else if (error.request) {
      console.error('请求未发送:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    ElMessage.error(error.response.data.message);
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

// // 泡泡动画
// const bubleCreate = () => {
//   const buble = document.createElement('span');
//   let r = Math.random() * 5 + 25;
//   buble.style.width = r + 'px';
//   buble.style.height = r + 'px';
//   buble.style.left = Math.random() * window.innerWidth + 'px';
//   const bubbleContainer = document.querySelector('.bubble-container');
//   bubbleContainer.append(buble);
//   setTimeout(() => {
//     buble.remove();
//   }, 4000);
// };

// const startBubbleAnimation = () => {
//   setInterval(() => {
//     bubleCreate();
//   }, 200);
// };

// onMounted(() => {
//   startBubbleAnimation();
// });
</script>

<style scoped> 
/*验证码按钮*/
.verification-code-box {
  display: flex;
  align-items: center;
  width: 60%; /* 使用100%宽度与其他输入框保持一致 */
}

.verification-code-input {
  flex: 1; /* 让输入框占据剩余空间 */
  margin-top: 15px;
  height: 40px;
  text-indent: 10px;
  border: 1px solid #BDBDBD;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 120px;
  backdrop-filter: blur(10px);
  color: #212121;
  outline: none;
  box-sizing: border-box;
  margin-right: 10px;
}

.verification-code-input:focus {
  color: #1565C0;
}

.verification-code-input:focus::placeholder {
  opacity: 0;
}

.send-code-button {
  width: auto; /* 根据内容自适应宽度 */
  min-width: 110px; /* 设置最小宽度确保按钮不会太窄 */
  height: 40px; /* 与输入框高度一致 */
  padding: 0 12px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 120px; /* 与输入框保持一致的圆角 */
  cursor: pointer;
  transition: background-color 0.3s;
  box-sizing: border-box;
  font-size: 14px; /* 适当的字体大小 */
  white-space: nowrap; /* 防止文字换行 */
}

.send-code-button:hover {
  background-color: #66b1ff;
}

.send-code-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.login-page {
  /* 确保 login-page 占据整个视口 */
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}




span {
  position: absolute;
  z-index: -1;/*泡泡层级*/
  bottom: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 72% 28%, #fff 3px, #ff7edf 8%, #5b5b5b, #aad7f9 100%);
  box-shadow: inset 0 0 6px #fff,
  inset 3px 0 6px #eaf5fc,
  inset 2px -2px 10px #efcde6,
  inset 0 0 60px #f9f6de,
  0 0 20px #fff;
  animation: myMove 4s linear infinite;
}


@keyframes myMove {
  0% {
    transform: translateY(0%);
    opacity: 1;
  }

  50% {
    transform: translate(10%, -1000%);
  }

  75% {
    transform: translate(-20%, -1200%);
  }

  99% {
    opacity: .9;
  }

  100% {
    transform: translateY(-1800%) scale(1.5);
    opacity: 0;
  }
}

.box {
  width: 1050px;
  height: 600px;
  display: flex;
  position: relative;
  z-index: 2;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, .6);
  box-shadow: 2px 1px 19px rgba(0, 0, 0, .1);
  overflow: hidden; /* 确保泡泡不超出容器 */
}

.pre-box {
  width: 50%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 99;
  border-radius: 4px;
  box-shadow: 2px 1px 19px rgba(0, 0, 0, .1);
  transition: 0.5s ease-in-out;
}

.pre-box h1 {
  margin-top: 150px;
  text-align: center;
  letter-spacing: 5px;
  color: #424242; /* 深色文字 */
  user-select: none;
  text-shadow: 4px 4px 3px rgba(0, 0, 0, .1);
}

.pre-box p {
  height: 30px;
  line-height: 30px;
  text-align: center;
  margin: 20px 0;
  user-select: none;
  font-weight: bold;
  color: #616161; /* 稍深文字 */
  text-shadow: 4px 4px 3px rgba(0, 0, 0, .1);
}

.img-box {
  width: 200px;
  height: 200px;
  margin: 20px auto;
  border-radius: 50%;
  user-select: none;
  overflow: hidden;
  box-shadow: 4px 4px 3px rgba(0, 0, 0, .1);
}

.img-box img {
  width: 100%;
  transition: 0.5s;
}

.login-form,
.register-form {
  flex: 1;
  height: 100%;
  position: relative; /* 提升表单的层级，防止被泡泡遮挡 */
  z-index: 3;
  top: -150px;
  justify-content: center; /* 垂直居中表单内容 */
  align-items: center; /* 水平居中表单内容 (可选) */
}

.title-box {
  height: 300px;
  line-height: 500px;
}

.title-box h1 {
  text-align: center;
  color: #424242; /* 深色文字 */
  user-select: none;
  letter-spacing: 5px;
  text-shadow: 4px 4px 3px rgba(0, 0, 0, .1);
}

.input-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

input {
  width: 60%;
  height: 40px;
  margin-bottom: 20px;
  text-indent: 10px;
  border: 1px solid #BDBDBD; /* 更明显的边框 */
  background-color: rgba(255, 255, 255, 0.6); /* 稍微不透明 */
  border-radius: 120px;
  backdrop-filter: blur(10px);
  color: #212121; /* 输入文字颜色 */
}

input:focus {
  color: #1565C0; /* 聚焦时更深的颜色 */
}

input:focus::placeholder {
  opacity: 0;
}

.btn-box {
  display: flex;
  justify-content: center;
}

button {
  width: 100px;
  height: 30px;
  margin: 0 7px;
  line-height: 30px;
  border: none;
  border-radius: 4px;
  background-color: #42A5F5; /* 更鲜明的按钮颜色 */
  color: white;
  font-weight: bold;
}

button:hover {
  cursor: pointer;
  opacity: .8;
}

.btn-box p {
  height: 30px;
  line-height: 30px;
  user-select: none;
  font-size: 14px;
  color: #616161; /* 稍深文字 */
}

.btn-box p:hover {
  cursor: pointer;
  border-bottom: 1px solid #757575; /* 更明显的下划线 */
}


.bubble-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}


</style>


<style>
body.login-page-body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to right, #E0F2F7, #FFFFFF);
  min-height: 100vh;
}
</style>