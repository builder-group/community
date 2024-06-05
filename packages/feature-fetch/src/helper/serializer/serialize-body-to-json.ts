import { ServiceException } from '../../exceptions';

export function serializeBodyToJson(body: unknown): string {
	try {
		return JSON.stringify(body);
	} catch (error) {
		throw new ServiceException('#ERR_SERIZALIZE_BODY', {
			message: 'Failed to serialize body to JSON string!',
			throwable: error instanceof Error ? error : undefined
		});
	}
}
