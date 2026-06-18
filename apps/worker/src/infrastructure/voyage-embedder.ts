export class VoyageEmbedder {
  private static readonly MODEL = "voyage-large-2";

  constructor(private readonly apiKey: string | undefined) {}

  async embedDocument(text: string): Promise<readonly number[] | null> {
    return this.embed(text, "document");
  }

  async embedQuery(text: string): Promise<readonly number[] | null> {
    return this.embed(text, "query");
  }

  private async embed(text: string, inputType: "document" | "query"): Promise<readonly number[] | null> {
    if (this.apiKey === undefined || this.apiKey.length === 0) {
      return null;
    }

    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: [text],
        model: VoyageEmbedder.MODEL,
        input_type: inputType
      })
    });

    if (!response.ok) {
      throw new Error(`Voyage embedding failed: ${response.status}`);
    }

    const json = await response.json() as { readonly data?: readonly { readonly embedding?: readonly number[] }[] };
    return json.data?.[0]?.embedding ?? null;
  }
}
