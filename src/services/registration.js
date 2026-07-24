const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://api.glowingstone.cn").replace(/\/$/, "")

async function request(path, options = {}) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	})
	const body = await response.json().catch(() => ({}))
	if (!response.ok) {
		throw new Error(body.message || "请求失败，请稍后再试")
	}
	return body
}

export function getRegistrationVerificationMethods() {
	return request("/qo/registration/verification-methods")
}

export function startRegistrationQuiz(name, uid) {
	return request("/qo/registration/quiz/session", {
		method: "POST",
		body: JSON.stringify({name, uid}),
	})
}

export function submitRegistrationQuiz(sessionId, name, uid, answers) {
	return request("/qo/registration/quiz/submit", {
		method: "POST",
		body: JSON.stringify({sessionId, name, uid, answers}),
	})
}

export function registerAccount(name, uid, password, verificationToken) {
	return request("/qo/upload/registry", {
		method: "POST",
		body: JSON.stringify({
			name,
			uid,
			password,
			verificationMethod: "quiz",
			verificationToken,
		}),
	})
}
