<template>
  <div class="comment-item">
    <el-avatar :size="40" :src="getFullAvatarUrl(comment.user.avatarUrl)" @click="navigateToUserProfile(comment.user.id)" class="commenter-avatar" />
    <div class="comment-main">
      <div class="commenter-name" @click="navigateToUserProfile(comment.user.id)">{{ comment.user.nickName }}</div>
      <div class="comment-content">{{ comment.content }}</div>
      <div class="comment-footer">
        <span class="comment-time">{{ formattedTime }}</span>
        <LikeButton :target-id="comment.id" target-type="reply" :initial-like-count="comment.likeCount" />
        <span class="action-btn" @click="setReplyTarget(comment)">回复</span>
        <el-popconfirm v-if="canDelete" title="确定要删除这条评论吗？" @confirm="handleDeleteTopComment">
          <template #reference><span class="action-btn delete">删除</span></template>
        </el-popconfirm>
      </div>

      <div class="sub-reply-container">
        <div v-if="isChildrenVisible" class="sub-replies-list">
          <!-- **【修复】** 遍历处理过的 processedChildren -->
          <SubReplyItem
            v-for="child in processedChildren"
            :key="child.id"
            :reply="child"
            :article-id="articleId"
            :root-comment-id="comment.id"
            @set-reply-target="setReplyTarget"
            @request-refresh="refreshSubReplies"
          />
        </div>

        <div v-if="comment.childrenCount > 0" class="children-controls">
          <span class="control-btn" @click="toggleChildrenVisibility">
             {{ isChildrenVisible ? '收起' : `共 ${comment.childrenCount} 条回复，点击查看` }}
          </span>
          <span v-if="isChildrenVisible && hasMoreChildren && !isLoadingChildren" class="control-btn" @click="loadChildren()">
            加载更多
          </span>
          <span v-if="isLoadingChildren" class="control-btn">加载中...</span>
        </div>

        <transition name="fade">
          <CommentInput
            v-if="showReplyInput"
            :placeholder="replyInputPlaceholder"
            button-text="回复"
            :is-submitting="isSubmittingReply"
            @submit="handleReplySubmit"
            ref="replyInputRef"
          />
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRefs, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { getChildrenReplies, createArticleReply, deleteArticleReply } from '@/api/articleReply';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import SubReplyItem from './SubReplyItem.vue';
import CommentInput from './CommentInput.vue';
import LikeButton from './LikeButton.vue';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const props = defineProps({
  comment: { type: Object, required: true },
  articleId: { type: [Number, String], required: true },
});

const emit = defineEmits(['request-refresh']);
const userStore = useUserStore();
const router = useRouter();

const isChildrenVisible = ref(false);
const children = ref([]); // 原始子回复数据
const childrenCurrentPage = ref(1);
const childrenPageSize = ref(10);
const hasMoreChildren = ref(true);
const isLoadingChildren = ref(false);
const showReplyInput = ref(false);
const isSubmittingReply = ref(false);
const replyTarget = ref(null);
const replyInputRef = ref(null);

const avatarBaseURL = 'http://localhost:58080/avatars';
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
const getFullAvatarUrl = (path) => (path ? avatarBaseURL + path : defaultAvatar);

const canDelete = computed(() => userStore.currentUserId && userStore.currentUserId === props.comment.replyUserId);
const formattedTime = computed(() => dayjs(props.comment.createTime).fromNow());
const replyInputPlaceholder = computed(() => `回复 @${replyTarget.value?.user.nickName || ''}`);

// **【修复】** 创建用户映射表
const userMap = computed(() => {
    const map = new Map();
    // 添加顶级评论作者
    if (props.comment.user) {
        map.set(props.comment.user.id, props.comment.user);
    }
    // 添加所有子评论作者
    children.value.forEach(reply => {
        if (reply.user && !map.has(reply.user.id)) {
            map.set(reply.user.id, reply.user);
        }
    });
    return map;
});

// **【修复】** 创建处理过的子回复列表，手动添加postUser
const processedChildren = computed(() => {
    return children.value.map(reply => {
        // 如果后端已提供postUser，直接返回
        if (reply.postUser) {
            return reply;
        }
        // 否则，根据postUserId在映射表中查找
        const postUser = userMap.value.get(reply.postUserId);
        return { ...reply, postUser: postUser || null };
    });
});

const navigateToUserProfile = (userId) => router.push(`/home/user-profile/${userId}`);

const toggleChildrenVisibility = () => {
  isChildrenVisible.value = !isChildrenVisible.value;
  if (isChildrenVisible.value && children.value.length === 0) {
    loadChildren(true);
  }
};

// **【修复】** 修复了循环加载的bug
const loadChildren = async (isReset = false) => {
  if (isLoadingChildren.value) return;
  isLoadingChildren.value = true;
  
  if (isReset) {
    children.value = []; // 先清空
    childrenCurrentPage.value = 1; // 再重置页码
  }

  try {
    const params = { replyId: props.comment.id, currentPage: childrenCurrentPage.value, pageSize: childrenPageSize.value };
    const res = await getChildrenReplies(params);
    const newChildren = res.data.data || [];

    children.value.push(...newChildren); // 追加新获取的数据

    if (newChildren.length < childrenPageSize.value) {
        hasMoreChildren.value = false;
    } else {
        childrenCurrentPage.value++;
        hasMoreChildren.value = true;
    }
  } finally {
    isLoadingChildren.value = false;
  }
};

const refreshSubReplies = () => {
    loadChildren(true);
    if (!isChildrenVisible.value) isChildrenVisible.value = true;
    emit('request-refresh');
};

const setReplyTarget = (target) => {
  replyTarget.value = target;
  showReplyInput.value = true;
  nextTick(() => {
    replyInputRef.value?.focus();
  });
};

const handleReplySubmit = async (content, onSubmitted) => {
  isSubmittingReply.value = true;
  try {
    const payload = {
      articleId: props.articleId,
      replyId: replyTarget.value.id,
      postUserId: replyTarget.value.replyUserId,
      content,
    };
    await createArticleReply(payload);
    ElMessage.success('回复成功！');
    onSubmitted();
    showReplyInput.value = false;
    await refreshSubReplies();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '回复失败');
  } finally {
    isSubmittingReply.value = false;
  }
};

const handleDeleteTopComment = async () => {
  try {
    await deleteArticleReply({ articleReplyId: props.comment.id, articleId: props.articleId });
    ElMessage.success('删除成功');
    emit('request-refresh');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '删除失败');
  }
};
</script>

<style scoped>
.comment-item { display: flex; gap: 15px; padding: 16px 0; border-top: 1px solid #f0f2f5; }
.commenter-avatar { cursor: pointer; flex-shrink: 0; }
.comment-main { flex: 1; display: flex; flex-direction: column; }
.commenter-name { font-weight: 500; color: #333; font-size: 14px; cursor: pointer; }
.comment-content { color: #1a1a1a; line-height: 1.7; font-size: 15px; margin: 8px 0; word-break: break-word; }
.comment-footer { display: flex; align-items: center; gap: 20px; font-size: 13px; color: #8590a6; }
.action-btn { cursor: pointer; transition: color .2s; }
.action-btn:hover { color: #3498db; }
.action-btn.delete:hover { color: #e74c3c; }
.sub-reply-container { margin-top: 10px; }
.sub-replies-list { border-top: 1px solid #f0f2f5; margin-top: 10px; padding-top: 5px; }
.children-controls { font-size: 13px; color: #8590a6; margin-top: 10px; }
.control-btn { cursor: pointer; margin-right: 15px; }
.control-btn:hover { color: #3498db; }
.no-more { color: #ccc; }
.fade-enter-active, .fade-leave-active { transition: opacity .3s, transform .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>