/**
 * Generates a 16-character unique identifier.
 *
 * @returns A string representation of the generated identifier.
 */
export function shortId(pattern = 'xxxxxxxxxxxxxxxx'): string {
	return pattern.replace(/[x]/g, () => {
		const r = (Math.random() * 16) | 0;
		return r.toString(16);
	});
}
