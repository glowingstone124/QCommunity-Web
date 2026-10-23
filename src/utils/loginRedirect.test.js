import assert from 'node:assert/strict'
import test from 'node:test'
import { postLoginRedirect } from './loginRedirect.js'

test('login preserves local destinations, query parameters and fragments', () => {
	assert.equal(postLoginRedirect('/account?tab=profile#settings'), '/account?tab=profile#settings')
})

test('login rejects external URLs and callback loops', () => {
	for (const target of [undefined, ['/account'], 'https://example.com', '//example.com', '/\\example.com', '/\n/example.com', '/login', '/LOGIN/', '/%6cogin', '/login?redirect=/login', '/cas', '/cas/?redirect=/cas', '/%63as', '/account/../cas', '/%invalid']) {
		assert.equal(postLoginRedirect(target), '/', String(target))
	}
})
