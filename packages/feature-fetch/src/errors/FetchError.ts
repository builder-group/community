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

/** Feature-fetch error code. Known package codes are suggested while custom `#ERR_` codes keep extension points flexible. */
export type TFetchErrorCode = TFetchKnownErrorCode | `#ERR_${string}`;

/** Error codes emitted by feature-fetch itself. */
export type TFetchKnownErrorCode =
	| '#ERR_BUILD_URL'
	| '#ERR_FETCH_MIDDLEWARE'
	| '#ERR_GRAPHQL_OPERATION'
	| '#ERR_GRAPHQL_PRINT'
	| '#ERR_HTTP_STATUS'
	| '#ERR_MISSING_FETCH'
	| '#ERR_NETWORK'
	| '#ERR_PARSE_RESPONSE_DATA'
	| '#ERR_PREPARE_REQUEST'
	| '#ERR_PREPARE_RESPONSE'
	| '#ERR_SERIALIZE_BODY'
	| '#ERR_SERIALIZE_PARAMS';

function formatFetchErrorMessage(
	code: TFetchErrorCode,
	message: string | undefined,
	cause: unknown
): string {
	const detail = message ?? getCauseMessage(cause) ?? 'Feature fetch failed';
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
