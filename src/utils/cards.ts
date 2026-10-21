export function getSpecialImage(special) {
    for (const key in specialImageMap) {
        if (special.includes(key)) {
            return specialImageMap[key]
        }
    }
    return null
}
const specialImageMap = {
    "PixelFantasia": "https://bucket.glowingstone.cn/pixel_fantasia.png",
    "Shinra-Bansho": "https://shinrabansho-music.com/sekaiseifuku/logo2.webp"
}

export const rarityMap = {
    1: { style: "common" },
    2: { style: "uncommon" },
    3: { style: "rare" },
    4: { style: "limited" }
}

export function groupCardsBySpecial(cards) {
    const groups = {}
    for (const card of cards) {
        if (!groups[card.special]) {
            groups[card.special] = []
        }
        groups[card.special].push(card)
    }
    return groups
}
