import { isObject } from '@blgc/utils';
import { RequestError, type TErrorCode } from '../../exceptions';

export async function mapResponseToRequestError(
	response: Response,
	defaultErrorCode: TErrorCode = '#ERR_UNKOWN'
): Promise<RequestError> {
	try {
		const contentType = response.headers.get('Content-Type');

		let errorData: unknown;
		let errorCode: TErrorCode;
		let errorDescription: string | undefined;
		if (contentType?.includes('application/json')) {
			errorData = await response.json();
			errorCode = getErrorCode(errorData) ?? defaultErrorCode;
			errorDescription = getErrorDescription(errorData) ?? undefined;
		} else {
			errorData = await response.text();
			errorCode = defaultErrorCode;
			errorDescription = errorData as string;
		}

		return new RequestError(errorCode, response.status, {
			description: errorDescription,
			data: errorData,
			response
		});
	} catch (error) {
		return new RequestError(defaultErrorCode, response.status, {
			description: 'Error processing response',
			data: error,
			response
		});
	}
}

// Helper function to extract error description from various possible fields
function getErrorDescription(data: unknown): string | null {
	if (isObject(data)) {
		const message = getObjectString(data['message']);
		const detail = getObjectString(data['detail']);
		const title = getObjectString(data['title']);
		const error = getObjectString(data['error']);
		return message ?? detail ?? title ?? error ?? null;
	}
	return null;
}

// Helper function to extract error code from various possible fields
function getErrorCode(data: unknown): TErrorCode | null {
	if (isObject(data)) {
		const errorCode = getErrorCodeValue(data['error_code']);
		const code = getErrorCodeValue(data['code']);
		const nestedError = getErrorCode(data['error']);
		return errorCode ?? code ?? nestedError ?? null;
	}
	return null;
}

function getObjectString(value: unknown): string | null {
	if (typeof value === 'string') {
		return value;
	}
	if (value != null && typeof value !== 'object') {
		return String(value);
	}
	return null;
}

function getErrorCodeValue(value: unknown): TErrorCode | null {
	return typeof value === 'string' ? (value as TErrorCode) : null;
}
