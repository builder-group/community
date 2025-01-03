import {
	TEnforceFeatureConstraint,
	TFeatureAPIs,
	TFeatureDefinition,
	TFeatureSet,
	TGetFeatures,
	THasFeatures,
	TIntersectAll,
	TLooseFeatureNames,
	TMissingFeatures,
	TStrictFeatureNames,
	TWithFeatures
} from './index';

// Example feature definitions
type TSimpleFeature = {
	key: 'simple';
	api: {
		doSomething: () => void;
	};
};

type TSingleFeature<GValue> = {
	key: 'single';
	api: {
		withOne: (value: GValue) => void;
	};
};

type TDoubleFeature<GFirst, GSecond> = {
	key: 'double';
	api: {
		withTwo: (first: GFirst, second: GSecond) => void;
	};
};

type TTripleFeature<GFirst, GSecond, GThird> = {
	key: 'triple';
	api: {
		withThree: (first: GFirst, second: GSecond, third: GThird) => void;
	};
};

type TBase = {
	_features: string[];
	jeff: string;
};

type TTest1 = TWithFeatures<TBase, [TSimpleFeature]>;
const test1: TTest1 = null as any;
test1.doSomething();

type TTest2 = TWithFeatures<TBase, [TSingleFeature<string>]>;
const test2: TTest2 = null as any;
test2.withOne('test');

type TTest3 = TWithFeatures<TBase, [TDoubleFeature<string, number>]>;
const test3: TTest3 = null as any;
test3.withTwo('test', 123);

type TTest4 = TWithFeatures<TBase, [TTripleFeature<string, number, boolean>]>;
const test4: TTest4 = null as any;
test4.withThree('test', 123, true);

type TTest5 = TWithFeatures<
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

type TIntersectAllTest = TIntersectAll<[{ a: string }, { b: string }]>;
type TStrictFeatureNamesTest = TStrictFeatureNames<[TSimpleFeature, TSingleFeature<string>]>;
type TLooseFeatureNamesTest = TLooseFeatureNames<[TSimpleFeature, TSingleFeature<string>]>;
type TFeatureAPIsTest = TFeatureAPIs<[TSimpleFeature, TSingleFeature<string>]>;
type TFeatureSetTest = TFeatureSet<[TSimpleFeature, TSingleFeature<string>]>;
type TWithFeaturesTest = TWithFeatures<
	{ test: () => void },
	[TSimpleFeature, TSingleFeature<string>]
>;
type TGetFeaturesTest = TGetFeatures<TTest5>;
type TMissingFeaturesTest = TMissingFeatures<TTest5, ['simple', 'unknown', 'jeff']>;
type THasFeaturesTest = THasFeatures<TTest5, ['simple', 'unknown']>;
type TEnforceFeatureConstraintTest = TEnforceFeatureConstraint<
	{ success: true },
	TTest5,
	['simple', 'unknown', 'jeff']
>;

type TTest<GFeatures extends TFeatureDefinition[]> = TWithFeatures<
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

// Or if you just need the feature APIs
type TFeatureAPI = TFeatureSet<[TSimpleFeature]>;
