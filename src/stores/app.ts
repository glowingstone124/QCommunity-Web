import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
    const theme = ref<string>(localStorage.getItem('theme') || 'light')
    const isLoading = ref<boolean>(false)
    const pageTitle = ref<string>('QHub')

    function setTheme(newTheme: string) {
        theme.value = newTheme
        localStorage.setItem('theme', newTheme)
        document.documentElement.dataset.theme = newTheme
    }

    function toggleTheme() {
        setTheme(theme.value === 'dark' ? 'light' : 'dark')
    }

    function setLoading(value: boolean) {
        isLoading.value = value
    }

    function setPageTitle(title: string) {
        pageTitle.value = title ? `QHub | ${title}` : 'QHub'
        document.title = pageTitle.value
    }

    function init() {
        document.documentElement.dataset.theme = theme.value
    }

    return { theme, isLoading, pageTitle, setTheme, toggleTheme, setLoading, setPageTitle, init }
})
