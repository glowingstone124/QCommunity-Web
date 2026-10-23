import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareQhubCallback, consumeQhubCallback } from './casCallback.js'

function storage() {
	const data = new Map()
	return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
}

test('callback is bound to the initiating tab and can only be consumed once', () => {
	const tab = storage()
	const service = prepareQhubCallback('https://qoriginal.vip', '/terms#review', tab)
	const callback = new URL(service)
	callback.searchParams.set('ticket', 'ST-test')
	assert.ok(callback.searchParams.get('state'))
	assert.equal(consumeQhubCallback(callback.href, storage()), false)
	assert.equal(consumeQhubCallback(callback.href, tab), true)
	assert.equal(consumeQhubCallback(callback.href, tab), false)
})

test('a different service or state cannot complete a pending login', () => {
	for (const parameter of ['state', 'redirect']) {
		const tab = storage()
		const callback = new URL(prepareQhubCallback('https://qoriginal.vip', '/terms', tab))
		callback.searchParams.set(parameter, 'unrelated')
		callback.searchParams.set('ticket', 'ST-test')
		assert.equal(consumeQhubCallback(callback.href, tab), false)
	}
})
