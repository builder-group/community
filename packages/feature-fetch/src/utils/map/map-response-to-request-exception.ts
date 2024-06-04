import { isObject } from '@ibg/utils';

import { RequestException, type TErrorCode } from '../../exceptions';

export async function mapResponseToRequestException(
	response: Response,
	defaultErrorCode: TErrorCode = '#ERR_UNKOWN'
): Promise<RequestException> {
	try {
		const contentType = response.headers.get('Content-Type');

		let errorData: any;
		let errorCode: TErrorCode;
		let errorDescription: string | undefined;
		if (contentType && contentType.includes('application/json')) {
			errorData = await response.json();
			errorCode = getErrorCode(errorData) ?? defaultErrorCode;
			errorDescription = getErrorDescription(errorData) ?? undefined;
		} else {
			errorData = await response.text();
			errorCode = defaultErrorCode;
			errorDescription = errorData;
		}

		return new RequestException(errorCode, response.status, {
			description: errorDescription,
			data: errorData,
			response
		});
	} catch (error) {
		return new RequestException(defaultErrorCode, response.status, {
			description: 'Error processing response',
			data: error as any,
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
