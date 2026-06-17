from pathlib import Path

import fitz


PDF_PATH = Path("deliverables/PM-Agent-How-It-Works.pdf")
OUT_DIR = Path("deliverables/pm_agent_pdf_preview")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def main():
    doc = fitz.open(PDF_PATH)
    for index, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        out = OUT_DIR / f"page-{index:02d}.png"
        pix.save(out)
        print(out)


if __name__ == "__main__":
    main()
