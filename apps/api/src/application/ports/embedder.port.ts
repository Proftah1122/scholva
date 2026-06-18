export interface IEmbedderPort {
  embedDocument(text: string): Promise<readonly number[]>;
  embedQuery(query: string): Promise<readonly number[]>;
}
