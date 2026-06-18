import { PDFParse } from "pdf-parse";

export class PdfExtractor {
  async extractFromUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`PDF download failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("pdf") && !url.toLowerCase().endsWith(".pdf")) {
      return "";
    }

    const parser = new PDFParse({ data: Buffer.from(await response.arrayBuffer()) });
    try {
      const parsed = await parser.getText();
      return parsed.text.trim();
    } finally {
      await parser.destroy();
    }
  }
}
