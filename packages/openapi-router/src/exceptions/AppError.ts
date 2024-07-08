export class AppError extends Error {
	public readonly code: TErrorCode;
	public readonly throwable?: Error;
	public readonly status: number;
	public readonly uri?: string;
	public readonly additionalErrors: Record<string, unknown>[] = [];

	constructor(code: TErrorCode, status: number, options: TAppErrorOptions = {}) {
		const {
			additionalErrors = [],
			description = options.throwable?.message,
			throwable,
			uri
		} = options;
		super(description != null ? `[${code}] ${description}` : code);
		this.code = code;
		this.throwable = throwable;
		this.status = status;
		this.uri = uri;
		this.additionalErrors = additionalErrors;

		// https://stackoverflow.com/questions/59625425/understanding-error-capturestacktrace-and-stack-trace-persistance
		Error.captureStackTrace(this);
	}
}

export interface TAppErrorOptions {
	description?: string;
	throwable?: Error;
	uri?: string;
	additionalErrors?: Record<string, unknown>[];
}

export type TErrorCode = `#ERR_${string}`;
