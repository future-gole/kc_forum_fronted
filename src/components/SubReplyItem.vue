<template>
  <div class="sub-reply-item">
    <el-avatar :size="32" :src="getFullAvatarUrl(reply.user.avatarUrl)" @click="navigateToUserProfile(reply.user.id)" class="commenter-avatar" />
    <div class="comment-main">
      <div class="comment-header">
        <span class="commenter-name" @click="navigateToUserProfile(reply.user.id)">{{ reply.user.nickName }}</span>
        <!-- **核心逻辑**: replyId不等于顶级评论ID时，显示@ -->
        <!-- **核心逻辑**: 使用了父组件处理好的 postUser 对象 -->
        <span v-if="reply.replyId !== rootCommentId && reply.postUser" class="reply-tag">
          <el-icon><CaretRight /></el-icon>
          <span class="reply-to-name">{{ reply.postUser.nickName }}</span>
        </span>
      </div>
      <div class="comment-content">{{ reply.content }}</div>
      <div class="comment-footer">
        <span class="comment-time">{{ formattedTime }}</span>
        <LikeButton :target-id="reply.id" target-type="reply" :initial-like-count="reply.likeCount" />
        <span class="action-btn" @click="emit('set-reply-target', reply)">回复</span>
        <el-popconfirm v-if="canDelete" title="确定要删除这条评论吗？" @confirm="handleDelete">
          <template #reference><span class="action-btn delete">删除</span></template>
        </el-popconfirm>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { deleteArticleReply } from '@/api/articleReply';
import { ElMessage } from 'element-plus';
import { CaretRight } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import LikeButton from '@/components/LikeButton.vue';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const props = defineProps({
  reply: { type: Object, required: true },
  articleId: { type: [Number, String], required: true },
  rootCommentId: { type: Number, required: true },
});

const emit = defineEmits(['set-reply-target', 'request-refresh']);
const userStore = useUserStore();
const router = useRouter();

const avatarBaseURL = 'http://localhost:58080/avatars';
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
const getFullAvatarUrl = (path) => (path ? avatarBaseURL + path : defaultAvatar);

const canDelete = computed(() => userStore.currentUserId && userStore.currentUserId === props.reply.replyUserId);
const formattedTime = computed(() => dayjs(props.reply.createTime).fromNow());
const navigateToUserProfile = (userId) => router.push(`/home/user-profile/${userId}`);

const handleDelete = async () => {
  try {
    await deleteArticleReply({ articleReplyId: props.reply.id, articleId: props.articleId });
    ElMessage.success('删除成功');
    emit('request-refresh');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '删除失败');
  }
};
</script>

<style scoped>
.sub-reply-item{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid #f8f8f8}.sub-reply-item:last-child{border-bottom:none}.comment-main{flex:1;display:flex;flex-direction:column}.commenter-avatar{cursor:pointer;flex-shrink:0}.comment-header{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.commenter-name{font-weight:500;color:#555;font-size:13px;cursor:pointer}.commenter-name:hover{color:#3498db}.reply-tag{display:inline-flex;align-items:center;color:#8590a6;font-size:13px}.reply-to-name{color:#3498db;font-weight:500}.comment-content{color:#333;line-height:1.6;font-size:14px;margin:4px 0;word-break:break-word}.comment-footer{display:flex;align-items:center;gap:16px;font-size:12px;color:#8590a6}.action-btn{cursor:pointer;transition:color .2s}.action-btn:hover{color:#3498db}.action-btn.delete:hover{color:#e74c3c}
</style>