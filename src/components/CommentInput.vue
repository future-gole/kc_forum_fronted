input-wrapper<!-- src/components/CommentInput.vue -->
<template>
  <div class="comment-input-box">
    <el-avatar
      :size="40"
      :src="userStore.avatarUrl ? getFullAvatarUrl(userStore.avatarUrl) : defaultAvatar"
      class="user-avatar"
    />
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="content"
        :placeholder="placeholder"
        rows="1"
        @input="autoResize"
        @keydown.enter.prevent="handleSubmit"
      ></textarea>
      <div class="actions">
        <span class="char-count" :class="{ 'over-limit': contentLength > 500 }">
          {{ contentLength }} / 500
        </span>
        <button @click="handleSubmit" :disabled="isSubmitting || !content.trim() || contentLength > 500">
          {{ buttonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';

const props = defineProps({
  placeholder: { type: String, default: '留下你的精彩评论吧~' },
  buttonText: { type: String, default: '发表评论' },
  isSubmitting: { type: Boolean, default: false }
});

const emit = defineEmits(['submit']);
const userStore = useUserStore();
const content = ref('');
const textareaRef = ref(null);

const avatarBaseURL = 'http://localhost:58080/avatars';
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
const getFullAvatarUrl = (path) => (path ? avatarBaseURL + path : defaultAvatar);

const contentLength = computed(() => content.value.length);

const autoResize = () => {
  nextTick(() => {
    // **【修复】** 增加健壮性检查，防止textareaRef为null
    if (!textareaRef.value) return;
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
  });
};

const handleSubmit = () => {
  if (!userStore.currentUserId) {
    ElMessage.warning('请先登录再发表评论');
    return;
  }
  if (!content.value.trim() || contentLength.value > 500) {
    ElMessage.warning('评论内容不能为空且不能超过500字符');
    return;
  }
  emit('submit', content.value, () => {
    content.value = '';
    autoResize();
  });
};

// 暴露 focus 方法给父组件
const focus = () => {
    nextTick(() => {
        textareaRef.value?.focus();
    })
}
defineExpose({ focus });
</script>

<style scoped>
.comment-input-box {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-top: 20px;
}
.input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.2s ease;
  min-height: 42px;
  overflow-y: hidden; /* 防止出现滚动条 */
}
textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}
.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 8px;
  gap: 12px;
}
.char-count {
  font-size: 12px;
  color: #909399;
}
.char-count.over-limit {
  color: #f56c6c;
}
button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
button:hover {
  background-color: #2980b9;
}
button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>