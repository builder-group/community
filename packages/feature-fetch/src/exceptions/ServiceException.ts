export class ServiceException extends Error {
	public readonly code: string;
	public readonly throwable?: Error;

	constructor(code: TErrorCode, options: TServiceExceptionOptions = {}) {
		const { message } = options;
		super(message != null ? `[${code}] ${message}` : code);
		this.code = code;
	}
}

interface TServiceExceptionOptions {
	message?: string;
	throwable?: Error;
}

export type TErrorCode = `#ERR_${string}`;
