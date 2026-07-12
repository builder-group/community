import type { ClientErrorStatusCode, ServerErrorStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
	public readonly code: TAppErrorCode;
	public readonly status: TAppErrorStatus;
	public readonly title: string;
	public readonly detail: string;
	public readonly type: string;
	public readonly errors: TAppErrorDetail[] | undefined;

	constructor(code: TAppErrorCode, options: TAppErrorOptions) {
		const { status, title, detail = title, type = 'about:blank', errors, cause } = options;
		super(`[${code}] ${detail}`, { cause });

		this.name = new.target.name;
		this.code = code;
		this.status = status;
		this.title = title;
		this.detail = detail;
		this.type = type;
		this.errors = errors;
	}
}

export type TAppErrorCode = `#ERR_${string}`;

export interface TAppErrorOptions {
	status: TAppErrorStatus;
	title: string;
	detail?: string;
	type?: string;
	errors?: TAppErrorDetail[];
	cause?: unknown;
}

export type TAppErrorStatus = ClientErrorStatusCode | ServerErrorStatusCode;

export interface TAppErrorDetail {
	source: TAppErrorSource;
	path: Array<string | number>;
	detail: string;
}

export type TAppErrorSource = 'body' | 'path' | 'query' | 'header' | 'cookie';
