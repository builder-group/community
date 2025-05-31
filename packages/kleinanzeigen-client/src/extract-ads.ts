import { extract, type TExtractor } from 'xml-tokenizer';

export type TListingData = {
	id: string;
	title?: string;
	description?: string;
	location?: string;
	date?: string;
	price?: number;
	currency?: string;
	priceText?: string;
	imageUrl?: string;
	tags?: string[];
	jsonLd?: any;
};

const elementTracker = {
	context: {
		elementPath: [] as string[],
		currentElement: '',
		currentClasses: [] as string[]
	},
	extract: (token, cx) => {
		if (token.type === 'ElementStart') {
			cx.elementPath.push(token.local);
			cx.currentElement = token.local;
			cx.currentClasses = [];
		} else if (token.type === 'Attribute' && token.local === 'class') {
			cx.currentClasses = token.value.split(' ').filter((cls) => cls.trim());
		} else if (token.type === 'ElementEnd' && token.end.type === 'Close') {
			cx.elementPath.pop();
			cx.currentElement = cx.elementPath[cx.elementPath.length - 1] || '';
		}
	}
} satisfies TExtractor;

const listingTracker = {
	context: {
		listings: [] as TListingData[],
		currentListing: null as Partial<TListingData> | null
	},
	deps: [elementTracker],
	extract: (token, cx) => {
		if (token.type === 'ElementStart' && token.local === 'article') {
			cx.currentListing = {};
		} else if (token.type === 'Attribute' && token.local === 'data-adid' && cx.currentListing) {
			cx.currentListing.id = token.value;
		} else if (
			token.type === 'ElementEnd' &&
			token.end.type === 'Close' &&
			token.end.local === 'article' &&
			cx.currentListing?.id
		) {
			cx.listings.push(cx.currentListing as TListingData);
			cx.currentListing = null;
		}
	}
} satisfies TExtractor;

const titleExtractor = {
	context: {},
	deps: [elementTracker, listingTracker],
	extract: (token, cx) => {
		if (token.type === 'Text' && cx.currentListing && token.text.trim()) {
			if (cx.currentElement === 'a' && cx.currentClasses.includes('ellipsis')) {
				cx.currentListing.title = token.text.trim();
			}
		}
	}
} satisfies TExtractor;

const descriptionExtractor = {
	context: {},
	deps: [elementTracker, listingTracker],
	extract: (token, cx) => {
		if (token.type === 'Text' && cx.currentListing && token.text.trim()) {
			if (cx.currentClasses.some((cls) => cls.includes('aditem-main--middle--description'))) {
				cx.currentListing.description = token.text.trim();
			}
		}
	}
} satisfies TExtractor;

const locationDateExtractor = {
	context: { insideIcon: false },
	deps: [elementTracker, listingTracker],
	extract: (token, cx) => {
		if (token.type === 'ElementStart' && token.local === 'i') {
			cx.insideIcon = true;
		} else if (
			token.type === 'ElementEnd' &&
			token.end.type === 'Close' &&
			token.end.local === 'i'
		) {
			cx.insideIcon = false;
		} else if (token.type === 'Text' && cx.currentListing && token.text.trim() && !cx.insideIcon) {
			const text = token.text.trim();

			if (
				cx.currentClasses.some((cls) => cls.includes('aditem-main--top--left')) &&
				/\d{5}/.test(text)
			) {
				cx.currentListing.location = text.replace(/^[^a-zA-Z0-9]*/, '').trim();
			} else if (
				cx.currentClasses.some((cls) => cls.includes('aditem-main--top--right')) &&
				(text.includes('Heute') || /\d{2}:\d{2}/.test(text) || /\d{2}\.\d{2}\.\d{4}/.test(text))
			) {
				cx.currentListing.date = text;
			}
		}
	}
} satisfies TExtractor;

const priceExtractor = {
	context: { insideIcon: false },
	deps: [elementTracker, listingTracker],
	extract: (token, cx) => {
		if (token.type === 'ElementStart' && token.local === 'i') {
			cx.insideIcon = true;
		} else if (
			token.type === 'ElementEnd' &&
			token.end.type === 'Close' &&
			token.end.local === 'i'
		) {
			cx.insideIcon = false;
		} else if (token.type === 'Text' && cx.currentListing && token.text.trim() && !cx.insideIcon) {
			const text = token.text.trim();

			if (
				cx.currentClasses.some((cls) => cls.includes('aditem-main--middle--price-shipping--price'))
			) {
				cx.currentListing.priceText = text;
				const priceInfo = parsePrice(text);
				cx.currentListing.price = priceInfo.amount;
				cx.currentListing.currency = priceInfo.currency;
			}
		}
	}
} satisfies TExtractor;

const imageExtractor = {
	context: {},
	deps: [elementTracker, listingTracker],
	extract: (token, cx) => {
		if (
			token.type === 'Attribute' &&
			token.local === 'src' &&
			cx.currentElement === 'img' &&
			cx.currentListing &&
			!cx.currentListing.imageUrl
		) {
			if (token.value.includes('img.kleinanzeigen.de')) {
				cx.currentListing.imageUrl = token.value;
			}
		}
	}
} satisfies TExtractor;

const tagExtractor = {
	context: { insideIcon: false, inTagWithIcon: false },
	deps: [elementTracker, listingTracker],
	extract: (token, cx) => {
		if (token.type === 'ElementStart' && token.local === 'i') {
			cx.insideIcon = true;
		} else if (
			token.type === 'ElementEnd' &&
			token.end.type === 'Close' &&
			token.end.local === 'i'
		) {
			cx.insideIcon = false;
		} else if (
			token.type === 'ElementEnd' &&
			token.end.type === 'Close' &&
			token.end.local === 'span'
		) {
			cx.inTagWithIcon = false;
		} else if (
			token.type === 'Attribute' &&
			token.local === 'class' &&
			cx.currentElement === 'span'
		) {
			const classes = token.value.split(' ');
			if (classes.includes('tag-with-icon')) {
				cx.inTagWithIcon = true;
			}
		} else if (token.type === 'Text' && cx.currentListing && token.text.trim()) {
			const text = token.text.trim();

			if (
				cx.currentElement === 'span' &&
				cx.currentClasses.includes('simpletag') &&
				text.length > 2 &&
				/[a-zA-Z]/.test(text)
			) {
				if ((cx.inTagWithIcon && !cx.insideIcon) || !cx.inTagWithIcon) {
					if (!cx.currentListing.tags) cx.currentListing.tags = [];
					cx.currentListing.tags.push(text);
				}
			}
		}
	}
} satisfies TExtractor;

const jsonLdExtractor = {
	context: { insideScript: false, scriptContent: '' },
	deps: [elementTracker, listingTracker],
	extract: (token, cx) => {
		if (token.type === 'ElementStart' && token.local === 'script') {
			cx.insideScript = false;
			cx.scriptContent = '';
		} else if (
			token.type === 'Attribute' &&
			token.local === 'type' &&
			cx.currentElement === 'script' &&
			token.value === 'application/ld+json'
		) {
			cx.insideScript = true;
		} else if (token.type === 'Text' && cx.insideScript) {
			cx.scriptContent += token.text;
		} else if (
			token.type === 'ElementEnd' &&
			token.end.type === 'Close' &&
			token.end.local === 'script' &&
			cx.insideScript &&
			cx.scriptContent.trim() &&
			cx.currentListing
		) {
			try {
				const jsonData = JSON.parse(cx.scriptContent.trim());
				if (jsonData['@type'] === 'ImageObject') {
					cx.currentListing.jsonLd = jsonData;
					if (!cx.currentListing.title && jsonData.title) {
						cx.currentListing.title = jsonData.title;
					}
					if (!cx.currentListing.description && jsonData.description) {
						cx.currentListing.description = jsonData.description;
					}
					if (!cx.currentListing.imageUrl && jsonData.contentUrl) {
						cx.currentListing.imageUrl = jsonData.contentUrl;
					}
				}
			} catch (e) {
				// Ignore JSON parse errors
			}
			cx.insideScript = false;
			cx.scriptContent = '';
		}
	}
} satisfies TExtractor;

export function extractAdsData(html: string): TListingData[] {
	const result = extract(html, [
		elementTracker,
		listingTracker,
		titleExtractor,
		descriptionExtractor,
		locationDateExtractor,
		priceExtractor,
		imageExtractor,
		tagExtractor,
		jsonLdExtractor
	]);

	return result.listings;
}

function parsePrice(priceText: string): { amount?: number; currency: string } {
	const cleanText = priceText.replace(/\s*(VB|Verhandlungsbasis)\s*$/i, '').trim();
	const currency = cleanText.includes('€') ? 'EUR' : 'USD';

	const numberMatch = cleanText.match(/[\d.]+/);
	if (numberMatch) {
		const numberStr = numberMatch[0];
		const amount = parseFloat(numberStr.replace(/\./g, ''));
		return { amount, currency };
	}

	return { currency };
}
