import { FetchError, type TErrorCode } from '../../exceptions';

export function mapErrorToFetchError(
	error: unknown,
	errorCode: TErrorCode,
	message?: string
): FetchError {
	if (error instanceof FetchError) {
		return error;
	} else if (error instanceof Error) {
		return new FetchError(errorCode, {
			description: message ?? error.message,
			throwable: error
		});
	}
	return new FetchError(errorCode);
}
