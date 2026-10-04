import DOMPurify from 'dompurify'
import { marked } from 'marked'

const TERMS_DOCUMENT_URL = '/content/terms/user_notice.md'
const TERMS_ACCEPTANCE_KEY_PREFIX = 'qcommunity.terms.accepted.'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip').replace(/\/$/, '')

export function getTermsAcceptanceKey(username) {
	return `${TERMS_ACCEPTANCE_KEY_PREFIX}${encodeURIComponent(String(username || '').trim().toLowerCase())}`
}

export function saveTermsAcceptance(username, version) {
	if (!username || !version) return false
	try {
		localStorage.setItem(getTermsAcceptanceKey(username), version)
		return true
	} catch {
		return false
	}
}

export function hasAcceptedTerms(username, version) {
	if (!username || !version) return false
	try {
		return localStorage.getItem(getTermsAcceptanceKey(username)) === version
	} catch {
		return false
	}
}

export async function loadTermsDocument() {
	const response = await fetch(`${TERMS_DOCUMENT_URL}?t=${Date.now()}`, { cache: 'no-store' })
	if (!response.ok) {
		throw new Error(`Failed to load user notice: ${response.status}`)
	}

	const markdown = await response.text()
	if (!globalThis.crypto?.subtle) {
		throw new Error('Secure SHA-256 is unavailable in this browser')
	}
	const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(markdown))
	const version = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

	return {
		markdown,
		version,
		html: DOMPurify.sanitize(marked.parse(markdown)),
	}
}

export async function resolveAuthenticatedUsername(token) {
	if (!token) return ''

	const response = await fetch(`${API_BASE_URL}/qo/authorization/account`, {
		cache: 'no-store',
		headers: { token },
	})
	if (!response.ok) throw new Error(`Account lookup failed: ${response.status}`)
	const account = await response.json()
	const username = account?.username?.trim()
	if (!username || account.error) throw new Error('Could not identify the signed-in account')

	if (localStorage.getItem('username') !== username) {
		localStorage.setItem('username', username)
	}
	return username
}
