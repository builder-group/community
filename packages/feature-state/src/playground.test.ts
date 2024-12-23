import { TUnionToIntersection } from '@blgc/types/utils';

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

type TFeatures<GValue> = {
	base: { _: null };
	simple: TSimpleFeature;
	single: TSingleGenericFeature<any>;
	double: TDoubleGenericFeature<any, any>;
	triple: TTripleGenericFeature<any, any, any>;
};

type TSelectFeatures<
	GValue,
	GFeatures extends (string | [string, ...unknown[]])[]
> = TUnionToIntersection<
	GFeatures[number] extends infer GFeature
		? GFeature extends string
			? GFeature extends keyof TFeatures<GValue>
				? TFeatures<GValue>[GFeature]
				: never
			: GFeature extends [infer GKey, ...infer GArgs]
				? GKey extends keyof TFeatures<GValue>
					? TFeatures<GValue>[GKey] extends TSingleGenericFeature<any>
						? TSingleGenericFeature<GArgs[0]>
						: TFeatures<GValue>[GKey] extends TDoubleGenericFeature<any, any>
							? TDoubleGenericFeature<GArgs[0], GArgs[1]>
							: TFeatures<GValue>[GKey] extends TTripleGenericFeature<any, any, any>
								? TTripleGenericFeature<GArgs[0], GArgs[1], GArgs[2]>
								: TFeatures<GValue>[GKey]
					: never
				: never
		: never
>;

// ===================================================================
// Type tests
// ===================================================================

type TTest1 = TSelectFeatures<number[], ['simple']>;
type TTest2 = TSelectFeatures<number[], [['single', string]]>;
type TTest3 = TSelectFeatures<number[], [['double', string, number]]>;
type TTest4 = TSelectFeatures<number[], [['triple', string, number, boolean]]>;
type TTest5 = TSelectFeatures<
	number[],
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
