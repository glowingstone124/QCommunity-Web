import { ref } from 'vue'

export const ONBOARDING_SEEN_KEY = 'qhub-onboarding-seen'
export const ONBOARDING_PROMPT_KEY = 'qhub-onboarding-prompt-pending'
export const ONBOARDING_GUIDE_BUTTON_VISIBLE_KEY = 'qhub-onboarding-guide-button-visible'

const isGuideOpen = ref(false)
const isPromptOpen = ref(false)
const isGuideButtonVisible = ref(readGuideButtonVisible())

function readGuideButtonVisible() {
    return (
        typeof window === 'undefined' ||
        localStorage.getItem(ONBOARDING_GUIDE_BUTTON_VISIBLE_KEY) !== '0'
    )
}

export function hasSeenOnboarding() {
    return typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_SEEN_KEY) === '1'
}

export function hasPendingOnboardingPrompt() {
    return typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_PROMPT_KEY) === '1'
}

export function markOnboardingPromptPending() {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ONBOARDING_PROMPT_KEY, '1')
    }
}

export function setGuideButtonVisible(visible) {
    isGuideButtonVisible.value = Boolean(visible)

    if (typeof window !== 'undefined') {
        localStorage.setItem(
            ONBOARDING_GUIDE_BUTTON_VISIBLE_KEY,
            isGuideButtonVisible.value ? '1' : '0'
        )
    }
}

function openGuide() {
    isGuideOpen.value = true
}

function openPrompt() {
    isPromptOpen.value = true
}

function closeGuide() {
    isGuideOpen.value = false
    if (typeof window !== 'undefined') {
        localStorage.setItem(ONBOARDING_SEEN_KEY, '1')
    }
}

function dismissPrompt() {
    isPromptOpen.value = false
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ONBOARDING_PROMPT_KEY)
    }
}

function startGuideFromPrompt() {
    dismissPrompt()
    openGuide()
}

export function useOnboardingGuide() {
    return {
        isGuideOpen,
        isPromptOpen,
        isGuideButtonVisible,
        openGuide,
        openPrompt,
        closeGuide,
        dismissPrompt,
        startGuideFromPrompt,
        setGuideButtonVisible,
    }
}
