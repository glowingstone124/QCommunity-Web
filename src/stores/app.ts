import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
    initUiPreferences,
    resolvedTheme,
    setThemePreference,
    setUiMode,
    themePreference,
    toggleResolvedTheme,
    toggleUiMode,
    uiMode,
} from '@/composables/useUiPreferences.js'

export const useAppStore = defineStore('app', () => {
    const isLoading = ref<boolean>(false)
    const pageTitle = ref<string>('QHub')

    function setTheme(newTheme: string) {
        setThemePreference(newTheme)
    }

    function toggleTheme() {
        toggleResolvedTheme()
    }

    function setLoading(value: boolean) {
        isLoading.value = value
    }

    function setPageTitle(title: string) {
        pageTitle.value = title ? `QHub | ${title}` : 'QHub'
        document.title = pageTitle.value
    }

    function init() {
        initUiPreferences()
    }

    return {
        theme: resolvedTheme,
        themePreference,
        uiMode,
        isLoading,
        pageTitle,
        setTheme,
        toggleTheme,
        setUiMode,
        toggleUiMode,
        setLoading,
        setPageTitle,
        init,
    }
})
