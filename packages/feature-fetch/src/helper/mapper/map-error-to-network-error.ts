import { NetworkError, type TErrorCode } from '../../exceptions';

export function mapErrorToNetworkError(
	error: unknown,
	errorCode: TErrorCode = '#ERR_NETWORK'
): NetworkError {
	if (error instanceof Error) {
		return new NetworkError(errorCode, {
			throwable: error,
			description: error.message
		});
	}
	return new NetworkError(errorCode);
}
