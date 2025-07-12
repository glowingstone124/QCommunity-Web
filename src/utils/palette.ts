import {Vibrant} from "node-vibrant/browser";

export async function extractPalette(imageUrl: string, count: number = 5):  Promise<any[]> {
    try {
        const palette = await Vibrant.from(imageUrl).getPalette()
        const colors = []

        const swatches = [
            palette.Vibrant,
            palette.Muted,
            palette.DarkVibrant,
            palette.DarkMuted,
            palette.LightVibrant,
            palette.LightMuted,
        ]

        for (const swatch of swatches) {
            if (swatch && swatch.hex && !colors.includes(swatch.hex)) {
                colors.push(swatch.hex)
                if (colors.length >= count) break
            }
        }

        return colors
    } catch (err) {
        console.error('颜色提取失败：', err)
        return []
    }
}
