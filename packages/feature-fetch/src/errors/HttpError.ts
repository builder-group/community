// Note: Import directly to avoid circular dependencies
import { getCauseMessage } from '../lib/get-cause-message';
import { FetchError, type TFetchErrorCode } from './FetchError';

/** Represents a completed HTTP response with a non-OK status. */
export class HttpError<GData = unknown> extends FetchError {
	public readonly status: number;
	public readonly statusText: string;
	public readonly response: Response;
	public readonly data?: GData;

	constructor(response: Response, options: THttpErrorOptions<GData> = {}) {
		const { code = '#ERR_HTTP_STATUS', message, cause, data } = options;
		super(code, {
			message: formatHttpErrorMessage(response, message, cause),
			cause
		});
		this.status = response.status;
		this.statusText = response.statusText;
		this.response = response;
		this.data = data;
	}
}

export interface THttpErrorOptions<GData = unknown> {
	code?: TFetchErrorCode;
	message?: string;
	cause?: unknown;
	data?: GData;
}

function formatHttpErrorMessage(
	response: Response,
	message: string | undefined,
	cause: unknown
): string {
	const hasStatusText = response.statusText.length > 0;
	const status = hasStatusText
		? `${response.status.toString()} ${response.statusText}`
		: response.status.toString();
	const baseMessage = `HTTP request failed with status ${status}`;
	const detail = message ?? getCauseMessage(cause);
	return detail != null ? `${baseMessage}: ${detail}` : baseMessage;
}

export function hasStatusCode(error: unknown, statusCode: number): boolean {
	if (error instanceof HttpError) {
		return error.status === statusCode;
	}
	if (isObject(error) && typeof error['status'] === 'number') {
		return error['status'] === statusCode;
	}
	return false;
}

export async function mapResponseToHttpError(
	response: Response,
	code: TFetchErrorCode = '#ERR_HTTP_STATUS'
): Promise<HttpError> {
	try {
		// Note: Read from a clone so callers can still inspect error.response
		const errorText = await response.clone().text();
		if (!errorText.length) {
			return new HttpError(response, {
				code
			});
		}

		const errorData = parseResponseErrorData(response, errorText);
		const errorMessage = getErrorMessage(errorData);

		return new HttpError(response, {
			code,
			message: errorMessage,
			data: errorData
		});
	} catch (error) {
		return new HttpError(response, {
			code,
			message: 'Failed to process error response',
			cause: error
		});
	}
}

function parseResponseErrorData(response: Response, errorText: string): unknown {
	const mediaType = response.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() ?? '';

	const isJsonMediaType = mediaType === 'application/json' || mediaType.endsWith('+json');
	if (isJsonMediaType) {
		try {
			return JSON.parse(errorText);
		} catch {
			// Keep invalid JSON error bodies as text
		}
	}

	return errorText;
}

function getErrorMessage(data: unknown): string | undefined {
	if (typeof data === 'string') {
		return data;
	}
	if (!isObject(data)) {
		return undefined;
	}

	return (
		getErrorMessageField(data['message']) ??
		getErrorMessageField(data['detail']) ??
		getErrorMessageField(data['title']) ??
		getErrorMessageField(data['error'])
	);
}

function getErrorMessageField(value: unknown): string | undefined {
	if (typeof value === 'string') {
		return value;
	}
	if (value != null && typeof value !== 'object') {
		return String(value);
	}
	return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value != null;
}
