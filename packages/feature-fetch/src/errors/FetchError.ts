// Note: Import directly to avoid circular dependencies
import { getCauseMessage } from '../lib/get-cause-message';

/** Base error for feature-fetch client, middleware, parsing, and serialization failures. */
export class FetchError extends Error {
	public readonly code: TFetchErrorCode;

	constructor(code: TFetchErrorCode, options: TFetchErrorOptions = {}) {
		const { message, cause } = options;
		super(formatFetchErrorMessage(code, message, cause), { cause });
		this.name = new.target.name;
		this.code = code;

		// Note: captureStackTrace is V8-only, so keep it optional for browser runtimes
		(
			Error as ErrorConstructor & {
				captureStackTrace?: (targetObject: object, constructorOpt?: object) => void;
			}
		).captureStackTrace?.(this, new.target);
	}
}

export interface TFetchErrorOptions {
	message?: string;
	cause?: unknown;
}

/** Feature-fetch error code format. */
export type TFetchErrorCode = `#ERR_${string}`;

function formatFetchErrorMessage(
	code: TFetchErrorCode,
	message: string | undefined,
	cause: unknown
): string {
	const baseMessage = 'Feature fetch failed';
	const detail = message ?? getCauseMessage(cause) ?? baseMessage;
	return `[${code}] ${detail}`;
}

/** Maps an unknown thrown value to `FetchError` unless it already is one. */
export function mapErrorToFetchError(
	error: unknown,
	code: TFetchErrorCode,
	message?: string
): FetchError {
	if (error instanceof FetchError) {
		return error;
	}

	const causeMessage = getCauseMessage(error);
	const mappedMessage =
		message != null && causeMessage != null && causeMessage !== message
			? `${message}: ${causeMessage}`
			: message;

	return new FetchError(code, {
		message: mappedMessage,
		cause: error
	});
}
