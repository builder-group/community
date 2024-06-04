export class AppError extends Error {
	/**
	 * HTTP status code associated with the error, indicating the nature of the failure.
	 */
	public readonly status: number;

	/**
	 * A short, unique error code for identifying the error type.
	 */
	public readonly code: TErrorCode;

	/**
	 * A detailed, human-readable description of the error. Provides additional context
	 * and, if applicable, steps to resolve the issue.
	 */
	public readonly description?: string;

	/**
	 * An optional URI linking to a document or resource with more information about the error.
	 */
	public readonly uri?: string;

	/**
	 * An array of additional error details or nested errors that occurred during the process.
	 */
	public readonly additionalErrors: Record<string, unknown>[] = [];

	constructor(status: number, code: TErrorCode, options: TAppErrorOptions = {}) {
		const { additionalErrors = [], description, uri } = options;
		super(`Error [${code}]: ${description || 'An error occurred'}.`);

		// Set the prototype explicity
		Object.setPrototypeOf(this, new.target.prototype);

		this.code = code;
		this.name = Error.name;
		this.status = status;
		this.uri = uri;
		this.description = description;
		this.additionalErrors = additionalErrors;

		// https://stackoverflow.com/questions/59625425/understanding-error-capturestacktrace-and-stack-trace-persistance
		Error.captureStackTrace(this);
	}
}

export interface TAppErrorOptions {
	uri?: string;
	description?: string;
	additionalErrors?: Record<string, unknown>[];
}

export type TErrorCode = `#ERR_${string}`;
