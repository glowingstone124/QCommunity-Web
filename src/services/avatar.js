const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip'
const AVATAR_IMAGE_PATH = '/qo/download/avatar/image'

export function getAvatarImageUrl(name) {
    return `${API_BASE_URL}${AVATAR_IMAGE_PATH}?name=${encodeURIComponent(name)}`
}

export function getSpecialAvatarImageUrl(key) {
    return `${API_BASE_URL}${AVATAR_IMAGE_PATH}?key=${encodeURIComponent(key)}`
}

function isCachedAvatarUrl(url) {
    return typeof url === 'string' && url.includes(AVATAR_IMAGE_PATH)
}

export async function fetchAvatar(name) {
    const normalizedName = name?.trim()
    if (!normalizedName) {
        return null
    }

    const response = await fetch(
        `${API_BASE_URL}/qo/download/avatar?name=${encodeURIComponent(normalizedName)}`
    )
    if (!response.ok) {
        throw new Error(`Avatar request failed with HTTP ${response.status}`)
    }

    const data = await response.json()
    const isSpecial = data?.special === true
    if (!data?.url && !data?.key && !isSpecial) {
        return null
    }

    let url = data.url
    if (isSpecial && data.key) {
        url = getSpecialAvatarImageUrl(data.key)
    } else if (!isSpecial && isCachedAvatarUrl(url)) {
        url = getAvatarImageUrl(normalizedName)
    }

    return {
        ...data,
        name: data.name || normalizedName,
        url,
        special: isSpecial,
    }
}

export async function fetchAvatarUrl(name) {
    return (await fetchAvatar(name))?.url
}
