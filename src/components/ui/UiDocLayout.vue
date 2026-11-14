<script setup>
defineProps({
	navLabel: {
		type: String,
		required: true,
	},
	sidebarTitle: {
		type: String,
		default: '',
	},
	wideContent: {
		type: Boolean,
		default: false,
	},
})
</script>

<template>
	<div class="ui-doc-layout page-shell">
		<aside class="ui-doc-sidebar">
			<div v-if="sidebarTitle || $slots['sidebar-header']" class="ui-doc-sidebar__header">
				<slot name="sidebar-header">
					<h2>{{ sidebarTitle }}</h2>
				</slot>
			</div>

			<div v-if="$slots['mobile-toolbar']" class="ui-doc-sidebar__mobile-toolbar">
				<slot name="mobile-toolbar" />
			</div>

			<nav class="ui-doc-sidebar__nav" :aria-label="navLabel">
				<slot name="sidebar" />
			</nav>
		</aside>

		<div class="ui-doc-main" :class="{ 'ui-doc-main--wide': wideContent }">
			<slot />
			<footer v-if="$slots.footer" class="ui-doc-footer">
				<slot name="footer" />
			</footer>
		</div>
	</div>
</template>

<style scoped>
/* Unified Document Reader Architecture: sticky directory on the left, open clean prose on the right with ZERO outer box or card background */
.ui-doc-layout {
	display: grid;
	grid-template-columns: minmax(248px, 288px) minmax(0, 1fr);
	align-items: start;
	gap: clamp(1.5rem, 3.8vw, 3.5rem);
	width: min(1320px, 100%);
	height: auto;
	min-height: calc(100dvh - var(--app-header-height, 0px));
	overflow-x: clip;
	margin-inline: auto;
	padding: clamp(1.25rem, 3.2vw, 2.5rem) clamp(1.25rem, 4vw, 3rem) 4rem;
	box-sizing: border-box;
	color: var(--text-main);
}

.ui-doc-sidebar {
	position: sticky;
	top: 1.25rem;
	display: grid;
	gap: 0.9rem;
	max-block-size: calc(100dvh - var(--app-header-height, 64px) - 2.5rem);
	overflow-y: auto;
	overscroll-behavior: contain;
	scrollbar-gutter: stable;
	padding-inline-end: 1.1rem;
	border-inline-end: 1px solid var(--border-soft, var(--split));
}

.ui-doc-sidebar__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
}

.ui-doc-sidebar__header h2 {
	margin: 0;
	color: var(--title-color);
	font-size: 1.05rem;
	font-weight: 700;
	line-height: 1.3;
}

.ui-doc-sidebar__mobile-toolbar {
	display: none;
}

.ui-doc-sidebar__nav {
	display: grid;
	gap: 0.35rem;
}

.ui-doc-main {
	min-width: 0;
	width: min(820px, 100%);
	background: transparent;
	border: none;
	border-radius: 0;
	box-shadow: none;
	padding: 0;
}

.ui-doc-main--wide {
	width: 100%;
}

.ui-doc-footer {
	margin-top: clamp(2rem, 4vw, 3rem);
	padding-top: 1.25rem;
	border-top: 1px solid var(--border-soft, var(--split));
}

@media (max-width: 900px) {
	.ui-doc-layout {
		grid-template-columns: 1fr;
		gap: 1.5rem;
		padding-top: 1.1rem;
	}

	.ui-doc-sidebar {
		position: static;
		max-block-size: none;
		overflow: visible;
		padding-inline-end: 0;
		padding-bottom: 1rem;
		border-inline-end: none;
		border-bottom: 1px solid var(--border-soft, var(--split));
	}

	.ui-doc-sidebar__mobile-toolbar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.ui-doc-main {
		width: 100%;
	}
}

/* Shared clean Material 3 navigation item primitives inside left drawer */
.ui-doc-sidebar__nav :deep(.ui-doc-nav-item) {
	position: relative;
	display: grid;
	gap: 0.18rem;
	min-block-size: 40px;
	align-content: center;
	padding: 0.55rem 0.9rem;
	border: 1px solid transparent;
	background: transparent;
	color: var(--text-main);
	font-family: inherit;
	font-size: 0.92rem;
	line-height: 1.35;
	text-align: left;
	text-decoration: none;
	cursor: pointer;
	overflow: hidden;
	transition:
		background-color var(--motion-fast, 150ms) var(--ease-standard, ease),
		border-color var(--motion-fast, 150ms) var(--ease-standard, ease),
		color var(--motion-fast, 150ms) var(--ease-standard, ease);
}

.ui-doc-sidebar__nav :deep(.ui-doc-nav-item small) {
	color: var(--text-secondary);
	font-size: 0.78rem;
}

.ui-doc-sidebar__nav :deep(.ui-doc-nav-item:hover),
.ui-doc-sidebar__nav :deep(.ui-doc-nav-item:focus-visible) {
	background: var(--background-secondary);
}

.ui-doc-sidebar__nav :deep(.ui-doc-nav-item.is-active) {
	border-color: var(--primary);
	background: color-mix(in srgb, var(--primary) 10%, transparent);
	color: var(--primary);
	font-weight: 700;
}

/* Material Design 3 Document Canvas & Navigation Drawer */
:global(:root[data-ui="modern"] .ui-doc-layout) {
	background: var(--md-sys-color-surface);
	color: var(--md-sys-color-on-surface);
}

:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-sidebar) {
	border-inline-end-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
}

:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-sidebar__nav .ui-doc-nav-item) {
	border: none;
	border-radius: var(--md-sys-shape-corner-full);
	padding: 0.62rem 1rem;
	color: var(--md-sys-color-on-surface-variant);
}

:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-sidebar__nav .ui-doc-nav-item:hover:not(.is-active)) {
	background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
	color: var(--md-sys-color-on-surface);
}

:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-sidebar__nav .ui-doc-nav-item.is-active) {
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
}

:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-sidebar__nav .ui-doc-nav-item.is-active small) {
	color: color-mix(in srgb, var(--md-sys-color-on-secondary-container) 80%, transparent);
}

:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-main),
:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-main .article-shell),
:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-main .guide-card),
:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-main .terms-document) {
	background: transparent;
	border: none;
	border-radius: 0;
	box-shadow: none;
	padding: 0;
}

@media (max-width: 900px) {
	:global(:root[data-ui="modern"] .ui-doc-layout .ui-doc-sidebar) {
		border-inline-end: none;
		border-bottom-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
	}
}
</style>
