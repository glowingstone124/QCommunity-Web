import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { fetchSessionAccount } from './accountSession.js'

const TERMS_DOCUMENT_URL = '/content/terms/user_notice.md'
const TERMS_ACCEPTANCE_KEY_PREFIX = 'qcommunity.terms.accepted.'

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

	const account = await fetchSessionAccount(token)
	const username = account.username.trim()

	if (localStorage.getItem('token') === token && localStorage.getItem('username') !== username) {
		localStorage.setItem('username', username)
	}
	return username
}
