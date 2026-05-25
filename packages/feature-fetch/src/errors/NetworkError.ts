// Note: Import directly to avoid circular dependencies
import { getCauseMessage } from '../lib/get-cause-message';
import { FetchError, type TFetchErrorCode } from './FetchError';

/** Represents a failure where fetch did not produce an HTTP response. */
export class NetworkError extends FetchError {
	constructor(options: TNetworkErrorOptions = {}) {
		const { code = '#ERR_NETWORK', cause, message } = options;
		super(code, {
			message: formatNetworkErrorMessage(message, cause),
			cause
		});
	}
}

export interface TNetworkErrorOptions {
	code?: TFetchErrorCode;
	message?: string;
	cause?: unknown;
}

function formatNetworkErrorMessage(message: string | undefined, cause: unknown): string {
	const baseMessage = 'Network request failed before receiving an HTTP response';
	const detail = message ?? getCauseMessage(cause);
	return detail != null ? `${baseMessage}: ${detail}` : baseMessage;
}

export function mapErrorToNetworkError(
	error: unknown,
	code: TFetchErrorCode = '#ERR_NETWORK'
): NetworkError {
	if (error instanceof NetworkError) {
		return error;
	}
	return new NetworkError({
		code,
		cause: error
	});
}
