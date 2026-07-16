const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip'

async function request(path, options = {}) {
	const token = localStorage.getItem('token')
	if (!token) {
		const error = new Error('请先登录后再选择阵营。')
		error.status = 401
		throw error
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			...options.headers,
		},
	})
	const data = await response.json().catch(() => ({}))
	if (!response.ok) {
		const error = new Error(data.message || '请求失败，请稍后再试。')
		error.status = response.status
		error.data = data
		throw error
	}
	return data
}

export function getFallenTeamSelection() {
	return request('/qo/authorization/fallen/team')
}

export function selectFallenTeam(team) {
	return request('/qo/authorization/fallen/team', {
		method: 'POST',
		body: JSON.stringify({team}),
	})
}
