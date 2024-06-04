import { NetworkException, type TErrorCode } from '../../exceptions';

export function mapErrorToNetworkException(
	error: unknown,
	errorCode: TErrorCode = '#ERR_NETWORK'
): NetworkException {
	if (error instanceof Error) {
		return new NetworkException(errorCode, {
			throwable: error,
			description: error.message
		});
	}
	return new NetworkException(errorCode);
}
