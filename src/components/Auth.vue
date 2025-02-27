<!-- auth.vue -->
<template>
  <div class="auth-container">
    <div class="card-wrapper">
      <div class="card-inner">
        <!-- 图片容器 -->
        <div class="image-section" :class="{ 'register-mode': !isLogin }">
          <transition name="image-slide" mode="out-in">
            <img
              :key="isLogin"
              src="@/assets/login-bg.png"
              class="auth-image"
              alt="Background"
            />
          </transition>
        </div>

        <!-- 表单容器 -->
        <div class="form-section" :class="{ 'register-mode': !isLogin }">
          <transition
            :name="'form-slide'"
            mode="out-in"
            :leave-class="!isLogin ? 'register-mode-leave-active' : ''"
            :leave-to-class="!isLogin ? 'register-mode-leave-to' : ''"
            :enter-class="!isLogin ? 'register-mode-enter-active' : ''"
            :enter-from-class="!isLogin ? 'register-mode-enter-from' : ''"
            :enter-to-class="!isLogin ? 'register-mode-enter-to' : ''"
          >
            <component
              :is="currentForm"
              @toggle-form="toggleForm"
              class="form-content"
              :key="isLogin"
            />
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'

export default {
  components: { Login, Register },
  data() {
    return {
      isLogin: true,
    }
  },
  computed: {
    currentForm() {
      return this.isLogin ? 'Login' : 'Register'
    },
  },
  methods: {
    toggleForm() {
      this.isLogin = !this.isLogin
    },
  },
}
</script>

<style scoped>
/* 基础布局 */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

/* 卡片容器 */
.card-wrapper {
  position: relative;
  width: 1000px;
  max-width: 90%;
  height: 600px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
}

.card-inner {
  display: flex;
  height: 100%;
  overflow: hidden; /* 确保内容超出时被隐藏 */
}

/* 图片区域 */
.image-section {
  width: 50%;
  height: 100%;
  overflow: hidden;
  position: relative;
  z-index: 2;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-section.register-mode {
  transform: translateX(100%);
}

.auth-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: saturate(1.1) contrast(1.05);
}

/* 表单区域 */
.form-section {
  width: 50%;
  height: 100%;
  background: white;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-section.register-mode {
  transform: translateX(-100%);
}

/* 表单切换动画 */
.form-slide-enter-active,
.form-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute; /* 添加 absolute 定位 */
  top: 0;           /* 确保表单从顶部开始 */
  left: 0;          /* 确保表单从左侧开始 */
  width: 100%;       /* 确保表单占据整个容器 */
  height: 100%;      /* 确保表单占据整个容器 */
}

/* Login -> Register: Login form slides down and out */
.form-slide-leave-active {
  transform: translateY(0); /* Start at original position */
}
.form-slide-leave-to {
  opacity: 0;
  transform: translateY(100%); /* Slide down and out */
}

/* Login -> Register: Register form slides up and in from right */
.form-slide-enter-from {
  opacity: 0;
  transform: translateY(-100%); /* Start from below, ready to slide up */
}
.form-slide-enter-to {
  opacity: 1;
  transform: translateY(0); /* Slide up to original position */
}


/* Register -> Login: Register form slides down and out to the right (we will adjust this to slide down) */
.form-slide-leave-active.register-mode-leave-active { /* Add class for register mode leaving */
  transform: translateY(0);
}
.form-slide-leave-to.register-mode-leave-to { /* Add class for register mode leaving */
  opacity: 0;
  transform: translateY(100%); /* Slide down and out */
}

/* Register -> Login: Login form slides up and in from left (we will adjust this to slide up from left) */
.form-slide-enter-from.register-mode-enter-from { /* Add class for register mode entering */
  opacity: 0;
  transform: translateY(-100%); /* Start from below, ready to slide up */
}
.form-slide-enter-to.register-mode-enter-to { /* Add class for register mode entering */
  opacity: 1;
  transform: translateY(0); /* Slide up to original position */
}


/* 图片切换动画 */
.image-slide-enter-active {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-slide-leave-active {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Login -> Register: Image slides left */
.image-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.image-slide-leave-to {
  transform: translateX(-100%); /* Slide left */
  opacity: 1;
}

/* Register -> Login: Image slides right */
.image-slide-enter-from {
  transform: translateX(100%); /* Start from right */
  opacity: 1;
}
.image-slide-enter-to {
  transform: translateX(0); /* Slide to original position */
  opacity: 1;
}

@media (max-width: 768px) {
  .card-wrapper {
    height: auto;
    margin: 20px;
  }

  .card-inner {
    flex-direction: column;
  }

  .image-section,
  .form-section {
    width: 100%;
    height: 50vh;
  }
}
</style>