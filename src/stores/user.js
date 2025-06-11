import { defineStore } from "pinia"
import { ref, computed } from 'vue'
import { jwtDecode } from 'jwt-decode';

export const useUserStore = defineStore('user', () => {
    // 使用 ref 创建响应式状态
    const token = ref(localStorage.getItem('token') || null)
    console.log('Initial token from localStorage:', token.value);
    // 使用计算属性动态解析 token
    const decodedToken = computed(() => {
        if (!token.value) return null;
        try {
            return jwtDecode(token.value, { header: false });
        } catch (error) {
            console.error('解析JWT失败:', error);
            return null;
        }
    });

    // // 计算属性获取用户ID
    const currentUserId = computed(() => decodedToken.value?.Id || null);

    // 计算属性获取用户邮箱
    const currentUserEmail = computed(() => decodedToken.value?.email || null);

    // 提供一个函数来获取用户ID
    function getCurrentUserId() {
        return currentUserId.value;
    }

    //获取邮箱
    function getCurrentUserEmail() {
        return currentUserEmail.value;
    }

    // 提供修改状态的方法
    function setToken(newToken) {
        token.value = newToken
        // 同步到 localStorage
        if (newToken) {
            localStorage.setItem('token', newToken)
        } else {
            localStorage.removeItem('token')
        }
    }

    function clearToken() {
        token.value = null
        localStorage.removeItem('token')
    }

    return {
        token,
        currentUserId,  // 直接暴露计算属性
        currentUserEmail,  // 直接暴露计算属性
        setToken,
        clearToken,
        getCurrentUserId,
        getCurrentUserEmail
    }
})