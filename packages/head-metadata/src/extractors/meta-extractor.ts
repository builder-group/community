import type { TCollectionExtractor } from '../types';

/** Extracts supported attributes from each `<meta>` element. */
export const metaExtractor = {
	type: 'collection',
	tag: 'meta',
	callback: (node): TMetaMetadata | null => {
		const metadata: TMetaMetadata = {};
		for (const { local, value } of node.attributes) {
			switch (local) {
				case 'charset':
				case 'name':
				case 'property':
				case 'content':
					metadata[local] ??= value;
					break;
				case 'http-equiv':
					metadata.httpEquiv ??= value;
					break;
			}
		}
		return Object.keys(metadata).length > 0 ? metadata : null;
	}
} satisfies TCollectionExtractor<TMetaMetadata>;

/** Supported attributes extracted from a `<meta>` element. */
export interface TMetaMetadata {
	/** Declared document character encoding. */
	charset?: string;
	/** Metadata name, such as `description` or `twitter:card`. */
	name?: string;
	/** Metadata property, such as `og:title` or `og:image`. */
	property?: string;
	/** HTTP header name supplied through `http-equiv`. */
	httpEquiv?: string;
	/** Metadata value. */
	content?: string;
}
