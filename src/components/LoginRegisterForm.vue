<template>
  <div class="shell">
    
    <!-- 容器 b：登录表单 -->
    <div class="container b-container" id="b-container" ref="bContainer">
      <form class="form" id="b-form" @submit.prevent="handleLogin">
        <!-- 登录表单标题 -->
        <h2 class="form_title title">登入账号</h2>
        <!-- 社交图标，这里只是展示，如果需要实际功能需要进一步实现 -->
        <div class="form_icons">
          <i class="iconfont icon-QQ"></i>
          <i class="iconfont icon-weixin"></i>
          <i class="iconfont icon-bilibili-line"></i>
        </div>
        <!-- 登录方式提示 -->
        <span class="form_span">选择电子邮箱登录</span>
        <!-- 邮箱输入框 -->
        <input type="text" class="form_input" placeholder="用户名" v-model="loginForm.email">
        <!-- 密码输入框 -->
        <input type="password" class="form_input" placeholder="密码" v-model="loginForm.password">
        <!-- 忘记密码链接，这里只是展示，如果需要实际功能需要进一步实现 -->
        <a class="form_link">忘记密码？</a>
        <!-- 登录按钮，绑定 submit 事件并阻止默认行为，调用 handleLogin 方法 -->
        <button class="form_button button submit" type="submit">登录</button>
      </form>
    </div>

    <!-- 容器 a：注册表单 -->
    <div class="container a-container" id="a-container" ref="aContainer">
      <form class="form" id="a-form" @submit.prevent="handleRegister">
        <h2 class="form_title title">创建账号</h2>
        <div class="form_icons">
          <i class="iconfont icon-QQ"></i>
          <i class="iconfont icon-weixin"></i>
          <i class="iconfont icon-bilibili-line"></i>
        </div>
        <span class="form_span">使用电子邮箱注册</span>

        <!-- 邮箱输入和发送验证码 -->
        <div class="email-input-group">
          <input type="email" class="form_input" placeholder="电子邮箱" v-model="registerForm.email">
          <button
              class="send-code-btn"
              :disabled="isSending"
              @click.prevent="sendVerificationCode"
          >
            {{ sendBtnText }}
          </button>
        </div>

        <!-- 验证码输入 -->
        <input type="text" class="form_input" placeholder="验证码" v-model="registerForm.verificationCode">

        <!-- 其他原有字段 -->
        <input type="text" class="form_input" placeholder="用户名" v-model="registerForm.userName">
        <input type="text" class="form_input" placeholder="昵称" v-model="registerForm.nickName">
        <input type="password" class="form_input" placeholder="密码" v-model="registerForm.password">
        <input type="password" class="form_input" placeholder="确认密码" v-model="registerForm.repeatPassword">

        <button class="form_button button submit" type="submit">注册</button>
      </form>
    </div>

    <!-- 切换容器 -->
    <div class="switch" id="switch-cnt" ref="switchCtn">
      <div class="switch_circle" ref="switchCircle1"></div>
      <div class="switch_circle switch_circle-t" ref="switchCircle2"></div>
      <!-- 切换容器 1：欢迎回来 -->
      <div class="switch_container" id="switch-c1" ref="switchC1">
        <!-- 欢迎回来标题 -->
        <h2 class="switch_title title" style="letter-spacing: 0;">Welcome Back！</h2>
        <!-- 欢迎回来描述 -->
        <p class="switch_description description">已经有账号了嘛，去登入账号来进入小科世界吧！！！</p>
        <!-- 切换到登录按钮，绑定 click 事件，调用 changeForm 方法 -->
        <button class="switch_button button switch-btn" @click="changeForm">登 录</button>
      </div>

      <!-- 切换容器 2：Hello Friend -->
      <div class="switch_container is-hidden" id="switch-c2" ref="switchC2">
        <!-- Hello Friend 标题 -->
        <h2 class="switch_title title" style="letter-spacing: 0;">Hello friends！</h2>
        <!-- Hello Friend 描述 -->
        <p class="switch_description description">去注册一个账号，成为尊贵的小科，让我们踏入奇妙的旅途~</p>
        <!-- 切换到注册按钮，绑定 click 事件，调用 changeForm 方法 -->
        <button class="switch_button button switch-btn" @click="changeForm">注 册</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus'; // 引入 Element Plus 的 Message 组件，用于消息提示
import 'element-plus/theme-chalk/el-message.css'; // 引入 Element Plus Message 组件的样式
import axios from 'axios';
import { useRouter } from 'vue-router'; // 引入 useRouter

// 在 setup 函数内部获取 router 实例
const router = useRouter();

// // 引入 iconfont 样式，路径需要根据你的实际文件路径调整
import '@/assets/css/iconfont.css';
// import '@/assets/css/demo.css';

// 定义注册表单的响应式数据
// 注册表单数据
const registerForm = reactive({
  email: "",
  userName: '',
  nickName: '',
  password: '',
  repeatPassword: '',
  verificationCode: ''
});

// 验证码相关状态
const isSending = ref(false);
const sendBtnText = ref("发送验证码");
let countdown = 60;

// 发送验证码
const sendVerificationCode = async () => {
  if (!registerForm.email) {
    ElMessage.warning('请输入邮箱地址');
    return;
  }

  try {
    const response = await axios.post(
        `http://127.0.0.1:58080/email/sendVerificationCode?email=${registerForm.email}`
    );

    if (response.data.code === 200) {
      ElMessage.success('验证码已发送');
      startCountdown();
    } else {
      ElMessage.error('验证码发送失败');
    }
  } catch (error) {
    ElMessage.error('发送验证码失败');
    console.error('Error:', error);
  }
};

// 倒计时处理
const startCountdown = () => {
  isSending.value = true;
  const timer = setInterval(() => {
    countdown--;
    sendBtnText.value = `${countdown}秒后重发`;

    if (countdown <= 0) {
      clearInterval(timer);
      isSending.value = false;
      sendBtnText.value = "发送验证码";
      countdown = 60;
    }
  }, 1000);
};


// 定义登录表单的响应式数据
const loginForm = reactive({
  email: '',
  password: ''
});

// 获取 DOM 元素的 ref
const switchCtn = ref(null);
const switchC1 = ref(null);
const switchC2 = ref(null);
const switchCircle1 = ref(null);
const switchCircle2 = ref(null);
const aContainer = ref(null);
const bContainer = ref(null);

// 定义切换表单的方法
const changeForm = () => {
  // 添加过渡动画类名
  switchCtn.value.classList.add("is-gx");
  setTimeout(function () {
    switchCtn.value.classList.remove("is-gx");
  }, 1500)
  // 切换 switch 容器的左右位置类名
  switchCtn.value.classList.toggle("is-txr");
  switchCircle1.value.classList.toggle("is-txr");
  switchCircle2.value.classList.toggle("is-txr");

  // 切换 switch 内容容器的显示隐藏类名
  switchC1.value.classList.toggle("is-hidden");
  switchC2.value.classList.toggle("is-hidden");

  // 切换表单容器的左右位置类名
  aContainer.value.classList.toggle("is-txl");
  bContainer.value.classList.toggle("is-txl");
  // 切换登录容器的层级，使其在前方
  bContainer.value.classList.toggle("is-z");
};

// 定义注册处理方法
const handleRegister = async () => {
  // 注册前的数据校验
  if (!registerForm.userName) {
    ElMessage.warning('用户名不能为空');
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
  // 验证码校验
  if (!registerForm.verificationCode) {
    ElMessage.warning('请输入验证码');
    return;
  }

  try {
    // 先验证邮箱和验证码
    const verifyResponse = await axios.post(
        `http://127.0.0.1:58080/email/verifyEmail`,
        {
          params: {
            email: registerForm.email,
            code: registerForm.verificationCode
          }
        }
    );

    if (verifyResponse.data.code !== 200) {
      ElMessage.error('验证码错误或已过期');
      return;
    }

    // 验证通过后执行注册
    const registerResponse = await axios.post(
        'http://127.0.0.1:58080/user/register',
        {
          email: registerForm.email,
          userName: registerForm.userName,
          password: registerForm.password,
          repeatPassword: registerForm.repeatPassword,
          nickName: registerForm.nickName
        }
    );
      ElMessage.success('注册成功');
      router.push('/login');
  } catch (error) {
    ElMessage.error('注册请求发生错误');
    console.error('Error:', error);
  }
};
// 定义登录处理方法
const handleLogin = async () => {
  // 登录前的数据校验
  if (!loginForm.userName) {
    ElMessage.warning('用户名不能为空');
    return;
  }
  if (!loginForm.password) {
    ElMessage.warning('密码不能为空');
    return;
  }

  try {
    // 发起登录请求
    const response = await axios.post('http://127.0.0.1:58080/user/login', {
      userName: loginForm.userName,
      password: loginForm.password
    });

      ElMessage.success('登录成功');
      // 可以在这里存储 token 或者进行页面跳转等操作
      console.log('登录成功，返回数据:', response.data.data);
      localStorage.setItem('token', response.data.data.authorization); // 存储 token 到 localStorage
      // 使用 router.push 进行跳转
      router.push('/home'); // 跳转到 /home 路由
  } catch (error) {
    ElMessage.error('登录请求发生错误');
    console.error('登录错误:', error.message, error.response); // 打印更详细的错误信息
  }
};
</script>

  
  <style scoped>
  /* 引入 demo.css 和 index.css 的样式内容，并放在 <style scoped> 标签内，实现样式作用域 */
  /* 注意：这里需要将 demo.css 和 index.css 的内容复制过来, 或者使用 @import 引入 (不推荐在 <style scoped> 中使用 @import) */
  
  /* 以下是 demo.css 和 index.css 的样式内容，你需要将你的 demo.css 和 index.css 内容复制到这里 */
  /* 样式内容开始 */
  /* Logo 字体 */
  /* @font-face {
    font-family: "iconfont logo";
    src: url('https://at.alicdn.com/t/font_985780_km7mi63cihi.eot?t=1545807318834');
    src: url('https://at.alicdn.com/t/font_985780_km7mi63cihi.eot?t=1545807318834#iefix') format('embedded-opentype'),
      url('https://at.alicdn.com/t/font_985780_km7mi63cihi.woff?t=1545807318834') format('woff'),
      url('https://at.alicdn.com/t/font_985780_km7mi63cihi.ttf?t=1545807318834') format('truetype'),
      url('https://at.alicdn.com/t/font_985780_km7mi63cihi.svg?t=1545807318834#iconfont') format('svg');
  } */

  /* index.css 的样式 */
  * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      /* 字体无法选中 */
      user-select: none;
  }

  .send-code-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: #409EFF;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .shell {
      position: relative;
      width: 1000px;
      min-width: 1000px;
      min-height: 600px;
      height: 600px;
      padding: 25px;
      background-color: #ecf0f3;
      box-shadow: 10px 10px 10px #d1d9e6, -10px -10px 10px #f9f9f9;
      border-radius: 12px;
      overflow: hidden;
  }
  
  /* 设置响应式 */
  @media (max-width: 1200px) {
      .shell {
          transform: scale(0.7);
      }
  }
  
  @media (max-width: 1000px) {
      .shell {
          transform: scale(0.6);
      }
  }
  
  @media (max-width: 800px) {
      .shell {
          transform: scale(0.5);
      }
  }
  
  @media (max-width: 600px) {
      .shell {
          transform: scale(0.4);
      }
  }
  
  .container {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0;
      width: 600px;
      height: 100%;
      padding: 25px;
      background-color: #ecf0f3;
      transition: 1.25s;
  }
  
  .form {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 100%;
      height: 100%;
  }
  
  .iconfont {
      margin: 0 5px;
      border: rgba(0, 0, 0, 0.5) 2px solid;
      border-radius: 50%;
      font-size: 25px;
      padding: 3px;
      opacity: 0.5;
      transition: 0.1s;
  }
  
  .iconfont:hover {
      opacity: 1;
      transition: 0.15s;
      cursor: pointer;
  }
  
  .form_input {
      width: 350px;
      height: 40px;
      margin: 4px 0;
      padding-left: 25px;
      font-size: 13px;
      letter-spacing: 0.15px;
      border: none;
      outline: none;
      background-color: #ecf0f3;
      transition: 0.25s ease;
      border-radius: 8px;
      box-shadow: inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #f9f9f9;
  }
  
  .form_input:focus {
      box-shadow: inset 4px 4px 4px #d1d9e6, inset -4px -4px 4px #f9f9f9;
  }
  
  .form_span {
      margin-top: 30px;
      margin-bottom: 12px;
  }
  
  .form_link {
      color: #181818;
      font-size: 15px;
      margin-top: 25px;
      border-bottom: 1px solid #a0a5a8;
      line-height: 2;
  }
  
  .title {
      font-size: 34px;
      font-weight: 700;
      line-height: 3;
      color: #181818;
      letter-spacing: 10px;
  }
  
  .description {
      font-size: 14px;
      letter-spacing: 0.25px;
      text-align: center;
      line-height: 1.6;
  }
  
  .button {
      width: 180px;
      height: 50px;
      border-radius: 25px;
      margin-top: 50px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 1.15px;
      background-color: #4B70E2;
      color: #f9f9f9;
      box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #f9f9f9;
      border: none;
      outline: none;
  }
  
  .a-container {
      z-index: 100;
      left: calc(100% - 600px);
  }
  
  .b-container {
      left: calc(100% - 600px);
      z-index: 0;
  }
  
  .switch {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 400px;
      padding: 50px;
      z-index: 200;
      transition: 1.25s;
      background-color: #ecf0f3;
      overflow: hidden;
      box-shadow: 4px 4px 10px #d1d9e6, -4px -4px 10px #d1d9e6;
  }
  
  .switch_circle {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background-color: #ecf0f3;
      box-shadow: inset 8px 8px 12px #b8bec7, inset -8px -8px 12px #fff;
      bottom: -60%;
      left: -60%;
      transition: 1.25s;
  }
  
  .switch_circle-t {
      top: -30%;
      left: 60%;
      width: 300px;
      height: 300px;
  }
  
  .switch_container {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      position: absolute;
      width: 400px;
      padding: 50px 55px;
      transition: 1.25s;
  }
  
  .switch_button {
      cursor: pointer;
  }
  
  .switch_button:hover,
  .submit:hover {
      box-shadow: 6px 6px 10px #d1d9e6, -6px -6px 10px #f9f9f9;
      transform: scale(0.985);
      transition: 0.25s;
  }
  
  .switch_button:active,
  .switch_button:focus {
      box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #f9f9f9;
      transform: scale(0.97);
      transition: 0.25s;
  }
  
  .is-txr {
      left: calc(100% - 400px);
      transition: 1.25s;
      transform-origin: left;
  }
  
  .is-txl {
      left: 0;
      transition: 1.25s;
      transform-origin: right;
  }
  
  .is-z {
      z-index: 200;
      transition: 1.25s;
  }
  
  .is-hidden {
      visibility: hidden;
      opacity: 0;
      position: absolute;
      transition: 1.25s;
  }
  
  .is-gx {
      animation: is-gx 1.25s;
  }
  
  @keyframes is-gx {
  
      0%,
      10%,
      100% {
          width: 400px;
      }
  
      30%,
      50% {
          width: 500px;
      }
  }

  /* 现代渐变色背景 */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    justify-content: center;
    align-items: center;
    min-height: 100vh
  }
  
  /* 动态浮动动画 */
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  }
  
  /* 高级卡片效果 */
  .auth-card {
    width: 100%;
    max-width: 500px;
    padding: 2.5rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    transform-style: preserve-3d;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  /* 输入框美化 */
  .el-input__inner {
    background: rgba(245, 245, 245, 0.9) !important;
    border-radius: 10px !important;
    transition: all 0.3s ease !important;
  }
  
  .el-input__inner:focus {
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.5) !important;
  }
  /* 样式内容结束 */
  
  </style>