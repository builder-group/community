/**
 * Defines the structure of a feature with a unique key and its API interface
 * Used as the foundation for feature composition
 */
export type TFeatureDefinition = {
	key: string;
	api: Record<string, any>;
};

/**
 * Combines multiple types into a single intersection type
 * @example TIntersectAll<[A, B, C]> = A & B & C
 */
export type TIntersectAll<GFeatureSets extends any[]> = GFeatureSets extends [
	infer GFirst,
	...infer GRest extends any[]
]
	? GFirst & TIntersectAll<GRest>
	: {};

/**
 * Extracts feature keys from an array of feature definitions
 * Returns 'never' for empty arrays
 * @example TStrictFeatureNames<[{key: 'f1'}, {key: 'f2'}]> = 'f1' | 'f2'
 * @example TStrictFeatureNames<[]> = never
 */
export type TStrictFeatureNames<GFeatures extends TFeatureDefinition[]> = GFeatures[number]['key'];

/**
 * Extracts feature keys from an array of feature definitions
 * Returns 'string' for empty arrays
 * @example TLooseFeatureNames<[{key: 'f1'}, {key: 'f2'}]> = 'f1' | 'f2'
 * @example TLooseFeatureNames<[]> = string
 */
export type TLooseFeatureNames<GFeatures extends TFeatureDefinition[]> =
	TStrictFeatureNames<GFeatures> extends never ? string : TStrictFeatureNames<GFeatures>;

/**
 * Extracts all API types from feature definitions into a mapped type
 * @example TFeatureAPIs<[{api: {a: string}}, {api: {b: string}}] = [{a: string}, {b: string}]
 */
export type TFeatureAPIs<GFeatures extends TFeatureDefinition[]> = {
	[K in keyof GFeatures]: GFeatures[K]['api'];
};

/**
 * Core feature composition type that combines feature APIs and tracking
 * @example
 * type TSimpleFeature = { key: 'simple'; api: { a: string } }
 * type TNumberFeature = { key: 'number'; api: { b: string } }
 *
 * type TComposed = TFeatureSet<[TSimpleFeature, TNumberFeature]>
 * // Results in:
 * // {
 * //   _features: ('simple' | 'number')[];
 * //   a: string;
 * //   b: string;
 * // }
 */
export type TFeatureSet<GFeatures extends TFeatureDefinition[]> = {
	_features: TStrictFeatureNames<GFeatures>[];
} & TIntersectAll<TFeatureAPIs<GFeatures>>;

/**
 * Combines a base type with features
 * @example type MyState = TWithFeatures<BaseType, [TFeature1, TFeature2]>
 */
export type TWithFeatures<
	GBase extends Record<string, any>,
	GFeatures extends TFeatureDefinition[]
> = GBase & TFeatureSet<GFeatures>;

/**
 * Extracts feature keys from a state type that includes features
 * @example TGetFeatures<{ _features: ('f1' | 'f2')[] }> = 'f1' | 'f2'
 */
export type TGetFeatures<GFeatureSet extends TFeatureSet<any>> = GFeatureSet extends {
	_features: (infer GFeature)[];
}
	? GFeature extends string
		? GFeature
		: never
	: never;

/**
 * Identifies which required features are missing from a feature set type
 * Returns a union of missing feature keys
 * @example TMissingFeatures<FeatureSetWithF1, ['f1', 'f2']> = 'f2'
 */
export type TMissingFeatures<
	GFeatureSet extends TFeatureSet<any>,
	GRequired extends string[]
> = GRequired extends []
	? never
	: GRequired[number] extends infer GReq
		? GReq extends string
			? GReq extends TGetFeatures<GFeatureSet>
				? never
				: GReq
			: never
		: never;

/**
 * Type guard to check if a feature set type has all required features
 * @example THasFeatures<FeatureSetWithF1F2, ['f1', 'f2']> = true
 */
export type THasFeatures<GFeatureSet extends TFeatureSet<any>, GRequired extends string[]> =
	TMissingFeatures<GFeatureSet, GRequired> extends never ? true : false;

/**
 * Conditional type that enforces feature requirements
 * Returns either the success type or an error object with missing features
 * @example TEnforceFeatureConstraint<SuccessType, FeatureSet, ['f1']>
 */
export type TEnforceFeatureConstraint<
	GSuccess,
	GFeatureSet extends TFeatureSet<any>,
	GRequired extends string[]
> =
	TMissingFeatures<GFeatureSet, GRequired> extends never
		? GSuccess
		: {
				error: 'Missing required features';
				missing: TMissingFeatures<GFeatureSet, GRequired>;
			};
