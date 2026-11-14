<script setup>
defineProps({
	title: {
		type: String,
		required: true,
	},
	subtitle: {
		type: String,
		default: '',
	},
	badge: {
		type: String,
		default: '',
	},
	divider: {
		type: Boolean,
		default: true,
	},
})
</script>

<template>
	<header class="ui-page-header" :class="{ 'ui-page-header--divider': divider }">
		<div class="ui-page-header__row">
			<div class="ui-page-header__copy">
				<div class="ui-page-header__title-line">
					<h1 class="ui-page-header__title">{{ title }}</h1>
					<slot name="badge">
						<span v-if="badge" class="ui-page-header__badge">{{ badge }}</span>
					</slot>
				</div>
				<p v-if="subtitle" class="ui-page-header__subtitle">{{ subtitle }}</p>
			</div>

			<div v-if="$slots.actions" class="ui-page-header__actions">
				<slot name="actions" />
			</div>
		</div>

		<div v-if="$slots.default" class="ui-page-header__below">
			<slot />
		</div>
	</header>
</template>

<style scoped>
.ui-page-header {
	display: grid;
	gap: 1rem;
	padding-bottom: 1.25rem;
}

.ui-page-header--divider {
	border-bottom: 1px solid var(--border-soft, var(--split));
}

.ui-page-header__row {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 1rem 1.5rem;
}

.ui-page-header__copy {
	min-width: 0;
	flex: 1 1 20rem;
}

.ui-page-header__title-line {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.65rem 0.9rem;
}

.ui-page-header__title {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.85rem, 3.6vw, 2.75rem);
	font-weight: 700;
	line-height: 1.12;
	letter-spacing: -0.02em;
	text-wrap: balance;
}

.ui-page-header__badge {
	display: inline-flex;
	align-items: center;
	min-block-size: 30px;
	padding: 0.2rem 0.78rem;
	border: 1px solid var(--border-soft, var(--split));
	background: var(--background);
	color: var(--text-secondary);
	font-size: 0.84rem;
	font-weight: 600;
}

.ui-page-header__subtitle {
	max-width: 65ch;
	margin: 0.55rem 0 0;
	color: var(--text-secondary);
	font-size: 1rem;
	line-height: 1.55;
	text-wrap: pretty;
}

.ui-page-header__actions {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.65rem;
	flex: none;
}

.ui-page-header__below {
	display: grid;
	gap: 0.75rem;
}

@media (max-width: 640px) {
	.ui-page-header__row {
		align-items: stretch;
	}

	.ui-page-header__actions {
		width: 100%;
		justify-content: flex-start;
	}
}

/* Material Design 3 Unified Page Header */
:global(:root[data-ui="modern"] .ui-page-header) {
	padding-bottom: 1.35rem;
}

:global(:root[data-ui="modern"] .ui-page-header--divider) {
	border-bottom-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
}

:global(:root[data-ui="modern"] .ui-page-header__title) {
	color: var(--md-sys-color-on-surface);
	font-size: var(--md-sys-typescale-headline-large, clamp(1.85rem, 3.2vw, 2.5rem));
	line-height: 1.16;
}

:global(:root[data-ui="modern"] .ui-page-header__subtitle) {
	color: var(--md-sys-color-on-surface-variant);
}

:global(:root[data-ui="modern"] .ui-page-header__badge) {
	border-color: transparent;
	border-radius: var(--md-sys-shape-corner-full);
	background: var(--md-sys-color-surface-container-high);
	color: var(--md-sys-color-on-surface-variant);
}
</style>
