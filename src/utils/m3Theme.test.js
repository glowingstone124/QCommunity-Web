import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULE_PATH = path.join(__dirname, 'm3Theme.js')

async function loadM3ThemeModule() {
	const result = await build({
		entryPoints: [MODULE_PATH],
		bundle: true,
		write: false,
		format: 'cjs',
		platform: 'browser',
	})
	const moduleObj = { exports: {} }
	const fn = new Function('module', 'exports', result.outputFiles[0].text)
	fn(moduleObj, moduleObj.exports)
	return moduleObj.exports
}

const CONTRAST_PAIRS = [
	['--md-sys-color-on-primary', '--md-sys-color-primary'],
	['--md-sys-color-on-primary-container', '--md-sys-color-primary-container'],
	['--md-sys-color-on-secondary', '--md-sys-color-secondary'],
	['--md-sys-color-on-secondary-container', '--md-sys-color-secondary-container'],
	['--md-sys-color-on-tertiary', '--md-sys-color-tertiary'],
	['--md-sys-color-on-tertiary-container', '--md-sys-color-tertiary-container'],
	['--md-sys-color-on-surface', '--md-sys-color-surface'],
	['--md-sys-color-on-surface', '--md-sys-color-surface-container-lowest'],
	['--md-sys-color-on-surface', '--md-sys-color-surface-container-low'],
	['--md-sys-color-on-surface', '--md-sys-color-surface-container'],
	['--md-sys-color-on-surface', '--md-sys-color-surface-container-high'],
	['--md-sys-color-on-surface', '--md-sys-color-surface-container-highest'],
	['--md-sys-color-on-surface-variant', '--md-sys-color-surface'],
	['--md-sys-color-on-surface-variant', '--md-sys-color-surface-container'],
	['--md-sys-color-inverse-on-surface', '--md-sys-color-inverse-surface'],
	['--md-sys-color-on-error', '--md-sys-color-error'],
	['--md-sys-color-on-error-container', '--md-sys-color-error-container'],
	['--md-sys-color-on-success', '--md-sys-color-success'],
	['--md-sys-color-on-success-container', '--md-sys-color-success-container'],
	['--md-sys-color-on-warning', '--md-sys-color-warning'],
	['--md-sys-color-on-warning-container', '--md-sys-color-warning-container'],
]

test('Material 3 SchemeVibrant generates complete light & dark tokens meeting WCAG AA contrast', async () => {
	const m3Theme = await loadM3ThemeModule()

	for (const isDark of [false, true]) {
		const tokens = m3Theme.generateM3ColorTokens({ isDark })
		for (const [fgKey, bgKey] of CONTRAST_PAIRS) {
			assert.ok(tokens[fgKey], `Missing token ${fgKey}`)
			assert.ok(tokens[bgKey], `Missing token ${bgKey}`)
			const ratio = m3Theme.measureM3ToneContrast(tokens[fgKey], tokens[bgKey])
			assert.ok(
				ratio >= 4.5,
				`${isDark ? 'dark' : 'light'} pair ${fgKey} (${tokens[fgKey]}) on ${bgKey} (${tokens[bgKey]}) has contrast ${ratio.toFixed(2)} < 4.5`
			)
		}
	}
})

test('applyM3ThemeToDocument sets --md-sys-color-* in modern mode and clears them in classic mode', async () => {
	const m3Theme = await loadM3ThemeModule()
	const styles = new Map()
	const mockRoot = {
		style: {
			setProperty: (k, v) => styles.set(k, v),
			removeProperty: (k) => styles.delete(k),
		},
	}

	m3Theme.applyM3ThemeToDocument({ uiMode: 'modern', resolvedTheme: 'light', root: mockRoot })
	assert.equal(styles.get('--md-sys-color-primary'), '#0056d2')

	m3Theme.applyM3ThemeToDocument({ uiMode: 'modern', resolvedTheme: 'dark', root: mockRoot })
	assert.equal(styles.get('--md-sys-color-primary'), '#b2c5ff')

	m3Theme.applyM3ThemeToDocument({ uiMode: 'classic', resolvedTheme: 'light', root: mockRoot })
	assert.equal(styles.size, 0)
})
