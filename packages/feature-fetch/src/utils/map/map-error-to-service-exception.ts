import { ServiceException, type TErrorCode } from '../../exceptions';

export function mapErrorToServiceException(
	error: unknown,
	errorCode: TErrorCode,
	message?: string
): ServiceException {
	if (error instanceof ServiceException) {
		return error;
	} else if (error instanceof Error) {
		return new ServiceException(errorCode, {
			message: message ?? error.message,
			throwable: error
		});
	}
	return new ServiceException(errorCode);
}
