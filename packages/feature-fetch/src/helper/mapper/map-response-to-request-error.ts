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
		return data.error_description || data.error?.toString() || data.message || null;
	}
	return null;
}

// Helper function to extract error code from various possible fields
function getErrorCode(data: unknown): TErrorCode | null {
	if (isObject(data)) {
		return data.error_code || data.status || data.code || getErrorCode(data.error) || null;
	}
	return null;
}
