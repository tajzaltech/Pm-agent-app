from pathlib import Path

import fitz
from PIL import Image, ImageDraw


PDF_PATH = Path("deliverables/PM-Agent-MVP-PRD-v1.0.pdf")
OUT_DIR = Path("deliverables/prd_pdf_preview")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def main():
    document = fitz.open(PDF_PATH)
    page_paths = []
    for index, page in enumerate(document, start=1):
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        path = OUT_DIR / f"page-{index:02d}.png"
        pixmap.save(path)
        page_paths.append(path)

    thumb_width = 600
    gap = 24
    label_height = 30
    for sheet_index in range(0, len(page_paths), 4):
        paths = page_paths[sheet_index : sheet_index + 4]
        thumbs = []
        for path in paths:
            image = Image.open(path).convert("RGB")
            ratio = thumb_width / image.width
            thumb = image.resize((thumb_width, int(image.height * ratio)))
            thumbs.append(thumb)

        tile_height = max(image.height for image in thumbs) + label_height
        sheet = Image.new("RGB", (thumb_width * 2 + gap * 3, tile_height * 2 + gap * 3), "#DDE3EA")
        draw = ImageDraw.Draw(sheet)
        for offset, image in enumerate(thumbs):
            row, column = divmod(offset, 2)
            x = gap + column * (thumb_width + gap)
            y = gap + row * (tile_height + gap)
            page_number = sheet_index + offset + 1
            draw.text((x, y), f"PAGE {page_number}", fill="#1E293B")
            sheet.paste(image, (x, y + label_height))

        sheet_path = OUT_DIR / f"contact-{sheet_index // 4 + 1:02d}.png"
        sheet.save(sheet_path)
        print(sheet_path)


if __name__ == "__main__":
    main()
