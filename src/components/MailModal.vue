<template>
  <el-dialog
    v-model="dialogVisible"
    title="站内信"
    width="70%"
    :fullscreen="isMobile"
    class="mail-modal"
    @close="handleDialogInternalClose" append-to-body
    draggable
  >
    <div v-if="!selectedConversationUserId" class="conversation-list-view">
      <el-input
        v-model="searchUserQuery"
        placeholder="搜索用户以开始对话..."
        clearable
        class="user-search-input"
        :prefix-icon="Search"
        @keyup.enter="handleSearchUser"
      >
        <template #append>
          <el-button :icon="Search" @click="handleSearchUser" />
        </template>
      </el-input>

      <el-scrollbar height="400px" class="conversation-list-scrollbar">
        <div v-if="isLoadingConversations" class="loading-conversations">正在加载会话...</div>
        <!-- 模板现在使用计算属性 recentConversations -->
        <ul v-else-if="recentConversations.length > 0" class="conversation-list">
          <li
            v-for="convo in recentConversations"
            :key="convo.contact.id"
            class="conversation-item"
            @click="selectConversation(convo.contact.id, convo.contact.username, convo.contact.avatar)"
          >
            <el-avatar :src="convo.contact.avatar ? `${avatarBaseURL}${convo.contact.avatar}` : defaultAvatar" size="small" class="convo-avatar"></el-avatar>
            <div class="convo-info">
              <span class="convo-username">{{ convo.contact.username }}</span>
              <span class="convo-last-message">{{ convo.lastMessage.content }}</span>
            </div>
            <div class="convo-meta">
              <span class="convo-time">{{ formatDate(convo.lastMessage.timestamp) }}</span>
              <el-badge :value="convo.unreadCount" :hidden="convo.unreadCount === 0" type="danger"></el-badge>
            </div>
          </li>
        </ul>
        <el-empty v-else description="暂无会话记录。尝试搜索用户开始聊天。"></el-empty>
      </el-scrollbar>
    </div>

    <div v-else class="chat-view">
      <div class="chat-header">
        <el-button :icon="ArrowLeft" text @click="backToConversationList" class="back-button">返回</el-button>
        <h3>与 {{ contactUsername }} 的对话</h3>
      </div>
      <el-scrollbar ref="messageScrollbar" height="350px" class="message-list">
        <div v-for="msg in messages" :key="msg.id" :class="['message-item', msg.postUserId === currentUserId ? 'sent' : 'received']">
           <el-avatar :src="msg.postUserId === (currentUserId.value || userStore.currentUserId) ? `${avatarBaseURL}${currentUserAvatar}` : `${avatarBaseURL}${contactAvatar}`" size="small"></el-avatar>
          <div class="message-content">
            <p>{{ msg.content }}</p>
            <span class="message-timestamp">{{ formatDate(msg.createTime) }}</span>
          </div>
        </div>
          <div v-if="isLoadingMessages" class="loading-messages">正在加载消息...</div>
          <el-empty v-if="!isLoadingMessages && messages.length === 0" description="暂无消息"></el-empty>
      </el-scrollbar>
      <div class="message-input-area">
        <el-input
          v-model="newMessage"
          placeholder="输入消息..."
          type="textarea"
          :rows="3"
          resize="none"
          @keyup.enter.prevent="handleSendMessage"
        ></el-input>
        <el-button type="primary" @click="handleSendMessage" :disabled="!newMessage.trim()" class="send-button">发送</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, nextTick, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, ArrowLeft } from '@element-plus/icons-vue';
import { sendMessage, getAllMessagesByUserId, getRecentConversations } from '@/api/message';
import { searchUsers, getUserDetails } from '@/api/user'; // searchUsers 仍被导入，但不再用于 handleSearchUser
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { useMailStore } from '@/stores/mailStore';
import dayjs from 'dayjs';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible']);

const userStore = useUserStore();
const mailStore = useMailStore();
const { currentUserId } = storeToRefs(userStore);

const dialogVisible = ref(props.visible);
const isMobile = ref(window.innerWidth < 768);
const searchUserQuery = ref('');
const selectedConversationUserId = ref(null);
const contactUsername = ref('');
const contactAvatar = ref('https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png');
const currentUserAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');
const defaultAvatar = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png';
const avatarBaseURL = 'http://localhost:58080/avatars';
const messages = ref([]);
const newMessage = ref('');
const messageScrollbar = ref(null);
const isLoadingMessages = ref(false);
const isLoadingConversations = ref(false);

// 【修改点1】引入 allRecentConversations 存储完整列表
const allRecentConversations = ref([]);

// 【修改点2】将 recentConversations 改为计算属性，用于实时过滤
const recentConversations = computed(() => {
  if (!searchUserQuery.value.trim()) {
    return allRecentConversations.value; // 如果搜索框为空，显示所有会话
  }
  const query = searchUserQuery.value.toLowerCase();
  return allRecentConversations.value.filter(convo =>
    convo.contact.username.toLowerCase().includes(query)
  );
});

const formatDate = (dateString) => dayjs(dateString).locale('zh-cn').format('YYYY年MM月DD日 HH:mm');

const scrollToBottom = () => {
  nextTick(() => {
    if (messageScrollbar.value && messageScrollbar.value.wrapRef) {
      messageScrollbar.value.setScrollTop(messageScrollbar.value.wrapRef.scrollHeight);
    }
  });
};

const fetchMessages = async (contactId) => {
  if (!currentUserId.value || !contactId) return;
  isLoadingMessages.value = true;
  try {
    const res = await getAllMessagesByUserId(contactId);
    if (res.data.code === 200) {
      messages.value = res.data.data.map(m => ({
        ...m,
        id: m.id || Math.random(),
      }));
      scrollToBottom();
    } else {
      console.error('加载消息失败: ' + (res.data.message || '未知错误'));
    }
  } catch (error) {
    console.error(`获取用户 ${contactId} 的消息失败:`, error);
  } finally {
    isLoadingMessages.value = false;
  }
};

const selectConversation = async (contactId, username, avatar) => {
  if (!contactId) {
    console.warn("[MailModal] selectConversation called with invalid contactId:", contactId);
    backToConversationList();
    return;
  }

  const currentId = currentUserId.value || userStore.currentUserId;
  if (contactId === currentId) {
    ElMessage.warning("不能和自己聊天。");
    return;
  }
  selectedConversationUserId.value = contactId;

  if (!username || !avatar || avatar === defaultAvatar || avatar.startsWith('https://cube.elemecdn.com')) {
    try {
      const res = await getUserDetails(contactId);
      if (res.data.code === 200 && res.data.data) {
        contactUsername.value = res.data.data.userName;
        contactAvatar.value = res.data.data.avatarUrl || defaultAvatar;
      } else {
        contactUsername.value = username || `用户 ${contactId}`;
        contactAvatar.value = avatar || defaultAvatar;
        console.error('获取联系人详情失败: ' + (res.data.message || '未知错误'));
      }
    } catch (error) {
      contactUsername.value = username || `用户 ${contactId}`;
      contactAvatar.value = avatar || defaultAvatar;
      console.error(`获取用户 ${contactId} 详情失败:`, error);
    }
  } else {
    contactUsername.value = username;
    contactAvatar.value = avatar;
  }

  fetchMessages(contactId);

  // 【修改点3】更新 allRecentConversations
  const existingConvoIndex = allRecentConversations.value.findIndex(c => c.contact.id === contactId);
  if (existingConvoIndex !== -1) {
    const convo = allRecentConversations.value.splice(existingConvoIndex, 1)[0];
    convo.unreadCount = 0;
    allRecentConversations.value.unshift(convo);
  } else {
    allRecentConversations.value.unshift({
      contact: {
        id: contactId,
        username: contactUsername.value,
        avatar: contactAvatar.value,
      },
      lastMessage: { content: '开始新的对话', timestamp: Date.now() },
      unreadCount: 0
    });
  }
};

const backToConversationList = () => {
  selectedConversationUserId.value = null;
  messages.value = [];
  // searchUserQuery.value = ''; // 可以选择是否清空搜索框
  fetchRecentConversations(); // 刷新会话列表
};

const handleSendMessage = async () => {
  if (!newMessage.value.trim() || !selectedConversationUserId.value) return;
  const currentId = currentUserId.value || userStore.currentUserId;
  const messageData = {
    receiveUserId: selectedConversationUserId.value,
    content: newMessage.value.trim(),
  };

  try {
    const res = await sendMessage(messageData);
    if (res.data.code === 200) {
      const sentMessage = res.data.data;
      messages.value.push({
        ...sentMessage,
        id: sentMessage.id || Math.random(),
      });
      newMessage.value = '';
      scrollToBottom();

      // 【修改点4】更新 allRecentConversations
      const convoIndex = allRecentConversations.value.findIndex(c => c.contact.id === selectedConversationUserId.value);
      if (convoIndex !== -1) {
        const convo = allRecentConversations.value[convoIndex];
        convo.lastMessage.content = sentMessage.content;
        convo.lastMessage.timestamp = sentMessage.createTime;
        allRecentConversations.value.splice(convoIndex, 1);
        allRecentConversations.value.unshift(convo);
      } else {
        allRecentConversations.value.unshift({
          contact: {
            id: selectedConversationUserId.value,
            username: contactUsername.value,
            avatar: contactAvatar.value,
          },
          lastMessage: { content: sentMessage.content, timestamp: sentMessage.createTime },
          unreadCount: 0
        });
      }
    } else {
      console.error('发送消息失败: ' + (res.data.message || '未知错误'));
    }
  } catch (error) {
    console.error("发送消息失败:", error);
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const fetchRecentConversations = async () => {
  const currentId = currentUserId.value || userStore.currentUserId;
  if (!currentId) {
    isLoadingConversations.value = false;
    return;
  }
  isLoadingConversations.value = true;
  try {
    const res = await getRecentConversations();
    if (res.data.code === 200 && res.data.data) {
      // 【修改点5】将数据存储到 allRecentConversations
      allRecentConversations.value = res.data.data.map(convo => ({
        contact: {
          id: convo.contactId,
          username: convo.contactNickname,
          avatar: convo.contactAvatar,
        },
        lastMessage: {
          content: convo.lastMessageContent,
          timestamp: convo.lastMessageTimestamp
        },
        unreadCount: convo.unreadCount
      }));
    } else {
      console.error("获取最近会话列表失败: " + (res.data.message || '未知错误'));
    }
  } catch (error) {
    console.error("获取最近会话列表失败:", error);
  } finally {
    isLoadingConversations.value = false;
  }
};

// 【修改点6】修改 handleSearchUser，移除后端 API 调用
const handleSearchUser = () => {
  // 搜索功能现在通过 `recentConversations` 计算属性实现实时过滤。
  // 当用户在搜索框中输入内容时，`recentConversations` 会自动更新，显示匹配的会话。
  // 此函数（通过点击搜索按钮或按回车触发）现在主要用于：
  // 1. 确认搜索查询（尽管实时过滤已完成）。
  // 2. 在没有本地匹配结果时，提供用户反馈。

  if (!searchUserQuery.value.trim()) {
    // 如果搜索查询为空，则显示所有会话（由计算属性处理）。
    // 无需额外操作。
    return;
  }

  // 检查当前过滤后的列表是否为空。
  // 如果为空，表示在最近会话中没有找到匹配的用户。
  if (recentConversations.value.length === 0) {
    ElMessage.info('未在最近会话中找到匹配用户。');
  }
  // ！！重要提示：根据您的要求，此函数已移除对后端 `searchUsers` API 的调用。
  // 这意味着您无法再通过此搜索框来搜索和发起与不在您最近会话列表中的新用户的聊天。
};


watch(() => props.visible, async (newValue) => {
  console.log('[MailModal] props.visible changed to:', newValue);
  dialogVisible.value = newValue;

  if (newValue) {
    isMobile.value = window.innerWidth < 768;

    const currentId = currentUserId.value || userStore.currentUserId;
    if (currentId && (currentUserAvatar.value === 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' || !currentUserAvatar.value)) {
      try {
        const res = await getUserDetails(currentId);
        if (res.data.code === 200 && res.data.data && res.data.data.avatarUrl) {
          currentUserAvatar.value = res.data.data.avatarUrl;
        }
      } catch (error) {
        console.error("获取当前用户头像失败:", error);
      }
    }

    if (mailStore.initialTargetUser && mailStore.initialTargetUser.id) {
      console.log('[MailModal] Opening with initial target user from store:', mailStore.initialTargetUser);
      await selectConversation(
        mailStore.initialTargetUser.id,
        mailStore.initialTargetUser.username,
        mailStore.initialTargetUser.avatar
      );
      mailStore.clearInitialTargetUser();
    } else if (!selectedConversationUserId.value) {
      console.log('[MailModal] No initial target, fetching recent conversations.');
      fetchRecentConversations();
    } else {
      console.log('[MailModal] No initial target, but a conversation is already selected. Fetching messages for:', selectedConversationUserId.value);
      fetchMessages(selectedConversationUserId.value);
    }
  } else {
    backToConversationList();
  }
});

watch(dialogVisible, (newValue) => {
  if (!newValue) {
    emit('update:visible', false);
  }
});

const handleDialogInternalClose = () => {
  emit('update:visible', false);
};

onMounted(() => {
  if (props.visible) {
    isMobile.value = window.innerWidth < 768;
  }
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768; });
});
</script>

<style scoped>
/* 你的 MailModal 样式保持不变 */
.mail-modal .el-dialog__body {
  padding: 10px 20px 20px 20px; /* 调整内边距 */
}
.user-search-input {
  margin-bottom: 15px;
}
.conversation-list-scrollbar {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.conversation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.conversation-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.2s;
}
.conversation-item:last-child {
  border-bottom: none;
}
.conversation-item:hover {
  background-color: #f5f7fa;
}
.convo-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}
.convo-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止文本溢出 */
}
.convo-username {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  margin-bottom: 4px;
}
.convo-last-message {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.convo-meta {
  margin-left: 10px;
  text-align: right;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.convo-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-bottom: 5px;
}
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%; /* 确保聊天视图填满空间 */
}
.chat-header {
  display: flex;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}
.chat-header h3 {
  margin: 0;
  margin-left: 10px;
  font-size: 16px;
  color: #303133;
}
.back-button {
  /* el-button text 样式可能比较素，可以按需调整 */
}
.message-list {
  flex-grow: 1;
  border: 1px solid #ebeef5;
  padding: 10px;
  border-radius: 4px;
  margin-bottom:10px;
}
.message-item {
  display: flex;
  margin-bottom: 15px;
  font-size: 14px;
}
.message-item .el-avatar {
  flex-shrink: 0;
}
.message-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 6px;
  position: relative;
}
.message-content p {
  margin: 0 0 5px 0;
  word-wrap: break-word; /* 允许长单词换行 */
}
.message-timestamp {
  font-size: 10px;
  color: #909399;
  display: block;
}

/* 发送的消息 */
.message-item.sent {
  flex-direction: row-reverse; /* 头像和内容反向 */
}
.message-item.sent .el-avatar {
  margin-left: 10px;
}
.message-item.sent .message-content {
  background-color: #409eff;
  color: #fff;
  margin-right: 0; /* 确保对齐 */
  border-bottom-right-radius: 0; /* 小三角效果 */
}
.message-item.sent .message-timestamp {
  color: #a0cfff;
  text-align: right;
}

/* 接收的消息 */
.message-item.received .el-avatar {
  margin-right: 10px;
}
.message-item.received .message-content {
  background-color: #f0f2f5;
  color: #303133;
  margin-left: 0; /* 确保对齐 */
  border-bottom-left-radius: 0; /* 小三角效果 */
}
.message-item.received .message-timestamp {
  text-align: left;
}

.message-input-area {
  display: flex;
  align-items: flex-end; /* 使发送按钮与文本域底部对齐 */
  margin-top: 10px;
}
.message-input-area .el-textarea {
  flex-grow: 1;
  margin-right: 10px;
}
.message-input-area .send-button {
  flex-shrink: 0; /* 防止按钮被压缩 */
}
.loading-conversations, .loading-messages {
  text-align: center;
  padding: 20px;
  color: #909399;
}
</style>