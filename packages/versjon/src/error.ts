export class VersjonError extends Error {
	public readonly code: TVersjonErrorCode;

	public constructor(code: TVersjonErrorCode, options: TVersjonErrorOptions) {
		const { message, cause } = options;
		super(`[${code}] ${message}`, { cause });
		this.name = new.target.name;
		this.code = code;

		// Note: captureStackTrace is a V8-only extension and is unavailable in some browsers
		(
			Error as ErrorConstructor & {
				captureStackTrace?: (targetObject: object, constructorOpt?: object) => void;
			}
		).captureStackTrace?.(this, new.target);
	}
}

export interface TVersjonErrorOptions {
	message: string;
	cause?: unknown;
}

export type TVersjonErrorCode =
	| '#ERR_SCHEMA_DEFINITION'
	| '#ERR_SCHEMA_MIGRATION'
	| '#ERR_SCHEMA_REFERENCE'
	| '#ERR_SCHEMA_REGISTRY'
	| '#ERR_SCHEMA_VALUE';
