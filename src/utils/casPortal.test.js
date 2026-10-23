import assert from 'node:assert/strict'
import test from 'node:test'
import { grantServiceTicket } from './casPortal.js'

test('both authentication methods exchange their credential for a service-bound ticket', async () => {
	const service = 'https://ai.qoriginal.vip/?tab=hello+world#builder'
	for (const token of ['qo-credential', 'qq-credential']) {
		const redirect = await grantServiceTicket('https://api.qoriginal.vip', token, service, async (url, request) => {
			assert.equal(url, 'https://api.qoriginal.vip/qo/auth/ticket/grant')
			assert.equal(request.headers.Authorization, `Bearer ${token}`)
			assert.deepEqual(JSON.parse(request.body), { service })
			return Response.json({ result: true, redirectUrl: 'https://ai.qoriginal.vip/?tab=hello+world&ticket=ST-test#builder' })
		})
		assert.ok(redirect.includes('ticket=ST-test'))
		assert.ok(!redirect.includes(token))
	}
})

test('failed authorization and unrelated callback destinations cannot complete login', async () => {
	for (const response of [
		Response.json({ result: false, message: 'Expired session' }, { status: 401 }),
		Response.json({ result: true, redirectUrl: 'https://evil.example/?ticket=ST-test' }),
		Response.json({ result: true, redirectUrl: 'https://ai.qoriginal.vip/' }),
	]) {
		await assert.rejects(grantServiceTicket('https://api.qoriginal.vip', 'credential', 'https://ai.qoriginal.vip/', async () => response))
	}
})
