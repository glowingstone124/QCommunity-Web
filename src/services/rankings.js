const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://api.glowingstone.cn").replace(/\/$/, "")

export async function getLeaderboards(limit = 50) {
	const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 50))
	const response = await fetch(`${API_BASE_URL}/qo/rankings?limit=${normalizedLimit}`, {
		cache: "no-store",
	})
	const body = await response.json().catch(() => ({}))
	if (!response.ok) {
		throw new Error(body.message || "榜单加载失败")
	}
	return body
}
