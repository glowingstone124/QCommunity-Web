import { Vibrant } from "node-vibrant/browser";
import axios from "axios";

type InputType = string | HTMLImageElement | ImageData;

export async function extractPalette(
    input: InputType,
    count: number = 5
): Promise<string[]> {
    try {
        const palette = await Vibrant.from(input).getPalette();
        const colors: string[] = [];

        const swatches = [
            palette.Vibrant,
            palette.Muted,
            palette.DarkVibrant,
            palette.DarkMuted,
            palette.LightVibrant,
            palette.LightMuted,
        ];

        for (const swatch of swatches) {
            if (swatch && swatch.hex && !colors.includes(swatch.hex)) {
                colors.push(swatch.hex);
                if (colors.length >= count) break;
            }
        }

        return colors;
    } catch (err) {
        console.error("颜色提取失败：", err);
        return [];
    }
}

/**
 * 从 HTMLImageElement 获取 ImageData
 * @param img HTMLImageElement 实例
 * @param scale 缩放比例，默认为1不缩放
 * @returns ImageData
 */
export function getImageDataFromImage(
    img: HTMLImageElement,
    scale: number = 1
): ImageData {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
export async function isSpecialAvatar(name: string): Promise<boolean> {
    try {
        const res = await axios.get(`https://api.qoriginal.vip/qo/download/avatar?name=${name}`)
        return res.data.special === true
    } catch (e) {
        console.error('获取特殊头像信息失败', e)
        return false
    }
}

