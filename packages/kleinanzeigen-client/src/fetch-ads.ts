import { createApiFetchClient } from 'feature-fetch';

export async function fetchAds(options: TFetchAds = {}): Promise<TFetchAdsResult> {
	const {
		url = 'https://www.kleinanzeigen.de',
		query,
		location,
		radius,
		minPrice,
		maxPrice,
		page = 1
	} = options;

	const fetchClient = createApiFetchClient({
		prefixUrl: url
	});

	// Build path template and path params
	let pathTemplate = '';
	const pathParams: Record<string, string | number> = {};

	// Add price filter path
	if (minPrice != null || maxPrice != null) {
		pathTemplate += '/preis:{minPrice}:{maxPrice}';
		pathParams['minPrice'] = minPrice != null ? minPrice : '';
		pathParams['maxPrice'] = maxPrice != null ? maxPrice : '';
	}

	// Add page path
	if (page != null) {
		pathTemplate += '/s-seite:{page}';
		pathParams['page'] = page;
	}

	// Build query parameters
	const queryParams: Record<string, string | number> = {};
	if (query) {
		queryParams['keywords'] = query;
	}
	if (location) {
		queryParams['locationStr'] = location;
	}
	if (radius != null) {
		queryParams['radius'] = radius;
	}

	// Fetch the HTML
	const response = await fetchClient.get<string>(pathTemplate, {
		pathParams,
		queryParams,
		parseAs: 'text'
	});

	if (response.isErr()) {
		throw new Error(`Failed to fetch kleinanzeigen search: ${response.error.message}`);
	}

	// Build the final URL for reference
	const finalUrl = `${url}${pathTemplate}${Object.keys(queryParams).length > 0 ? '?' + new URLSearchParams(queryParams as Record<string, string>).toString() : ''}`;

	return {
		html: response.value.data,
		url: finalUrl
	};
}

export type TFetchAds = {
	url?: string;
	query?: string;
	location?: string;
	radius?: number;
	minPrice?: number;
	maxPrice?: number;
	page?: number;
};

export type TFetchAdsResult = {
	html: string;
	url: string;
};
