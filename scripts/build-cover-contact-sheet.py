import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


INTER_FONT = Path(__file__).resolve().parents[1] / "src/assets/Inter-VariableFont_opsz,wght.ttf"
CJK_FONT = Path("/System/Library/Fonts/Hiragino Sans GB.ttc")
LABEL_FONT = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
DARK_TEXT = (18, 20, 22)
LIGHT_TEXT = (245, 246, 247)


def load_font(size, use_cjk=False):
    font_path = CJK_FONT if use_cjk and CJK_FONT.exists() else INTER_FONT
    font = ImageFont.truetype(str(font_path), size)
    if font_path == INTER_FONT:
        axes = font.get_variation_axes()
        values = [axis["default"] for axis in axes]
        for index, axis in enumerate(axes):
            name = axis["name"].decode("utf-8").lower()
            if "weight" in name:
                values[index] = 550
            elif "optical" in name:
                values[index] = min(32, max(14, size))
        font.set_variation_by_axes(values)
    return font


def wrap_lines(text, font, draw, max_width):
    output = []
    for paragraph in text.splitlines():
        if not paragraph:
            output.append("")
            continue
        words = paragraph.split(" ")
        lines = []
        current = ""
        if len(words) > 1:
            for word in words:
                candidate = f"{current} {word}".strip()
                if current and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
                    lines.append(current)
                    current = word
                else:
                    current = candidate
            if current:
                lines.append(current)
        else:
            for character in paragraph:
                candidate = f"{current}{character}"
                if current and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
                    lines.append(current)
                    current = character
                else:
                    current = candidate
            if current:
                lines.append(current)
        output.extend(lines)
    return output


def fit_title(draw, text, width, height, use_cjk):
    max_width = width * 0.76
    max_size = max(16, min(112, int(height * 0.145), int(width * 0.09)))
    minimum_size = max(16, int(height * 0.055))
    for size in range(max_size, minimum_size - 1, -2):
        font = load_font(size, use_cjk)
        lines = wrap_lines(text, font, draw, max_width)
        line_height = size * 1.18
        if (
            len(lines) * line_height <= height * 0.72
            and all(draw.textbbox((0, 0), line, font=font)[2] <= max_width for line in lines)
        ):
            return font, lines, line_height
    font = load_font(minimum_size, use_cjk)
    lines = wrap_lines(text, font, draw, max_width)
    return font, lines, minimum_size * 1.18


def luminance(color):
    channels = []
    for value in color:
        normalized = value / 255
        channels.append(
            normalized / 12.92
            if normalized <= 0.04045
            else ((normalized + 0.055) / 1.055) ** 2.4
        )
    return sum(weight * channel for weight, channel in zip((0.2126, 0.7152, 0.0722), channels))


def minimum_contrast(samples, text_color):
    text_luminance = luminance(text_color)
    return min(
        (max(value, text_luminance) + 0.05) / (min(value, text_luminance) + 0.05)
        for value in samples
    )


def choose_text_color(image, lines, font, line_height, custom_color=None):
    if custom_color:
        return tuple(int(custom_color[index : index + 2], 16) for index in (1, 3, 5))

    draw = ImageDraw.Draw(image)
    widths = [draw.textbbox((0, 0), line, font=font)[2] for line in lines]
    text_width = max(widths, default=0)
    text_height = max(1, int(line_height * len(lines)))
    left = max(0, (image.width - text_width) // 2)
    top = max(0, (image.height - text_height) // 2)
    samples = []
    for row in range(3):
        for column in range(5):
            x = min(image.width - 1, int(left + (column + 0.5) * text_width / 5))
            y = min(image.height - 1, int(top + (row + 0.5) * text_height / 3))
            samples.append(luminance(image.getpixel((x, y))[:3]))
    return (
        DARK_TEXT
        if minimum_contrast(samples, DARK_TEXT) >= minimum_contrast(samples, LIGHT_TEXT)
        else LIGHT_TEXT
    )


def render_title(entry, sample, width, height, output_directory):
    raw = Path(entry["rawPath"]).read_bytes()
    image = Image.frombytes("RGB", (width, height), raw)
    text = sample["title"]
    use_cjk = any(ord(character) > 255 for character in text)
    measure = ImageDraw.Draw(image)
    font, lines, line_height = fit_title(measure, text, width, height, use_cjk)
    text_color = choose_text_color(image, lines, font, line_height, sample.get("color"))
    draw = ImageDraw.Draw(image)
    first_y = height / 2 - ((len(lines) - 1) * line_height) / 2
    for index, line in enumerate(lines):
        draw.text((width / 2, first_y + index * line_height), line, font=font, fill=text_color, anchor="mm")
    image.save(output_directory / sample["fileName"], "WEBP", quality=93, method=6)


def create_contact_sheet(entries, title_samples, rich_title_samples, width, height, output_directory):
    columns = 5
    margin = 18
    tile_width = 324
    image_width = 300
    image_height = round(image_width * height / width)
    tile_height = image_height + 43
    records = [
        {
            **entry,
            "label": f"style {entry['style']} · seed {entry['seed']}",
            "detail": f"composition {entry['composition']} · no title",
        }
        for entry in entries
    ]
    records.extend(
        {
            **sample["entry"],
            "fileName": sample["fileName"],
            "label": f"style {sample['entry']['style']} · seed {sample['entry']['seed']}",
            "detail": f"composition {sample['entry']['composition']} · {sample['variant']}",
        }
        for sample in title_samples
    )
    records.extend(
        {
            **sample,
            "label": f"style {sample['style']} · seed {sample['seed']}",
            "detail": f"composition {sample['composition']} · {sample['variant']}",
        }
        for sample in rich_title_samples
        if (output_directory / sample["fileName"]).exists()
    )
    rows = math.ceil(len(records) / columns)
    sheet = Image.new(
        "RGB",
        (margin + columns * (tile_width + margin), margin + rows * (tile_height + margin)),
        "#ECEFF1",
    )
    label_font = ImageFont.truetype(str(LABEL_FONT), 11) if LABEL_FONT.exists() else ImageFont.load_default()
    detail_font = ImageFont.truetype(str(LABEL_FONT), 10) if LABEL_FONT.exists() else ImageFont.load_default()
    draw = ImageDraw.Draw(sheet)

    for index, record in enumerate(records):
        x = margin + (index % columns) * (tile_width + margin)
        y = margin + (index // columns) * (tile_height + margin)
        draw.rounded_rectangle(
            (x, y, x + tile_width, y + tile_height),
            radius=8,
            fill="#FFFFFF",
            outline="#D8DEE2",
            width=1,
        )
        image = Image.open(output_directory / record["fileName"]).convert("RGB")
        image.thumbnail((image_width, image_height), Image.Resampling.LANCZOS)
        image_x = x + (tile_width - image.width) // 2
        sheet.paste(image, (image_x, y + 7))
        draw.text((x + 12, y + image_height + 15), record["label"], font=label_font, fill="#29333A")
        draw.text((x + 12, y + image_height + 30), record["detail"], font=detail_font, fill="#64717A")

    sheet.save(output_directory / "contact-sheet.webp", "WEBP", quality=91, method=6)
    return len(records)


def main(manifest_file):
    manifest = json.loads(Path(manifest_file).read_text())
    width = manifest["width"]
    height = manifest["height"]
    output_directory = Path(manifest["outputDirectory"])
    output_directory.mkdir(parents=True, exist_ok=True)

    for entry in manifest["entries"]:
        image = Image.frombytes("RGB", (width, height), Path(entry["rawPath"]).read_bytes())
        image.save(output_directory / entry["fileName"], "WEBP", quality=93, method=6)

    for sample in manifest["titleSamples"]:
        render_title(sample["entry"], sample, width, height, output_directory)

    count = create_contact_sheet(
        manifest["entries"],
        manifest["titleSamples"],
        manifest.get("richTitleSamples", []),
        width,
        height,
        output_directory,
    )
    print(
        f"Generated {len(manifest['entries'])} background covers, "
        f"{len(manifest['titleSamples'])} title covers, and {count} contact-sheet tiles."
    )
    print(output_directory / "contact-sheet.webp")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 build-cover-contact-sheet.py <manifest.json>")
    main(sys.argv[1])
