<script setup>
import { computed } from 'vue'
import { useOnboardingGuide } from '@/composables/useOnboardingGuide.js'
import { useUiPreferences } from '@/composables/useUiPreferences.js'
import { useI18n } from 'vue-i18n'
import TaFeatureNotice from '@/components/account/TaFeatureNotice.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import UiTabs from '@/components/ui/UiTabs.vue'

const { isGuideButtonVisible, setGuideButtonVisible } = useOnboardingGuide()
const {
    isModernUi,
    osPrefersDark,
    setThemePreference,
    setUiMode,
    themePreference,
} = useUiPreferences()
const props = defineProps({
    isTaAccount: { type: Boolean, default: false },
    requiredPlaytime: { type: Number, default: 180 },
    kotshiQueryEnabled: { type: Boolean, default: true },
    kotshiQuerySettingLoaded: { type: Boolean, default: false },
    kotshiQuerySettingSaving: { type: Boolean, default: false },
    kotshiQuerySettingFeedback: { type: String, default: '' },
    kotshiQuerySettingFeedbackType: { type: String, default: '' },
    qbotActiveResponseEnabled: { type: Boolean, default: true },
    qbotActiveResponseSettingLoaded: { type: Boolean, default: false },
    qbotActiveResponseSettingSaving: { type: Boolean, default: false },
})
const emit = defineEmits(['update:kotshiQueryEnabled', 'update:qbotActiveResponseEnabled', 'goOverview'])
const { t } = useI18n()

const systemThemeLabel = computed(() =>
    t('preferencesPage.themeSystem', {
        current: t(osPrefersDark.value ? 'preferencesPage.dark' : 'preferencesPage.light'),
    }),
)

const themeOptions = computed(() => [
    { key: 'system', label: systemThemeLabel.value, icon: 'contrast' },
    { key: 'light', label: t('preferencesPage.light'), icon: 'light_mode' },
    { key: 'dark', label: t('preferencesPage.dark'), icon: 'dark_mode' },
])

function setTheme(nextTheme) {
    if (nextTheme !== 'system' && nextTheme !== 'light' && nextTheme !== 'dark') return
    setThemePreference(nextTheme, { animate: true })
}

function toggleUiExperience(checked) {
    setUiMode(checked ? 'modern' : 'classic', { animate: true })
}
</script>

<template>
	<section class="panel preferences-panel">
		<header class="panel-header">
			<div>
				<h2 class="panel-title">{{ t('preferencesPage.title') }}</h2>
			</div>
		</header>

		<p
			v-if="props.kotshiQuerySettingFeedback"
			class="feedback"
			:class="props.kotshiQuerySettingFeedbackType"
			role="status"
		>
			{{ props.kotshiQuerySettingFeedback }}
		</p>

		<div class="preference-groups">
			<section class="preference-group">
				<header class="preference-group-header">
					<h3>{{ t('preferencesPage.appearanceGroup') }}</h3>
				</header>
				<div class="preference-list">
					<section class="preference-row preference-row--featured">
						<div class="preference-copy">
							<div class="preference-title-line">
								<h3>{{ t('preferencesPage.uiExperience') }}</h3>
								<span class="ui-experience-badge" :class="{ 'is-modern': isModernUi }">
									{{ isModernUi ? t('preferencesPage.uiModern') : t('preferencesPage.uiClassic') }}
								</span>
							</div>
							<p>{{ t('preferencesPage.uiExperienceDescription') }}</p>
						</div>
						<UiSwitch
							:model-value="isModernUi"
							:status-text="isModernUi ? t('preferencesPage.uiModern') : t('preferencesPage.uiClassic')"
							:aria-label="t('preferencesPage.uiExperience')"
							@update:model-value="toggleUiExperience"
						/>
					</section>

					<section class="preference-row">
						<div class="preference-copy">
							<h3>{{ t('preferencesPage.defaultTheme') }}</h3>
							<p>{{ t('preferencesPage.themeDescription') }}</p>
						</div>
						<UiTabs
							:model-value="themePreference"
							:items="themeOptions"
							variant="segmented"
							:aria-label="t('preferencesPage.defaultTheme')"
							class="theme-segmented-tabs"
							@update:model-value="setTheme"
						/>
					</section>
				</div>
			</section>

			<section class="preference-group">
				<header class="preference-group-header">
					<h3>{{ t('preferencesPage.guidanceGroup') }}</h3>
				</header>
				<div class="preference-list">
					<section class="preference-row">
						<div class="preference-copy">
							<h3>{{ t('preferencesPage.guideButton') }}</h3>
							<p>{{ t('preferencesPage.guideButtonDescription') }}</p>
						</div>
						<UiSwitch
							:model-value="isGuideButtonVisible"
							:status-text="t('preferencesPage.showButton')"
							:aria-label="t('preferencesPage.guideButton')"
							@update:model-value="setGuideButtonVisible"
						/>
					</section>
				</div>
			</section>

			<section class="preference-group">
				<header class="preference-group-header">
					<h3>{{ t('preferencesPage.privacyGroup') }}</h3>
				</header>
				<div v-if="props.isTaAccount" class="preference-ta-gate">
					<TaFeatureNotice
						:title="t('taAccount.featureGateTitle')"
						:message="t('taAccount.featureGateKotshi', { required: props.requiredPlaytime })"
						:action-label="t('taAccount.goOverview')"
						@action="emit('goOverview')"
					/>
				</div>
				<div v-else class="preference-list">
					<section class="preference-row">
						<div class="preference-copy">
							<h3>{{ t('preferencesPage.kotshiQuery') }}</h3>
							<p>{{ t('preferencesPage.kotshiQueryDescription') }}</p>
						</div>
						<UiSwitch
							:model-value="props.kotshiQueryEnabled"
							:status-text="props.kotshiQuerySettingSaving ? t('preferencesPage.saving') : (props.kotshiQueryEnabled ? t('preferencesPage.enabled') : t('preferencesPage.disabled'))"
							:disabled="!props.kotshiQuerySettingLoaded || props.kotshiQuerySettingSaving"
							:aria-label="t('preferencesPage.kotshiQuery')"
							@update:model-value="emit('update:kotshiQueryEnabled', $event)"
						/>
					</section>
					<section class="preference-row">
						<div class="preference-copy">
							<h3>{{ t('preferencesPage.qbotActiveResponse') }}</h3>
							<p>{{ t('preferencesPage.qbotActiveResponseDescription') }}</p>
						</div>
						<UiSwitch
							:model-value="props.qbotActiveResponseEnabled"
							:status-text="props.qbotActiveResponseSettingSaving ? t('preferencesPage.saving') : (props.qbotActiveResponseEnabled ? t('preferencesPage.enabled') : t('preferencesPage.disabled'))"
							:disabled="!props.qbotActiveResponseSettingLoaded || props.qbotActiveResponseSettingSaving"
							:aria-label="t('preferencesPage.qbotActiveResponse')"
							@update:model-value="emit('update:qbotActiveResponseEnabled', $event)"
						/>
					</section>
				</div>
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
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-soft);
}

.panel-title {
    margin: 0;
    color: var(--title-color);
    font-size: 1.7rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.2;
}

.panel-sub {
    margin: 0.25rem 0 0;
    color: var(--text-secondary);
}

.feedback {
    margin: 1rem 0 0;
    padding: 0.7rem 0.75rem;
    border-left: 3px solid var(--error);
    background: color-mix(in srgb, var(--error) 7%, transparent);
    color: var(--error-text);
}

.feedback.success {
    border-color: var(--success);
    background: color-mix(in srgb, var(--success) 7%, transparent);
    color: var(--success-text);
}

.preference-list {
    display: grid;
    margin-top: 0.85rem;
    border-top: 1px solid var(--border-soft);
}

.preference-groups {
    display: grid;
    gap: 1.75rem;
    margin-top: 1.5rem;
}

.preference-group-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
}

.preference-group-header h3 {
    margin: 0;
    color: var(--text-main);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.35;
}

.preference-group-header p {
    margin: 0.3rem 0 0;
    color: var(--text-secondary);
    font-size: 0.86rem;
    line-height: 1.45;
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
    font-size: 1.04rem;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1.3;
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

.theme-segmented--three {
    grid-template-columns: auto repeat(2, minmax(72px, 1fr));
}

.preference-title-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.ui-experience-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.16rem 0.55rem;
    border: 1px solid var(--split);
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-secondary);
    background: var(--background-secondary);
}

.ui-experience-badge.is-modern {
    border-color: color-mix(in srgb, var(--primary) 42%, transparent);
    background: color-mix(in srgb, var(--primary) 12%, var(--background));
    color: var(--primary);
}

.preference-hint {
    margin-top: 0.35rem;
    color: var(--primary) !important;
    font-size: 0.82rem !important;
    font-weight: 600;
}

.theme-option {
    min-height: 38px;
    padding: 0.55rem 0.85rem;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
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
}

.theme-option:focus-visible {
    outline: 2px solid var(--focus-ring, var(--primary));
    outline-offset: 2px;
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

.preference-ta-gate {
    margin-top: 0.85rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--border-soft);
}

@media (max-width: 640px) {
    .panel {
        padding: 1rem;
    }

    .preference-group-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
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

    .theme-segmented--three {
        grid-template-columns: 1fr;
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

/* Material Design 3 Settings List & Segmented Controls */
:global(:root[data-ui="modern"] .account .preferences-panel) {
    background: transparent;
    padding: 1.5rem 1.75rem 2rem;
}

:global(:root[data-ui="modern"] .account .preferences-panel .panel-header) {
    border-bottom-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
    padding-bottom: 1.25rem;
}

:global(:root[data-ui="modern"] .account .preferences-panel .feedback) {
    border-left: 0;
    border-radius: var(--md-sys-shape-corner-large);
    background: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
    padding: 0.9rem 1.1rem;
    font-weight: 600;
}

:global(:root[data-ui="modern"] .account .preferences-panel .feedback.success) {
    background: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
}

:global(:root[data-ui="modern"] .account .preferences-panel .preference-list) {
    border-top: 0;
    gap: 0.85rem;
    margin-top: 1.25rem;
}

:global(:root[data-ui="modern"] .account .preferences-panel .preference-group) {
    background: var(--md-sys-color-surface-container);
    border-radius: var(--md-sys-shape-corner-large);
    padding: 1.2rem 1.25rem 0.65rem;
}

:global(:root[data-ui="modern"] .account .preferences-panel .preference-list > .preference-row) {
    border-bottom: 0;
    border-radius: var(--md-sys-shape-corner-large);
    background: var(--md-sys-color-surface-container);
    padding: 1.2rem 1.35rem;
}

:global(:root[data-ui="modern"] .account .preferences-panel .preference-list > .preference-row--featured) {
    background: var(--md-sys-color-primary-container);
}

:global(:root[data-ui="modern"] .account .preferences-panel .preference-list > .preference-row--featured .preference-copy h3),
:global(:root[data-ui="modern"] .account .preferences-panel .preference-list > .preference-row--featured .preference-copy p) {
    color: var(--md-sys-color-on-primary-container);
}

:global(:root[data-ui="modern"] .account .preferences-panel .preference-group .preference-row:last-child) {
    border-bottom: 0;
}

:global(:root[data-ui="modern"] .account .preferences-panel .ui-experience-badge) {
    border: 0;
    padding: 0.2rem 0.7rem;
    background: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
}

:global(:root[data-ui="modern"] .account .preferences-panel .ui-experience-badge.is-modern) {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
}
</style>
