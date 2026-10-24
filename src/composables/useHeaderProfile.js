import { onMounted, ref } from 'vue'
import { fetchAvatar } from '@/services/avatar.js'
import { fetchSessionAccount } from '@/services/accountSession.js'
import { redirectInvalidSession, SessionExpiredError } from '@/utils/authSession.js'

const sharedTheme = ref(
	typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light',
)

export function useThemePreference() {
	return sharedTheme
}

export function useHeaderProfile() {
	const username = ref(localStorage.getItem('username') || '')
	const token = ref(localStorage.getItem('token') || '')
	const loggedIn = ref(false)
	const playtime = ref(0)
	const avatarUrl = ref('https://example.com/avatar.jpg')
	const theme = sharedTheme

	const getAvatar = async (name) => {
		try {
			const avatar = await fetchAvatar(name)
			if (avatar?.special === true) {
				avatarUrl.value = avatar.url || ''
				return
			}

			avatarUrl.value = avatar?.url || avatarUrl.value
		} catch (error) {
			console.error('获取头像失败:', error)
		}
	}

	const loadProfile = async () => {
		theme.value = document.documentElement.dataset.theme || 'light'

		if (!token.value) {
			username.value = ''
			getAvatar('steve')
			return
		}

		try {
			const data = await fetchSessionAccount(token.value)
			if (localStorage.getItem('token') !== token.value) return

			loggedIn.value = true
			username.value = data.username
			playtime.value = data.playtime
			getAvatar(data.username)
		} catch (error) {
			if (error instanceof SessionExpiredError) {
				loggedIn.value = false
				username.value = ''
				redirectInvalidSession(token.value)
				return
			}
			console.error('获取账户信息失败:', error)
			username.value = ''
			getAvatar('steve')
		}
	}

	onMounted(loadProfile)

	return {
		avatarUrl,
		loggedIn,
		playtime,
		theme,
		username,
	}
}
