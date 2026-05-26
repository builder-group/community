/**
 * Performs a shallow merge of two objects.
 * Optionally allows overwriting undefined properties in the target object with values from the source.
 *
 * @param target - The target object to be merged.
 * @param source - The source object for the merge.
 * @param overwriteUndefinedProperties - Flag to overwrite 'undefined' properties in the target.
 * @returns A new object that is a shallow merge of the target and source objects.
 */
export function shallowMerge<
	TTarget extends Record<string, unknown>,
	TSource extends Record<string, unknown>
>(target: TTarget, source: TSource, overwriteUndefinedProperties = true): TTarget & TSource {
	const output: Record<string, unknown> = { ...target };

	for (const key in source) {
		const sourceValue = source[key];
		const targetValue = target[key];
		if (
			!Object.prototype.hasOwnProperty.call(target, key) ||
			(overwriteUndefinedProperties && targetValue === undefined)
		) {
			output[key] = sourceValue;
		}
	}

	return output as TTarget & TSource;
}
