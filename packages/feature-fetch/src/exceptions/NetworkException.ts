import { ServiceException, type TErrorCode } from './ServiceException';

export class NetworkException extends ServiceException {
	constructor(code: TErrorCode, options: TNetworkExceptionOptions = {}) {
		const { throwable, description } = options;
		super(code, {
			message: `Call to endpoint failed with network exception${
				description != null ? `: ${description}` : '!'
			}`,
			throwable
		});
	}
}

interface TNetworkExceptionOptions {
	description?: string;
	throwable?: Error;
}
