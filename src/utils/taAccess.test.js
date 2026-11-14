import test from 'node:test'
import assert from 'node:assert/strict'
import {
	buildOptionalAuthHeaders,
	computeTaUpgradeState,
	isTaSession,
	isValidQqNumber,
	normalizeAccountType,
	parseTaRestrictedResponse,
} from './taAccess.js'

function createMemoryStorage(initial = {}) {
	const map = new Map(Object.entries(initial))
	return {
		getItem: (key) => (map.has(key) ? map.get(key) : null),
		setItem: (key, value) => map.set(key, String(value)),
		removeItem: (key) => map.delete(key),
	}
}

test('buildOptionalAuthHeaders injects Authorization and token when logged in', () => {
	const storage = createMemoryStorage({ token: 'tok-123' })
	assert.deepEqual(
		buildOptionalAuthHeaders({ Accept: 'application/json' }, storage),
		{
			Accept: 'application/json',
			Authorization: 'Bearer tok-123',
			token: 'tok-123',
		},
	)
})

test('buildOptionalAuthHeaders omits auth headers when logged out', () => {
	const storage = createMemoryStorage()
	assert.deepEqual(buildOptionalAuthHeaders({ Accept: 'application/json' }, storage), {
		Accept: 'application/json',
	})
})

test('normalizeAccountType and computeTaUpgradeState compute TA upgrade threshold cleanly', () => {
	const storage = createMemoryStorage()
	const partial = { account_type: 'ta', temp: true, playtime: 90, required_playtime: 180 }
	assert.equal(normalizeAccountType(partial, storage), 'ta')
	assert.equal(isTaSession(storage), true)
	assert.deepEqual(computeTaUpgradeState(partial), {
		accountType: 'ta',
		playtime: 90,
		requiredPlaytime: 180,
		remainingMinutes: 90,
		progressPercent: 50,
		canUpgrade: false,
	})

	const ready = { account_type: 'ta', temp: true, playtime: 215, required_playtime: 180 }
	assert.deepEqual(computeTaUpgradeState(ready), {
		accountType: 'ta',
		playtime: 215,
		requiredPlaytime: 180,
		remainingMinutes: 0,
		progressPercent: 100,
		canUpgrade: true,
	})
})

test('parseTaRestrictedResponse identifies 403 TA gate payload', () => {
	const res = parseTaRestrictedResponse(403, {
		code: 403,
		error: 'ta_restricted',
		message: '欢迎来到 Thulium！',
	})
	assert.deepEqual(res, { restricted: true, message: '欢迎来到 Thulium！' })
	assert.deepEqual(parseTaRestrictedResponse(404, { error: 'not_found' }), {
		restricted: false,
		message: '',
	})
})

test('isValidQqNumber validates 5-11 digit QQ numbers not starting with 0', () => {
	assert.equal(isValidQqNumber('12345'), true)
	assert.equal(isValidQqNumber(' 10001 '), true)
	assert.equal(isValidQqNumber('01234'), false)
	assert.equal(isValidQqNumber('1234'), false)
	assert.equal(isValidQqNumber('abc12345'), false)
})
