import { FetchError, type TErrorCode } from './FetchError';

export class NetworkError extends FetchError {
	constructor(code: TErrorCode, options: TNetworkErrorOptions = {}) {
		const { throwable, description } = options;
		super(code, {
			description: `Call to endpoint failed with network exception${
				description != null ? `: ${description}` : '!'
			}`,
			throwable
		});
	}
}

interface TNetworkErrorOptions {
	description?: string;
	throwable?: Error;
}
