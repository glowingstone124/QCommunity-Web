export function getSpecialImage(special) {
    for (const key in specialImageMap) {
        if (special.includes(key)) {
            return specialImageMap[key]
        }
    }
    return null
}
const specialImageMap = {
    "PixelFantasia": "https://bucket.glowingstone.cn/pixel_fantasia.png"
}
