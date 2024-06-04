import URL from 'url-parse';

import { mapErrorToServiceException } from '../map';

export function parseAndValidateUrl(
	urlString: string,
	withSuffix = false
): {
	path: `/${string}`;
	origin: string;
} {
	try {
		const url = new URL(urlString);
		return {
			path: `${url.pathname}${withSuffix ? url.query + url.hash : ''}` as `/${string}`,
			origin: url.origin
		};
	} catch (error) {
		throw mapErrorToServiceException(
			error,
			'#ERR_RESOLVE_URL',
			`Failed to resolve url: ${urlString}`
		);
	}
}
