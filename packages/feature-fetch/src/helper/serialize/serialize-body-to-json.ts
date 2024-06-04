import { ServiceException } from '../../exceptions';

/**
 * Serializes an object into a JSON string.
 *
 * @param body - An object to be serialized
 * @returns - Returns serialized JSON string
 */
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
