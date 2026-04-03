import { onMounted, ref } from 'vue'

export function useHeaderProfile() {
	const username = ref(localStorage.getItem('username') || '')
	const token = ref(localStorage.getItem('token') || '')
	const loggedIn = ref(false)
	const playtime = ref(0)
	const avatarUrl = ref('https://example.com/avatar.jpg')
	const theme = ref('light')

	const getAvatar = async (name) => {
		try {
			const res = await fetch(`https://api.qoriginal.vip/qo/download/avatar?name=${name}`)
			const data = await res.json()
			avatarUrl.value = data.url
		} catch (error) {
			console.error('获取头像失败:', error)
		}
	}

	const loadProfile = async () => {
		theme.value = document.documentElement.dataset.theme || 'light'

		if (!username.value) {
			username.value = '未登录'
			getAvatar('steve')
			return
		}

		try {
			const res = await fetch('https://api.qoriginal.vip/qo/authorization/account', {
				headers: {
					token: token.value,
				},
			})
			const data = await res.json()
			if (data.error === 3 || data.error === 1) {
				loggedIn.value = false
				username.value = '未登录'
				getAvatar('steve')
				return
			}

			loggedIn.value = true
			username.value = data.username
			playtime.value = data.playtime
			getAvatar(data.username)
		} catch (error) {
			console.error('获取账户信息失败:', error)
			username.value = '未登录'
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
