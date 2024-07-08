import { ServiceError, type TErrorCode } from './ServiceError';

export class NetworkError extends ServiceError {
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
