import { defineStore } from "pinia"
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    // 使用 ref 创建响应式状态
    const token = ref(localStorage.getItem('token') || null)

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
        setToken,
        clearToken
    }
})