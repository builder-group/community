import { TUnionToIntersection } from '@blgc/types/utils';

// ===================================================================
// Type-Map Approach
// ===================================================================

(() => {
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

	type TTest1 = TSelectFeatures<TFeatures, ['simple']>;
	const test1: TTest1 = null as any;
	test1.doSomething();

	type TTest2 = TSelectFeatures<TFeatures, [['single', string]]>;
	const test2: TTest2 = null as any;
	test2.withOne('test');

	type TTest3 = TSelectFeatures<TFeatures, [['double', string, number]]>;
	const test3: TTest3 = null as any;
	test3.withTwo('test', 123);

	type TTest4 = TSelectFeatures<TFeatures, [['triple', string, number, boolean]]>;
	const test4: TTest4 = null as any;
	test4.withThree('test', 123, true);

	type TTest5 = TSelectFeatures<
		TFeatures,
		['simple', ['single', string], ['double', string, number], ['triple', string, number, boolean]]
	>;
	const test5: TTest5 = null as any;
	test5.doSomething();
	test5.withOne('test');
	test5.withTwo('test', 123);
	test5.withThree('test', 123, true);

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

	function withSingle<GValue, GSelectedFeatureKeys extends TFeatureKeys>(
		test: TEnforceFeatureConstraint<
			TTest<GSelectedFeatureKeys>,
			TFeatures,
			GSelectedFeatureKeys,
			[]
		>,
		value: GValue
	): TTest<[['single', GValue], ...GSelectedFeatureKeys]> {
		return test;
	}

	const test6: TTest<['base']> = null as any;
	const test6WithSingle = withSingle(test6, 10);
	test6WithSingle.withOne(5);

	function withDouble<GValue1, GValue2, GSelectedFeatureKeys extends TFeatureKeys>(
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
})();

// ===================================================================
// Higher-Kinded Types Approach
// ===================================================================

// Overkill and not really fitting for this use case?

// ===================================================================
// Feature Composition Approach
// ===================================================================

(() => {
	type TFeatureTuple = [string, Record<string, any>];

	type TIntersectAll<GTypes extends any[]> = GTypes extends [
		infer GFirst,
		...infer GRest extends any[]
	]
		? GFirst & TIntersectAll<GRest>
		: {};

	type TFeatureNames<GFeatures extends TFeatureTuple[]> = GFeatures[number][0];
	type TFeatureAPIs<GFeatures extends TFeatureTuple[]> = {
		[K in keyof GFeatures]: GFeatures[K][1];
	};

	type TMergeFeatures<
		GBase extends Record<string, any>,
		GFeatures extends TFeatureTuple[]
	> = GBase & {
		_features: TFeatureNames<GFeatures>[];
	} & TIntersectAll<TFeatureAPIs<GFeatures>>;

	// Get features from a state type
	type TGetFeatures<GBase> = GBase extends { _features: (infer GFeature)[] }
		? GFeature extends string
			? GFeature
			: never
		: never;

	// Updated to work with both direct features and state types
	type TMissingFeatures<GBase, GRequired extends string[]> = GRequired extends []
		? never
		: GRequired[number] extends infer GReq
			? GReq extends string
				? GReq extends TGetFeatures<GBase>
					? never
					: GReq
				: never
			: never;

	// Updated has features check
	type THasFeatures<GBase, GRequired extends string[]> =
		TMissingFeatures<GBase, GRequired> extends never ? true : false;

	// Enforce feature constraint type
	type TEnforceFeatureConstraint<GSuccess, GBase, GRequired extends string[]> =
		TMissingFeatures<GBase, GRequired> extends never
			? GSuccess
			: {
					error: 'Missing required features';
					missing: TMissingFeatures<GBase, GRequired>;
				};

	// Example feature definitions
	type TSimpleFeature = [
		'simple',
		{
			doSomething: () => void;
		}
	];

	type TSingleFeature<GValue> = [
		'single',
		{
			withOne: (value: GValue) => void;
		}
	];

	type TDoubleFeature<GFirst, GSecond> = [
		'double',
		{
			withTwo: (first: GFirst, second: GSecond) => void;
		}
	];

	type TTripleFeature<GFirst, GSecond, GThird> = [
		'triple',
		{
			withThree: (first: GFirst, second: GSecond, third: GThird) => void;
		}
	];

	type TBase = {
		_features: string[];
		jeff: string;
	};

	type TTest1 = TMergeFeatures<TBase, [TSimpleFeature]>;
	const test1: TTest1 = null as any;
	test1.doSomething();

	type TTest2 = TMergeFeatures<TBase, [TSingleFeature<string>]>;
	const test2: TTest2 = null as any;
	test2.withOne('test');

	type TTest3 = TMergeFeatures<TBase, [TDoubleFeature<string, number>]>;
	const test3: TTest3 = null as any;
	test3.withTwo('test', 123);

	type TTest4 = TMergeFeatures<TBase, [TTripleFeature<string, number, boolean>]>;
	const test4: TTest4 = null as any;
	test4.withThree('test', 123, true);

	type TTest5 = TMergeFeatures<
		TBase,
		[
			TSimpleFeature,
			TSingleFeature<string>,
			TDoubleFeature<string, number>,
			TTripleFeature<string, number, boolean>
		]
	>;
	const test5: TTest5 = null as any;
	test5.doSomething();
	test5.withOne('test');
	test5.withTwo('test', 123);
	test5.withThree('test', 123, true);

	type TGetFeaturesTest = TGetFeatures<TTest5>;
	type TMissingFeaturesTest = TMissingFeatures<TTest5, ['simple', 'unknown', 'jeff']>;
	type THasFeaturesTest = THasFeatures<TTest5, ['simple']>;

	type TTest<GFeatures extends TFeatureTuple[]> = TMergeFeatures<
		{
			test: () => void;
		},
		GFeatures
	>;

	type TExtractTTestFeatures<GBase extends TTest<any>> =
		GBase extends TTest<infer GFeatures> ? GFeatures : never;

	function withSingle<GValue, GBase extends TTest<any>>(
		test: TEnforceFeatureConstraint<GBase, GBase, ['simple']>,
		value: GValue
	): TTest<[TSingleFeature<GValue>, ...TExtractTTestFeatures<GBase>]> {
		return test as any;
	}

	const test6: TTest<[TSimpleFeature]> = null as any;
	type TTemp = TExtractTTestFeatures<TTest<[TSimpleFeature]>>;
	test6.doSomething();
	const test6WithSingle = withSingle(test6, 10);
	test6WithSingle.doSomething();
})();
