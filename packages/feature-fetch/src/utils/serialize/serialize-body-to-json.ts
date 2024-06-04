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
		return body as any; // TODO:
	}
}
