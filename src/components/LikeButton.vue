<template>
  <button class="like-btn" @click="toggleLike">
    <span class="like-icon" :class="{ liked: isLiked }"></span>
    <span>{{ likeCount }}</span>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from "@/utils/request.js";

// 定义 props
const props = defineProps({
  targetId: {
    type: Number,
    required: true
  },
  targetType: {
    type: String,
    required: true
  },
  initialLikeCount: {
    type: Number,
    default: 0
  }
});

// 定义响应式变量
const isLiked = ref(false);
const likeCount = ref(props.initialLikeCount);

// 定义 emits
const emit = defineEmits(['updateLikeCount']);

// 检查是否已点赞
const checkLike = async () => {
  try {
    const response = await request.get(`/likes/checkLike?targetType=${props.targetType}&targetId=${props.targetId}`);
    isLiked.value = response.data.data; // 直接赋值 response.data
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    // 可以添加错误提示
  }
};

// 切换点赞状态
const toggleLike = async () => {
  const originalIsLiked = isLiked.value; // 保存原始状态
  try {
    let response;
    if (isLiked.value) {
      // 取消点赞
      response = await request.post(`/likes/unLike?targetType=${props.targetType}&targetId=${props.targetId}`);
    } else {
      // 点赞
      response = await request.post(`/likes/addLike?targetType=${props.targetType}&targetId=${props.targetId}`);
    }

    if (response.data.code === 200) {
      // 请求成功，更新状态
      isLiked.value = !originalIsLiked;
      likeCount.value += isLiked.value ? 1 : -1;
      emit('updateLikeCount', isLiked.value ? 1 : -1); // 触发事件，通知父组件更新总点赞数
    } else {
      // 请求失败，给出提示，不更新状态
      console.error('点赞/取消点赞失败:', response.data.message);
      // 可以使用 ElMessage 或其他方式显示错误提示
    }
  } catch (error) {
    // 请求出错，给出提示，不更新状态
    console.error('点赞/取消点赞失败:', error);
    // 可以使用 ElMessage 或其他方式显示错误提示
  }
};

// 组件挂载时检查是否已点赞
onMounted(() => {
  checkLike();
});
</script>

<style scoped>
.like-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.like-icon {
  font-size: 1.2em;
  color: #888;
  cursor: pointer;
}

.like-icon::before {
  content: "\2661"; /* 空心爱心 */
}

.like-icon.liked::before {
  content: "\2764"; /* 实心爱心 */
  color: red;
}
</style>