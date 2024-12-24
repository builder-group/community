import { TUnionToIntersection } from '@blgc/types/utils';

type TFeatureKey<GFeatures extends Record<string, any>> =
	| keyof GFeatures
	| [keyof GFeatures, ...unknown[]];

// TODO: Figure out a way to pass generics to properties of an object without hard coding the types..
// https://www.reddit.com/r/typescript/comments/1hkwpp2/how_to_define_object_properties_with_generics_for/
type TSelectFeatures<
	GFeatures extends Record<string, any>,
	GFeatureKeys extends TFeatureKey<GFeatures>[]
> = TUnionToIntersection<
	GFeatureKeys[number] extends infer GFeature
		? GFeature extends string
			? GFeature extends keyof GFeatures
				? GFeatures[GFeature]
				: never
			: GFeature extends [infer GKey, ...infer GArgs]
				? GKey extends keyof GFeatures
					? GFeatures[GKey] extends TSingleGenericFeature<any>
						? TSingleGenericFeature<GArgs[0]>
						: GFeatures[GKey] extends TDoubleGenericFeature<any, any>
							? TDoubleGenericFeature<GArgs[0], GArgs[1]>
							: GFeatures[GKey] extends TTripleGenericFeature<any, any, any>
								? TTripleGenericFeature<GArgs[0], GArgs[1], GArgs[2]>
								: GFeatures[GKey]
					: never
				: never
		: never
>;

type TMissingFeatures<
	GFeatures extends Record<string, any>,
	GFeatureKeys extends TFeatureKey<GFeatures>[],
	GRequiredKeys extends (keyof GFeatures)[]
> = GRequiredKeys[number] extends infer K
	? K extends keyof GFeatures
		? Extract<GFeatureKeys[number], K | [K, ...unknown[]]> extends never
			? K
			: never
		: never
	: never;

type THasFeatures<
	GFeatures extends Record<string, any>,
	GFeatureKeys extends TFeatureKey<GFeatures>[],
	GRequiredKeys extends (keyof GFeatures)[]
> = TMissingFeatures<GFeatures, GFeatureKeys, GRequiredKeys> extends never ? true : false;

type TEnforceFeatureConstraint<
	GSuccess,
	GFeatures extends Record<string, any>,
	GFeatureKeys extends TFeatureKey<GFeatures>[],
	GRequiredKeys extends (keyof GFeatures)[]
> =
	TMissingFeatures<GFeatures, GFeatureKeys, GRequiredKeys> extends never
		? GSuccess
		: {
				error: `Missing required features`;
				missing: TMissingFeatures<GFeatures, GFeatureKeys, GRequiredKeys>;
			};

// ===================================================================
// Type tests
// ===================================================================

type TSimpleFeature = {
	doSomething: () => void;
};

type TSingleGenericFeature<T> = {
	withOne: (config: T) => void;
};

type TDoubleGenericFeature<T1, T2> = {
	withTwo: (config1: T1, config2: T2) => void;
};

type TTripleGenericFeature<T1, T2, T3> = {
	withThree: (config1: T1, config2: T2, config3: T3) => void;
};

type TFeatures = {
	base: { _features: keyof TFeatures[] };
	simple: TSimpleFeature;
	single: TSingleGenericFeature<any>;
	double: TDoubleGenericFeature<any, any>;
	triple: TTripleGenericFeature<any, any, any>;
	singleFunction: <T>() => TSingleGenericFeature<T>;
};

type TFeatureKeys = TFeatureKey<TFeatures>[];

// ===================================================================
// Test 1
// ===================================================================

type TTest1 = TSelectFeatures<TFeatures, ['simple']>;
type TTest2 = TSelectFeatures<TFeatures, [['single', string]]>;
type TTest3 = TSelectFeatures<TFeatures, [['double', string, number]]>;
type TTest4 = TSelectFeatures<TFeatures, [['triple', string, number, boolean]]>;
type TTest5 = TSelectFeatures<
	TFeatures,
	['simple', ['single', string], ['double', string, number], ['triple', string, number, boolean]]
>;

const test1: TTest1 = null as any;
test1.doSomething();

const test2: TTest2 = null as any;
test2.withOne('test');

const test3: TTest3 = null as any;
test3.withTwo('test', 123);

const test4: TTest4 = null as any;
test4.withThree('test', 123, true);

const test5: TTest5 = null as any;
test5.doSomething(); // SimpleFeature
test5.withOne('test'); // SingleGenericFeature<string>
test5.withTwo('test', 123); // DoubleGenericFeature<string, number>
test5.withThree('test', 123, true); // TripleGenericFeature<string, number, boolean>

// ===================================================================
// Test 2
// ===================================================================

type THasFeaturesTest = THasFeatures<
	TFeatures,
	['base', 'single', ['double', string]],
	['single', 'double', 'base']
>;
type TMissingFeaturesTest = TMissingFeatures<
	TFeatures,
	['single', ['double', string]],
	['single', 'double', 'base', 'triple']
>;

type TTest<GSelectedFeatureKeys extends TFeatureKeys = TFeatureKeys> = {
	test: () => void;
} & TSelectFeatures<TFeatures, GSelectedFeatureKeys>;

export function withSingle<GValue, GSelectedFeatureKeys extends TFeatureKeys>(
	test: TEnforceFeatureConstraint<TTest<GSelectedFeatureKeys>, TFeatures, GSelectedFeatureKeys, []>,
	value: GValue
): TTest<[['single', GValue], ...GSelectedFeatureKeys]> {
	return test;
}

const test6: TTest<['base']> = null as any;
const test6WithSingle = withSingle(test6, 10);
test6WithSingle.withOne(5);

export function withDouble<GValue1, GValue2, GSelectedFeatureKeys extends TFeatureKeys>(
	test: TEnforceFeatureConstraint<
		TTest<GSelectedFeatureKeys>,
		TFeatures,
		GSelectedFeatureKeys,
		['single']
	>,
	value1: GValue1,
	value2: GValue2
): TTest<[['double', GValue1, GValue2], ...GSelectedFeatureKeys]> {
	return test as TTest<[['double', GValue1, GValue2], ...GSelectedFeatureKeys]>;
}

const test6WithDouble = withDouble(test6WithSingle, 10, 20);
test6WithDouble.withTwo(5, 10);
