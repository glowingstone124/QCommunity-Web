import {
	Blend,
	Contrast,
	Hct,
	MaterialDynamicColors,
	SchemeVibrant,
	TonalPalette,
	argbFromHex,
	hexFromArgb,
} from '@material/material-color-utilities'

export const M3_SEED_COLOR = '#0B57D0'
const SUCCESS_SOURCE_ARGB = argbFromHex('#146C2E')
const WARNING_SOURCE_ARGB = argbFromHex('#8F4E00')

const dynamicColors = new MaterialDynamicColors()

const ROLE_ACCESSORS = {
	primary: () => dynamicColors.primary(),
	'on-primary': () => dynamicColors.onPrimary(),
	'primary-container': () => dynamicColors.primaryContainer(),
	'on-primary-container': () => dynamicColors.onPrimaryContainer(),
	secondary: () => dynamicColors.secondary(),
	'on-secondary': () => dynamicColors.onSecondary(),
	'secondary-container': () => dynamicColors.secondaryContainer(),
	'on-secondary-container': () => dynamicColors.onSecondaryContainer(),
	tertiary: () => dynamicColors.tertiary(),
	'on-tertiary': () => dynamicColors.onTertiary(),
	'tertiary-container': () => dynamicColors.tertiaryContainer(),
	'on-tertiary-container': () => dynamicColors.onTertiaryContainer(),
	surface: () => dynamicColors.surface(),
	'surface-dim': () => dynamicColors.surfaceDim(),
	'surface-bright': () => dynamicColors.surfaceBright(),
	'surface-container-lowest': () => dynamicColors.surfaceContainerLowest(),
	'surface-container-low': () => dynamicColors.surfaceContainerLow(),
	'surface-container': () => dynamicColors.surfaceContainer(),
	'surface-container-high': () => dynamicColors.surfaceContainerHigh(),
	'surface-container-highest': () => dynamicColors.surfaceContainerHighest(),
	'on-surface': () => dynamicColors.onSurface(),
	'on-surface-variant': () => dynamicColors.onSurfaceVariant(),
	outline: () => dynamicColors.outline(),
	'outline-variant': () => dynamicColors.outlineVariant(),
	'inverse-surface': () => dynamicColors.inverseSurface(),
	'inverse-on-surface': () => dynamicColors.inverseOnSurface(),
	'inverse-primary': () => dynamicColors.inversePrimary(),
	error: () => dynamicColors.error(),
	'on-error': () => dynamicColors.onError(),
	'error-container': () => dynamicColors.errorContainer(),
	'on-error-container': () => dynamicColors.onErrorContainer(),
}

function buildHarmonizedSemanticGroup({ sourceArgb, seedArgb, isDark, name }) {
	const harmonizedArgb = Blend.harmonize(sourceArgb, seedArgb)
	const palette = TonalPalette.fromInt(harmonizedArgb)
	if (isDark) {
		return {
			[`--md-sys-color-${name}`]: hexFromArgb(palette.tone(80)),
			[`--md-sys-color-on-${name}`]: hexFromArgb(palette.tone(20)),
			[`--md-sys-color-${name}-container`]: hexFromArgb(palette.tone(30)),
			[`--md-sys-color-on-${name}-container`]: hexFromArgb(palette.tone(90)),
		}
	}
	const harmonizedHct = Hct.fromInt(harmonizedArgb)
	const containerArgb = Hct.from(harmonizedHct.hue, Math.min(harmonizedHct.chroma, 22), 93).toInt()
	return {
		[`--md-sys-color-${name}`]: hexFromArgb(palette.tone(40)),
		[`--md-sys-color-on-${name}`]: hexFromArgb(palette.tone(100)),
		[`--md-sys-color-${name}-container`]: hexFromArgb(containerArgb),
		[`--md-sys-color-on-${name}-container`]: hexFromArgb(palette.tone(12)),
	}
}

export function generateM3ColorTokens({
	seedHex = M3_SEED_COLOR,
	isDark = false,
	contrastLevel = 0,
} = {}) {
	const seedArgb = argbFromHex(seedHex)
	const scheme = new SchemeVibrant(Hct.fromInt(seedArgb), Boolean(isDark), contrastLevel)
	const tokens = {}

	for (const [role, getColor] of Object.entries(ROLE_ACCESSORS)) {
		tokens[`--md-sys-color-${role}`] = hexFromArgb(getColor().getArgb(scheme))
	}

	Object.assign(
		tokens,
		buildHarmonizedSemanticGroup({
			sourceArgb: SUCCESS_SOURCE_ARGB,
			seedArgb,
			isDark,
			name: 'success',
		}),
		buildHarmonizedSemanticGroup({
			sourceArgb: WARNING_SOURCE_ARGB,
			seedArgb,
			isDark,
			name: 'warning',
		})
	)

	return tokens
}

export function measureM3ToneContrast(hexA, hexB) {
	const toneA = Hct.fromInt(argbFromHex(hexA)).tone
	const toneB = Hct.fromInt(argbFromHex(hexB)).tone
	return Contrast.ratioOfTones(toneA, toneB)
}

const APPLIED_KEYS = new Set()

export function clearM3ThemeFromDocument(root = typeof document !== 'undefined' ? document.documentElement : null) {
	if (!root) return
	for (const key of APPLIED_KEYS) {
		root.style.removeProperty(key)
	}
	APPLIED_KEYS.clear()
}

export function applyM3ThemeToDocument({
	uiMode = 'modern',
	resolvedTheme = 'light',
	contrastLevel = 0,
	seedHex = M3_SEED_COLOR,
	root = typeof document !== 'undefined' ? document.documentElement : null,
} = {}) {
	if (!root) return
	if (uiMode === 'classic') {
		clearM3ThemeFromDocument(root)
		return
	}

	const tokens = generateM3ColorTokens({
		seedHex,
		isDark: resolvedTheme === 'dark',
		contrastLevel,
	})

	for (const [key, value] of Object.entries(tokens)) {
		root.style.setProperty(key, value)
		APPLIED_KEYS.add(key)
	}
}
