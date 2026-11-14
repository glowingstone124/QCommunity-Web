import { computed, ref } from 'vue'
import { applyM3ThemeToDocument } from '@/utils/m3Theme.js'

export const UI_MODE_STORAGE_KEY = 'qhub.ui-mode'
export const THEME_STORAGE_KEY = 'theme'

function readStoredUiMode() {
	if (typeof window === 'undefined') return 'modern'
	try {
		return localStorage.getItem(UI_MODE_STORAGE_KEY) === 'classic' ? 'classic' : 'modern'
	} catch {
		return document.documentElement.dataset.ui === 'classic' ? 'classic' : 'modern'
	}
}

function readStoredThemePreference() {
	if (typeof window === 'undefined') return 'system'
	try {
		const saved = localStorage.getItem(THEME_STORAGE_KEY)
		return saved === 'light' || saved === 'dark' ? saved : 'system'
	} catch {
		return 'system'
	}
}

function queryOsPrefersDark() {
	if (typeof window === 'undefined' || !window.matchMedia) return false
	return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const uiMode = ref(readStoredUiMode())
export const themePreference = ref(readStoredThemePreference())
export const osPrefersDark = ref(queryOsPrefersDark())

export const resolvedTheme = computed(() => {
	if (themePreference.value === 'light' || themePreference.value === 'dark') {
		return themePreference.value
	}
	return osPrefersDark.value ? 'dark' : 'light'
})

export const isModernUi = computed(() => uiMode.value === 'modern')

function queryContrastLevel() {
	if (typeof window === 'undefined' || !window.matchMedia) return 0
	return window.matchMedia('(prefers-contrast: more)').matches ? 0.5 : 0
}

function applyUiModeToDom(mode) {
	if (typeof document === 'undefined') return
	const normalized = mode === 'classic' ? 'classic' : 'modern'
	document.documentElement.dataset.ui = normalized
	applyM3ThemeToDocument({
		uiMode: normalized,
		resolvedTheme: resolvedTheme.value,
		contrastLevel: queryContrastLevel(),
	})
}

function applyThemeToDom(pref, effective) {
	if (typeof document === 'undefined') return
	const meta = document.querySelector('meta[name="color-scheme"]')
	if (meta) {
		meta.setAttribute('content', pref === 'light' || pref === 'dark' ? pref : 'light dark')
	}
	const normalizedEffective = effective === 'dark' ? 'dark' : 'light'
	document.documentElement.dataset.theme = normalizedEffective
	applyM3ThemeToDocument({
		uiMode: uiMode.value,
		resolvedTheme: normalizedEffective,
		contrastLevel: queryContrastLevel(),
	})
}

export function runWithViewTransition(updateFn, enabled = true) {
	if (typeof document === 'undefined') {
		updateFn()
		return
	}
	const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
	if (!enabled || reduced || typeof document.startViewTransition !== 'function') {
		updateFn()
		return
	}
	try {
		document.startViewTransition(() => {
			updateFn()
		})
	} catch {
		updateFn()
	}
}

export function setUiMode(nextMode, { animate = true } = {}) {
	const normalized = nextMode === 'classic' ? 'classic' : 'modern'
	if (uiMode.value === normalized && document.documentElement?.dataset.ui === normalized) return

	const apply = () => {
		uiMode.value = normalized
		try {
			localStorage.setItem(UI_MODE_STORAGE_KEY, normalized)
		} catch {
			// Ignore storage failures in restricted contexts; live DOM state still updates.
		}
		applyUiModeToDom(normalized)
	}

	runWithViewTransition(apply, animate)
}

export function toggleUiMode({ animate = true } = {}) {
	setUiMode(uiMode.value === 'modern' ? 'classic' : 'modern', { animate })
}

export function setThemePreference(nextPref, { animate = false } = {}) {
	const normalized = nextPref === 'light' || nextPref === 'dark' ? nextPref : 'system'

	const apply = () => {
		themePreference.value = normalized
		try {
			if (normalized === 'system') {
				localStorage.removeItem(THEME_STORAGE_KEY)
			} else {
				localStorage.setItem(THEME_STORAGE_KEY, normalized)
			}
		} catch {
			// Ignore storage failures; theme still applies for the active session.
		}
		applyThemeToDom(normalized, resolvedTheme.value)
	}

	runWithViewTransition(apply, animate)
}

export function toggleResolvedTheme({ animate = false } = {}) {
	// Two-state chrome toggle: swap opposite to currently rendered theme, reverting to system if it matches OS.
	const target = resolvedTheme.value === 'dark' ? 'light' : 'dark'
	const osScheme = osPrefersDark.value ? 'dark' : 'light'
	setThemePreference(target === osScheme ? 'system' : target, { animate })
}

let initialized = false

export function initUiPreferences() {
	osPrefersDark.value = queryOsPrefersDark()
	uiMode.value = readStoredUiMode()
	themePreference.value = readStoredThemePreference()
	applyUiModeToDom(uiMode.value)
	applyThemeToDom(themePreference.value, resolvedTheme.value)

	if (initialized || typeof window === 'undefined') return
	initialized = true

	const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
	if (mediaQuery) {
		const handleOsChange = (event) => {
			osPrefersDark.value = Boolean(event.matches)
			// Only update resolved palette when following system; never drop an explicit user override.
			if (themePreference.value === 'system') {
				applyThemeToDom('system', resolvedTheme.value)
			}
		}
		if (typeof mediaQuery.addEventListener === 'function') {
			mediaQuery.addEventListener('change', handleOsChange)
		} else if (typeof mediaQuery.addListener === 'function') {
			mediaQuery.addListener(handleOsChange)
		}
	}

	window.addEventListener('storage', (event) => {
		if (event.key === UI_MODE_STORAGE_KEY) {
			uiMode.value = event.newValue === 'classic' ? 'classic' : 'modern'
			applyUiModeToDom(uiMode.value)
		} else if (event.key === THEME_STORAGE_KEY) {
			themePreference.value =
				event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'system'
			applyThemeToDom(themePreference.value, resolvedTheme.value)
		}
	})
}

export function useUiPreferences() {
	return {
		uiMode,
		isModernUi,
		themePreference,
		resolvedTheme,
		osPrefersDark,
		setUiMode,
		toggleUiMode,
		setThemePreference,
		toggleResolvedTheme,
		initUiPreferences,
	}
}
