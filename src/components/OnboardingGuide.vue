<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useOnboardingGuide } from '@/composables/useOnboardingGuide.js'

const { locale } = useI18n()
const router = useRouter()
const { closeGuide, dismissPrompt, isGuideOpen, isPromptOpen, startGuideFromPrompt } =
    useOnboardingGuide()
const currentStepIndex = ref(0)
const panelRef = ref(null)
const spotlightStyle = ref(null)
const panelStyle = ref({})

const steps = computed(() => {
    if (locale.value === 'zh') {
        return [
            {
                title: '欢迎来到 QHub',
                body: '这里集中放置 Quantum Original 的账号、服务器状态和社区工具。用一分钟了解入口，马上开始使用。',
                target: null,
            },
            {
                title: '先绑定你的身份',
                body: '还没有账户就注册，已有账户直接登录。注册需要填写 Minecraft 用户名、QQ 号和至少 8 位密码，并完成当前开放的验证方式。',
                target: '[data-guide-target="account"]',
            },
            {
                title: '从顶部导航进入功能',
                body: '社区里可以查询玩家、查看聊天记录；服务器里可以看实时状态、榜单和交通路线；内容里有公告与 Wiki 指南。',
                target: '[data-guide-target="navigation"]',
            },
            {
                title: '首页查看最新动态',
                body: '首页下方会展示活动和公告。点击文章卡片即可阅读详情，服务器规则、连接方式和常用指令也都收录在 Wiki 指南中。',
                target: '[data-guide-target="home-news"]',
            },
            {
                title: '准备好了，开始探索',
                body: '建议先完成注册，再从玩家查询或服务器指南开始。你之后也可以点击顶部的 ? 随时重新打开这份指引。',
                target: null,
            },
        ]
    }

    return [
        {
            title: 'Welcome to QHub',
            body: 'Quantum Original accounts, server status, and community tools live here. Take a minute to learn the entry points and get started.',
            target: null,
        },
        {
            title: 'Set up your identity',
            body: 'Register if you are new, or sign in if you already have an account. Registration uses your Minecraft username, QQ number, an 8-character password, and an available verification method.',
            target: '[data-guide-target="account"]',
        },
        {
            title: 'Use the top navigation',
            body: 'Community includes player lookup and chat history. Server includes live status, leaderboards, and route planning. Content contains news and Wiki guides.',
            target: '[data-guide-target="navigation"]',
        },
        {
            title: 'Catch the latest updates',
            body: 'The home page collects current events and announcements. Open a story to read more, or use the Wiki for server rules, connection details, and commands.',
            target: '[data-guide-target="home-news"]',
        },
        {
            title: 'You are ready to explore',
            body: 'Register first, then start with player lookup or the server guides. Click the ? button in the header any time you want to replay this tour.',
            target: null,
        },
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
                    :aria-label="locale === 'zh' ? '关闭新手指引提示' : 'Close quick start prompt'"
                    @click="dismissPrompt"
                ></button>

                <section
                    class="onboarding-prompt-panel"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="
                        locale === 'zh'
                            ? 'onboarding-prompt-title-zh'
                            : 'onboarding-prompt-title-en'
                    "
                >
                    <h2
                        :id="
                            locale === 'zh'
                                ? 'onboarding-prompt-title-zh'
                                : 'onboarding-prompt-title-en'
                        "
                    >
                        {{
                            locale === 'zh'
                                ? '要开始 QHub 新手指引吗？'
                                : 'Start the QHub quick start?'
                        }}
                    </h2>
                    <p>
                        {{
                            locale === 'zh'
                                ? '账号已经注册完成。用几步了解导航、社区工具和服务器信息入口。也可以在账户中心的设置中隐藏顶栏新手指引按钮。'
                                : 'Your account is ready. Take a short tour of navigation, community tools, and server information. You can hide the header guide button in Account Center settings.'
                        }}
                    </p>
                    <div class="onboarding-prompt-actions">
                        <button
                            type="button"
                            class="onboarding-prompt-later"
                            @click="dismissPrompt"
                        >
                            {{ locale === 'zh' ? '稍后再说' : 'Maybe later' }}
                        </button>
                        <button
                            type="button"
                            class="onboarding-prompt-start"
                            @click="startGuideFromPrompt"
                        >
                            {{ locale === 'zh' ? '开始指引' : 'Start tour' }}
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
                    :aria-label="locale === 'zh' ? '关闭新手指引' : 'Close quick start guide'"
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
                            :title="locale === 'zh' ? '关闭指引' : 'Close guide'"
                            :aria-label="locale === 'zh' ? '关闭指引' : 'Close guide'"
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
                            {{ locale === 'zh' ? '去注册' : 'Register' }}
                            <span aria-hidden="true">↗</span>
                        </button>
                        <button type="button" class="onboarding-action" @click="goTo('/query')">
                            {{ locale === 'zh' ? '玩家查询' : 'Player lookup' }}
                            <span aria-hidden="true">↗</span>
                        </button>
                        <button type="button" class="onboarding-action" @click="goTo('/guides')">
                            {{ locale === 'zh' ? '查看指南' : 'Open guides' }}
                            <span aria-hidden="true">↗</span>
                        </button>
                    </div>

                    <footer class="onboarding-footer">
                        <button type="button" class="onboarding-skip" @click="closeGuide">
                            {{ locale === 'zh' ? '跳过' : 'Skip' }}
                        </button>
                        <div class="onboarding-navigation">
                            <button
                                type="button"
                                class="onboarding-secondary"
                                :disabled="isFirstStep"
                                @click="previousStep"
                            >
                                <span aria-hidden="true">←</span>
                                {{ locale === 'zh' ? '上一步' : 'Back' }}
                            </button>
                            <button type="button" class="onboarding-next" @click="nextStep">
                                {{
                                    isLastStep
                                        ? locale === 'zh'
                                            ? '开始使用'
                                            : 'Start exploring'
                                        : locale === 'zh'
                                          ? '下一步'
                                          : 'Next'
                                }}
                                <span aria-hidden="true">→</span>
                            </button>
                        </div>
                    </footer>
                </section>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.onboarding-prompt {
    position: fixed;
    inset: 0;
    z-index: 2000;
    font-family: 'Inter', system-ui, sans-serif;
}

.onboarding-prompt-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 2;
    width: min(440px, calc(100vw - 32px));
    box-sizing: border-box;
    padding: clamp(1.35rem, 4vw, 2rem);
    border: 1px solid color-mix(in srgb, var(--primary-light) 48%, var(--split));
    border-radius: 10px;
    background: var(--background);
    color: var(--text-main);
    box-shadow: 0 24px 70px rgb(0 0 0 / 30%);
    transform: translate(-50%, -50%);
}

.onboarding-prompt-panel h2 {
    margin: 0;
    color: var(--title-color);
    font-size: clamp(1.45rem, 4vw, 2rem);
    font-weight: 680;
    line-height: 1.15;
}

.onboarding-prompt-panel p {
    margin: 0.8rem 0 0;
    color: var(--text-secondary);
    font-size: 0.96rem;
    line-height: 1.65;
}

.onboarding-prompt-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    margin-top: 1.5rem;
}

.onboarding-prompt-later,
.onboarding-prompt-start {
    min-height: 42px;
    padding: 0.7rem 0.95rem;
    border: 1px solid var(--split);
    background: transparent;
    color: var(--text-main);
    font-weight: 700;
    cursor: pointer;
    transition:
        border-color 160ms ease,
        background-color 160ms ease,
        color 160ms ease,
        transform 120ms var(--ease-out);
}

.onboarding-prompt-later:hover,
.onboarding-prompt-later:focus-visible {
    border-color: var(--primary-light);
    background: var(--button-secondary-hover);
    outline: none;
}

.onboarding-prompt-start {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border-color: var(--primary);
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
}

.onboarding-prompt-start:hover,
.onboarding-prompt-start:focus-visible {
    border-color: var(--primary-light);
    background: var(--button-primary-hover);
    outline: none;
}

.onboarding-prompt-later:active,
.onboarding-prompt-start:active {
    transform: scale(0.97);
}

.onboarding-guide {
    position: fixed;
    inset: 0;
    z-index: 2000;
    font-family: 'Inter', system-ui, sans-serif;
    isolation: isolate;
}

.onboarding-overlay-enter-active,
.onboarding-overlay-leave-active {
    transition: opacity 220ms var(--ease-out);
}

.onboarding-overlay-enter-from,
.onboarding-overlay-leave-to {
    opacity: 0;
}

.onboarding-overlay-enter-active .onboarding-prompt-panel,
.onboarding-overlay-leave-active .onboarding-prompt-panel,
.onboarding-overlay-enter-active .onboarding-panel,
.onboarding-overlay-leave-active .onboarding-panel {
    transition:
        opacity 220ms var(--ease-out),
        filter 220ms var(--ease-out),
        transform 220ms var(--ease-out);
}

.onboarding-overlay-enter-from .onboarding-prompt-panel,
.onboarding-overlay-leave-to .onboarding-prompt-panel {
    opacity: 0;
    filter: blur(2px);
    transform: translate(-50%, calc(-50% + 12px));
}

.onboarding-overlay-enter-from .onboarding-panel,
.onboarding-overlay-leave-to .onboarding-panel {
    opacity: 0;
    filter: blur(2px);
    transform: var(--panel-enter-transform, translate(-50%, calc(-50% + 12px)));
}

.onboarding-scrim {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: default;
}

.onboarding-prompt .onboarding-scrim {
    background: rgb(3 8 15 / 66%);
}

.onboarding-guide .onboarding-scrim {
    background: rgb(3 8 15 / 36%);
}

.onboarding-guide--spotlight .onboarding-scrim {
    background: transparent;
}

.onboarding-spotlight {
    position: fixed;
    z-index: 1;
    border: 2px solid var(--primary-light);
    border-radius: 10px;
    box-shadow:
        0 0 0 9999px rgb(3 8 15 / 66%),
        0 0 0 5px color-mix(in srgb, var(--primary-light) 18%, transparent);
    pointer-events: none;
    transition:
        top 180ms var(--ease-out),
        left 180ms var(--ease-out),
        width 180ms var(--ease-out),
        height 180ms var(--ease-out);
}

.onboarding-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 2;
    width: min(520px, calc(100vw - 40px));
    box-sizing: border-box;
    padding: 1.65rem;
    border: 1px solid color-mix(in srgb, var(--primary-light) 48%, var(--split));
    border-radius: 10px;
    background: color-mix(in srgb, var(--background) 92%, var(--primary) 8%);
    color: var(--text-main);
    box-shadow:
        0 24px 70px rgb(0 0 0 / 36%),
        0 0 0 1px color-mix(in srgb, var(--primary-light) 16%, transparent),
        inset 0 1px 0 color-mix(in srgb, var(--primary-light) 22%, transparent);
    transform: var(--panel-transform, translate(-50%, -50%));
    transition:
        top 260ms var(--ease-out),
        left 260ms var(--ease-out),
        opacity 220ms var(--ease-out),
        filter 220ms var(--ease-out),
        transform 260ms var(--ease-out);
    will-change: top, left, transform, opacity;
    outline: none;
}

.onboarding-panel:focus {
    outline: 2px solid color-mix(in srgb, var(--primary-light) 55%, transparent);
    outline-offset: 3px;
}

.onboarding-header,
.onboarding-footer,
.onboarding-navigation {
    display: flex;
    align-items: center;
}

.onboarding-header {
    gap: 0.65rem;
}

.onboarding-progress {
    margin-left: auto;
    color: var(--text-secondary);
    font:
        700 0.72rem/1 'Space Mono',
        monospace;
}

.onboarding-close {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    margin-left: 0.15rem;
    border: 1px solid var(--split);
    border-radius: 50%;
    background: transparent;
    color: var(--text-secondary);
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    transition:
        border-color 160ms ease,
        background-color 160ms ease,
        color 160ms ease,
        transform 120ms var(--ease-out);
}

.onboarding-close:hover,
.onboarding-close:focus-visible {
    border-color: var(--primary-light);
    color: var(--text-main);
    outline: none;
}

.onboarding-close:active {
    transform: scale(0.97);
}

.onboarding-progress-bar {
    height: 3px;
    margin: 1rem 0 1.2rem;
    background: color-mix(in srgb, var(--text-main) 12%, transparent);
    overflow: hidden;
}

.onboarding-progress-bar span {
    display: block;
    height: 100%;
    background: var(--primary-light);
    transition: width 220ms var(--ease-out);
}

.onboarding-content {
    display: grid;
    gap: 0.7rem;
}

.onboarding-content-enter-active,
.onboarding-content-leave-active {
    transition:
        opacity 160ms var(--ease-out),
        transform 160ms var(--ease-out);
}

.onboarding-content-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.onboarding-content-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}

.onboarding-content h2 {
    margin: 0;
    color: var(--title-color);
    font-size: 1.7rem;
    font-weight: 680;
    line-height: 1.15;
}

.onboarding-content p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 1rem;
    line-height: 1.65;
}

.onboarding-actions-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 1.2rem;
}

.onboarding-action,
.onboarding-secondary,
.onboarding-next {
    min-height: 42px;
    border: 1px solid var(--split);
    background: transparent;
    color: var(--text-main);
    font-weight: 700;
    cursor: pointer;
    transition:
        border-color 160ms ease,
        background-color 160ms ease,
        color 160ms ease,
        transform 120ms var(--ease-out);
}

.onboarding-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
    padding: 0.55rem 0.65rem;
    font-size: 0.78rem;
    text-align: left;
}

.onboarding-action--primary,
.onboarding-next {
    border-color: var(--primary);
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
}

.onboarding-action:hover,
.onboarding-action:focus-visible,
.onboarding-secondary:hover:not(:disabled),
.onboarding-secondary:focus-visible,
.onboarding-next:hover,
.onboarding-next:focus-visible {
    border-color: var(--primary-light);
    background: var(--button-secondary-hover);
    color: var(--text-main);
    outline: none;
}

.onboarding-action--primary:hover,
.onboarding-action--primary:focus-visible,
.onboarding-next:hover,
.onboarding-next:focus-visible {
    background: var(--button-primary-hover);
    color: var(--button-primary-text);
}

.onboarding-action:active,
.onboarding-secondary:active:not(:disabled),
.onboarding-next:active {
    transform: scale(0.97);
}

.onboarding-footer {
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 1.35rem;
}

.onboarding-skip,
.onboarding-secondary {
    padding: 0.7rem 0.8rem;
    font-size: 0.84rem;
}

.onboarding-skip {
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition:
        color 160ms ease,
        transform 120ms var(--ease-out);
}

.onboarding-skip:hover,
.onboarding-skip:focus-visible {
    color: var(--text-main);
    outline: none;
}

.onboarding-skip:active {
    transform: scale(0.97);
}

.onboarding-navigation {
    gap: 0.5rem;
}

.onboarding-secondary,
.onboarding-next {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
}

.onboarding-secondary:disabled {
    cursor: not-allowed;
    opacity: 0.45;
}

.onboarding-next {
    padding: 0.7rem 0.95rem;
}

@media (max-width: 560px) {
    .onboarding-prompt-actions {
        flex-direction: column-reverse;
    }

    .onboarding-prompt-later,
    .onboarding-prompt-start {
        width: 100%;
    }

    .onboarding-panel {
        padding: 1rem;
    }

    .onboarding-content h2 {
        font-size: 1.45rem;
    }

    .onboarding-actions-grid {
        grid-template-columns: 1fr;
    }

    .onboarding-action {
        min-height: 38px;
    }

    .onboarding-footer {
        align-items: stretch;
    }

    .onboarding-navigation {
        flex: 1;
        justify-content: flex-end;
    }
}

@media (prefers-reduced-motion: reduce) {
    .onboarding-overlay-enter-active,
    .onboarding-overlay-leave-active,
    .onboarding-overlay-enter-active .onboarding-prompt-panel,
    .onboarding-overlay-leave-active .onboarding-prompt-panel,
    .onboarding-overlay-enter-active .onboarding-panel,
    .onboarding-overlay-leave-active .onboarding-panel,
    .onboarding-content-enter-active,
    .onboarding-content-leave-active,
    .onboarding-prompt-panel,
    .onboarding-panel,
    .onboarding-spotlight,
    .onboarding-progress-bar span {
        transition: none;
    }
}
</style>
