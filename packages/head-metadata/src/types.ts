import { type TXmlNode } from 'xml-tokenizer';

export type { TXmlNode } from 'xml-tokenizer';

/** Extractor that collects every non-null callback result in document order. */
export interface TCollectionExtractor<GValue = unknown> {
	type: 'collection';
	/** Selects an HTML element by its lowercase tag name. */
	tag: string;
	/** Returns the value to append, or `null` to skip this element. */
	callback: (node: TXmlNode) => GValue | null;
}

/** Extractor that keeps the first non-null callback result and skips later matches. */
export interface TSingleExtractor<GValue = unknown> {
	type: 'single';
	/** Selects an HTML element by its lowercase tag name. */
	tag: string;
	/** Returns the field value, or `null` to continue searching. */
	callback: (node: TXmlNode) => GValue | null;
}

export type TExtractor = TCollectionExtractor | TSingleExtractor;
export type TExtractors = Record<string, TExtractor>;
