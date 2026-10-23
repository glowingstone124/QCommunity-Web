export const CAS_TOKEN_KEY = 'qo.cas.token'

export async function grantServiceTicket(apiBaseUrl, token, service, fetcher = fetch) {
	const response = await fetcher(`${apiBaseUrl}/qo/auth/ticket/grant`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({ service }),
	})
	const data = await response.json()
	if (!response.ok || !data.result || !data.redirectUrl) {
		const error = new Error(data.message || 'CAS authorization failed')
		error.status = response.status
		throw error
	}
	// Only navigate to the requested service, with the ticket issued by QAPI.
	const redirect = new URL(data.redirectUrl)
	const issuedTicket = redirect.searchParams.get('ticket')
	redirect.searchParams.delete('ticket')
	const expected = new URL(service)
	expected.searchParams.delete('ticket')
	if (!issuedTicket || redirect.href !== expected.href) {
		throw new Error('Invalid CAS callback destination')
	}
	return data.redirectUrl
}
