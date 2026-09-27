<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useOnboardingGuide } from '@/composables/useOnboardingGuide.js'

const { locale, t } = useI18n()
const router = useRouter()
const { closeGuide, dismissPrompt, isGuideOpen, isPromptOpen, startGuideFromPrompt } =
    useOnboardingGuide()
const currentStepIndex = ref(0)
const panelRef = ref(null)
const spotlightStyle = ref(null)
const panelStyle = ref({})

const steps = computed(() => {
	return [
		{ title: t('onboardingPage.welcomeTitle'), body: t('onboardingPage.welcomeBody'), target: null },
		{ title: t('onboardingPage.identityTitle'), body: t('onboardingPage.identityBody'), target: '[data-guide-target="account"]' },
		{ title: t('onboardingPage.navigationTitle'), body: t('onboardingPage.navigationBody'), target: '[data-guide-target="navigation"]' },
		{ title: t('onboardingPage.updatesTitle'), body: t('onboardingPage.updatesBody'), target: '[data-guide-target="home-news"]' },
		{ title: t('onboardingPage.readyTitle'), body: t('onboardingPage.readyBody'), target: null },
	]
})

const currentStep = computed(() => steps.value[currentStepIndex.value])
const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(() => currentStepIndex.value === steps.value.length - 1)
const progressLabel = computed(() => `${currentStepIndex.value + 1} / ${steps.value.length}`)

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

async function updateGeometry() {
    if (!isGuideOpen.value) {
        return
    }

    await nextTick()
    window.requestAnimationFrame(() => {
        const target = currentStep.value?.target
            ? document.querySelector(currentStep.value.target)
            : null

        if (!target) {
            spotlightStyle.value = null
            panelStyle.value = {
                top: '50%',
                left: '50%',
                '--panel-transform': 'translate(-50%, -50%)',
                '--panel-enter-transform': 'translate(-50%, calc(-50% + 12px))',
            }
            return
        }

        const rect = target.getBoundingClientRect()
        const spotlightPadding = 8
        const spotlightTop = Math.max(8, rect.top - spotlightPadding)
        const spotlightLeft = Math.max(8, rect.left - spotlightPadding)
        const spotlightRight = Math.min(window.innerWidth - 8, rect.right + spotlightPadding)
        const spotlightBottom = Math.min(window.innerHeight - 8, rect.bottom + spotlightPadding)

        spotlightStyle.value = {
            top: `${spotlightTop}px`,
            left: `${spotlightLeft}px`,
            width: `${Math.max(0, spotlightRight - spotlightLeft)}px`,
            height: `${Math.max(0, spotlightBottom - spotlightTop)}px`,
        }

        const panelRect = panelRef.value?.getBoundingClientRect()
        const panelWidth = panelRect?.width || Math.min(520, window.innerWidth - 40)
        const panelHeight = panelRect?.height || 340
        const gap = 18
        const left = clamp(rect.left, 16, window.innerWidth - panelWidth - 16)
        let top = rect.bottom + gap

        if (top + panelHeight > window.innerHeight - 16) {
            top = rect.top - panelHeight - gap
        }

        panelStyle.value = {
            top: `${clamp(top, 16, window.innerHeight - panelHeight - 16)}px`,
            left: `${left}px`,
            '--panel-transform': 'none',
            '--panel-enter-transform': 'translateY(12px)',
        }
    })
}

function revealCurrentTarget() {
    const target = currentStep.value?.target
        ? document.querySelector(currentStep.value.target)
        : null

    if (target) {
        target.scrollIntoView({
            behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
            block: 'center',
            inline: 'nearest',
        })
    }
}

function goToStep(index) {
    currentStepIndex.value = clamp(index, 0, steps.value.length - 1)
    nextTick(revealCurrentTarget)
}

function nextStep() {
    if (isLastStep.value) {
        closeGuide()
        return
    }

    goToStep(currentStepIndex.value + 1)
}

function previousStep() {
    if (!isFirstStep.value) {
        goToStep(currentStepIndex.value - 1)
    }
}

function goTo(path) {
    closeGuide()
    router.push(path)
}

function handleKeydown(event) {
    if (!isGuideOpen.value) {
        return
    }

    if (event.key === 'Escape') {
        event.preventDefault()
        closeGuide()
    } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextStep()
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        previousStep()
    }
}

watch([isGuideOpen, currentStepIndex, locale], async ([open], [wasOpen]) => {
    if (!open) {
        spotlightStyle.value = null
        panelStyle.value = {}
        return
    }

    if (open && !wasOpen) {
        currentStepIndex.value = 0
    }

    await nextTick()
    panelRef.value?.focus()
    updateGeometry()
})

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('resize', updateGeometry)
    window.addEventListener('scroll', updateGeometry, true)
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', updateGeometry)
    window.removeEventListener('scroll', updateGeometry, true)
})
</script>

<template>
    <Teleport to="body">
        <Transition name="onboarding-overlay">
            <div v-if="isPromptOpen" class="onboarding-prompt">
                <button
                    type="button"
                    class="onboarding-scrim"
					:aria-label="t('onboardingPage.promptClose')"
                    @click="dismissPrompt"
                ></button>

                <section
                    class="onboarding-prompt-panel"
                    role="dialog"
                    aria-modal="true"
					aria-labelledby="onboarding-prompt-title"
                >
                    <h2
						id="onboarding-prompt-title"
                    >
						{{ t('onboardingPage.promptTitle') }}
                    </h2>
                    <p>
						{{ t('onboardingPage.promptBody') }}
                    </p>
                    <div class="onboarding-prompt-actions">
                        <button
                            type="button"
                            class="onboarding-prompt-later"
                            @click="dismissPrompt"
                        >
							{{ t('onboardingPage.later') }}
                        </button>
                        <button
                            type="button"
                            class="onboarding-prompt-start"
                            @click="startGuideFromPrompt"
                        >
							{{ t('onboardingPage.start') }}
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </section>
            </div>
        </Transition>

        <Transition name="onboarding-overlay">
            <div
                v-if="isGuideOpen"
                class="onboarding-guide"
                :class="{ 'onboarding-guide--spotlight': spotlightStyle }"
            >
                <button
                    type="button"
                    class="onboarding-scrim"
					:aria-label="t('onboardingPage.close')"
                    @click="closeGuide"
                ></button>

                <div
                    v-if="spotlightStyle"
                    class="onboarding-spotlight"
                    :style="spotlightStyle"
                    aria-hidden="true"
                ></div>

                <section
                    ref="panelRef"
                    class="onboarding-panel"
                    :style="panelStyle"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="`onboarding-title-${currentStepIndex}`"
                    tabindex="-1"
                >
                    <header class="onboarding-header">
                        <span class="onboarding-progress">{{ progressLabel }}</span>
                        <button
                            type="button"
                            class="onboarding-close"
							:title="t('onboardingPage.close')"
							:aria-label="t('onboardingPage.close')"
                            @click="closeGuide"
                        >
                            <span aria-hidden="true">×</span>
                        </button>
                    </header>

                    <div class="onboarding-progress-bar" aria-hidden="true">
                        <span
                            :style="{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }"
                        ></span>
                    </div>

                    <Transition
                        name="onboarding-content"
                        mode="out-in"
                        @after-enter="updateGeometry"
                    >
                        <div :key="currentStepIndex" class="onboarding-content">
                            <h2 :id="`onboarding-title-${currentStepIndex}`">
                                {{ currentStep.title }}
                            </h2>
                            <p>{{ currentStep.body }}</p>
                        </div>
                    </Transition>

                    <div v-if="isLastStep" class="onboarding-actions-grid">
                        <button
                            type="button"
                            class="onboarding-action onboarding-action--primary"
                            @click="goTo('/register')"
                        >
							{{ t('onboardingPage.register') }}
                            <span aria-hidden="true">↗</span>
                        </button>
                        <button type="button" class="onboarding-action" @click="goTo('/query')">
							{{ t('onboardingPage.query') }}
                            <span aria-hidden="true">↗</span>
                        </button>
                        <button type="button" class="onboarding-action" @click="goTo('/guides')">
							{{ t('onboardingPage.guides') }}
                            <span aria-hidden="true">↗</span>
                        </button>
                    </div>

                    <footer class="onboarding-footer">
                        <button type="button" class="onboarding-skip" @click="closeGuide">
							{{ t('onboardingPage.skip') }}
                        </button>
                        <div class="onboarding-navigation">
                            <button
                                type="button"
                                class="onboarding-secondary"
                                :disabled="isFirstStep"
                                @click="previousStep"
                            >
                                <span aria-hidden="true">←</span>
								{{ t('onboardingPage.back') }}
                            </button>
                            <button type="button" class="onboarding-next" @click="nextStep">
								{{ t(isLastStep ? 'onboardingPage.startExploring' : 'onboardingPage.next') }}
                                <span aria-hidden="true">→</span>
                            </button>
                        </div>
                    </footer>
                </section>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped src="./OnboardingGuide.css"></style>
<style scoped src="./OnboardingGuidePanel.css"></style>
