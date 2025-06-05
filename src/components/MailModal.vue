<template>
  <el-dialog
    v-model="dialogVisible"
    title="站内信"
    width="70%"
    :fullscreen="isMobile"
    class="mail-modal"
    @close="handleClose"
    append-to-body
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
        <ul v-else-if="recentConversations.length > 0" class="conversation-list">
          <li
            v-for="convo in recentConversations"
            :key="convo.contact.id"
            class="conversation-item"
            @click="selectConversation(convo.contact.id)"
          >
            <el-avatar :src="convo.contact.avatar || defaultAvatar" size="small" class="convo-avatar"></el-avatar>
            <div class="convo-info">
              <span class="convo-username">{{ convo.contact.username }}</span>
              <span class="convo-last-message">{{ convo.lastMessage.content }}</span>
            </div>
            <div class="convo-meta">
              <span class="convo-time">{{ formatTimestamp(convo.lastMessage.timestamp) }}</span>
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
          <el-avatar :src="msg.postUserId === currentUserId ? currentUserAvatar : contactAvatar" size="small"></el-avatar>
          <div class="message-content">
            <p>{{ msg.content }}</p>
            <span class="message-timestamp">{{ formatTimestamp(msg.timestamp) }}</span>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, ArrowLeft } from '@element-plus/icons-vue';
// import { sendMessage, getAllMessagesByUserId, getUnreadCount } from '@/api/messageService'; // API
// import { searchUsers, getUserDetails } from '@/api/userService'; // API for user search & details

const props = defineProps({
  visible: Boolean,
  currentUserId: { // Current logged-in user ID
    type: Number,
    required: true
  }
});

const emit = defineEmits(['update:visible']);

const dialogVisible = ref(props.visible);
const isMobile = ref(window.innerWidth < 768); // For dialog fullscreen

const searchUserQuery = ref('');
const selectedConversationUserId = ref(null); // ID of the user the current user is chatting with
const contactUsername = ref(''); // Username of the contact
const contactAvatar = ref('https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png'); // Default or fetched avatar
const currentUserAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'); // Default or fetched avatar
const defaultAvatar = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png';


const messages = ref([]);
const newMessage = ref('');
const messageScrollbar = ref(null);
const isLoadingMessages = ref(false);
const isLoadingConversations = ref(false);

const recentConversations = ref([]); // Array of { contact: {id, username, avatar}, lastMessage: {content, timestamp}, unreadCount }


// Mock API calls
const mockSearchUsers = async (query) => {
  console.log(`Mock searching users for: ${query}`);
  return new Promise(resolve => setTimeout(() => {
    if (query.toLowerCase() === "user2") {
      resolve([{ id: 2, username: 'User Two', avatar: '' }]);
    } else if (query.toLowerCase() === "user3") {
      resolve([{ id: 3, username: 'User Three', avatar: '' }]);
    } else {
      resolve([]);
    }
  }, 500));
};

const mockGetUserAvatar = async (userId) => {
  // In a real app, fetch user details including avatar
  return 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png';
}

const mockGetUserDetails = async (userId) => {
  console.log(`Mock getting details for user ID: ${userId}`);
  return new Promise(resolve => setTimeout(() => {
    if (userId === 2) resolve({ id: 2, username: 'User Two', avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' });
    else if (userId === 3) resolve({ id: 3, username: 'User Three', avatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png' });
    else resolve({ id: userId, username: `User ${userId}`, avatar: defaultAvatar});
  }, 300));
};

const mockGetAllMessagesByUserId = async (currentUserId, contactId) => {
  console.log(`Mock getting messages between ${currentUserId} and ${contactId}`);
  isLoadingMessages.value = true;
  return new Promise(resolve => setTimeout(() => {
    const mockMsgs = [
      { id: 1, postUserId: contactId, receiveUserId: currentUserId, content: 'Hello from other user!', timestamp: Date.now() - 200000 },
      { id: 2, postUserId: currentUserId, receiveUserId: contactId, content: 'Hi there! How are you?', timestamp: Date.now() - 100000 },
      { id: 3, postUserId: contactId, receiveUserId: currentUserId, content: 'I am good, thanks for asking.', timestamp: Date.now() - 50000 },
    ].filter(msg => (msg.postUserId === currentUserId && msg.receiveUserId === contactId) || (msg.postUserId === contactId && msg.receiveUserId === currentUserId));
    isLoadingMessages.value = false;
    resolve(mockMsgs.map(m => ({...m, id: Math.random()}))); // Ensure unique keys for demo
  }, 800));
};

const mockSendMessage = async (messageData) => {
  // Frontend API call to your backend: POST /message/send
  // { receiveUserId, content }
  console.log('Mock sending message:', messageData);
  if (props.currentUserId === messageData.receiveUserId) {
    console.warn("Cannot send message to self via mock API.");
    ElMessage.error("不能给自己发送消息");
    return Promise.reject(new Error("Cannot send message to self"));
  }
  return new Promise(resolve => setTimeout(() => {
    const sentMsg = { 
      id: Date.now(), // temp ID
      ...messageData, 
      postUserId: props.currentUserId, 
      timestamp: Date.now() 
    };
    resolve(sentMsg);
  }, 300));
};

const mockGetRecentConversations = async (userId) => {
  console.log(`Mock fetching recent conversations for user: ${userId}`);
  isLoadingConversations.value = true;
  return new Promise(resolve => setTimeout(() => {
    const convos = [
      { contact: {id: 2, username: 'User Two', avatar: ''}, lastMessage: {content: 'See you soon!', timestamp: Date.now() - 3600000 }, unreadCount: 2 },
      { contact: {id: 3, username: 'User Three', avatar: ''}, lastMessage: {content: 'Okay, sounds good.', timestamp: Date.now() - 7200000 }, unreadCount: 0 },
    ];
    // Populate avatars
    Promise.all(convos.map(async c => {
      c.contact.avatar = await mockGetUserAvatar(c.contact.id);
      return c;
    })).then(updatedConvos => {
      isLoadingConversations.value = false;
      resolve(updatedConvos);
    });
  }, 1000));
};


const handleSearchUser = async () => {
  if (!searchUserQuery.value.trim()) return;
  try {
    // const users = await searchUsers(searchUserQuery.value); // Real API
    const users = await mockSearchUsers(searchUserQuery.value);
    if (users && users.length > 0) {
      // For simplicity, directly select the first user found. 
      // A better UI would show search results for user to pick.
      const targetUser = users[0];
       if (targetUser.id === props.currentUserId) {
        ElMessage.info("不能选择自己作为聊天对象。");
        return;
      }
      selectConversation(targetUser.id, targetUser.username, targetUser.avatar);
    } else {
      ElMessage.info('未找到用户。');
    }
  } catch (error) {
    console.error("Error searching users:", error);
    ElMessage.error('搜索用户失败。');
  }
};


const scrollToBottom = () => {
  nextTick(() => {
    if (messageScrollbar.value && messageScrollbar.value.wrapRef) {
      messageScrollbar.value.setScrollTop(messageScrollbar.value.wrapRef.scrollHeight);
    }
  });
};

const fetchMessages = async (contactId) => {
  if (!props.currentUserId || !contactId) return;
  isLoadingMessages.value = true;
  try {
    // const fetchedMessages = await getAllMessagesByUserId(contactId); // Real API: needs current user implicit or explicit
    // Assuming your API means: getAllMessagesByUserId(contactUserIdThatPostedToMeOrISentTo)
    // Your backend endpoint `getAllMessagesByUserId` takes `postUserId`.
    // This implies it gets messages *sent by* that `postUserId` *to me* (current user).
    // For a full conversation, you'd need messages from me to them, and from them to me.
    // Let's simulate this by calling it twice or assuming a combined API.
    // For now, using mock which gives both sides.
    
    messages.value = await mockGetAllMessagesByUserId(props.currentUserId, contactId);
    // Mark messages as read if needed (call another API or handle locally if getUnreadCount updates)
    scrollToBottom();
  } catch (error) {
    console.error(`Error fetching messages with user ${contactId}:`, error);
    ElMessage.error('加载消息失败。');
  } finally {
    isLoadingMessages.value = false;
  }
};

const selectConversation = async (contactId, username, avatar) => {
  if (contactId === props.currentUserId) {
    ElMessage.warning("不能和自己聊天。");
    return;
  }
  selectedConversationUserId.value = contactId;

  // Fetch contact details if not already passed
  if (!username || !avatar) {
    const userDetails = await mockGetUserDetails(contactId);
    contactUsername.value = userDetails.username;
    contactAvatar.value = userDetails.avatar || defaultAvatar;
  } else {
    contactUsername.value = username;
    contactAvatar.value = avatar || defaultAvatar;
  }
  
  fetchMessages(contactId);
  
  // Update recent conversations if this user is not on top or not present
  const existingConvoIndex = recentConversations.value.findIndex(c => c.contact.id === contactId);
  if (existingConvoIndex !== -1) {
    const convo = recentConversations.value.splice(existingConvoIndex, 1)[0];
    convo.unreadCount = 0; // Mark as read when opened
    recentConversations.value.unshift(convo);
  } else {
     // This case is more for new chats started from search; existing should be in list
     const userDetails = await mockGetUserDetails(contactId); // Ensure we have details
     recentConversations.value.unshift({
         contact: { id: contactId, username: userDetails.username, avatar: userDetails.avatar || defaultAvatar },
         lastMessage: { content: '开始新的对话', timestamp: Date.now() },
         unreadCount: 0
     });
  }
};

const backToConversationList = () => {
  selectedConversationUserId.value = null;
  messages.value = []; // Clear messages
  fetchRecentConversations(); // Refresh conversation list for unread counts
};

const handleSendMessage = async () => {
  if (!newMessage.value.trim() || !selectedConversationUserId.value) return;
  
  const messageData = {
    receiveUserId: selectedConversationUserId.value,
    content: newMessage.value.trim(),
  };

  try {
    // const sentMessage = await sendMessage(messageData); // Real API
    const sentMessageByMock = await mockSendMessage(messageData); // Using mock
    
    messages.value.push({
        ...sentMessageByMock, // Mock returns the full message object including postUserId
        id: Math.random() // temp id for list key
    });
    newMessage.value = '';
    scrollToBottom();

    // Update this conversation in recentConversations list
    const convoIndex = recentConversations.value.findIndex(c => c.contact.id === selectedConversationUserId.value);
    if (convoIndex !== -1) {
      const convo = recentConversations.value[convoIndex];
      convo.lastMessage = { content: messageData.content, timestamp: Date.now() };
      // Move to top
      recentConversations.value.splice(convoIndex, 1);
      recentConversations.value.unshift(convo);
    }

  } catch (error) {
    console.error("Error sending message:", error);
    ElMessage.error('发送消息失败: ' + (error.message || ''));
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  // Simple time formatting, you might want a library like date-fns for more complex needs
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const fetchRecentConversations = async () => {
  if (!props.currentUserId) return;
  isLoadingConversations.value = true;
  try {
    // recentConversations.value = await getRecentConversationsFromServer(props.currentUserId); // Real API
    recentConversations.value = await mockGetRecentConversations(props.currentUserId);
  } catch (error) {
    console.error("Error fetching recent conversations:", error);
    ElMessage.error("加载会话列表失败。");
  } finally {
    isLoadingConversations.value = false;
  }
};


watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
  if (newValue) {
    // When modal becomes visible
    isMobile.value = window.innerWidth < 768; // Check mobile status
    if (!selectedConversationUserId.value) { // If not in a specific chat, show conversation list
      fetchRecentConversations();
    } else { // If already in a chat, make sure messages are fresh (or fetch if needed)
      fetchMessages(selectedConversationUserId.value);
    }
    // Fetch current user's avatar if not set (placeholder)
    // mockGetUserDetails(props.currentUserId).then(details => currentUserAvatar.value = details.avatar);
  }
});

watch(dialogVisible, (newValue) => {
  if (!newValue) {
    emit('update:visible', false);
  }
});

const handleClose = () => {
  emit('update:visible', false);
  // Reset chat state if needed, or keep it to reopen to same chat
  // For now, we keep selectedConversationUserId to reopen the same chat view if user was in one.
  // If you want to always go back to conversation list on close:
  // selectedConversationUserId.value = null;
};

onMounted(() => {
  if (props.visible) { // Initial load if visible
     isMobile.value = window.innerWidth < 768;
     fetchRecentConversations();
     // mockGetUserDetails(props.currentUserId).then(details => currentUserAvatar.value = details.avatar);
  }
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768; });
});

// Cleanup listener on unmount
// onUnmounted(() => {
//   window.removeEventListener('resize', ...);
// });

</script>

<style scoped>
.mail-modal .el-dialog__body {
  padding: 0; /* Remove default body padding to use full space */
}

.conversation-list-view, .chat-view {
  display: flex;
  flex-direction: column;
  height: 100%; /* Fill dialog body */
}

.user-search-input {
  margin: 15px;
  width: auto;
}

.conversation-list-scrollbar {
  padding: 0 15px;
}
.loading-conversations, .loading-messages {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.conversation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 10px 5px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}
.conversation-item:hover {
  background-color: #f5f7fa;
}
.conversation-item:last-child {
  border-bottom: none;
}

.convo-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.convo-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* For text-overflow */
}

.convo-username {
  font-weight: 500;
  color: #303133;
}

.convo-last-message {
  font-size: 0.85em;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.convo-meta {
  margin-left: 10px;
  text-align: right;
  font-size: 0.8em;
  color: #909399;
  flex-shrink: 0;
}
.convo-meta .el-badge {
  margin-top: 4px;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f8f9fa;
}
.chat-header h3 {
  margin: 0 0 0 10px;
  font-size: 1.1em;
  font-weight: 500;
}
.back-button {
  padding: 5px;
}


.message-list {
  flex-grow: 1;
  padding: 15px;
  background-color: #fff;
  overflow-y: auto;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
  max-width: 80%;
}

.message-item .el-avatar {
  margin-right: 10px;
  flex-shrink: 0;
}

.message-item.sent {
  margin-left: auto;
  flex-direction: row-reverse;
}
.message-item.sent .el-avatar {
  margin-left: 10px;
  margin-right: 0;
}

.message-content {
  padding: 8px 12px;
  border-radius: 10px;
  background-color: #f0f2f5; /* Default received */
  word-break: break-word;
}

.message-item.sent .message-content {
  background-color: #d9ecff; /* Element Plus primary light */
  color: #333;
}

.message-timestamp {
  display: block;
  font-size: 0.75em;
  color: #909399;
  margin-top: 5px;
  text-align: right;
}
.message-item.sent .message-timestamp {
  text-align: left;
}


.message-input-area {
  display: flex;
  padding: 10px 15px;
  border-top: 1px solid #e4e7ed;
  background-color: #f8f9fa;
}
.message-input-area .el-textarea {
  margin-right: 10px;
}
.send-button {
  min-width: 70px; /* Ensure button text is visible */
}

/* Fullscreen for mobile */
@media (max-width: 767px) {
  .mail-modal .el-dialog__header {
    padding-right: 40px; /* Space for close button */
  }
   .message-item {
    max-width: 90%; /* Allow slightly wider messages on mobile */
  }
}
</style> 