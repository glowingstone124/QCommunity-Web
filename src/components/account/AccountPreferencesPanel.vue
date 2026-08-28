<script setup>
import { useOnboardingGuide } from '@/composables/useOnboardingGuide.js'
import { useThemePreference } from '@/composables/useHeaderProfile.js'

const { isGuideButtonVisible, setGuideButtonVisible } = useOnboardingGuide()
const theme = useThemePreference()

function setTheme(nextTheme) {
    if (nextTheme !== 'light' && nextTheme !== 'dark') return

    theme.value = nextTheme
    document.documentElement.dataset.theme = nextTheme
    localStorage.setItem('theme', nextTheme)
}
</script>

<template>
    <section class="panel preferences-panel">
        <header class="panel-header">
            <div>
                <h2 class="panel-title">设置</h2>
            </div>
        </header>

        <div class="preference-list">
            <section class="preference-row">
                <div class="preference-copy">
                    <h3>默认配色</h3>
                    <p>选择 QHub 的默认显示配色。</p>
                </div>
                <div class="theme-segmented" role="group" aria-label="默认配色">
                    <button
                        type="button"
                        class="theme-option"
                        :class="{ 'is-active': theme === 'light' }"
                        :aria-pressed="theme === 'light'"
                        @click="setTheme('light')"
                    >
                        浅色
                    </button>
                    <button
                        type="button"
                        class="theme-option"
                        :class="{ 'is-active': theme === 'dark' }"
                        :aria-pressed="theme === 'dark'"
                        @click="setTheme('dark')"
                    >
                        深色
                    </button>
                </div>
            </section>

            <section class="preference-row">
                <div class="preference-copy">
                    <h3>顶栏新手指引按钮</h3>
                    <p>控制顶栏是否显示新手指引按钮。</p>
                </div>
                <label class="preference-toggle">
                    <span>显示按钮</span>
                    <input
                        type="checkbox"
                        :checked="isGuideButtonVisible"
                        @change="setGuideButtonVisible($event.target.checked)"
                    />
                </label>
            </section>
        </div>
    </section>
</template>

<style scoped>
.panel {
    min-height: 100%;
    padding: 1.4rem;
    background: var(--glass-strong);
    box-sizing: border-box;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.panel-title {
    margin: 0;
    color: var(--title-color);
    font-size: 1.45rem;
    line-height: 1.2;
}

.panel-sub {
    margin: 0.25rem 0 0;
    color: var(--text-secondary);
}

.preference-list {
    display: grid;
    margin-top: 1.5rem;
    border-top: 1px solid var(--border-soft);
}

.preference-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.35rem 0;
    border-bottom: 1px solid var(--border-soft);
}

.preference-copy {
    min-width: 0;
}

.preference-copy h3 {
    margin: 0;
    color: var(--text-main);
    font-size: 1rem;
    font-weight: 700;
}

.preference-copy p {
    margin: 0.35rem 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
}

.theme-segmented {
    display: grid;
    grid-template-columns: repeat(2, minmax(84px, 1fr));
    flex: 0 0 auto;
    gap: 3px;
    padding: 3px;
    border: 1px solid var(--split);
    background: var(--background-secondary);
}

.theme-option {
    min-height: 38px;
    padding: 0.55rem 0.85rem;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    font-weight: 700;
    cursor: pointer;
    transition:
        background-color 160ms var(--ease-out),
        border-color 160ms var(--ease-out),
        color 160ms var(--ease-out),
        transform 120ms var(--ease-out);
}

.theme-option:hover,
.theme-option:focus-visible {
    border-color: var(--primary-light);
    color: var(--text-main);
    outline: none;
}

.theme-option.is-active {
    border-color: var(--text-main);
    background: var(--text-main);
    color: var(--background);
}

.theme-option:active,
.preference-toggle input:active {
    transform: scale(0.97);
}

.preference-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    flex: 0 0 auto;
    color: var(--text-main);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
}

.preference-toggle input {
    width: 1.1rem;
    height: 1.1rem;
    margin: 0;
    accent-color: var(--primary);
    cursor: pointer;
}

@media (max-width: 640px) {
    .panel {
        padding: 1rem;
    }

    .preference-row {
        align-items: flex-start;
        flex-direction: column;
        gap: 0.85rem;
    }

    .theme-segmented,
    .preference-toggle {
        align-self: stretch;
    }

    .theme-segmented {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .preference-toggle {
        justify-content: space-between;
    }
}

@media (prefers-reduced-motion: reduce) {
    .theme-option,
    .preference-toggle input {
        transition: none;
    }
}
</style>
