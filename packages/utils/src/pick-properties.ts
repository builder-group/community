/**
 * Extracts specified properties from an object.
 *
 * @param source - The source object to extract properties from.
 * @param properties - Array of property keys to extract.
 * @returns An object containing the specified properties of the source.
 */
export function pickProperties<TObject, TPropertyKeys extends keyof TObject>(
	source: TObject,
	properties: TPropertyKeys[],
	mapper?: (value: unknown) => { value: any } | false
): Pick<TObject, TPropertyKeys> {
	return properties.reduce<Partial<Pick<TObject, TPropertyKeys>>>((result, property) => {
		const value = source[property];
		if (mapper != null) {
			const newValue = mapper(value);
			if (newValue !== false) {
				result[property] = newValue.value;
			}
		} else {
			result[property] = value;
		}
		return result;
	}, {}) as Pick<TObject, TPropertyKeys>;
}
