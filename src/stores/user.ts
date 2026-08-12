import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserData {
    id?: string | number
    username?: string
    email?: string
    avatar?: string
    [key: string]: unknown
}

export const useUserStore = defineStore('user', () => {
    const token = ref<string | null>(localStorage.getItem('token'))
    const user = ref<UserData | null>(null)

    const isLoggedIn = computed(() => !!token.value)

    function setToken(newToken: string | null) {
        token.value = newToken
        if (newToken) {
            localStorage.setItem('token', newToken)
        } else {
            localStorage.removeItem('token')
        }
    }

    function setUser(userData: UserData | null) {
        user.value = userData
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData))
        } else {
            localStorage.removeItem('user')
        }
    }

    function logout() {
        setToken(null)
        setUser(null)
    }

    function init() {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try {
                user.value = JSON.parse(storedUser)
            } catch {
                localStorage.removeItem('user')
            }
        }
    }

    return { token, user, isLoggedIn, setToken, setUser, logout, init }
})
