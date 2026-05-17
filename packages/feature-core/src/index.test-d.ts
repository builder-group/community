import { assertType, describe, expectTypeOf, it } from 'vitest';
import { createFeatureHost, defineFeature, hasFeature, type TFeatureHost } from './index';

describe('feature-core types', () => {
	it('should preserve feature APIs and dependency constraints', () => {
		const counter = createCounter(0);
		const resetCounter = counter.with(resetFeature());
		const fullCounter = counter.with(resetFeature(), resetTwiceFeature(), loggerFeature());

		assertType<number>(counter.get());
		assertType<number>(fullCounter.log());
		expectTypeOf(resetCounter.reset).returns.toBeVoid();
		expectTypeOf(fullCounter.resetTwice).returns.toBeVoid();
		expectTypeOf(fullCounter._features).toEqualTypeOf<
			readonly ('reset' | 'resetTwice' | 'logger')[]
		>();

		// @ts-expect-error resetTwiceFeature requires resetFeature first.
		counter.with(resetTwiceFeature());

		// @ts-expect-error reset is not available before resetFeature is installed.
		counter.reset();

		// @ts-expect-error _features is visible but readonly.
		counter._features.push('reset');
	});

	it('should narrow a matching key capability with hasFeature', () => {
		const counter = createCounter(0).with(logFeature());
		const unknownCounter: unknown = counter;

		if (hasFeature<TLogFeature>(unknownCounter, 'log')) {
			assertType<number>(unknownCounter.log());
		}
	});

	it('should reject features with incompatible install hosts', () => {
		const counter = createCounter(0);

		// @ts-expect-error constrainedFeature requires a host with resetFeature installed.
		counter.with(constrainedFeature());
	});
});

function createCounter(initialValue: number): TCounter<[]> {
	let value = initialValue;
	const base: TCounterBase = {
		get() {
			return value;
		},
		set(nextValue) {
			value = nextValue;
		}
	};

	return createFeatureHost(base);
}

function resetFeature() {
	return defineFeature({
		key: 'reset',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			const initialValue = counter.get();

			return {
				reset() {
					counter.set(initialValue);
				}
			};
		}
	});
}

function resetTwiceFeature() {
	return defineFeature({
		key: 'resetTwice',
		requires: ['reset'] as const,
		install(counter: TCounter<[TResetFeature]>) {
			return {
				resetTwice() {
					counter.reset();
					counter.reset();
				}
			};
		}
	});
}

function loggerFeature() {
	return defineFeature({
		key: 'logger',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			return {
				log() {
					return counter.get();
				}
			};
		}
	});
}

function logFeature() {
	return defineFeature({
		key: 'log',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			return {
				log() {
					return counter.get();
				}
			};
		}
	});
}

function constrainedFeature() {
	return defineFeature({
		key: 'constrained',
		install(counter: TCounter<[TResetFeature]>) {
			return {
				constrained() {
					counter.reset();
				}
			};
		}
	});
}

interface TCounterBase {
	get: () => number;
	set: (nextValue: number) => void;
}

type TCounter<GFeatures extends TCounterFeature[]> = TFeatureHost<TCounterBase, GFeatures>;

type TCounterFeature =
	| TResetFeature
	| TResetTwiceFeature
	| TLoggerFeature
	| TLogFeature
	| TConstrainedFeature;

interface TResetFeature {
	key: 'reset';
	api: {
		reset: () => void;
	};
}

interface TResetTwiceFeature {
	key: 'resetTwice';
	api: {
		resetTwice: () => void;
	};
}

interface TLoggerFeature {
	key: 'logger';
	api: {
		log: () => number;
	};
}

interface TLogFeature {
	key: 'log';
	api: {
		log: () => number;
	};
}

interface TConstrainedFeature {
	key: 'constrained';
	api: {
		constrained: () => void;
	};
}
