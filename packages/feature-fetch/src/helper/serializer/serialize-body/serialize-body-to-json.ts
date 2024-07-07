import { ServiceError } from '../../../exceptions';

export function serializeBodyToJson(body: unknown): string {
	try {
		return JSON.stringify(body);
	} catch (error) {
		throw new ServiceError('#ERR_SERIZALIZE_BODY', {
			description: 'Failed to serialize body to JSON string!',
			throwable: error instanceof Error ? error : undefined
		});
	}
}
