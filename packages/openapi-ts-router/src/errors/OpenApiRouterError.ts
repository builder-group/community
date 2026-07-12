/** Base error for parse, schema, and validation failures raised by openapi-ts-router. */
export class OpenApiRouterError extends Error {
	public readonly code: TOpenApiRouterErrorCode;
	public readonly status: number | undefined;

	constructor(code: TOpenApiRouterErrorCode, options: TOpenApiRouterErrorOptions = {}) {
		const { cause, message, status } = options;
		super(formatOpenApiRouterErrorMessage(code, message, cause), { cause });
		this.name = new.target.name;
		this.code = code;
		this.status = status;

		// Note: captureStackTrace is V8-only, so keep it optional for browser runtimes
		(
			Error as ErrorConstructor & {
				captureStackTrace?: (targetObject: object, constructorOpt?: object) => void;
			}
		).captureStackTrace?.(this, new.target);
	}
}

/** Options used when creating an `OpenApiRouterError`. */
export interface TOpenApiRouterErrorOptions {
	/** Human-readable detail shown after the error code. */
	message?: string;
	/** Original error or value stored as `Error.cause`. */
	cause?: unknown;
	/** HTTP status associated with the error, when one is known. */
	status?: number;
}

/** Error code emitted by this package or a compatible extension. */
export type TOpenApiRouterErrorCode = TOpenApiRouterKnownErrorCode | `#ERR_OPENAPI_${string}`;

/** Error codes emitted by this package. */
export type TOpenApiRouterKnownErrorCode =
	'#ERR_OPENAPI_PARSE_BODY' | '#ERR_OPENAPI_SCHEMA' | '#ERR_OPENAPI_VALIDATION';

function formatOpenApiRouterErrorMessage(
	code: TOpenApiRouterErrorCode,
	message: string | undefined,
	cause: unknown
): string {
	const detail = message ?? getCauseMessage(cause) ?? 'OpenAPI router failed';
	return `[${code}] ${detail}`;
}

function getCauseMessage(cause: unknown): string | undefined {
	if (cause instanceof Error) {
		return cause.message;
	}
	if (typeof cause === 'string') {
		return cause;
	}
	return undefined;
}
