<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const showDeclaration = ref(false)
const { t } = useI18n()
const { isModernUi } = useUiPreferences()

const contributors = [
	{ name: 'glowingstone124', roles: ['QAPI3', 'QPlugin', 'Web'] },
	{ name: 'MineCreeper2086', roles: ['QPlugin', 'Web'] },
	{ name: 'Adam Gu', roles: ['QAPI3', 'Web'] },
	{ name: '0x0025 (Code Verse)', roles: ['赞助'] },
	{ name: 'CHJWOS_', roles: ['赞助'] },
	{ name: 'mcjiangshi56', roles: ['赞助'] },
	{ name: 'QiuZhi__', roles: ['赞助'] },
]

const roleClass = (role) => ({
	QAPI3: 'api',
	QPlugin: 'plugin',
	Web: 'web',
	赞助: 'sponsor',
}[role])

const roleLabel = (role) => role === '赞助' ? t('sponsorsPage.sponsor') : role
</script>

<template>
	<div class="sponsors-page page-shell">
		<UiPageHeader
			:title="t('sponsorsPage.title')"
			:subtitle="t('sponsorsPage.description')"
		>
			<template #actions>
				<div class="hero-actions">
					<UiButton
						variant="filled"
						icon="favorite"
						trailing-icon="open_in_new"
						href="https://afdian.com/a/glowingstone124"
						target="_blank"
						rel="noopener noreferrer"
					>
						{{ t('sponsorsPage.support') }}
					</UiButton>
					<UiButton
						variant="tonal"
						icon="arrow_back"
						to="/"
					>
						{{ t('sponsorsPage.backHome') }}
					</UiButton>
				</div>
			</template>
		</UiPageHeader>

		<section class="credits" aria-labelledby="credits-title">
			<div class="section-heading">
				<div>
					<h2 id="credits-title">{{ t('sponsorsPage.contributors') }}</h2>
					<p>{{ t('sponsorsPage.contributorsDescription') }}</p>
				</div>
			</div>

			<a
				class="artist-row"
				href="https://space.bilibili.com/152309938"
				target="_blank"
				rel="noopener noreferrer"
			>
				<md-ripple v-if="isModernUi" />
				<img src="/images/miaokuli-avatar.jpg" :alt="t('sponsorsPage.artistAlt')">
				<span class="artist-copy">
					<strong>苗库里</strong>
					<span class="artist-projects">
						<small>{{ t('sponsorsPage.artistProject') }}</small>
						<small>Pixel Fantasia</small>
					</span>
				</span>
				<span class="visit" aria-hidden="true">
					<span>{{ t('sponsorsPage.visit') }}</span>
					<span v-if="isModernUi" class="material-symbols-rounded" aria-hidden="true">open_in_new</span>
					<span v-else aria-hidden="true">↗</span>
				</span>
			</a>

			<div class="contributor-list">
				<article v-for="(person, index) in contributors" :key="person.name" class="contributor-row" :style="{ '--row-index': index }">
					<h3>{{ person.name }}</h3>
					<div class="roles">
						<span v-for="role in person.roles" :key="role" class="role" :class="roleClass(role)">{{ roleLabel(role) }}</span>
					</div>
				</article>
			</div>
		</section>

		<section class="declaration-section">
			<button type="button" class="declaration-toggle" :aria-expanded="showDeclaration" aria-controls="contribution-declaration" @click="showDeclaration = !showDeclaration">
				<md-ripple v-if="isModernUi" />
				<span>{{ t('sponsorsPage.declaration') }}</span>
				<span v-if="isModernUi" class="material-symbols-rounded declaration-chevron" :class="{ 'is-open': showDeclaration }" aria-hidden="true">expand_more</span>
				<span v-else aria-hidden="true">{{ showDeclaration ? '−' : '+' }}</span>
			</button>
			<transition name="declaration">
				<div v-if="showDeclaration" id="contribution-declaration" class="declaration-content" data-selectable>
					<p>{{ t('sponsorsPage.declarationBody') }}</p>
				</div>
			</transition>
		</section>
	</div>
</template>

<style scoped>
.sponsors-page {
	width: min(1080px, 100%);
	height: auto;
	min-height: 100%;
	overflow-x: clip;
	margin-inline: auto;
	padding: clamp(1.25rem, 3.5vw, 2.5rem) clamp(1.25rem, 4vw, 3rem) 4rem;
	box-sizing: border-box;
	display: grid;
	gap: 2rem;
	align-content: start;
}

.hero-actions {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.75rem;
}

.credits {
	display: grid;
	gap: 1.1rem;
}

.section-heading {
	display: flex;
	align-items: end;
	justify-content: space-between;
	gap: 1rem;
}

.section-heading h2 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.35rem, 2.8vw, 1.85rem);
	font-weight: 700;
	line-height: 1.2;
}

.section-heading p {
	margin: 0.35rem 0 0;
	color: var(--text-secondary);
	max-width: 60ch;
	line-height: 1.5;
}

.artist-row {
	position: relative;
	display: grid;
	grid-template-columns: 72px minmax(0, 1fr) auto;
	align-items: center;
	gap: 1.1rem;
	padding: 1rem 1.15rem;
	border: 1px solid var(--primary);
	background: var(--background);
	color: inherit;
	text-decoration: none;
	overflow: hidden;
	transition:
		border-color var(--motion-fast) var(--ease-out),
		background-color var(--motion-fast) var(--ease-standard),
		transform var(--motion-fast) var(--ease-standard);
}

.artist-row:hover {
	border-color: var(--primary-light);
	transform: translateY(-1px);
}

.artist-row img {
	width: 72px;
	height: 72px;
	object-fit: cover;
}

.artist-copy {
	display: grid;
	gap: 0.25rem;
}

.artist-copy strong {
	font-size: 1.12rem;
	color: var(--title-color);
}

.artist-projects {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem 0.8rem;
}

.artist-projects small + small {
	padding-left: 0.8rem;
	border-left: 1px solid var(--split);
}

.artist-copy small,
.visit {
	color: var(--text-secondary);
}

.visit {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-size: 0.85rem;
	font-weight: 700;
}

.visit .material-symbols-rounded {
	font-size: 1.05rem;
}

.contributor-list {
	border-top: 1px solid var(--split);
}

.contributor-row {
	display: grid;
	grid-template-columns: minmax(12rem, 1fr) minmax(0, 1fr);
	align-items: center;
	gap: 1rem;
	min-height: 68px;
	padding: 0.9rem 0;
	border-bottom: 1px solid var(--split);
	animation: row-in var(--motion-base) var(--ease-standard) both;
	animation-delay: calc(var(--row-index) * 35ms);
}

.contributor-row h3 {
	min-width: 0;
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1rem, 2vw, 1.12rem);
	font-weight: 650;
	overflow-wrap: anywhere;
}

.roles {
	display: flex;
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: 0.45rem;
}

.role {
	padding: 0.28rem 0.72rem;
	border: 1px solid var(--split);
	color: var(--text-secondary);
	font-size: 0.78rem;
	font-weight: 700;
}

.role.api {
	border-color: color-mix(in srgb, var(--primary) 48%, var(--split));
	color: var(--primary);
}

.role.plugin {
	border-color: color-mix(in srgb, var(--success) 48%, var(--split));
	color: var(--success-text);
}

.role.sponsor {
	border-color: color-mix(in srgb, var(--warning) 55%, var(--split));
	color: color-mix(in srgb, var(--warning) 82%, var(--text-main));
}

.declaration-section {
	border-top: 1px solid var(--split);
	border-bottom: 1px solid var(--split);
}

.declaration-toggle {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	min-block-size: 48px;
	padding: 0.9rem 0;
	border: 0;
	background: transparent;
	color: var(--text-main);
	cursor: pointer;
	font-family: inherit;
	font-size: 0.96rem;
	font-weight: 700;
	text-align: left;
}

.declaration-chevron {
	font-size: 1.25rem;
	color: var(--text-secondary);
	transition: transform var(--motion-fast) var(--ease-standard);
}

.declaration-chevron.is-open {
	transform: rotate(180deg);
}

.declaration-content {
	max-width: 70ch;
	padding: 0 0 1.1rem;
	color: var(--text-secondary);
	line-height: 1.7;
}

.declaration-content p {
	margin: 0;
}

.declaration-enter-active,
.declaration-leave-active {
	transition:
		opacity var(--motion-fast) var(--ease-out),
		transform var(--motion-fast) var(--ease-standard);
}

.declaration-enter-from,
.declaration-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

@keyframes row-in {
	from {
		opacity: 0;
		transform: translateY(8px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (max-width: 720px) {
	.hero-actions {
		justify-content: flex-start;
	}

	.contributor-row {
		grid-template-columns: 1fr;
		gap: 0.55rem;
	}

	.roles {
		justify-content: flex-start;
	}
}

@media (max-width: 460px) {
	.artist-row {
		grid-template-columns: 58px minmax(0, 1fr);
	}

	.artist-row img {
		width: 58px;
		height: 58px;
	}

	.visit {
		display: none;
	}

	.artist-projects {
		display: grid;
		gap: 0.15rem;
	}

	.artist-projects small + small {
		padding-left: 0;
		border-left: 0;
	}
}

/* Material Design 3 Credits & Sponsors */
:global(:root[data-ui="modern"] .sponsors-page) {
	background: var(--md-sys-color-surface);
	color: var(--md-sys-color-on-surface);
}

:global(:root[data-ui="modern"] .sponsors-page .artist-row) {
	border-radius: var(--md-sys-shape-corner-extra-large);
	border-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
	background: var(--md-sys-color-surface-container-low);
	box-shadow: var(--md-sys-elevation-level1);
}

:global(:root[data-ui="modern"] .sponsors-page .artist-row:hover) {
	border-color: color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent);
	background: var(--md-sys-color-surface-container);
	transform: none;
}

:global(:root[data-ui="modern"] .sponsors-page .artist-row img) {
	border-radius: var(--md-sys-shape-corner-large);
}

:global(:root[data-ui="modern"] .sponsors-page .contributor-list) {
	display: grid;
	gap: 0.65rem;
	border-top: none;
}

:global(:root[data-ui="modern"] .sponsors-page .contributor-row) {
	min-height: 64px;
	padding: 0.9rem 1.2rem;
	border-bottom: none;
	border-radius: var(--md-sys-shape-corner-large);
	background: var(--md-sys-color-surface-container-low);
	border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
}

:global(:root[data-ui="modern"] .sponsors-page .role) {
	border-radius: var(--md-sys-shape-corner-full);
	background: var(--md-sys-color-surface-container);
	border-color: transparent;
}

:global(:root[data-ui="modern"] .sponsors-page .role.api) {
	background: var(--md-sys-color-primary-container);
	color: var(--md-sys-color-on-primary-container);
}

:global(:root[data-ui="modern"] .sponsors-page .role.web) {
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
}

:global(:root[data-ui="modern"] .sponsors-page .role.plugin) {
	background: var(--md-sys-color-success-container);
	color: var(--md-sys-color-on-success-container);
}

:global(:root[data-ui="modern"] .sponsors-page .role.sponsor) {
	background: var(--md-sys-color-warning-container);
	color: var(--md-sys-color-on-warning-container);
}

:global(:root[data-ui="modern"] .sponsors-page .declaration-section) {
	border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent);
	border-radius: var(--md-sys-shape-corner-large);
	background: var(--md-sys-color-surface-container-low);
	overflow: hidden;
}

:global(:root[data-ui="modern"] .sponsors-page .declaration-toggle) {
	padding: 0.95rem 1.2rem;
}

:global(:root[data-ui="modern"] .sponsors-page .declaration-content) {
	padding: 0 1.2rem 1.15rem;
}
</style>
