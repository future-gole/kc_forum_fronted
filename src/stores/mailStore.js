// src/stores/mailStore.js
import { defineStore } from 'pinia';

export const useMailStore = defineStore('mail', {
  // 定义状态
  state: () => ({
    isMailModalVisible: false, // 控制站内信弹窗是否可见
    initialTargetUser: null,   // { id: number, username: string, avatar: string | null } 存储希望立即对话的目标用户信息
  }),

  // 定义 actions (同步或异步改变状态的方法)
  actions: {
    /**
     * 打开站内信弹窗，并指定一个初始对话用户。
     * @param {number} userId - 目标用户ID
     * @param {string} [username] - 目标用户名 (可选)
     * @param {string} [avatar] - 目标用户头像URL (可选)
     */
    openMailModalWithTarget(userId, username = null, avatar = null) {
      if (!userId) {
        console.error('[mailStore] openMailModalWithTarget: userId is required.');
        return;
      }
      this.initialTargetUser = { id: userId, username, avatar };
      this.isMailModalVisible = true;
    },

    /**
     * 打开站内信弹窗到默认视图 (会话列表)。
     */
    openMailModal() {
      this.initialTargetUser = null; // 清除可能存在的上一个目标用户
      this.isMailModalVisible = true;
    },

    /**
     * 关闭站内信弹窗。
     */
    closeMailModal() {
      this.isMailModalVisible = false;
      // 弹窗关闭时，可以选择是否清除 initialTargetUser。
      // 通常在 MailModal 内部处理完 initialTargetUser 后清除更合适。
      // this.initialTargetUser = null;
    },

    /**
     * 由 MailModal 调用，表示它已经处理 (或尝试处理) 了 initialTargetUser。
     */
    clearInitialTargetUser() {
      this.initialTargetUser = null;
    }
  },
});