import assert from 'node:assert/strict'
import test from 'node:test'
import { isInvalidSessionResponse, redirectInvalidSession } from './authSession.js'

function storage(token = 'expired-token') {
	const values = new Map([['token', token], ['username', 'AuthTest'], ['user', '{}'], ['qhub.auth.method', 'cas']])
	return { getItem: key => values.get(key), removeItem: key => values.delete(key), values }
}

test('recognizes HTTP and legacy account-authentication failures without expiring network failures', () => {
	for (const [status, data] of [[401, null], [200, { error: 1 }], [200, { error: 3 }], [200, { code: 'INVALID_TOKEN' }]]) {
		assert.equal(isInvalidSessionResponse(status, data), true)
	}
	for (const [status, data] of [[503, { error: { message: 'unavailable' } }], [403, {}], [200, { username: 'AuthTest' }]]) {
		assert.equal(isInvalidSessionResponse(status, data), false)
	}
})

test('expired sessions are cleared and sent to login with the original local destination', () => {
	const saved = storage()
	const redirects = []
	const location = { pathname: '/news', search: '?tag=updates', hash: '#latest', replace: value => redirects.push(value) }
	assert.equal(redirectInvalidSession('expired-token', location, saved), true)
	assert.equal(saved.values.size, 0)
	assert.deepEqual(redirects, ['/login?redirect=%2Fnews%3Ftag%3Dupdates%23latest'])
	assert.equal(redirectInvalidSession('expired-token', location, saved), false)
	assert.equal(redirects.length, 1)
})

test('a late invalid-token response cannot erase or redirect a newer session', () => {
	const saved = storage('new-session')
	const location = { replace: () => assert.fail('Must not redirect the new session') }
	assert.equal(redirectInvalidSession('old-session', location, saved), false)
	assert.equal(saved.getItem('token'), 'new-session')
	assert.equal(saved.getItem('username'), 'AuthTest')
})
