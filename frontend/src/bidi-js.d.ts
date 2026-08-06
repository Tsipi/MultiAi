declare module "bidi-js" {
  export type BidiParagraph = { start: number; end: number; level: number };

  export type EmbeddingLevels = {
    levels: Uint8Array;
    paragraphs: BidiParagraph[];
  };

  export type Bidi = {
    getEmbeddingLevels(text: string, explicitDirection?: "ltr" | "rtl"): EmbeddingLevels;
    getReorderedString(text: string, embeddingLevels: EmbeddingLevels): string;
    getReorderedIndices(text: string, embeddingLevels: EmbeddingLevels): number[];
  };

  export default function bidiFactory(): Bidi;
}
