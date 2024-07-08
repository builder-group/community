import { ServiceError, type TErrorCode } from '../../exceptions';

export function mapErrorToServiceError(
	error: unknown,
	errorCode: TErrorCode,
	message?: string
): ServiceError {
	if (error instanceof ServiceError) {
		return error;
	} else if (error instanceof Error) {
		return new ServiceError(errorCode, {
			description: message ?? error.message,
			throwable: error
		});
	}
	return new ServiceError(errorCode);
}
