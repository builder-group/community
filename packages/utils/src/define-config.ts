import { shallowMerge } from './shallow-merge';

/**
 * Merges default configuration ('source') into the target configuration ('target') using shallowMerge.
 * The purpose is to populate the target configuration object with missing or undefined values.
 *
 * @param target - The target configuration object.
 * @param source - The default configuration object.
 * @param overwriteUndefinedProperties - Flag to overwrite 'undefined' properties in the target.
 * @returns A new object populated with both the target and source configurations.
 */
export function defineConfig<
	TTarget extends Record<string, any>,
	TSource extends Required<OptionalAttributes<TTarget>>
>(target: TTarget, source: TSource, overwriteUndefinedProperties = true): Required<TTarget> {
	return shallowMerge(target, source, overwriteUndefinedProperties) as Required<TTarget> & TSource;
}

export type OptionalAttributes<T> = {
	[K in keyof T as undefined extends T[K] ? K : never]: T[K];
};
