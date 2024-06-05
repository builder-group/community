import Url from 'url-parse';

import { mapErrorToServiceException } from '../mapper';

export function parseAndValidateUrl(
	urlString: string,
	withSuffix = false
): {
	path: `/${string}`;
	origin: string;
} {
	try {
		const url = new Url(urlString);
		return {
			path: `${url.pathname}${withSuffix ? `${url.query}${url.hash}` : ''}` as `/${string}`,
			origin: url.origin
		};
	} catch (error) {
		throw mapErrorToServiceException(error, '#ERR_PARSE_URL', `Failed to parse url: ${urlString}`);
	}
}
