import type { TCollectionExtractor } from '../types';

/** Extracts link relationships and resource details from each `<link>` element. */
export const linkExtractor = {
	type: 'collection',
	tag: 'link',
	callback: (node): TLinkMetadata | null => {
		const rel = node.attributes.find((attribute) => attribute.local === 'rel');
		const href = node.attributes.find((attribute) => attribute.local === 'href');
		if (rel == null || href == null) {
			return null;
		}

		const type = node.attributes.find((attribute) => attribute.local === 'type');
		const sizes = node.attributes.find((attribute) => attribute.local === 'sizes');
		const media = node.attributes.find((attribute) => attribute.local === 'media');
		const hreflang = node.attributes.find((attribute) => attribute.local === 'hreflang');
		return {
			rel: splitTokens(rel.value, true),
			href: href.value,
			...(type != null ? { type: type.value } : {}),
			...(sizes != null ? { sizes: splitTokens(sizes.value) } : {}),
			...(media != null ? { media: media.value } : {}),
			...(hreflang != null ? { hreflang: hreflang.value } : {})
		};
	}
} satisfies TCollectionExtractor<TLinkMetadata>;

/** Link relationship and resource attributes extracted from a `<link>` element. */
export interface TLinkMetadata {
	/** Lowercase relationship tokens from `rel`. */
	rel: string[];
	/** Unresolved resource URL from `href`. */
	href: string;
	/** Resource media type. */
	type?: string;
	/** Resource size tokens from `sizes`. */
	sizes?: string[];
	/** Media query that controls when the link applies. */
	media?: string;
	/** Language of the linked resource. */
	hreflang?: string;
}

function splitTokens(value: string, lowercase: boolean = false): string[] {
	return value
		.split(/[\t\n\f\r ]+/)
		.filter((token) => token.length > 0)
		.map((token) => (lowercase ? token.toLowerCase() : token));
}
