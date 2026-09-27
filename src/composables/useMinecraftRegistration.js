import { ref } from 'vue'
import {
	getMinecraftRegistrationStatus,
	startMinecraftRegistration,
} from '@/services/registration.js'

export function useMinecraftRegistration({
	username,
	qq,
	isLoading,
	message,
	verificationToken,
	submitForm,
	t,
}) {
	const minecraftSessionId = ref('')
	const minecraftState = ref('')
	const minecraftExpiresAt = ref(0)
	const minecraftPassed = ref(null)
	let minecraftPollingTimer = null
	let minecraftStatusInFlight = false

	function clearMinecraftPolling() {
		if (minecraftPollingTimer) clearInterval(minecraftPollingTimer)
		minecraftPollingTimer = null
	}

	function startMinecraftPolling() {
		clearMinecraftPolling()
		minecraftPollingTimer = setInterval(() => void syncMinecraftStatus(), 2000)
	}

	async function syncMinecraftStatus() {
		if (!minecraftSessionId.value || minecraftStatusInFlight) return
		minecraftStatusInFlight = true
		try {
			const result = await getMinecraftRegistrationStatus(
				minecraftSessionId.value,
				username.value,
				Number(qq.value),
			)
			minecraftState.value = result.state || minecraftState.value
			minecraftExpiresAt.value = Number(result.expiresAt || minecraftExpiresAt.value)
			if (result.state !== 'completed') return

			clearMinecraftPolling()
			minecraftPassed.value = result.passed === true
			if (!minecraftPassed.value || !result.verificationToken) {
				message.value = t('register.minecraftFailed')
				minecraftSessionId.value = ''
				return
			}
			verificationToken.value = result.verificationToken
			await submitForm()
		} catch (error) {
			if (error.status === 410) {
				clearMinecraftPolling()
				minecraftSessionId.value = ''
				minecraftState.value = ''
			}
			message.value = error.message
		} finally {
			minecraftStatusInFlight = false
		}
	}

	async function beginMinecraftTest() {
		if (minecraftSessionId.value || isLoading.value) return
		isLoading.value = true
		message.value = ''
		verificationToken.value = ''
		try {
			const session = await startMinecraftRegistration(username.value, Number(qq.value))
			if (!session.sessionId || session.state !== 'pending') {
				throw new Error(t('register.invalidMinecraftSession'))
			}
			minecraftSessionId.value = session.sessionId
			minecraftState.value = session.state
			minecraftExpiresAt.value = Number(session.expiresAt || 0)
			minecraftPassed.value = null
			startMinecraftPolling()
		} catch (error) {
			message.value = error.message
			minecraftSessionId.value = ''
			minecraftState.value = ''
		} finally {
			isLoading.value = false
		}
	}

	return {
		minecraftSessionId,
		minecraftState,
		minecraftExpiresAt,
		minecraftPassed,
		beginMinecraftTest,
		clearMinecraftPolling,
	}
}
